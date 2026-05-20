# HL Intel Wallet Behavior Metrics

Generated: 2026-05-19T14:59:00.286Z

## Method

This adds a Yonathan-style behavior layer to the existing HL Intel wallet candidates.

Inputs:
- `hl-intel-viable-wallet-deep-review.csv`
- `hl-intel-asymmetric-watch-review.csv`

Data source:
- HyperCopy `/api/trader/{address}/pnl-chart?period=3M`

Metrics:
- Guarded 30D PnL-curve returns.
- 30D Sortino.
- 30D max drawdown.
- 30D profitable-bucket consistency.
- 30D recovery ratio.
- 60D peak drawdown.
- Idle bucket count.
- Recent 24h/2-bucket crash check.

Important caveat:
- This uses cumulative PnL-curve data, not full equity-curve data. Returns are guarded with a $1,000 denominator floor to avoid near-zero PnL distortion.
- HyperCopy often returns sparse daily buckets, so `data_quality` matters.
- `source_conflict_flag` is set when the PnL curve materially disagrees with the screener/review total PnL. Treat those wallets as data-review candidates before productizing alerts.

## Tier Counts

- elite_behavior: 2
- asymmetric_behavior: 4
- risk_watch: 1
- high_risk_behavior: 6
- low_pnl_unproven: 2
- incomplete_data: 4

## Best Current Behavior Candidates

1. `0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62` — A/elite_behavior; PnL curve $477,272; Sortino 44.99; 30D MDD 0.1%; consistency 90.5%. Strong Sortino, controlled drawdown, and high profitable-bucket consistency.
2. `0xa3d843b6a057504284006bef6f34a2e9bc80fb6b` — B/elite_behavior; PnL curve $1,108,324; Sortino 2.6; 30D MDD 1.3%; consistency 55.6%. Strong Sortino, controlled drawdown, and high profitable-bucket consistency.
3. `0x86149addc2ebeb610d2630b07cbfea5c19fa690e` — A/asymmetric_behavior; PnL curve $114,625; Sortino 35.15; 30D MDD 10.8%; consistency 87.5%. Lower win-rate/payoff-style wallet with strong guarded PnL curve behavior.
4. `0x6d7823cd5c3d9dcd63e6a8021b475e0c7c94b291` — B/asymmetric_behavior; PnL curve $414,759; Sortino 9.99; 30D MDD 0.0%; consistency 77.8%. Lower win-rate/payoff-style wallet with strong guarded PnL curve behavior.
5. `0xd2147a366e335b89b68ace628923962393b56813` — B/asymmetric_behavior; PnL curve $70,533; Sortino 12.72; 30D MDD 2.8%; consistency 81.8%. Lower win-rate/payoff-style wallet with strong guarded PnL curve behavior.
6. `0xe3c1447b94c5b278d9ec8d24855f5a5a2788542b` — C/asymmetric_behavior; PnL curve $74,039; Sortino 4.41; 30D MDD 18.1%; consistency 50.0%. Lower win-rate wallet still shows positive curve behavior and controlled drawdown.

## Watch / Risk Candidates

1. `0x2cef0a7f84e722c77b271862da5fe2387028fa20` — B/risk_watch; PnL curve $56,675; Sortino 0.36; 30D MDD 41.8%; consistency 50.0%. Recent crash or drawdown is too large for clean signal use.
2. `0xf3362789cecf25c6a31288d172880d7ad9b81801` — A/high_risk_behavior; PnL curve $193,893; Sortino -0.71; 30D MDD 42.1%; consistency 40.0%. Sortino <= 0
3. `0x143c28ae5b8642f58c98b8a6f82a0f314d23f6ab` — B/high_risk_behavior; PnL curve $712,954; Sortino 0; 30D MDD 0.0%; consistency 80.0%. Sortino <= 0
4. `0x83b1385d8126ecf64bfb3b4254d67eb9db753bcc` — B/high_risk_behavior; PnL curve $112,191; Sortino -0.67; 30D MDD 30.7%; consistency 50.0%. Sortino <= 0
5. `0x197d1d1127b1a1da550f089375369d5acfeb0c72` — B/high_risk_behavior; PnL curve $85,009; Sortino -1.95; 30D MDD 0.8%; consistency 0.0%. Sortino <= 0
6. `0x408d807d1dbb778f59a9c088e56d4c27bdd362ac` — B/high_risk_behavior; PnL curve $77,965; Sortino -0.11; 30D MDD 11.2%; consistency 50.0%. Sortino <= 0
7. `0x48b4c67ff2ba52157604efac6cb4024fd8a6f44a` — B/high_risk_behavior; PnL curve $10,053; Sortino 9.99; 30D MDD 86.4%; consistency 92.3%. 30D MDD >= 50%; 60D peak drawdown >= 50%

