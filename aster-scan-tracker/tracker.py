#!/usr/bin/env python3
"""Lightweight AsterScan side tracker.

This script reads public AsterScan endpoints, stores local snapshots, and prints
an operator-friendly report. It is deliberately standalone so we can evaluate
Aster DEX signal quality before adding it to the live HL Intel alert system.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
import time
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


BASE_URL = "https://aster-scan.com/api"
DEFAULT_DB_PATH = Path(__file__).parent / "data" / "aster_scan_tracker.db"
DEFAULT_WATCHLIST_PATH = Path(__file__).parent / "watchlist.json"
USER_AGENT = "HLIntelAsterSideTracker/0.1"


@dataclass(frozen=True)
class WatchWallet:
    address: str
    label: str
    notes: str


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def money(value: float, digits: int = 1) -> str:
    sign = "-" if value < 0 else ""
    value = abs(value)
    if value >= 1_000_000:
        return f"{sign}${value / 1_000_000:.{digits}f}M"
    if value >= 1_000:
        return f"{sign}${value / 1_000:.{digits}f}K"
    return f"{sign}${value:.0f}"


def short_addr(address: str) -> str:
    return f"{address[:6]}...{address[-4:]}"


def fetch_json(path: str, params: dict[str, Any] | None = None, retries: int = 3) -> Any:
    query = f"?{urlencode(params)}" if params else ""
    url = f"{BASE_URL}{path}{query}"
    last_error: Exception | None = None

    for attempt in range(1, retries + 1):
        try:
            req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
            with urlopen(req, timeout=20) as response:
                return json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            last_error = exc
            if attempt == retries:
                break
            time.sleep(0.8 * attempt)

    raise RuntimeError(f"failed to fetch {url}: {last_error}")


def init_db(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(db_path) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS snapshot_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source TEXT NOT NULL,
                created_at TEXT NOT NULL,
                params_json TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS position_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id INTEGER NOT NULL,
                wallet TEXT NOT NULL,
                symbol TEXT NOT NULL,
                side TEXT NOT NULL,
                position_amount REAL NOT NULL,
                notional_usd REAL NOT NULL,
                unrealized_pnl REAL NOT NULL,
                updated_at TEXT,
                raw_json TEXT NOT NULL,
                FOREIGN KEY(run_id) REFERENCES snapshot_runs(id)
            );

            CREATE TABLE IF NOT EXISTS leader_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id INTEGER NOT NULL,
                metric TEXT NOT NULL,
                wallet TEXT NOT NULL,
                rank INTEGER NOT NULL,
                pnl_usd REAL,
                exposure_usd REAL,
                total_notional_usd REAL,
                order_count INTEGER,
                positions INTEGER,
                top_symbol TEXT,
                raw_json TEXT NOT NULL,
                FOREIGN KEY(run_id) REFERENCES snapshot_runs(id)
            );

            CREATE INDEX IF NOT EXISTS idx_aster_positions_run_wallet
                ON position_snapshots(run_id, wallet);
            CREATE INDEX IF NOT EXISTS idx_aster_positions_wallet_symbol_side
                ON position_snapshots(wallet, symbol, side, run_id DESC);
            CREATE INDEX IF NOT EXISTS idx_aster_leaders_run_metric
                ON leader_snapshots(run_id, metric, rank);
            """
        )


def create_run(conn: sqlite3.Connection, params: dict[str, Any]) -> int:
    cur = conn.execute(
        "INSERT INTO snapshot_runs (source, created_at, params_json) VALUES (?, ?, ?)",
        ("asterscan", utc_now(), json.dumps(params, sort_keys=True)),
    )
    return int(cur.lastrowid)


def latest_previous_run_id(conn: sqlite3.Connection, current_run_id: int) -> int | None:
    row = conn.execute(
        """
        SELECT id FROM snapshot_runs
        WHERE source = 'asterscan' AND id < ?
        ORDER BY id DESC
        LIMIT 1
        """,
        (current_run_id,),
    ).fetchone()
    return int(row[0]) if row else None


