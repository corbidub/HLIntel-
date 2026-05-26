# Hyperdash Pilot Candidate Review

Generated: 2026-05-25 11:52 CDT

Source files:
- `launch/hyperdash-noteworthy-wallet-review.md`
- `launch/hyperdash-very_profitable-wallets.json`
- Existing HL Intel cross-check files under `launch/hl-intel-*.csv` and `launch/hypercopy-*.csv`

Scope: 13 `pilot_candidate` wallets from the Hyperdash `very_profitable` cohort.

## Decision Summary

- Promote now: 4 wallets
- Promote with filters: 5 wallets
- Watch only / provisional: 4 wallets
- Reject for pilot feed: 0 wallets

The first launch feed should favor readable, concentrated books with meaningful notional and clear alert triggers. Avoid tiny notional, weak historical stats, and wallets whose best signal is mostly macro/custom exposure.

## Promote Now

### 1. `0xf00bb08f7d1d04a9415408c939c02410fc6791b1`

- Snapshot: $1.81M equity, $2.10M notional, 1.16x book/equity, copy score 75.8.
- Positions: BTC long $1.16M, HYPE long $934K.
- Open uPnL: +$224.8K, mostly from HYPE.
- Why promote: clean two-asset book, meaningful size, strong open profit, no custom/noisy markets.
- Alert lane: flagship active wallet.
- Alert on: BTC/HYPE add, trim, full exit, flip, or HYPE uPnL compression.
- Risk: HYPE profit is already large; do not frame adds as blindly followable.

### 2. `0xaede390f5b5b7cf77428030ccfc73d99a44e1602`

- Snapshot: $408K equity, $785K notional, 1.92x book/equity, copy score 81.6.
- Positions: HYPE long $785K.
- Open uPnL: -$1.5K.
- Why promote: single clean HYPE exposure with high copy score and current activity.
- Alert lane: HYPE directional watch.
- Alert on: HYPE add, trim, full exit, flip, or fast move into large unrealized loss.
- Risk: one-token wallet; value depends on HYPE relevance.

### 3. `0x12f5f5ce07647f5e7bf9ea054ea119d1cbb85a9b`

- Snapshot: $542K equity, $709K notional, 1.31x book/equity, copy score 73.3.
- Positions: HYPE long $709K.
- Open uPnL: +$23.5K.
- Why promote: clean one-token HYPE book with enough size to matter.
- Alert lane: HYPE directional watch.
- Alert on: HYPE add, trim, full exit, flip, or uPnL compression.
- Risk: needs page check for stale behavior; last trade in snapshot was 2026-05-23.

### 4. `0xe25173b3558e8644d719f2cd3095dccbf5efeaba`

- Snapshot: $616K equity, $1.69M notional, 2.74x book/equity, copy score 86.1.
- Positions: BTC long $1.55M, BCH long $140K.
- Open uPnL: +$30.1K.
- Why promote: highest copy score in the pilot set, clean majors exposure, meaningful BTC size.
- Alert lane: BTC major watch.
- Alert on: BTC add, trim, full exit, flip, or leverage expansion.
- Risk: 92% concentrated in BTC and last trade in snapshot was 2026-05-21, so confirm it is not stale before live alerts.

## Promote With Filters

### 5. `0x3005fade4c0df5e1cd187d7062da359416f0eb8e`

- Snapshot: $766K equity, $936K notional, 1.22x book/equity, copy score 74.9.
- Positions: HYPE long $318K, PENDLE long $296K, ETH long $180K, ZEC long $142K.
- Open uPnL: +$53.2K; ETH leg is underwater by $71.5K.
- Use: good multi-token crypto watch.
- Alert on: HYPE/PENDLE/ZEC adds, trims, exits, or ETH recovery/unwind.
- Risk: last trade in snapshot was 2026-05-15; promote only if address page confirms current behavior remains live.

### 6. `0x7083a8e36b44865c8d40379502bc081259a0ba66`

- Snapshot: $910K equity, $491K notional, 0.54x book/equity, copy score 75.1.
- Positions: HYPE long $397K, ZEC long $94K.
- Open uPnL: -$10.2K.
- Use: clean HYPE/ZEC filter watch.
- Alert on: HYPE or ZEC add, trim, full exit, or flip.
- Risk: less urgent than the larger HYPE wallets; keep thresholded to avoid low-signal drift alerts.

### 7. `0x6f83ab8890ed38bf38a31010aa9a5e9ca743bfad`

- Snapshot: $609K equity, $361K notional, 0.59x book/equity, copy score 75.0.
- Positions: BTC short $207K, ETH short $152K, tiny HYPE long.
- Open uPnL: -$7.2K.
- Use: clean bearish majors watch.
- Alert on: BTC/ETH add, trim, full exit, or flip.
- Risk: current PnL is not strong; valuable mostly as positioning contrast.

### 8. `0x031f72deb03c509af42624ddcd1f63fce5ecb220`

