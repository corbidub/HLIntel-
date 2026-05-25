# HL Intel — Web Design Handoff
## hyperliquidintel.com

---

## What Is HL Intel

A paid Telegram intelligence bot for Hyperliquid perpetuals traders. We monitor the top 50 leaderboard wallets 24/7, filter out algo bots, and deliver real-time alerts when human smart money moves — with 4h candlestick charts on every alert.

**Two Telegram channels:**
- `@HLIntel` — Free (funding spikes, OI surges, confluence teasers, weekly digest)
- `@HLIntelPro` — Paid $29.99/month (whale position alerts, VIP signals, full confluence, liquidation warnings)

**The core differentiator:** We've profiled all 50 top wallets and removed the algos. Subscribers only see human conviction trades — not market maker noise.

---

## The Website's Job

This is a **single-page marketing site**. One goal: convert visitors to either the free channel or the paid Pro subscription.

It does NOT need:
- Login or user accounts
- Blog or content section
- Complex navigation
- More than one page

It DOES need:
- A strong hero that communicates the value instantly
- Social proof (real data from the bot)
- Clear free vs Pro breakdown
- One prominent CTA to the Pro checkout
- Fast load, mobile-first

**Platform:** Carrd (carrd.co) — already set up, needs content and domain connection.
**Domain:** hyperliquidintel.com (purchased via Squarespace — DNS needs pointing to Carrd)

---

## Brand Identity

### Aesthetic
**32-bit retro-futurism. Tactical terminal. Clean cyberpunk.**

Think: Tron Legacy UI, Aliens motion tracker, 90s sci-fi HUD displays. The product is a surveillance system — it should look like one.

**NOT:** Generic dark mode SaaS. Not gradient blobs. Not Tailwind defaults. Not Web3 rainbow colors.

**Rules:**
- 80% dark surfaces, 20% neon accents
- Glow should feel powered, not decorative
- No rounded modern fonts
- No cartoon crypto imagery
- Sharp edges, intentional geometry

### Colour Palette

| Name | Hex | Use |
|---|---|---|
| Deep Navy | `#0A0E17` | Primary background |
| Dark Panel | `#121826` | Card/section backgrounds |
| Cyan | `#00F5FF` | Primary brand, headlines, borders |
| Signal Magenta | `#FF2D9E` | Accents, CTAs, alert badges |
| Violet | `#7B61FF` | Supporting accent |
| Cool White | `#E6E6E6` | Body text |
| Muted | `#508AAA` | Secondary text, metadata |

### Typography
**Monospace only.** SF Mono, Courier New Bold, or Andale Mono.
No sans-serif. No serif. The terminal aesthetic is non-negotiable.

---

## Page Structure & Copy

### Section 1 — Hero

**Headline:**
```
Not all whales are equal.
We track the ones that matter.
```

**Subheadline:**
```
HL Intel watches high-signal Hyperliquid wallets
and sends Telegram alerts when they add, trim,
exit, flip, reactivate, align, or get stressed.
```

**Two CTAs:**
- Primary: `Join Pro — $29.99/mo` → LaunchPass checkout link
- Secondary: `Free channel →` → t.me/HLIntel

**Hero visual idea:** The alert card image (dark chart with cyan/magenta lines) or the channel avatar radar mark. Something that immediately shows what the product looks like in action.

---

### Section 2 — Social Proof / Stats Bar

Real numbers from the bot this week:
```
339 whale alerts fired  |  182 confluence events  |  15 algos filtered  |  6 VIP wallets tracked
```

These should update conceptually — use the most recent weekly digest numbers.

---

### Section 3 — Free vs Pro Split

**FREE — @HLIntel**
→ Funding rate spikes
→ Open interest surges
→ Confluence teasers (coin + direction, no wallet detail)
→ Weekly smart money digest (summary)

**PRO — @HLIntelPro — $29.99/month**
→ Real-time whale position alerts + 4h chart
→ ⭐ VIP alerts from our 6 highest-ROI wallets
→ Whale size increase detection
→ Full confluence signals (wallet ranks, combined size, chart)
→ Liquidation risk warnings (when large positions near forced close)
→ Full weekly digest with individual wallet PnL
→ Algo noise filtered — 15 bots excluded

