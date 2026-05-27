# HL Intel Chrome Extension

**Companion Chrome extension for HL Intel — Hyperliquid Perp Wallet Intelligence**

Brings filtered Hyperliquid whale alerts, liquidation pressure, and confluence signals directly into your browser with a clean, fast popup interface.

---

## How to Load (Development)

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right)
3. Click **"Load unpacked"**
4. Select the `chrome-extension` folder

**Tip**: Pin the extension to your toolbar for quick access. It will show mock alerts immediately until the real API is connected.

---

## Current Status

- ✅ Modern Manifest V3 + TypeScript + React + Tailwind
- ✅ Clean popup UI with alert feed, filtering, and history
- ✅ Service worker (polling, deduplication, browser notifications, badge count)
- ✅ Local storage for alert history and user settings
- 🔄 **API integration pending**

---

## TODO – API Integration (Priority)

The extension is fully built and ready. Main remaining tasks:

- Set up a JSON endpoint: `https://hyperliquidintel.com/api/alerts` (or similar)
- Update the polling URL in `src/lib/api.ts`
- Finalize the `Alert` type contract (`src/lib/types.ts`)
- Connect your existing alert pipeline to publish structured JSON
- Replace mock data with live data

Once the endpoint is live, the extension will automatically use real alerts.

---
chrome-extension/
├── manifest.json
├── package.json
├── public/
│   └── icons/                  # 16, 48, 128 px icons
├── src/
│   ├── background/             # Service worker (core logic)
│   ├── popup/                  # React UI + components
│   ├── lib/                    # types, storage, api
│   └── ...
└── README.md


---

## Development (Optional)

```bash
cd chrome-extension
npm install
npm run dev

Then reload the extension in chrome://extensions/ (click the refresh icon on the extension card).


## Project Structure
