# HL Intel Session Log

## 2026-05-25 - Workspace Recovery System

- Recovered the fuller HL Intel workspace from `origin/codex/aster-scan-tracker`.
- Created clean worktree at `/Users/corbinpaulson/Documents/HL INTEL Workspace`.
- Created branch `codex/hl-intel-workspace`.
- Verified landing page at `http://localhost:4173`.
- Verified scanner, Aster tracker, and spot tracker compile checks.
- Found likely saved chat backup at `launch/hl-intel-chat-backup-2026-05-23.md`, modified today at 10:49 CDT.
- Added `_recovery/` as the durable project memory system.
- Added `make recover`, `make recovery-check`, and `make recovery-closeout`.

## 2026-05-25 - Hyperdash Very Profitable Intake

- Opened `https://hyperdash.com/explore/cohorts/very_profitable`.
- Confirmed the page is backed by Hyperdash GraphQL at `https://api.hyperdash.com/graphql`.
- Added `launch/fetch-hyperdash-cohort.mjs`.
- Fetched the full `very_profitable` cohort: 875 unique wallets.
- Wrote:
  - `launch/hyperdash-very_profitable-wallets.csv`
  - `launch/hyperdash-very_profitable-wallets.json`
  - `launch/hyperdash-very_profitable-wallets.md`
- First-pass tier counts:
  - `priority_review`: 17
  - `watchlist_candidate`: 60
  - `reactivation_watch`: 23
  - `risk_watch`: 29
  - `noisy_wide_book`: 26
  - `low_priority`: 720
- Cross-check against existing HL Intel cohort files found 3 overlaps among the 100 interesting Hyperdash wallets:
  - `0x143c28ae5b8642f58c98b8a6f82a0f314d23f6ab`
  - `0x031f72deb03c509af42624ddcd1f63fce5ecb220`
  - `0x2cef0a7f84e722c77b271862da5fe2387028fa20`
- Verified `node --check launch/fetch-hyperdash-cohort.mjs`.
- Next exact action: manually inspect the 17 `priority_review` wallets and decide which should enter the HL Intel pilot watchlist.

## 2026-05-25 - Hyperdash Noteworthy Wallet Review

- Added `launch/review-hyperdash-noteworthy-wallets.mjs`.
- Reviewed 155 noteworthy wallets from the `very_profitable` cohort.
- Wrote:
  - `launch/hyperdash-noteworthy-wallet-review.md`
  - `launch/hyperdash-noteworthy-wallet-review.csv`
- Bucket counts:
  - `pilot_candidate`: 13
  - `secondary_crypto_watch`: 45
  - `premium_reactivation_watch`: 2
  - `reactivation_watch`: 21
  - `macro_rwa_custom_only`: 14
  - `internal_risk_watch`: 29
  - `wide_book_noise`: 26
  - `research_backlog`: 5
- Existing HL Intel overlaps in the noteworthy set:
  - `0x143c28ae5b8642f58c98b8a6f82a0f314d23f6ab`
  - `0x031f72deb03c509af42624ddcd1f63fce5ecb220`
  - `0x2cef0a7f84e722c77b271862da5fe2387028fa20`
- Verified `node --check launch/review-hyperdash-noteworthy-wallets.mjs`.
- Next exact action: manually open the top `pilot_candidate` wallets in Hyperdash and promote only confirmed clean wallets into the pilot watchlist.

## 2026-05-25 - Hyperdash Pilot Candidate Review

- Reviewed the 13 `pilot_candidate` wallets from the Hyperdash noteworthy report.
- Cross-checked candidates against existing HL Intel CSVs and Hypercopy audit files.
- Wrote `launch/hyperdash-pilot-candidate-review.md`.
- Decision summary:
  - Promote now: 4 wallets
  - Promote with filters: 5 wallets
  - Watch only / provisional: 4 wallets
  - Reject for pilot feed: 0 wallets
- Key promotion batch:
  - `0xf00bb08f7d1d04a9415408c939c02410fc6791b1`
  - `0xaede390f5b5b7cf77428030ccfc73d99a44e1602`
  - `0x12f5f5ce07647f5e7bf9ea054ea119d1cbb85a9b`
  - `0xe25173b3558e8644d719f2cd3095dccbf5efeaba`
