import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const viablePath = resolve("launch", "hl-intel-viable-wallet-deep-review.csv");
const asymmetricPath = resolve("launch", "hl-intel-asymmetric-watch-review.csv");
const csvPath = resolve("launch", "hl-intel-wallet-behavior-metrics.csv");
const reportPath = resolve("launch", "hl-intel-wallet-behavior-metrics.md");

const dayMs = 24 * 60 * 60 * 1000;
const returnDenominatorFloor = 1_000;
const idleBucketThresholdUsd = 1;

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
          "user-agent": "HL Intel wallet behavior metrics",
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

function round(value, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function pct(value, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "n/a";
  return `${Number(value).toFixed(digits)}%`;
}

function money(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "n/a";
  return `$${Math.round(value).toLocaleString()}`;
}

function priorityRank(priority) {
  return { A: 0, B: 1, C: 2 }[priority] ?? 3;
}

function tierRank(tier) {
  return {
    elite_behavior: 0,
    strong_behavior: 1,
    asymmetric_behavior: 2,
    grinder_behavior: 3,
    inactive_watch: 4,
    risk_watch: 5,
    high_risk_behavior: 6,
    low_pnl_unproven: 7,
    incomplete_data: 8,
    fetch_error: 9,
  }[tier] ?? 10;
}

function normalizePoints(payload) {
  const rawPoints = Array.isArray(payload?.data) ? payload.data : [];
  const points = rawPoints
    .map((point, index, arr) => {
      const timestamp = Number(point.timestamp);
      const pnl = Number(point.pnl);
      const previousPnl = index > 0 ? Number(arr[index - 1]?.pnl) : 0;
      const bucketPnl = Number.isFinite(Number(point.bucket_pnl))
        ? Number(point.bucket_pnl)
        : pnl - previousPnl;
      return { timestamp, pnl, bucketPnl };
    })
    .filter((point) => (
      Number.isFinite(point.timestamp) &&
      Number.isFinite(point.pnl) &&
      Number.isFinite(point.bucketPnl)
    ))
    .sort((a, b) => a.timestamp - b.timestamp);

  return points.map((point, index) => {
    if (index === 0) return point;
    const previous = points[index - 1];
    if (point.bucketPnl !== 0) return point;
    return { ...point, bucketPnl: point.pnl - previous.pnl };
  });
}

function pointsWithinDays(points, days) {
  if (!points.length) return [];
  const latestTimestamp = points.at(-1).timestamp;
  const floor = latestTimestamp - days * dayMs;
  return points.filter((point) => point.timestamp >= floor);
}

function guardedReturns(points) {
  const returns = [];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const denominator = Math.max(Math.abs(previous.pnl), returnDenominatorFloor);
    returns.push({
      timestamp: current.timestamp,
      value: current.bucketPnl / denominator,
      bucketPnl: current.bucketPnl,
    });
  }
  return returns;
}

