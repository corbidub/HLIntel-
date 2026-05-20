import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const reviewPath = resolve("launch", "hypercopy-28-wallet-review.csv");
const csvPath = resolve("launch", "hl-intel-wallet-cohort-v1.csv");
const summaryPath = resolve("launch", "hl-intel-wallet-cohort-v1.md");

const productOverrides = new Map([
  [
    "0x69cc3ae720efdff1cd2a8edec79a7a3fac6e14fd",
    {
      product_bucket: "risk_watch",
      alert_lane: "large_underwater_open_book",
      operator_note:
        "Previous pass called this monitor, but the HYPE short is more than $1M underwater. Do not present as smart-money signal until behavior improves.",
    },
  ],
  [
    "0xee2549522a965522877497578d6f135084f2994a",
    {
      product_bucket: "reactivation_watch",
      alert_lane: "clean_wallet_reactivation",
      operator_note:
        "Stats are clean but edge is low and recent visible activity is light. Alert only on meaningful reactivation.",
    },
  ],
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
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
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
          "user-agent": "HL Intel local cohort builder",
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
  return `${position.symbol} ${direction} ${money(position.upnl)}`;
}

function inferProductBucket(row, positions) {
  const address = row.address.toLowerCase();
  const override = productOverrides.get(address);
  if (override) return override;

  const score = Number(row.score);
  const totalPnl = Number(row.total_pnl);
  const roi = Number(row.roi);
  const openCount = positions.length;
  const negativeUpnl = positions.reduce((sum, position) => sum + Math.min(0, Number(position.upnl ?? 0)), 0);
  const totalUpnl = positions.reduce((sum, position) => sum + Number(position.upnl ?? 0), 0);
  const hasMajorOpenLoss = negativeUpnl <= -25000;
  const hasReadableOpenBook = openCount > 0 && openCount <= 4;
  const hasNoOpenBook = openCount === 0;

  if (hasMajorOpenLoss) {
    return {
      product_bucket: "risk_watch",
      alert_lane: "underwater_open_book",
      operator_note:
        "Useful for liquidation/risk intelligence, but do not frame as follow-the-wallet signal.",
    };
  }

  if (hasNoOpenBook && score >= 70 && totalPnl >= 100000) {
    return {
      product_bucket: "core_watch",
      alert_lane: "clean_wallet_reactivation",
      operator_note:
        "Clean historical profile. Best use is alerting when the wallet opens fresh meaningful exposure.",
    };
  }

  if (hasNoOpenBook) {
    return {
      product_bucket: "reactivation_watch",
      alert_lane: "clean_wallet_reactivation",
      operator_note:
        "Clean enough to track, but only valuable if it reactivates with meaningful size.",
    };
  }

  if (hasReadableOpenBook && score >= 50 && totalPnl >= 50000 && roi >= 10) {
    return {
      product_bucket: "active_monitor",
      alert_lane: totalUpnl > 50000 ? "profitable_open_book_unwind" : "position_change_monitor",
      operator_note:
        "Readable active book. Monitor adds, trims, flips, and full exits before promoting to core watch.",
    };
  }

  return {
    product_bucket: "hold",
    alert_lane: "low_priority_observation",
    operator_note:
      "Keep in the dataset, but do not spend scarce manual attention until behavior improves.",
  };
}

const rows = parseCsv(await readFile(reviewPath, "utf8"));
const candidates = rows.filter((row) => row.bucket === "watch" || row.bucket === "monitor");
const cohortRows = [];

for (const row of candidates) {
  const positions = await getJson(`https://hypercopy.app/api/trader/${row.address}/positions`);
  const trader = await getJson(`https://hypercopy.app/api/trader/${row.address}`);
  const product = inferProductBucket(row, positions);
  const totalOpenUpnl = positions.reduce((sum, position) => sum + Number(position.upnl ?? 0), 0);
  const negativeOpenUpnl = positions.reduce((sum, position) => sum + Math.min(0, Number(position.upnl ?? 0)), 0);
  const topPositions = positions
    .slice()
    .sort((a, b) => Math.abs(Number(b.upnl ?? 0)) - Math.abs(Number(a.upnl ?? 0)))
    .slice(0, 6)
    .map(compactPosition);

  cohortRows.push({
    ...row,
    ...product,
    live_open_positions: positions.length,
    live_total_open_upnl: totalOpenUpnl,
    live_negative_open_upnl: negativeOpenUpnl,
    live_positions: topPositions,
    account_value: trader.account?.total_value ?? row.account_total_value,
    leverage_ratio: trader.account?.leverage_ratio ?? row.leverage_ratio,
    last_active_at: trader.last_active_at ?? row.latest_trade_at,
  });
}

const bucketOrder = {
  core_watch: 0,
  active_monitor: 1,
  reactivation_watch: 2,
  risk_watch: 3,
  hold: 4,
};

cohortRows.sort((a, b) => {
  return (bucketOrder[a.product_bucket] - bucketOrder[b.product_bucket]) || Number(b.score) - Number(a.score);
});

const headers = [
  "product_bucket",
  "alert_lane",
  "score",
  "address",
  "source_bucket",
  "total_pnl",
  "roi",
  "win_rate",
  "max_drawdown_pct",
  "closed_positions",
  "live_open_positions",
  "live_total_open_upnl",
  "live_negative_open_upnl",
  "account_value",
  "leverage_ratio",
  "last_active_at",
  "live_positions",
  "operator_note",
];

const csvRows = [
  headers.join(","),
  ...cohortRows.map((row) => [
    row.product_bucket,
    row.alert_lane,
    row.score,
    row.address,
    row.bucket,
    row.total_pnl,
    row.roi,
    row.win_rate,
    row.max_drawdown_pct,
    row.closed_positions,
    row.live_open_positions,
    row.live_total_open_upnl,
    row.live_negative_open_upnl,
    row.account_value,
    row.leverage_ratio,
    row.last_active_at,
    row.live_positions,
    row.operator_note,
  ].map(csv).join(",")),
].join("\n");

function section(bucket, title) {
  const group = cohortRows.filter((row) => row.product_bucket === bucket);
  if (!group.length) return `## ${title}\n\nNone.\n`;

  return `## ${title}\n\n${group.map((row, index) => {
    const positions = row.live_positions.length ? row.live_positions.join("; ") : "no open positions";
    return `${index + 1}. \`${row.address}\` - ${row.alert_lane}, score ${row.score}, ${money(row.total_pnl)} 3M PnL, ROI ${pct(row.roi, 2)}, win ${pct(row.win_rate)}, DD ${pct(row.max_drawdown_pct)}, closed ${row.closed_positions}, live open ${row.live_open_positions}. ${row.operator_note} Positions: ${positions}.`;
  }).join("\n")}\n`;
}

const counts = cohortRows.reduce((acc, row) => {
  acc[row.product_bucket] = (acc[row.product_bucket] ?? 0) + 1;
  return acc;
}, {});

const summary = `# HL Intel Wallet Cohort v1

