# HL Intel Session Recap — 2026-05-19

## Current Business Model

HL Intel is a Telegram-first Hyperliquid wallet intelligence product.

Positioning:
- Not copy trading.
- Not generic whale alerts.
- Not raw PnL chasing.
- Core edge is behavioral wallet classification, risk profiling, and actionable monitoring.

Primary customer:
- Hyperliquid traders, prop-style traders, on-chain intelligence users, and crypto operators who want faster wallet signal without manually scanning noisy dashboards.

Near-term monetization:
- Free Telegram for credibility and distribution.
- Pro Telegram for monitored wallet alerts, behavioral profiles, and higher-signal updates.
- High-touch paid pilot is still the fastest path to first dollar.

## Major Milestones Completed

- Live site exists at `https://hyperliquidintel.com`.
- Free and Pro Telegram channels are already set up.
- X account `@HLIntelFeed` is live.
- X profile has bio, site link, header/profile setup, pinned manifesto, and starter posts.
- Warm DM campaign was started from the main account.
- Multiple replies came in from X outreach.
- HyperCopy competitor/data source was reviewed.
- HyperCopy screener/API was discovered and used for wallet research.
- 3M HyperCopy universe was audited:
  - 1,249 reported rows.
  - 1,249 unique wallets.
  - 480 positive-PnL wallets.
  - 28 wallets passed the first strict filter.
- First strict filter was:
  - Positive 3M PnL.
  - 500-3,000 closed positions.
  - Win rate >= 80%.
  - Max drawdown < 15%.
- 28 strict-pass wallets were manually/deep reviewed.
- 14 usable candidates were built into cohort v1.
- 7 viable wallets were deep-reviewed.
- Local monitor script was built for viable wallets.
- Monitor baseline was saved.
- Win-rate assumption was corrected: 40% win rate can still be profitable with strong R multiples.
- Asymmetric wallet lane was added for lower-win-rate/high-payoff candidates.
- Asymmetric candidate pass was completed:
  - 62 reviewed.
  - 12 asymmetric-watch.
  - 13 review.
  - 2 risk-watch.
  - 35 hold.
- Asymmetric watch review was completed:
  - 2 asymmetric active monitors.
  - 5 asymmetric reactivation watches.
  - 5 review/not-monitor-ready.
- Yonathan's wallet tier framework was reviewed.
- Next selected task: add behavior metrics inspired by Yonathan's framework.

## Important Local Files

- `hypercopy-unique-audit.csv`
- `hypercopy-unique-audit-summary.md`
- `hypercopy-28-wallet-review.csv`
- `hypercopy-28-wallet-review.md`
- `hl-intel-wallet-cohort-v1.csv`
- `hl-intel-wallet-cohort-v1.md`
- `hl-intel-viable-wallet-deep-review.csv`
- `hl-intel-viable-wallet-deep-review.md`
- `monitor-viable-wallets.mjs`
- `viable-wallet-monitor-current.csv`
- `viable-wallet-monitor-report.md`
- `state/viable-wallet-monitor-snapshot.json`
- `find-asymmetric-wallets.mjs`
- `hl-intel-asymmetric-wallet-candidates.csv`
- `hl-intel-asymmetric-wallet-candidates.md`
- `review-asymmetric-watch.mjs`
- `hl-intel-asymmetric-watch-review.csv`
- `hl-intel-asymmetric-watch-review.md`
- `outreach-tracker.csv`
- `outreach-kit.md`
- `x-prospect-shortlist.md`

## Current Clean Viable Monitor

Priority A:
- `0xbb9f0315243db63fc34c51f96ad5bb7ce6e275e2` — clean reactivation watch, no open positions.
- `0xf3362789cecf25c6a31288d172880d7ad9b81801` — clean reactivation watch, no open positions.
- `0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62` — active BTC short monitor.