def load_watchlist(path: Path) -> list[WatchWallet]:
    if not path.exists():
        return []
    data = json.loads(path.read_text())
    wallets = []
    for item in data:
        wallets.append(
            WatchWallet(
                address=item["address"].lower(),
                label=item.get("label", "watch wallet"),
                notes=item.get("notes", ""),
            )
        )
    return wallets


def fetch_positions(pages: int, min_usd: float) -> list[dict[str, Any]]:
    positions: list[dict[str, Any]] = []
    for page in range(1, pages + 1):
        payload = fetch_json(
            "/positions",
            {"page": page, "limit": 50, "minUsd": int(min_usd)},
        )
        rows = payload.get("data", [])
        positions.extend(rows)
        if page >= int(payload.get("totalPages", page)):
            break
    return positions


def fetch_leaders(limit: int) -> dict[str, list[dict[str, Any]]]:
    leaders: dict[str, list[dict[str, Any]]] = {}
    for metric in ("pnl", "volume", "activity"):
        payload = fetch_json("/leaders", {"metric": metric, "limit": limit})
        leaders[metric] = payload.get("top", [])
    return leaders


def save_positions(conn: sqlite3.Connection, run_id: int, rows: list[dict[str, Any]]) -> None:
    for row in rows:
        conn.execute(
            """
            INSERT INTO position_snapshots
            (run_id, wallet, symbol, side, position_amount, notional_usd, unrealized_pnl, updated_at, raw_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                run_id,
                row["wallet"].lower(),
                row["symbol"],
                row["side"],
                float(row.get("position_amount") or 0),
                float(row.get("notional_value") or 0),
                float(row.get("unrealized_pnl") or 0),
                row.get("updated_at"),
                json.dumps(row, sort_keys=True),
            ),
        )


def save_leaders(conn: sqlite3.Connection, run_id: int, leaders: dict[str, list[dict[str, Any]]]) -> None:
    for metric, rows in leaders.items():
        for rank, row in enumerate(rows, start=1):
            conn.execute(
                """
                INSERT INTO leader_snapshots
                (run_id, metric, wallet, rank, pnl_usd, exposure_usd, total_notional_usd,
                 order_count, positions, top_symbol, raw_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    run_id,
                    metric,
                    row["wallet"].lower(),
                    rank,
                    row.get("pnl"),
                    row.get("exposure"),
                    row.get("total_notional"),
                    row.get("order_count"),
                    row.get("positions"),
                    row.get("top_symbol"),
                    json.dumps(row, sort_keys=True),
                ),
            )


def rows_by_position(rows: list[sqlite3.Row]) -> dict[tuple[str, str, str], sqlite3.Row]:
    return {(row["wallet"], row["symbol"], row["side"]): row for row in rows}


def get_run_positions(conn: sqlite3.Connection, run_id: int) -> list[sqlite3.Row]:
    conn.row_factory = sqlite3.Row
    return conn.execute(
        """
        SELECT wallet, symbol, side, position_amount, notional_usd, unrealized_pnl, updated_at
        FROM position_snapshots
        WHERE run_id = ?
        """,
        (run_id,),
    ).fetchall()


def aggregate_wallets(rows: list[sqlite3.Row]) -> list[dict[str, Any]]:
    by_wallet: dict[str, dict[str, Any]] = {}
    for row in rows:
        wallet = row["wallet"]
        record = by_wallet.setdefault(
            wallet,
            {
                "wallet": wallet,
                "notional": 0.0,
                "pnl": 0.0,
                "positions": 0,
                "longs": 0,
                "shorts": 0,
                "symbols": Counter(),
            },
        )
        notional = float(row["notional_usd"])
        record["notional"] += notional
        record["pnl"] += float(row["unrealized_pnl"])
        record["positions"] += 1
        record["longs"] += row["side"] == "LONG"
        record["shorts"] += row["side"] == "SHORT"
        record["symbols"][row["symbol"]] += notional
    return sorted(by_wallet.values(), key=lambda item: item["notional"], reverse=True)


