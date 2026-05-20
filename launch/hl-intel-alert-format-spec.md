# HL Intel Alert Format Spec

Purpose:
- Make every alert answer one question quickly: is this meaningful wallet positioning or noise?
- Support the buyer-requested workflow: ranked wallets, token filters, entry/exit alerts, and favorite-wallet digests.
- Keep alerts informational. No copy-trading language, no trade calls, no PnL promises.

Related:
- `hl-intel-pro-tg-alert-layouts.md` contains ready-to-post Telegram layouts and examples.

## Core Alert Object

Every alert should contain:
- `event_type`: entry, add, trim, exit, flip, risk_change, digest
- `wallet`: shortened wallet address
- `wallet_rank`: curated tier or custom-watch label
- `behavior_profile`: elite, asymmetric, custom, reactivation, risk-watch
- `token`: BTC, HYPE, ETH, etc.
- `side`: long or short
- `notional`: current or changed position size
- `position_change`: opened, added, trimmed, closed, flipped
- `open_upnl`: current unrealized PnL if available
- `risk_context`: leverage, liquidation distance, drawdown/source flags
- `why_it_matters`: one-line interpretation
- `action_note`: data-only reminder, not a trade recommendation

## Telegram Alert Style

Use compact, scan-friendly alerts. Avoid hype.

Preferred structure:

```text
HL INTEL | {EVENT_TYPE}

Wallet: {short_wallet}
Rank: {wallet_rank} / {behavior_profile}
Token: {token} {side}

Event: {position_change}
Size: {notional}
Open uPnL: {open_upnl}
Risk: {risk_context}

Why it matters:
{why_it_matters}

Data only. NFA.
```

## Alert Types

### 1. Entry Alert

Trigger:
- A tracked wallet opens meaningful fresh exposure in a watched token.

Suppress if:
- Position notional is below threshold.
- Wallet is noisy/custom-only and token is not on the user's watchlist.
- Wallet has risk flags that make it internal-only.

Example:

```text
HL INTEL | ENTRY

Wallet: 0x8614...690e
Rank: Custom Watch / Asymmetric
Token: ZEC short

Event: opened fresh position
Size: $42.6K notional
Open uPnL: +$243
Risk: high leverage profile; custom-watch only

Why it matters:
This wallet has strong 3M behavior and recurring activity across BTC/HYPE/ETH/TAO/SOL/DOGE, but leverage keeps it out of the flagship feed.

Data only. NFA.
```

### 2. Add Alert

Trigger:
- Wallet materially increases an existing position.

Default threshold:
- At least 10% position-size change and at least $25K notional change.

Example:

```text
HL INTEL | ADD

Wallet: 0x6979...da62
Rank: Flagship / Elite Behavior
Token: BTC short

Event: added to existing short
Size: $3.45M notional
Change: +$140K notional
Open uPnL: +$225K
Risk: large notional vs account value

Why it matters:
Flagship BTC wallet increased exposure while already sitting on large open profit.

Data only. NFA.
```

### 3. Trim Alert

Trigger:
- Wallet materially reduces an existing position without fully exiting.

Default threshold:
- At least 10% position-size reduction and at least $25K notional change.

Example:

```text
HL INTEL | TRIM

Wallet: 0x6979...da62
Rank: Flagship / Elite Behavior
Token: BTC short

Event: trimmed position
Size: $2.85M remaining
Change: -$460K notional
Open uPnL: +$190K
Risk: still large open short

Why it matters:
This is the main monetizable alert for the current flagship wallet: unwind behavior after a profitable BTC short.

Data only. NFA.
```

### 4. Exit Alert

Trigger:
- Wallet fully closes a watched-token position.

Example:

```text
HL INTEL | EXIT

Wallet: 0x6979...da62
Rank: Flagship / Elite Behavior
Token: BTC short

Event: fully closed position
Closed Size: ~$3.3M notional
Prior Open uPnL: +$213K
Risk: source mismatch flag cleared by live stats check

Why it matters:
Flagship wallet exited a large profitable BTC short. This may matter more than the original entry because it marks risk-off/unwind behavior.

Data only. NFA.
```

### 5. Flip Alert

Trigger:
- Wallet closes one side and opens opposite exposure in the same token.

Example:

```text
HL INTEL | FLIP

Wallet: 0x6979...da62
Rank: Flagship / Elite Behavior
Token: BTC

Event: short closed, long opened
New Position: BTC long $900K notional
Prior Position: BTC short ~$3.3M notional
Risk: major directional behavior change

Why it matters:
This is a high-signal regime-change alert from a ranked wallet, not a routine size adjustment.

Data only. NFA.
```

### 6. Risk Change Alert

Trigger:
- Liquidation risk tightens materially.
- Large open uPnL compresses.
- Wallet adds into adverse movement.
- Wallet crosses a risk threshold.

Example:

```text
HL INTEL | RISK CHANGE

Wallet: 0xa3d8...fb6b
Rank: Custom Watch / Elite Stats, Noisy Behavior
Token: BTC long

Event: open loss expanded
Size: $229K notional
Open uPnL: -$18K
Risk: high leverage; negative free margin; RWA/xyz noise

Why it matters:
This wallet has strong headline stats but is not clean enough for flagship alerts. Risk changes should be watched, not blindly followed.

Data only. NFA.
```

## Favorite Wallet Digest

Frequency:
- Daily for Free/Pro if manual.
- More often only if user specifically requests.

Digest format:

```text
HL INTEL | FAVORITE WALLET DIGEST

Window: last 24h
Tracked wallets: {count}
Watched tokens: {tokens}

1. 0x6979...da62 | Elite / BTC
   Still short BTC. No major trim/exit yet.
   Current: ~$3.3M short, +$213K uPnL.

2. 0x8614...690e | Asymmetric Custom
   Opened ZEC short. Position is small but watchable.
   Risk: high leverage profile.

3. 0xa3d8...fb6b | Custom BTC
   Still BTC long and underwater.
   Risk: noisy RWA/xyz behavior; not flagship.

Summary:
Flagship BTC short remains the highest-value watch. No broad curated-feed expansion yet.

Data only. NFA.
```

## Ranking Labels

Use plain labels:
- `Flagship`: cleanest curated wallets for Pro alerts.
- `Custom Watch`: useful only for user-selected tokens/wallets.
- `Reactivation Watch`: no current position; alert only on fresh entry.
- `Risk Watch`: internal or cautionary; do not sell as signal.
- `Data Conflict`: source mismatch or insufficient PnL curve data.

Avoid:
- "money printer"
- "guaranteed"
- "copy this"
- "buy/sell"
- "alpha call"

## Default Suppression Rules

Suppress alerts when:
- Position change is below threshold.
- Wallet is noisy and token is not on watchlist.
- Wallet is internal risk-watch only.
- Wallet has unresolved source conflict.
- Position is tiny relative to wallet/account context.
- Alert would repeat the same unchanged position.

Default thresholds:
- Active flagship wallet: alert on >=10% size change and >=$25K notional change.
- Custom watch wallet: alert only on entry, exit, flip, or >=20% size change.
- Reactivation watch: alert only on fresh position open above notional threshold.
- Risk watch: no public alert unless manually approved.

## MVP Implementation Scope

First paid-pilot version should support:
- curated wallet list
- user-supplied wallet list
- token watchlist
- entry/add/trim/exit/flip events
- daily digest
- visible risk flags

Do not build:
- auto-copy trading
- guaranteed signal scoring
- noisy every-fill alerts
- public feed for every wallet movement
