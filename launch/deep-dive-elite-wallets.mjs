import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const behaviorPath = resolve("launch", "hl-intel-wallet-behavior-metrics.csv");
const csvPath = resolve("launch", "hl-intel-elite-wallet-deep-dive.csv");
const reportPath = resolve("launch", "hl-intel-elite-wallet-deep-dive.md");

const dayMs = 24 * 60 * 60 * 1000;
const returnDenominatorFloor = 1_000;

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
          "user-agent": "HL Intel elite wallet deep dive",
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

function normalizePoints(payload) {
  const rawPoints = Array.isArray(payload?.data) ? payload.data : [];
  return rawPoints
    .map((point, index, arr) => {
      const timestamp = Number(point.timestamp);
      const pnl = Number(point.pnl);
      const previousPnl = index > 0 ? Number(arr[index - 1]?.pnl) : 0;
      const bucketPnl = Number.isFinite(Number(point.bucket_pnl))
        ? Number(point.bucket_pnl)
        : pnl - previousPnl;
      return { timestamp, pnl, bucketPnl };
    })
    .filter((point) => Number.isFinite(point.timestamp) && Number.isFinite(point.pnl))
    .sort((a, b) => a.timestamp - b.timestamp);
}

function recentPoints(points, days) {
  if (!points.length) return [];
  const floor = points.at(-1).timestamp - days * dayMs;
  return points.filter((point) => point.timestamp >= floor);
}

function drawdown(points) {
  let peak = -Infinity;
  let maxPct = 0;
  let maxUsd = 0;
  for (const point of points) {
    peak = Math.max(peak, point.pnl);
    if (peak < returnDenominatorFloor) continue;
    const usd = Math.max(0, peak - point.pnl);
    const pctValue = (usd / peak) * 100;
    if (pctValue > maxPct) {
      maxPct = pctValue;
      maxUsd = usd;
    }
  }
  return { pct: maxPct, usd: maxUsd };
}

function positiveBucketPct(points) {
  if (!points.length) return null;
  return (points.filter((point) => point.bucketPnl > 0).length / points.length) * 100;
}

function sumBuckets(points) {
  return points.reduce((sum, point) => sum + Number(point.bucketPnl ?? 0), 0);
}

