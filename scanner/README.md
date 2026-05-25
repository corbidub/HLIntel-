# HL Intel

A Telegram intelligence bot for Hyperliquid traders. Monitors the top 50 leaderboard wallets in real time and fires alerts when whales open new positions, add to existing ones, or align on the same trade. Delivers candlestick charts with entry price markers directly to Telegram channels.

---

## What It Does

| Alert Type | Trigger | Channel |
|---|---|---|
| Whale Move | Top-50 wallet opens new position above threshold | Free + Paid |
| Whale Adding | Same wallet increases position size by 20%+ | Free + Paid |
| Whale Confluence (2 wallets) | 2 top-50 wallets hold same coin/direction | Free + Paid |
| Whale Confluence (3+ wallets) | 3+ top-50 wallets hold same coin/direction | Paid only |
| Funding Spike | Funding rate crosses threshold and moved significantly | Free + Paid |
| OI Surge | Open interest changes 15%+ since last scan | Free + Paid |
| Weekly Digest | Summary of whale activity, top markets, confluence count | Free + Paid |

Every whale and confluence alert includes a **4h candlestick chart** with:
- Dashed entry price lines per wallet (teal = long, red = short)
- Yellow current price line
- Volume bars

---

## Project Structure

```
hl-intel/
├── engine/
│   ├── scanner.py      # All alert detection logic
│   └── digest.py       # Weekly digest generation
├── alerts/
│   ├── formatter.py    # Telegram message formatting
│   └── chart.py        # Candlestick chart generation
├── bot/
│   └── telegram.py     # Telegram send functions
├── data/
│   └── database.py     # SQLite layer — snapshots, alerts, state
├── hyperliquid/
│   └── client.py       # Hyperliquid API client
├── config.py           # Thresholds and env var loading
├── main.py             # Entry point and scan loop
├── .env                # Secrets (never commit)
└── requirements.txt
```

---

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo>
cd hl-intel
pip install -r requirements.txt
```

### 2. Create your Telegram bot

1. Open Telegram → search `@BotFather` → `/newbot`
2. Note the bot token
3. Create two channels: one public (free), one private (paid)
4. Add the bot as admin with post permission to both channels
5. Get channel IDs (see below)

**Getting channel IDs:**
```bash
python3 -c "
import urllib.request, json
token = 'YOUR_TOKEN'
url = f'https://api.telegram.org/bot{token}/getUpdates'
print(json.dumps(json.loads(urllib.request.urlopen(url).read()), indent=2))
"
```
Look for `"chat": {"id": -100xxxxxxxxxx}` in the output.

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```
TELEGRAM_BOT_TOKEN=your_token_here
FREE_CHANNEL_ID=@your_free_channel
PAID_CHANNEL_ID=-100xxxxxxxxxx
```

### 4. Run

```bash
python3 main.py
```

On first start, the bot runs a silent **seed cycle** to populate the database — no alerts fire during this phase. Once seeded, alerts go live and the startup message is sent to both channels.

---

## Configuration

All thresholds are in `config.py`:

| Setting | Default | Description |
|---|---|---|
| `WHALE_POSITION_THRESHOLD_USD` | $500,000 | Minimum notional to trigger a whale alert |
| `FUNDING_RATE_SPIKE_THRESHOLD` | 0.0005 (0.05%/8h) | Minimum funding rate to consider a spike |
| `OI_SURGE_PCT_THRESHOLD` | 15.0% | Minimum OI change to trigger a surge alert |

In `engine/scanner.py`:

| Setting | Default | Description |
|---|---|---|
| `MAX_WHALE_ALERTS_PER_CYCLE` | 5 | Max whale alerts sent per 60-second scan |
| `SIZE_INCREASE_THRESHOLD_PCT` | 20.0% | Minimum notional increase to fire a "whale adding" alert |

---

## Running in the Background

```bash
# Start
nohup python3 main.py > hl_intel.log 2>&1 &

# Check logs
tail -f hl_intel.log

# Check it's running
pgrep -fl "python3 main.py"

# Stop
pkill -f "python3 main.py"
```

---

## How Alerts Work

### Scan Cycle (every 60 seconds)

1. Fetch top-50 leaderboard + all asset funding/OI data in parallel
2. Save snapshots to SQLite
3. Check funding spikes and OI surges
4. For each top-50 wallet: fetch current positions, compare to previous snapshot
5. Fire alerts for new opens, size increases, confluence
6. Check if weekly digest is due

### New Position Detection

A position is "new" if the coin/side combination was not present in the wallet's **previous snapshot**. This means:
- A whale closing and reopening a position between cycles will trigger again
- A whale holding a steady position will not re-alert (cooldown also enforced)

### Confluence Detection

Groups all current positions across top-50 wallets by coin/side. If 2+ wallets appear in the same group above the threshold, confluence fires. The alert key includes the wallet count — so escalation from 2→3 wallets triggers a fresh alert.

### Alert Cooldowns

| Alert Type | Cooldown |
|---|---|
| Whale new position | 240 minutes |
| Whale size increase | 120 minutes |
| Confluence | 120 minutes |
| Funding spike | 120 minutes |
| OI surge | 120 minutes |
| Weekly digest | Sent once per Monday 08:00 UTC |

---

## Data Storage

SQLite database (`hl_intel.db`) with four tables:

- `leaderboard_snapshots` — rank, account value, PnL per wallet per scan
- `position_snapshots` — open positions per wallet per scan
- `funding_snapshots` — funding rate and OI per asset per scan
- `alerts_sent` — log of every alert fired (used for cooldown enforcement)

---

## Subscription Management

Paid channel access is managed via [Whop.com](https://whop.com). Whop handles:
- Stripe and crypto payments
- Automatic Telegram channel invite link delivery
- Subscriber dashboard

Free channel is public and open to anyone.

---

## Alert Examples

**Whale Move**
```
🐋 WHALE MOVE — Hyperliquid
━━━━━━━━━━━━━━━━
🟢 BTC-PERP | LONG
📊 Size: $1,338,969
🏆 Rank: #3 on leaderboard
💰 Account: $4,007,498
📈 Day PnL: +$23,927
🔑 0xf5d8...1a13
🕐 00:24 UTC
━━━━━━━━━━━━━━━━
Not financial advice. Data only.
```

**Whale Confluence**
```
🐋🐋 WHALE CONFLUENCE — TON-PERP
━━━━━━━━━━━━━━━━
🔴 SHORT | 2 top-50 wallets aligned
💰 Combined: $10,816,240

Wallets:
  🏆 #4 — $6,200,000 | 0xabc1...ef45
  🏆 #11 — $4,616,240 | 0x9876...ba32
━━━━━━━━━━━━━━━━
🕐 02:14 UTC
Not financial advice. Data only.
```

---

## Roadmap

- [ ] Custom font rendering for chart titles (emoji support)
- [ ] HL Intel logo/branding on charts
- [ ] Tighter label positioning when entry prices cluster
- [ ] Leaderboard shift alerts (new entrant to top 50)
- [ ] Web dashboard for live position heatmap
