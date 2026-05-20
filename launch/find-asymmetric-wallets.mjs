import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const auditPath = resolve("launch", "hypercopy-unique-audit.csv");
const csvPath = resolve("launch", "hl-intel-asymmetric-wallet-candidates.csv");
const summaryPath = resolve("launch", "hl-intel-asymmetric-wallet-candidates.md");

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
          "user-agent": "HL Intel asymmetric wallet scan",
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

function scoreCandidate(row, trader, positions, trades) {
  const totalPnl = Number(row.total_pnl);
  const roi = Number(row.roi);
  const winRate = Number(row.win_rate);
  const maxDrawdown = Number(row.max_drawdown_pct);
  const closedPositions = Number(row.closed_positions);
  const accountValue = Number(row.account_total_value);
  const avgPnlPerClosed = totalPnl / Math.max(1, closedPositions);
  const losses = trades.filter((trade) => Number(trade.pnl ?? 0) < 0).map((trade) => Math.abs(Number(trade.pnl)));
  const wins = trades.filter((trade) => Number(trade.pnl ?? 0) > 0).map((trade) => Number(trade.pnl));
  const sumWins = wins.reduce((sum, value) => sum + value, 0);
  const sumLosses = losses.reduce((sum, value) => sum + value, 0);
  const avgWin = wins.length ? sumWins / wins.length : null;
  const avgLoss = losses.length ? sumLosses / losses.length : null;
  const payoffRatio = avgWin && avgLoss ? avgWin / avgLoss : null;
  const profitFactor = sumLosses ? sumWins / sumLosses : wins.length ? 99 : null;
  const breakevenPayoff = winRate > 0 ? (100 - winRate) / winRate : null;
  const totalOpenUpnl = positions.reduce((sum, position) => sum + Number(position.upnl ?? 0), 0);
  const negativeOpenUpnl = positions.reduce((sum, position) => sum + Math.min(0, Number(position.upnl ?? 0)), 0);
  const openCount = positions.length;
  const labels = row.labels ?? "";
  const asymmetricLabel = /Asymmetric Pro|Large Gain|Sustained Profit/i.test(labels);
  const recentTradePnlSample = wins.length + losses.length;

  let score = 0;
  score += Math.min(25, Math.log10(Math.max(totalPnl, 1)) * 4);
  score += Math.min(20, Math.max(0, roi) / 10);
  score += Math.min(15, avgPnlPerClosed / 100);
  score += Math.max(0, 25 - maxDrawdown);
  score += closedPositions >= 500 && closedPositions <= 3000 ? 8 : 0;
  score += asymmetricLabel ? 8 : 0;
  if (payoffRatio && breakevenPayoff) score += Math.min(18, Math.max(0, payoffRatio / breakevenPayoff) * 6);
  if (profitFactor) score += Math.min(12, Math.max(0, profitFactor - 1) * 6);
  if (openCount > 8) score -= 12;
  if (negativeOpenUpnl < -Math.max(25_000, accountValue * 0.05)) score -= 18;
  if (maxDrawdown > 20) score -= 8;

  let bucket = "review";
  let reason = "Lower-win-rate profitable wallet worth manual review.";

  const expectancyConfirmed = (
    payoffRatio !== null &&
    breakevenPayoff !== null &&
    payoffRatio >= breakevenPayoff * 1.15 &&
    profitFactor !== null &&
    profitFactor >= 1.15 &&
    recentTradePnlSample >= 20
  );
  const statsOnlyAsymmetry = (
    asymmetricLabel &&
    totalPnl >= 50_000 &&
    roi >= 25 &&
    maxDrawdown <= 15 &&
    closedPositions >= 500
  );

  if (expectancyConfirmed || statsOnlyAsymmetry) {
    bucket = "asymmetric_watch";
    reason = expectancyConfirmed
      ? "Recent trade sample supports positive expectancy despite sub-80% win rate."
      : "Stats and labels suggest asymmetric trader; trade-level expectancy still needs confirmation.";
  }

  if (negativeOpenUpnl < -Math.max(50_000, accountValue * 0.1)) {
    bucket = "risk_watch";
    reason = "Stats are interesting, but current open losses are too large for clean signal use.";
  }

  if (totalPnl < 25_000 || maxDrawdown >= 25 || winRate < 35) {
    bucket = "hold";
    reason = "Interesting but below current asymmetric-watch quality bar.";
  }

  return {
    score: Math.round(score),
    bucket,
    reason,
    avgPnlPerClosed,
    recentTradePnlSample,
    avgWin,
    avgLoss,
    payoffRatio,
    breakevenPayoff,
    profitFactor,
    openCount,
    totalOpenUpnl,
    negativeOpenUpnl,
    leverageRatio: trader.account?.leverage_ratio ?? null,
    accountValue: trader.account?.total_value ?? accountValue,
    topPositions: positions.slice(0, 5).map((position) => {
      const direction = position.side === "short" ? "S" : "L";
      return `${position.symbol} ${direction} ${money(position.upnl)}`;
    }),
  };
}

const rows = parseCsv(await readFile(auditPath, "utf8"));
const prefilter = rows
  .filter((row) => {
    return (
      Number(row.total_pnl) > 0 &&
      Number(row.win_rate) >= 35 &&
      Number(row.win_rate) < 80 &&
      Number(row.closed_positions) >= 300 &&
      Number(row.closed_positions) <= 3000 &&
      Number(row.max_drawdown_pct) < 25
    );
  })
  .sort((a, b) => Number(b.total_pnl) - Number(a.total_pnl))
  .slice(0, 75);

