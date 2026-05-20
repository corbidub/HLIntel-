# Viable Wallet Monitor Report

Generated: 2026-05-20T13:08:35.480Z

This is a local monitor snapshot for the 7 viable HL Intel wallets. First run establishes the baseline; later runs will detect opens, closes, adds, trims, and meaningful uPnL changes.

## Market Participant Read

```text
🧠 HL INTEL | MARKET PARTICIPANT READ

Active VIP wallets: 5/7
Net posture: cautious / risk-off by notional
Top exposure: BTC short $3,352,866; SOL long $487,942; HYPE long $348,254; BTC long $232,514; ZEC long $216,087

Read:
0x6979...da62 is the largest active participant: short bias via BTC exposure. 1 active wallet(s) are showing risk-off or de-risking behavior. 4 active wallet(s) are still expressing risk-on long bias. Breadth is risk-on, but notional is dominated by the largest risk-off participant.

Active participants:
1. 0x6979...da62 | Flagship / Elite Behavior
   Short Bias (risk_off); $3,352,866 exposure; top BTC $3,352,866
   Actions: holding

2. 0x031f...b220 | Custom Watch / Incomplete Data
   Risk-On Long Bias (risk_on); $216,087 exposure; top ZEC $216,087
   Actions: holding

3. 0x143c...f6ab | Custom Watch / High Risk Behavior
   Risk-On Long Bias (risk_on); $348,254 exposure; top HYPE $348,254
   Actions: holding

4. 0xa3d8...fb6b | Custom Watch / Elite Behavior
   Long Bias (risk_on); $232,514 exposure; top BTC $232,514
   Actions: holding

5. 0xa4ad...4509 | Custom Watch / Low Pnl Unproven
   Risk-On Long Bias (risk_on); $487,942 exposure; top SOL $487,942
   Actions: holding

Data only. NFA.
```

## Alert Counts

- High: 0
- Medium: 0
- Low: 0
- Baseline: 0

## High Alerts

None.


## Medium Alerts

None.


## Low Alerts

None.


## Baseline Positions

None.


## Pilot Core

1. `0xbb9f0315243db63fc34c51f96ad5bb7ce6e275e2` - A/clean_wallet_reactivation. no open positions
2. `0xf3362789cecf25c6a31288d172880d7ad9b81801` - A/clean_wallet_reactivation. no open positions
3. `0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62` - A/profitable_open_book_unwind. BTC S notional $3,352,866 uPnL $169,773 liq 84778.4836836567


## Pilot Expanded

1. `0x031f72deb03c509af42624ddcd1f63fce5ecb220` - B/position_change_monitor. ZEC L notional $216,087 uPnL $21,529 liq 0
2. `0x143c28ae5b8642f58c98b8a6f82a0f314d23f6ab` - B/position_change_monitor. HYPE L notional $348,254 uPnL $11,141 liq 0
3. `0xa3d843b6a057504284006bef6f34a2e9bc80fb6b` - B/position_change_monitor. BTC L notional $232,514 uPnL $-8,161 liq 3378.339676962
4. `0xa4add8273d7f47318675bdfbcce3e9648cdb4509` - B/position_change_monitor. SOL L notional $487,942 uPnL $180 liq 0


## Monitor Rules

- Pilot core: Priority A only.
- Pilot expanded: Priority B wallets are optional and should be suppressed unless users want more movement.
- Alert on position opens, closes, flips, material adds/trims, and large uPnL changes.
- Suppress passive mark-price drift and dust-level fills.
