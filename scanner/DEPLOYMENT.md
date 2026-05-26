# Scanner Deployment

GitHub stores the scanner source, but it does not provide reliable 24/7 compute for a long-running Telegram alert daemon. Run the scanner on an always-on host, deploy it from GitHub, and mount persistent storage for SQLite.

## Recommended Shape

- Code source: GitHub repo.
- Runtime: small always-on worker/container.
- Persistent state: mounted volume at `/data`.
- Database path: `HL_INTEL_DB_PATH=/data/hl_intel.db`.
- Secrets: stored in the host, not committed.

## Required Secrets

```txt
TELEGRAM_BOT_TOKEN=...
FREE_CHANNEL_ID=...
PAID_CHANNEL_ID=...
```

Optional runtime tuning:

```txt
SCAN_INTERVAL_SECONDS=180
HL_INFO_MIN_REQUEST_INTERVAL_SECONDS=0.75
HL_INFO_MAX_RETRIES=5
HL_HTTP_TIMEOUT_SECONDS=20
SEND_STARTUP_MESSAGE=false
HL_INTEL_WATCHLIST_PATH=/app/watchlist.json
```

## Fly.io Worker Path

This folder includes `Dockerfile`, `.dockerignore`, and `fly.toml`.

Current production target:

```txt
App: hl-intel-scanner
Region: ord
Machine: 9080d14dfe4648
Size: shared-cpu-1x:1024MB
Volume: hl_intel_data mounted at /data
Database: /data/hl_intel.db
Deploy: GitHub Actions workflow "Deploy Scanner To Fly"
```

First-time setup from this folder:

```bash
fly launch --no-deploy --copy-config
fly volumes create hl_intel_data --size 3 --region ord
fly secrets set TELEGRAM_BOT_TOKEN="..." FREE_CHANNEL_ID="..." PAID_CHANNEL_ID="..."
fly deploy
```

After the first deploy, GitHub Actions can deploy from the repo once `FLY_API_TOKEN` is added as a GitHub Actions secret.

Live verification commands:

```bash
flyctl machines list --app hl-intel-scanner
flyctl logs --app hl-intel-scanner
```

The worker currently needs the 1GB memory setting in `fly.toml`; smaller 256MB/512MB machines have OOM-killed during charting/import-heavy scan cycles.

## Local Docker Smoke Test

```bash
docker build -t hl-intel-scanner .
docker run --rm --env-file .env -e HL_INTEL_DB_PATH=/data/hl_intel.db -v "$(pwd)/data:/data" hl-intel-scanner
```

Stop the container with `Ctrl-C`.

## Important Notes

- Do not deploy without a persistent volume. Without it, alert cooldown history and wallet labels reset on every restart.
- `scanner/watchlist.json` is packaged into the worker image and adds deploy-time wallet watches outside the top 50 leaderboard.
- Paid channel membership is managed through LaunchPass/private Telegram access, not inside the scanner process.
- Do not run multiple scanner replicas against the same Telegram channels unless duplicate-alert protection is moved to a shared database with locking.
- Keep `.env`, SQLite files, logs, and cache files out of GitHub.
