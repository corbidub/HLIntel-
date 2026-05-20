import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const candidatesPath = resolve("launch", "hl-intel-asymmetric-wallet-candidates.csv");
const behaviorPath = resolve("launch", "hl-intel-wallet-behavior-metrics.csv");
const csvPath = resolve("launch", "hl-intel-asymmetric-wallet-deep-dive.csv");
const reportPath = resolve("launch", "hl-intel-asymmetric-wallet-deep-dive.md");

const includedBuckets = new Set(["asymmetric_watch", "review", "risk_watch"]);
const cleanCryptoSymbols = new Set([
  "BTC", "ETH", "SOL", "HYPE", "TAO", "DOGE", "BNB", "ZEC", "ASTER", "DYDX",
  "TON", "GRASS", "STBL", "MEGA", "PAXG", "XRP", "NEAR", "AVAX", "LINK",
  "XMR", "ZRO", "WLD", "TRX", "BCH",
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
          "user-agent": "HL Intel asymmetric wallet deep dive",
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

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function num(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
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

function bucketRank(bucket) {
  return { asymmetric_watch: 0, review: 1, risk_watch: 2 }[bucket] ?? 3;
}

function readinessRank(readiness) {
  return {
    curated_candidate: 0,
    custom_watch_candidate: 1,
    reactivation_candidate: 2,
    payoff_validation_needed: 3,
    data_conflict_review: 4,
    risk_reject: 5,
  }[readiness] ?? 9;
}

function isNoisySymbol(symbol) {
  return symbol?.startsWith("xyz:") || symbol?.startsWith("@") || symbol === "STABLE";
}

function symbolSummary(trades) {
  const map = new Map();
  for (const trade of trades) {
    if (!trade.symbol) continue;
    const item = map.get(trade.symbol) ?? {
      symbol: trade.symbol,
      count: 0,
      long: 0,
      short: 0,
      open: 0,
      close: 0,
      notional: 0,
      pnl: 0,
    };
    item.count += 1;
    item.long += trade.side === "long" ? 1 : 0;
    item.short += trade.side === "short" ? 1 : 0;
    item.open += trade.action === "open" ? 1 : 0;
    item.close += trade.action === "close" ? 1 : 0;
    item.notional += Number(trade.notional_usd ?? 0);
    item.pnl += Number(trade.pnl ?? 0);
    map.set(trade.symbol, item);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

function cleanTokens(symbols) {
  return symbols
    .filter((item) => cleanCryptoSymbols.has(item.symbol) && !isNoisySymbol(item.symbol))
    .map((item) => item.symbol)
    .filter((symbol, index, arr) => arr.indexOf(symbol) === index);
}

function noisyTokens(symbols) {
  return symbols
    .filter((item) => isNoisySymbol(item.symbol))
    .map((item) => item.symbol)
    .filter((symbol, index, arr) => arr.indexOf(symbol) === index);
}

function tokenUniverse(symbols, positions) {
  const map = new Map(symbols.map((item) => [item.symbol, item]));
  for (const position of positions) {
    if (!position.symbol || map.has(position.symbol)) continue;
    map.set(position.symbol, {
      symbol: position.symbol,
      count: 0,
      long: position.side === "long" ? 1 : 0,
      short: position.side === "short" ? 1 : 0,
      open: 0,
      close: 0,
      notional: Math.abs(Number(position.size ?? 0) * Number(position.mark_price ?? 0)),
      pnl: Number(position.upnl ?? 0),
    });
  }
  return [...map.values()].sort((a, b) => b.count - a.count || b.notional - a.notional);
}

function openPositionText(positions) {
  if (!positions.length) return "";
  return positions.map((position) => {
    const side = position.side === "short" ? "S" : "L";
    const notional = Math.abs(Number(position.size ?? 0) * Number(position.mark_price ?? 0));
    return `${position.symbol} ${side} ${money(notional)} uPnL ${money(position.upnl)} liq ${position.liquidation_price ?? "n/a"}`;
  }).join("; ");
}

function recentPayoffStats(trades) {
  const realized = trades
    .map((trade) => Number(trade.pnl ?? 0))
    .filter((pnl) => Number.isFinite(pnl) && pnl !== 0);
  const wins = realized.filter((pnl) => pnl > 0);
  const losses = realized.filter((pnl) => pnl < 0);
  const grossWins = wins.reduce((sum, pnl) => sum + pnl, 0);
  const grossLosses = Math.abs(losses.reduce((sum, pnl) => sum + pnl, 0));
  const avgWin = wins.length ? grossWins / wins.length : null;
  const avgLoss = losses.length ? grossLosses / losses.length : null;

  return {
    realizedSample: realized.length,
    wins: wins.length,
    losses: losses.length,
    sampleWinRate: realized.length ? (wins.length / realized.length) * 100 : null,
    avgWin,
    avgLoss,
    payoffRatio: avgWin && avgLoss ? avgWin / avgLoss : null,
    profitFactor: grossLosses ? grossWins / grossLosses : wins.length ? 99 : null,
    netPnl: grossWins - grossLosses,
  };
}

function breakevenPayoff(winRatePct) {
  const winRate = Number(winRatePct) / 100;
  if (!Number.isFinite(winRate) || winRate <= 0 || winRate >= 1) return null;
  return (1 - winRate) / winRate;
}

function inferReadiness({ candidate, behavior, trader, positions, symbols, payoff }) {
  const winRate = Number(candidate.win_rate);
  const totalPnl = Number(candidate.total_pnl);
  const drawdown = Number(candidate.max_drawdown_pct);
  const closed = Number(candidate.closed_positions);
  const accountValue = Number(trader.account?.total_value ?? candidate.account_value ?? 0);
  const leverageRatio = Number(trader.account?.leverage_ratio ?? candidate.leverage_ratio ?? 0);
  const currentUpnl = positions.reduce((sum, position) => sum + Number(position.upnl ?? 0), 0);
  const negativeUpnl = positions.reduce((sum, position) => sum + Math.min(0, Number(position.upnl ?? 0)), 0);
  const universe = tokenUniverse(symbols, positions);
  const noisy = noisyTokens(universe);
  const clean = cleanTokens(universe);
  const behaviorTier = behavior?.behavior_tier ?? "not_behavior_scored";
  const sourceConflict = behavior?.source_conflict_flag ?? "";
  const hardRisk = candidate.bucket === "risk_watch" || negativeUpnl < -Math.max(50_000, accountValue * 0.1);
  const trueLowWinAsym = winRate < 60 && totalPnl > 40_000 && drawdown <= 20 && closed >= 500;
  const higherWinAsym = winRate >= 60 && winRate < 80 && totalPnl > 75_000 && drawdown <= 15 && closed >= 500;
  const payoffConfirmed = payoff.realizedSample >= 20 &&
    payoff.profitFactor !== null &&
    payoff.profitFactor > 1.2 &&
    (payoff.payoffRatio === null || payoff.payoffRatio >= (breakevenPayoff(winRate) ?? 0));

  if (hardRisk || behaviorTier === "risk_watch" || behaviorTier === "high_risk_behavior") {
    return {
      readiness: "risk_reject",
      lane: "internal_only",
      thesis: "Interesting headline stats, but risk/current drawdown behavior is not product-safe.",
      alertPolicy: "Do not include in paid alerts. Internal observation only.",
      risk: [
        candidate.bucket === "risk_watch" ? "candidate file bucketed as risk_watch" : null,
        behaviorTier === "risk_watch" || behaviorTier === "high_risk_behavior" ? `behavior tier ${behaviorTier}` : null,
        negativeUpnl < -Math.max(50_000, accountValue * 0.1) ? `large open negative uPnL ${money(negativeUpnl)}` : null,
      ].filter(Boolean).join("; "),
    };
  }

  if (sourceConflict || behaviorTier === "low_pnl_unproven" || behaviorTier === "incomplete_data") {
    return {
      readiness: "data_conflict_review",
      lane: "manual_review",
      thesis: "Stats may be interesting, but the behavior layer or PnL source does not support productizing yet.",
      alertPolicy: "Do not sell yet. Re-check data source and live book before alerting.",
      risk: [sourceConflict || null, behaviorTier !== "not_behavior_scored" ? `behavior tier ${behaviorTier}` : null].filter(Boolean).join("; "),
    };
  }

  if ((trueLowWinAsym || higherWinAsym) && behaviorTier === "asymmetric_behavior" && clean.length && !noisy.length && !positions.length) {
    return {
      readiness: "reactivation_candidate",
      lane: "token_entry_exit_watch",
      thesis: "Clean reactivation wallet for token-filtered entry/exit alerts.",
      alertPolicy: `Alert when it opens meaningful exposure in ${clean.slice(0, 6).join(", ")}; then alert on exit or flip.`,
      risk: "No active position; value depends on catching next clean entry.",
    };
  }

  if ((trueLowWinAsym || higherWinAsym) && behaviorTier === "asymmetric_behavior" && positions.length && clean.length && !noisy.length && leverageRatio <= 8) {
    return {
      readiness: "curated_candidate",
      lane: "active_asymmetric_monitor",
      thesis: "Asymmetric wallet with clean token behavior and active book.",
      alertPolicy: "Alert on material add, trim, exit, or flip.",
      risk: currentUpnl < 0 ? `open uPnL currently ${money(currentUpnl)}` : "Needs ongoing book-change monitoring.",
    };
  }

  if ((trueLowWinAsym || higherWinAsym) && clean.length) {
    return {
      readiness: "custom_watch_candidate",
      lane: "custom_token_watch",
      thesis: "Useful for custom watchlists, but not clean enough for the curated flagship feed.",
      alertPolicy: `Alert only for user-selected tokens: ${clean.slice(0, 6).join(", ")}.`,
      risk: [
        noisy.length ? `noisy/custom symbols ${noisy.slice(0, 6).join(", ")}` : null,
        leverageRatio > 8 ? `leverage ratio ${num(leverageRatio, 2)}x` : null,
        currentUpnl < 0 ? `open uPnL ${money(currentUpnl)}` : null,
        !payoffConfirmed ? "trade-level payoff not confirmed from recent sample" : null,
      ].filter(Boolean).join("; "),
    };
  }

  return {
    readiness: "payoff_validation_needed",
    lane: "research_only",
    thesis: "Headline stats suggest asymmetry, but product value is not confirmed.",
    alertPolicy: "Do not alert yet. Need cleaner token history, stronger behavior tier, or confirmed payoff sample.",
    risk: [
      clean.length ? null : "no clean recurring token set",
      !payoffConfirmed ? "trade-level payoff not confirmed" : null,
      behaviorTier !== "not_behavior_scored" ? `behavior tier ${behaviorTier}` : "not behavior scored",
    ].filter(Boolean).join("; "),
  };
}

const candidates = parseCsv(await readFile(candidatesPath, "utf8"))
  .filter((row) => includedBuckets.has(row.bucket));
const behaviorRows = new Map(parseCsv(await readFile(behaviorPath, "utf8")).map((row) => [row.address, row]));
const reviews = [];

for (const candidate of candidates) {
  const [trader, positions, tradesPayload] = await Promise.all([
    getJson(`https://hypercopy.app/api/trader/${candidate.address}`),
    getJson(`https://hypercopy.app/api/trader/${candidate.address}/positions`),
    getJson(`https://hypercopy.app/api/trader/${candidate.address}/trades?page=1&per_page=100`),
  ]);
  const trades = tradesPayload.trades ?? [];
  const symbols = symbolSummary(trades);
  const payoff = recentPayoffStats(trades);
  const behavior = behaviorRows.get(candidate.address);
  const readiness = inferReadiness({ candidate, behavior, trader, positions, symbols, payoff });
  reviews.push({
    candidate,
    behavior,
    trader,
    positions,
    trades,
    symbols,
    payoff,
    readiness,
  });
}

reviews.sort((a, b) => (
  readinessRank(a.readiness.readiness) - readinessRank(b.readiness.readiness) ||
  bucketRank(a.candidate.bucket) - bucketRank(b.candidate.bucket) ||
  Number(b.candidate.score) - Number(a.candidate.score)
));

const headers = [
  "readiness",
  "lane",
  "bucket",
  "score",
  "address",
  "thesis",
  "alert_policy",
  "risk",
  "total_pnl",
  "roi",
  "win_rate",
  "breakeven_payoff",
  "max_drawdown_pct",
  "closed_positions",
  "avg_pnl_per_closed",
  "account_value",
  "leverage_ratio",
  "open_positions_count",
  "current_upnl",
  "open_positions",
  "behavior_tier",
  "sortino_30d",
  "mdd_30d_pct",
  "consistency_30d_pct",
  "data_quality",
  "source_conflict_flag",
  "recent_realized_sample",
  "recent_sample_win_rate",
  "recent_payoff_ratio",
  "recent_profit_factor",
  "recent_net_pnl",
  "clean_tokens",
  "noisy_tokens",
  "recent_symbol_mix",
  "labels",
];

const csvRows = reviews.map((review) => {
  const currentUpnl = review.positions.reduce((sum, position) => sum + Number(position.upnl ?? 0), 0);
  const universe = tokenUniverse(review.symbols, review.positions);
  const clean = cleanTokens(universe);
  const noisy = noisyTokens(universe);
  const behavior = review.behavior ?? {};
  return {
    readiness: review.readiness.readiness,
    lane: review.readiness.lane,
    bucket: review.candidate.bucket,
    score: review.candidate.score,
    address: review.candidate.address,
    thesis: review.readiness.thesis,
    alert_policy: review.readiness.alertPolicy,
    risk: review.readiness.risk,
    total_pnl: review.candidate.total_pnl,
    roi: review.candidate.roi,
    win_rate: review.candidate.win_rate,
    breakeven_payoff: num(breakevenPayoff(review.candidate.win_rate), 3),
    max_drawdown_pct: review.candidate.max_drawdown_pct,
    closed_positions: review.candidate.closed_positions,
    avg_pnl_per_closed: num(review.candidate.avg_pnl_per_closed, 2),
    account_value: num(review.trader.account?.total_value ?? review.candidate.account_value, 2),
    leverage_ratio: num(review.trader.account?.leverage_ratio ?? review.candidate.leverage_ratio, 2),
    open_positions_count: review.positions.length,
    current_upnl: num(currentUpnl, 2),
    open_positions: openPositionText(review.positions),
    behavior_tier: behavior.behavior_tier ?? "",
    sortino_30d: behavior.sortino_30d ?? "",
    mdd_30d_pct: behavior.mdd_30d_pct ?? "",
    consistency_30d_pct: behavior.consistency_30d_pct ?? "",
    data_quality: behavior.data_quality ?? "",
    source_conflict_flag: behavior.source_conflict_flag ?? "",
    recent_realized_sample: review.payoff.realizedSample,
    recent_sample_win_rate: num(review.payoff.sampleWinRate, 1),
    recent_payoff_ratio: num(review.payoff.payoffRatio, 2),
    recent_profit_factor: num(review.payoff.profitFactor, 2),
    recent_net_pnl: num(review.payoff.netPnl, 2),
    clean_tokens: clean.join("; "),
    noisy_tokens: noisy.join("; "),
    recent_symbol_mix: universe.slice(0, 10).map((item) => {
      return `${item.symbol} ${item.count}x ${money(item.notional)} pnl ${money(item.pnl)} L/S ${item.long}/${item.short}`;
    }).join("; "),
    labels: review.trader.labels?.join("; ") ?? review.candidate.labels,
  };
});

await writeFile(
  csvPath,
  `${headers.join(",")}\n${csvRows.map((row) => headers.map((header) => csv(row[header])).join(",")).join("\n")}\n`,
);

function reportSection(title, readinesses) {
  const rows = reviews.filter((review) => readinesses.includes(review.readiness.readiness));
  if (!rows.length) return `## ${title}\n\nNone.\n`;
  return `## ${title}\n\n${rows.map((review, index) => {
    const universe = tokenUniverse(review.symbols, review.positions);
    const clean = cleanTokens(universe);
    const noisy = noisyTokens(universe);
    const behavior = review.behavior ?? {};
    return `${index + 1}. \`${review.candidate.address}\` — ${review.readiness.readiness}/${review.readiness.lane}
   - Stats: ${money(review.candidate.total_pnl)} PnL, ${pct(review.candidate.roi)} ROI, ${pct(review.candidate.win_rate)} win, ${pct(review.candidate.max_drawdown_pct)} DD, ${review.candidate.closed_positions} closed
   - Behavior: ${behavior.behavior_tier ?? "not scored"}, Sortino ${behavior.sortino_30d ?? "n/a"}, MDD ${pct(behavior.mdd_30d_pct)}, data ${behavior.data_quality ?? "n/a"}
   - Recent payoff sample: ${review.payoff.realizedSample} realized trades, win ${pct(review.payoff.sampleWinRate)}, payoff ${num(review.payoff.payoffRatio, 2) ?? "n/a"}, PF ${num(review.payoff.profitFactor, 2) ?? "n/a"}
   - Current: ${review.positions.length ? openPositionText(review.positions) : "no open positions"}
   - Clean tokens: ${clean.length ? clean.join(", ") : "none"}${noisy.length ? `; noisy/custom: ${noisy.slice(0, 8).join(", ")}` : ""}
   - Policy: ${review.readiness.alertPolicy}
   - Risk: ${review.readiness.risk || "none"}`;
  }).join("\n\n")}\n`;
}

const counts = reviews.reduce((acc, review) => {
  acc[review.readiness.readiness] = (acc[review.readiness.readiness] ?? 0) + 1;
  return acc;
}, {});

const report = `# HL Intel Asymmetric Wallet Deep Dive

Generated: ${new Date().toISOString()}

Scope:
- \`asymmetric_watch\`, \`review\`, and \`risk_watch\` buckets from \`hl-intel-asymmetric-wallet-candidates.csv\`.
- Excludes lower-quality \`hold\` wallets.

Purpose:
- Find lower-win-rate or payoff-skewed wallets that fit the buyer-requested workflow:
  - rank wallets by risk-adjusted quality, PnL, and account size
  - filter by token
  - alert on entry, exit, flip, and meaningful position changes

Important caveat:
- HyperCopy recent trade data often has sparse/non-realized PnL fields. \`recent payoff sample\` is useful when populated, but not enough by itself to prove expectancy.

## Readiness Counts

${Object.entries(counts).sort((a, b) => readinessRank(a[0]) - readinessRank(b[0])).map(([key, value]) => `- ${key}: ${value}`).join("\n")}

${reportSection("Curated Candidates", ["curated_candidate"])}

${reportSection("Custom Watch Candidates", ["custom_watch_candidate"])}

${reportSection("Reactivation Candidates", ["reactivation_candidate"])}

${reportSection("Needs Payoff / Data Validation", ["payoff_validation_needed", "data_conflict_review"])}

${reportSection("Risk Rejects", ["risk_reject"])}

## Operator Takeaway

- The asymmetric lane is promising, but most wallets are not ready for a flagship curated feed.
- Best commercial use is custom token watchlists plus reactivation alerts.
- The product should keep risk flags visible: behavior tier, source conflict, noisy symbols, leverage, and open uPnL.
- Do not over-sell "asymmetric" until payoff validation is stronger.
`;

await writeFile(reportPath, report);

console.log(`Wrote ${csvPath}`);
console.log(`Wrote ${reportPath}`);
console.log(`Reviewed ${reviews.length} asymmetric wallets`);
