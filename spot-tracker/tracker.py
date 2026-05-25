#!/usr/bin/env python3
"""Small side tracker for spot-only Hyperliquid whale wallets."""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

API_URL = "https://api.hyperliquid.xyz/info"
DEFAULT_DB = Path("data/spot_tracker.db")
DEFAULT_WATCHLIST = Path("watchlist.json")
DEFAULT_REPORT = Path("data/latest_spot_report.md")


def api_post(payload: dict[str, Any], retries: int = 4) -> Any:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(API_URL, data=data, headers={"content-type": "application/json"})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                return json.load(response)
        except urllib.error.HTTPError as exc:
            if exc.code != 429 or attempt == retries - 1:
                raise
            time.sleep(2 ** attempt)
    raise RuntimeError("unreachable retry state")


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def load_watchlist(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as handle:
        entries = json.load(handle)
    for entry in entries:
        entry["address"] = entry["address"].lower()
    return entries


def load_spot_metadata() -> tuple[dict[int, str], dict[int, str], dict[str, str], dict[str, float]]:
    """Return token and market lookup maps from Hyperliquid spot metadata."""
    meta = api_post({"type": "spotMeta"})
    mids = api_post({"type": "allMids"})
    token_symbols: dict[int, str] = {}
    token_usdc_markets: dict[int, str] = {}
    market_base_symbols: dict[str, str] = {}
    marks: dict[str, float] = {}

    for token in meta.get("tokens", []):
        token_symbols[int(token["index"])] = token["name"]

    for market in meta.get("universe", []):
        tokens = market.get("tokens") or []
        name = market.get("name")
        if len(tokens) >= 2 and name:
            base_token, quote_token = int(tokens[0]), int(tokens[1])
            base_symbol = token_symbols.get(base_token, name)
            market_base_symbols[name] = base_symbol
            if quote_token == 0 and base_token not in token_usdc_markets:
                token_usdc_markets[base_token] = name

    for key, value in mids.items():
        try:
            marks[key] = float(value)
        except (TypeError, ValueError):
            continue
    return token_symbols, token_usdc_markets, market_base_symbols, marks


def add_column_if_missing(conn: sqlite3.Connection, table: str, column: str, definition: str) -> None:
    columns = {row["name"] for row in conn.execute(f"PRAGMA table_info({table})")}
    if column not in columns:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def ensure_db(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS wallet_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            snapshot_at TEXT NOT NULL,
            address TEXT NOT NULL,
            label TEXT,
            account_value REAL,
            total_perp_notional REAL,
            perp_positions INTEGER,
            open_orders INTEGER
        );

        CREATE TABLE IF NOT EXISTS spot_balances (
            snapshot_id INTEGER NOT NULL,
            address TEXT NOT NULL,
            coin TEXT NOT NULL,
            token INTEGER,
            total REAL,
            hold REAL,
            entry_ntl REAL,
            avg_entry REAL,
            mark_px REAL,
            current_value REAL,
            upnl_usd REAL,
            upnl_pct REAL,
            usdc_market TEXT,
            PRIMARY KEY (snapshot_id, coin),
            FOREIGN KEY (snapshot_id) REFERENCES wallet_snapshots(id)
        );

        CREATE TABLE IF NOT EXISTS fill_summaries (
            snapshot_id INTEGER NOT NULL,
            address TEXT NOT NULL,
            coin TEXT NOT NULL,
            base_coin TEXT,
            fills INTEGER,
            buy_sz REAL,
            buy_ntl REAL,
            avg_buy REAL,
            sell_sz REAL,
            sell_ntl REAL,
            avg_sell REAL,
            crossed_fills INTEGER,
            first_fill_at TEXT,
            last_fill_at TEXT,
            PRIMARY KEY (snapshot_id, coin),
            FOREIGN KEY (snapshot_id) REFERENCES wallet_snapshots(id)
        );
        """
    )
    add_column_if_missing(conn, "spot_balances", "mark_px", "REAL")
    add_column_if_missing(conn, "spot_balances", "current_value", "REAL")
    add_column_if_missing(conn, "spot_balances", "upnl_usd", "REAL")
    add_column_if_missing(conn, "spot_balances", "upnl_pct", "REAL")
    add_column_if_missing(conn, "spot_balances", "usdc_market", "TEXT")
    add_column_if_missing(conn, "fill_summaries", "base_coin", "TEXT")
    return conn


def summarize_fills(
    fills: list[dict[str, Any]], market_base_symbols: dict[str, str] | None = None
) -> dict[str, dict[str, Any]]:
    market_base_symbols = market_base_symbols or {}
    summary: dict[str, dict[str, Any]] = defaultdict(
        lambda: {
            "base_coin": None,
            "fills": 0,
            "buy_sz": 0.0,
            "buy_ntl": 0.0,
            "sell_sz": 0.0,
            "sell_ntl": 0.0,
            "crossed_fills": 0,
            "first": None,
            "last": None,
        }
    )
    for fill in fills:
        coin = fill.get("coin", "UNKNOWN")
        px = float(fill.get("px") or 0)
        sz = float(fill.get("sz") or 0)
        side = fill.get("side")
        timestamp = int(fill.get("time") or 0)
        item = summary[coin]
        item["base_coin"] = market_base_symbols.get(coin, coin)
        item["fills"] += 1
        if fill.get("crossed"):
            item["crossed_fills"] += 1
        if timestamp:
            item["first"] = timestamp if item["first"] is None else min(item["first"], timestamp)
            item["last"] = timestamp if item["last"] is None else max(item["last"], timestamp)
        if side == "B":
            item["buy_sz"] += sz
            item["buy_ntl"] += px * sz
        elif side == "A":
            item["sell_sz"] += sz
            item["sell_ntl"] += px * sz
    return summary


def iso_from_ms(ms: int | None) -> str | None:
    if not ms:
        return None
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).isoformat(timespec="seconds")


def money(value: float) -> str:
    sign = "-" if value < 0 else ""
    value = abs(value)
    if value >= 1_000_000:
        return f"{sign}${value / 1_000_000:.2f}M"
    if value >= 1_000:
        return f"{sign}${value / 1_000:.1f}K"
    return f"{sign}${value:.2f}"


def latest_previous_balance(conn: sqlite3.Connection, address: str, coin: str) -> sqlite3.Row | None:
    return conn.execute(
        """
        SELECT sb.*
        FROM spot_balances sb
        JOIN wallet_snapshots ws ON ws.id = sb.snapshot_id
        WHERE lower(sb.address)=lower(?) AND sb.coin=?
        ORDER BY ws.snapshot_at DESC, ws.id DESC
        LIMIT 1
        """,
        (address, coin),
    ).fetchone()


def store_snapshot(
    conn: sqlite3.Connection,
    snapshot_at: str,
    entry: dict[str, Any],
    spot: dict[str, Any],
    perp: dict[str, Any],
    orders: list[dict[str, Any]],
    fills: list[dict[str, Any]],
    token_usdc_markets: dict[int, str],
    market_base_symbols: dict[str, str],
    marks: dict[str, float],
) -> int:
    address = entry["address"].lower()
    margin = perp.get("marginSummary", {})
    cur = conn.execute(
        """
        INSERT INTO wallet_snapshots (
            snapshot_at, address, label, account_value, total_perp_notional, perp_positions, open_orders
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            snapshot_at,
            address,
            entry.get("label"),
            float(margin.get("accountValue") or 0),
            float(margin.get("totalNtlPos") or 0),
            len(perp.get("assetPositions", [])),
            len(orders),
        ),
    )
    snapshot_id = int(cur.lastrowid)

    for balance in spot.get("balances", []):
        total = float(balance.get("total") or 0)
        entry_ntl = float(balance.get("entryNtl") or 0)
        hold = float(balance.get("hold") or 0)
        if not total and not entry_ntl and not hold:
            continue
        avg_entry = entry_ntl / total if total else 0
        token = int(balance.get("token") or 0)
        coin = balance.get("coin")
        usdc_market = token_usdc_markets.get(token)
        mark_px = marks.get(coin) or (marks.get(usdc_market) if usdc_market else None)
        current_value = total * mark_px if mark_px is not None else None
        upnl_usd = current_value - entry_ntl if current_value is not None and entry_ntl else None
        upnl_pct = (upnl_usd / entry_ntl * 100) if upnl_usd is not None and entry_ntl else None
        conn.execute(
            """
            INSERT INTO spot_balances (
                snapshot_id, address, coin, token, total, hold, entry_ntl, avg_entry,
                mark_px, current_value, upnl_usd, upnl_pct, usdc_market
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                snapshot_id,
                address,
                coin,
                token,
                total,
                hold,
                entry_ntl,
                avg_entry,
                mark_px,
                current_value,
                upnl_usd,
                upnl_pct,
                usdc_market,
            ),
        )

    for coin, item in summarize_fills(fills, market_base_symbols).items():
        avg_buy = item["buy_ntl"] / item["buy_sz"] if item["buy_sz"] else 0
        avg_sell = item["sell_ntl"] / item["sell_sz"] if item["sell_sz"] else 0
        conn.execute(
            """
            INSERT INTO fill_summaries (
                snapshot_id, address, coin, base_coin, fills, buy_sz, buy_ntl, avg_buy,
                sell_sz, sell_ntl, avg_sell, crossed_fills, first_fill_at, last_fill_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                snapshot_id,
                address,
                coin,
                item["base_coin"],
                item["fills"],
                item["buy_sz"],
                item["buy_ntl"],
                avg_buy,
                item["sell_sz"],
                item["sell_ntl"],
                avg_sell,
                item["crossed_fills"],
                iso_from_ms(item["first"]),
                iso_from_ms(item["last"]),
            ),
        )
    return snapshot_id