**Visual treatment idea:** Two cards side by side. Free card in Dark Panel `#121826`. Pro card with a Cyan `#00F5FF` border glow. Magenta badge on Pro card: `MOST POPULAR` or `SMART MONEY TIER`.

---

### Section 4 — How It Works

**3-step visual:**

```
1. WE WATCH
   Top 50 Hyperliquid wallets monitored 24/7.
   Every position open, size increase, and market move tracked.

2. WE FILTER
   15 algo bots and market makers identified and excluded.
   Only human conviction trades make it through.

3. YOU KNOW
   Real-time alerts in Telegram with 4h chart breakdowns.
   When smart money moves — you find out first.
```

---

### Section 5 — Alert Example / Product Screenshot

Show an actual alert from the channel. The dark chart image with:
- "HL Intel" header bar
- Cyan entry price dashed line
- Yellow current price line
- "WHALE CONFLUENCE" or "VIP WHALE" label

This is the strongest conversion element. Real product, real data, dark aesthetic that matches the brand.

**Available screenshots:** Any alert image sent to the Telegram channels. Screenshot from Telegram directly for best quality.

---

### Section 6 — The Intelligence Edge (optional, adds credibility)

```
We've profiled every wallet on the leaderboard.

#42 — +3,507% all-time ROI. HYPE long specialist.
#22 — +2,051% all-time ROI. TradFi/crypto hybrid.
#43 — +266% all-time ROI. BTC/ETH pair trade.

When these wallets move — you get a ⭐ VIP alert.
Not just a number. Context.
```

---

### Section 7 — FAQ

**What is Hyperliquid?**
A decentralised perpetuals exchange. The top 50 leaderboard wallets are the best-performing traders on the platform by all-time PnL.

**How do you identify algos?**
By trading pattern. Wallets trading 30+ different assets simultaneously are systematically flagged and excluded. Human traders concentrate. Algos diversify.

**How do I access Pro after paying?**
Instant invite link to @HLIntelPro after checkout. Access is managed automatically — cancelled members are removed within 24 hours.

**Is this financial advice?**
No. HL Intel provides on-chain data and market intelligence only. Always do your own research.

---

### Section 8 — Final CTA

```
Ready to see where smart money is going?

[Join Pro — $29.99/month]   [Free channel →]
```

---

### Footer

```
hyperliquidintel.com
@HLIntel  |  @HLIntelPro

Not financial advice. Data only.
```

---

## Available Brand Assets

All files in `assets/brand/`:

| File | Use |
|---|---|
| `avatar_512.png` | Logo mark (radar + HL monogram) |
| `telegram_banner_1280x320.png` | Channel banner reference |
| `twitter_banner_1500x500.png` | Header reference |
| `brand_card_1200x675.png` | Full palette/typography reference |

> **Note:** The avatar is a placeholder (generated radar design). A custom whale silhouette avatar is in progress from a separate design brief (`DESIGN_HANDOFF.md`). Use the radar for now — swap when the whale arrives.

---

## Technical Notes

### Carrd Setup
- Site type: Single page
- Background: `#0A0E17`
- All sections use `#121826` cards
- Max width: 1100px content area
- Mobile-first — most crypto users are on phone

### Domain Connection
1. In Carrd: Settings → Custom domain → enter `hyperliquidintel.com`
2. Carrd shows DNS records needed
3. In Squarespace: Domains → hyperliquidintel.com → DNS Settings → add Carrd's records
4. Propagation: 10min–2hrs

### Key Links to Wire Up
- Pro checkout: LaunchPass link
- Free channel: t.me/HLIntel
- Pro channel: t.me/HLIntelPro

---

## Design References

- Tron Legacy UI — deep black, electric cyan grid
- Aliens motion tracker — circular radar, monospace readouts
- Nansen.ai — data-first layout, shareable alert cards
- Lookonchain — no-frills intelligence feed aesthetic

**One rule:** If it looks like a default Tailwind template, it's wrong. Every element should feel like it was designed for this product specifically.

---

## Deliverables Expected

1. Fully built Carrd site at hyperliquidintel.com
2. Mobile responsive
3. Both CTAs linked correctly
4. Dark aesthetic matching the palette
5. At least one real product screenshot embedded
6. FAQ section complete
7. Export/share the Carrd project for handoff