const enriched = [];

for (const row of prefilter) {
  const [trader, positions, tradesPayload] = await Promise.all([
    getJson(`https://hypercopy.app/api/trader/${row.address}`),
    getJson(`https://hypercopy.app/api/trader/${row.address}/positions`),
    getJson(`https://hypercopy.app/api/trader/${row.address}/trades?page=1&per_page=100`),
  ]);
  const trades = tradesPayload.trades ?? [];
  enriched.push({
    ...row,
    ...scoreCandidate(row, trader, positions, trades),
  });
}

enriched.sort((a, b) => {
  const order = { asymmetric_watch: 0, review: 1, risk_watch: 2, hold: 3 };
  return (order[a.bucket] - order[b.bucket]) || b.score - a.score;
});

const headers = [
  "bucket",
  "score",
  "rank",
  "address",
  "total_pnl",
  "roi",
  "win_rate",
  "max_drawdown_pct",
  "closed_positions",
  "avg_pnl_per_closed",
  "recent_trade_pnl_sample",
  "avg_win",
  "avg_loss",
  "payoff_ratio",
  "breakeven_payoff",
  "profit_factor",
  "open_positions",
  "total_open_upnl",
  "negative_open_upnl",
  "account_value",
  "leverage_ratio",
  "labels",
  "top_positions",
  "reason",
];

const csvRows = [
  headers.join(","),
  ...enriched.map((row) => [
    row.bucket,
    row.score,
    row.rank,
    row.address,
    row.total_pnl,
    row.roi,
    row.win_rate,
    row.max_drawdown_pct,
    row.closed_positions,
    row.avgPnlPerClosed,
    row.recentTradePnlSample,
    row.avgWin,
    row.avgLoss,
    row.payoffRatio,
    row.breakevenPayoff,
    row.profitFactor,
    row.openCount,
    row.totalOpenUpnl,
    row.negativeOpenUpnl,
    row.accountValue,
    row.leverageRatio,
    row.labels,
    row.topPositions,
    row.reason,
  ].map(csv).join(",")),
].join("\n");

function section(bucket, title) {
  const group = enriched.filter((row) => row.bucket === bucket);
  if (!group.length) return `## ${title}\n\nNone.\n`;
  return `## ${title}\n\n${group.slice(0, 25).map((row, index) => {
    const payoff = row.payoffRatio ? `${row.payoffRatio.toFixed(2)}x` : "n/a";
    const breakeven = row.breakevenPayoff ? `${row.breakevenPayoff.toFixed(2)}x` : "n/a";
    const pf = row.profitFactor ? row.profitFactor.toFixed(2) : "n/a";
    const positions = row.topPositions.length ? row.topPositions.join("; ") : "no open positions";
    return `${index + 1}. \`${row.address}\` - score ${row.score}, ${money(row.total_pnl)} PnL, ROI ${pct(row.roi, 2)}, win ${pct(row.win_rate)}, DD ${pct(row.max_drawdown_pct)}, closed ${row.closed_positions}, payoff ${payoff} vs breakeven ${breakeven}, PF ${pf}. ${row.reason} Positions: ${positions}.`;
  }).join("\n")}\n`;
}

const counts = enriched.reduce((acc, row) => {
  acc[row.bucket] = (acc[row.bucket] ?? 0) + 1;
  return acc;
}, {});

const summary = `# HL Intel Asymmetric Wallet Candidates

Local research only. No website changes.

This pass fixes the overly strict 80% win-rate filter. A trader can be profitable with a 35-50% win rate if average winners materially exceed average losers. This scan looks for sub-80% win-rate wallets with positive PnL, controlled drawdown, enough closed positions, and evidence of asymmetric payoff.

## Filter Change

Old clean-grinder filter:

- Positive 3M PnL
- 500-3,000 closed positions
- Win rate >= 80%
- Max drawdown < 15%

New asymmetric candidate filter:

- Positive 3M PnL
- 300-3,000 closed positions
- Win rate 35-80%
- Max drawdown < 25%
- Then review payoff ratio, profit factor, ROI, labels, and current open-book risk

## Counts

- Prefiltered sub-80% candidates reviewed: ${enriched.length}
- Asymmetric watch: ${counts.asymmetric_watch ?? 0}
- Review: ${counts.review ?? 0}
- Risk watch: ${counts.risk_watch ?? 0}
- Hold: ${counts.hold ?? 0}

${section("asymmetric_watch", "Asymmetric Watch")}

${section("review", "Review")}

${section("risk_watch", "Risk Watch")}

${section("hold", "Hold")}

## Operator Read

The original 80% win-rate rule is useful for finding smooth grinders, but it misses asymmetric traders. Keep the original cohort as the clean feed, and add a separate asymmetric lane. Do not merge them blindly. These wallets need payoff-ratio validation and open-book sanity checks before they enter the pilot monitor.
`;

await writeFile(csvPath, `${csvRows}\n`);
await writeFile(summaryPath, summary);

console.log(JSON.stringify({
  reviewed: enriched.length,
  counts,
  csvPath,
  summaryPath,
}, null, 2));
