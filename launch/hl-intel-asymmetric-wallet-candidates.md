# HL Intel Asymmetric Wallet Candidates

Local research only. No website changes.

This pass fixes the overly strict 80% win-rate filter. A trader can be profitable with a 35-50% win rate if average winners materially exceed average losers. This scan looks for sub-80% win-rate wallets with positive PnL, controlled drawdown, enough closed positions, and evidence of asymmetric payoff.

## Filter Change

Old clean-grinder filter:

- Positive 3M PnL
- 500-3,000 closed positions
- Win rate >= 80%
- Max drawdown < 15%

New asymmetric candidate filter:

- Positive 3M PnL
- 300-3,000 closed positions
- Win rate 35-80%
- Max drawdown < 25%
- Then review payoff ratio, profit factor, ROI, labels, and current open-book risk

## Counts

- Prefiltered sub-80% candidates reviewed: 62
- Asymmetric watch: 12
- Review: 13
- Risk watch: 2
- Hold: 35

## Asymmetric Watch

1. `0x6d7823cd5c3d9dcd63e6a8021b475e0c7c94b291` - score 91, $414,759 PnL, ROI 7897.83%, win 65.9%, DD 7.5%, closed 1266, payoff n/a vs breakeven 0.52x, PF 99.00. Stats and labels suggest asymmetric trader; trade-level expectancy still needs confirmation. Positions: no open positions.
2. `0x2cef0a7f84e722c77b271862da5fe2387028fa20` - score 79, $91,945 PnL, ROI 161.75%, win 74.1%, DD 10.3%, closed 1989, payoff n/a vs breakeven 0.35x, PF 99.00. Stats and labels suggest asymmetric trader; trade-level expectancy still needs confirmation. Positions: no open positions.
3. `0x86149addc2ebeb610d2630b07cbfea5c19fa690e` - score 77, $110,980 PnL, ROI 134.89%, win 79.0%, DD 11.6%, closed 2595, payoff 0.60x vs breakeven 0.27x, PF 0.97. Stats and labels suggest asymmetric trader; trade-level expectancy still needs confirmation. Positions: no open positions.
4. `0x408d807d1dbb778f59a9c088e56d4c27bdd362ac` - score 71, $72,237 PnL, ROI 7223734.00%, win 55.3%, DD 10.3%, closed 1235, payoff n/a vs breakeven 0.81x, PF n/a. Stats and labels suggest asymmetric trader; trade-level expectancy still needs confirmation. Positions: HYPE S $141.
5. `0x83b1385d8126ecf64bfb3b4254d67eb9db753bcc` - score 70, $250,517 PnL, ROI 127.50%, win 65.9%, DD 6.4%, closed 2790, payoff n/a vs breakeven 0.52x, PF n/a. Stats and labels suggest asymmetric trader; trade-level expectancy still needs confirmation. Positions: DYDX L $-4,127.
6. `0xd2147a366e335b89b68ace628923962393b56813` - score 70, $188,689 PnL, ROI 56.77%, win 66.6%, DD 1.6%, closed 509, payoff n/a vs breakeven 0.50x, PF n/a. Stats and labels suggest asymmetric trader; trade-level expectancy still needs confirmation. Positions: no open positions.
7. `0x613ead0ea5af374af0ccfc117ef116a8e8d133fe` - score 65, $99,834 PnL, ROI 126.70%, win 46.3%, DD 9.8%, closed 905, payoff n/a vs breakeven 1.16x, PF n/a. Stats and labels suggest asymmetric trader; trade-level expectancy still needs confirmation. Positions: HYPE L $32,401.
8. `0x48b4c67ff2ba52157604efac6cb4024fd8a6f44a` - score 64, $74,972 PnL, ROI 80.10%, win 75.5%, DD 5.3%, closed 799, payoff n/a vs breakeven 0.33x, PF n/a. Stats and labels suggest asymmetric trader; trade-level expectancy still needs confirmation. Positions: no open positions.
9. `0xac82b3772ca54a154092e27109f61a31a6d743a5` - score 60, $165,064 PnL, ROI 77.06%, win 75.5%, DD 10.3%, closed 1366, payoff n/a vs breakeven 0.32x, PF n/a. Stats and labels suggest asymmetric trader; trade-level expectancy still needs confirmation. Positions: no open positions.
10. `0x197d1d1127b1a1da550f089375369d5acfeb0c72` - score 59, $71,880 PnL, ROI 108.72%, win 68.4%, DD 13.1%, closed 732, payoff n/a vs breakeven 0.46x, PF n/a. Stats and labels suggest asymmetric trader; trade-level expectancy still needs confirmation. Positions: ASTER S $108.
11. `0xe3c1447b94c5b278d9ec8d24855f5a5a2788542b` - score 56, $56,408 PnL, ROI 67.44%, win 48.3%, DD 11.0%, closed 836, payoff n/a vs breakeven 1.07x, PF n/a. Stats and labels suggest asymmetric trader; trade-level expectancy still needs confirmation. Positions: no open positions.
12. `0x837686cfda8a79adfb8465d39240c54166bf9a1e` - score 49, $530,235 PnL, ROI 36.71%, win 58.4%, DD 10.3%, closed 550, payoff n/a vs breakeven 0.71x, PF n/a. Stats and labels suggest asymmetric trader; trade-level expectancy still needs confirmation. Positions: ETH S $645,789; BTC S $-90,079; PAXG S $6,562; BNB S $-4,868; SOL S $-4,536.


