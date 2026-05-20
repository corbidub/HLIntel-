import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const behaviorPath = resolve("launch", "hl-intel-wallet-behavior-metrics.csv");
const csvPath = resolve("launch", "hl-intel-priority-wallet-dig.csv");
const reportPath = resolve("launch", "hl-intel-priority-wallet-dig.md");

const priorityTiers = new Set(["elite_behavior", "asymmetric_behavior", "risk_watch"]);
const cryptoMajors = new Set([
  "BTC", "ETH", "SOL", "HYPE", "TAO", "DOGE", "BNB", "ZEC", "ASTER", "DYDX",
  "TON", "GRASS", "STBL", "MEGA", "PAXG",
]);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else value += char;
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") value += char;
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const [headers, ...data] = rows;
  return data.filter((cells) => cells.length === headers.length).map((cells) => {
    return Object.fromEntries(headers.map((header, index) => [header, cells[index]]));
  });
}

function csv(value) {
  if (value === null || value === undefined) return "";
  const stringValue = Array.isArray(value) ? value.join("; ") : String(value);
  return /[",\n]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue;
}

async function getJson(url) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          "user-agent": "HL Intel priority wallet dig",
        },
      });
      if (response.ok) return response.json();
      lastError = new Error(`${response.status} ${url}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 750));
  }
  throw lastError;
}

function money(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "n/a";
  return `$${Math.round(number).toLocaleString()}`;
}

function pct(value, digits = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "n/a";
  return `${number.toFixed(digits)}%`;
}

function num(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

function tierRank(tier) {
  return {
    elite_behavior: 0,
    asymmetric_behavior: 1,
    risk_watch: 2,
  }[tier] ?? 9;
}

function priorityRank(priority) {
  return { A: 0, B: 1, C: 2 }[priority] ?? 3;
}

function symbolSummary(trades) {
  const map = new Map();
  for (const trade of trades) {
    if (!trade.symbol) continue;
    const item = map.get(trade.symbol) ?? {
      symbol: trade.symbol,
      count: 0,
      open: 0,
      close: 0,
      long: 0,
      short: 0,
      notional: 0,
      pnl: 0,
    };
    item.count += 1;
    item.open += trade.action === "open" ? 1 : 0;
    item.close += trade.action === "close" ? 1 : 0;
    item.long += trade.side === "long" ? 1 : 0;
    item.short += trade.side === "short" ? 1 : 0;
    item.notional += Number(trade.notional_usd ?? 0);
    item.pnl += Number(trade.pnl ?? 0);
    map.set(trade.symbol, item);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

function isNoisySymbol(symbol) {
  return symbol?.startsWith("xyz:") || symbol?.startsWith("@") || symbol === "STABLE";
}

function cleanTokenList(symbols) {
  return symbols
    .filter((item) => !isNoisySymbol(item.symbol))
    .map((item) => item.symbol)
    .filter((symbol, index, arr) => arr.indexOf(symbol) === index)
    .slice(0, 8);
}

function noisyTokenList(symbols) {
  return symbols
    .filter((item) => isNoisySymbol(item.symbol))
    .map((item) => item.symbol)
    .filter((symbol, index, arr) => arr.indexOf(symbol) === index)
    .slice(0, 8);
}

function formatPosition(position) {
  const side = position.side === "short" ? "S" : "L";
  const notional = Math.abs(Number(position.size ?? 0) * Number(position.mark_price ?? 0));
  return `${position.symbol} ${side} ${money(notional)} uPnL ${money(position.upnl)} liq ${position.liquidation_price ?? "n/a"}`;
}

function inferMonitorLane(row, trader, positions, symbols) {
  const noisySymbols = noisyTokenList(symbols);
  const cleanSymbols = cleanTokenList(symbols);
  const currentNotional = positions.reduce((sum, position) => {
    return sum + Math.abs(Number(position.size ?? 0) * Number(position.mark_price ?? 0));
  }, 0);
  const currentUpnl = positions.reduce((sum, position) => sum + Number(position.upnl ?? 0), 0);
  const accountValue = Number(trader.account?.total_value ?? 0);
  const leverageRatio = Number(trader.account?.leverage_ratio ?? 0);
  const stats1w = trader.stats?.["1W"] ?? {};

  if (row.address === "0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62") {
    return {
      lane: "flagship_active_btc_unwind",
      productReadiness: "pilot_ready",
      tokenFilter: "BTC",
      alertPolicy: "Alert on BTC trim, full exit, flip, material add, or large uPnL compression.",
      buyerValue: "High. Clean story: elite BTC short with large open profit.",
      riskNote: "Notional/account size is aggressive; context alert only, not copy-trade.",
    };
  }

  if (!positions.length && row.behavior_tier === "asymmetric_behavior") {
    const tokenFilter = cleanSymbols.length ? cleanSymbols.join(", ") : "needs token history confirmation";
    const isCleanReactivation = cleanSymbols.length > 0 && noisySymbols.length === 0 && row.priority !== "C";
    return {
      lane: noisySymbols.length ? "reactivation_watch_noisy_tokens" : "reactivation_watch_clean_tokens",
      productReadiness: isCleanReactivation ? "pilot_ready" : "pilot_secondary",
      tokenFilter,
      alertPolicy: cleanSymbols.length
        ? `Alert when wallet opens meaningful fresh exposure in ${tokenFilter}. Then alert on exit/flip.`
        : "Do not alert yet; first confirm recurring token universe when it reactivates.",
      buyerValue: cleanSymbols.length
        ? "Good. This matches the prospect request for token-specific entry/exit monitoring."
        : "Medium. Behavior is interesting, but token fit is not established yet.",
      riskNote: noisySymbols.length
        ? `Recent activity includes noisy symbols: ${noisySymbols.join(", ")}. Suppress those unless user requests them.`
        : cleanSymbols.length
          ? "No current open position; value comes from fresh-entry detection."
          : "No current open position and no clean recent token history in fetched trades.",
    };
  }

  if (row.behavior_tier === "risk_watch") {
    return {
      lane: "risk_watch_reactivation",
      productReadiness: "do_not_sell_yet",
      tokenFilter: cleanSymbols.length ? cleanSymbols.join(", ") : "none",
      alertPolicy: "Do not use for Pro alerts until drawdown behavior improves. Keep for internal observation.",
      buyerValue: "Low right now. Useful as a negative control / risk case.",
      riskNote: `Behavior layer flagged risk: ${row.tier_reason}`,
    };
  }

  if (noisySymbols.length || Number(stats1w.max_drawdown ?? 0) > 50 || currentUpnl < 0 || leverageRatio > 8) {
    return {
      lane: "specialized_noisy_monitor",
      productReadiness: "pilot_secondary",
      tokenFilter: cleanSymbols.length ? cleanSymbols.join(", ") : "custom only",
      alertPolicy: "Alert only on full close, flip, or major position expansion. Suppress small churn.",
      buyerValue: "Medium. Can be useful for custom watchlists, not flagship curated feed.",
      riskNote: [
        noisySymbols.length ? `Noisy symbols: ${noisySymbols.join(", ")}` : null,
        Number(stats1w.max_drawdown ?? 0) > 50 ? `1W DD ${pct(stats1w.max_drawdown)}` : null,
        currentUpnl < 0 ? `Current uPnL ${money(currentUpnl)}` : null,
        leverageRatio > 8 ? `Leverage ratio ${num(leverageRatio, 2)}x` : null,
      ].filter(Boolean).join("; "),
    };
  }

  return {
    lane: positions.length ? "active_position_monitor" : "reactivation_watch",
    productReadiness: "pilot_ready",
    tokenFilter: cleanSymbols.length ? cleanSymbols.join(", ") : "custom only",
    alertPolicy: positions.length
      ? "Alert on material add, trim, exit, or flip."
      : "Alert on fresh entry, then exit/flip.",
    buyerValue: "Good fit for curated plus custom watchlist.",
    riskNote: "Needs continued monitoring before promoting beyond pilot.",
  };
}

const rows = parseCsv(await readFile(behaviorPath, "utf8"))
  .filter((row) => priorityTiers.has(row.behavior_tier))
  .sort((a, b) => (
    tierRank(a.behavior_tier) - tierRank(b.behavior_tier) ||
    priorityRank(a.priority) - priorityRank(b.priority) ||
    Number(b.pnl_curve_latest ?? 0) - Number(a.pnl_curve_latest ?? 0)
  ));

const reviews = [];

for (const row of rows) {
  const [trader, positions, tradesPayload] = await Promise.all([
    getJson(`https://hypercopy.app/api/trader/${row.address}`),
    getJson(`https://hypercopy.app/api/trader/${row.address}/positions`),
    getJson(`https://hypercopy.app/api/trader/${row.address}/trades?page=1&per_page=100`),
  ]);
  const trades = tradesPayload.trades ?? [];
  const symbols = symbolSummary(trades);
  const lane = inferMonitorLane(row, trader, positions, symbols);
  const currentNotional = positions.reduce((sum, position) => {
    return sum + Math.abs(Number(position.size ?? 0) * Number(position.mark_price ?? 0));
  }, 0);
  const currentUpnl = positions.reduce((sum, position) => sum + Number(position.upnl ?? 0), 0);

  reviews.push({
    ...row,
    trader,
    positions,
    trades,
    symbols,
    lane,
    currentNotional,
    currentUpnl,
  });
}