Local product research. No website changes.

This narrows the 28 HyperCopy stats-pass wallets into a practical HL Intel feed cohort. The goal is not to include every statistically interesting wallet. The goal is to identify wallets that can produce usable alerts without polluting the feed.

## Counts

- Total reviewed for cohort: ${cohortRows.length}
- Core watch: ${counts.core_watch ?? 0}
- Active monitor: ${counts.active_monitor ?? 0}
- Reactivation watch: ${counts.reactivation_watch ?? 0}
- Risk watch: ${counts.risk_watch ?? 0}
- Hold: ${counts.hold ?? 0}

${section("core_watch", "Core Watch")}

${section("active_monitor", "Active Monitor")}

${section("reactivation_watch", "Reactivation Watch")}

${section("risk_watch", "Risk Watch")}

${section("hold", "Hold")}

## Product Read

For the first paid pilot, do not market this as copy-trading. Market it as a curated Hyperliquid wallet intelligence feed with three lanes:

- Clean-wallet reactivation alerts
- Active position-change monitoring
- Large open-book risk/liquidation monitoring

The core feed should start with core watch plus active monitor only. Risk watch can become a separate board or occasional alert lane, but it should not be mixed into smart-wallet signal quality.
`;

await writeFile(csvPath, `${csvRows}\n`);
await writeFile(summaryPath, summary);

console.log(JSON.stringify({
  total: cohortRows.length,
  counts,
  csvPath,
  summaryPath,
}, null, 2));
