# Viable Wallet Monitor Report

Generated: 2026-05-25T17:55:35.373Z

This is a local monitor snapshot for 12 HL Intel wallet(s). First run establishes the baseline; later runs will detect opens, closes, adds, trims, and meaningful uPnL changes.

## Market Participant Read

```text
🧠 HL INTEL | MARKET PARTICIPANT READ

Active VIP wallets: 11/12
Net posture: risk-on by breadth and notional
Top exposure: HYPE long $4,450,185; HYPE short $3,402,364; BTC long $3,172,697; ETH short $1,686,237; SOL long $757,660

Read:
0xe097...d0fe is the largest active participant: risk-on long bias via SOL exposure. 2 active wallet(s) are showing risk-off or de-risking behavior. 9 active wallet(s) are still expressing risk-on long bias. 2 wallet(s) had fresh behavior changes worth review.

Active participants:
1. 0xf00b...91b1 | Core Watch / Hyperdash Promoted
   Risk-On Long Bias (risk_on); $1,871,666 exposure; top BTC $1,154,319
   Actions: holding

2. 0xaede...1602 | Core Watch / Hyperdash Promoted
   Risk-On / Added (risk_on); $1,120,880 exposure; top HYPE $1,120,880
   Actions: entered

3. 0x12f5...5a9b | Core Watch / Hyperdash Promoted
   Risk-On / Added (risk_on); $685,226 exposure; top HYPE $685,226
   Actions: entered

4. 0xe251...eaba | Core Watch / Hyperdash Promoted
   Long Bias (risk_on); $1,659,412 exposure; top BTC $1,518,468
   Actions: holding

5. 0x9a77...bdc9 | Custom Watch / Hyperdash Secondary Dig
   Risk-On Long Bias (risk_on); $1,081,513 exposure; top HYPE $631,953
   Actions: holding

6. 0x718c...a868 | Custom Watch / Hyperdash Secondary Dig
   Risk-On Long Bias (risk_on); $534,443 exposure; top ZEC $534,443
   Actions: holding

7. 0xaa2a...3026 | Custom Watch / Hyperdash Secondary Dig
   Short Bias (risk_off); $2,152,081 exposure; top ETH $1,686,237
   Actions: pnl_changed

8. 0xe79d...0534 | Custom Watch / Hyperdash Secondary Dig
   Short Bias (risk_off); $2,937,359 exposure; top HYPE $2,937,359
   Actions: holding

9. 0xb40d...75d9 | Custom Watch / Hyperdash Secondary Dig
   Risk-On Long Bias (risk_on); $863,790 exposure; top HYPE $640,535
   Actions: holding

10. 0x88a0...bf63 | Custom Watch / Hyperdash Secondary Dig
   Risk-On Long Bias (risk_on); $909,254 exposure; top HYPE $609,077
   Actions: holding

11. 0xe097...d0fe | Custom Watch / Hyperdash Secondary Dig
   Risk-On Long Bias (risk_on); $3,697,728 exposure; top SOL $757,660
   Actions: holding

Data only. NFA.
```

## Wallet Performance Read

6 wallet(s) are hot or heating up. 1 wallet(s) are cooling off or in drawdown watch.

## Alert Counts

- High: 3
- Medium: 0
- Low: 3
- Baseline: 0

## High Alerts

1. `0xaede390f5b5b7cf77428030ccfc73d99a44e1602` - position_opened: New long HYPE: HYPE L notional $1,120,880 uPnL $-5,762 liq 53.6135434344
2. `0x12f5f5ce07647f5e7bf9ea054ea119d1cbb85a9b` - position_opened: New long HYPE: HYPE L notional $685,226 uPnL $19,814 liq 40.8288320112
3. `0x12f5f5ce07647f5e7bf9ea054ea119d1cbb85a9b` - position_closed: Closed short BTC. Previous: BTC S notional $2,509,391 uPnL $12,931 liq 85178.618587


## Medium Alerts

None.


## Low Alerts

1. `0xaa2a33c424b92cdc042e40c522cb48e586e83026` - upnl_changed: HYPE short uPnL changed $-109,071 to $-464,259.
2. `0xaa2a33c424b92cdc042e40c522cb48e586e83026` - upnl_changed: ETH short uPnL changed $-38,479 to $378,579.
3. `0xe79d69fd1ed52dd14d7f55155259519ea20d0534` - upnl_changed: HYPE short uPnL changed $-10,609 to $-50,030.


