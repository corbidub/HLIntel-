# HL Intel Viable Wallet Deep Review

Local product research. No website changes.

This reviews the 7 wallets that can reasonably support the first pilot feed: core-watch wallets plus active monitors.

## Priority A

1. `0xbb9f0315243db63fc34c51f96ad5bb7ce6e275e2` - core_watch/clean_wallet_reactivation. Score 94. $170,474 3M PnL, ROI 341.15%, win 99.6%, DD 0.0%, closed 1974. Open: no open positions. Policy: Alert only on new position open, major add, or fresh directional exposure after inactivity.
2. `0xf3362789cecf25c6a31288d172880d7ad9b81801` - core_watch/clean_wallet_reactivation. Score 72. $334,868 3M PnL, ROI 26.33%, win 97.8%, DD 3.1%, closed 1040. Open: no open positions. Policy: Alert only on new position open, major add, or fresh directional exposure after inactivity.
3. `0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62` - active_monitor/profitable_open_book_unwind. Score 67. $128,868 3M PnL, ROI 18.40%, win 100.0%, DD 0.0%, closed 537. Open: BTC S $199,408 liq 84754.7208073893. Policy: Alert on trim, full exit, flip, or material add because wallet is sitting on meaningful open profit.

## Priority B

1. `0x031f72deb03c509af42624ddcd1f63fce5ecb220` - active_monitor/position_change_monitor. Score 71. $66,228 3M PnL, ROI 73.89%, win 99.0%, DD 0.1%, closed 665. Open: ZEC L $8,359 liq 0. Policy: Alert on size expansion, direction flip, full close, or new second asset. Ignore small PnL drift.
2. `0x143c28ae5b8642f58c98b8a6f82a0f314d23f6ab` - active_monitor/position_change_monitor. Score 67. $876,569 3M PnL, ROI 68.73%, win 91.1%, DD 0.2%, closed 1824. Open: HYPE L $-3,102 liq 0. Policy: Alert on size expansion, direction flip, full close, or new second asset. Ignore small PnL drift.
3. `0xa3d843b6a057504284006bef6f34a2e9bc80fb6b` - active_monitor/position_change_monitor. Score 61. $1,108,324 3M PnL, ROI 4875.06%, win 92.3%, DD 12.4%, closed 2502. Open: BTC L $-10,231 liq 3353.9752145148. Policy: Alert on size expansion, direction flip, full close, or new second asset. Ignore small PnL drift.
4. `0xa4add8273d7f47318675bdfbcce3e9648cdb4509` - active_monitor/position_change_monitor. Score 52. $119,270 3M PnL, ROI 122.32%, win 89.5%, DD 15.0%, closed 732. Open: SOL L $-2,065 liq 0. Policy: Alert on size expansion, direction flip, full close, or new second asset. Ignore small PnL drift.

## Wallet Notes

### 0xbb9f0315243db63fc34c51f96ad5bb7ce6e275e2

- Priority: A
- Lane: core_watch / clean_wallet_reactivation
- Current positions: no open positions
- Recent symbols: none
- Latest trade age: 0 days
- Recent trades: no recent trades returned
- Alert policy: Alert only on new position open, major add, or fresh directional exposure after inactivity.
- Manual check: Confirm last closed-trade behavior before adding live alerts; avoid firing on dust/maintenance fills.
- Kill condition: Remove from core if next active sequence shows martingale averaging, huge leverage, or noisy micro-fills.

### 0xf3362789cecf25c6a31288d172880d7ad9b81801

- Priority: A
- Lane: core_watch / clean_wallet_reactivation
- Current positions: no open positions
- Recent symbols: none
- Latest trade age: 0 days
- Recent trades: no recent trades returned
- Alert policy: Alert only on new position open, major add, or fresh directional exposure after inactivity.
- Manual check: Confirm last closed-trade behavior before adding live alerts; avoid firing on dust/maintenance fills.
- Kill condition: Remove from core if next active sequence shows martingale averaging, huge leverage, or noisy micro-fills.

### 0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62

- Priority: A
- Lane: active_monitor / profitable_open_book_unwind
- Current positions: BTC S $199,408 liq 84754.7208073893
- Recent symbols: BTC (30)
- Latest trade age: 1 days
- Recent trades: 2026-05-18 open short BTC $930 @ 76049; 2026-05-18 open short BTC $57 @ 76071; 2026-05-18 open short BTC $2,403 @ 76089; 2026-05-18 open short BTC $907 @ 76130; 2026-05-18 open short BTC $11 @ 76149
- Alert policy: Alert on trim, full exit, flip, or material add because wallet is sitting on meaningful open profit.
- Manual check: Watch BTC short closely; unwind/flip can be a useful market context alert.
- Kill condition: Downgrade if wallet starts adding into large adverse move or open PnL collapses without risk control.

