# HL Intel Asymmetric Wallet Deep Dive

Generated: 2026-05-19T15:49:18.956Z

Scope:
- `asymmetric_watch`, `review`, and `risk_watch` buckets from `hl-intel-asymmetric-wallet-candidates.csv`.
- Excludes lower-quality `hold` wallets.

Purpose:
- Find lower-win-rate or payoff-skewed wallets that fit the buyer-requested workflow:
  - rank wallets by risk-adjusted quality, PnL, and account size
  - filter by token
  - alert on entry, exit, flip, and meaningful position changes

Important caveat:
- HyperCopy recent trade data often has sparse/non-realized PnL fields. `recent payoff sample` is useful when populated, but not enough by itself to prove expectancy.

## Readiness Counts

- custom_watch_candidate: 5
- payoff_validation_needed: 11
- data_conflict_review: 4
- risk_reject: 7

## Curated Candidates

None.


## Custom Watch Candidates

1. `0x86149addc2ebeb610d2630b07cbfea5c19fa690e` — custom_watch_candidate/custom_token_watch
   - Stats: $110,980 PnL, 134.9% ROI, 79.0% win, 11.6% DD, 2595 closed
   - Behavior: asymmetric_behavior, Sortino 35.15, MDD 10.8%, data usable
   - Recent payoff sample: 24 realized trades, win 66.7%, payoff 0.6, PF 1.19
   - Current: ZEC S $42,618 uPnL $243 liq 4311.4411540683
   - Clean tokens: BTC, HYPE, ETH, TAO, SOL, DOGE, ZEC
   - Policy: Alert only for user-selected tokens: BTC, HYPE, ETH, TAO, SOL, DOGE.
   - Risk: leverage ratio 10.3x; trade-level payoff not confirmed from recent sample

2. `0xbf1e78fcd3b89a8a3375e68a11a2e7412f24f2af` — custom_watch_candidate/custom_token_watch
   - Stats: $146,966 PnL, 168.3% ROI, 49.7% win, 10.8% DD, 2213 closed
   - Behavior: not scored, Sortino n/a, MDD n/a, data n/a
   - Recent payoff sample: 10 realized trades, win 30.0%, payoff 4.17, PF 1.79
   - Current: BTC S $80,058 uPnL $-33 liq 401656.2854017949
   - Clean tokens: BTC, ETH, HYPE; noisy/custom: xyz:CBRS
   - Policy: Alert only for user-selected tokens: BTC, ETH, HYPE.
   - Risk: noisy/custom symbols xyz:CBRS; leverage ratio 10.12x; open uPnL $-33; trade-level payoff not confirmed from recent sample

3. `0x1fec14331b8a1d1af202fe71e99c7f1c552a9140` — custom_watch_candidate/custom_token_watch
   - Stats: $40,079 PnL, 50.6% ROI, 49.4% win, 9.9% DD, 504 closed
   - Behavior: not scored, Sortino n/a, MDD n/a, data n/a
   - Recent payoff sample: 37 realized trades, win 62.2%, payoff 0.52, PF 0.86
   - Current: no open positions
   - Clean tokens: BTC, SOL
   - Policy: Alert only for user-selected tokens: BTC, SOL.
   - Risk: leverage ratio 13.73x; trade-level payoff not confirmed from recent sample

4. `0xeebd3f1efe690a690668be1c20d1471fe9c3966d` — custom_watch_candidate/custom_token_watch
   - Stats: $49,790 PnL, 24.4% ROI, 52.2% win, 9.2% DD, 1495 closed
   - Behavior: not scored, Sortino n/a, MDD n/a, data n/a
   - Recent payoff sample: 98 realized trades, win 33.7%, payoff 1.81, PF 0.92
   - Current: no open positions
   - Clean tokens: STBL
   - Policy: Alert only for user-selected tokens: STBL.
   - Risk: trade-level payoff not confirmed from recent sample