- Next exact action: manually open those four Hyperdash address pages, confirm freshness/readability, then convert promoted wallets into the scanner watchlist format.

## 2026-05-25 - Hyperdash Wallet Promotion

- Promoted the first 4 Hyperdash pilot wallets into `launch/pilot-watchlist.local.json`.
- Added `launch/pilot-watchlist.local.json` to `.gitignore` so local paid-pilot config is not committed accidentally.
- Updated `launch/monitor-viable-wallets.mjs` so local watchlist wallets are monitored directly instead of only filtering the default viable-wallet set.
- Added Hyperdash snapshot fallback for promoted wallets when Hypercopy returns `500`.
- Ran `node launch/monitor-viable-wallets.mjs`.
- Baseline result:
  - Monitored wallets: 4
  - Baseline open positions: 6
  - High/medium/low change alerts: 0
  - Watchlist mode: `hl-intel-hyperdash-promoted-2026-05-25`
- Baseline outputs updated:
  - `launch/viable-wallet-monitor-report.md`
  - `launch/viable-wallet-monitor-current.csv`
  - `launch/hl-intel-alert-feed.md`
  - `launch/hl-intel-alert-events.json`
  - `launch/hl-intel-current-digest.md`
  - `launch/hl-intel-market-participant-read.md`
  - `launch/hl-intel-market-participant-state.json`
  - `launch/state/viable-wallet-monitor-snapshot.json`
- Next exact action: manually open the four promoted Hyperdash pages and change their `manual_check_status` from `pending` after confirmation.

## 2026-05-25 - Hyperdash Secondary Wallet Additions

- Added 8 secondary/dig-pending wallets to `launch/pilot-watchlist.local.json` as Priority B:
  - `0x9a770e9cd5d05e9e5636b87c822bafb53e02bdc9`
  - `0x718cc7ee2ae2493ebf7d454316df6b61f4e1a868`
  - `0xaa2a33c424b92cdc042e40c522cb48e586e83026`
  - `0xe79d69fd1ed52dd14d7f55155259519ea20d0534`
  - `0xb40da15b8cc492fff87d9b1e06bb45769d7e75d9`
  - `0x88a0511a229643ae6e4ef263a08297343e11bf63`
  - `0xe09726ff25f5001f37b15049f54116cb83d7d0fe`
  - `0x04cc3147bc87999e5a6b75373daa6ff8f12b38d1`
- Validated local watchlist JSON: 12 wallets total.
- Ran `node launch/monitor-viable-wallets.mjs`.
- Expanded baseline result:
  - Monitored wallets: 12
  - Active wallets: 11
  - Baseline filtered positions: 23
  - Suppressed by token filter: 1
  - High-priority change detected: `0xaede390f5b5b7cf77428030ccfc73d99a44e1602` closed HYPE.
- Next exact action: review the HYPE exit in `launch/hl-intel-alert-feed.md`, then manually confirm the 12 watchlist wallets in Hyperdash.

## 2026-05-25 - Scanner Deploy Attempt

- Added deployable scanner watchlist support:
  - `scanner/watchlist.json` contains the 12-wallet Hyperdash queue.
  - `scanner/main.py` loads deploy-time watchlist wallets outside the top 50 leaderboard.
  - `scanner/engine/scanner.py` applies per-wallet token filters and minimum add thresholds.
  - `scanner/config.py` supports `HL_INTEL_WATCHLIST_PATH`.
  - `.github/workflows/deploy-scanner-fly.yml` now deploys on pushes to `main` that touch scanner paths.
- Verified:
  - `python3 -m py_compile main.py config.py alerts/*.py bot/*.py data/*.py engine/*.py hyperliquid/*.py scripts/*.py`
  - Docker build: `docker build -t hl-intel-scanner-watchlist .`
  - Container watchlist load check: 12 wallets loaded.
- Committed as `f81cbef Deploy Hyperdash watchlist to scanner`.
- Pushed `f81cbef` to `origin/main`.
- GitHub Actions:
  - Scanner CI run `26412094166`: passed.
  - Fly deploy run `26412094148`: failed.
- Blocker:
  - Private Fly deploy job logs require repo admin access.
  - Most likely remaining checks are GitHub secret `FLY_API_TOKEN`, Fly app `hl-intel-scanner`, volume `hl_intel_data`, and Fly Telegram secrets.