function mean(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleStdDev(values) {
  if (values.length < 2) return null;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function sortinoRatio(returns) {
  if (!returns.length) return null;
  const values = returns.map((entry) => entry.value);
  const avg = mean(values);
  const downside = values.filter((value) => value < 0);
  if (avg === null) return null;
  if (!downside.length) return avg > 0 ? 9.99 : null;
  const downsideStdDev = sampleStdDev(downside);
  if (!downsideStdDev || downsideStdDev === 0) return avg > 0 ? 9.99 : 0;
  return (avg / downsideStdDev) * Math.sqrt(Math.min(30, values.length));
}

function drawdownStats(points) {
  let peak = -Infinity;
  let trough = Infinity;
  let maxDrawdownPct = 0;
  let maxDrawdownUsd = 0;

  for (const point of points) {
    if (point.pnl > peak) peak = point.pnl;
    if (point.pnl < trough) trough = point.pnl;
    if (peak < returnDenominatorFloor) continue;

    const drawdownUsd = Math.max(0, peak - point.pnl);
    const drawdownPct = (drawdownUsd / peak) * 100;
    if (drawdownPct > maxDrawdownPct) {
      maxDrawdownPct = drawdownPct;
      maxDrawdownUsd = drawdownUsd;
    }
  }

  const latestPnl = points.at(-1)?.pnl ?? null;
  const recoveryRatio = maxDrawdownUsd > 0 && latestPnl !== null
    ? latestPnl / maxDrawdownUsd
    : null;

  return {
    maxDrawdownPct,
    maxDrawdownUsd,
    recoveryRatio,
    peak: peak === -Infinity ? null : peak,
    trough: trough === Infinity ? null : trough,
  };
}

function consistency(points) {
  if (!points.length) return null;
  const positive = points.filter((point) => point.bucketPnl > 0).length;
  return (positive / points.length) * 100;
}

function trailingIdleBuckets(points) {
  let idle = 0;
  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (Math.abs(points[index].bucketPnl) > idleBucketThresholdUsd) break;
    idle += 1;
  }
  return idle;
}

function latestGapDays(points) {
  if (points.length < 2) return 0;
  const gap = Math.round((points.at(-1).timestamp - points.at(-2).timestamp) / dayMs) - 1;
  return Math.max(0, gap);
}

function crash24h(points) {
  if (points.length < 2) return null;
  const latestTimestamp = points.at(-1).timestamp;
  const recent = points.filter((point) => point.timestamp >= latestTimestamp - 2 * dayMs);
  if (recent.length < 2) return null;
  const peak = Math.max(...recent.map((point) => point.pnl));
  const latest = recent.at(-1).pnl;
  if (peak <= 0) return null;
  return Math.max(0, (1 - latest / peak) * 100);
}

function dataQuality(points, observations30d) {
  if (points.length < 7) return "incomplete_lt_7_points";
  if (observations30d < 7) return "sparse_recent_curve";
  if (points.length < 15) return "usable_but_sparse";
  return "usable";
}

function classifyBehavior(row) {
  const reasons = [];
  const winRate = numberOrNull(row.source_win_rate);
  const latestPnl = numberOrNull(row.pnl_curve_latest);
  const sortino = numberOrNull(row.sortino_30d);
  const mdd30 = numberOrNull(row.mdd_30d_pct);
  const consistency30 = numberOrNull(row.consistency_30d_pct);
  const peakDd60 = numberOrNull(row.peak_dd_60d_pct);
  const crash = numberOrNull(row.crash_24h_pct);
  const idle = numberOrNull(row.idle_buckets);
  const observations30 = numberOrNull(row.observations_30d);
  const isAsymmetricSource = row.source_type.includes("asymmetric") || (winRate !== null && winRate < 80);

  if (row.data_quality === "incomplete_lt_7_points") {
    return { tier: "incomplete_data", reason: "Less than 7 PnL curve points available." };
  }

  if (latestPnl !== null && latestPnl <= 1_000) {
    return { tier: "low_pnl_unproven", reason: "Latest PnL curve is non-positive or too small for reliable behavior scoring." };
  }

  if (sortino !== null && sortino <= 0) reasons.push("Sortino <= 0");
  if (mdd30 !== null && mdd30 >= 50) reasons.push("30D MDD >= 50%");
  if (peakDd60 !== null && peakDd60 >= 50) reasons.push("60D peak drawdown >= 50%");
  if (reasons.length) return { tier: "high_risk_behavior", reason: reasons.join("; ") };

  if ((crash !== null && crash >= 30) || (mdd30 !== null && mdd30 > 35) || (peakDd60 !== null && peakDd60 > 40)) {
    return { tier: "risk_watch", reason: "Recent crash or drawdown is too large for clean signal use." };
  }

  if (idle !== null && idle >= 14) {
    return { tier: "inactive_watch", reason: "Long trailing idle sequence on the PnL curve." };
  }

  const cleanDrawdown = (mdd30 ?? 0) <= 15 && (peakDd60 ?? 0) <= 30;
  const okayDrawdown = (mdd30 ?? 0) <= 25 && (peakDd60 ?? 0) <= 40;
  const grinderDrawdown = (mdd30 ?? 0) <= 35 && (peakDd60 ?? 0) <= 40;
  const enoughRecent = (observations30 ?? 0) >= 7;

  if (isAsymmetricSource && sortino !== null && sortino >= 0.3 && grinderDrawdown && latestPnl > 0) {
    if (sortino >= 1.5 && cleanDrawdown && consistency30 >= 45) {
      return { tier: "asymmetric_behavior", reason: "Lower win-rate/payoff-style wallet with strong guarded PnL curve behavior." };
    }
    return { tier: "asymmetric_behavior", reason: "Lower win-rate wallet still shows positive curve behavior and controlled drawdown." };
  }

  if (enoughRecent && sortino !== null && sortino >= 1.5 && cleanDrawdown && consistency30 >= 55) {
    return { tier: "elite_behavior", reason: "Strong Sortino, controlled drawdown, and high profitable-bucket consistency." };
  }

  if (sortino !== null && sortino >= 0.8 && okayDrawdown && consistency30 >= 45) {
    return { tier: "strong_behavior", reason: "Good Sortino with acceptable drawdown and consistency." };
  }

  if (sortino !== null && sortino >= 0.3 && grinderDrawdown && consistency30 >= 35) {
    return { tier: "grinder_behavior", reason: "Positive behavior profile, but not clean enough for top-tier labeling." };
  }

  return { tier: "risk_watch", reason: "Metrics are not bad enough to kill, but curve quality is not yet strong." };
}

function buildSourceRows(viableRows, asymmetricRows) {
  const wallets = new Map();

  function upsert(address, source) {
    const current = wallets.get(address);
    if (!current) {
      wallets.set(address, {
        address,
        priority: source.priority,
        source_type: source.source_type,
        source_lane: source.source_lane,
        source_verdict: source.source_verdict,
        source_total_pnl: source.total_pnl,
        source_roi: source.roi,
        source_win_rate: source.win_rate,
        source_max_drawdown_pct: source.max_drawdown_pct,
        source_closed_positions: source.closed_positions,
      });
      return;
    }

    current.priority = priorityRank(source.priority) < priorityRank(current.priority)
      ? source.priority
      : current.priority;
    current.source_type = [...new Set(`${current.source_type}; ${source.source_type}`.split("; ").filter(Boolean))].join("; ");
    current.source_lane = [...new Set(`${current.source_lane}; ${source.source_lane}`.split("; ").filter(Boolean))].join("; ");
    current.source_verdict = [...new Set(`${current.source_verdict}; ${source.source_verdict}`.split("; ").filter(Boolean))].join("; ");
  }

  for (const row of viableRows) {
    upsert(row.address, {
      ...row,
      source_type: "strict_viable",
      source_lane: row.alert_lane,
      source_verdict: row.product_bucket,
    });
  }

  for (const row of asymmetricRows) {
    upsert(row.address, {
      ...row,
      source_type: "asymmetric_watch",
      source_lane: row.lane,
      source_verdict: row.verdict,
    });
  }

  return [...wallets.values()];
}

async function scoreWallet(wallet) {
  const payload = await getJson(`https://hypercopy.app/api/trader/${wallet.address}/pnl-chart?period=3M`);
  const points = normalizePoints(payload);
  const window30 = pointsWithinDays(points, 30);
  const window60 = pointsWithinDays(points, 60);
  const returns30 = guardedReturns(window30);
  const mdd30 = drawdownStats(window30);
  const mdd60 = drawdownStats(window60);
  const latest = points.at(-1) ?? null;
  const first = points[0] ?? null;
  const daysAvailable = first && latest
    ? Math.max(1, Math.round((latest.timestamp - first.timestamp) / dayMs) + 1)
    : 0;
  const quality = dataQuality(points, window30.length);
  const sourcePnl = numberOrNull(wallet.source_total_pnl);
  const pnlSourceDelta = latest && sourcePnl !== null ? latest.pnl - sourcePnl : null;
  const pnlSourceRatio = latest && sourcePnl ? latest.pnl / sourcePnl : null;
  const sourceConflictFlag = latest && sourcePnl !== null && (
    Math.sign(latest.pnl) !== Math.sign(sourcePnl) ||
    Math.abs(pnlSourceDelta) > Math.max(50_000, Math.abs(sourcePnl) * 0.5)
  )
    ? "review_pnl_source_mismatch"
    : "";

  const row = {
    ...wallet,
    pnl_chart_period: payload.period ?? "3M",
    observations_total: points.length,
    days_available: daysAvailable,
    observations_30d: window30.length,
    observations_60d: window60.length,
    pnl_curve_latest: round(latest?.pnl ?? null, 2),
    pnl_curve_vs_source_delta: round(pnlSourceDelta, 2),
    pnl_curve_source_ratio: round(pnlSourceRatio, 3),
    source_conflict_flag: sourceConflictFlag,
    pnl_curve_peak_60d: round(mdd60.peak, 2),
    pnl_curve_trough_60d: round(mdd60.trough, 2),
    guarded_return_mean_30d_pct: round((mean(returns30.map((entry) => entry.value)) ?? 0) * 100, 3),
    sortino_30d: round(sortinoRatio(returns30), 2),
    mdd_30d_pct: round(mdd30.maxDrawdownPct, 2),
    mdd_30d_usd: round(mdd30.maxDrawdownUsd, 2),
    consistency_30d_pct: round(consistency(window30), 1),
    recovery_30d: round(mdd30.recoveryRatio, 2),
    peak_dd_60d_pct: round(mdd60.maxDrawdownPct, 2),
    peak_dd_60d_usd: round(mdd60.maxDrawdownUsd, 2),
    idle_buckets: trailingIdleBuckets(points),
    latest_bucket_gap_days: latestGapDays(points),
    crash_24h_pct: round(crash24h(points), 2),
    data_quality: quality,
    metric_note: "Guarded PnL-curve returns use bucket_pnl / max(abs(previous cumulative PnL), 1000).",
  };

  const classification = classifyBehavior(row);
  return {
    ...row,
    behavior_tier: classification.tier,
    tier_reason: classification.reason,
  };
}

const viableRows = parseCsv(await readFile(viablePath, "utf8"));
const asymmetricRows = parseCsv(await readFile(asymmetricPath, "utf8"));
const sourceRows = buildSourceRows(viableRows, asymmetricRows);
const results = [];

for (const wallet of sourceRows) {
  try {
    results.push(await scoreWallet(wallet));
  } catch (error) {
    results.push({
      ...wallet,
      behavior_tier: "fetch_error",
      tier_reason: error.message,
      data_quality: "fetch_error",
    });
  }
}

results.sort((a, b) => (
  tierRank(a.behavior_tier) - tierRank(b.behavior_tier) ||
  priorityRank(a.priority) - priorityRank(b.priority) ||
  Number(b.pnl_curve_latest ?? b.source_total_pnl ?? 0) - Number(a.pnl_curve_latest ?? a.source_total_pnl ?? 0)
));

const headers = [
  "priority",
  "behavior_tier",
  "address",
  "source_type",
  "source_lane",
  "source_verdict",
  "source_total_pnl",
  "source_roi",
  "source_win_rate",
  "source_max_drawdown_pct",
  "source_closed_positions",
  "pnl_chart_period",
  "observations_total",
  "days_available",
  "observations_30d",
  "observations_60d",
  "pnl_curve_latest",
  "pnl_curve_vs_source_delta",
  "pnl_curve_source_ratio",
  "source_conflict_flag",
  "guarded_return_mean_30d_pct",
  "sortino_30d",
  "mdd_30d_pct",
  "mdd_30d_usd",
  "consistency_30d_pct",
  "recovery_30d",
  "peak_dd_60d_pct",
  "peak_dd_60d_usd",
  "idle_buckets",
  "latest_bucket_gap_days",
  "crash_24h_pct",
  "data_quality",
  "tier_reason",
  "metric_note",
];

await writeFile(
  csvPath,
  `${headers.join(",")}\n${results.map((row) => headers.map((header) => csv(row[header])).join(",")).join("\n")}\n`,
);

const counts = results.reduce((acc, row) => {
  acc[row.behavior_tier] = (acc[row.behavior_tier] ?? 0) + 1;
  return acc;
}, {});

function reportRows(rows) {
  if (!rows.length) return "None.";
  return rows.map((row, index) => (
    `${index + 1}. \`${row.address}\` — ${row.priority}/${row.behavior_tier}; ` +
    `PnL curve ${money(Number(row.pnl_curve_latest))}; Sortino ${row.sortino_30d ?? "n/a"}; ` +
    `30D MDD ${pct(row.mdd_30d_pct)}; consistency ${pct(row.consistency_30d_pct)}. ` +
    `${row.tier_reason}`
  )).join("\n");
}

const report = `# HL Intel Wallet Behavior Metrics

Generated: ${new Date().toISOString()}

## Method

This adds a Yonathan-style behavior layer to the existing HL Intel wallet candidates.

Inputs:
- \`hl-intel-viable-wallet-deep-review.csv\`
- \`hl-intel-asymmetric-watch-review.csv\`

Data source:
- HyperCopy \`/api/trader/{address}/pnl-chart?period=3M\`

Metrics:
- Guarded 30D PnL-curve returns.
- 30D Sortino.
- 30D max drawdown.
- 30D profitable-bucket consistency.
- 30D recovery ratio.
- 60D peak drawdown.
- Idle bucket count.
- Recent 24h/2-bucket crash check.

Important caveat:
- This uses cumulative PnL-curve data, not full equity-curve data. Returns are guarded with a $${returnDenominatorFloor.toLocaleString()} denominator floor to avoid near-zero PnL distortion.
- HyperCopy often returns sparse daily buckets, so \`data_quality\` matters.
- \`source_conflict_flag\` is set when the PnL curve materially disagrees with the screener/review total PnL. Treat those wallets as data-review candidates before productizing alerts.

## Tier Counts

${Object.entries(counts).sort((a, b) => tierRank(a[0]) - tierRank(b[0])).map(([tier, count]) => `- ${tier}: ${count}`).join("\n")}

## Best Current Behavior Candidates

${reportRows(results.filter((row) => ["elite_behavior", "strong_behavior", "asymmetric_behavior"].includes(row.behavior_tier)).slice(0, 12))}

## Watch / Risk Candidates

${reportRows(results.filter((row) => ["grinder_behavior", "inactive_watch", "risk_watch", "high_risk_behavior"].includes(row.behavior_tier)).slice(0, 12))}

## Full Table

| Tier | Pri | Address | Source | PnL Curve | Sortino | 30D MDD | Consistency | Data |
|---|---:|---|---|---:|---:|---:|---:|---|
${results.map((row) => (
  `| ${row.behavior_tier} | ${row.priority} | \`${row.address}\` | ${row.source_type}${row.source_conflict_flag ? " / source mismatch" : ""} | ${money(Number(row.pnl_curve_latest))} | ${row.sortino_30d ?? "n/a"} | ${pct(row.mdd_30d_pct)} | ${pct(row.consistency_30d_pct)} | ${row.data_quality} |`
)).join("\n")}
`;

await writeFile(reportPath, report);

console.log(`Wrote ${csvPath}`);
console.log(`Wrote ${reportPath}`);
console.log(`Scored ${results.length} wallets`);
