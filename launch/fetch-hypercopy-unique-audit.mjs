import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const outputDir = resolve("launch");
const csvPath = resolve(outputDir, "hypercopy-unique-audit.csv");
const summaryPath = resolve(outputDir, "hypercopy-unique-audit-summary.md");

const baseUrl = "https://hypercopy.app/api/screener/traders";
const query = new URLSearchParams({
  page: "1",
  per_page: "100",
  sort_by: "total_pnl",
  sort_order: "desc",
  period: "3M",
});

for (const style of ["Cons. Hi-Freq", "Asymmetric Pro", "Aggr. Low-Freq"]) {
  query.append("trading_style", style);
}

const minClosedPositions = 500;
const maxClosedPositions = 3000;
const minWinRate = 80;
const maxDrawdown = 15;

function urlForPage(page) {
  const pageQuery = new URLSearchParams(query);
  pageQuery.set("page", String(page));
  return `${baseUrl}?${pageQuery.toString()}`;
}

async function fetchJson(page) {
  const response = await fetch(urlForPage(page), {
    headers: {
      accept: "application/json",
      "user-agent": "HL Intel local research audit",
    },
  });

  if (!response.ok) {
    throw new Error(`HyperCopy API request failed on page ${page}: ${response.status}`);
  }

  return response.json();
}