def aggregate_symbols(rows: list[sqlite3.Row]) -> list[dict[str, Any]]:
    by_symbol: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"symbol": "", "long": 0.0, "short": 0.0, "pnl": 0.0, "wallets": set()}
    )
    for row in rows:
        symbol = row["symbol"]
        record = by_symbol[symbol]
        record["symbol"] = symbol
        record["wallets"].add(row["wallet"])
        record["pnl"] += float(row["unrealized_pnl"])
        if row["side"] == "LONG":
            record["long"] += float(row["notional_usd"])
        else:
            record["short"] += float(row["notional_usd"])

    output = []
    for record in by_symbol.values():
        output.append(
            {
                "symbol": record["symbol"],
                "long": record["long"],
                "short": record["short"],
                "pnl": record["pnl"],
                "wallets": len(record["wallets"]),
                "total": record["long"] + record["short"],
            }
        )
    return sorted(output, key=lambda item: item["total"], reverse=True)


def position_deltas(
    current_rows: list[sqlite3.Row],
    previous_rows: list[sqlite3.Row],
    min_delta_usd: float,
) -> list[dict[str, Any]]:
    current = rows_by_position(current_rows)
    previous = rows_by_position(previous_rows)
    deltas = []

    for key, row in current.items():
        prev = previous.get(key)
        current_notional = float(row["notional_usd"])
        previous_notional = float(prev["notional_usd"]) if prev else 0.0
        delta = current_notional - previous_notional
        if abs(delta) < min_delta_usd and prev is not None:
            continue
        if prev is None and current_notional < min_delta_usd:
            continue
        deltas.append(
            {
                "kind": "new" if prev is None else ("add" if delta > 0 else "trim"),
                "wallet": row["wallet"],
                "symbol": row["symbol"],
                "side": row["side"],
                "notional": current_notional,
                "delta": delta,
                "pnl": float(row["unrealized_pnl"]),
            }
        )

    for key, row in previous.items():
        if key in current:
            continue
        previous_notional = float(row["notional_usd"])
        if previous_notional < min_delta_usd:
            continue
        deltas.append(
            {
                "kind": "closed",
                "wallet": row["wallet"],
                "symbol": row["symbol"],
                "side": row["side"],
                "notional": 0.0,
                "delta": -previous_notional,
                "pnl": 0.0,
            }
        )

    return sorted(deltas, key=lambda item: abs(item["delta"]), reverse=True)