5. `0xed48b856556a69c7c40229c9c4c829b909257c9b` — custom_watch_candidate/custom_token_watch
   - Stats: $178,435 PnL, 15.3% ROI, 41.8% win, 12.5% DD, 1557 closed
   - Behavior: not scored, Sortino n/a, MDD n/a, data n/a
   - Recent payoff sample: 3 realized trades, win 0.0%, payoff 0, PF 0
   - Current: ETH S $6,419,473 uPnL $634,052 liq 2616.0933902423; BTC L $1,912,825 uPnL $-94,072 liq 12877.3188570328
   - Clean tokens: BTC, ETH
   - Policy: Alert only for user-selected tokens: BTC, ETH.
   - Risk: trade-level payoff not confirmed from recent sample


## Reactivation Candidates

None.


## Needs Payoff / Data Validation

1. `0x6d7823cd5c3d9dcd63e6a8021b475e0c7c94b291` — payoff_validation_needed/research_only
   - Stats: $414,759 PnL, 7897.8% ROI, 65.9% win, 7.5% DD, 1266 closed
   - Behavior: asymmetric_behavior, Sortino 9.99, MDD 0.0%, data usable
   - Recent payoff sample: 11 realized trades, win 100.0%, payoff 0, PF 99
   - Current: no open positions
   - Clean tokens: none; noisy/custom: @272, xyz:MSTR, @107, xyz:CRWV, xyz:COIN
   - Policy: Do not alert yet. Need cleaner token history, stronger behavior tier, or confirmed payoff sample.
   - Risk: no clean recurring token set; trade-level payoff not confirmed; behavior tier asymmetric_behavior

2. `0xe3c1447b94c5b278d9ec8d24855f5a5a2788542b` — payoff_validation_needed/research_only
   - Stats: $56,408 PnL, 67.4% ROI, 48.3% win, 11.0% DD, 836 closed
   - Behavior: asymmetric_behavior, Sortino 4.41, MDD 18.1%, data usable_but_sparse
   - Recent payoff sample: 0 realized trades, win 0.0%, payoff 0, PF 0
   - Current: no open positions
   - Clean tokens: none
   - Policy: Do not alert yet. Need cleaner token history, stronger behavior tier, or confirmed payoff sample.
   - Risk: no clean recurring token set; trade-level payoff not confirmed; behavior tier asymmetric_behavior

3. `0x99928208b49f9b5cca8e875834df9d9e5e008d8b` — payoff_validation_needed/research_only
   - Stats: $82,687 PnL, 8268682.0% ROI, 55.4% win, 16.1% DD, 851 closed
   - Behavior: not scored, Sortino n/a, MDD n/a, data n/a
   - Recent payoff sample: 0 realized trades, win 0.0%, payoff 0, PF 0
   - Current: no open positions
   - Clean tokens: none
   - Policy: Do not alert yet. Need cleaner token history, stronger behavior tier, or confirmed payoff sample.
   - Risk: no clean recurring token set; trade-level payoff not confirmed; not behavior scored

4. `0x85b3c124a704ae638622a1e99310f22eee7279c6` — payoff_validation_needed/research_only
   - Stats: $170,618 PnL, 179.5% ROI, 66.2% win, 16.3% DD, 1291 closed
   - Behavior: not scored, Sortino n/a, MDD n/a, data n/a
   - Recent payoff sample: 0 realized trades, win 0.0%, payoff 0, PF 0
   - Current: ETH S $130,749 uPnL $-11,574 liq 3157.3221032891; BTC L $76,449 uPnL $1,454 liq 9306.5176587342
   - Clean tokens: ETH, BTC; noisy/custom: xyz:AMZN
   - Policy: Do not alert yet. Need cleaner token history, stronger behavior tier, or confirmed payoff sample.
   - Risk: trade-level payoff not confirmed; not behavior scored

5. `0xa38747075ee46e51abdeb96e699fe60efe19b933` — payoff_validation_needed/research_only
   - Stats: $127,101 PnL, 0.0% ROI, 74.8% win, 2.4% DD, 881 closed
   - Behavior: not scored, Sortino n/a, MDD n/a, data n/a
   - Recent payoff sample: 2 realized trades, win 0.0%, payoff 0, PF 0
   - Current: no open positions
   - Clean tokens: none; noisy/custom: xyz:CBRS
   - Policy: Do not alert yet. Need cleaner token history, stronger behavior tier, or confirmed payoff sample.
   - Risk: no clean recurring token set; trade-level payoff not confirmed; not behavior scored

