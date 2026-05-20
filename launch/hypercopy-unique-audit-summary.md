# HyperCopy Unique Wallet Audit

Local research snapshot for HL Intel. No website changes.

## Query

- Source: HyperCopy screener API
- Period: 3M
- Sort: total PnL descending
- Trading styles: Cons. Hi-Freq, Asymmetric Pro, Aggr. Low-Freq
- Rows per page: 100
- Pages fetched: 13

## Uniqueness Result

- HyperCopy reported total rows: 1249
- Rows fetched from API pages: 1249
- Unique full wallet addresses: 1249
- Duplicate wallet rows: 0
- Duplicate row rate: 0.00%

**Verdict:** The API result set is not inflating wallets by duplicate address for this filtered 3M query.

## First-Pass Filter Result

Current HL Intel stats filter:

- Positive 3M total PnL
- 500 to 3,000 closed positions over 3M
- Win rate at or above 80%
- Max drawdown below 15%

Counts:

- Positive-PnL unique wallets: 480
- Stats-pass unique wallets: 28
- Stats-pass rate vs unique wallets: 2.24%

## Top Stats-Pass Wallets

1. `0x06cecfbac34101ae41c88ebc2450f8602b3d164b` - PnL $5,627,055, ROI 399.97%, win 97.2%, drawdown 0.0%, closed positions 701, open positions 6
2. `0xfd423284f6a9c73a2a3d53cab8921d6533533d97` - PnL $2,525,959, ROI 215.60%, win 100.0%, drawdown 0.0%, closed positions 890, open positions 1
3. `0xa875890465da20062bcf3b024bf7d54e69c725a8` - PnL $1,928,957, ROI 29.82%, win 100.0%, drawdown 0.0%, closed positions 729, open positions 1
4. `0x9c89f595f5515609ad61f6fda94beff85ae6600e` - PnL $1,713,949, ROI 16.68%, win 100.0%, drawdown 0.0%, closed positions 2375, open positions 2
5. `0xa3d843b6a057504284006bef6f34a2e9bc80fb6b` - PnL $1,108,324, ROI 4875.06%, win 92.3%, drawdown 12.4%, closed positions 2502, open positions 1
6. `0x143c28ae5b8642f58c98b8a6f82a0f314d23f6ab` - PnL $876,569, ROI 68.73%, win 91.1%, drawdown 0.2%, closed positions 1824, open positions 1
7. `0x69cc3ae720efdff1cd2a8edec79a7a3fac6e14fd` - PnL $805,715, ROI 2.52%, win 99.9%, drawdown 0.0%, closed positions 2105, open positions 4
8. `0x0daf132c5554fd7d5eb422585426af557d8847e0` - PnL $619,022, ROI 50.94%, win 99.8%, drawdown 0.0%, closed positions 1208, open positions 3
9. `0xf3362789cecf25c6a31288d172880d7ad9b81801` - PnL $334,868, ROI 26.33%, win 97.8%, drawdown 3.1%, closed positions 1040, open positions 0
10. `0xbb9f0315243db63fc34c51f96ad5bb7ce6e275e2` - PnL $170,474, ROI 341.15%, win 99.6%, drawdown 0.0%, closed positions 1974, open positions 0
11. `0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62` - PnL $128,868, ROI 18.40%, win 100.0%, drawdown 0.0%, closed positions 537, open positions 1
12. `0xa4add8273d7f47318675bdfbcce3e9648cdb4509` - PnL $119,270, ROI 122.32%, win 89.5%, drawdown 15.0%, closed positions 732, open positions 1
13. `0x031f72deb03c509af42624ddcd1f63fce5ecb220` - PnL $66,228, ROI 73.89%, win 99.0%, drawdown 0.1%, closed positions 665, open positions 1
14. `0x75ee7dfabcbbb47f8b2abaf1f533b59d3e25354f` - PnL $35,344, ROI 17.21%, win 96.1%, drawdown 1.2%, closed positions 767, open positions 12
15. `0xd04aeccdf15e49f2654ae4e25db1666d48c85c4e` - PnL $34,023, ROI 34.27%, win 92.8%, drawdown 8.4%, closed positions 502, open positions 0
16. `0xede948f02ead52b7140647fc383a726685114256` - PnL $32,187, ROI 7.90%, win 88.3%, drawdown 14.2%, closed positions 953, open positions 1
17. `0xee2549522a965522877497578d6f135084f2994a` - PnL $23,533, ROI 3.33%, win 94.2%, drawdown 11.1%, closed positions 1268, open positions 1
18. `0x440888714a6afed60ff44e9975a96e6a36f7fac4` - PnL $11,433, ROI 2.75%, win 83.5%, drawdown 13.0%, closed positions 1039, open positions 6
19. `0xea4fc1ae43d644b35e6874c32c49516ccb21df32` - PnL $9,732, ROI 2.62%, win 82.0%, drawdown 9.0%, closed positions 1094, open positions 162
20. `0x34e51fecdb28fdbf7a0e1284981e0bcdb724d851` - PnL $9,547, ROI 93.82%, win 81.4%, drawdown 8.8%, closed positions 715, open positions 0
21. `0x279f7364049b22bb8a456532250c473e7b491619` - PnL $7,087, ROI 1.16%, win 83.2%, drawdown 9.5%, closed positions 805, open positions 1
22. `0x279818c822e5c6135d989df50d0bba96e9564ce5` - PnL $6,935, ROI 1.45%, win 97.6%, drawdown 9.7%, closed positions 1197, open positions 0
23. `0x5af5bc81a11a1b28b0960752ea4d86c5ac34f245` - PnL $6,770, ROI 13.82%, win 84.7%, drawdown 12.5%, closed positions 843, open positions 3
24. `0x241066637dea18ef8fdcb1af0a920daa93c3bec0` - PnL $6,719, ROI 43.35%, win 87.1%, drawdown 12.8%, closed positions 682, open positions 1
25. `0x7fa8a6161b17b4ee11ee591878de6930286300d0` - PnL $6,069, ROI 6.15%, win 83.4%, drawdown 14.0%, closed positions 723, open positions 1

## Duplicate Sample

No duplicate wallet addresses found across fetched API pages.

## Operator Read

The API count should be treated as a top-of-funnel universe, not a buyer-ready watchlist. The useful number for HL Intel is the stats-pass count, then the smaller manual-review count after open-position sanity checks.
