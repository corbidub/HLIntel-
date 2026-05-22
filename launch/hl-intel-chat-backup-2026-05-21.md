# HL Intel Chat Backup - 2026-05-21

This file captures the current working state from the Codex thread so the business, website, X/content work, and system-tuning context can be recovered outside the chat.

## Current Positioning

HL Intel is a Telegram-first behavioral wallet intelligence feed for Hyperliquid traders.

It is not a trade-call product, copy-trading product, custody product, or automated execution product.

Core framing:
- Ranked wallet moves.
- Real perp context.
- Track what important wallets do after the headline: add, trim, exit, flip, hedge, align in confluence, or move toward liquidation pressure.
- Public X voice: analytical, data-first, not dunking, not hype-only.

## Live Surface

- Website: https://hyperliquidintel.com
- `www` domain: added to Vercel and now has a valid SSL certificate.
- X: https://x.com/HLIntelFeed
- Free Telegram: https://t.me/HLIntel
- Pro Telegram: LaunchPass-gated at $29.99/mo.
- LaunchPass: https://www.launchpass.com/goonboi/launchpass-com-hlintelpro

## Website State

Repo:
- `/Users/corbinpaulson/Documents/New project/hl-intel-site`
- GitHub remote: `git@github.com:corbidub/HLIntel-.git`

Already pushed live:
- X link added to nav and footer.
- Perp positioning language added.
- HYPE-PERP confluence sample added.
- LaunchPass URLs moved to `www.launchpass.com`.
- CSS/JS cache-busted with `?v=20260521-perp`.

Pending local copy edits at the time of this backup:
- Hero headline changed to: `Ranked wallet moves. Real perp context.`
- Founder pilot section changed to:
  - Heading: `Start where the signal is: the feed.`
  - Body: `Early Pro is intentionally focused: filtered Telegram alerts with ranked-wallet context, confluence reads, liquidation-pressure notes, and a weekly digest of the cleanest moves. No dashboard bloat. No trade automation. Just faster review when perp positioning changes.`

## Product Decisions

Discord:
- Do not launch a public Discord yet.
- Keep the core funnel simple: X discovery -> Free TG proof -> Pro TG paid feed.
- Possible later version: small private Alpha Council for 10-20 high-signal traders/prospects.

Additional markets:
- Wait on pushing "additional markets" as a major update until more traction and interested prospects appear on X.

Paid boost:
- Do not run paid X boost yet.
- Current traction should come from X replies/comment mining and proof posts.

## Current X / Content Lane

Strongest public angle:
- Spot/news headline is one layer.
- Perp behavior is the useful layer.
- Read whether ranked wallets are defending, hedging, adding, trimming, flipping, or getting squeezed.

Recent useful reply:
- DeepBlueAlpha reply: https://x.com/HLIntelFeed/status/2057649337287499816
- Alex/Loracle reply: https://x.com/HLIntelFeed/status/2057653072839467419

DeepBlueAlpha replied "Well said" to the HL Intel reply, which is a small but meaningful validation signal.

Follower note:
- `popmasterflex` followed HL Intel after FARTCOIN/perp-adjacent comment mining.
- Recommendation: do not DM immediately. Watch for a future FARTCOIN/perp/rotation post and reply fast with data context.

## Notable Existing X Posts

- HYPE chart proof: https://x.com/HLIntelFeed/status/2057432418684895486
- HYPE whale exposure: https://x.com/HLIntelFeed/status/2057462916639539206
- HYPE short max pain: https://x.com/HLIntelFeed/status/2057464905758810609
- FARTCOIN behavior shift latest/edited: https://x.com/HLIntelFeed/status/2057610086793560431

## Runtime / Bot Context

Live bot folder:
- `/Users/corbinpaulson/hl-intel`

Important files:
- DB: `/Users/corbinpaulson/hl-intel/hl_intel.db`
- Log: `/Users/corbinpaulson/hl-intel/hl_intel.log`
- Scanner: `/Users/corbinpaulson/hl-intel/engine/scanner.py`
- Formatter: `/Users/corbinpaulson/hl-intel/alerts/formatter.py`
- Pro guide: `/Users/corbinpaulson/hl-intel/assets/USER_GUIDE_PRO.md`

Note:
- `/Users/corbinpaulson/hl-intel` is not currently a git repository, so runtime code is not directly pushed to GitHub from that folder.
- The public GitHub repo currently tracks the website and launch materials.

Recent bot feature added locally:
- Pro-only Whale Stress Watch.
- Purpose: promote whale-add events when a ranked wallet adds into unrealized loss/liquidation pressure.
- Relevant thresholds in scanner:
  - `WHALE_STRESS_MIN_UNREALIZED_LOSS_USD = 500_000`
  - `WHALE_STRESS_MIN_LOSS_PCT_OF_POSITION = 5.0`
  - `WHALE_STRESS_LIQ_DISTANCE_WATCH_PCT = 30.0`
- Bot was restarted successfully after this change.

## Latest Alert / Data Patterns Reviewed

24h alert quality snapshot:
- `whale_add`: 94 total / 88 exact unique.
- `confluence`: 73 total / 28 exact unique.
- `whale`: 59 total / 32 exact unique.
- `liquidation`: 28 total / 7 exact unique.
- `oi_surge`: 19 total / 8 exact unique.

Main remaining noise pattern:
- Repeated stable states rather than random spam.
- Same FARTCOIN/PUMP/PAXG "new whale" events can re-alert.
- Same confluence states can re-alert when the wallet count/side is unchanged.
- Same BTC/ETH liquidation danger states can repeat for the same wallet.

Useful current market/product patterns:
- HYPE remains the strongest X content lane.
- HYPE short notional is heavier than long notional in ranked wallets, with shorts carrying meaningful unrealized pain.
- FARTCOIN remains a good secondary lane: ranked shorts still dominate, but first meaningful long-side add appeared.
- ZEC long confluence appeared recently and may be worth watching, but HYPE has better public attention.
- OI outliers recently include GRASS, ALGO, NEAR, NIL, PENGU, BOME, DOGE, PURR, XPL, and LIT.

System tuning recommendations from review:
- Add stronger cooldown for repeated whale-new alerts when the same address/coin/side remains open with no material notional change.
- For confluence alerts, require one of:
  - wallet count change,
  - combined notional change beyond threshold,
  - side flip,
  - fresh ranked wallet entering the cluster.
- For liquidation alerts, repeat only when distance-to-liq materially tightens or crosses a severity boundary.
- Consider a daily "state still active" digest instead of repeated intraday re-alerting for unchanged confluence/liquidation states.
- Add query helper/materialized latest-position table if deeper analytics keep getting slow on the 2.9M-row position table.

## Near-Term Plan

1. Push the pending website copy edits.
2. Keep comment mining on HYPE/Loracle/perp-pressure lanes.
3. Watch for popmasterflex or DeepBlueAlpha follow-up opportunities.
4. Turn the repeat/noise findings into scanner filter changes.
5. Consider making `/Users/corbinpaulson/hl-intel` a proper Git repo or migrating runtime code into the GitHub repo, excluding `.env`, DB, logs, and generated media.