const headers = [
  "priority",
  "behavior_tier",
  "address",
  "monitor_lane",
  "product_readiness",
  "token_filter",
  "alert_policy",
  "buyer_value",
  "risk_note",
  "account_value",
  "free_margin",
  "leverage_ratio",
  "current_open_count",
  "current_notional",
  "current_upnl",
  "open_positions",
  "labels",
  "stats_3m_pnl",
  "stats_3m_roi",
  "stats_3m_win_rate",
  "stats_3m_max_drawdown",
  "stats_1w_pnl",
  "stats_1w_win_rate",
  "stats_1w_max_drawdown",
  "sortino_30d",
  "mdd_30d_pct",
  "consistency_30d_pct",
  "data_quality",
  "source_conflict_flag",
  "top_clean_tokens",
  "top_noisy_tokens",
  "recent_symbol_mix",
];

const csvRows = reviews.map((review) => {
  const stats3m = review.trader.stats?.["3M"] ?? {};
  const stats1w = review.trader.stats?.["1W"] ?? {};
  const clean = cleanTokenList(review.symbols);
  const noisy = noisyTokenList(review.symbols);
  return {
    priority: review.priority,
    behavior_tier: review.behavior_tier,
    address: review.address,
    monitor_lane: review.lane.lane,
    product_readiness: review.lane.productReadiness,
    token_filter: review.lane.tokenFilter,
    alert_policy: review.lane.alertPolicy,
    buyer_value: review.lane.buyerValue,
    risk_note: review.lane.riskNote,
    account_value: num(review.trader.account?.total_value, 2),
    free_margin: num(review.trader.account?.free_margin, 2),
    leverage_ratio: num(review.trader.account?.leverage_ratio, 2),
    current_open_count: review.positions.length,
    current_notional: num(review.currentNotional, 2),
    current_upnl: num(review.currentUpnl, 2),
    open_positions: review.positions.length ? review.positions.map(formatPosition).join("; ") : "",
    labels: review.trader.labels?.join("; "),
    stats_3m_pnl: num(stats3m.total_pnl, 2),
    stats_3m_roi: num(stats3m.roi, 2),
    stats_3m_win_rate: num(stats3m.win_rate, 2),
    stats_3m_max_drawdown: num(stats3m.max_drawdown, 2),
    stats_1w_pnl: num(stats1w.total_pnl, 2),
    stats_1w_win_rate: num(stats1w.win_rate, 2),
    stats_1w_max_drawdown: num(stats1w.max_drawdown, 2),
    sortino_30d: review.sortino_30d,
    mdd_30d_pct: review.mdd_30d_pct,
    consistency_30d_pct: review.consistency_30d_pct,
    data_quality: review.data_quality,
    source_conflict_flag: review.source_conflict_flag,
    top_clean_tokens: clean.join("; "),
    top_noisy_tokens: noisy.join("; "),
    recent_symbol_mix: review.symbols.slice(0, 10).map((item) => {
      return `${item.symbol} ${item.count}x ${money(item.notional)} realized ${money(item.pnl)} L/S ${item.long}/${item.short}`;
    }).join("; "),
  };
});