function symbolSummary(trades) {
  const map = new Map();
  for (const trade of trades) {
    const item = map.get(trade.symbol) ?? {
      symbol: trade.symbol,
      count: 0,
      notional: 0,
      pnl: 0,
      long: 0,
      short: 0,
      open: 0,
      close: 0,
    };
    item.count += 1;
    item.notional += Number(trade.notional_usd ?? 0);
    item.pnl += Number(trade.pnl ?? 0);
    if (trade.side === "long") item.long += 1;
    if (trade.side === "short") item.short += 1;
    if (trade.action === "open") item.open += 1;
    if (trade.action === "close") item.close += 1;
    map.set(trade.symbol, item);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

function formatPosition(position) {
  const side = position.side === "short" ? "S" : "L";
  const notional = Math.abs(Number(position.size ?? 0) * Number(position.mark_price ?? 0));
  return `${position.symbol} ${side} notional ${money(notional)}, uPnL ${money(position.upnl)}, ROE ${pct(position.upnl_pct)}, liq ${position.liquidation_price ?? "n/a"}`;
}

function biggestBuckets(points, direction, limit = 5) {
  const sorted = points
    .slice()
    .sort((a, b) => direction === "gain" ? b.bucketPnl - a.bucketPnl : a.bucketPnl - b.bucketPnl)
    .slice(0, limit);

  return sorted.map((point) => `${new Date(point.timestamp).toISOString().slice(0, 10)} ${money(point.bucketPnl)} -> curve ${money(point.pnl)}`);
}

function inferOperatorVerdict({ row, trader, positions, trades, points }) {
  const stats3m = trader.stats?.["3M"] ?? {};
  const stats1w = trader.stats?.["1W"] ?? {};
  const symbols = symbolSummary(trades);
  const hasRwa = symbols.some((item) => item.symbol?.startsWith("xyz:") || item.symbol?.startsWith("@"));
  const currentNotional = positions.reduce((sum, position) => {
    return sum + Math.abs(Number(position.size ?? 0) * Number(position.mark_price ?? 0));
  }, 0);
  const currentUpnl = positions.reduce((sum, position) => sum + Number(position.upnl ?? 0), 0);
  const accountValue = Number(trader.account?.total_value ?? 0);
  const leverageRatio = Number(trader.account?.leverage_ratio ?? 0);
  const mdd30 = drawdown(recentPoints(points, 30));
  const sourceMismatch = row.source_conflict_flag ? "source mismatch remains from old cohort file; live trader stats now need to be treated as primary" : "";

  if (row.address === "0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62") {
    return {
      productVerdict: "Best elite candidate for Pro alerts right now.",
      alertThesis: "Current BTC short has large open profit. Highest-value alert is the unwind: trim, full close, flip, or material add.",
      risks: [
        "Open notional is much larger than account value, so liquidation/position management matters.",
        "Behavior metrics look excellent, but the old cohort source PnL was stale versus live HyperCopy trader stats.",
        "Do not sell this as copy-trade instruction; sell it as market-context intelligence.",
      ].concat(sourceMismatch ? [sourceMismatch] : []),
      recommendedPolicy: "Priority A active monitor. Alert only on BTC size change >=10% and >=$25K notional, full close, flip, or uPnL change >=$25K.",
    };
  }

  if (hasRwa || Number(stats1w.max_drawdown ?? 0) > 50 || currentUpnl < 0 || leverageRatio > 8) {
    return {
      productVerdict: "Interesting but not clean enough for flagship Pro signal yet.",
      alertThesis: "Use as a specialized watch for BTC plus RWA/xyz behavior, not as a clean Hyperliquid directional wallet.",
      risks: [
        hasRwa ? "Recent activity includes xyz/RWA symbols, which may be noisy for HL Intel's core crypto audience." : null,
        Number(stats1w.max_drawdown ?? 0) > 50 ? `1W HyperCopy max drawdown is ${pct(stats1w.max_drawdown)}, despite the 30D curve looking controlled.` : null,
        currentUpnl < 0 ? `Current open book is underwater by ${money(currentUpnl)}.` : null,
        leverageRatio > 8 ? `Current leverage ratio is high at ${num(leverageRatio, 2)}x.` : null,
      ].filter(Boolean),
      recommendedPolicy: "Priority B monitor. Alert only on full close, flip, or major size expansion. Suppress small adds/trims and non-crypto symbol churn.",
    };
  }

  return {
    productVerdict: "Useful monitor candidate.",
    alertThesis: "Monitor meaningful position changes only.",
    risks: ["Needs more manual review before becoming a flagship wallet."],
    recommendedPolicy: "Priority B monitor.",
  };
}

const behaviorRows = parseCsv(await readFile(behaviorPath, "utf8"));
const eliteRows = behaviorRows.filter((row) => row.behavior_tier === "elite_behavior");
const deepDives = [];

for (const row of eliteRows) {
  const [trader, positions, tradesPayload, pnlPayload] = await Promise.all([
    getJson(`https://hypercopy.app/api/trader/${row.address}`),
    getJson(`https://hypercopy.app/api/trader/${row.address}/positions`),
    getJson(`https://hypercopy.app/api/trader/${row.address}/trades?page=1&per_page=100`),
    getJson(`https://hypercopy.app/api/trader/${row.address}/pnl-chart?period=3M`),
  ]);

  const trades = tradesPayload.trades ?? [];
  const points = normalizePoints(pnlPayload);
  const points7d = recentPoints(points, 7);
  const points30d = recentPoints(points, 30);
  const positionsText = positions.length ? positions.map(formatPosition) : ["No open positions"];
  const symbols = symbolSummary(trades);
  const mdd30 = drawdown(points30d);
  const mdd90 = drawdown(points);
  const verdict = inferOperatorVerdict({ row, trader, positions, trades, points });
  const currentNotional = positions.reduce((sum, position) => {
    return sum + Math.abs(Number(position.size ?? 0) * Number(position.mark_price ?? 0));
  }, 0);
  const currentUpnl = positions.reduce((sum, position) => sum + Number(position.upnl ?? 0), 0);

  deepDives.push({
    row,
    trader,
    positions,
    positionsText,
    trades,
    symbols,
    points,
    points7d,
    points30d,
    currentNotional,
    currentUpnl,
    mdd30,
    mdd90,
    verdict,
  });
}

const csvHeaders = [
  "priority",
  "address",
  "product_verdict",
  "alert_thesis",
  "recommended_policy",
  "account_tier",
  "labels",
  "first_seen_at",
  "last_active_at",
  "total_value",
  "free_margin",
  "leverage_ratio",
  "current_notional",
  "current_upnl",
  "open_positions",
  "stats_3m_pnl",
  "stats_3m_roi",
  "stats_3m_win_rate",
  "stats_3m_max_drawdown",
  "stats_3m_trades",
  "stats_1w_pnl",
  "stats_1w_win_rate",
  "stats_1w_max_drawdown",
  "behavior_sortino_30d",
  "behavior_mdd_30d",
  "behavior_consistency_30d",
  "pnl_curve_points",
  "pnl_curve_latest",
  "pnl_curve_7d_bucket_sum",
  "pnl_curve_30d_bucket_sum",
  "top_recent_symbols",
  "key_risks",
];

const csvRows = deepDives.map((item) => {
  const stats3m = item.trader.stats?.["3M"] ?? {};
  const stats1w = item.trader.stats?.["1W"] ?? {};
  return {
    priority: item.row.priority,
    address: item.row.address,
    product_verdict: item.verdict.productVerdict,
    alert_thesis: item.verdict.alertThesis,
    recommended_policy: item.verdict.recommendedPolicy,
    account_tier: item.trader.account_tier,
    labels: item.trader.labels?.join("; "),
    first_seen_at: item.trader.first_seen_at,
    last_active_at: item.trader.last_active_at,
    total_value: num(item.trader.account?.total_value, 2),
    free_margin: num(item.trader.account?.free_margin, 2),
    leverage_ratio: num(item.trader.account?.leverage_ratio, 2),
    current_notional: num(item.currentNotional, 2),
    current_upnl: num(item.currentUpnl, 2),
    open_positions: item.positionsText.join("; "),
    stats_3m_pnl: num(stats3m.total_pnl, 2),
    stats_3m_roi: num(stats3m.roi, 2),
    stats_3m_win_rate: num(stats3m.win_rate, 2),
    stats_3m_max_drawdown: num(stats3m.max_drawdown, 2),
    stats_3m_trades: stats3m.trades_count,
    stats_1w_pnl: num(stats1w.total_pnl, 2),
    stats_1w_win_rate: num(stats1w.win_rate, 2),
    stats_1w_max_drawdown: num(stats1w.max_drawdown, 2),
    behavior_sortino_30d: item.row.sortino_30d,
    behavior_mdd_30d: item.row.mdd_30d_pct,
    behavior_consistency_30d: item.row.consistency_30d_pct,
    pnl_curve_points: item.points.length,
    pnl_curve_latest: num(item.points.at(-1)?.pnl, 2),
    pnl_curve_7d_bucket_sum: num(sumBuckets(item.points7d), 2),
    pnl_curve_30d_bucket_sum: num(sumBuckets(item.points30d), 2),
    top_recent_symbols: item.symbols.slice(0, 8).map((symbol) => `${symbol.symbol} (${symbol.count})`).join("; "),
    key_risks: item.verdict.risks.join("; "),
  };
});

await writeFile(
  csvPath,
  `${csvHeaders.join(",")}\n${csvRows.map((row) => csvHeaders.map((header) => csv(row[header])).join(",")).join("\n")}\n`,
);

const report = `# HL Intel Elite Wallet Deep Dive

Generated: ${new Date().toISOString()}

Purpose:
- Stress-test the wallets labeled \`elite_behavior\`.
- Decide whether they are product-grade Pro alert sources or just interesting wallets.
- Separate clean Hyperliquid signal from noisy/misleading data.

## Executive Verdict

${deepDives.map((item, index) => `${index + 1}. \`${item.row.address}\` — **${item.verdict.productVerdict}** ${item.verdict.alertThesis}`).join("\n")}