Priority B:
- `0x031f72deb03c509af42624ddcd1f63fce5ecb220` — ZEC long.
- `0x143c28ae5b8642f58c98b8a6f82a0f314d23f6ab` — HYPE long.
- `0xa3d843b6a057504284006bef6f34a2e9bc80fb6b` — BTC long plus RWA-style symbols; caution.
- `0xa4add8273d7f47318675bdfbcce3e9648cdb4509` — SOL long plus meme/noisy behavior; lower confidence.

## Best Asymmetric Adds

Priority A:
- `0x613ead0ea5af374af0ccfc117ef116a8e8d133fe`
  - Win rate: 46.3%.
  - 3M PnL: about +$99.8K.
  - ROI: 126.7%.
  - Max DD: 9.8%.
  - Closed positions: 905.
  - Current state: HYPE long, about $598K notional and about $33K open uPnL at review.
- `0x86149addc2ebeb610d2630b07cbfea5c19fa690e`
  - Reactivation watch.
  - No open positions at review.
  - Recent HYPE/ETH/BTC/TAO behavior.
- `0xac82b3772ca54a154092e27109f61a31a6d743a5`
  - Reactivation watch.
  - No open positions at review.

Priority B:
- `0x83b1385d8126ecf64bfb3b4254d67eb9db753bcc`
- `0x6d7823cd5c3d9dcd63e6a8021b475e0c7c94b291`
- `0x2cef0a7f84e722c77b271862da5fe2387028fa20`
- `0xd2147a366e335b89b68ace628923962393b56813`

## Yonathan Framework Notes

Yonathan's document was reviewed as a strong fit for HL Intel's missing wallet quality layer.

Core metrics to add:
- Daily PnL curve.
- Guarded daily returns.
- Sortino ratio.
- Max drawdown.
- Consistency percentage.
- Recovery ratio.
- 60D peak drawdown.
- Idle days.
- 24h crash / recent peak-to-current drop.
- Conservative tier classification.

Important caveat:
- Raw PnL percentage changes can behave badly near zero or when cumulative PnL crosses zero. HL Intel should treat these as behavior/tier signals, not absolute truth.

Recommended naming:
- Avoid public hype labels like "Money Printer."
- Use professional internal/public labels such as:
  - Elite Behavior.
  - Strong Behavior.
  - Grinder Behavior.
  - Asymmetric Behavior.
  - Risk Watch.
  - Inactive Watch.

## Next Work Item

Local wallet behavior metrics were added without changing the website.

New output:
- `hl-intel-wallet-behavior-metrics.csv`
- `hl-intel-wallet-behavior-metrics.md`

New script:
- `calc-wallet-behavior-metrics.mjs`

Inputs:
- `hl-intel-viable-wallet-deep-review.csv`
- `hl-intel-asymmetric-watch-review.csv`

Metrics:
- `days_available`
- `sortino_30d`
- `mdd_30d`
- `consistency_30d`
- `recovery_30d`
- `peak_dd_60d`
- `idle_days`
- `crash_24h`
- `source_conflict_flag`
- `behavior_tier`
- `tier_reason`
- `data_quality`

Latest behavior layer result:
- 19 wallets scored.
- 2 elite behavior.
- 4 asymmetric behavior.
- 1 risk watch.
- 6 high-risk behavior.
- 2 low-PnL/unproven.
- 4 incomplete-data.

Elite behavior deep dive was added:
- `deep-dive-elite-wallets.mjs`
- `hl-intel-elite-wallet-deep-dive.csv`
- `hl-intel-elite-wallet-deep-dive.md`

Elite wallet conclusion:
- `0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62` is the current flagship Pro-alert candidate. Best use: BTC short unwind/trim/flip/material-add intelligence.
- `0xa3d843b6a057504284006bef6f34a2e9bc80fb6b` remains Priority B. It has strong headline stats, but RWA/xyz symbol noise, high current leverage, underwater open BTC book, and ugly 1W drawdown make it too messy for a flagship alert.

Priority wallet dig was added:
- `deep-dive-priority-wallets.mjs`
- `hl-intel-priority-wallet-dig.csv`
- `hl-intel-priority-wallet-dig.md`