def fetch_wallet(entry: dict[str, Any], fill_limit: int) -> dict[str, Any]:
    address = entry["address"]
    spot = api_post({"type": "spotClearinghouseState", "user": address})
    perp = api_post({"type": "clearinghouseState", "user": address})
    orders = api_post({"type": "frontendOpenOrders", "user": address})
    fills = api_post({"type": "userFills", "user": address})
    if fill_limit > 0:
        fills = fills[:fill_limit]
    return {"spot": spot, "perp": perp, "orders": orders, "fills": fills}


def pct(value: float | None) -> str:
    if value is None:
        return "n/a"
    return f"{value:+.2f}%"


def print_wallet_report(conn: sqlite3.Connection, snapshot_id: int, entry: dict[str, Any]) -> None:
    address = entry["address"]
    snap = conn.execute("SELECT * FROM wallet_snapshots WHERE id=?", (snapshot_id,)).fetchone()
    balances = conn.execute(
        "SELECT * FROM spot_balances WHERE snapshot_id=? ORDER BY entry_ntl DESC, total DESC",
        (snapshot_id,),
    ).fetchall()
    fills = conn.execute(
        "SELECT * FROM fill_summaries WHERE snapshot_id=? ORDER BY buy_ntl DESC, sell_ntl DESC",
        (snapshot_id,),
    ).fetchall()

    print(f"\n{entry.get('label') or address}")
    print(f"  address: {address}")
    print(
        "  perps: "
        f"{snap['perp_positions']} positions, {snap['open_orders']} open orders, "
        f"{money(float(snap['total_perp_notional'] or 0))} notional"
    )
    print("  spot balances:")
    for balance in balances:
        previous = latest_previous_balance(conn, address, balance["coin"])
        delta = None
        if previous and previous["snapshot_id"] != snapshot_id:
            delta = float(balance["total"] or 0) - float(previous["total"] or 0)
        delta_text = ""
        if delta is not None and abs(delta) > 0.000001:
            delta_text = f" | delta {delta:+,.6f}"
        value_text = ""
        if balance["current_value"] is not None:
            value_text = (
                f" | value {money(float(balance['current_value'] or 0))}"
                f" | uPnL {money(float(balance['upnl_usd'] or 0))} ({pct(balance['upnl_pct'])})"
            )
        print(
            f"    {balance['coin']}: {float(balance['total']):,.6f} "
            f"| entry {money(float(balance['entry_ntl'] or 0))} "
            f"| avg {float(balance['avg_entry'] or 0):.4f}{value_text}{delta_text}"
        )
    if fills:
        print("  recent fills:")
        for fill in fills[:5]:
            label = fill["base_coin"] or fill["coin"]
            print(
                f"    {label} ({fill['coin']}): buys {float(fill['buy_sz']):,.4f} / {money(float(fill['buy_ntl'] or 0))} "
                f"avg {float(fill['avg_buy'] or 0):.4f}; sells {float(fill['sell_sz']):,.4f} / "
                f"{money(float(fill['sell_ntl'] or 0))}; fills {fill['fills']}"
            )


