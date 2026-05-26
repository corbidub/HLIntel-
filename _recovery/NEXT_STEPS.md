# HL Intel Next Steps

Last updated: 2026-05-25 21:16 CDT

## Immediate

1. Review `launch/wallet-performance-monitor-report.md` first; current focus is `0xaa2a33c424b92cdc042e40c522cb48e586e83026` as the self-imploding wallet and the four hot-streak wallets.
2. Review the high-priority position changes in `launch/hl-intel-alert-feed.md`, especially the HYPE/BTC changes from the latest monitor run.
3. Manually open the 12 local watchlist wallets and mark `manual_check_status` in `launch/pilot-watchlist.local.json`.
4. Run `HL_INTEL_API_MIN_INTERVAL_MS=1000 node launch/monitor-viable-wallets.mjs` on the next cycle to detect changes from the 12-wallet baseline and refresh wallet health.
5. Keep an eye on Fly logs for normal production drift: OOM, Telegram auth errors, 429 spam, or alert-volume spikes.
6. Review `launch/hl-intel-chat-backup-2026-05-23.md` for any product or deploy tasks that still need to be captured here.
7. Update this file at the end of the next work block.

## Recovery System

1. Use `make recover` at the start of every fresh chat.
2. Use `make recovery-closeout` before ending a meaningful session.
3. Keep `_recovery/CURRENT_STATE.md` short, current, and factual.
4. Append a dated entry to `_recovery/SESSION_LOG.md` after each meaningful session.

## Product / Launch

1. Confirm LaunchPass checkout is live.
2. Confirm `@HLIntelPro` is private and LaunchPass controls invites/removals.
3. Test the Pro CTA on desktop and mobile.
4. Test the free Telegram CTA.
5. Confirm SSL is active on `https://hyperliquidintel.com`.
6. Capture 2-3 real Pro alert examples from `launch/hl-intel-alert-feed.md` for outbound proof.

## Hyperdash Wallet Research

1. Use `node launch/fetch-hyperdash-cohort.mjs very_profitable` to refresh the source file.
2. Use `node launch/review-hyperdash-noteworthy-wallets.mjs` to rebuild `launch/hyperdash-noteworthy-wallet-review.md`.
3. Start manual confirmation from `launch/hyperdash-pilot-candidate-review.md`, then `secondary_crypto_watch`, then `premium_reactivation_watch`.
4. Treat `internal_risk_watch` as liquidation/risk-intel material, not follow-the-wallet signal.
5. Treat `wide_book_noise` as likely too broad/noisy until proven otherwise.
6. Cross-check promoted wallets against existing files in `launch/hl-intel-wallet-cohort-v1.csv` and `launch/hl-intel-viable-wallet-deep-review.csv`.
7. Keep `launch/pilot-watchlist.local.json` local and gitignored; use it for paid-pilot wallet promotion.
8. Treat Priority B entries in the local watchlist as secondary dig/watch wallets until manually confirmed.

## Scanner / Deploy

1. Watch logs: `~/.fly/bin/flyctl logs --app hl-intel-scanner`.
2. Current production shape is one Fly worker at `shared-cpu-1x:1024MB`, mounted to `/data`.
3. Keep GitHub Actions secret `FLY_API_TOKEN` and Fly runtime secrets in place.
4. If confluence/position alert volume is too noisy, tune deployed alert caps/seed baseline handling before scaling audience.
