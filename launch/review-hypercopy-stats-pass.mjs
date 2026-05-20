import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const auditPath = resolve("launch", "hypercopy-unique-audit.csv");
const csvPath = resolve("launch", "hypercopy-28-wallet-review.csv");
const summaryPath = resolve("launch", "hypercopy-28-wallet-review.md");

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
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") {
      value += char;
    }
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
          "user-agent": "HL Intel local wallet review",
        },
      });

      if (response.ok) {
        return response.json();
      }

      lastError = new Error(`${response.status} ${url}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 750));
  }

  throw lastError;
}

function money(value) {
  const number = Number(value ?? 0);
  return `$${Math.round(number).toLocaleString()}`;
}

function pct(value, digits = 1) {
  return `${Number(value ?? 0).toFixed(digits)}%`;
}

function compactPosition(position) {
  const upnl = Number(position.upnl ?? 0);
  const direction = position.side === "short" ? "S" : "L";
  return `${position.symbol} ${direction} ${money(upnl)}`;
}

function classify(row, trader, positions, trades) {
  const totalPnl = Number(row.total_pnl);
  const roi = Number(row.roi);
  const winRate = Number(row.win_rate);
  const maxDrawdown = Number(row.max_drawdown_pct);
  const closedPositions = Number(row.closed_positions);
  const openCount = Number(row.open_positions_count);
  const accountValue = Number(row.account_total_value);
  const leverageRatio = Number(trader.account?.leverage_ratio ?? 0);
  const totalUpnl = positions.reduce((sum, position) => sum + Number(position.upnl ?? 0), 0);
  const negativeUpnl = positions.reduce((sum, position) => sum + Math.min(0, Number(position.upnl ?? 0)), 0);
  const absoluteOpenUpnl = positions.reduce((sum, position) => sum + Math.abs(Number(position.upnl ?? 0)), 0);
  const hasNoOpenPositions = positions.length === 0;
  const hasManyOpenPositions = positions.length > 10;
  const hasUglyOpenLoss = negativeUpnl < -Math.max(25000, accountValue * 0.05);
  const hasHugePositiveOpenPnl = totalUpnl > Math.max(100000, accountValue * 0.1);
  const tinyEdge = totalPnl < 15000 || roi < 3;
  const quietClean = hasNoOpenPositions && totalPnl >= 15000 && roi >= 3 && maxDrawdown < 12 && winRate >= 85;
  const focusedOpenBook = positions.length > 0 && positions.length <= 6 && !hasManyOpenPositions && !hasUglyOpenLoss;
  const latestTrade = trades[0]?.executed_at ?? trader.last_active_at ?? row.last_active_at;
  const recentSymbols = [...new Set(trades.slice(0, 20).map((trade) => trade.symbol).filter(Boolean))];

  let bucket = "exclude_or_low_priority";
  let reason = "Stats pass is real, but current profile is low signal for paid alerts.";

  if (hasManyOpenPositions) {
    bucket = "exclude_or_low_priority";
    reason = `Too many open positions (${positions.length}); likely noisy for Telegram alerts.`;
  } else if (hasUglyOpenLoss) {
    bucket = "risk_monitor";
    reason = `Current book has large unrealized loss (${money(negativeUpnl)}); useful as risk/liquidation monitor, not clean smart-money feed.`;
  } else if (hasHugePositiveOpenPnl || focusedOpenBook) {
    bucket = "monitor";
    reason = `Current open book is active and readable; monitor changes/unwinds before promoting.`;
  } else if (quietClean) {
    bucket = "watch";
    reason = "Clean historical profile with no current open-book noise; watch for reactivation.";
  } else if (tinyEdge) {
    bucket = "exclude_or_low_priority";
    reason = "Positive but small edge; likely not worth scarce manual-review time yet.";
  }

  let score = 0;
  score += Math.min(30, Math.log10(Math.max(totalPnl, 1)) * 4);
  score += Math.min(20, roi / 10);
  score += Math.min(20, Math.max(0, winRate - 80));
  score += Math.max(0, 15 - maxDrawdown);
  score += closedPositions >= 500 && closedPositions <= 3000 ? 10 : -10;
  score += hasNoOpenPositions ? 8 : 0;
  score += positions.length > 10 ? -25 : 0;
  score += hasUglyOpenLoss ? -20 : 0;
  score += leverageRatio > 10 ? -8 : 0;
  score = Math.round(score);

  return {
    bucket,
    score,
    reason,
    totalUpnl,
    negativeUpnl,
    absoluteOpenUpnl,
    leverageRatio,
    latestTrade,
    recentSymbols,
  };
}

const auditRows = parseCsv(await readFile(auditPath, "utf8"));
const statsPassRows = auditRows.filter((row) => row.stats_pass === "yes");
const reviews = [];

for (const row of statsPassRows) {
  const address = row.address;
  const trader = await getJson(`https://hypercopy.app/api/trader/${address}`);
  const positions = await getJson(`https://hypercopy.app/api/trader/${address}/positions`);
  const tradesPayload = await getJson(`https://hypercopy.app/api/trader/${address}/trades?page=1&per_page=20`);
  const trades = tradesPayload.trades ?? [];
  const review = classify(row, trader, positions, trades);

  reviews.push({
    ...row,
    trader,
    positions,
    trades,
    ...review,
  });
}