await writeFile(
  csvPath,
  `${headers.join(",")}\n${csvRows.map((row) => headers.map((header) => csv(row[header])).join(",")).join("\n")}\n`,
);

function section(title, filter) {
  const items = reviews.filter(filter);
  if (!items.length) return `## ${title}\n\nNone.\n`;
  return `## ${title}\n\n${items.map((item, index) => {
    const stats3m = item.trader.stats?.["3M"] ?? {};
    const positions = item.positions.length ? item.positions.map(formatPosition).join("; ") : "no open positions";
    return `${index + 1}. \`${item.address}\` — ${item.priority}/${item.behavior_tier}/${item.lane.lane}
   - Readiness: ${item.lane.productReadiness}
   - Token filter: ${item.lane.tokenFilter}
   - Alert policy: ${item.lane.alertPolicy}
   - 3M: ${money(stats3m.total_pnl)} PnL, ${pct(stats3m.roi)} ROI, ${pct(stats3m.win_rate)} win, ${pct(stats3m.max_drawdown)} DD
   - Current: ${positions}
   - Risk: ${item.lane.riskNote}`;
  }).join("\n\n")}\n`;
}

const report = `# HL Intel Priority Wallet Dig

Generated: ${new Date().toISOString()}

Scope:
- Today's wallets with \`elite_behavior\`, \`asymmetric_behavior\`, or \`risk_watch\`.
- Goal is product readiness for ranked-wallet and token-specific entry/exit alerts.

