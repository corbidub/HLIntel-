# HL Intel Asymmetric Watch Review

Local research only. No website changes.

This reviews the 12 asymmetric-watch candidates from the looser win-rate scan. These should not be mixed into the clean-grinder monitor until they pass current-position sanity checks.

## Counts

- Reviewed: 12
- Asymmetric active monitor: 2
- Asymmetric reactivation watch: 5
- Review: 5
- Risk only: 0

## Priority A

1. `0x613ead0ea5af374af0ccfc117ef116a8e8d133fe` - A/asymmetric_active_monitor. Score 65, $99,834 PnL, ROI 126.70%, win 46.3%, DD 9.8%, closed 905. Readable active book with positive open PnL; monitor adds/trims/exits. Positions: HYPE L $33,364 notional $598,256 liq 28.0149270093. Recent symbols: HYPE (11), BTC (2).
2. `0x86149addc2ebeb610d2630b07cbfea5c19fa690e` - A/asymmetric_reactivation_watch. Score 77, $110,980 PnL, ROI 134.89%, win 79.0%, DD 11.6%, closed 2595. No open positions; useful if it reactivates with meaningful fresh exposure. Positions: no open positions. Recent symbols: HYPE (13), ETH (12), BTC (12), TAO (8), SOL (3), DOGE (2).
3. `0xac82b3772ca54a154092e27109f61a31a6d743a5` - A/asymmetric_reactivation_watch. Score 60, $165,064 PnL, ROI 77.06%, win 75.5%, DD 10.3%, closed 1366. No open positions; useful if it reactivates with meaningful fresh exposure. Positions: no open positions. Recent symbols: none.


## Priority B

1. `0x83b1385d8126ecf64bfb3b4254d67eb9db753bcc` - B/asymmetric_active_monitor. Score 70, $250,517 PnL, ROI 127.50%, win 65.9%, DD 6.4%, closed 2790. Readable active book and strong asymmetric stats; monitor changes only. Positions: DYDX L $-3,906 notional $92,645 liq 0. Recent symbols: xyz:CBRS (18), @107 (5), STABLE (5), xyz:MU (5), TAO (4), GRASS (1), TON (1).
2. `0x6d7823cd5c3d9dcd63e6a8021b475e0c7c94b291` - B/asymmetric_reactivation_watch. Score 91, $414,759 PnL, ROI 7897.83%, win 65.9%, DD 7.5%, closed 1266. No open positions; useful if it reactivates with meaningful fresh exposure. RWA/xyz exposure makes this slightly more specialized/noisy. Positions: no open positions. Recent symbols: xyz:MSTR (18), @272 (18), @107 (7), xyz:CRWV (6), xyz:COIN (1).
3. `0x2cef0a7f84e722c77b271862da5fe2387028fa20` - B/asymmetric_reactivation_watch. Score 79, $91,945 PnL, ROI 161.75%, win 74.1%, DD 10.3%, closed 1989. No open positions; useful if it reactivates with meaningful fresh exposure. RWA/xyz exposure makes this slightly more specialized/noisy. Positions: no open positions. Recent symbols: xyz:XYZ100 (23), BTC (13), xyz:INTC (9), ZEC (5).
4. `0xd2147a366e335b89b68ace628923962393b56813` - B/asymmetric_reactivation_watch. Score 70, $188,689 PnL, ROI 56.77%, win 66.6%, DD 1.6%, closed 509. No open positions; useful if it reactivates with meaningful fresh exposure. RWA/xyz exposure makes this slightly more specialized/noisy. Positions: no open positions. Recent symbols: xyz:CL (4), @107 (3).
5. `0x408d807d1dbb778f59a9c088e56d4c27bdd362ac` - B/review. Score 71, $72,237 PnL, ROI 7223734.00%, win 55.3%, DD 10.3%, closed 1235. Worth manual review, but not monitor-ready yet. Positions: HYPE S $-601 notional $345,017 liq 50.1008482122. Recent symbols: HYPE (15), BTC (7), ETH (3), TAO (2), STBL (2), xyz:SP500 (2), BNB (2), MEGA (2), xyz:CL (2), xyz:DRAM (2).
6. `0x48b4c67ff2ba52157604efac6cb4024fd8a6f44a` - B/review. Score 64, $74,972 PnL, ROI 80.10%, win 75.5%, DD 5.3%, closed 799. Worth manual review, but not monitor-ready yet. Positions: no open positions. Recent symbols: none.
7. `0x197d1d1127b1a1da550f089375369d5acfeb0c72` - B/review. Score 59, $71,880 PnL, ROI 108.72%, win 68.4%, DD 13.1%, closed 732. Worth manual review, but not monitor-ready yet. Positions: ASTER S $99 notional $12,208 liq 1.0783742582. Recent symbols: none.
8. `0x837686cfda8a79adfb8465d39240c54166bf9a1e` - B/review. Score 49, $530,235 PnL, ROI 36.71%, win 58.4%, DD 10.3%, closed 550. Worth manual review, but not monitor-ready yet. Positions: ETH S $645,375 notional $1,460,732 liq 4090.8760697328; BTC S $-90,170 notional $698,837 liq 227785.6215457014; PAXG S $6,814 notional $193,183 liq 35521.6399707757; BNB S $-4,905 notional $91,050 liq 9943.7061140443; SOL S $-4,619 notional $69,567 liq 1735.0495658584. Recent symbols: none.


## Priority C / Do Not Monitor Yet

1. `0xe3c1447b94c5b278d9ec8d24855f5a5a2788542b` - C/review. Score 56, $56,408 PnL, ROI 67.44%, win 48.3%, DD 11.0%, closed 836. Low win rate may be valid, but needs more payoff validation before monitoring. Positions: no open positions. Recent symbols: none.


## Operating Rule

Add Priority A asymmetric wallets to a separate asymmetric lane only. Priority B can be watched manually for one more cycle. Priority C should stay out of the pilot feed until payoff quality and current risk are clearer.
