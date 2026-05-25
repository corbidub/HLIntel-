# HL Intel

Landing page, launch research, tracker experiments, and the live Telegram-first Hyperliquid scanner for `hyperliquidintel.com`.

## Repo Layout

```txt
.
├── index.html, styles.css, script.js   # Production static landing page
├── scanner/                            # Live HL Intel Telegram alert scanner
├── spot-tracker/                       # Experimental spot/hedge research tools
├── aster-scan-tracker/                 # Experimental Aster scan tracker
└── launch/                             # Launch research, social assets, proof packet, outreach notes
```

Runtime files stay local and are intentionally ignored: `.env`, SQLite databases, logs, Python cache, and machine-specific files.

## Preview Locally

```sh
python3 -m http.server 4173
```

Open:

```txt
http://localhost:4173
```

## Deploy To Vercel

Recommended setup:

1. In Vercel, import this repository.
4. Use these settings:
   - Framework Preset: `Other`
   - Build Command: leave empty
   - Output Directory: leave empty or `.`
5. Add `hyperliquidintel.com` and `www.hyperliquidintel.com` under Vercel project domains.
6. Point your registrar DNS records to Vercel.

Typical DNS records:

```txt
A      @      76.76.21.21
CNAME  www    cname.vercel-dns.com
```

Use the exact DNS instructions Vercel shows in case they differ for your account.

## Current Links

- Pro checkout: `https://www.launchpass.com/goonboi/launchpass-com-hlintelpro`
- Free Telegram: `https://t.me/HLIntel`
- X profile: `https://x.com/HLIntelFeed`
- Pro footer link points to LaunchPass so paid access remains gated.

## Before Public Launch

- Confirm LaunchPass checkout is live.
- Confirm `@HLIntelPro` is private and LaunchPass controls invites/removals.
- Test the Pro CTA on desktop and mobile.
- Test the free Telegram CTA.
- Confirm SSL is active on `https://hyperliquidintel.com`.
