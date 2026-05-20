import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const cohortPath = resolve("launch", "hl-intel-wallet-cohort-v1.csv");
const csvPath = resolve("launch", "hl-intel-viable-wallet-deep-review.csv");
const summaryPath = resolve("launch", "hl-intel-viable-wallet-deep-review.md");

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
          "user-agent": "HL Intel viable wallet review",
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
  const direction = position.side === "short" ? "S" : "L";
  return `${position.symbol} ${direction} ${money(position.upnl)} liq ${position.liquidation_price ?? "n/a"}`;
}

function compactTrade(trade) {
  const action = trade.action ? `${trade.action} ` : "";
  const side = trade.side ? `${trade.side} ` : "";
  return `${trade.executed_at?.slice(0, 10) ?? "n/a"} ${action}${side}${trade.symbol} ${money(trade.notional_usd)} @ ${trade.price}`;
}

function daysSince(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

function symbolCounts(trades) {
  const counts = new Map();
  for (const trade of trades) {
    if (!trade.symbol) continue;
    counts.set(trade.symbol, (counts.get(trade.symbol) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([symbol, count]) => `${symbol} (${count})`);
}

function inferAlertPolicy(row, positions, trades, trader) {
  const bucket = row.product_bucket;
  const latestTradeAt = trades[0]?.executed_at ?? trader.last_active_at ?? row.last_active_at;
  const recentAge = daysSince(latestTradeAt);
  const positionNotional = positions.reduce((sum, position) => {
    return sum + Math.abs(Number(position.size ?? 0) * Number(position.mark_price ?? 0));
  }, 0);
  const totalUpnl = positions.reduce((sum, position) => sum + Number(position.upnl ?? 0), 0);
  const worstPosition = positions
    .slice()
    .sort((a, b) => Number(a.upnl ?? 0) - Number(b.upnl ?? 0))[0];

  if (bucket === "core_watch") {
    return {
      priority: "A",
      alert_policy:
        "Alert only on new position open, major add, or fresh directional exposure after inactivity.",
      manual_check:
        "Confirm last closed-trade behavior before adding live alerts; avoid firing on dust/maintenance fills.",
      kill_condition:
        "Remove from core if next active sequence shows martingale averaging, huge leverage, or noisy micro-fills.",
    };
  }

  if (row.alert_lane === "profitable_open_book_unwind") {
    return {
      priority: "A",
      alert_policy:
        "Alert on trim, full exit, flip, or material add because wallet is sitting on meaningful open profit.",
      manual_check:
        "Watch BTC short closely; unwind/flip can be a useful market context alert.",
      kill_condition:
        "Downgrade if wallet starts adding into large adverse move or open PnL collapses without risk control.",
    };
  }

  if (positions.length === 1 && Math.abs(totalUpnl) < Math.max(15_000, Number(row.total_pnl) * 0.05)) {
    return {
      priority: "B",
      alert_policy:
        "Alert on size expansion, direction flip, full close, or new second asset. Ignore small PnL drift.",
      manual_check:
        "Useful because the book is simple and readable; do not over-alert while position size is stable.",
      kill_condition:
        "Downgrade if wallet opens many unrelated assets or starts carrying large underwater exposure.",
    };
  }

  return {
    priority: "B",
    alert_policy:
      "Alert on position change only; suppress passive mark-price movement and low-notional activity.",
    manual_check: `Current worst position: ${worstPosition ? compactPosition(worstPosition) : "none"}.`,
    kill_condition:
      "Downgrade if open book becomes noisy, overlevered, or materially underwater.",
  };
}

const cohortRows = parseCsv(await readFile(cohortPath, "utf8"));
const viableRows = cohortRows.filter((row) => {
  return row.product_bucket === "core_watch" || row.product_bucket === "active_monitor";
});

const reviews = [];

for (const row of viableRows) {
  const address = row.address;
  const [trader, positions, tradesPayload] = await Promise.all([
    getJson(`https://hypercopy.app/api/trader/${address}`),
    getJson(`https://hypercopy.app/api/trader/${address}/positions`),
    getJson(`https://hypercopy.app/api/trader/${address}/trades?page=1&per_page=30`),
  ]);
  const trades = tradesPayload.trades ?? [];
  const policy = inferAlertPolicy(row, positions, trades, trader);
  const latestTradeAt = trades[0]?.executed_at ?? trader.last_active_at ?? row.last_active_at;
  const totalOpenUpnl = positions.reduce((sum, position) => sum + Number(position.upnl ?? 0), 0);
  const grossNotional = positions.reduce((sum, position) => {
    return sum + Math.abs(Number(position.size ?? 0) * Number(position.mark_price ?? 0));
  }, 0);

  reviews.push({
    ...row,
    ...policy,
    latest_trade_at: latestTradeAt,
    days_since_latest_trade: daysSince(latestTradeAt),
    account_value: trader.account?.total_value ?? row.account_value,
    leverage_ratio: trader.account?.leverage_ratio ?? row.leverage_ratio,
    open_count: positions.length,
    total_open_upnl: totalOpenUpnl,
    gross_open_notional: grossNotional,
    positions: positions
      .slice()
      .sort((a, b) => Math.abs(Number(b.upnl ?? 0)) - Math.abs(Number(a.upnl ?? 0)))
      .slice(0, 8)
      .map(compactPosition),
    recent_symbols: symbolCounts(trades),
    recent_trades: trades.slice(0, 5).map(compactTrade),
  });
}

const order = { A: 0, B: 1, C: 2 };
reviews.sort((a, b) => {
  return (order[a.priority] - order[b.priority]) || Number(b.score) - Number(a.score);
});

const headers = [
  "priority",
  "product_bucket",
  "alert_lane",
  "address",
  "score",
  "total_pnl",
  "roi",
  "win_rate",
  "max_drawdown_pct",
  "closed_positions",
  "open_count",
  "total_open_upnl",
  "gross_open_notional",
  "account_value",
  "leverage_ratio",
  "latest_trade_at",
  "days_since_latest_trade",
  "positions",
  "recent_symbols",
  "alert_policy",
  "manual_check",
  "kill_condition",
];

const csvRows = [
  headers.join(","),
  ...reviews.map((row) => [
    row.priority,
    row.product_bucket,
    row.alert_lane,
    row.address,
    row.score,
    row.total_pnl,
    row.roi,
    row.win_rate,
    row.max_drawdown_pct,
    row.closed_positions,
    row.open_count,
    row.total_open_upnl,
    row.gross_open_notional,
    row.account_value,
    row.leverage_ratio,
    row.latest_trade_at,
    row.days_since_latest_trade,
    row.positions,
    row.recent_symbols,
    row.alert_policy,
    row.manual_check,
    row.kill_condition,
  ].map(csv).join(",")),
].join("\n");

const summary = `# HL Intel Viable Wallet Deep Review

Local product research. No website changes.

This reviews the 7 wallets that can reasonably support the first pilot feed: core-watch wallets plus active monitors.

## Priority A

${reviews.filter((row) => row.priority === "A").map((row, index) => {
  const positions = row.positions.length ? row.positions.join("; ") : "no open positions";
  return `${index + 1}. \`${row.address}\` - ${row.product_bucket}/${row.alert_lane}. Score ${row.score}. ${money(row.total_pnl)} 3M PnL, ROI ${pct(row.roi, 2)}, win ${pct(row.win_rate)}, DD ${pct(row.max_drawdown_pct)}, closed ${row.closed_positions}. Open: ${positions}. Policy: ${row.alert_policy}`;
}).join("\n")}