## Review

1. `0x99928208b49f9b5cca8e875834df9d9e5e008d8b` - score 66, $82,687 PnL, ROI 8268682.00%, win 55.4%, DD 16.1%, closed 851, payoff n/a vs breakeven 0.81x, PF n/a. Lower-win-rate profitable wallet worth manual review. Positions: no open positions.
2. `0x85b3c124a704ae638622a1e99310f22eee7279c6` - score 65, $170,618 PnL, ROI 179.49%, win 66.2%, DD 16.3%, closed 1291, payoff n/a vs breakeven 0.51x, PF n/a. Lower-win-rate profitable wallet worth manual review. Positions: ETH S $-12,138; BTC L $1,945.
3. `0xbf1e78fcd3b89a8a3375e68a11a2e7412f24f2af` - score 60, $146,966 PnL, ROI 168.31%, win 49.7%, DD 10.8%, closed 2213, payoff n/a vs breakeven 1.01x, PF n/a. Lower-win-rate profitable wallet worth manual review. Positions: no open positions.
4. `0xa38747075ee46e51abdeb96e699fe60efe19b933` - score 60, $127,101 PnL, ROI 0.00%, win 74.8%, DD 2.4%, closed 881, payoff n/a vs breakeven 0.34x, PF n/a. Lower-win-rate profitable wallet worth manual review. Positions: no open positions.
5. `0x1fec14331b8a1d1af202fe71e99c7f1c552a9140` - score 55, $40,079 PnL, ROI 50.57%, win 49.4%, DD 9.9%, closed 504, payoff n/a vs breakeven 1.02x, PF n/a. Lower-win-rate profitable wallet worth manual review. Positions: no open positions.
6. `0x69523edb8337e624ea97a0c097ac5d3dede8e3d5` - score 53, $26,111 PnL, ROI 34.15%, win 80.0%, DD 8.9%, closed 1553, payoff n/a vs breakeven 0.25x, PF n/a. Lower-win-rate profitable wallet worth manual review. Positions: no open positions.
7. `0xe70f1efff7f7ad16f7413f3dd5772b98361ff378` - score 52, $33,353 PnL, ROI 38.74%, win 58.1%, DD 12.1%, closed 513, payoff n/a vs breakeven 0.72x, PF n/a. Lower-win-rate profitable wallet worth manual review. Positions: no open positions.
8. `0x3294a2a613e856631875e263644f27f75d2488fb` - score 49, $42,444 PnL, ROI 53.97%, win 66.6%, DD 16.4%, closed 1161, payoff n/a vs breakeven 0.50x, PF n/a. Lower-win-rate profitable wallet worth manual review. Positions: MORPHO L $-95.
9. `0xda3768e9299e1fd81708ec030dac5ea37125f7b5` - score 46, $40,985 PnL, ROI 43.26%, win 53.5%, DD 18.7%, closed 957, payoff n/a vs breakeven 0.87x, PF n/a. Lower-win-rate profitable wallet worth manual review. Positions: no open positions.
10. `0x929689eafa23fc78a04d1a1f700cc901525007cc` - score 46, $39,696 PnL, ROI 49.57%, win 53.4%, DD 18.7%, closed 799, payoff n/a vs breakeven 0.87x, PF n/a. Lower-win-rate profitable wallet worth manual review. Positions: no open positions.
11. `0xeebd3f1efe690a690668be1c20d1471fe9c3966d` - score 45, $49,790 PnL, ROI 24.36%, win 52.2%, DD 9.2%, closed 1495, payoff n/a vs breakeven 0.91x, PF n/a. Lower-win-rate profitable wallet worth manual review. Positions: no open positions.
12. `0xed48b856556a69c7c40229c9c4c829b909257c9b` - score 34, $178,435 PnL, ROI 15.27%, win 41.8%, DD 12.5%, closed 1557, payoff n/a vs breakeven 1.39x, PF n/a. Lower-win-rate profitable wallet worth manual review. Positions: ETH S $610,018; BTC L $-82,290.
13. `0x049db0bdc4a8569bacb8f33210af514a82aec838` - score 32, $31,559 PnL, ROI 42.67%, win 72.8%, DD 24.0%, closed 1126, payoff n/a vs breakeven 0.37x, PF n/a. Lower-win-rate profitable wallet worth manual review. Positions: HYPE S $-16,213.