- Snapshot: $782K equity, $1.21M notional, 1.55x book/equity, copy score 73.2.
- Positions: xyz:SP500 long $907K, ZEC long $262K, HYPE long $44K.
- Open uPnL: +$192.9K.
- Existing HL Intel overlap: yes. Prior review marked it as an active monitor with readable ZEC exposure, but earlier book was much smaller.
- Use: filtered ZEC/HYPE watch plus separate macro note if SP500 changes.
- Alert on: ZEC add/trim/exit, HYPE add/trim/exit, SP500 only if we are running a macro/RWA lane.
- Risk: most notional is now custom SP500 exposure, so do not treat the whole wallet as pure crypto alpha.

### 9. `0xb14d1598dbfeaec11bae2a382b29adfcab9e8560`

- Snapshot: $448K equity, $733K notional, 1.64x book/equity, copy score 71.3.
- Positions: SOL short $733K.
- Open uPnL: +$5.3K.
- Use: clean single-asset bearish SOL signal, useful because it diversifies beyond HYPE/BTC longs.
- Alert on: SOL add, trim, full exit, or flip long.
- Risk: old Hypercopy audit showed negative 3M PnL and low win rate, so treat as context-first instead of trusted alpha.

## Watch Only / Provisional

### 10. `0x2d90a9f21faa49bd7ea4cac60aee16fb22d44d99`

- Snapshot: $714K equity, $217K notional, 0.30x book/equity, copy score 71.6.
- Positions: HYPE long $95K, ZEC long $87K, LIT long $34K.
- Open uPnL: -$6.2K.
- Decision: watch only until position size or behavior improves.
- Reason: clean but small and currently underwater.

### 11. `0x27d33e77c8e6335089f56e399bf706ae9ad402b9`

- Snapshot: $1.63M equity, $101K notional, 0.06x book/equity, copy score 74.5.
- Positions: ZEC long $101K.
- Open uPnL: +$540.
- Existing cross-check: old Hypercopy audit showed low win rate and 100% max drawdown flag.
- Decision: watch only, not pilot alert feed.
- Reason: current exposure is too small relative to equity and historical stats are weak.

### 12. `0xcb02837caaee310c178501855b63bf7f4f4b1f8b`

- Snapshot: $929K equity, $10K notional, 0.01x book/equity, copy score 85.8.
- Positions: HMSTR long $10K.
- Open uPnL: +$63.
- Decision: watch only / reactivation-style alert.
- Reason: high copy score, but current position is too small for a paid pilot signal.

### 13. `0x69b05701f8175c276ecd0138387a197948e240bb`

- Snapshot: $1.24M equity, $374K notional, 0.30x book/equity, copy score 79.3.
- Positions: HYPE long $374K.
- Open uPnL: +$83.7K.
- Decision: watch only until fresh activity appears.
- Reason: attractive HYPE profit, but last trade in snapshot was 2026-05-20 and the setup overlaps with stronger HYPE candidates.
- Revisit if: fresh add, trim, or full exit appears.

## First Pilot Watchlist Draft

Start with these four as the first live promotion batch:

1. `0xf00bb08f7d1d04a9415408c939c02410fc6791b1` - BTC/HYPE flagship.
2. `0xaede390f5b5b7cf77428030ccfc73d99a44e1602` - HYPE active directional watch.
3. `0x12f5f5ce07647f5e7bf9ea054ea119d1cbb85a9b` - HYPE directional watch.
4. `0xe25173b3558e8644d719f2cd3095dccbf5efeaba` - BTC major watch, pending stale check.

Add these five as filtered secondary pilot watches:

1. `0x3005fade4c0df5e1cd187d7062da359416f0eb8e` - HYPE/PENDLE/ZEC filtered watch.
2. `0x7083a8e36b44865c8d40379502bc081259a0ba66` - HYPE/ZEC filtered watch.
3. `0x6f83ab8890ed38bf38a31010aa9a5e9ca743bfad` - BTC/ETH bearish majors watch.
4. `0x031f72deb03c509af42624ddcd1f63fce5ecb220` - existing-overlap ZEC/HYPE watch with SP500 separated.
5. `0xb14d1598dbfeaec11bae2a382b29adfcab9e8560` - SOL bearish watch, context-first.

## Alert Thresholds For Pilot

- One-asset wallets: alert on position size change >= 15%, full close, or direction flip.
- Multi-asset wallets: alert on top-token size change >= 20%, new asset over $100K notional, full exit, or direction flip.
- Profit-compression alert: send only when unrealized PnL compresses by at least 35% from the captured snapshot and the position remains open.
- Stale-wallet rule: if no fresh trade is visible after manual page check, keep in watchlist but do not send intro alert.
- Custom-market rule: keep `xyz:`, `cash:`, `vntl:`, `km:`, and `flx:` markets out of the core crypto alert unless explicitly running a macro/RWA lane.