## Priority B

${reviews.filter((row) => row.priority === "B").map((row, index) => {
  const positions = row.positions.length ? row.positions.join("; ") : "no open positions";
  return `${index + 1}. \`${row.address}\` - ${row.product_bucket}/${row.alert_lane}. Score ${row.score}. ${money(row.total_pnl)} 3M PnL, ROI ${pct(row.roi, 2)}, win ${pct(row.win_rate)}, DD ${pct(row.max_drawdown_pct)}, closed ${row.closed_positions}. Open: ${positions}. Policy: ${row.alert_policy}`;
}).join("\n") || "None."}

## Wallet Notes

${reviews.map((row) => {
  const positions = row.positions.length ? row.positions.join("; ") : "no open positions";
  const trades = row.recent_trades.length ? row.recent_trades.join("; ") : "no recent trades returned";
  const symbols = row.recent_symbols.length ? row.recent_symbols.join(", ") : "none";
  return `### ${row.address}

- Priority: ${row.priority}
- Lane: ${row.product_bucket} / ${row.alert_lane}
- Current positions: ${positions}
- Recent symbols: ${symbols}
- Latest trade age: ${row.days_since_latest_trade ?? "n/a"} days
- Recent trades: ${trades}
- Alert policy: ${row.alert_policy}
- Manual check: ${row.manual_check}
- Kill condition: ${row.kill_condition}`;
}).join("\n\n")}

## Pilot Feed Rule

Start with Priority A only if you want fewer but cleaner alerts. Add Priority B if the pilot users explicitly want more live wallet movement. Suppress passive PnL movement; only alert on opens, adds, trims, exits, flips, or liquidation-risk changes.
`;

await writeFile(csvPath, `${csvRows}\n`);
await writeFile(summaryPath, summary);

console.log(JSON.stringify({
  reviewed: reviews.length,
  priorityA: reviews.filter((row) => row.priority === "A").length,
  priorityB: reviews.filter((row) => row.priority === "B").length,
  csvPath,
  summaryPath,
}, null, 2));