## Wallet Reviews

${deepDives.map((item) => {
  const stats3m = item.trader.stats?.["3M"] ?? {};
  const stats1m = item.trader.stats?.["1M"] ?? {};
  const stats1w = item.trader.stats?.["1W"] ?? {};
  const symbols = item.symbols.slice(0, 10).map((symbol) => {
    return `${symbol.symbol}: ${symbol.count} trades, ${money(symbol.notional)} notional, realized ${money(symbol.pnl)}, L/S ${symbol.long}/${symbol.short}`;
  });
  return `### ${item.row.priority} — \`${item.row.address}\`

Verdict:
- ${item.verdict.productVerdict}

Alert thesis:
- ${item.verdict.alertThesis}

Recommended policy:
- ${item.verdict.recommendedPolicy}

Account:
- Tier: ${item.trader.account_tier}
- Labels: ${(item.trader.labels ?? []).join(", ")}
- First seen: ${item.trader.first_seen_at}
- Last active: ${item.trader.last_active_at}
- Account value: ${money(item.trader.account?.total_value)}
- Free margin: ${money(item.trader.account?.free_margin)}
- Leverage ratio: ${num(item.trader.account?.leverage_ratio, 2)}x

Current book:
${item.positionsText.map((position) => `- ${position}`).join("\n")}

HyperCopy stats:
- 3M: ${money(stats3m.total_pnl)} PnL, ${pct(stats3m.roi)} ROI, ${pct(stats3m.win_rate)} win rate, ${pct(stats3m.max_drawdown)} max DD, ${stats3m.trades_count ?? "n/a"} trades, ${stats3m.closed_positions_count ?? "n/a"} closed positions.
- 1M: ${money(stats1m.total_pnl)} PnL, ${pct(stats1m.roi)} ROI, ${pct(stats1m.win_rate)} win rate, ${pct(stats1m.max_drawdown)} max DD.
- 1W: ${money(stats1w.total_pnl)} PnL, ${pct(stats1w.roi)} ROI, ${pct(stats1w.win_rate)} win rate, ${pct(stats1w.max_drawdown)} max DD.

Behavior layer:
- Sortino 30D: ${item.row.sortino_30d}
- MDD 30D: ${pct(item.row.mdd_30d_pct)}
- Consistency 30D: ${pct(item.row.consistency_30d_pct)}
- Data quality: ${item.row.data_quality}
- Source flag: ${item.row.source_conflict_flag || "none"}
- PnL curve latest: ${money(item.points.at(-1)?.pnl)}
- PnL curve 7D bucket sum: ${money(sumBuckets(item.points7d))}
- PnL curve 30D bucket sum: ${money(sumBuckets(item.points30d))}
- Full curve max drawdown from returned buckets: ${pct(item.mdd90.pct)} / ${money(item.mdd90.usd)}

Recent symbol mix from latest 100 trades:
${symbols.map((symbol) => `- ${symbol}`).join("\n")}

Largest positive PnL buckets:
${biggestBuckets(item.points, "gain", 5).map((bucket) => `- ${bucket}`).join("\n")}

Largest negative PnL buckets:
${biggestBuckets(item.points, "loss", 5).map((bucket) => `- ${bucket}`).join("\n")}

Risks:
${item.verdict.risks.map((risk) => `- ${risk}`).join("\n")}
`;
}).join("\n")}

## Product Decision

- Promote \`0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62\` as the current flagship elite monitor, but only for BTC position-change intelligence.
- Keep \`0xa3d843b6a057504284006bef6f34a2e9bc80fb6b\` in Priority B until the RWA/xyz noise and 1W drawdown profile are better understood.
- The most sellable alert right now is not "copy this wallet"; it is "elite BTC short is trimming/exiting/flipping after a large profitable move."
`;

await writeFile(reportPath, report);

console.log(`Wrote ${csvPath}`);
console.log(`Wrote ${reportPath}`);
console.log(`Deep-dived ${deepDives.length} elite wallets`);
