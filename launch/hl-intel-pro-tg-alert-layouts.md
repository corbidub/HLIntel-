# HL Intel Pro Telegram Alert Layouts

Purpose:
- Define how alerts should look inside `HLIntelPro`.
- Keep alerts concise, ranked, and risk-aware.
- Make the channel feel like an intelligence feed, not a signal group.

## Style Rules

Use:
- short headers
- consistent fields
- plain risk notes
- one-line interpretation
- `Data only. NFA.` footer

Avoid:
- "buy"
- "sell"
- "ape"
- "copy"
- "guaranteed"
- long paragraphs
- excessive emojis
- every-fill spam

Recommended emoji set:
- `🚨` major event
- `🐋` wallet
- `📍` token/position
- `📊` size/context
- `⚠️` risk
- `🧠` interpretation
- `🔒` Pro tag

## Master Format

```text
🔒 HL INTEL PRO | {EVENT}

🐋 Wallet: {short_wallet}
Rank: {rank} / {profile}

📍 {token} {side}
Event: {position_change}

📊 Size: {notional}
Change: {change}
Open uPnL: {open_upnl}

⚠️ Risk: {risk_context}

🧠 Why it matters:
{one_line_reason}

Data only. NFA.
```

## Flagship Entry / Active Position Alert

Use when a flagship wallet opens a meaningful watched-token position.

```text
🔒 HL INTEL PRO | ENTRY

🐋 Wallet: 0x6979...da62
Rank: Flagship / Elite Behavior

📍 BTC short
Event: opened fresh position

📊 Size: $3.3M notional
Open uPnL: +$213K

⚠️ Risk: large notional vs account value

🧠 Why it matters:
This is the cleanest ranked wallet currently monitored. The useful alert is what it does next: add, trim, exit, or flip.

Data only. NFA.
```

## Add Alert

Use when a tracked wallet materially increases an existing position.

```text
🔒 HL INTEL PRO | ADD

🐋 Wallet: 0x6979...da62
Rank: Flagship / Elite Behavior

📍 BTC short
Event: added to existing short

📊 Size: $3.45M notional
Change: +$140K notional
Open uPnL: +$225K

⚠️ Risk: position remains large relative to account value

🧠 Why it matters:
Flagship wallet increased BTC short exposure while already sitting on large open profit.

Data only. NFA.
```

## Trim Alert

Use when a tracked wallet materially reduces exposure without fully exiting.

```text
🔒 HL INTEL PRO | TRIM

🐋 Wallet: 0x6979...da62
Rank: Flagship / Elite Behavior

📍 BTC short
Event: trimmed position

📊 Size: $2.85M remaining
Change: -$460K notional
Open uPnL: +$190K

⚠️ Risk: still holding meaningful short exposure

🧠 Why it matters:
This is a high-value unwind alert from the current flagship BTC wallet.

Data only. NFA.
```

## Exit Alert

Use when a tracked wallet fully closes a watched-token position.

```text
🔒 HL INTEL PRO | EXIT

🐋 Wallet: 0x6979...da62
Rank: Flagship / Elite Behavior

📍 BTC short
Event: fully closed position

📊 Closed size: ~$3.3M notional
Prior open uPnL: +$213K

⚠️ Risk: exit may mark risk reduction, not automatic reversal

🧠 Why it matters:
Flagship wallet closed a large profitable BTC short. This is more important than a routine size change.

Data only. NFA.
```

## Flip Alert

Use when a wallet closes one side and opens the opposite side.

```text
🔒 HL INTEL PRO | FLIP

🐋 Wallet: 0x6979...da62
Rank: Flagship / Elite Behavior

📍 BTC
Event: short closed, long opened

📊 Prior: ~$3.3M short
New: $900K long

⚠️ Risk: major directional behavior change

🧠 Why it matters:
Ranked wallet changed directional exposure. Treat as market context, not an execution instruction.

Data only. NFA.
```

## Custom Watch Entry

