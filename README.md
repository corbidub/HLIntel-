# HL Intel Landing Page

Production static site for `hyperliquidintel.com`.

## Preview Locally

```sh
python3 -m http.server 4173 --directory hl-intel-site
```

Open:

```txt
http://localhost:4173
```

## Deploy To Vercel

Recommended setup:

1. Create a clean GitHub repository for the landing page.
2. Upload only the contents of this `hl-intel-site` folder.
3. In Vercel, import the repository.
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
