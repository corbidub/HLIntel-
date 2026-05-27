# HL Intel Chrome Extension

**Companion Chrome extension for HL Intel — Hyperliquid Perp Wallet Intelligence**

Brings filtered Hyperliquid whale alerts, liquidation pressure, and confluence signals directly into your browser with a clean, fast popup interface.

---

## How to Load (Development)

1. Go to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `chrome-extension` folder

**Tip**: Pin the extension to your toolbar for quick access. It shows mock alerts immediately until the real API is wired up.

---

## Current Status

- ✅ Modern Manifest V3 + TypeScript + React + Tailwind
- ✅ Clean popup UI with alert feed, filtering & history
- ✅ Service worker (polling, deduplication, notifications, badge count)
- ✅ Local storage for alert history and settings
- 🔄 **API integration pending**

---

## TODO – API Integration (Priority)

The extension is fully built and ready. Main tasks left:

- Create JSON endpoint: `https://hyperliquidintel.com/api/alerts` (recommended)
- Update polling URL in `src/lib/api.ts`
- Finalize `Alert` type (`src/lib/types.ts`)
- Connect your alert pipeline to publish structured JSON
- Switch from mock data to live data

Once the endpoint is live, everything will work automatically.

---

## Project Structure

chrome-extension/
├── manifest.json
├── package.json
├── public/icons/          # 16, 48, 128 px
└── src/
    ├── background/        # Service worker
    ├── popup/             # React UI
    └── lib/               # types, storage, api

---

## Development (Optional)

```bash
cd chrome-extension
npm install
npm run dev

Then reload the extension in chrome://extensions/.

