# HL Intel Elite Wallet Deep Dive

Generated: 2026-05-19T15:02:53.872Z

Purpose:
- Stress-test the wallets labeled `elite_behavior`.
- Decide whether they are product-grade Pro alert sources or just interesting wallets.
- Separate clean Hyperliquid signal from noisy/misleading data.

## Executive Verdict

1. `0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62` — **Best elite candidate for Pro alerts right now.** Current BTC short has large open profit. Highest-value alert is the unwind: trim, full close, flip, or material add.
2. `0xa3d843b6a057504284006bef6f34a2e9bc80fb6b` — **Interesting but not clean enough for flagship Pro signal yet.** Use as a specialized watch for BTC plus RWA/xyz behavior, not as a clean Hyperliquid directional wallet.

## Wallet Reviews

### A — `0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62`

Verdict:
- Best elite candidate for Pro alerts right now.

Alert thesis:
- Current BTC short has large open profit. Highest-value alert is the unwind: trim, full close, flip, or material add.

Recommended policy:
- Priority A active monitor. Alert only on BTC size change >=10% and >=$25K notional, full close, flip, or uPnL change >=$25K.

Account:
- Tier: whale_mid
- Labels: Bullish, Large Gain, Low DD, Scalper, Sustained Profit, Whale
- First seen: 2026-02-18T17:35:51.468000+00:00
- Last active: 2026-05-19T14:48:28.341040+00:00
- Account value: $418,184
- Free margin: $335,822
- Leverage ratio: 7.88x

Current book:
- BTC S notional $3,307,958, uPnL $214,680, ROE 259.7%, liq 84757.562807

HyperCopy stats:
- 3M: $477,272 PnL, 122.8% ROI, 96.8% win rate, 0.1% max DD, 3788 trades, 2321 closed positions.
- 1M: $48,131 PnL, 12.4% ROI, 88.4% win rate, 0.7% max DD.
- 1W: $0 PnL, 0.0% ROI, 0.0% win rate, 0.0% max DD.

Behavior layer:
- Sortino 30D: 44.99
- MDD 30D: 0.1%
- Consistency 30D: 90.5%
- Data quality: usable
- Source flag: review_pnl_source_mismatch
- PnL curve latest: $477,272
- PnL curve 7D bucket sum: $562
- PnL curve 30D bucket sum: $5,297
- Full curve max drawdown from returned buckets: 0.1% / $329

Recent symbol mix from latest 100 trades:
- BTC: 41 trades, $65,363 notional, realized $0, L/S 0/41

Largest positive PnL buckets:
- 2026-04-09 $1,782 -> curve $405,617
- 2026-04-06 $1,110 -> curve $386,267
- 2026-02-27 $724 -> curve $128,868
- 2026-04-15 $605 -> curve $419,110
- 2026-04-10 $566 -> curve $408,671

Largest negative PnL buckets:
- 2026-05-06 $-34 -> curve $477,272
- 2026-05-05 $-0 -> curve $477,601
- 2026-04-22 $1 -> curve $431,133
- 2026-04-28 $1 -> curve $471,503
- 2026-05-03 $2 -> curve $476,619

Risks:
- Open notional is much larger than account value, so liquidation/position management matters.
- Behavior metrics look excellent, but the old cohort source PnL was stale versus live HyperCopy trader stats.
- Do not sell this as copy-trade instruction; sell it as market-context intelligence.
- source mismatch remains from old cohort file; live trader stats now need to be treated as primary

### B — `0xa3d843b6a057504284006bef6f34a2e9bc80fb6b`

Verdict:
- Interesting but not clean enough for flagship Pro signal yet.

Alert thesis:
- Use as a specialized watch for BTC plus RWA/xyz behavior, not as a clean Hyperliquid directional wallet.

Recommended policy:
- Priority B monitor. Alert only on full close, flip, or major size expansion. Suppress small adds/trims and non-crypto symbol churn.

Account:
- Tier: shark
- Labels: Asymmetric Pro, Bullish, Large Gain, Scalper, Shark, Sustained Profit
- First seen: 2025-11-21T12:39:08.294000+00:00
- Last active: 2026-05-19T14:58:28.124816+00:00
- Account value: $21,415
- Free margin: $-1,495
- Leverage ratio: 10.7x

Current book:
- BTC L notional $229,385, uPnL $-11,290, ROE -49.2%, liq 3356.8891632068

HyperCopy stats:
- 3M: $1,108,324 PnL, 4875.1% ROI, 92.3% win rate, 12.4% max DD, 6058 trades, 2502 closed positions.
- 1M: $1,108,324 PnL, 4875.1% ROI, 92.3% win rate, 12.4% max DD.
- 1W: $419 PnL, 1.8% ROI, 44.7% win rate, 97.3% max DD.

Behavior layer:
- Sortino 30D: 2.6
- MDD 30D: 1.3%
- Consistency 30D: 55.6%
- Data quality: usable_but_sparse
- Source flag: none
- PnL curve latest: $1,108,324
- PnL curve 7D bucket sum: $404
- PnL curve 30D bucket sum: $20,654
- Full curve max drawdown from returned buckets: 1.3% / $14,872

Recent symbol mix from latest 100 trades:
- xyz:SPCX: 13 trades, $232,028 notional, realized $0, L/S 13/0
- BTC: 3 trades, $240,515 notional, realized $0, L/S 3/0
- xyz:CBRS: 2 trades, $930,639 notional, realized $-5,816, L/S 2/0
- xyz:TSLA: 1 trades, $202,916 notional, realized $-9,057, L/S 1/0
- xyz:MSTR: 1 trades, $639,486 notional, realized $6,826, L/S 1/0

Largest positive PnL buckets:
- 2026-05-09 $17,634 -> curve $1,035,838
- 2026-05-12 $8,465 -> curve $1,116,371
- 2026-05-13 $6,826 -> curve $1,123,196
- 2026-05-10 $4,306 -> curve $1,107,920
- 2026-05-05 $78 -> curve $28,233

Largest negative PnL buckets:
- 2026-05-18 $-9,057 -> curve $1,108,324
- 2026-05-15 $-5,816 -> curve $1,117,381
- 2026-05-06 $-1,767 -> curve $64,596
- 2026-05-11 $-15 -> curve $1,107,905
- 2026-05-05 $78 -> curve $28,233

Risks:
- Recent activity includes xyz/RWA symbols, which may be noisy for HL Intel's core crypto audience.
- 1W HyperCopy max drawdown is 97.3%, despite the 30D curve looking controlled.
- Current open book is underwater by $-11,290.
- Current leverage ratio is high at 10.7x.


## Product Decision

- Promote `0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62` as the current flagship elite monitor, but only for BTC position-change intelligence.
- Keep `0xa3d843b6a057504284006bef6f34a2e9bc80fb6b` in Priority B until the RWA/xyz noise and 1W drawdown profile are better understood.
- The most sellable alert right now is not "copy this wallet"; it is "elite BTC short is trimming/exiting/flipping after a large profitable move."