6. `0x69523edb8337e624ea97a0c097ac5d3dede8e3d5` — payoff_validation_needed/research_only
   - Stats: $26,111 PnL, 34.1% ROI, 80.0% win, 8.9% DD, 1553 closed
   - Behavior: not scored, Sortino n/a, MDD n/a, data n/a
   - Recent payoff sample: 0 realized trades, win 0.0%, payoff 0, PF 0
   - Current: no open positions
   - Clean tokens: none
   - Policy: Do not alert yet. Need cleaner token history, stronger behavior tier, or confirmed payoff sample.
   - Risk: no clean recurring token set; trade-level payoff not confirmed; not behavior scored

7. `0xe70f1efff7f7ad16f7413f3dd5772b98361ff378` — payoff_validation_needed/research_only
   - Stats: $33,353 PnL, 38.7% ROI, 58.1% win, 12.1% DD, 513 closed
   - Behavior: not scored, Sortino n/a, MDD n/a, data n/a
   - Recent payoff sample: 0 realized trades, win 0.0%, payoff 0, PF 0
   - Current: no open positions
   - Clean tokens: none
   - Policy: Do not alert yet. Need cleaner token history, stronger behavior tier, or confirmed payoff sample.
   - Risk: no clean recurring token set; trade-level payoff not confirmed; not behavior scored

8. `0x3294a2a613e856631875e263644f27f75d2488fb` — payoff_validation_needed/research_only
   - Stats: $42,444 PnL, 54.0% ROI, 66.6% win, 16.4% DD, 1161 closed
   - Behavior: not scored, Sortino n/a, MDD n/a, data n/a
   - Recent payoff sample: 3 realized trades, win 0.0%, payoff 0, PF 0
   - Current: MORPHO L $34,899 uPnL $94 liq 0.0000984744
   - Clean tokens: none
   - Policy: Do not alert yet. Need cleaner token history, stronger behavior tier, or confirmed payoff sample.
   - Risk: no clean recurring token set; trade-level payoff not confirmed; not behavior scored

9. `0xda3768e9299e1fd81708ec030dac5ea37125f7b5` — payoff_validation_needed/research_only
   - Stats: $40,985 PnL, 43.3% ROI, 53.5% win, 18.7% DD, 957 closed
   - Behavior: not scored, Sortino n/a, MDD n/a, data n/a
   - Recent payoff sample: 4 realized trades, win 25.0%, payoff 0.06, PF 0.02
   - Current: no open positions
   - Clean tokens: none; noisy/custom: xyz:COPPER, xyz:CL, xyz:SNDK
   - Policy: Do not alert yet. Need cleaner token history, stronger behavior tier, or confirmed payoff sample.
   - Risk: no clean recurring token set; trade-level payoff not confirmed; not behavior scored

10. `0x929689eafa23fc78a04d1a1f700cc901525007cc` — payoff_validation_needed/research_only
   - Stats: $39,696 PnL, 49.6% ROI, 53.4% win, 18.7% DD, 799 closed
   - Behavior: not scored, Sortino n/a, MDD n/a, data n/a
   - Recent payoff sample: 0 realized trades, win 0.0%, payoff 0, PF 0
   - Current: no open positions
   - Clean tokens: none
   - Policy: Do not alert yet. Need cleaner token history, stronger behavior tier, or confirmed payoff sample.
   - Risk: no clean recurring token set; trade-level payoff not confirmed; not behavior scored

11. `0x049db0bdc4a8569bacb8f33210af514a82aec838` — payoff_validation_needed/research_only
   - Stats: $31,559 PnL, 42.7% ROI, 72.8% win, 24.0% DD, 1126 closed
   - Behavior: not scored, Sortino n/a, MDD n/a, data n/a
   - Recent payoff sample: 1 realized trades, win 0.0%, payoff 0, PF 0
   - Current: HYPE S $71,759 uPnL $-16,309 liq 69.5979265613
   - Clean tokens: HYPE
   - Policy: Do not alert yet. Need cleaner token history, stronger behavior tier, or confirmed payoff sample.
   - Risk: trade-level payoff not confirmed; not behavior scored

