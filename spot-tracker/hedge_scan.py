#!/usr/bin/env python3
"""Scan tracked perp wallets for spot bags hedged with perps."""

from __future__ import annotations

import argparse
import csv
import sqlite3
import sys
import time
from pathlib import Path
from typing import Any

from tracker import api_post, load_spot_metadata, money, utc_now_iso

DEFAULT_HL_DB = Path("/Users/corbinpaulson/hl-intel/hl_intel.db")
DEFAULT_REPORT = Path("data/latest_hedge_scan.md")
DEFAULT_CSV = Path("data/latest_hedge_scan.csv")


def load_latest_perp_books(
    db_path: Path, min_perp_usd: float, max_wallets: int
) -> dict[str, dict[str, dict[str, float]]]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        """
        WITH max_ts AS (
            SELECT MAX(snapshot_at) AS ts FROM position_snapshots
        ),
        latest_keys AS (
            SELECT address, coin, side, MAX(julianday(snapshot_at)) AS snap_jd
            FROM position_snapshots, max_ts
            WHERE julianday(snapshot_at) >= julianday(max_ts.ts) - (45.0 / 1440.0)
            GROUP BY address, coin, side
        ),
        latest AS (
            SELECT ps.address, ps.coin, ps.side, ps.notional_usd, ps.unrealized_pnl, ps.snapshot_at
            FROM position_snapshots ps
            JOIN latest_keys lk
              ON lower(ps.address)=lower(lk.address)
             AND ps.coin=lk.coin
             AND ps.side=lk.side
             AND ABS(julianday(ps.snapshot_at) - lk.snap_jd) < 0.0000001
        ),
        ranked_wallets AS (
            SELECT address, SUM(notional_usd) AS total_notional
            FROM latest
            GROUP BY address
            HAVING total_notional >= ?
            ORDER BY total_notional DESC
            LIMIT ?
        )
        SELECT latest.*
        FROM latest
        JOIN ranked_wallets USING(address)
        WHERE latest.notional_usd >= ?
        ORDER BY ranked_wallets.total_notional DESC, latest.notional_usd DESC
        """,
        (min_perp_usd, max_wallets, min_perp_usd),
    ).fetchall()
    conn.close()

    books: dict[str, dict[str, dict[str, float]]] = {}
    for row in rows:
        address = row["address"].lower()
        coin = row["coin"]
        side = row["side"].lower()
        books.setdefault(address, {}).setdefault(
            coin,
            {"long_notional": 0.0, "short_notional": 0.0, "long_upnl": 0.0, "short_upnl": 0.0},
        )
        if side == "long":
            books[address][coin]["long_notional"] += float(row["notional_usd"] or 0)
            books[address][coin]["long_upnl"] += float(row["unrealized_pnl"] or 0)
        elif side == "short":
            books[address][coin]["short_notional"] += float(row["notional_usd"] or 0)
            books[address][coin]["short_upnl"] += float(row["unrealized_pnl"] or 0)
    return books


def fetch_wallet_state(
    address: str,
    token_usdc_markets: dict[int, str],
    marks: dict[str, float],
    min_spot_usd: float,
) -> tuple[list[dict[str, Any]], dict[str, dict[str, float]]]:
    spot = api_post({"type": "spotClearinghouseState", "user": address})
    perp = api_post({"type": "clearinghouseState", "user": address})
    values: list[dict[str, Any]] = []
    for balance in spot.get("balances", []):
        coin = balance.get("coin")
        token = int(balance.get("token") or 0)
        total = float(balance.get("total") or 0)
        entry_ntl = float(balance.get("entryNtl") or 0)
        if total <= 0:
            continue
        market = token_usdc_markets.get(token)
        mark = marks.get(coin) or (marks.get(market) if market else None)
        if mark is None:
            continue
        value = total * mark
        if value < min_spot_usd:
            continue
        avg_entry = entry_ntl / total if total else 0
        values.append(
            {
                "coin": coin,
                "token": token,
                "total": total,
                "entry_ntl": entry_ntl,
                "avg_entry": avg_entry,
                "mark": mark,
                "value": value,
                "upnl": value - entry_ntl if entry_ntl else 0.0,
                "upnl_pct": ((value - entry_ntl) / entry_ntl * 100) if entry_ntl else 0.0,
            }
        )

    perp_book: dict[str, dict[str, float]] = {}
    for asset in perp.get("assetPositions", []):
        position = asset.get("position", {})
        coin = position.get("coin")
        if not coin:
            continue
        szi = float(position.get("szi") or 0)
        notional = float(position.get("positionValue") or 0)
        upnl = float(position.get("unrealizedPnl") or 0)
        item = perp_book.setdefault(
            coin,
            {"long_notional": 0.0, "short_notional": 0.0, "long_upnl": 0.0, "short_upnl": 0.0},
        )
        if szi > 0:
            item["long_notional"] += notional
            item["long_upnl"] += upnl
        elif szi < 0:
            item["short_notional"] += notional
            item["short_upnl"] += upnl
    return values, perp_book


def classify(spot_value: float, long_notional: float, short_notional: float) -> tuple[str, float]:
    if short_notional > 0:
        return "spot_long_perp_short_hedge", short_notional / spot_value
    if long_notional > 0:
        return "spot_long_perp_long_amplified", long_notional / spot_value
    return "spot_only", 0.0