Priority wallet conclusion:
- Keep `0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62` as the only current pilot-ready flagship wallet.
- Keep `0xa3d843b6a057504284006bef6f34a2e9bc80fb6b` as secondary/custom BTC monitoring only.
- Keep `0x86149addc2ebeb610d2630b07cbfea5c19fa690e` as secondary/custom monitoring because it now has a ZEC short and clean token history, but high leverage and ugly 1W drawdown block flagship status.
- Keep `0x6d7823cd5c3d9dcd63e6a8021b475e0c7c94b291`, `0xd2147a366e335b89b68ace628923962393b56813`, and `0xe3c1447b94c5b278d9ec8d24855f5a5a2788542b` as secondary reactivation watches only.
- Keep `0x2cef0a7f84e722c77b271862da5fe2387028fa20` internal risk watch only.

Asymmetric wallet deep dive was added:
- `deep-dive-asymmetric-wallets.mjs`
- `hl-intel-asymmetric-wallet-deep-dive.csv`
- `hl-intel-asymmetric-wallet-deep-dive.md`

Asymmetric wallet conclusion:
- 27 asymmetric/review/risk wallets were reviewed.
- 0 are ready for the curated flagship feed.
- 5 are custom watch candidates.
- 11 need payoff/data validation.
- 4 have data conflicts.
- 7 are risk rejects.
- Best asymmetric custom-watch names: `0x86149addc2ebeb610d2630b07cbfea5c19fa690e`, `0xbf1e78fcd3b89a8a3375e68a11a2e7412f24f2af`, `0xed48b856556a69c7c40229c9c4c829b909257c9b`.

Alert format spec was added:
- `hl-intel-alert-format-spec.md`

Alert product contract:
- Alerts must answer whether wallet positioning is meaningful or noise.
- Supported events: entry, add, trim, exit, flip, risk_change, digest.
- Every alert should include wallet rank/profile, token, side, notional, position change, open uPnL, risk context, and a one-line reason it matters.
- Default stance remains data-only and NFA.
- Suppress noisy small changes, unapproved risk-watch wallets, source-conflict wallets, and tokens outside the user's watchlist.

## 2026-05-19 Pickup Update

Docs were reviewed through the Spark lens: prioritize commercialization of the existing HL Intel asset over inventing a new standalone Spark product.

Completed:
- Recovered the Spark system prompt into `SPARK_SYSTEM_PROMPT.md` at the workspace root.
- Extended `monitor-viable-wallets.mjs` so the local wallet monitor now emits the buyer-requested alert contract.
- New/generated alert outputs:
  - `hl-intel-alert-events.json`
  - `hl-intel-alert-feed.md`
  - `hl-intel-current-digest.md`
- Added `pilot-watchlist.example.json` for paid-pilot filtering by customer wallets, watched tokens, and per-wallet thresholds.
- `monitor-viable-wallets.mjs` now detects optional `pilot-watchlist.local.json`; when present, alert events are suppressed unless they match the paid-pilot config.
- The current run monitored 7 wallets and produced 0 threshold alert events.
- Current active wallet state:
  - `0x6979...da62` remains the highest-value flagship BTC short watch.
  - 5 of 7 monitored wallets currently have active positions.
  - Priority B wallets remain custom-watch only unless a user explicitly asks for those wallets/tokens.

Next best work:
- Create the first real `pilot-watchlist.local.json` from a prospect's favorite wallets/tokens.
- Add a Telegram send step for `hl-intel-current-digest.md` and non-empty `hl-intel-alert-feed.md` after manual review.
- Resume X comment mining from `x-comment-mining-recovery-2026-05-19.md`; prioritize Stupifff, CoinGlass, Lookonchain, Taiki, and Decibel reply threads.
- `outreach-tracker.csv` now has 10 additional `not_sent` prospects from the recovered comment-mining lane.
- Added `target-rich-chats-2026-05-19.md` with ranked Telegram/Discord/Reddit rooms to inspect.
- `outreach-tracker.csv` now has 95 rows after adding the top chat/community targets as `not_sent`.

## Current Operating Rule

Keep research and wallet-metric work local for now.

Do not change the public website unless explicitly requested.
