# HL Intel Scanner

Telegram-first Hyperliquid wallet intelligence for the HL Intel Free and Pro channels.

The scanner watches the top Hyperliquid leaderboard plus curated deploy-time wallet lists, filters noisy behavior, stores local state, and sends Telegram alerts when tracked wallets make material positioning or risk changes. It is a data product, not copy-trading or trade automation.

## Product Shape

- Free channel: selected public alerts, teasers, occasional market structure notes.
- Pro channel: filtered tracked-wallet alerts, curated/VIP wallet context, wallet health alerts, stress/liquidation warnings, confluence, and digest reads.
- Paid access: managed outside the scanner through LaunchPass and the private `@HLIntelPro` Telegram channel.
- First sellable version: Telegram feed only. No dashboard is required for launch.

## Alert Types

| Alert type | Trigger | Channel |
|---|---|---|
| Whale move | Top wallet or curated wallet opens meaningful exposure | Free + Pro or Pro only, depending on lane |
| Whale adding | Existing watched position grows materially | Pro |
| Wallet reactivation | Important flat/watch wallet becomes active again | Pro |
| Wallet health | Wallet enters hot streak, cooling, implosion watch, or self-imploding state | Pro |
| Stress watch | Wallet adds while under loss/liquidation pressure | Pro |
| Liquidation risk | Large position approaches configured liquidation distance | Pro |
| Confluence | Multiple top wallets align on coin/direction | Free teaser for light cases, Pro for full detail |
| Funding/OI | Funding or open-interest structure changes enough to matter | Free + Pro |
| Weekly digest | Summary of the cleanest wallet and market reads | Free summary + Pro detail |

## Runtime Flow

1. Fetch top leaderboard rows and asset funding/OI.
2. Load deploy-time watches from `scanner/watchlist.json`.
3. Fetch current positions for top wallets plus curated watches.
4. Save leaderboard, position, funding, and wallet-health snapshots to SQLite.
5. Compare current state against previous snapshots.
6. Send only material alerts, respecting cooldowns and per-cycle caps.
7. Send weekly digest when scheduled.

The first scanner start runs a silent seed cycle so existing positions do not trigger intro spam.

## Configuration

Copy `.env.example` to `.env` and fill in channel credentials.

```txt
TELEGRAM_BOT_TOKEN=your_bot_token_here
FREE_CHANNEL_ID=@your_free_channel_username
PAID_CHANNEL_ID=-100xxxxxxxxxx
SCAN_INTERVAL_SECONDS=180
HL_INFO_MIN_REQUEST_INTERVAL_SECONDS=0.75
HL_INFO_MAX_RETRIES=5
HL_HTTP_TIMEOUT_SECONDS=20
```

Optional:

```txt
HL_INTEL_DB_PATH=/data/hl_intel.db
HL_INTEL_WATCHLIST_PATH=/app/watchlist.json
SEND_STARTUP_MESSAGE=false
```

Important threshold defaults live in `config.py` and `engine/scanner.py`.

## Watchlists

`scanner/watchlist.json` is packaged into the worker image and adds wallets outside the current top leaderboard. Use it for deployable Pro watches only.

Rules:

- Priority A: core Pro watch wallets.
- Priority B: secondary/custom watch wallets.
- Keep token filters tight for secondary wallets.
- Do not add internal risk-watch or noisy wide-book wallets to the public/Pro feed without a clear alert policy.

Local paid-pilot experimentation belongs in `launch/pilot-watchlist.local.json`, which is gitignored.

## Data Storage

SQLite database tables include:

- `leaderboard_snapshots`
- `position_snapshots`
- `funding_snapshots`
- `wallet_performance_snapshots`
- `alerts_sent`
- `wallet_labels`

Use persistent storage in production. If the database resets, cooldown history and wallet health baselines reset too.

## Run Locally

```bash
pip install -r requirements.txt
cp .env.example .env
python3 main.py
```

Smoke check:

```bash
python3 -m py_compile main.py config.py alerts/*.py bot/*.py data/*.py engine/*.py hyperliquid/*.py scripts/*.py
```

## Deploy

See `scanner/DEPLOYMENT.md`.

Current target is the Fly app `hl-intel-scanner`: one always-on `shared-cpu-1x:1024MB` worker in `ord`, with SQLite mounted at `/data/hl_intel.db`. Do not run multiple replicas against the same Telegram channels unless duplicate-alert protection is moved to a shared database with locking.

## What Not To Build Yet

- Auto-copy trading.
- Guaranteed signal scoring.
- Public firehose for every wallet movement.
- Subscriber dashboard.
- Web dashboard or heatmap before the Telegram feed proves conversion.
