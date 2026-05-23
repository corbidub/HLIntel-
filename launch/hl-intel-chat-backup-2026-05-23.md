# HL Intel Chat Backup — 2026-05-23

Saved: 2026-05-23 14:41 CDT  
Repo: `git@github.com:corbidub/HLIntel-.git`  
Local repo: `/Users/corbinpaulson/Documents/New project/hl-intel-site`  
Live bot/data path: `/Users/corbinpaulson/hl-intel`

This is a recovery note for the latest HL Intel work. It captures the important decisions, code changes, market reads, content actions, and next steps from the recent thread.

## Current Product Direction

HL Intel is still best framed as a Telegram-first Hyperliquid perp intelligence feed.

Current sellable wedge:
- Filtered Telegram alerts.
- Ranked-wallet context.
- Whale adds/trims/flips/hedges/liquidation stress.
- Weekly digest.
- No dashboard required for first sellable version.
- No trade automation.
- Data product only, not financial advice.

Positioning language that landed better than the older "fewer whale alerts" framing:

> Not more alerts. More useful context around the wallets that matter.

Personalized watchlists remain the highest-ROI next product feature:
- Let Pro users select 5-20 wallets and/or tokens.
- Alert only on their chosen lists.
- Entry/add/trim/exit/flip/liquidation risk events.
- This changes the product from a shared feed into "my intelligence tool."

Discord decision:
- Do not launch Discord yet.
- Telegram-first is enough for now.
- Add Discord only after Pro users need discussion, onboarding, or a heavier community layer.

## Website / GitHub

Website repo:
- `/Users/corbinpaulson/Documents/New project/hl-intel-site`
- Remote: `git@github.com:corbidub/HLIntel-.git`

Recent website state:
- Domain issue was fixed by adding/configuring `www.hyperliquidintel.com` in Vercel.
- Primary domain has been working as `hyperliquidintel.com`, with `www` configuration added afterward.
- X link was checked and added/updated.
- Site copy was tightened around the first sellable Pro version.
- User wanted the hero away from "fewer whale alerts" because that sounds like less product, not better signal.

Outstanding untracked local folder:
- `launch/social/` exists and is currently untracked. It was intentionally left untouched during the Aster tracker work.

## AsterScan Side Tracker

Created and pushed branch:
- Branch: `codex/aster-scan-tracker`
- Commit: `4a950d0 Add AsterScan side tracker`
- PR creation link: `https://github.com/corbidub/HLIntel-/pull/new/codex/aster-scan-tracker`

Added folder:
- `aster-scan-tracker/`

Files:
- `aster-scan-tracker/tracker.py`
- `aster-scan-tracker/watchlist.json`
- `aster-scan-tracker/README.md`
- `aster-scan-tracker/.gitignore`

Purpose:
- Lightweight experimental sidecar for AsterScan public data.
- Pulls AsterScan public positions and leaderboards.
- Stores local SQLite snapshots under `aster-scan-tracker/data/`.
- Prints an operator report.
- Keeps generated DB/output ignored.
- Does not touch the live HL Intel Telegram alert loop.

Run command:

```bash
cd "/Users/corbinpaulson/Documents/New project/hl-intel-site/aster-scan-tracker"
python3 tracker.py --once --top 8
```

Verified:

```bash
python3 tracker.py --once --top 8
python3 -m py_compile tracker.py
```

First run showed:
- Visible tracked open interest: about `$40.0M`
- Long: about `$25.1M`
- Short: about `$14.8M`
- Visible PnL: about `-$1.1M`
- 1229 positions
- 100 wallets

Seed Aster watchlist:
- `0xdd6a9af268992508a227b834a43c3895ca1dc065` — largest visible exposure, about `$16.7M`, ETH/SOL longs and XRP/DOGE/BTC shorts.
- `0xccdb90660719f9cf1de9c2824c606879701b8293` — clean BTC short, about `$1.6M`.
- `0xe5f5d067832f34049b720ac669d31f839f8887ba` — multi-short stress basket, about `$2.7M`.
- `0x534e687d03c509945b349ec53acf7cbcc16db0c7` — active multi-position short book, about `$1.8M`.
- `0xb4430b4d0b274fa0c641c42dff092f9933d734ae` — high-activity volume wallet, about `$662K`, includes HYPE/SOL/LINK/WLFI.