## Risk Watch

1. `0xb798aef79972ce8f73d47b9ebbcda6bbb7ec4fbf` - score 24, $1,950,058 PnL, ROI 20.92%, win 77.6%, DD 23.5%, closed 1451, payoff n/a vs breakeven 0.29x, PF n/a. Stats are interesting, but current open losses are too large for clean signal use. Positions: BTC S $-3,683,492.
2. `0x202ed102cca91d1237971252eee1add2f303eb8b` - score 17, $65,408 PnL, ROI 53.08%, win 79.9%, DD 24.1%, closed 623, payoff n/a vs breakeven 0.25x, PF n/a. Stats are interesting, but current open losses are too large for clean signal use. Positions: BTC S $-87,676.


## Hold

1. `0x1289894a932ae5b4679b236f96eae4236f4ee9c4` - score 70, $9,288 PnL, ROI 51.62%, win 42.7%, DD 14.8%, closed 323, payoff 5.91x vs breakeven 1.34x, PF 5.91. Interesting but below current asymmetric-watch quality bar. Positions: HYPE L $321.
2. `0xe98b6b0575b376ce1a45abb33b9fba1d7ea3b194` - score 66, $1,389 PnL, ROI 1.69%, win 42.4%, DD 9.3%, closed 1344, payoff 68.14x vs breakeven 1.36x, PF 12.39. Interesting but below current asymmetric-watch quality bar. Positions: no open positions.
3. `0xb85c2b4d7f3fdc605e7c26d06b1a640371992602` - score 59, $6,132 PnL, ROI 33.06%, win 41.8%, DD 0.1%, closed 881, payoff n/a vs breakeven 1.39x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: no open positions.
4. `0xb5be7ae6f69c5d3ad941e17200ea316db91aa9fb` - score 56, $7,070 PnL, ROI 48.23%, win 60.8%, DD 5.7%, closed 543, payoff n/a vs breakeven 0.65x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: no open positions.
5. `0xfc617b04c5b804e4ebf47627eb0d536cd12508a2` - score 56, $5,456 PnL, ROI 19.66%, win 47.1%, DD 2.5%, closed 724, payoff n/a vs breakeven 1.12x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: PURR S $-826; HYPE L $-763; XRP L $81.
6. `0x4c56bfd325f350bd1af76bf691981fdd8740390a` - score 52, $21,820 PnL, ROI 25.03%, win 54.5%, DD 8.6%, closed 1713, payoff n/a vs breakeven 0.84x, PF 99.00. Interesting but below current asymmetric-watch quality bar. Positions: DOGE S $19,412; AVAX S $5,705; LINK S $3,961; ASTER S $2,559; CC S $82.
7. `0x3adb3a63ebf9c65d08d2cdba71a4da3fde798a81` - score 51, $11,257 PnL, ROI 28.40%, win 74.0%, DD 1.7%, closed 358, payoff n/a vs breakeven 0.35x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: no open positions.
8. `0xf2704e08a4d989f76171c9389665e77c870345a7` - score 49, $10,539 PnL, ROI 56.97%, win 44.8%, DD 14.2%, closed 928, payoff n/a vs breakeven 1.23x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: ZEC L $1,159; NEAR L $1,052; HYPE L $489; TON L $-328; VVV L $128.
9. `0x56f846f6fcc654ed675fff4887f7dd54b2389433` - score 49, $5,782 PnL, ROI 37.74%, win 61.1%, DD 10.9%, closed 792, payoff n/a vs breakeven 0.64x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: no open positions.
10. `0xa8123bfb8301ebcd78c41d90e1ce9d3107ff1823` - score 47, $16,797 PnL, ROI 11.67%, win 65.1%, DD 11.8%, closed 1071, payoff n/a vs breakeven 0.54x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: HYPE L $1,485.
11. `0x197d0b8d520667f6a14ce98215c2f945e6cd3ccc` - score 47, $11,712 PnL, ROI 14.31%, win 48.5%, DD 3.7%, closed 1103, payoff n/a vs breakeven 1.06x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: no open positions.
12. `0x06b786a0d3dbc3e9f71e42a365800361f8006980` - score 47, $4,563 PnL, ROI 26.56%, win 79.6%, DD 11.8%, closed 783, payoff n/a vs breakeven 0.26x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: no open positions.
13. `0x413814a7d66b730aa5325421839c7a6b512e0ea9` - score 46, $19,674 PnL, ROI 41.46%, win 59.2%, DD 16.1%, closed 833, payoff n/a vs breakeven 0.69x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: no open positions.
14. `0x8cf120f68a0c32c320c01819e30e600109eaa1e7` - score 42, $2,250 PnL, ROI 1.00%, win 68.6%, DD 12.8%, closed 1088, payoff n/a vs breakeven 0.46x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: HYPE L $28.
15. `0xed2c11cf1e54a528af44d580fed126746a6b8b97` - score 40, $6,006 PnL, ROI 38.71%, win 70.5%, DD 12.3%, closed 482, payoff n/a vs breakeven 0.42x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: BTC S $-305.
16. `0x14fdad7329f3868d6daee16d8d2c6da3e4bb8133` - score 40, $2,452 PnL, ROI 2.50%, win 76.4%, DD 14.9%, closed 730, payoff n/a vs breakeven 0.31x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: no open positions.
17. `0x61072c535710e89637c52ae633e0f9967e8cce51` - score 40, $2,325 PnL, ROI 8.13%, win 57.3%, DD 3.0%, closed 690, payoff n/a vs breakeven 0.75x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: TRX L $160; BCH S $65; ZEC L $54; TRUMP S $40; SKY S $28.
18. `0xac1cf9e3de1895f74d110f1be546ae1447e7fe92` - score 39, $11,734 PnL, ROI 10.63%, win 54.1%, DD 11.2%, closed 1000, payoff n/a vs breakeven 0.85x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: no open positions.
19. `0x529e68b3ca732d8a0ef4484eff601d8736094577` - score 39, $2,056 PnL, ROI 11.26%, win 57.4%, DD 4.0%, closed 685, payoff n/a vs breakeven 0.74x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: TRX L $142; BCH S $58; ZEC L $48; TRUMP S $37; SKY S $26.
20. `0xe3142a08b1f55ccb4ac941e78b2a88933b1a30a7` - score 38, $3,667 PnL, ROI 34.69%, win 60.3%, DD 12.7%, closed 300, payoff n/a vs breakeven 0.66x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: no open positions.
21. `0x47c328f9aa5790478f48f93ddb4bf709cea46324` - score 37, $10,338 PnL, ROI 76.48%, win 64.1%, DD 12.3%, closed 323, payoff n/a vs breakeven 0.56x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: no open positions.
22. `0x6d79dc0730736e1d3c6e989f8e038618f9c77e0e` - score 37, $1,835 PnL, ROI 13.20%, win 56.2%, DD 6.2%, closed 715, payoff n/a vs breakeven 0.78x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: BCH S $50; TRUMP S $30; TRX L $29; SKY S $23; XLM S $18.
23. `0x412637a217ac400a5b838b4165bfe168241312dd` - score 37, $887 PnL, ROI 3.70%, win 59.1%, DD 8.3%, closed 369, payoff n/a vs breakeven 0.69x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: HYPE L $6,465.
24. `0x5aadb434293b4e1b8fb2e84007e567506fe65a96` - score 35, $8,623 PnL, ROI 10.27%, win 71.8%, DD 15.3%, closed 450, payoff n/a vs breakeven 0.39x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: HYPE L $33,316.
25. `0x3ee6903c8a6a112bd322a4ddc97d39953c414adb` - score 34, $87 PnL, ROI 0.86%, win 58.5%, DD 14.7%, closed 869, payoff n/a vs breakeven 0.71x, PF n/a. Interesting but below current asymmetric-watch quality bar. Positions: BTC S $-7.


## Operator Read

The original 80% win-rate rule is useful for finding smooth grinders, but it misses asymmetric traders. Keep the original cohort as the clean feed, and add a separate asymmetric lane. Do not merge them blindly. These wallets need payoff-ratio validation and open-book sanity checks before they enter the pilot monitor.