- Next exact action: check the failed deploy step logs in GitHub UI, fix Fly credentials/config, and re-run workflow `26412094148`.

## 2026-05-25 - Wallet Performance Monitor

- Built wallet-level PnL health monitoring into `launch/monitor-viable-wallets.mjs`.
- New local outputs:
  - `launch/wallet-performance-monitor-report.md`
  - `launch/wallet-performance-current.csv`
  - `launch/state/wallet-performance-history.json`
- Latest local read after the 12:35 CDT refresh:
  - 12 wallets monitored.
  - 7 wallets are hot or heating up.
  - 1 wallet is cooling off or in drawdown watch.
  - `0xaa2a33c424b92cdc042e40c522cb48e586e83026` is currently `self_imploding`.
  - `0x9a770e9cd5d05e9e5636b87c822bafb53e02bdc9`, `0x718cc7ee2ae2493ebf7d454316df6b61f4e1a868`, `0xb40da15b8cc492fff87d9b1e06bb45769d7e75d9`, and `0x88a0511a229643ae6e4ef263a08297343e11bf63` are currently `hot_streak`.
- Added scanner-side wallet performance storage and paid-only wallet health alerts:
  - DB table: `wallet_performance_snapshots`.
  - Alert states: `hot_streak`, `cooling_off`, `implosion_watch`, `self_imploding`.
  - Scanner now continues snapshotting wallet PnL health for every tracked wallet even after the per-cycle Telegram position-alert cap is reached.
- Verified:
  - `python3 -m py_compile main.py config.py alerts/*.py bot/*.py data/*.py engine/*.py hyperliquid/*.py scripts/*.py`
  - `node --check launch/monitor-viable-wallets.mjs`
  - DB smoke test for `save_wallet_performance_snapshot()` and `get_latest_wallet_performance()`.
- Next exact action: decide whether to commit and push the scanner wallet-performance changes before retrying Fly deploy; Fly deploy credentials/config are still the live deployment blocker.

## 2026-05-25 - API Rate-Limit Mitigation

- Added a paced request queue to `launch/monitor-viable-wallets.mjs`.
- Added retry/backoff for 429, 500, 502, 503, 504, and timeout failures.
- Added fast fallback behavior for Hypercopy calls when Hyperdash snapshot data is available.
- Stopped calling Hypercopy's trader-summary endpoint by default for Hyperdash-backed wallets because it consistently returned 500 during testing; set `HL_INTEL_HYPERCOPY_TRADER_LOOKUP=1` to force it.
- Scanner Hyperliquid client changes:
  - Defaults `/info` pacing to `0.75s` between requests.
  - Retries 429/5xx/timeouts.
  - Adds request timeout config through `HL_HTTP_TIMEOUT_SECONDS`.
  - Documents pacing env vars in `scanner/.env.example`.
- Verified:
  - `node --check launch/monitor-viable-wallets.mjs`
  - `python3 -m py_compile main.py config.py alerts/*.py bot/*.py data/*.py engine/*.py hyperliquid/*.py scripts/*.py`
  - `git diff --check`
  - `HL_INTEL_API_MIN_INTERVAL_MS=1000 node launch/monitor-viable-wallets.mjs`
- Latest paced monitor run had no Hypercopy warning spam and completed with 12 wallets monitored, 3 high alerts, 4 low alerts, and 6 paid-pilot alert events.
- Next exact action: deploy scanner changes after Fly credentials/config are fixed, then watch logs for any remaining 429s and tune `HL_INFO_MIN_REQUEST_INTERVAL_SECONDS` upward if needed.

## 2026-05-25 - Business Plan Alignment Cleanup

- Reviewed HL Intel against the business plan:
  - Telegram-first paid feed.
  - LaunchPass/private Pro access.
  - Curated wallet intelligence, not copy-trading.
  - No dashboard required for first sellable version.
  - Personalized/custom watchlists remain the highest-ROI next product feature.
- Cleaned stale docs and support assets:
  - Rewrote `scanner/README.md` for the current curated Pro feed and watchlist scanner.
  - Updated `scanner/DEPLOYMENT.md` runtime knobs and LaunchPass note.
  - Replaced stale Free/Pro user guides with current product guidance.
  - Updated `scanner/assets/COPY.md` and `scanner/assets/WEB_DESIGN_HANDOFF.md` away from Whop/top-50-only language.
