# HL Intel Chrome Extension

**Companion Chrome extension for HL Intel — Hyperliquid Perp Wallet Intelligence**

Brings filtered Hyperliquid whale alerts, liquidation pressure, and confluence signals directly into your browser with a clean popup interface.

---

## How to Load (Development)

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right)
3. Click **"Load unpacked"**
4. Select the `chrome-extension` folder

After loading, pin the extension for quick access. The popup will show alerts immediately (using mock data until the real API is connected).

---

## Current Status

- ✅ Built with modern Manifest V3 + TypeScript + React + Tailwind
- ✅ Clean popup UI with alert feed, filtering, and history
- ✅ Service worker that handles polling, deduplication, notifications, and badge count
- ✅ Local storage for alert history and settings
- 🔄 **API integration pending** (this is what needs to be finished)

---

## TODO – API Integration

The extension is ready to receive real alerts. Main tasks remaining:

- Set up a JSON endpoint (recommended: `https://hyperliquidintel.com/api/alerts`)
- Update the polling URL in `src/lib/api.ts`
- Define the final `Alert` type contract (see `src/lib/types.ts`)
- Connect your existing alert pipeline to publish structured JSON
- Replace mock data with real data

Once the endpoint is live, the extension will automatically switch from mock data to live alerts.

---

## Project Structure
chrome-extension/
├── manifest.json
├── public/
│   └── icons/              # Extension icons
├── src/
│   ├── background/         # Service worker (polling + notifications)
│   ├── popup/              # React UI
│   ├── lib/                # Types, storage, API
│   └── ...
├── package.json
└── README.md


---

## Development (Optional)

If you want to modify the extension:

```bash
cd chrome-extension
npm install
npm run dev
