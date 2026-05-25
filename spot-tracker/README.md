# Spot Whale Side Tracker

Experimental watcher for spot-only Hyperliquid wallets. This stays separate from the live perp alert loop while we test whether large spot accumulators add useful context for HL Intel posts and Pro research.

## What It Watches

- Hyperliquid spot balances for seed wallets.
- Recent spot fills, summarized by token.
- Whether the same wallet has live perp positions or open orders.
- Snapshot-to-snapshot changes in spot holdings.
- Live mark value, rough spot uPnL, and fill market labels.
- A markdown report at `data/latest_spot_report.md`.

This is for context, not trade calls. A spot whale can be useful even when it has no liquidation path: adds, trims, transfers, or later perp hedges can all become content or Pro digest items.

## Quick Run

```bash
cd spot-tracker
python3 tracker.py --once
```

The first run creates `data/spot_tracker.db`, stores the current wallet state, and prints a report. Later runs compare against the previous snapshot.

## Useful Commands

```bash
# Use a custom watchlist.
python3 tracker.py --once --watchlist watchlist.json

# Print more recent fill rows in the per-wallet report.
python3 tracker.py --once --fill-limit 4000

# Store data somewhere else.
python3 tracker.py --once --db data/spot_tracker.db

# Scan tracked perp wallets for spot bags hedged or amplified with perps.
python3 hedge_scan.py --max-wallets 50 --min-spot-usd 50000 --min-perp-usd 50000 --include-spot-only

# Use HyperLens top trader tables as candidate wallets, then scan live spot/perp state.
python3 hyperlens_hedge_scan.py
```

## Current Output

The console report is meant for quick checks. The markdown report is better for daily review and copy/paste into research notes:

```bash
cat data/latest_spot_report.md
```

The tracker currently flags large snapshot deltas in the markdown report when a watched spot balance changes by roughly `$500K+` at current marks.

The hedge scanner writes `data/latest_hedge_scan.md` and `data/latest_hedge_scan.csv`. It uses the main HL Intel perp database for candidate discovery, then checks live Hyperliquid spot and perp state so hedge ratios reflect the current book.

The HyperLens hedge scanner writes `data/latest_hyperlens_hedge_scan.md` and `data/latest_hyperlens_hedge_scan.csv`. It pulls candidates from HyperLens top trader, top volume, top PnL, and individual win/loss/liquidation tables across 1H, 4H, 12H, and 24H.

## Current Seed Watchlist

- `0x9137bd9347f07990a8ce22869f8b93d190479c5a` — EyeOnChain/Lookonchain-spotted spot whale. Current read: ~228.8K HYPE accumulated, no perp position, prior public ASTER liquidity/accumulation history.

## Promote Criteria

Only wire spot alerts into the main HL Intel system if this side tracker produces at least one of these:

- Repeated spot adds/trims above $1M in HYPE or high-interest alts.
- A spot wallet later opens perps, hedges, or starts distributing.
- A wallet has public history that makes its current spot behavior more meaningful.
- Spot flow explains a market narrative that the perp book alone misses.

## Expansion Backlog

1. Add Telegram-ready spot alerts for `$1M+` adds/trims on watched wallets.
2. Promote spot-to-perp hedge detection from side scan to alert logic after a few days of review.
3. Add a candidate intake file for wallets sourced from EyeOnChain, Lookonchain, HyperLens, and manual HL scans.
4. Add token filters so the public/content lane can focus on HYPE, ZEC, ETH, BTC, SOL, FARTCOIN, ASTER, and other active narratives.
5. Add a daily digest section: top spot adds, top trims, new spot whales, and wallets crossing into perp activity.