- Improved local alert output:
  - More specific `why_it_matters` text for core watch, custom watch, reactivation, entries, exits, trims/adds, and risk changes.
  - Current digest now summarizes active core/custom watches instead of saying no flagship is active.
  - Alert-feed counts now reflect paid-pilot filtered events, not pre-suppression raw alerts.
- Regenerated local monitor outputs with `HL_INTEL_API_MIN_INTERVAL_MS=1000 node launch/monitor-viable-wallets.mjs`.
- Latest regenerated run:
  - 12 wallets monitored.
  - 3 high alerts.
  - 3 low alerts.
  - 4 paid-pilot alert events.
  - 2 alerts suppressed by watchlist config.
- Next exact action: run final verification, then decide whether to stage/commit this cleanup with the scanner wallet-health and API pacing changes.

## 2026-05-25 - Scanner Deploy Push / Fly Token Blocker

- Staged only scanner deploy/product files; local launch and recovery files were left unstaged.
- Verified scanner Python compile, Docker build, container config/import smoke test, and `git diff --check -- scanner`.
- Committed scanner work as `da3992a Deploy wallet health scanner updates`.
- Pushed `da3992a` to `origin/main`.
- GitHub Actions:
  - Scanner CI run `26413538509`: passed.
  - Fly deploy run `26413538550`: failed.
- Exact blocker:
  - The deploy job had an empty `FLY_API_TOKEN` secret.
  - Job log error: `Error: no access token available. Please login with 'flyctl auth login'`.
  - Local Fly CLI exists at `~/.fly/bin/flyctl`, but local Fly auth is not active.
- Next exact action: Fly login, create a deploy token for `hl-intel-scanner`, add it as GitHub secret `FLY_API_TOKEN`, then re-run workflow `26413538550`.

## 2026-05-25 - Fly API Setup Attempt

- Completed local Fly CLI login as `corbin.paulson@gmail.com`.
- Confirmed Fly CLI version `v0.4.54` and that the account has no apps yet.
- Tried to create the configured scanner app with `flyctl apps create hl-intel-scanner --org personal`.
- Blocker:
  - Fly rejected app creation because the `corbi` organization needs billing/payment setup first.
  - Error: `We need your payment information to continue! Add a credit card or buy credit: https://fly.io/dashboard/corbi/billing`.
- Next exact action: complete Fly billing setup, then create app, create volume, create deploy token, add GitHub secret `FLY_API_TOKEN`, and rerun workflow `26413538550`.

## 2026-05-25 - Fly App Created / Deploy Passing

- Created Fly app `hl-intel-scanner` in org `personal`.
- Created Fly volume `hl_intel_data` in region `ord`; volume ID `vol_vwn08087xx6ww2mv`.
- Created app-scoped Fly deploy token and added it as GitHub Actions secret `FLY_API_TOKEN`.
- Reran old deploy workflow `26413538550`; it passed auth but failed because the workflow command did not read the scanner config correctly.
- Patched `.github/workflows/deploy-scanner-fly.yml` to run from `scanner/` with `flyctl deploy --config fly.toml --remote-only`.
- Committed and pushed `40328a7 Fix Fly scanner deploy workflow path` to `main`.
- New deploy workflow run `26426406769` completed successfully.
- Verified Fly app status:
  - App: `hl-intel-scanner`.
  - Machine: `9080d14dfe4648`.
  - Volume mounted: `hl_intel_data`.
- Runtime blocker:
  - Fly secrets list is empty.
  - Logs show `telegram.error.InvalidToken` because `TELEGRAM_BOT_TOKEN` is missing.
  - Stopped machine `9080d14dfe4648` to avoid crash-looping.
- Next exact action: set `TELEGRAM_BOT_TOKEN`, `FREE_CHANNEL_ID`, and `PAID_CHANNEL_ID` as Fly secrets, then start the machine and watch logs.

## 2026-05-25 - Fly Runtime Secrets / Scanner Live

- Found the correct existing HL Intel runtime env at `/Users/corbinpaulson/hl-intel/.env`.
- Validated without printing secrets:
  - Bot: `@HLIntelBot`.
  - `FREE_CHANNEL_ID`: visible as channel `HL Intel "Free"`.
  - `PAID_CHANNEL_ID`: visible as channel `HL Intel "Pro"`.