## Full Table

| Tier | Pri | Address | Source | PnL Curve | Sortino | 30D MDD | Consistency | Data |
|---|---:|---|---|---:|---:|---:|---:|---|
| elite_behavior | A | `0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62` | strict_viable / source mismatch | $477,272 | 44.99 | 0.1% | 90.5% | usable |
| elite_behavior | B | `0xa3d843b6a057504284006bef6f34a2e9bc80fb6b` | strict_viable | $1,108,324 | 2.6 | 1.3% | 55.6% | usable_but_sparse |
| asymmetric_behavior | A | `0x86149addc2ebeb610d2630b07cbfea5c19fa690e` | asymmetric_watch | $114,625 | 35.15 | 10.8% | 87.5% | usable |
| asymmetric_behavior | B | `0x6d7823cd5c3d9dcd63e6a8021b475e0c7c94b291` | asymmetric_watch | $414,759 | 9.99 | 0.0% | 77.8% | usable |
| asymmetric_behavior | B | `0xd2147a366e335b89b68ace628923962393b56813` | asymmetric_watch / source mismatch | $70,533 | 12.72 | 2.8% | 81.8% | usable |
| asymmetric_behavior | C | `0xe3c1447b94c5b278d9ec8d24855f5a5a2788542b` | asymmetric_watch | $74,039 | 4.41 | 18.1% | 50.0% | usable_but_sparse |
| risk_watch | B | `0x2cef0a7f84e722c77b271862da5fe2387028fa20` | asymmetric_watch | $56,675 | 0.36 | 41.8% | 50.0% | usable_but_sparse |
| high_risk_behavior | A | `0xf3362789cecf25c6a31288d172880d7ad9b81801` | strict_viable | $193,893 | -0.71 | 42.1% | 40.0% | sparse_recent_curve |
| high_risk_behavior | B | `0x143c28ae5b8642f58c98b8a6f82a0f314d23f6ab` | strict_viable | $712,954 | 0 | 0.0% | 80.0% | sparse_recent_curve |
| high_risk_behavior | B | `0x83b1385d8126ecf64bfb3b4254d67eb9db753bcc` | asymmetric_watch / source mismatch | $112,191 | -0.67 | 30.7% | 50.0% | usable |
| high_risk_behavior | B | `0x197d1d1127b1a1da550f089375369d5acfeb0c72` | asymmetric_watch | $85,009 | -1.95 | 0.8% | 0.0% | usable |
| high_risk_behavior | B | `0x408d807d1dbb778f59a9c088e56d4c27bdd362ac` | asymmetric_watch | $77,965 | -0.11 | 11.2% | 50.0% | usable_but_sparse |
| high_risk_behavior | B | `0x48b4c67ff2ba52157604efac6cb4024fd8a6f44a` | asymmetric_watch / source mismatch | $10,053 | 9.99 | 86.4% | 92.3% | usable_but_sparse |
| low_pnl_unproven | A | `0x613ead0ea5af374af0ccfc117ef116a8e8d133fe` | asymmetric_watch / source mismatch | $-18,198 | -1.1 | 0.0% | 28.6% | usable_but_sparse |
| low_pnl_unproven | B | `0xa4add8273d7f47318675bdfbcce3e9648cdb4509` | strict_viable / source mismatch | $-451,610 | 2.78 | 0.0% | 62.5% | usable_but_sparse |
| incomplete_data | A | `0xbb9f0315243db63fc34c51f96ad5bb7ce6e275e2` | strict_viable | $170,448 | 0 | 0.0% | 33.3% | incomplete_lt_7_points |
| incomplete_data | A | `0xac82b3772ca54a154092e27109f61a31a6d743a5` | asymmetric_watch | $165,064 | n/a | 0.0% | 100.0% | incomplete_lt_7_points |
| incomplete_data | B | `0x031f72deb03c509af42624ddcd1f63fce5ecb220` | strict_viable / source mismatch | $151,994 | 9.99 | 0.0% | 50.0% | incomplete_lt_7_points |
| incomplete_data | B | `0x837686cfda8a79adfb8465d39240c54166bf9a1e` | asymmetric_watch / source mismatch | $-442,729 | 4.75 | 0.0% | 50.0% | incomplete_lt_7_points |
