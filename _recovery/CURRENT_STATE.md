# HL Intel Current State

Last updated: 2026-05-25 21:16 CDT

## Project

HL Intel is a Telegram-first Hyperliquid perp wallet intelligence product.

The current sellable wedge is:
- Filtered Telegram alerts.
- Ranked-wallet context.
- Whale adds, trims, flips, hedges, and liquidation stress.
- Weekly digest.
- No dashboard required for the first sellable version.
- No trade automation.
- Data product only, not financial advice.

## Workspace

- Local workspace: `/Users/corbinpaulson/Documents/HL INTEL Workspace`
- Source recovery repo: `/Users/corbinpaulson/Documents/New project/hl-intel-site`
- Git branch: `codex/hl-intel-workspace`
- Recovery base commit: `99817c3 Recover HL Intel workspace`
- Remote: `git@github.com:corbidub/HLIntel-.git`
- Local landing page preview: `http://localhost:4173`

## What Is Working

- Clean HL Intel worktree exists outside the crowded recovery folder.
- Landing page serves locally from the new workspace.
- Scanner Python compile check passes.
- Aster tracker Python compile check passes.
- Spot tracker Python compile check passes.
- The recovered May 23 chat backup is present at `launch/hl-intel-chat-backup-2026-05-23.md`.
- Hyperdash `very_profitable` cohort intake works through `launch/fetch-hyperdash-cohort.mjs`.
- Latest Hyperdash snapshot fetched 875 unique wallets into `launch/hyperdash-very_profitable-wallets.csv`.
- Hyperdash noteworthy-wallet review works through `launch/review-hyperdash-noteworthy-wallets.mjs`.
- Latest noteworthy review covered 155 wallets and identified 13 `pilot_candidate` wallets plus 45 `secondary_crypto_watch` wallets.
- The 13 Hyperdash pilot candidates have a manual promotion review at `launch/hyperdash-pilot-candidate-review.md`.
- The local paid-pilot watchlist contains 12 Hyperdash wallets through `launch/pilot-watchlist.local.json`: 4 core promoted wallets plus 8 secondary dig wallets.
- `launch/monitor-viable-wallets.mjs` can now monitor locally configured wallets and falls back to the Hyperdash snapshot if Hypercopy rejects a promoted address.
- Latest monitor run captured 12 wallets, 3 high-priority changes, 3 low-priority uPnL changes, and 4 paid-pilot alert events after token/watchlist suppression.
- Notable latest changes include `0xaede390f5b5b7cf77428030ccfc73d99a44e1602` reopening HYPE long, `0x12f5f5ce07647f5e7bf9ea054ea119d1cbb85a9b` reopening HYPE long, and `0xaa2a33c424b92cdc042e40c522cb48e586e83026` worsening on HYPE short PnL while still profitable on ETH short.
- Wallet performance monitoring is now built into the local pilot monitor:
  - Outputs: `launch/wallet-performance-monitor-report.md`, `launch/wallet-performance-current.csv`, `launch/state/wallet-performance-history.json`.
  - Latest read: 6 wallets are hot/heating up and 1 wallet is in drawdown/self-implosion watch.
  - Current self-imploding wallet: `0xaa2a33c424b92cdc042e40c522cb48e586e83026`.
  - Current hot-streak wallets: `0x9a770e9cd5d05e9e5636b87c822bafb53e02bdc9`, `0x718cc7ee2ae2493ebf7d454316df6b61f4e1a868`, `0xb40da15b8cc492fff87d9b1e06bb45769d7e75d9`, `0x88a0511a229643ae6e4ef263a08297343e11bf63`.
- Local API rate-limit mitigation is in place:
  - `launch/monitor-viable-wallets.mjs` now paces API requests, retries transient 429/5xx/timeouts with backoff, and skips the failing Hypercopy trader-summary endpoint when Hyperdash account data is already available.
  - Scanner Hyperliquid client now retries 429/5xx/timeouts, uses request timeouts, and defaults to slower `/info` pacing.
- The deployable scanner now includes the same 12 wallets in `scanner/watchlist.json`.
- The scanner now has wallet-level PnL health snapshots and paid-only wallet health alerts for `hot_streak`, `cooling_off`, `implosion_watch`, and `self_imploding` states.
- Business alignment cleanup is in progress:
  - `scanner/README.md` now describes the current LaunchPass + curated Pro Telegram product instead of the old top-50-only bot.
  - `scanner/assets/COPY.md`, `scanner/assets/USER_GUIDE_FREE.md`, `scanner/assets/USER_GUIDE_PRO.md`, and `scanner/assets/WEB_DESIGN_HANDOFF.md` no longer reference Whop or top-50-only positioning.
  - Local alert-feed language now uses more specific "why it matters" reads and paid-event counts match watchlist-filtered events.
