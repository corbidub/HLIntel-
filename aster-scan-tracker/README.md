# AsterScan Side Tracker

Experimental watcher for AsterScan public data. This is intentionally separate from the live HL Intel Telegram alert loop while we test whether Aster DEX wallet flow is worth productizing.

## What It Watches

- AsterScan top open positions from `https://aster-scan.com/api/positions`
- AsterScan leaderboards from `https://aster-scan.com/api/leaders`
- A seed watchlist of Aster wallets that looked useful in the first pass

Aster uses privacy mode, so this is visible/indexed flow only. Treat it as a scout feed, not a full-chain truth source.

## Quick Run

```bash
cd aster-scan-tracker
python3 tracker.py --once
```

The first run seeds a local SQLite database at `data/aster_scan_tracker.db` and prints a report. Later runs compare against the previous run and call out position adds, trims, flips, and watchlist activity.

## Useful Commands

```bash
# Pull more pages and lower the threshold for early signals.
python3 tracker.py --once --pages 25 --min-position-usd 50000

# Print a shorter report.
python3 tracker.py --once --top 8

# Use a custom watchlist.
python3 tracker.py --once --watchlist watchlist.json
```

## Current Seed Watchlist

- `0xdd6a...c065` — largest visible open exposure in the first pass.
- `0xccdb...8293` — clean BTC short, useful for BTCUSDT monitoring.
- `0xe5f5...87ba` — multi-short stress basket.
- `0x534e...0c7` — active multi-position short-biased wallet.
- `0xb443...4ae` — high activity and volume wallet with HYPE/SOL/LINK exposure.

## Promote Criteria

Only consider wiring this into HL Intel alerts if it produces at least one of these over a few days:

- Repeated large visible position changes before narrative moves.
- Watchlist wallets that map cleanly to profitable or high-signal behavior.
- Cross-venue context for HL Intel posts, especially HYPE, BTC, ETH, SOL, ZEC, and ASTER.
- A public content angle that is not already covered by better on-chain accounts.
