#!/usr/bin/env python3
"""Use HyperLens top-wallet tables as candidates for spot/perp hedge scans."""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
import urllib.request
from collections import defaultdict
from pathlib import Path
from typing import Any

from hedge_scan import classify, fetch_wallet_state
from tracker import load_spot_metadata, money, utc_now_iso

DEFAULT_REPORT = Path("data/latest_hyperlens_hedge_scan.md")
DEFAULT_CSV = Path("data/latest_hyperlens_hedge_scan.csv")
HYPERLENS_STATS_URL = "https://hyperlens.io/api/v1/global/stats"
ADDRESS_RE = re.compile(r"^0x[a-fA-F0-9]{40}$")


def fetch_hyperlens_stats(timeframe: str) -> dict[str, Any]:
    payload = {"timeframes": [timeframe], "summary_types": ["daily_stats"]}
    request = urllib.request.Request(
        HYPERLENS_STATS_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "content-type": "application/json",
            "origin": "https://hyperlens.io",
            "referer": "https://hyperlens.io/",
            "user-agent": "Mozilla/5.0",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def add_address(sources: dict[str, set[str]], address: Any, source: str) -> None:
    if address and ADDRESS_RE.match(str(address)):
        sources[str(address).lower()].add(source)


def load_hyperlens_candidates(timeframes: list[str]) -> dict[str, set[str]]:
    sources: dict[str, set[str]] = defaultdict(set)
    individual_groups = [
        "biggest_liquidations",
        "biggest_individual_wins",
        "biggest_individual_losses",
    ]
    for timeframe in timeframes:
        data = fetch_hyperlens_stats(timeframe)
        for group, rows in data.get("top_traders", {}).items():
            for row in rows:
                add_address(sources, row[0] if row else None, f"{timeframe}:{group}")
        for group in individual_groups:
            for row in data.get(group, []):
                if isinstance(row, list) and row and isinstance(row[0], list):
                    add_address(sources, row[0][0] if row[0] else None, f"{timeframe}:{group}")
                elif isinstance(row, list):
                    add_address(sources, row[0] if row else None, f"{timeframe}:{group}")
    return sources


def scan(args: argparse.Namespace) -> list[dict[str, Any]]:
    candidate_sources = load_hyperlens_candidates(args.timeframes)
    addresses = list(candidate_sources.keys())[: args.max_wallets]
    print(f"HyperLens candidates: {len(candidate_sources)}; scanning: {len(addresses)}", flush=True)

    _, token_usdc_markets, _, marks = load_spot_metadata()
    findings: list[dict[str, Any]] = []
    args.fetch_errors = 0
    args.candidate_count = len(candidate_sources)
    args.scanned_wallets = len(addresses)

    for idx, address in enumerate(addresses, start=1):
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
            long_notional = float(perp["long_notional"])
            short_notional = float(perp["short_notional"])
            if max(long_notional, short_notional) < args.min_perp_usd:
                continue
            label, ratio = classify(spot["value"], long_notional, short_notional)
            findings.append(
                {
                    "address": address,
                    "coin": spot["coin"],
                    "spot_value": spot["value"],
                    "spot_qty": spot["total"],
                    "spot_upnl": spot["upnl"],
                    "spot_upnl_pct": spot["upnl_pct"],
                    "perp_long": long_notional,
                    "perp_short": short_notional,
                    "perp_long_upnl": float(perp["long_upnl"]),
                    "perp_short_upnl": float(perp["short_upnl"]),
                    "classification": label,
                    "ratio": ratio,
                    "sources": "; ".join(sorted(candidate_sources[address])[:8]),
                    "source_count": len(candidate_sources[address]),
                }
            )

        if idx % 10 == 0:
            print(f"scanned {idx}/{len(addresses)}", flush=True)
        time.sleep(args.sleep)

    findings.sort(
        key=lambda item: (
            item["classification"] != "spot_long_perp_short_hedge",
            -max(item["perp_short"], item["perp_long"]),
            -item["spot_value"],
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

    hedges = [item for item in findings if item["classification"] == "spot_long_perp_short_hedge"]
    amplified = [item for item in findings if item["classification"] == "spot_long_perp_long_amplified"]
    lines = [
        "# HyperLens Spot/Perp Hedge Scan",
        "",
        f"Generated: `{utc_now_iso()}`",
        f"HyperLens candidates: `{getattr(args, 'candidate_count', 0)}` from `{', '.join(args.timeframes)}` home stats tables",
        f"Wallets scanned: `{getattr(args, 'scanned_wallets', 0)}`",
        f"Findings with spot and same-coin perp above thresholds: `{len(findings)}`",
        f"Fetch errors: `{getattr(args, 'fetch_errors', 0)}`",
        f"Minimum spot value: `{money(args.min_spot_usd)}`",
        f"Minimum perp leg: `{money(args.min_perp_usd)}`",
        "",
        "## Hedge Candidates",
        "",
    ]
    if not hedges:
        lines.append("No spot-long/perp-short hedge candidates found from this HyperLens candidate set.")
    for item in hedges[: args.top]:
        lines.append(
            f"- `{item['address']}` {item['coin']}: spot `{money(item['spot_value'])}` "
            f"vs perp short `{money(item['perp_short'])}`; hedge ratio `{item['ratio']:.2f}x`; "
            f"spot uPnL `{money(item['spot_upnl'])}` ({item['spot_upnl_pct']:+.2f}%). "
            f"Sources: {item['sources']}."
        )

    lines.extend(["", "## Same-Direction Spot + Perp", ""])
    if not amplified:
        lines.append("No spot-long/perp-long amplification candidates found from this HyperLens candidate set.")
    for item in amplified[: args.top]:
        lines.append(
            f"- `{item['address']}` {item['coin']}: spot `{money(item['spot_value'])}` "
            f"plus perp long `{money(item['perp_long'])}`; perp/spot ratio `{item['ratio']:.2f}x`; "
            f"spot uPnL `{money(item['spot_upnl'])}` ({item['spot_upnl_pct']:+.2f}%). "
            f"Sources: {item['sources']}."
        )

    args.report.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scan HyperLens top wallets for spot/perp hedge patterns.")
    parser.add_argument("--timeframes", nargs="+", default=["1h", "4h", "12h", "24h"])
    parser.add_argument("--max-wallets", type=int, default=150)
    parser.add_argument("--min-spot-usd", type=float, default=50_000)
    parser.add_argument("--min-perp-usd", type=float, default=50_000)
    parser.add_argument("--top", type=int, default=25)
    parser.add_argument("--sleep", type=float, default=0.15)
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