- Set Fly secrets for `hl-intel-scanner`: `TELEGRAM_BOT_TOKEN`, `FREE_CHANNEL_ID`, `PAID_CHANNEL_ID`.
- Started machine `9080d14dfe4648`.
- Initial runtime passed Telegram auth but OOM-killed on `shared-cpu-1x:256MB`.
- Scaled machine to `shared-cpu-1x:512MB` and updated `scanner/fly.toml` with matching `[[vm]]` config.
- Verified:
  - Machine running at `512MB`.
  - Seed cycle completed with no alerts.
  - First active scan started, posted Pro/free alerts, and completed at `2026-05-26 01:23:49 UTC`.
- Risk:
  - First deployed live scan was noisy because it established baseline state and emitted many Pro confluence/performance alerts.
- Next exact action: watch the second active scan and tune alert volume if needed.

## 2026-05-25 - Fly Scanner Noise Guard

- Committed and pushed `77dad8d Raise Fly scanner memory`.
- GitHub Actions:
  - Scanner CI run `26427037280`: passed.
  - Fly deploy run `26427037308`: passed.
- Observed first deployed scans were stable at 512 MB but wallet-performance alerts repeated because the alert key included rounded open uPnL.
- Paused Fly machine `9080d14dfe4648` while patching to reduce alert spam.
- Patched wallet-performance alert keys:
  - New key: `wallet_perf:{state}:{address}`.
  - Legacy key prefix support: suppresses old `wallet_perf:{state}:{address}:{rounded_upnl}` records already written to the Fly SQLite DB.
- Verified `python3 -m py_compile main.py config.py alerts/*.py bot/*.py data/*.py engine/*.py hyperliquid/*.py scripts/*.py`.
- Committed and pushed `496d429 Throttle wallet performance alert repeats`.
- GitHub Actions:
  - Scanner CI run `26427339991`: passed.
  - Fly deploy run `26427339990`: passed.
- Restarted Fly machine after deploy.
- Verified:
  - Seed cycle completed after patched deploy.
  - Active scan started at `2026-05-26 01:44:03 UTC`.
  - Only one wallet-performance alert appeared in that scan window, instead of the previous repeated wall.
  - Scan completed at `2026-05-26 01:45:32 UTC`.
  - Machine is running at `shared-cpu-1x:512MB`.
- Next exact action: keep an eye on the next normal cycle and tune confluence/position alert volume if it is still too noisy.

## 2026-05-25 - Fly Scanner 1GB Stability

- Observed one more OOM at 512 MB after the wallet-performance repeat fix, so 512 MB was not stable enough for sustained scan cycles.
- Scaled Fly machine `9080d14dfe4648` live to `shared-cpu-1x:1024MB`.
- Updated `scanner/fly.toml` so future deploys preserve the 1GB setting.
- Committed and pushed `bd989d6 Raise scanner Fly memory to 1GB` to `main`.
- GitHub Actions:
  - Scanner CI run `26428175687`: passed.
  - Fly deploy run `26428175708`: passed.
- Verified Fly machine image `hl-intel-scanner:deployment-01KSH0H5J03MEVKJW2Q8J5FEDA` running at `shared-cpu-1x:1024MB`.
- Verified first post-deploy active scan:
  - Started at `2026-05-26 02:11:09 UTC`.
  - Completed at `2026-05-26 02:12:24 UTC`.
  - Sent two Pro whale alerts and showed no OOM lines in the checked log window.
  - Wallet-performance repeat-alert wall did not return.
- Next exact action: return to reviewing wallet-performance and alert-feed outputs, then decide which remaining launch/research outputs should be committed versus kept local.

## 2026-05-25 - Documentation Sync

- Updated repo docs to reflect the durable recovery system, current Fly production target, and 1GB scanner worker.
- Added recovery docs and `Makefile` to the set intended for GitHub so fresh chats can run `make recover`.
- Included current launch Markdown reports and Hyperdash review notes in the documentation sync set; raw local state files remain local unless intentionally published later.
- Next exact action: return to reviewing wallet-performance and alert-feed outputs.

## Session Log Format

For each future session, append:

```md
## YYYY-MM-DD - Short Session Name

- What changed:
- What was verified:
- Decisions made:
- Next exact action:
- Any risk or blocker:
```
