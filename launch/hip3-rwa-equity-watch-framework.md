# HL Intel HIP-3 / RWA Watch Framework

Created: 2026-05-20

## Core Thesis

Hyperliquid is evolving from a crypto perp venue into a broader on-chain derivatives venue through HIP-3 builder-deployed markets.

HL Intel should treat this as a new intelligence layer:

```text
Crypto-native whales are no longer only expressing crypto views.
They can express stock, index, commodity, volatility, and macro views on-chain.
```

The product opportunity is not "stock alerts."

The product opportunity is:

```text
On-chain market participant intelligence across crypto, commodities, equity perps, and macro exposure.
```

## Source Context

- Hyperliquid HIP-3 docs: builder-deployed perps are supported by the protocol, and deployers are responsible for market definition, oracle definitions, contract specs, leverage limits, and market operation.
- HIP-3 markets use the HyperCore stack, with unified trading APIs for builder-deployed perps.
- Equity-style markets are accessed through builder venues such as trade.xyz, not necessarily the main Hyperliquid interface.
- The TradFi angle is adjacent to, but different from, the 21Shares Hyperliquid ETF on Nasdaq. The ETF is HYPE exposure. HIP-3 is the on-chain perp market expansion.

## Watch Universe

### Tier 1: Crypto-Native Macro

These should be the first RWA watch markets because they connect directly to crypto trader behavior.

```text
SP500 / broad equity risk
XYZ100 / Nasdaq-style tech risk
VIX / volatility hedge
Gold / PAXG / precious metals proxy
Oil / macro event hedge
```

### Tier 2: Crypto-Adjacent Equities

These are most likely to produce useful reads from crypto-native whales.

```text
COIN
MSTR
HOOD
CRCL
NVDA
TSLA
```

### Tier 3: Mega-Cap Equity Beta

Useful once volume and whale participation are proven.

```text
AAPL
MSFT
GOOGL
AMZN
META
NFLX
AMD
TSM
```

### Tier 4: Event / Earnings Watch

Only promote when the event setup is clear.

```text
earnings
Fed / CPI / jobs data
weekend geopolitical events
sector shocks
large after-hours moves
```

## Wallet Classification

Every RWA/equity signal should be classified by wallet behavior first, market second.

### Participant Types

```text
Crypto-native macro whale
Equity beta rotator
Hedge / risk-off participant
Event trader
Proxy trader
Noise / unproven participant
```

### Behavior Tags

```text
risk_on
risk_off
hedge
rotation
event_trade
proxy_trade
crowded_trade
contrarian_trade
deleveraging
```

### Position Actions

```text
entered
added
trimmed
exited
flipped
holding
reactivated
```

## Signal Quality Rules

### Pro-Worthy

Send to Pro when at least one of these is true:

```text
1. High-quality wallet opens or adds meaningful size in a HIP-3/RWA market.
2. Multiple watched wallets move into the same macro/equity exposure.
3. A crypto whale uses an equity/index/commodity perp as a hedge against crypto exposure.
4. A wallet flips from crypto risk-on to TradFi/macro risk-off exposure.
5. A position is tied to a major event window, such as earnings, CPI, Fed, or weekend geopolitical risk.
6. A previously profitable RWA/equity perp position materially trims, exits, or flips.
```

### Public Teaser

Post publicly when the signal has a clean narrative but does not reveal the full Pro read.

Good public framing:

```text
Crypto whales are starting to express TradFi views on-chain.

One tracked Hyperliquid wallet is using [market] exposure as [risk-on / hedge / macro] positioning.

This is the layer we care about:
not just what they bought,
but what it says about risk appetite.

Data only. NFA.
```

### Skip / Internal Only

Do not promote when:

```text
wallet quality is unknown
position size is too small
market liquidity is thin
oracle / market source is unclear
position is likely noise or very short-lived
trade cannot be interpreted beyond "someone traded a stock perp"
```

## Alert Template

```text
🧠 HL INTEL | HIP-3 / RWA WATCH

Market: [NVDA / SP500 / XYZ100 / GOLD / OIL]
Direction: [long / short]
Size: [$ notional]
Wallet: [0x1234...abcd]
Wallet class: [elite / custom watch / unproven]
Action: [entered / added / trimmed / exited / flipped]

Read:
[Plain-English interpretation of what this position means.]

Why it matters:
[Tie to crypto risk appetite, macro hedge, earnings, weekend market gap, or proxy exposure.]

Watch next:
[add / trim / exit / flip / liquidation band / event window]

Data only. NFA.
```

## Daily Digest Template

```text
🧠 HL INTEL | RWA PARTICIPANT READ

Active RWA wallets: [x/y]
Net posture: [risk-on / risk-off / hedge-heavy / mixed]
Top exposure:
- [market] [long/short] [$ notional]
- [market] [long/short] [$ notional]
- [market] [long/short] [$ notional]

Read:
[One paragraph on what crypto-native whales are doing outside crypto.]

Key shift:
[rotation into equities, macro hedge, gold/oil demand, volatility hedge, etc.]

Data only. NFA.
```

## Public Positioning

This is how to talk about the update:

```text
HL Intel is expanding from crypto-only whale alerts into on-chain market participant intelligence.

With HIP-3 markets, watched wallets can now express views on indices, stocks, commodities, and macro exposure 24/7.

We are tracking what those participants do next.

Data only. NFA.
```

## Product Packaging

### Free

```text
High-level RWA/equity market observations.
Occasional public examples.
No full wallet read.
No full position list.
No real-time behavior trail.
```

### Pro

```text
Wallet-level RWA/equity alerts.
Position adds/trims/exits/flips.
Macro posture read.
Crypto-to-TradFi rotation tracking.
Event-window watchlist.
Daily RWA participant digest.
```

## MVP Implementation Plan

### Phase 1: Manual Read

```text
Track 5-10 existing VIP wallets.
Check whether they hold HIP-3/RWA markets.
Tag any stock/index/commodity exposure.
Write manual Pro reads when meaningful.
```

### Phase 2: Structured Monitor

```text
Add RWA market category mapping.
Add position classifier for HIP-3 markets.
Add participant tags:
- crypto
- equity
- index
- commodity
- volatility
- macro
```

### Phase 3: Alert Automation

```text
Trigger on:
- new RWA/equity position
- material add
- material trim
- exit
- flip
- cross-asset hedge
- event-window position
```

## Immediate Next Moves

1. Build a starter HIP-3/RWA market map.
2. Search existing VIP wallet positions for non-crypto exposure.
3. Add a manual `RWA participant read` section to the daily digest.
4. Post a public thesis tweet announcing the expanded watch layer.
5. Start comment mining under `$HYPE`, `Hyperliquid`, `HIP-3`, `trade.xyz`, `$NVDA`, `$COIN`, `$MSTR`, `$ZEC`, `SP500`, and `on-chain equities` conversations.