def scan(args: argparse.Namespace) -> list[dict[str, Any]]:
    _, token_usdc_markets, _, marks = load_spot_metadata()
    candidate_books = load_latest_perp_books(args.hl_db, args.min_perp_usd, args.max_wallets)
    args.scanned_wallets = len(candidate_books)
    args.fetch_errors = 0
    findings: list[dict[str, Any]] = []
    print(f"candidate wallets: {len(candidate_books)}", flush=True)

    for idx, address in enumerate(candidate_books, start=1):
        try:
            spots, book = fetch_wallet_state(address, token_usdc_markets, marks, args.min_spot_usd)
        except Exception as exc:
            args.fetch_errors += 1
            print(f"ERROR {address}: {exc}", file=sys.stderr)
            continue
        for spot in spots:
            perp = book.get(
                spot["coin"],
                {"long_notional": 0.0, "short_notional": 0.0, "long_upnl": 0.0, "short_upnl": 0.0},
            )
            label, hedge_ratio = classify(
                spot["value"], float(perp["long_notional"]), float(perp["short_notional"])
            )
            if label == "spot_only" and not args.include_spot_only:
                continue
            findings.append(
                {
                    "address": address,
                    "coin": spot["coin"],
                    "spot_qty": spot["total"],
                    "spot_value": spot["value"],
                    "spot_entry": spot["entry_ntl"],
                    "spot_avg_entry": spot["avg_entry"],
                    "spot_upnl": spot["upnl"],
                    "spot_upnl_pct": spot["upnl_pct"],
                    "perp_long": float(perp["long_notional"]),
                    "perp_short": float(perp["short_notional"]),
                    "perp_long_upnl": float(perp["long_upnl"]),
                    "perp_short_upnl": float(perp["short_upnl"]),
                    "classification": label,
                    "hedge_ratio": hedge_ratio,
                }
            )
        if idx % 10 == 0:
            print(f"scanned {idx}/{len(candidate_books)} wallets...", flush=True)
        time.sleep(args.sleep)

    findings.sort(
        key=lambda item: (
            item["classification"] != "spot_long_perp_short_hedge",
            -item["spot_value"],
            -max(item["perp_short"], item["perp_long"]),
        )
    )
    return findings


def write_outputs(findings: list[dict[str, Any]], args: argparse.Namespace) -> None:
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.csv.parent.mkdir(parents=True, exist_ok=True)

    with args.csv.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(findings[0].keys()) if findings else ["address"])
        writer.writeheader()
        writer.writerows(findings)

    lines = [
        "# Spot/Perp Hedge Scan",
        "",
        f"Generated: `{utc_now_iso()}`",
        f"Wallets scanned: `{getattr(args, 'scanned_wallets', args.max_wallets)}` from latest tracked perp book",
        f"Fetch errors: `{getattr(args, 'fetch_errors', 0)}`",
        f"Minimum spot value: `{money(args.min_spot_usd)}`",
        f"Minimum perp leg: `{money(args.min_perp_usd)}`",
        "",
    ]
    hedges = [item for item in findings if item["classification"] == "spot_long_perp_short_hedge"]
    amplified = [item for item in findings if item["classification"] == "spot_long_perp_long_amplified"]
    spot_only = [item for item in findings if item["classification"] == "spot_only"]

    lines.extend(["## Hedge Candidates", ""])
    if not hedges:
        lines.append("No spot-long/perp-short hedge candidates found at this threshold.")
    for item in hedges[: args.top]:
        lines.append(
            f"- `{item['address']}` {item['coin']}: spot `{money(item['spot_value'])}` "
            f"vs perp short `{money(item['perp_short'])}`; hedge ratio `{item['hedge_ratio']:.2f}x`; "
            f"spot uPnL `{money(item['spot_upnl'])}` ({item['spot_upnl_pct']:+.2f}%)."
        )

    lines.extend(["", "## Same-Direction Spot + Perp", ""])
    if not amplified:
        lines.append("No spot-long/perp-long amplification candidates found at this threshold.")
    for item in amplified[: args.top]:
        lines.append(
            f"- `{item['address']}` {item['coin']}: spot `{money(item['spot_value'])}` "
            f"plus perp long `{money(item['perp_long'])}`; perp/spot ratio `{item['hedge_ratio']:.2f}x`."
        )

    if args.include_spot_only:
        lines.extend(["", "## Spot-Only Candidates", ""])
        for item in spot_only[: args.top]:
            lines.append(f"- `{item['address']}` {item['coin']}: spot `{money(item['spot_value'])}`.")

    args.report.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Find spot bags hedged or amplified with perps.")
    parser.add_argument("--hl-db", type=Path, default=DEFAULT_HL_DB)
    parser.add_argument("--max-wallets", type=int, default=50)
    parser.add_argument("--min-spot-usd", type=float, default=100_000)
    parser.add_argument("--min-perp-usd", type=float, default=100_000)
    parser.add_argument("--include-spot-only", action="store_true")
    parser.add_argument("--top", type=int, default=20)
    parser.add_argument("--sleep", type=float, default=0.5)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    findings = scan(args)
    write_outputs(findings, args)
    print(f"findings: {len(findings)}")
    print(f"report: {args.report}")
    print(f"csv: {args.csv}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