## Baseline Positions

None.


## Pilot Core

1. `0xf00bb08f7d1d04a9415408c939c02410fc6791b1` - A/hyperdash_flagship_btc_hype. HYPE L notional $717,347 uPnL $212,262 liq 0; BTC L notional $1,154,319 uPnL $8,826 liq 0
2. `0xaede390f5b5b7cf77428030ccfc73d99a44e1602` - A/hyperdash_hype_directional_watch. HYPE L notional $1,120,880 uPnL $-5,762 liq 53.6135434344
3. `0x12f5f5ce07647f5e7bf9ea054ea119d1cbb85a9b` - A/hyperdash_hype_directional_watch. HYPE L notional $685,226 uPnL $19,814 liq 40.8288320112
4. `0xe25173b3558e8644d719f2cd3095dccbf5efeaba` - A/hyperdash_btc_major_watch. BTC L notional $1,518,468 uPnL $32,412 liq 47660.8972404051; BCH L notional $140,944 uPnL $-812 liq 0


## Pilot Expanded

1. `0x9a770e9cd5d05e9e5636b87c822bafb53e02bdc9` - B/hyperdash_hype_vvv_watch. HYPE L notional $631,953 uPnL $297,329 liq 28.1242873185; VVV L notional $399,611 uPnL $21,824 liq 0; AERO L notional $49,949 uPnL $-421 liq 0
2. `0x718cc7ee2ae2493ebf7d454316df6b61f4e1a868` - B/hyperdash_zec_profit_watch. ZEC L notional $534,443 uPnL $359,223 liq 318.3472985639
3. `0xaa2a33c424b92cdc042e40c522cb48e586e83026` - B/hyperdash_eth_hype_bearish_watch. HYPE S notional $465,005 uPnL $-464,259 liq 123.0361087996; ETH S notional $1,686,237 uPnL $378,579 liq 3664.664875921; LIT S notional $839 uPnL $54 liq 1491.3329718507
4. `0xe79d69fd1ed52dd14d7f55155259519ea20d0534` - B/hyperdash_hype_short_watch. HYPE S notional $2,937,359 uPnL $-50,030 liq 79.3921556886
5. `0xb40da15b8cc492fff87d9b1e06bb45769d7e75d9` - B/hyperdash_hype_zec_near_watch. HYPE L notional $640,535 uPnL $226,764 liq 27.3434303937; NEAR L notional $44,128 uPnL $10,100 liq 0; ZEC L notional $179,128 uPnL $3,643 liq 0
6. `0x88a0511a229643ae6e4ef263a08297343e11bf63` - B/hyperdash_hype_sui_watch. HYPE L notional $609,077 uPnL $419,477 liq 15.6419565375; SUI L notional $300,177 uPnL $-25,061 liq 0
7. `0xe09726ff25f5001f37b15049f54116cb83d7d0fe` - B/hyperdash_crypto_basket_watch. LIT L notional $413,835 uPnL $150,859 liq 0; PENDLE L notional $200,240 uPnL $101,952 liq 0; SYRUP L notional $611,197 uPnL $-86,201 liq 0; ETHFI L notional $387,002 uPnL $-67,129 liq 0; HYPE L notional $45,167 uPnL $23,659 liq 0; ETH L notional $250,308 uPnL $-15,848 liq 0; SOL L notional $757,660 uPnL $-12,066 liq 0; BTC L notional $499,910 uPnL $8,107 liq 0; VIRTUAL L notional $265,301 uPnL $1,705 liq 0; PUMP L notional $267,108 uPnL $1,084 liq 0
8. `0x04cc3147bc87999e5a6b75373daa6ff8f12b38d1` - B/hyperdash_premium_reactivation_watch. no open positions


## Monitor Rules

- Pilot core: Priority A only.
- Pilot expanded: Priority B wallets are optional and should be suppressed unless users want more movement.
- Alert on position opens, closes, flips, material adds/trims, and large uPnL changes.
- Suppress passive mark-price drift and dust-level fills.