Aster caveat:
- Aster privacy mode means this is visible/indexed flow only.
- Official Aster leaderboard appears to require wallet connect and only includes Pro trading accounts above `$1,000` balance.
- Do not deposit funds just to unlock Aster yet. Public AsterScan data is enough to test whether the feed is worth productizing.

## Latest Hyperliquid / Market Reads

Data source:
- DB: `/Users/corbinpaulson/hl-intel/hl_intel.db`
- Log: `/Users/corbinpaulson/hl-intel/hl_intel.log`

Scanner caveat:
- Hyperliquid API occasionally hit 429 bursts.
- Some lower-priority snapshots can be stale.
- Main reads are still useful, but freshness should be checked before public claims.

### HYPE

Recent tracked ranked-wallet book:
- HYPE long: about `$17.9M`, about `+$1.5M` uPnL.
- HYPE short: about `$22.2M`, about `-$3.0M` uPnL.

Read:
- HYPE no longer looked like a clean one-sided short skew.
- Shorts remained slightly heavier and carried more pain.
- Good framing: "short side is still carrying more pain while longs are green."

Recent HYPE infographic/post:
- User posted the HYPE whale positioning chart manually.
- Chart read was roughly short notional around 2x long notional at that moment.

### ETH

Important ETH short read:
- Main early ETH short, rank #39 / `0x7fd...`, trimmed from max about 24,585 ETH to about 20,024 ETH.
- Trim was about 18.6% off peak.
- Still roughly `$45M` short.
- uPnL around `+$3.7M`.
- Rank #12 / `0xfc66...` trimmed about 14.6%, still about `$12.4M` short, around `+$0.37M`.
- Rank #30 / `0xa6ee...` trimmed about 31.7%, near breakeven.
- Rank #17 / `0x50b...` trimmed about 37.7%, slightly underwater.
- Rank #26 / `0x320...` added, not trimmed, slightly underwater.

User posted ETH follow-up:

```text
$ETH whale shorts are starting to show different behavior.

The big early short trimmed ~19% from peak size, but still holds roughly $45M short and is up ~$3.7M.

A few later shorts reduced risk near breakeven.

One newer short is still pressing and currently underwater.

Early shorts have cushion. Late shorts do not.

Data only. Not financial advice.
```

Current-ish ETH book from a later query:
- ETH long: about `$59.0M`, about `-$0.2M` uPnL.
- ETH short: about `$108.8M`, about `+$4.1M` uPnL.

Read:
- ETH still had the biggest short skew.
- But quality of risk varied a lot: early shorts had cushion, later shorts did not.

### ZEC

Current-ish tracked ranked wallet read:
- ZEC long: about `$12.3M`, about `-$0.4M` uPnL.
- ZEC short: about `$8.8M`, near flat uPnL.

Read:
- ZEC is active but not clean consensus.
- Main long side was concentrated.
- Useful for Pro/digest and comment replies, but not necessarily a standalone X post unless flow changes.

### NEAR / KAITO

KAITO:
- Fresh exposure was tiny.
- One small VIP short around `$3.1K`.
- Older stale algo rows existed from May 17.
- Not useful right now.

NEAR:
- Fresh short: about 4 wallets, around `$489.7K`, about `-$51.8K` uPnL.
- Fresh long: about 3 wallets, only around `$13.8K`.
- Largest NEAR short: #18 VIP, about `$407.9K`, down about `$44.8K`.
- #22 VIP short: about `$81.4K`, down about `$6.9K`.

Read:
- NEAR has a quiet under-threshold short build.
- Digest-worthy or Pro "below threshold watch" note.
- Not a big public X post unless NEAR starts moving.

### ASTER on Hyperliquid

HL Intel had a notable ASTER perp read:
- ASTER long: about `$131K`
- ASTER short: about `$7.0M`

Largest ASTER shorts:
- #43: about `$4.18M` short, about `+$157K` uPnL.
- #9: about `$1.83M` short, about `+$64K` uPnL.
- #18: about `$717K` short, about `+$27K` uPnL.

Read:
- ASTER is heavily short-skewed in tracked HL wallets.
- Separate this from the AsterScan side tracker, which watches Aster DEX visible flow.

## X / Comment Mining

Current account:
- HL Intel: `@HLIntelFeed`
- User personal account: `Degentrail`

Recent follower:
- `popmasterflex` followed HL Intel.