12. `0xd2147a366e335b89b68ace628923962393b56813` — data_conflict_review/manual_review
   - Stats: $188,689 PnL, 56.8% ROI, 66.6% win, 1.6% DD, 509 closed
   - Behavior: asymmetric_behavior, Sortino 12.72, MDD 2.8%, data usable
   - Recent payoff sample: 4 realized trades, win 75.0%, payoff 5.91, PF 17.74
   - Current: no open positions
   - Clean tokens: none; noisy/custom: xyz:CL, @107
   - Policy: Do not sell yet. Re-check data source and live book before alerting.
   - Risk: review_pnl_source_mismatch; behavior tier asymmetric_behavior

13. `0x613ead0ea5af374af0ccfc117ef116a8e8d133fe` — data_conflict_review/manual_review
   - Stats: $99,834 PnL, 126.7% ROI, 46.3% win, 9.8% DD, 905 closed
   - Behavior: low_pnl_unproven, Sortino -1.1, MDD 0.0%, data usable_but_sparse
   - Recent payoff sample: 4 realized trades, win 50.0%, payoff 0.34, PF 0.34
   - Current: HYPE L $597,681 uPnL $32,789 liq 28.0161902592
   - Clean tokens: HYPE, BTC
   - Policy: Do not sell yet. Re-check data source and live book before alerting.
   - Risk: review_pnl_source_mismatch; behavior tier low_pnl_unproven

14. `0xac82b3772ca54a154092e27109f61a31a6d743a5` — data_conflict_review/manual_review
   - Stats: $165,064 PnL, 77.1% ROI, 75.5% win, 10.3% DD, 1366 closed
   - Behavior: incomplete_data, Sortino , MDD 0.0%, data incomplete_lt_7_points
   - Recent payoff sample: 0 realized trades, win 0.0%, payoff 0, PF 0
   - Current: no open positions
   - Clean tokens: none
   - Policy: Do not sell yet. Re-check data source and live book before alerting.
   - Risk: behavior tier incomplete_data

15. `0x837686cfda8a79adfb8465d39240c54166bf9a1e` — data_conflict_review/manual_review
   - Stats: $530,235 PnL, 36.7% ROI, 58.4% win, 10.3% DD, 550 closed
   - Behavior: incomplete_data, Sortino 4.75, MDD 0.0%, data incomplete_lt_7_points
   - Recent payoff sample: 0 realized trades, win 0.0%, payoff 0, PF 0
   - Current: ETH S $1,453,975 uPnL $652,132 liq 4101.42292; BTC S $694,287 uPnL $-85,620 liq 228897.245076; PAXG S $191,853 uPnL $8,144 liq 35829.98393; BNB S $90,654 uPnL $-4,509 liq 10042.881582; SOL S $69,123 uPnL $-4,175 liq 1752.561505
   - Clean tokens: ETH, BTC, PAXG, BNB, SOL
   - Policy: Do not sell yet. Re-check data source and live book before alerting.
   - Risk: review_pnl_source_mismatch; behavior tier incomplete_data


## Risk Rejects

1. `0x2cef0a7f84e722c77b271862da5fe2387028fa20` — risk_reject/internal_only
   - Stats: $91,945 PnL, 161.8% ROI, 74.1% win, 10.3% DD, 1989 closed
   - Behavior: risk_watch, Sortino 0.36, MDD 41.8%, data usable_but_sparse
   - Recent payoff sample: 44 realized trades, win 13.6%, payoff 0.1, PF 0.02
   - Current: no open positions
   - Clean tokens: BTC, HYPE, ZEC; noisy/custom: xyz:CL, xyz:XYZ100, xyz:INTC, xyz:COST, xyz:CBRS, xyz:TSLA, xyz:SNDK
   - Policy: Do not include in paid alerts. Internal observation only.
   - Risk: behavior tier risk_watch