### 0x031f72deb03c509af42624ddcd1f63fce5ecb220

- Priority: B
- Lane: active_monitor / position_change_monitor
- Current positions: ZEC L $8,359 liq 0
- Recent symbols: STABLE (30)
- Latest trade age: 3 days
- Recent trades: 2026-05-16 close long STABLE $2,314 @ 0.031131; 2026-05-16 close long STABLE $2,314 @ 0.031132; 2026-05-16 close long STABLE $2,314 @ 0.031132; 2026-05-16 close long STABLE $2,314 @ 0.031132; 2026-05-16 close long STABLE $2,314 @ 0.031132
- Alert policy: Alert on size expansion, direction flip, full close, or new second asset. Ignore small PnL drift.
- Manual check: Useful because the book is simple and readable; do not over-alert while position size is stable.
- Kill condition: Downgrade if wallet opens many unrelated assets or starts carrying large underwater exposure.

### 0x143c28ae5b8642f58c98b8a6f82a0f314d23f6ab

- Priority: B
- Lane: active_monitor / position_change_monitor
- Current positions: HYPE L $-3,102 liq 0
- Recent symbols: xyz:MU (7), HYPE (6), xyz:CBRS (4), xyz:GOOGL (1)
- Latest trade age: 0 days
- Recent trades: 2026-05-19 open long xyz:GOOGL $296,146 @ 401.16; 2026-05-19 open long xyz:CBRS $28,619 @ 303.999989; 2026-05-19 open long HYPE $166,476 @ 48.02154; 2026-05-16 close long xyz:MU $88 @ 717.78; 2026-05-16 close long xyz:MU $213,582 @ 714.320026
- Alert policy: Alert on size expansion, direction flip, full close, or new second asset. Ignore small PnL drift.
- Manual check: Useful because the book is simple and readable; do not over-alert while position size is stable.
- Kill condition: Downgrade if wallet opens many unrelated assets or starts carrying large underwater exposure.

### 0xa3d843b6a057504284006bef6f34a2e9bc80fb6b

- Priority: B
- Lane: active_monitor / position_change_monitor
- Current positions: BTC L $-10,231 liq 3353.9752145148
- Recent symbols: xyz:SPCX (13), BTC (3), xyz:CBRS (2), xyz:TSLA (1), xyz:MSTR (1)
- Latest trade age: 0 days
- Recent trades: 2026-05-19 open long xyz:SPCX $18,548 @ 203.225315; 2026-05-19 open long xyz:SPCX $20,318 @ 203.180483; 2026-05-19 open long xyz:SPCX $18,399 @ 203.119542; 2026-05-19 open long xyz:SPCX $17,758 @ 202.900964; 2026-05-19 open long xyz:SPCX $17,635 @ 202.612602
- Alert policy: Alert on size expansion, direction flip, full close, or new second asset. Ignore small PnL drift.
- Manual check: Useful because the book is simple and readable; do not over-alert while position size is stable.
- Kill condition: Downgrade if wallet opens many unrelated assets or starts carrying large underwater exposure.

### 0xa4add8273d7f47318675bdfbcce3e9648cdb4509

- Priority: B
- Lane: active_monitor / position_change_monitor
- Current positions: SOL L $-2,065 liq 0
- Recent symbols: FARTCOIN (20), SOL (9), PURR/USDC (1)
- Latest trade age: 0 days
- Recent trades: 2026-05-19 close short PURR/USDC $11,598 @ 0.080912; 2026-05-18 close long FARTCOIN $0 @ 0.18446; 2026-05-18 close long FARTCOIN $435,877 @ 0.18438; 2026-05-18 open long FARTCOIN $4,663 @ 0.17842; 2026-05-18 open long FARTCOIN $4,565 @ 0.17855
- Alert policy: Alert on size expansion, direction flip, full close, or new second asset. Ignore small PnL drift.
- Manual check: Useful because the book is simple and readable; do not over-alert while position size is stable.
- Kill condition: Downgrade if wallet opens many unrelated assets or starts carrying large underwater exposure.

## Pilot Feed Rule

Start with Priority A only if you want fewer but cleaner alerts. Add Priority B if the pilot users explicitly want more live wallet movement. Suppress passive PnL movement; only alert on opens, adds, trims, exits, flips, or liquidation-risk changes.
