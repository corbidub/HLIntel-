# HL Intel Wallet Filter Notes

Local research only. Do not ship this copy to the website until the alert data proves useful.

## Current Strong Watch Rule

Use a wallet as a first-pass watch candidate when it has:

- Positive 3M total PnL
- 500 to 3,000 trades over 3M
- Max drawdown better than -15%
- Accuracy at or above 80%

This favors wallets with enough activity to show repeatable behavior, without turning the Pro feed into a high-frequency noise stream.

## Current Shortlist

The first 3M pass produced 7 clean candidates:

- `0x06cecfbac34101ae41c88ebc2450f8602b3d164b`
- `0xfd423284f6a9c73a2a3d53cab8921d6533533d97`
- `0xa875890465da20062bcf3b024bf7d54e69c725a8`
- `0x9c89f595f5515609ad61f6fda94beff85ae6600e`
- `0xa3d843b6a057504284006bef6f34a2e9bc80fb6b`
- `0x143c28ae5b8642f58c98b8a6f82a0f314d23f6ab`
- `0x69cc3ae720efdff1cd2a8edec79a7a3fac6e14fd`
- `0x0daf132c5554fd7d5eb422585426af557d8847e0`

## Filtered Out For Now

- `0x45d26f28196d226497130c4bac709d808fed4029`: positive PnL but 11,221 trades and 47.5% accuracy.
- `0xb798aef79972ce8f73d47b9ebbcda6bbb7ec4fbf`: positive PnL but -23.5% drawdown.
- `0x519c721de735f7c9e6146d167852e60d60496a47`: 7,314 trades, 58.3% accuracy, -22.1% drawdown.
- `0x61ceef212ff4a86933c69fb6aca2fe35d8f2a62b`: 59,215 trades and -99.9% drawdown.
- `0x4a20b9496610941053858bd0b7e92493f44c3c26`: -99.9% drawdown.
- `0xaea8e3bd369217cc6e3e6abddf0da318fba8e59b`: -42.5% drawdown.
- `0xedf2b293d5b358f17330c8412e0be36feaa8fc0b`: 5,308 trades and 57.9% accuracy.
- `0x7da85a334e43a6b1c2c0da9623409d9ee9047747`: -67.2% drawdown.
- `0x7eb9026d0183942458bd4660371c3cc0a2df3beb`: -99.9% drawdown.
- `0x5faed49291db46f90e9af7331e41046e65776e5f`: -81.8% drawdown.

## Needs More Review From Ranks 16-50

- `0x00f8da96829820da934fc4a4cb7d39031ce7454b`: positive PnL but 3,917 trades and 71.8% accuracy.
- `0x837686cfda8a79adfb8465d39240c54166bf9a1e`: positive PnL and target trade count, but 58.4% accuracy.
- `0xb245ed242d9f9a86e75cdb30892d9d922cd568ba`: positive PnL and target trade count, but 35.2% accuracy.
- `0x6d7823cd5c3d9dcd63e6a8021b475e0c7c94b291`: positive PnL and target trade count, but 64.9% accuracy.
- `0xb83de012dba672c76a7dbbbf3e459cb59d7d6e36`: positive PnL, but 37,120 trades and -20.6% drawdown. Risk-monitor candidate at best.

## Next Review Step

For each shortlisted wallet, inspect:

- Current open positions
- Most recent 5-10 trades
- Whether trade sizing is consistent
- Whether the wallet is building positions or scalping
- Whether alerts would fire too often
- Whether the wallet has one market specialty or chaotic multi-asset behavior