def render_report(
    run_id: int,
    current_rows: list[sqlite3.Row],
    previous_rows: list[sqlite3.Row],
    watchlist: list[WatchWallet],
    top: int,
    min_delta_usd: float,
) -> str:
    total_long = sum(float(row["notional_usd"]) for row in current_rows if row["side"] == "LONG")
    total_short = sum(float(row["notional_usd"]) for row in current_rows if row["side"] == "SHORT")
    total_pnl = sum(float(row["unrealized_pnl"]) for row in current_rows)
    wallet_totals = aggregate_wallets(current_rows)
    symbol_totals = aggregate_symbols(current_rows)
    deltas = position_deltas(current_rows, previous_rows, min_delta_usd)
    watch_by_address = {wallet.address: wallet for wallet in watchlist}

    lines = [
        "ASTER SCAN SIDE TRACKER",
        f"Run #{run_id} | {utc_now()}",
        "",
        f"Visible tracked open interest: {money(total_long + total_short)} "
        f"({money(total_long)} long / {money(total_short)} short), PnL {money(total_pnl)}",
        f"Rows: {len(current_rows)} positions | Wallets: {len(wallet_totals)}",
        "",
        "Top wallets by visible exposure:",
    ]

    for item in wallet_totals[:top]:
        symbols = ", ".join(
            f"{symbol.replace('USDT', '')} {money(notional, 1)}"
            for symbol, notional in item["symbols"].most_common(4)
        )
        label = f" ({watch_by_address[item['wallet']].label})" if item["wallet"] in watch_by_address else ""
        lines.append(
            f"- {short_addr(item['wallet'])}{label}: {money(item['notional'])} exposure, "
            f"PnL {money(item['pnl'])}, {item['positions']} pos L/S {item['longs']}/{item['shorts']} | {symbols}"
        )

    lines.extend(["", "Top symbols by visible exposure:"])
    for item in symbol_totals[:top]:
        lines.append(
            f"- {item['symbol'].replace('USDT', '')}: {money(item['total'])} "
            f"({money(item['long'])} long / {money(item['short'])} short), "
            f"{item['wallets']} wallets, PnL {money(item['pnl'])}"
        )

    lines.extend(["", "Watchlist activity:"])
    any_watch = False
    current_by_wallet = defaultdict(list)
    for row in current_rows:
        current_by_wallet[row["wallet"]].append(row)
    for wallet in watchlist:
        rows = current_by_wallet.get(wallet.address, [])
        if not rows:
            continue
        any_watch = True
        total = sum(float(row["notional_usd"]) for row in rows)
        pnl = sum(float(row["unrealized_pnl"]) for row in rows)
        parts = [
            f"{row['symbol'].replace('USDT', '')} {row['side']} {money(float(row['notional_usd']))}"
            for row in sorted(rows, key=lambda row: float(row["notional_usd"]), reverse=True)[:5]
        ]
        lines.append(
            f"- {short_addr(wallet.address)} ({wallet.label}): {money(total)} exposure, "
            f"PnL {money(pnl)} | " + "; ".join(parts)
        )
    if not any_watch:
        lines.append("- No seed watchlist wallets in the current visible position set.")

    lines.extend(["", "Largest changes vs prior run:"])
    if previous_rows:
        if deltas:
            for item in deltas[:top]:
                lines.append(
                    f"- {item['kind'].upper()} {short_addr(item['wallet'])} "
                    f"{item['symbol'].replace('USDT', '')} {item['side']}: "
                    f"{money(item['delta'])} delta, now {money(item['notional'])}, PnL {money(item['pnl'])}"
                )
        else:
            lines.append(f"- No changes over {money(min_delta_usd)}.")
    else:
        lines.append("- No prior run found; this run seeds the comparison baseline.")

    return "\n".join(lines)


def run_once(args: argparse.Namespace) -> str:
    init_db(args.db)
    watchlist = load_watchlist(args.watchlist)
    params = {
        "pages": args.pages,
        "min_position_usd": args.min_position_usd,
        "leader_limit": args.leader_limit,
    }
    position_rows = fetch_positions(args.pages, args.min_position_usd)
    leaders = fetch_leaders(args.leader_limit)

    with sqlite3.connect(args.db) as conn:
        conn.row_factory = sqlite3.Row
        run_id = create_run(conn, params)
        save_positions(conn, run_id, position_rows)
        save_leaders(conn, run_id, leaders)
        previous_run_id = latest_previous_run_id(conn, run_id)
        current = get_run_positions(conn, run_id)
        previous = get_run_positions(conn, previous_run_id) if previous_run_id else []

    return render_report(run_id, current, previous, watchlist, args.top, args.min_delta_usd)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Track public AsterScan wallet flow.")
    parser.add_argument("--once", action="store_true", help="Run once and print a report.")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB_PATH, help="SQLite output path.")
    parser.add_argument("--watchlist", type=Path, default=DEFAULT_WATCHLIST_PATH, help="Watchlist JSON path.")
    parser.add_argument("--pages", type=int, default=25, help="Number of /positions pages to fetch.")
    parser.add_argument("--min-position-usd", type=float, default=50_000, help="Minimum position size to fetch.")
    parser.add_argument("--min-delta-usd", type=float, default=100_000, help="Minimum change to report.")
    parser.add_argument("--leader-limit", type=int, default=50, help="Leaderboard rows per metric to store.")
    parser.add_argument("--top", type=int, default=12, help="Rows to print in each report section.")
    args = parser.parse_args()
    if not args.once:
        parser.error("only --once mode is implemented for this experimental side tracker")
    return args


def main() -> int:
    try:
        report = run_once(parse_args())
    except Exception as exc:
        print(f"tracker failed: {exc}", file=sys.stderr)
        return 1
    print(report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
