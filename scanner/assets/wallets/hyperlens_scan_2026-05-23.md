# HyperLens Wallet Scan — 2026-05-23

## Added To Watch

| Address | Label | Why |
| --- | --- | --- |
| `0xed48b856556a69c7c40229c9c4c829b909257c9b` | `watch` | Best new alpha candidate from scan: 7D +$580K, 30D +$906K, profit factor ~177.8, no liquidation frequency. Watch ETH/HYPE follow-through. |
| `0x72774e2fe1992d5da8c6e9cef73fd2ab980c0b98` | `stress_watch` | Large stressed ETH/SOL/HYPE short book with recent forced-close/liquidation behavior. Useful as liquidation/stress tape, not as alpha. |
| `0x020ca66c30bec2c4fe3861a94e4db4a498a35872` | `stress_watch` | Heavy losing long-side stress: 7D -$1.2M, 30D -$2.7M, high liquidation frequency. Watch ETH/BTC/HYPE stress. |
| `0xfb2986b5d3e5604a90396e83a1fedebd768c21dd` | `stress_watch` | Repeated liquidations with HIP-3 exposure: major xyz:BRENTOIL loss, some HYPE wins. Useful for stress/liquidation context. |

## Set Aside For Now

| Address | Reason |
| --- | --- |
| `0x86523927bffeafe2e532f0218feb1f3c29f6120d` | Big 7D PnL, but repeat liquidation history makes the signal messy until we see cleaner current positioning. |
| `0x66f4...8836` | Not enough clean edge from the first pass. |
| `0xba99...022e` | Not enough clean edge from the first pass. |

## Implementation Note

The live scanner now includes `watch`, `stress_watch`, and `vip` labels in its position fetch set even if those wallets are outside the current top-50 leaderboard. Confluence remains top-50-only so the public/top-wallet narrative does not get diluted.