Use for user-selected wallets/tokens that are not flagship quality.

```text
🔒 HL INTEL PRO | CUSTOM WATCH ENTRY

🐋 Wallet: 0x8614...690e
Rank: Custom Watch / Asymmetric

📍 ZEC short
Event: opened fresh position

📊 Size: $42.6K notional
Open uPnL: +$243

⚠️ Risk: high leverage profile; not flagship curated feed

🧠 Why it matters:
This wallet has strong behavior metrics and recurring activity across BTC/HYPE/ETH/TAO/SOL/DOGE, but leverage keeps it custom-only.

Data only. NFA.
```

## Reactivation Watch

Use when a previously flat wallet reopens meaningful exposure.

```text
🔒 HL INTEL PRO | REACTIVATION

🐋 Wallet: 0xbf1e...f2af
Rank: Custom Watch / Asymmetric Review

📍 BTC short
Event: fresh exposure detected

📊 Size: $80K notional
Open uPnL: flat

⚠️ Risk: high leverage; payoff sample needs more validation

🧠 Why it matters:
This wallet has a lower win-rate profile with possible asymmetric payoff behavior. Watch entry/exit behavior before promoting.

Data only. NFA.
```

## Risk Change Alert

Use when an existing position becomes more dangerous or a wallet behaves poorly.

```text
🔒 HL INTEL PRO | RISK CHANGE

🐋 Wallet: 0xa3d8...fb6b
Rank: Custom Watch / Elite Stats, Noisy Behavior

📍 BTC long
Event: open loss expanded

📊 Size: $229K notional
Open uPnL: -$18K

⚠️ Risk: high leverage; negative free margin; RWA/xyz activity

🧠 Why it matters:
Headline stats are strong, but current book behavior is not clean enough for flagship alerts.

Data only. NFA.
```

## Source Conflict / Manual Review Alert

Use internally or rarely in Pro when a watched wallet has data-quality issues.

```text
🔒 HL INTEL PRO | DATA REVIEW

🐋 Wallet: 0x613e...33fe
Rank: Manual Review / Data Conflict

📍 HYPE long
Event: position active, but source conflict detected

📊 Size: ~$598K notional
Open uPnL: +$32K

⚠️ Risk: screener PnL and behavior curve disagree

🧠 Why it matters:
This is exactly why HL Intel filters wallets before alerting. Interesting position, but not product-safe yet.

Data only. NFA.
```

## Daily Pro Digest

Use once per day during the manual pilot.

```text
🔒 HL INTEL PRO | DAILY WALLET DIGEST

Window: Last 24h
Tracked wallets: 7
Watched tokens: BTC, HYPE, ETH, SOL, ZEC

1. 0x6979...da62 | Flagship / BTC
Still short BTC.
Current: ~$3.3M short, +$213K uPnL.
No major trim/exit yet.

2. 0x8614...690e | Custom Watch / Asymmetric
Opened ZEC short.
Current: ~$42.6K short, near flat uPnL.
Risk: high leverage profile.

3. 0xa3d8...fb6b | Custom BTC
Still BTC long and underwater.
Risk: noisy RWA/xyz behavior; not flagship.

Summary:
The flagship BTC short remains the highest-value watch. No broad curated-feed expansion yet.

Data only. NFA.
```

## Free Channel Teaser Format

Free channel should tease the category, not give the full detail.

```text
HL INTEL FREE

A ranked BTC wallet is still sitting in a large profitable short.

Pro is watching for:
- trim
- full exit
- flip
- material add

Data only. NFA.
```

## Channel Posting Rules

Post immediately for:
- flagship entry/add/trim/exit/flip
- custom-watch entry/exit for paid pilot users
- major risk change on watched wallets

Batch into digest:
- no-change updates
- small position changes
- reactivation watches without meaningful size
- custom-only wallets with weak conviction

Do not post:
- tiny fills
- raw trade spam
- source-conflict wallets unless explicitly framed as data review
- risk rejects
- tokens outside user watchlists
