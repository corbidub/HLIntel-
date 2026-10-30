"""Read-only HL Intel <> Fluke wallet research bridge; no trading or Fluke API."""
import argparse
import json
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

WALLET = re.compile(r"^0x[a-fA-F0-9]{40}$")
RISK_STATES = {"cooling_off", "implosion_watch", "self_imploding"}


def load_registry(path):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(data, dict) or not isinstance(data.get("markets"), list):
        raise ValueError("registry requires a markets array")
    if len(data["markets"]) > 500:
        raise ValueError("maximum 500 manually identified markets")
    seen = set()
    markets = []
    for row in data["markets"]:
        if not isinstance(row, dict):
            raise ValueError("market entries must be objects")
        address, market_id = row.get("wallet_address"), row.get("market_id")
        if not isinstance(address, str) or not WALLET.fullmatch(address):
            raise ValueError("full 0x + 40-hex wallet_address required")
        if not isinstance(market_id, str) or not 1 <= len(market_id) <= 128:
            raise ValueError("nonempty market_id <= 128 characters required")
        if market_id in seen:
            raise ValueError("duplicate market_id")
        seen.add(market_id)
        markets.append({"wallet_address": address.lower(), "market_id": market_id})
    return markets


def read_snapshots(db_path, addresses):
    path = Path(db_path).expanduser().resolve()
    if not path.is_file():
        raise FileNotFoundError(f"HL Intel DB missing: {path}")
    uri = "file:" + quote(str(path), safe="/") + "?mode=ro"
    db = sqlite3.connect(uri, uri=True)
    db.row_factory = sqlite3.Row
    try:
        if not addresses:
            return {}
        addresses = sorted(set(addresses))
        params = ",".join("?" for _ in addresses)
        query = f"""
        SELECT address, account_value, exposure_total, open_upnl,
               open_positions, book_leverage, state, snapshot_at
        FROM (
          SELECT address, account_value, exposure_total, open_upnl,
                 open_positions, book_leverage, state, snapshot_at,
                 ROW_NUMBER() OVER (PARTITION BY lower(address)
                   ORDER BY datetime(snapshot_at) DESC, id DESC) AS rn
          FROM wallet_performance_snapshots
          WHERE lower(address) IN ({params})
        ) WHERE rn = 1
        """
        return {r["address"].lower(): dict(r) for r in db.execute(query, addresses)}
    finally:
        db.close()


def timestamp(value):
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.replace(tzinfo=parsed.tzinfo or timezone.utc).astimezone(timezone.utc)
    except (TypeError, ValueError, AttributeError):
        return None


def report(markets, snapshots, now, max_age_min=30):
    if now.tzinfo is None or max_age_min <= 0:
        raise ValueError("now must be timezone-aware and max age positive")
    now = now.astimezone(timezone.utc)
    rows = []
    for market in markets:
        wallet = market["wallet_address"]
        snap = snapshots.get(wallet)
        row = {**market, "status": "missing_hl_snapshot",
               "risk_flags": ["no_current_data"], "hl_observation": None}
        if snap:
            ts = timestamp(snap["snapshot_at"])
            age = (now - ts).total_seconds()/60 if ts else None
            flags = []
            if age is None or age < 0 or age > max_age_min:
                flags.append("stale_or_invalid_timestamp")
            state = str(snap["state"] or "unknown").lower()
            if state in RISK_STATES:
                flags.append("wallet_health_" + state)
            leverage = float(snap["book_leverage"])
            if leverage >= 5:
                flags.append("high_book_leverage")
            if float(snap["open_upnl"]) < 0:
                flags.append("negative_open_upnl")
            if float(snap["account_value"]) <= 0:
                flags.append("nonpositive_account_value")
            row["status"] = ("stale" if "stale_or_invalid_timestamp" in flags
                             else "risk_watch" if flags else "research_only")
            row["risk_flags"] = flags
            row["hl_observation"] = {
                "snapshot_at_utc": ts.isoformat() if ts else None,
                "age_minutes": round(age, 2) if age is not None else None,
                "state": state,
                "account_value_usd": float(snap["account_value"]),
                "exposure_usd": float(snap["exposure_total"]),
                "open_upnl_usd": float(snap["open_upnl"]),
                "open_positions": int(snap["open_positions"]),
                "book_leverage": leverage,
            }
        rows.append(row)
    return {
        "schema": "hl-intel/fluke-research/1",
        "generated_at_utc": now.isoformat(),
        "execution_enabled": False,
        "fluke_prices_included": False,
        "fluke_market_mapping_verified": False,
        "warning": "HL account value is NOT Fluke's deposit-neutral whale-performance index.",
        "markets": rows,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", required=True, type=Path)
    parser.add_argument("--registry", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--max-age-minutes", type=int, default=30)
    args = parser.parse_args()
    markets = load_registry(args.registry)
    snaps = read_snapshots(args.db, [r["wallet_address"] for r in markets])
    data = report(markets, snaps, datetime.now(timezone.utc), args.max_age_minutes)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print("research-only markets:", len(markets))


if __name__ == "__main__":
    main()
