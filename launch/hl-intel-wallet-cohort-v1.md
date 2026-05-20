# HL Intel Wallet Cohort v1

Local product research. No website changes.

This narrows the 28 HyperCopy stats-pass wallets into a practical HL Intel feed cohort. The goal is not to include every statistically interesting wallet. The goal is to identify wallets that can produce usable alerts without polluting the feed.

## Counts

- Total reviewed for cohort: 14
- Core watch: 2
- Active monitor: 5
- Reactivation watch: 2
- Risk watch: 1
- Hold: 4

## Core Watch

1. `0xbb9f0315243db63fc34c51f96ad5bb7ce6e275e2` - clean_wallet_reactivation, score 94, $170,474 3M PnL, ROI 341.15%, win 99.6%, DD 0.0%, closed 1974, live open 0. Clean historical profile. Best use is alerting when the wallet opens fresh meaningful exposure. Positions: no open positions.
2. `0xf3362789cecf25c6a31288d172880d7ad9b81801` - clean_wallet_reactivation, score 72, $334,868 3M PnL, ROI 26.33%, win 97.8%, DD 3.1%, closed 1040, live open 0. Clean historical profile. Best use is alerting when the wallet opens fresh meaningful exposure. Positions: no open positions.


## Active Monitor

1. `0x031f72deb03c509af42624ddcd1f63fce5ecb220` - position_change_monitor, score 71, $66,228 3M PnL, ROI 73.89%, win 99.0%, DD 0.1%, closed 665, live open 1. Readable active book. Monitor adds, trims, flips, and full exits before promoting to core watch. Positions: ZEC L $8,377.
2. `0x143c28ae5b8642f58c98b8a6f82a0f314d23f6ab` - position_change_monitor, score 67, $876,569 3M PnL, ROI 68.73%, win 91.1%, DD 0.2%, closed 1824, live open 1. Readable active book. Monitor adds, trims, flips, and full exits before promoting to core watch. Positions: HYPE L $-3,102.
3. `0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62` - profitable_open_book_unwind, score 67, $128,868 3M PnL, ROI 18.40%, win 100.0%, DD 0.0%, closed 537, live open 1. Readable active book. Monitor adds, trims, flips, and full exits before promoting to core watch. Positions: BTC S $200,230.
4. `0xa3d843b6a057504284006bef6f34a2e9bc80fb6b` - position_change_monitor, score 61, $1,108,324 3M PnL, ROI 4875.06%, win 92.3%, DD 12.4%, closed 2502, live open 1. Readable active book. Monitor adds, trims, flips, and full exits before promoting to core watch. Positions: BTC L $-10,288.
5. `0xa4add8273d7f47318675bdfbcce3e9648cdb4509` - position_change_monitor, score 52, $119,270 3M PnL, ROI 122.32%, win 89.5%, DD 15.0%, closed 732, live open 1. Readable active book. Monitor adds, trims, flips, and full exits before promoting to core watch. Positions: SOL L $-2,191.


## Reactivation Watch

1. `0xd04aeccdf15e49f2654ae4e25db1666d48c85c4e` - clean_wallet_reactivation, score 59, $34,023 3M PnL, ROI 34.27%, win 92.8%, DD 8.4%, closed 502, live open 0. Clean enough to track, but only valuable if it reactivates with meaningful size. Positions: no open positions.
2. `0xee2549522a965522877497578d6f135084f2994a` - clean_wallet_reactivation, score 54, $23,533 3M PnL, ROI 3.33%, win 94.2%, DD 11.1%, closed 1268, live open 0. Stats are clean but edge is low and recent visible activity is light. Alert only on meaningful reactivation. Positions: no open positions.


## Risk Watch

1. `0x69cc3ae720efdff1cd2a8edec79a7a3fac6e14fd` - large_underwater_open_book, score 69, $805,715 3M PnL, ROI 2.52%, win 99.9%, DD 0.0%, closed 2105, live open 4. Previous pass called this monitor, but the HYPE short is more than $1M underwater. Do not present as smart-money signal until behavior improves. Positions: HYPE S $-1,037,497; SOL S $313,403; BTC L $-4,285; ZEC L $3,980.


## Hold

1. `0x5af5bc81a11a1b28b0960752ea4d86c5ac34f245` - low_priority_observation, score 34, $6,770 3M PnL, ROI 13.82%, win 84.7%, DD 12.5%, closed 843, live open 3. Keep in the dataset, but do not spend scarce manual attention until behavior improves. Positions: VVV S $-143; LINK S $11; kLUNC S $5.
2. `0x440888714a6afed60ff44e9975a96e6a36f7fac4` - low_priority_observation, score 32, $11,433 3M PnL, ROI 2.75%, win 83.5%, DD 13.0%, closed 1039, live open 6. Keep in the dataset, but do not spend scarce manual attention until behavior improves. Positions: BTC L $-6,169; ENA S $-1,831; PAXG S $555; LDO L $-364; CRV S $134; ETH L $-118.
3. `0x7fa8a6161b17b4ee11ee591878de6930286300d0` - low_priority_observation, score 30, $6,069 3M PnL, ROI 6.15%, win 83.4%, DD 14.0%, closed 723, live open 1. Keep in the dataset, but do not spend scarce manual attention until behavior improves. Positions: HYPE S $-12,099.
4. `0x9bbf40a5cd58a832696c1ae903459c6c2e930150` - low_priority_observation, score 22, $5,684 3M PnL, ROI 6.89%, win 82.5%, DD 12.8%, closed 772, live open 1. Keep in the dataset, but do not spend scarce manual attention until behavior improves. Positions: BTC L $761.


## Product Read

For the first paid pilot, do not market this as copy-trading. Market it as a curated Hyperliquid wallet intelligence feed with three lanes:

- Clean-wallet reactivation alerts
- Active position-change monitoring
- Large open-book risk/liquidation monitoring

The core feed should start with core watch plus active monitor only. Risk watch can become a separate board or occasional alert lane, but it should not be mixed into smart-wallet signal quality.