function csv(value) {
  if (value === null || value === undefined) return "";
  const stringValue = Array.isArray(value) ? value.join("; ") : String(value);
  return /[",\n]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue;
}

function passReason(trader) {
  const stats = trader.stats ?? {};
  const reasons = [];

  if ((stats.total_pnl ?? 0) <= 0) reasons.push("non-positive 3M total PnL");
  if ((stats.closed_positions ?? 0) < minClosedPositions) reasons.push("below 500 closed positions");
  if ((stats.closed_positions ?? 0) > maxClosedPositions) reasons.push("above 3,000 closed positions");
  if ((stats.win_rate ?? 0) < minWinRate) reasons.push("below 80% win rate");
  if ((stats.max_drawdown ?? 0) >= maxDrawdown) reasons.push("drawdown >= 15%");

  return reasons.length ? reasons.join("; ") : "passes current first-pass stats filter";
}

function isStatsPass(trader) {
  const stats = trader.stats ?? {};
  return (
    (stats.total_pnl ?? 0) > 0 &&
    (stats.closed_positions ?? 0) >= minClosedPositions &&
    (stats.closed_positions ?? 0) <= maxClosedPositions &&
    (stats.win_rate ?? 0) >= minWinRate &&
    (stats.max_drawdown ?? 0) < maxDrawdown
  );
}

await mkdir(dirname(csvPath), { recursive: true });

const firstPage = await fetchJson(1);
const totalPages = firstPage.total_pages ?? 1;
const expectedTotal = firstPage.total ?? 0;
const pages = [firstPage];

for (let page = 2; page <= totalPages; page += 1) {
  pages.push(await fetchJson(page));
}

const rows = [];
const unique = new Map();
const duplicateRows = [];

for (const pageData of pages) {
  const traders = pageData.traders ?? [];
  traders.forEach((trader, index) => {
    const address = trader.address?.toLowerCase();
    const row = {
      ...trader,
      page: pageData.page,
      page_index: index + 1,
      global_row: rows.length + 1,
    };
    rows.push(row);

    if (!address) return;
    if (unique.has(address)) {
      duplicateRows.push(row);
      return;
    }
    unique.set(address, row);
  });
}

const uniqueRows = [...unique.values()];
const statsPassRows = uniqueRows.filter(isStatsPass);
const positiveRows = uniqueRows.filter((row) => (row.stats?.total_pnl ?? 0) > 0);

const headers = [
  "rank",
  "page",
  "page_index",
  "address",
  "short_address",
  "total_pnl",
  "roi",
  "win_rate",
  "max_drawdown_pct",
  "closed_positions",
  "trades_count",
  "open_positions_count",
  "account_total_value",
  "account_tier",
  "last_active_at",
  "first_seen_at",
  "labels",
  "stats_pass",
  "filter_reason",
];

const csvRows = [
  headers.join(","),
  ...uniqueRows.map((row, index) => {
    const stats = row.stats ?? {};
    return [
      index + 1,
      row.page,
      row.page_index,
      row.address,
      row.short_address,
      stats.total_pnl,
      stats.roi,
      stats.win_rate,
      stats.max_drawdown,
      stats.closed_positions,
      stats.trades_count,
      row.open_positions_count,
      row.account_total_value,
      row.account_tier,
      row.last_active_at,
      row.first_seen_at,
      row.labels,
      isStatsPass(row) ? "yes" : "no",
      passReason(row),
    ].map(csv).join(",");
  }),
].join("\n");

const duplicateRate = rows.length ? ((duplicateRows.length / rows.length) * 100).toFixed(2) : "0.00";
const verdict = duplicateRows.length === 0
  ? "The API result set is not inflating wallets by duplicate address for this filtered 3M query."
  : "The API result set contains duplicate wallet rows, so the visible total is partly inflated.";

const topStatsPass = statsPassRows.slice(0, 25).map((row, index) => {
  const stats = row.stats ?? {};
  return `${index + 1}. \`${row.address}\` - PnL $${Math.round(stats.total_pnl ?? 0).toLocaleString()}, ROI ${(stats.roi ?? 0).toFixed(2)}%, win ${(stats.win_rate ?? 0).toFixed(1)}%, drawdown ${(stats.max_drawdown ?? 0).toFixed(1)}%, closed positions ${stats.closed_positions ?? 0}, open positions ${row.open_positions_count ?? 0}`;
}).join("\n");

const duplicateSample = duplicateRows.slice(0, 20).map((row) => {
  return `- \`${row.address}\` duplicate at page ${row.page}, row ${row.page_index}`;
}).join("\n");

const summary = `# HyperCopy Unique Wallet Audit

Local research snapshot for HL Intel. No website changes.

## Query

- Source: HyperCopy screener API
- Period: 3M
- Sort: total PnL descending
- Trading styles: Cons. Hi-Freq, Asymmetric Pro, Aggr. Low-Freq
- Rows per page: 100
- Pages fetched: ${totalPages}

## Uniqueness Result

- HyperCopy reported total rows: ${expectedTotal}
- Rows fetched from API pages: ${rows.length}
- Unique full wallet addresses: ${uniqueRows.length}
- Duplicate wallet rows: ${duplicateRows.length}
- Duplicate row rate: ${duplicateRate}%

**Verdict:** ${verdict}

## First-Pass Filter Result

Current HL Intel stats filter:

- Positive 3M total PnL
- 500 to 3,000 closed positions over 3M
- Win rate at or above 80%
- Max drawdown below 15%

Counts:

- Positive-PnL unique wallets: ${positiveRows.length}
- Stats-pass unique wallets: ${statsPassRows.length}
- Stats-pass rate vs unique wallets: ${uniqueRows.length ? ((statsPassRows.length / uniqueRows.length) * 100).toFixed(2) : "0.00"}%

## Top Stats-Pass Wallets

${topStatsPass || "No wallets passed the current stats filter."}

## Duplicate Sample

${duplicateSample || "No duplicate wallet addresses found across fetched API pages."}

## Operator Read

The API count should be treated as a top-of-funnel universe, not a buyer-ready watchlist. The useful number for HL Intel is the stats-pass count, then the smaller manual-review count after open-position sanity checks.
`;

await writeFile(csvPath, `${csvRows}\n`);
await writeFile(summaryPath, summary);

console.log(JSON.stringify({
  expectedTotal,
  rowsFetched: rows.length,
  uniqueWallets: uniqueRows.length,
  duplicateRows: duplicateRows.length,
  duplicateRate,
  positiveRows: positiveRows.length,
  statsPassRows: statsPassRows.length,
  csvPath,
  summaryPath,
}, null, 2));
