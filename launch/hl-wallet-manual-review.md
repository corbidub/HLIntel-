# HL Intel Manual Wallet Review

Local research only. This is not website copy.

## Manual Review Rule Update

The first statistical filter is not enough.

Several wallets with strong positive 3M PnL, high accuracy, and low reported drawdown currently show large underwater open positions. For HL Intel, those wallets should not all be treated as clean "smart money" sources.

Use three buckets:

- `watch`: clean or inactive profiles worth tracking for new meaningful exposure.
- `monitor`: useful because current exposure is important, but not clean enough to present as a simple quality wallet.
- `exclude_or_risk_only`: too ugly for the clean feed; only useful for liquidation/risk event monitoring.

## Best Clean Watch Candidates

### `0x143c28ae5b8642f58c98b8a6f82a0f314d23f6ab`

- 3M PnL: `+$876.6K`
- Accuracy: `91.1%`
- Trades: `1,824`
- Drawdown: `-0.2%`
- Current open positions: none
- Recent behavior: focused mostly on `xyz:MU`, with small `HYPE`
- Verdict: `watch`

This is the cleanest reactivation watch. Alert if it opens a new meaningful position.

### `0x69cc3ae720efdff1cd2a8edec79a7a3fac6e14fd`

- 3M PnL: `+$805.7K`
- Accuracy: `99.9%`
- Trades: `2,105`
- Drawdown: `-0.0%`
- Current open positions: none visible
- Recent behavior: no recent trades visible in captured profile
- Verdict: `watch_if_reactivates`

Clean stats, but inactive. Keep it on the watchlist, lower priority until it wakes up.

## Useful Risk Monitors

### `0x06cecfbac34101ae41c88ebc2450f8602b3d164b`

- 3M PnL: `+$5.63M`
- Accuracy: `97.2%`
- Trades: `701`
- Drawdown: `-0.0%`
- Current open positions: six shorts across `SOL`, `HYPE`, `MON`, `BTC`, `ETH`, `AAVE`
- Verdict: `monitor`

Good candidate for basket-change alerts. Do not send every fill. Watch for major adds, reductions, flips, or unwind events.

### `0xfd423284f6a9c73a2a3d53cab8921d6533533d97`

- 3M PnL: `+$2.53M`
- Accuracy: `100.0%`
- Trades: `890`
- Drawdown: `-0.0%`
- Current open positions: large `ETH` long, about `-$1.48M` unrealized
- Verdict: `monitor`

Useful risk monitor, not clean signal source until the ETH position resolves.

### `0xa875890465da20062bcf3b024bf7d54e69c725a8`

- 3M PnL: `+$1.93M`
- Accuracy: `100.0%`
- Trades: `729`
- Drawdown: `-0.0%`
- Current open positions: large `ETH` long, about `-$3.29M` unrealized
- Verdict: `monitor`

Very focused ETH builder. Good for position-change and risk alerts, not generic "follow this wallet" framing.

## Needs More Review

### `0xa3d843b6a057504284006bef6f34a2e9bc80fb6b`

- 3M PnL: `+$1.11M`
- Accuracy: `92.3%`
- Trades: `2,502`
- Drawdown: `-12.4%`
- Current open positions: small `BTC` long underwater
- Recent behavior: `xyz:TSLA`, `xyz:CBRS`, `xyz:MSTR`, `BTC`
- Verdict: `review`

The numbers are acceptable, but the behavior may be too multi-asset and non-crypto-heavy for HL Intel. Review whether `xyz` markets should be excluded from Pro alerts.

## Exclude From Clean Feed

### `0x9c89f595f5515609ad61f6fda94beff85ae6600e`

- 3M PnL: `+$1.71M`
- Accuracy: `100.0%`
- Trades: `2,375`
- Drawdown: `-0.0%`
- Current open positions: `SOL` and `DYDX` longs with extremely ugly unrealized losses
- Verdict: `exclude_or_risk_only`

Historical stats look clean, but current exposure is too ugly. Use only if we build a liquidation/risk-events module.

## Product Implication

The useful product is not "top PnL wallets."

The useful product is:

1. Find statistically strong wallets.
2. Reject wallets with ugly current exposure.
3. Split clean reactivation watches from risk monitors.
4. Send alerts only when the wallet does something meaningful enough to review.

This is the wedge: filtered wallet context, not blind smart-money tracking.