def write_markdown_report(conn: sqlite3.Connection, snapshot_ids: list[int], report_path: Path) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    lines = ["# Spot Whale Tracker Report", ""]
    generated_at = utc_now_iso()
    lines.append(f"Generated: `{generated_at}`")
    lines.append("")

    notable_changes: list[str] = []
    for snapshot_id in snapshot_ids:
        snap = conn.execute("SELECT * FROM wallet_snapshots WHERE id=?", (snapshot_id,)).fetchone()
        balances = conn.execute(
            "SELECT * FROM spot_balances WHERE snapshot_id=? ORDER BY current_value DESC, entry_ntl DESC",
            (snapshot_id,),
        ).fetchall()
        fills = conn.execute(
            "SELECT * FROM fill_summaries WHERE snapshot_id=? ORDER BY buy_ntl DESC, sell_ntl DESC",
            (snapshot_id,),
        ).fetchall()
        title = snap["label"] or snap["address"]
        lines.extend([f"## {title}", "", f"`{snap['address']}`", ""])
        lines.append(
            f"- Perps: {snap['perp_positions']} positions, {snap['open_orders']} open orders, "
            f"{money(float(snap['total_perp_notional'] or 0))} notional"
        )
        for balance in balances:
            previous = latest_previous_balance(conn, snap["address"], balance["coin"])
            delta_text = ""
            if previous and previous["snapshot_id"] != snapshot_id:
                delta = float(balance["total"] or 0) - float(previous["total"] or 0)
                if abs(delta) > 0.000001:
                    delta_text = f", delta `{delta:+,.6f}`"
                    if abs(float(balance["mark_px"] or 0) * delta) >= 500_000:
                        notable_changes.append(
                            f"- `{snap['address'][:8]}...`: {balance['coin']} changed `{delta:+,.4f}` "
                            f"(~{money(abs(float(balance['mark_px'] or 0) * delta))})"
                        )
            value = money(float(balance["current_value"] or 0)) if balance["current_value"] is not None else "n/a"
            upnl = money(float(balance["upnl_usd"] or 0)) if balance["upnl_usd"] is not None else "n/a"
            lines.append(
                f"- {balance['coin']}: `{float(balance['total']):,.6f}`; value `{value}`; "
                f"entry `{money(float(balance['entry_ntl'] or 0))}`; avg `{float(balance['avg_entry'] or 0):.4f}`; "
                f"uPnL `{upnl}` ({pct(balance['upnl_pct'])}){delta_text}"
            )
        if fills:
            lines.append("")
            lines.append("Recent fill summary:")
            for fill in fills[:5]:
                label = fill["base_coin"] or fill["coin"]
                lines.append(
                    f"- {label} (`{fill['coin']}`): buys `{float(fill['buy_sz']):,.4f}` / "
                    f"`{money(float(fill['buy_ntl'] or 0))}` avg `{float(fill['avg_buy'] or 0):.4f}`; "
                    f"sells `{float(fill['sell_sz']):,.4f}` / `{money(float(fill['sell_ntl'] or 0))}`; "
                    f"fills `{fill['fills']}`"
                )
        lines.append("")

    if notable_changes:
        lines.insert(4, "## Notable Changes")
        lines.insert(5, "")
        for offset, item in enumerate(notable_changes, start=6):
            lines.insert(offset, item)
        lines.insert(6 + len(notable_changes), "")

    report_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def run_once(args: argparse.Namespace) -> int:
    watchlist = load_watchlist(args.watchlist)
    conn = ensure_db(args.db)
    token_symbols, token_usdc_markets, market_base_symbols, marks = load_spot_metadata()
    snapshot_at = utc_now_iso()
    print(f"Spot tracker snapshot: {snapshot_at}")
    print(f"Wallets: {len(watchlist)}")
    snapshot_ids: list[int] = []
    for entry in watchlist:
        try:
            data = fetch_wallet(entry, args.fill_limit)
            snapshot_id = store_snapshot(
                conn,
                snapshot_at,
                entry,
                data["spot"],
                data["perp"],
                data["orders"],
                data["fills"],
                token_usdc_markets,
                market_base_symbols,
                marks,
            )
            snapshot_ids.append(snapshot_id)
            conn.commit()
            print_wallet_report(conn, snapshot_id, entry)
            time.sleep(args.sleep)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, sqlite3.Error) as exc:
            print(f"ERROR {entry['address']}: {exc}", file=sys.stderr)
    if args.report:
        write_markdown_report(conn, snapshot_ids, args.report)
        print(f"\nReport written: {args.report}")
    conn.close()
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Track spot-only Hyperliquid whale wallets.")
    parser.add_argument("--once", action="store_true", help="Run one snapshot pass.")
    parser.add_argument("--watchlist", type=Path, default=DEFAULT_WATCHLIST)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--fill-limit", type=int, default=2000)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--sleep", type=float, default=0.25, help="Seconds to sleep between wallets.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.once:
        print("Only --once mode is implemented for this side tracker.")
        return 2
    return run_once(args)


if __name__ == "__main__":
    raise SystemExit(main())