reviews.sort((a, b) => {
  const bucketOrder = { watch: 0, monitor: 1, risk_monitor: 2, exclude_or_low_priority: 3 };
  return (bucketOrder[a.bucket] - bucketOrder[b.bucket]) || (b.score - a.score);
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
  "open_positions_count",
  "total_open_upnl",
  "negative_open_upnl",
  "account_total_value",
  "leverage_ratio",
  "latest_trade_at",
  "recent_symbols",
  "top_open_positions",
  "review_reason",
];

const csvRows = [
  headers.join(","),
  ...reviews.map((review) => [
    review.bucket,
    review.score,
    review.rank,
    review.address,
    review.total_pnl,
    review.roi,
    review.win_rate,
    review.max_drawdown_pct,
    review.closed_positions,
    review.open_positions_count,
    review.totalUpnl,
    review.negativeUpnl,
    review.account_total_value,
    review.leverageRatio,
    review.latestTrade,
    review.recentSymbols,
    review.positions.slice(0, 8).map(compactPosition),
    review.reason,
  ].map(csv).join(",")),
].join("\n");

function section(bucket, title) {
  const bucketRows = reviews.filter((review) => review.bucket === bucket);
  if (!bucketRows.length) return `## ${title}\n\nNone.\n`;

  return `## ${title}\n\n${bucketRows.map((review, index) => {
    const positions = review.positions.length
      ? review.positions.slice(0, 5).map(compactPosition).join("; ")
      : "no open positions";
    return `${index + 1}. \`${review.address}\` - score ${review.score}, ${money(review.total_pnl)} 3M PnL, ROI ${pct(review.roi, 2)}, win ${pct(review.win_rate)}, DD ${pct(review.max_drawdown_pct)}, closed ${review.closed_positions}, open ${review.open_positions_count}. ${review.reason} Positions: ${positions}.`;
  }).join("\n")}\n`;
}

const bucketCounts = reviews.reduce((counts, review) => {
  counts[review.bucket] = (counts[review.bucket] ?? 0) + 1;
  return counts;
}, {});

const summary = `# HyperCopy 28 Wallet Review

Local HL Intel research. No website changes.

## Review Inputs

- Source file: \`hypercopy-unique-audit.csv\`
- Wallets reviewed: ${reviews.length}
- Filter basis: positive 3M PnL, 500-3,000 closed positions, win rate >= 80%, max drawdown < 15%
- Extra review data: HyperCopy trader detail, current open positions, latest 20 trade records where available

## Bucket Counts

- Watch: ${bucketCounts.watch ?? 0}
- Monitor: ${bucketCounts.monitor ?? 0}
- Risk monitor: ${bucketCounts.risk_monitor ?? 0}
- Exclude or low priority: ${bucketCounts.exclude_or_low_priority ?? 0}

${section("watch", "Watch Candidates")}

${section("monitor", "Monitor Candidates")}

${section("risk_monitor", "Risk-Monitor Only")}

${section("exclude_or_low_priority", "Exclude Or Low Priority")}

## Operator Read

The 28-wallet stats pass is still too broad for productized alerts. The high-value list is the watch plus monitor buckets, then each wallet needs one final manual check in HyperCopy before being added to an alert cohort. Wallets with ugly current open losses are still valuable, but only as liquidation/risk intelligence, not as follow-the-trader signals.
`;

await writeFile(csvPath, `${csvRows}\n`);
await writeFile(summaryPath, summary);

console.log(JSON.stringify({
  reviewed: reviews.length,
  bucketCounts,
  csvPath,
  summaryPath,
}, null, 2));
