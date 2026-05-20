import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const candidatesPath = resolve("launch", "hl-intel-asymmetric-wallet-candidates.csv");
const csvPath = resolve("launch", "hl-intel-asymmetric-watch-review.csv");
const summaryPath = resolve("launch", "hl-intel-asymmetric-watch-review.md");

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
          "user-agent": "HL Intel asymmetric watch review",
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
  return `$${Math.round(Number(value ?? 0)).toLocaleString()}`;
}

function pct(value, digits = 1) {
  return `${Number(value ?? 0).toFixed(digits)}%`;
}

function compactPosition(position) {
  const side = position.side === "short" ? "S" : "L";
  return `${position.symbol} ${side} ${money(position.upnl)} notional ${money(Math.abs(Number(position.size ?? 0) * Number(position.mark_price ?? 0)))} liq ${position.liquidation_price ?? "n/a"}`;
}

function compactTrade(trade) {
  const action = trade.action ? `${trade.action} ` : "";
  const side = trade.side ? `${trade.side} ` : "";
  return `${trade.executed_at?.slice(0, 10) ?? "n/a"} ${action}${side}${trade.symbol} ${money(trade.notional_usd)} @ ${trade.price}`;
}

function symbolCounts(trades) {
  const counts = new Map();
  for (const trade of trades) {
    if (!trade.symbol) continue;
    counts.set(trade.symbol, (counts.get(trade.symbol) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([symbol, count]) => `${symbol} (${count})`);
}

function inferVerdict(row, trader, positions, trades) {
  const totalPnl = Number(row.total_pnl);
  const roi = Number(row.roi);
  const winRate = Number(row.win_rate);
  const drawdown = Number(row.max_drawdown_pct);
  const closed = Number(row.closed_positions);
  const openCount = positions.length;
  const totalUpnl = positions.reduce((sum, position) => sum + Number(position.upnl ?? 0), 0);
  const negativeUpnl = positions.reduce((sum, position) => sum + Math.min(0, Number(position.upnl ?? 0)), 0);
  const accountValue = Number(trader.account?.total_value ?? row.account_value ?? 0);
  const grossNotional = positions.reduce((sum, position) => {
    return sum + Math.abs(Number(position.size ?? 0) * Number(position.mark_price ?? 0));
  }, 0);
  const leverageRatio = Number(trader.account?.leverage_ratio ?? row.leverage_ratio ?? 0);
  const recentSymbols = symbolCounts(trades);
  const hasStockPerps = recentSymbols.some((symbol) => symbol.startsWith("xyz:"));
  const hasHugeOpenLoss = negativeUpnl < -Math.max(50_000, accountValue * 0.1);
  const hasReadableBook = openCount <= 3;
  const highQualityStats = totalPnl >= 75_000 && roi >= 50 && drawdown <= 15 && closed >= 500;

  let verdict = "review";
  let lane = "asymmetric_candidate";
  let priority = "B";
  let reason = "Worth manual review, but not monitor-ready yet.";

  if (hasHugeOpenLoss) {
    verdict = "risk_only";
    lane = "asymmetric_risk_watch";
    priority = "C";
    reason = "Current open losses are too large for clean signal use.";
  } else if (openCount === 0 && highQualityStats) {
    verdict = "asymmetric_reactivation_watch";
    lane = "fresh_exposure_alert";
    priority = totalPnl >= 150_000 || roi >= 100 ? "A" : "B";
    reason = "No open positions; useful if it reactivates with meaningful fresh exposure.";
  } else if (hasReadableBook && highQualityStats && totalUpnl > 0) {
    verdict = "asymmetric_active_monitor";
    lane = "profitable_position_monitor";
    priority = totalUpnl >= 25_000 ? "A" : "B";
    reason = "Readable active book with positive open PnL; monitor adds/trims/exits.";
  } else if (hasReadableBook && highQualityStats) {
    verdict = "asymmetric_active_monitor";
    lane = "position_change_monitor";
    priority = "B";
    reason = "Readable active book and strong asymmetric stats; monitor changes only.";
  }

  if (hasStockPerps && priority === "A") {
    priority = "B";
    reason += " RWA/xyz exposure makes this slightly more specialized/noisy.";
  }

  if (winRate < 50 && totalPnl < 75_000) {
    verdict = "review";
    lane = "low_win_rate_review";
    priority = "C";
    reason = "Low win rate may be valid, but needs more payoff validation before monitoring.";
  }

  return {
    verdict,
    lane,
    priority,
    reason,
    openCount,
    totalUpnl,
    negativeUpnl,
    grossNotional,
    leverageRatio,
    accountValue,
    recentSymbols,
  };
}

const rows = parseCsv(await readFile(candidatesPath, "utf8"));
const watchRows = rows.filter((row) => row.bucket === "asymmetric_watch");
const reviews = [];

for (const row of watchRows) {
  const [trader, positions, tradesPayload] = await Promise.all([
    getJson(`https://hypercopy.app/api/trader/${row.address}`),
    getJson(`https://hypercopy.app/api/trader/${row.address}/positions`),
    getJson(`https://hypercopy.app/api/trader/${row.address}/trades?page=1&per_page=50`),
  ]);
  const trades = tradesPayload.trades ?? [];
  const verdict = inferVerdict(row, trader, positions, trades);

  reviews.push({
    ...row,
    ...verdict,
    last_active_at: trader.last_active_at,
    latest_trade_at: trades[0]?.executed_at ?? null,
    positions: positions
      .slice()
      .sort((a, b) => Math.abs(Number(b.upnl ?? 0)) - Math.abs(Number(a.upnl ?? 0)))
      .map(compactPosition),
    recentTrades: trades.slice(0, 6).map(compactTrade),
  });
}

const priorityOrder = { A: 0, B: 1, C: 2 };
const verdictOrder = {
  asymmetric_active_monitor: 0,
  asymmetric_reactivation_watch: 1,
  review: 2,
  risk_only: 3,
};

reviews.sort((a, b) => {
  return (
    priorityOrder[a.priority] - priorityOrder[b.priority] ||
    verdictOrder[a.verdict] - verdictOrder[b.verdict] ||
    Number(b.score) - Number(a.score)
  );
});

const headers = [
  "priority",
  "verdict",
  "lane",
  "score",
  "address",
  "total_pnl",
  "roi",
  "win_rate",
  "max_drawdown_pct",
  "closed_positions",
  "open_positions",
  "total_open_upnl",
  "negative_open_upnl",
  "gross_open_notional",
  "account_value",
  "leverage_ratio",
  "last_active_at",
  "latest_trade_at",
  "recent_symbols",
  "positions",
  "reason",
];

const csvRows = [
  headers.join(","),
  ...reviews.map((row) => [
    row.priority,
    row.verdict,
    row.lane,
    row.score,
    row.address,
    row.total_pnl,
    row.roi,
    row.win_rate,
    row.max_drawdown_pct,
    row.closed_positions,
    row.openCount,
    row.totalUpnl,
    row.negativeUpnl,
    row.grossNotional,
    row.accountValue,
    row.leverageRatio,
    row.last_active_at,
    row.latest_trade_at,
    row.recentSymbols,
    row.positions,
    row.reason,
  ].map(csv).join(",")),
].join("\n");

function section(filter, title) {
  const group = reviews.filter(filter);
  if (!group.length) return `## ${title}\n\nNone.\n`;
  return `## ${title}\n\n${group.map((row, index) => {
    const positions = row.positions.length ? row.positions.slice(0, 5).join("; ") : "no open positions";
    const symbols = row.recentSymbols.length ? row.recentSymbols.join(", ") : "none";
    return `${index + 1}. \`${row.address}\` - ${row.priority}/${row.verdict}. Score ${row.score}, ${money(row.total_pnl)} PnL, ROI ${pct(row.roi, 2)}, win ${pct(row.win_rate)}, DD ${pct(row.max_drawdown_pct)}, closed ${row.closed_positions}. ${row.reason} Positions: ${positions}. Recent symbols: ${symbols}.`;
  }).join("\n")}\n`;
}

const counts = reviews.reduce((acc, row) => {
  acc[row.verdict] = (acc[row.verdict] ?? 0) + 1;
  return acc;
}, {});

const summary = `# HL Intel Asymmetric Watch Review

Local research only. No website changes.

This reviews the 12 asymmetric-watch candidates from the looser win-rate scan. These should not be mixed into the clean-grinder monitor until they pass current-position sanity checks.

## Counts

- Reviewed: ${reviews.length}
- Asymmetric active monitor: ${counts.asymmetric_active_monitor ?? 0}
- Asymmetric reactivation watch: ${counts.asymmetric_reactivation_watch ?? 0}
- Review: ${counts.review ?? 0}
- Risk only: ${counts.risk_only ?? 0}

${section((row) => row.priority === "A", "Priority A")}

${section((row) => row.priority === "B", "Priority B")}

${section((row) => row.priority === "C", "Priority C / Do Not Monitor Yet")}

## Operating Rule

Add Priority A asymmetric wallets to a separate asymmetric lane only. Priority B can be watched manually for one more cycle. Priority C should stay out of the pilot feed until payoff quality and current risk are clearer.
`;

await writeFile(csvPath, `${csvRows}\n`);
await writeFile(summaryPath, summary);

console.log(JSON.stringify({
  reviewed: reviews.length,
  counts,
  csvPath,
  summaryPath,
}, null, 2));