## Operator Summary

- Use \`0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62\` as the flagship active BTC monitor.
- The best MVP shape is a blend of curated wallets plus custom token/watchlist filters.
- Reactivation wallets are valuable because they map directly to "notify me when a good wallet gets into TOKEN."
- RWA/xyz-heavy wallets should be suppressed by default unless a user asks for those tokens.
- \`risk_watch\` wallets should stay internal until curve quality improves.

${section("Pilot-Ready / Strongest", (item) => item.lane.productReadiness === "pilot_ready")}

${section("Secondary / Custom Watchlist Only", (item) => item.lane.productReadiness === "pilot_secondary")}

${section("Internal Risk Watch", (item) => item.lane.productReadiness === "do_not_sell_yet")}

## Current Token Coverage

${reviews.map((item) => {
  const clean = cleanTokenList(item.symbols);
  const noisy = noisyTokenList(item.symbols);
  return `- \`${item.address}\`: clean tokens ${clean.length ? clean.join(", ") : "none"}; noisy/custom ${noisy.length ? noisy.join(", ") : "none"}`;
}).join("\n")}

## Product Implication

The next build should not be another broad screener.

Build the alert object:
- wallet rank/profile
- watched token
- event type: entry, add, trim, exit, flip
- current notional / uPnL
- reason the wallet is on the list
- risk flags: source mismatch, noisy token, high drawdown, high leverage
`;

await writeFile(reportPath, report);

console.log(`Wrote ${csvPath}`);
console.log(`Wrote ${reportPath}`);
console.log(`Reviewed ${reviews.length} priority wallets`);
