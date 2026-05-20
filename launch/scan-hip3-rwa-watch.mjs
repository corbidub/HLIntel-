import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const participantStatePath = resolve("launch", "hl-intel-market-participant-state.json");
const marketMapPath = resolve("launch", "hip3-rwa-market-map.json");
const rwaStatePath = resolve("launch", "hip3-rwa-participant-state.json");
const rwaReadPath = resolve("launch", "hip3-rwa-participant-read.md");
const rwaCsvPath = resolve("launch", "hip3-rwa-watch-current.csv");

function money(value) {
  return `$${Math.round(Number(value ?? 0)).toLocaleString()}`;
}

function shortWallet(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function csv(value) {
  if (value === null || value === undefined) return "";
  const stringValue = Array.isArray(value) ? value.join("; ") : String(value);
  return /[",\n]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue;
}

function normalizeSymbol(symbol) {
  const raw = String(symbol || "").trim();
  const [maybeBuilder, maybeSymbol] = raw.includes(":") ? raw.split(":") : [null, raw];
  const base = String(maybeSymbol || maybeBuilder || raw)
    .replace(/-PERP$/i, "")
    .replace(/_PERP$/i, "")
    .toUpperCase();

  return {
    raw,
    builder: maybeSymbol ? maybeBuilder?.toLowerCase() : null,
    base,
  };
}

function classifyPosition(position, marketMap) {
  const normalized = normalizeSymbol(position.symbol);
  const market = marketMap.markets[normalized.base] ?? null;
  if (!market) return null;

  return {
    ...position,
    raw_symbol: normalized.raw,
    base_symbol: normalized.base,
    builder: normalized.builder,
    category: market.category,
    theme: market.theme,
    tier: market.tier,
    risk_read: market.risk_read,
    pro_angle: market.pro_angle,
  };
}

function classifyParticipant(wallet, rwaPositions) {
  if (!rwaPositions.length) return "no_rwa_exposure";

  const categories = new Set(rwaPositions.map((position) => position.category));
  const riskReads = new Set(rwaPositions.map((position) => position.risk_read));
  const hasShortIndex = rwaPositions.some((position) => (
    position.side === "short" && ["index", "volatility"].includes(position.category)
  ));
  const hasCommodityLong = rwaPositions.some((position) => (
    position.side === "long" && ["commodity", "commodity_proxy"].includes(position.category)
  ));
  const hasCryptoProxy = rwaPositions.some((position) => position.category === "crypto_adjacent_equity");

  if (hasShortIndex || riskReads.has("risk_off_hedge")) return "hedge_or_risk_off_participant";
  if (hasCommodityLong) return "macro_defensive_rotator";
  if (hasCryptoProxy) return "crypto_equity_proxy_trader";
  if (categories.has("mega_cap_equity") || categories.has("index")) return "equity_beta_rotator";
  return wallet.risk_mode === "risk_on" ? "risk_on_rwa_participant" : "rwa_participant";
}

function buildRead(rwaState) {
  const topExposure = rwaState.top_exposure.length
    ? rwaState.top_exposure.map((item) => `${item.symbol} ${item.side} ${money(item.notional_usd)}`).join("; ")
    : "none";

  const activeLines = rwaState.active_participants.map((wallet, index) => {
    const positions = wallet.rwa_positions
      .map((position) => `${position.base_symbol} ${position.side} ${money(position.notional_usd)} (${position.theme})`)
      .join("; ");
    return `${index + 1}. ${wallet.wallet} | ${wallet.wallet_rank} / ${wallet.behavior_profile}
   ${wallet.participant_type}; ${positions}
   Read: ${wallet.read}`;
  });

  return `🧠 HL INTEL | HIP-3 / RWA PARTICIPANT READ

Active RWA wallets: ${rwaState.active_rwa_wallets}/${rwaState.tracked_wallets}
Net RWA posture: ${rwaState.net_posture}
Top RWA exposure: ${topExposure}

Read:
${rwaState.read}

Active RWA participants:
${activeLines.length ? activeLines.join("\n\n") : "No watched VIP wallets currently have mapped HIP-3/RWA exposure."}

Next watch:
${rwaState.next_watch.join("\n")}

Data only. NFA.`;
}

function walletRead(wallet, positions) {
  const largest = [...positions].sort((a, b) => Number(b.notional_usd) - Number(a.notional_usd))[0];
  if (!largest) return "No mapped RWA exposure.";
  if (largest.category === "crypto_adjacent_equity") {
    return `${wallet.wallet} is using ${largest.base_symbol} as a crypto-adjacent equity proxy.`;
  }
  if (["commodity", "commodity_proxy"].includes(largest.category)) {
    return `${wallet.wallet} is expressing macro/defensive commodity exposure through ${largest.base_symbol}.`;
  }
  if (largest.category === "index") {
    return `${wallet.wallet} is expressing broad equity/index exposure through ${largest.base_symbol}.`;
  }
  return `${wallet.wallet} has mapped RWA exposure through ${largest.base_symbol}.`;
}

const marketMap = JSON.parse(await readFile(marketMapPath, "utf8"));
const participantState = JSON.parse(await readFile(participantStatePath, "utf8"));

const states = participantState.states.map((wallet) => {
  const rwaPositions = wallet.positions
    .map((position) => classifyPosition(position, marketMap))
    .filter(Boolean);
  return {
    address: wallet.address,
    wallet: wallet.wallet || shortWallet(wallet.address),
    wallet_rank: wallet.wallet_rank,
    behavior_profile: wallet.behavior_profile,
    priority: wallet.priority,
    existing_risk_mode: wallet.risk_mode,
    participant_type: classifyParticipant(wallet, rwaPositions),
    rwa_exposure_total: rwaPositions.reduce((total, position) => total + Number(position.notional_usd ?? 0), 0),
    rwa_positions: rwaPositions,
    read: walletRead(wallet, rwaPositions),
  };
});

const activeParticipants = states
  .filter((wallet) => wallet.rwa_positions.length)
  .sort((a, b) => b.rwa_exposure_total - a.rwa_exposure_total);

const exposureBySymbolSide = new Map();
for (const wallet of activeParticipants) {
  for (const position of wallet.rwa_positions) {
    const key = `${position.base_symbol}:${position.side}`;
    exposureBySymbolSide.set(key, (exposureBySymbolSide.get(key) ?? 0) + Number(position.notional_usd ?? 0));
  }
}

const topExposure = [...exposureBySymbolSide.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([key, notional]) => {
    const [symbol, side] = key.split(":");
    return { symbol, side, notional_usd: notional };
  });

let netPosture = "quiet / no mapped RWA exposure";
const longNotional = activeParticipants.flatMap((wallet) => wallet.rwa_positions)
  .filter((position) => position.side === "long")
  .reduce((total, position) => total + Number(position.notional_usd ?? 0), 0);
const shortNotional = activeParticipants.flatMap((wallet) => wallet.rwa_positions)
  .filter((position) => position.side === "short")
  .reduce((total, position) => total + Number(position.notional_usd ?? 0), 0);
if (activeParticipants.length) {
  if (shortNotional > longNotional * 1.25) netPosture = "risk-off / short RWA exposure";
  else if (longNotional > shortNotional * 1.25) netPosture = "risk-on / long RWA exposure";
  else netPosture = "mixed RWA exposure";
}

const read = activeParticipants.length
  ? `${activeParticipants.length} watched wallet(s) currently have mapped HIP-3/RWA exposure. Largest participant: ${activeParticipants[0].read}`
  : "Current VIP snapshot shows no mapped stock, index, commodity, volatility, or crypto-equity-proxy exposure. This is a clean baseline; the next mapped RWA entry, add, trim, exit, or flip becomes the signal.";

const rwaState = {
  generated_at: new Date().toISOString(),
  source_generated_at: participantState.generated_at,
  market_map_version: marketMap.version,
  tracked_wallets: states.length,
  active_rwa_wallets: activeParticipants.length,
  net_posture: netPosture,
  rwa_long_notional: longNotional,
  rwa_short_notional: shortNotional,
  top_exposure: topExposure,
  read,
  next_watch: [
    "- First VIP wallet to open SP500 / XYZ100 / VIX exposure.",
    "- First VIP wallet to use COIN / MSTR / HOOD / CRCL as crypto-equity proxy.",
    "- First VIP wallet to rotate into gold, oil, or other commodity exposure.",
    "- Any RWA position tied to CPI, Fed, earnings, or weekend geopolitical risk.",
  ],
  active_participants: activeParticipants,
  states,
};

const csvHeaders = [
  "address",
  "wallet",
  "wallet_rank",
  "behavior_profile",
  "participant_type",
  "rwa_exposure_total",
  "rwa_positions",
];
const csvRows = states.map((wallet) => [
  wallet.address,
  wallet.wallet,
  wallet.wallet_rank,
  wallet.behavior_profile,
  wallet.participant_type,
  wallet.rwa_exposure_total,
  wallet.rwa_positions.map((position) => `${position.base_symbol} ${position.side} ${money(position.notional_usd)} ${position.theme}`).join("; "),
]);

await writeFile(rwaStatePath, `${JSON.stringify(rwaState, null, 2)}\n`);
await writeFile(rwaReadPath, `# HL Intel HIP-3 / RWA Participant Read

Generated: ${rwaState.generated_at}

\`\`\`text
${buildRead(rwaState)}
\`\`\`
`);
await writeFile(rwaCsvPath, [
  csvHeaders.join(","),
  ...csvRows.map((row) => row.map(csv).join(",")),
].join("\n") + "\n");

console.log(`Wrote ${rwaReadPath}`);
console.log(`Wrote ${rwaStatePath}`);
console.log(`Wrote ${rwaCsvPath}`);
console.log(`Active RWA wallets: ${rwaState.active_rwa_wallets}/${rwaState.tracked_wallets}`);