2. `0x408d807d1dbb778f59a9c088e56d4c27bdd362ac` — risk_reject/internal_only
   - Stats: $72,237 PnL, 7223734.0% ROI, 55.3% win, 10.3% DD, 1235 closed
   - Behavior: high_risk_behavior, Sortino -0.11, MDD 11.2%, data usable_but_sparse
   - Recent payoff sample: 17 realized trades, win 52.9%, payoff 1.19, PF 1.34
   - Current: no open positions
   - Clean tokens: HYPE, BTC, ETH, BNB, STBL, TAO, MEGA; noisy/custom: xyz:SP500, xyz:CL, xyz:DRAM, xyz:NFLX
   - Policy: Do not include in paid alerts. Internal observation only.
   - Risk: behavior tier high_risk_behavior

3. `0x83b1385d8126ecf64bfb3b4254d67eb9db753bcc` — risk_reject/internal_only
   - Stats: $250,517 PnL, 127.5% ROI, 65.9% win, 6.4% DD, 2790 closed
   - Behavior: high_risk_behavior, Sortino -0.67, MDD 30.7%, data usable
   - Recent payoff sample: 14 realized trades, win 21.4%, payoff 1.07, PF 0.29
   - Current: DYDX L $90,770 uPnL $-5,781 liq 0
   - Clean tokens: TAO, TON, GRASS, DYDX; noisy/custom: xyz:CBRS, xyz:MU, STABLE, @107
   - Policy: Do not include in paid alerts. Internal observation only.
   - Risk: behavior tier high_risk_behavior

4. `0x48b4c67ff2ba52157604efac6cb4024fd8a6f44a` — risk_reject/internal_only
   - Stats: $74,972 PnL, 80.1% ROI, 75.5% win, 5.3% DD, 799 closed
   - Behavior: high_risk_behavior, Sortino 9.99, MDD 86.4%, data usable_but_sparse
   - Recent payoff sample: 0 realized trades, win 0.0%, payoff 0, PF 0
   - Current: no open positions
   - Clean tokens: none
   - Policy: Do not include in paid alerts. Internal observation only.
   - Risk: behavior tier high_risk_behavior

5. `0x197d1d1127b1a1da550f089375369d5acfeb0c72` — risk_reject/internal_only
   - Stats: $71,880 PnL, 108.7% ROI, 68.4% win, 13.1% DD, 732 closed
   - Behavior: high_risk_behavior, Sortino -1.95, MDD 0.8%, data usable
   - Recent payoff sample: 0 realized trades, win 0.0%, payoff 0, PF 0
   - Current: ASTER S $12,123 uPnL $183 liq 1.078389078
   - Clean tokens: ASTER
   - Policy: Do not include in paid alerts. Internal observation only.
   - Risk: behavior tier high_risk_behavior

6. `0xb798aef79972ce8f73d47b9ebbcda6bbb7ec4fbf` — risk_reject/internal_only
   - Stats: $1,950,058 PnL, 20.9% ROI, 77.6% win, 23.5% DD, 1451 closed
   - Behavior: not scored, Sortino n/a, MDD n/a, data n/a
   - Recent payoff sample: 2 realized trades, win 0.0%, payoff 0, PF 0
   - Current: BTC S $29,064,490 uPnL $-3,510,972 liq 99714.600441
   - Clean tokens: ETH, BTC
   - Policy: Do not include in paid alerts. Internal observation only.
   - Risk: candidate file bucketed as risk_watch; large open negative uPnL $-3,510,972

7. `0x202ed102cca91d1237971252eee1add2f303eb8b` — risk_reject/internal_only
   - Stats: $65,408 PnL, 53.1% ROI, 79.9% win, 24.1% DD, 623 closed
   - Behavior: not scored, Sortino n/a, MDD n/a, data n/a
   - Recent payoff sample: 0 realized trades, win 0.0%, payoff 0, PF 0
   - Current: BTC S $1,186,888 uPnL $-79,694 liq 95236.5556781697
   - Clean tokens: BTC
   - Policy: Do not include in paid alerts. Internal observation only.
   - Risk: candidate file bucketed as risk_watch; large open negative uPnL $-79,694


## Operator Takeaway

- The asymmetric lane is promising, but most wallets are not ready for a flagship curated feed.
- Best commercial use is custom token watchlists plus reactivation alerts.
- The product should keep risk flags visible: behavior tier, source conflict, noisy symbols, leverage, and open uPnL.
- Do not over-sell "asymmetric" until payoff validation is stronger.