- Commit `da3992a` was pushed to `main` with scanner wallet-health alerts, API pacing/backoff, and product-doc cleanup.
- Scanner CI passed for `da3992a`.
- Local Fly CLI auth is active as `corbin.paulson@gmail.com`.
- Fly app `hl-intel-scanner` exists in org `personal`.
- Fly volume `hl_intel_data` exists in region `ord` and is mounted at `/data`.
- GitHub Actions secret `FLY_API_TOKEN` exists for `corbidub/HLIntel-`.
- Commit `40328a7` fixed the Fly deploy workflow path and was pushed to `main`.
- Fly deploy workflow run `26426406769` completed successfully for `40328a7`.
- Fly runtime secrets are set from `/Users/corbinpaulson/hl-intel/.env`: `TELEGRAM_BOT_TOKEN`, `FREE_CHANNEL_ID`, and `PAID_CHANNEL_ID`.
- Fly machine `9080d14dfe4648` is running at `shared-cpu-1x:1024MB`.
- The scanner completed its seed cycle and first active scan on Fly. Logs show Pro/free alert sends and `Scan cycle complete` at 2026-05-26 01:23:49 UTC.
- `scanner/fly.toml` now declares the 1024 MB worker size so future deploys keep enough memory for matplotlib/Pillow/chart imports.
- Commit `496d429` throttled wallet-performance alert repeats by using stable state/address cooldown keys and honoring legacy uPnL-keyed alerts already in the Fly database.
- Commit `bd989d6` raised scanner Fly memory to 1GB and was pushed to `main`.
- Scanner CI and Fly deploy passed for `bd989d6`.
- Latest verified Fly scan after the 1GB deploy started at 2026-05-26 02:11:09 UTC and completed at 2026-05-26 02:12:24 UTC.
- Latest checked post-deploy scan showed no OOM lines and no wallet-performance repeat-alert wall.

## Important Paths

- Landing page: `index.html`, `styles.css`, `script.js`
- Scanner: `scanner/`
- Scanner deploy notes: `scanner/DEPLOYMENT.md`
- Scanner product docs: `scanner/README.md`, `scanner/assets/COPY.md`, `scanner/assets/USER_GUIDE_FREE.md`, `scanner/assets/USER_GUIDE_PRO.md`
- Aster side tracker: `aster-scan-tracker/`
- Spot and hedge tracker: `spot-tracker/`
- Launch research and proof packet: `launch/`
- Hyperdash cohort intake: `launch/fetch-hyperdash-cohort.mjs`
- Hyperdash very profitable snapshot: `launch/hyperdash-very_profitable-wallets.csv`, `launch/hyperdash-very_profitable-wallets.md`, `launch/hyperdash-very_profitable-wallets.json`
- Hyperdash noteworthy review: `launch/review-hyperdash-noteworthy-wallets.mjs`, `launch/hyperdash-noteworthy-wallet-review.md`, `launch/hyperdash-noteworthy-wallet-review.csv`
- Hyperdash pilot review: `launch/hyperdash-pilot-candidate-review.md`
- Local paid-pilot watchlist: `launch/pilot-watchlist.local.json` (gitignored)
- Deployable scanner watchlist: `scanner/watchlist.json`
- Wallet performance report: `launch/wallet-performance-monitor-report.md`
- Wallet performance CSV: `launch/wallet-performance-current.csv`
- Wallet performance history: `launch/state/wallet-performance-history.json`
- Chat backups: `launch/hl-intel-chat-backup-2026-05-21.md`, `launch/hl-intel-chat-backup-2026-05-23.md`
- Recovery system: `_recovery/`

## Verified Commands

From `/Users/corbinpaulson/Documents/HL INTEL Workspace`:

```sh
python3 -m http.server 4173
```

From `scanner/`:

```sh
python3 -m py_compile main.py config.py alerts/*.py bot/*.py data/*.py engine/*.py hyperliquid/*.py scripts/*.py
```

From `aster-scan-tracker/`:

```sh
python3 -m py_compile tracker.py
```

From `spot-tracker/`:

```sh
python3 -m py_compile tracker.py hedge_scan.py hyperlens_hedge_scan.py
```

Fetch latest Hyperdash very-profitable cohort:

```sh
node launch/fetch-hyperdash-cohort.mjs very_profitable
```

Build the noteworthy Hyperdash review:

```sh
node launch/review-hyperdash-noteworthy-wallets.mjs
```

Run the promoted local paid-pilot monitor:

```sh
HL_INTEL_API_MIN_INTERVAL_MS=1000 node launch/monitor-viable-wallets.mjs
```

## Current Recovery Rule

The chat is the working surface. The workspace is the memory.

Every meaningful work block should leave enough state in `_recovery/` for a new chat to recover in under five minutes.

## Do Not Forget

- Do not restart HL Intel from scratch.
- Start by running `make recover`.
- Then read `_recovery/NEXT_STEPS.md`.
- Keep generated DBs, logs, local env files, and caches out of git.
- Do not transmit or commit secrets.
