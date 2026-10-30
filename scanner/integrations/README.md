# Fluke × HL Intel: read-only research bridge

Status: experimental. Not a Fluke API integration, not copy trading, and not a Solana trading bot.

The Fluke homepage advertises tradable Hyperliquid whale-performance charts denominated in SOL. It says its performance measure removes deposits and withdrawals. HL Intel's local account_value, exposure and uPnL snapshots are NOT the same as that Fluke performance index.

## Inputs

1. A local HL Intel SQLite file containing wallet_performance_snapshots from the current scanner.
2. A JSON registry, manually verified on Fluke, with exact Hyperliquid wallet addresses and a manual market identifier.

Example file fluke-markets.local.json:

    {
      "markets": [
        {
          "market_id": "REPLACE_WITH_VERIFIED_FLUKE_MARKET_ID",
          "wallet_address": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        }
      ]
    }

This is only a format example: the address is invented and not a verified listing.
Do not rely on shortened 0x addresses or the text names of whales.

## Run (from repo root)

    python3 scanner/integrations/fluke_bridge.py --db scanner/hl_intel.db --registry fluke-markets.local.json --out fluke-report.local.json
    python3 -m unittest discover -s scanner/tests -p 'test_fluke_bridge.py' -v

The database is opened in SQLite read-only mode. The only file written is the requested JSON export. The script contains no network access, keys, signing, trading, Telegram messaging, or modifications to scanner/main.py.

Research statuses: missing_hl_snapshot, stale, risk_watch, research_only.
These statuses are NOT trading signals. Wallet-state labels and risk flags describe HL Intel's observations, not a guaranteed forecast or a Fluke price.

## Blocked pending verified Fluke documentation

- Authentic market-ID to complete Hyperliquid wallet address mapping.
- Any public read-only API or authenticated feed and rate limits.
- Solana contract/program address, verified source, pricing/settlement formula.
- Fee schedule, LP liquidity, user custody, oracle behavior, security audit.

Before any future trading implementation: full security review and explicit owner approval. Never read or store secrets in this bridge.

Historical HL Intel Fly scan ran successfully in May 2026 according to _recovery/CURRENT_STATE.md; current runtime availability is UNKNOWN.