Recent post that got attention:
- HYPE whale positioning post had at least 17 views early.

Useful comment mining targets found:

1. `@adidogCEO` HYPE/ZEC Aster/Hype Pulse post  
   URL: `https://x.com/adidogCEO/status/2058236699516301374`
   Suggested reply:

```text
Interesting because our ranked-wallet tape is showing the $HYPE / $ZEC split too.

Current tracked book:
$HYPE: ~$22.2M short vs ~$17.9M long
$ZEC: ~$12.3M long vs ~$8.8M short

So HYPE is still slightly short-skewed, but ZEC is not a clean one-way short anymore.
```

2. `@aigmx_agent` HYPE short pain post  
   URL: `https://x.com/aigmx_agent/status/2058202326406779026`
   Suggested reply:

```text
We’re seeing the same pain show up in the ranked-wallet book.

Tracked $HYPE exposure is still slightly heavier short, but the short side is carrying about -$3.0M combined uPnL while longs are up around +$1.5M.

Not all shorts are equal here.
```

3. `@bpaynews` ETH whale loss post  
   URL: `https://x.com/bpaynews/status/2058118958163652760`
   Suggested reply:

```text
The $ETH perp book is getting more interesting.

Tracked ranked wallets are still heavier short: roughly $108.8M short vs $59.0M long.

But the big early short has cushion, while some later shorts are much closer to stress. Different quality of risk across the book.
```

4. `@OnchainLens` ETH/ZEC/HYPE whale thread  
   URL: `https://x.com/OnchainLens/status/2057628123240501574`
   Suggested reply:

```text
This is the exact kind of cross-position behavior worth tracking.

Our current ranked-wallet read:
$ETH still has the biggest short skew.
$HYPE is closer to balanced, but shorts are feeling more pain.
$ZEC has a concentrated long side, led by one large wallet.

The rotation matters more than any single position.
```

General comment-mining approach:
- Do not over-promote.
- Add wallet/perp context under posts already discussing whale behavior.
- Keep replies short, specific, and data-forward.
- User normally reviews drafts first, then says "send em" or "post it."

## Outreach / Sales

Notable response:
- Enri.hl replied "send the page ok."
- User sent the web link.

Offer framing:
- Founder pilot seats at `$29.99/mo`.
- Lead with feed + wallet context + fewer generic alerts.
- Do not oversell dashboard or automation.

Business partner gap notes:
- Personalized watchlists are #1.
- Dashboard/account management later.
- Deeper analytics/history later.
- Better onboarding/pinned Pro guide needed.
- Referral/testimonial/case-study growth levers are important but not first.

## Telegram / Alert System

Recent system changes and ideas:
- Added/considered sender so X posts can also be sent to TG channels.
- Added/considered sidelined whale reactivation alerts.
- Whale-add, confluence, and liquidation repeat filters were tuned to reduce noise.
- Need to watch alert quality over time.

Recurring alert-quality review automation existed:
- Automation id: `review-hl-intel-alert-quality`
- It reviews previous 24h alerts using `/Users/corbinpaulson/hl-intel/hl_intel.db` and `/Users/corbinpaulson/hl-intel/hl_intel.log`.

Health check notes:
- Telegram alerts had gone quiet at one point since 12:37; later checks focused on DB/log health and API 429s.

## Important Paths

GitHub-backed website/product repo:
- `/Users/corbinpaulson/Documents/New project/hl-intel-site`

Live HL Intel scanner:
- `/Users/corbinpaulson/hl-intel`

Live DB:
- `/Users/corbinpaulson/hl-intel/hl_intel.db`

Live log:
- `/Users/corbinpaulson/hl-intel/hl_intel.log`

Aster side tracker:
- `/Users/corbinpaulson/Documents/New project/hl-intel-site/aster-scan-tracker`

## Next Best Moves

1. Merge or PR the AsterScan side tracker branch.
2. Run Aster side tracker 1-2 times/day for a couple days and see if deltas matter.
3. Keep morning X posts focused on strongest HL tape reads: HYPE pain, ETH short quality, ZEC/NEAR under-threshold Pro reads.
4. Build first personalized watchlist spec before dashboard work.
5. Add a lightweight Pro onboarding pinned message.
6. Continue comment mining under whale-flow accounts, especially EyeOnChain, OnchainLens, HYPEconomist, based16z, and Aster/HYPE/ZEC threads.

