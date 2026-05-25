import asyncio
import logging

import config
from hyperliquid.client import get_leaderboard, get_funding_and_oi, fetch_all_positions
from data.database import init_db, save_leaderboard, save_funding, get_watch_wallets
from engine.scanner import (
    check_whale_positions,
    check_whale_confluence,
    check_liquidation_risk,
    check_funding_spikes,
    check_oi_surges,
    parse_positions,
)
from engine.digest import maybe_send_weekly_digest
from engine.scanner import safe_send

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logging.getLogger("httpx").setLevel(logging.WARNING)
log = logging.getLogger(__name__)


def manual_watch_rows(top50_addresses: set[str]) -> list[dict]:
    rows = []
    for wallet in get_watch_wallets():
        address = wallet["address"]
        if address in top50_addresses:
            continue
        rows.append({
            "ethAddress": address,
            "rank": wallet["name"] or wallet["label"].replace("_", " ").title(),
            "accountValue": 0,
            "windowPerformances": {"day": {"pnl": 0}, "week": {"pnl": 0}},
        })
    return rows


def apply_watch_account_values(watch_rows: list[dict], raw_positions: dict) -> None:
    for row in watch_rows:
        state = raw_positions.get(row["ethAddress"], {})
        margin = state.get("marginSummary", {})
        try:
            row["accountValue"] = float(margin.get("accountValue", 0) or 0)
        except (TypeError, ValueError):
            row["accountValue"] = 0


async def run_cycle(seed_mode: bool = False) -> None:
    label = "seed" if seed_mode else "scan"
    log.info(f"Starting {label} cycle...")
    try:
        leaderboard, assets = await asyncio.gather(
            get_leaderboard(top_n=50),
            get_funding_and_oi(),
        )
        save_leaderboard(leaderboard)
        save_funding(assets)

        await check_funding_spikes(assets, seed_mode)
        await check_oi_surges(assets, seed_mode)

        top50_addresses = [row["ethAddress"] for row in leaderboard[:50]]
        watch_rows = manual_watch_rows(set(top50_addresses))
        watch_addresses = [row["ethAddress"] for row in watch_rows]
        tracked_addresses = top50_addresses + watch_addresses
        if watch_addresses:
            log.info("Tracking %s manual watch wallets outside top 50.", len(watch_addresses))

        raw_positions = await fetch_all_positions(tracked_addresses)
        apply_watch_account_values(watch_rows, raw_positions)
        positions_by_address = {
            addr: parse_positions(state) for addr, state in raw_positions.items()
        }

        alert_leaderboard = leaderboard[:50] + watch_rows

        await check_whale_positions(alert_leaderboard, assets, positions_by_address, seed_mode)
        await check_whale_confluence(leaderboard, assets, seed_mode)
        await check_liquidation_risk(alert_leaderboard, assets, positions_by_address, seed_mode)

        if not seed_mode:
            await maybe_send_weekly_digest()

        log.info(f"{label.capitalize()} cycle complete.")
    except Exception as e:
        log.error(f"Cycle error: {e}", exc_info=True)


async def main() -> None:
    init_db()
    log.info("HL Intel bot started — running seed cycle (no alerts).")

    await run_cycle(seed_mode=True)
    log.info("Seed complete. Alerts now active.")
    if config.SEND_STARTUP_MESSAGE:
        await safe_send(
            "🚀 <b>HL Intel is live.</b>\n\n"
            "Tracking human smart money on Hyperliquid. "
            "Algo noise filtered. Only conviction trades.\n\n"
            "<i>Not financial advice. Data only.</i>"
        )

    while True:
        await asyncio.sleep(config.SCAN_INTERVAL_SECONDS)
        await run_cycle(seed_mode=False)


if __name__ == "__main__":
    asyncio.run(main())
