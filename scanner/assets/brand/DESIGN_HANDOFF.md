# HL Intel — Design Handoff

> Source of truth: `HL_Intel_Design_Packet.docx` (on Desktop)
> This document synthesises that packet with technical integration notes.

---

## What Is HL Intel

A paid Telegram intelligence bot that monitors the top 50 whale wallets on Hyperliquid (a crypto perpetuals DEX) and fires real-time alerts when whales open large positions, add to trades, or multiple wallets align on the same direction. Alerts are delivered as image cards — candlestick charts with entry price markers — directly into Telegram channels.

**Two channels:**
- `@HLIntel` — Free public channel (whale alerts, OI surges, funding spikes)
- `@HLIntelPro` — Paid private channel ($25–35/month, premium signals)

---

## Brand Positioning

HL Intel is a **crypto market intelligence system** — not a retail signal group.

The whale identity should feel: **intelligent, calm, precise, predatory.**
Never: cartoonish, playful, meme-adjacent.

---

## Visual Direction

**Aesthetic:** 32-bit retro-futurism. Tactical terminal. Clean cyberpunk.

Think: retro game HUDs, 90s sci-fi UI, tactical military readouts, early CGI wireframe aesthetics.

**Specific influences from the design packet:**
- 32-bit / pixel-art influence — intentional chunky geometry, not smooth gradients
- Cyberpunk terminal — powered neon glow, not decorative
- Tactical precision — the whale is a predator, not a mascot

**Rules from the design packet:**
- 80% dark surfaces / 20% neon accents
- Glow should feel powered, not decorative
- No clutter, no over-detailed cyberpunk effects
- No cartoon oceans, splashes, or meme styling
- Avoid rounded modern fonts

---

## Brand Palette (from Design Packet)

| Name | Hex | Usage |
|---|---|---|
| Cyan | `#00F5FF` | Primary brand colour, outlines, key text |
| Signal Magenta | `#FF2D9E` | Accent, target blip, alert type labels |
| Secondary Violet | `#7B61FF` | Supporting accent, premium tier |
| Deep Navy | `#0A0E17` | Primary background |
| Dark Panel | `#121826` | Card/panel backgrounds |
| Highlight White | `#E6E6E6` | Body text, secondary info |

> **Note:** These supersede the previously generated palette. Update all code references from `#010B13` → `#0A0E17`, `#00DCFF` → `#00F5FF`, `#FF0078` → `#FF2D9E`.

---

## Typography

- **Monospace fonts only** — clean terminal-inspired spacing
- Avoid rounded modern fonts
- SF Mono (macOS) / Courier New Bold for primary
- SF Mono / Courier New Regular for secondary

---

## Deliverables (from Design Packet)

| Asset | Priority | Notes |
|---|---|---|
| Primary Telegram/X avatar | 🔴 Critical | 512×512, square PNG, transparent-safe |
| Bot avatar variation | 🔴 Critical | Slightly different from channel avatar |
| Minimal favicon/icon | 🟡 High | 64×64 and 32×32 |
| Dark-mode optimised exports | 🟡 High | All assets tested on dark bg |
| Alert card frame system | 🟢 Later | Telegram alert image border/header |
| Dashboard HUD language | 🟢 Future | For eventual web dashboard |

---

## Primary Deliverable — Avatar

### Concept
Simplified humpback whale silhouette. 32-bit / pixel-art influence without looking childish.

### Specs
- Size: 512×512px
- Format: PNG, transparent background OR `#0A0E17` solid bg
- Must read clearly at **50×50px** (Telegram thumbnail) — test this first
- Square composition, no circular crop applied in the file (Telegram crops to circle)

### Design Direction
- **Strong side profile** preferred for readability at small sizes
- Minimal detail — simplified, not realistic
- Intentional neon accents (spine line, eye blip) in `#00F5FF` cyan
- Single `#FF2D9E` magenta dot for eye — should read as a targeting blip
- 32-bit aesthetic: crisp edges, intentional pixel influence, chunky geometry
- Tail flukes must clearly read as **whale** not fish — this is the critical failure point
- Body fill: `#121826` (Dark Panel)
- Outline: `#00F5FF` (Cyan), 2-3px

### What to Avoid
- Smooth gradients — prefer flat fills with sharp neon outlines
- Too much internal detail — 2-3 circuit/accent lines maximum
- Realistic whale proportions — push it graphic and iconic
- Fish tail shape — test silhouette at 50px to confirm it reads as whale

### Figma Workflow
1. 512×512 frame, fill `#0A0E17`
2. Search community: "whale icon", "whale silhouette", "whale logo minimal"
3. Style body fill `#121826`, outline `#00F5FF`
4. Add 1-2 neon accent lines along spine in `#00F5FF` at ~60% opacity
5. Single `#FF2D9E` dot for eye
6. Export as PNG 1× and 2×
7. Test at 50×50px before finalising

---

## Next Steps (from Design Packet)

1. Finalise silhouette direction
2. Create clean export-ready SVG version
3. Build Telegram alert card frame system
4. Create favicon + minimal bot icon
5. Build future dashboard HUD design language

---

## Integration Notes for Developer

Once avatar PNG is delivered, the developer will:

1. Drop into `assets/brand/avatar_512.png`
2. Update `alerts/branding.py` — replace `generate_logo()` call in `add_chart_header()` with `Image.open("assets/brand/avatar_512.png").resize((56, 56))`
3. Update palette constants in `alerts/branding.py`:
   - `CYAN = (0, 245, 255, 255)` — was `#00DCFF`
   - `MAGENTA = (255, 45, 158, 255)` — was `#FF0078`
   - `BG = (10, 14, 23, 255)` — was `#010B13`
   - Add `VIOLET = (123, 97, 255, 255)` — new
4. Regenerate brand kit: `python3 scripts/generate_brand_kit.py`
5. Restart bot: `pkill -f "python3 main.py" && nohup python3 main.py >> hl_intel.log 2>&1 &`

---

## Files Already Generated (may need palette update)

| File | Status |
|---|---|
| `telegram_banner_1280x320.png` | Needs palette update |
| `twitter_banner_1500x500.png` | Needs palette update |
| `brand_card_1200x675.png` | Reference only |
| `logo_mark_512.png` (radar) | Being replaced by whale avatar |
