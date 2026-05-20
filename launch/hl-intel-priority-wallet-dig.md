# HL Intel Priority Wallet Dig

Generated: 2026-05-19T15:43:31.653Z

Scope:
- Today's wallets with `elite_behavior`, `asymmetric_behavior`, or `risk_watch`.
- Goal is product readiness for ranked-wallet and token-specific entry/exit alerts.

## Operator Summary

- Use `0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62` as the flagship active BTC monitor.
- The best MVP shape is a blend of curated wallets plus custom token/watchlist filters.
- Reactivation wallets are valuable because they map directly to "notify me when a good wallet gets into TOKEN."
- RWA/xyz-heavy wallets should be suppressed by default unless a user asks for those tokens.
- `risk_watch` wallets should stay internal until curve quality improves.

## Pilot-Ready / Strongest

1. `0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62` — A/elite_behavior/flagship_active_btc_unwind
   - Readiness: pilot_ready
   - Token filter: BTC
   - Alert policy: Alert on BTC trim, full exit, flip, material add, or large uPnL compression.
   - 3M: $477,272 PnL, 122.8% ROI, 96.8% win, 0.1% DD
   - Current: BTC S $3,309,213 uPnL $213,425 liq 84757.5628073499
   - Risk: Notional/account size is aggressive; context alert only, not copy-trade.


## Secondary / Custom Watchlist Only

1. `0xa3d843b6a057504284006bef6f34a2e9bc80fb6b` — B/elite_behavior/specialized_noisy_monitor
   - Readiness: pilot_secondary
   - Token filter: BTC
   - Alert policy: Alert only on full close, flip, or major position expansion. Suppress small churn.
   - 3M: $1,108,324 PnL, 4875.1% ROI, 92.3% win, 12.4% DD
   - Current: BTC L $229,472 uPnL $-11,203 liq 3356.8891632068
   - Risk: Noisy symbols: xyz:SPCX, xyz:CBRS, xyz:TSLA, xyz:MSTR; 1W DD 97.3%; Current uPnL $-11,203; Leverage ratio 10.7x

2. `0x86149addc2ebeb610d2630b07cbfea5c19fa690e` — A/asymmetric_behavior/specialized_noisy_monitor
   - Readiness: pilot_secondary
   - Token filter: BTC, ETH, HYPE, TAO, SOL, DOGE
   - Alert policy: Alert only on full close, flip, or major position expansion. Suppress small churn.
   - 3M: $114,625 PnL, 352.2% ROI, 79.4% win, 11.6% DD
   - Current: ZEC S $42,766 uPnL $94 liq 4311.4411540683
   - Risk: 1W DD 100.0%; Leverage ratio 10.3x

3. `0x6d7823cd5c3d9dcd63e6a8021b475e0c7c94b291` — B/asymmetric_behavior/reactivation_watch_noisy_tokens
   - Readiness: pilot_secondary
   - Token filter: needs token history confirmation
   - Alert policy: Do not alert yet; first confirm recurring token universe when it reactivates.
   - 3M: $414,759 PnL, 7897.8% ROI, 65.9% win, 7.5% DD
   - Current: no open positions
   - Risk: Recent activity includes noisy symbols: xyz:MSTR, @272, @107, xyz:CRWV, xyz:COIN. Suppress those unless user requests them.

4. `0xd2147a366e335b89b68ace628923962393b56813` — B/asymmetric_behavior/reactivation_watch_noisy_tokens
   - Readiness: pilot_secondary
   - Token filter: needs token history confirmation
   - Alert policy: Do not alert yet; first confirm recurring token universe when it reactivates.
   - 3M: $213,484 PnL, 77.1% ROI, 67.2% win, 1.6% DD
   - Current: no open positions
   - Risk: Recent activity includes noisy symbols: xyz:CL, @107. Suppress those unless user requests them.

5. `0xe3c1447b94c5b278d9ec8d24855f5a5a2788542b` — C/asymmetric_behavior/reactivation_watch_clean_tokens
   - Readiness: pilot_secondary
   - Token filter: needs token history confirmation
   - Alert policy: Do not alert yet; first confirm recurring token universe when it reactivates.
   - 3M: $74,039 PnL, 7403914.0% ROI, 37.3% win, 34.2% DD
   - Current: no open positions
   - Risk: No current open position and no clean recent token history in fetched trades.


## Internal Risk Watch

1. `0x2cef0a7f84e722c77b271862da5fe2387028fa20` — B/risk_watch/risk_watch_reactivation
   - Readiness: do_not_sell_yet
   - Token filter: BTC, HYPE, ZEC
   - Alert policy: Do not use for Pro alerts until drawdown behavior improves. Keep for internal observation.
   - 3M: $56,675 PnL, 15.3% ROI, 65.0% win, 41.8% DD
   - Current: no open positions
   - Risk: Behavior layer flagged risk: Recent crash or drawdown is too large for clean signal use.


## Current Token Coverage

- `0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62`: clean tokens BTC; noisy/custom none
- `0xa3d843b6a057504284006bef6f34a2e9bc80fb6b`: clean tokens BTC; noisy/custom xyz:SPCX, xyz:CBRS, xyz:TSLA, xyz:MSTR
- `0x86149addc2ebeb610d2630b07cbfea5c19fa690e`: clean tokens BTC, ETH, HYPE, TAO, SOL, DOGE; noisy/custom none
- `0x6d7823cd5c3d9dcd63e6a8021b475e0c7c94b291`: clean tokens none; noisy/custom xyz:MSTR, @272, @107, xyz:CRWV, xyz:COIN
- `0xd2147a366e335b89b68ace628923962393b56813`: clean tokens none; noisy/custom xyz:CL, @107
- `0xe3c1447b94c5b278d9ec8d24855f5a5a2788542b`: clean tokens none; noisy/custom none
- `0x2cef0a7f84e722c77b271862da5fe2387028fa20`: clean tokens BTC, HYPE, ZEC; noisy/custom xyz:CL, xyz:XYZ100, xyz:INTC, xyz:CBRS, xyz:COST, xyz:SNDK, xyz:TSLA

## Product Implication

The next build should not be another broad screener.

Build the alert object:
- wallet rank/profile
- watched token
- event type: entry, add, trim, exit, flip
- current notional / uPnL
- reason the wallet is on the list
- risk flags: source mismatch, noisy token, high drawdown, high leverage
