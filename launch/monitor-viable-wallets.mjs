import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const reviewPath = resolve("launch", "hl-intel-viable-wallet-deep-review.csv");
const behaviorPath = resolve("launch", "hl-intel-wallet-behavior-metrics.csv");
const watchConfigPath = resolve("launch", "pilot-watchlist.local.json");
const statePath = resolve("launch", "state", "viable-wallet-monitor-snapshot.json");
const reportPath = resolve("launch", "viable-wallet-monitor-report.md");
const currentCsvPath = resolve("launch", "viable-wallet-monitor-current.csv");
const alertEventsPath = resolve("launch", "hl-intel-alert-events.json");
const alertFeedPath = resolve("launch", "hl-intel-alert-feed.md");
const currentDigestPath = resolve("launch", "hl-intel-current-digest.md");
const participantStatePath = resolve("launch", "hl-intel-market-participant-state.json");
const participantReadPath = resolve("launch", "hl-intel-market-participant-read.md");

const minSizeChangePct = 10;
const minNotionalChangeUsd = 25_000;
const minUpnlChangeUsd = 10_000;
const fetchRecentTrades = process.env.HL_INTEL_FETCH_RECENT_TRADES === "1";

async function readJsonIfExists(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(await readFile(path, "utf8"));
}

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

async function getJson(url, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          "user-agent": "HL Intel viable wallet monitor",
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

async function getJsonOrFallback(url, fallback) {
  try {
    return await getJson(url, 1);
  } catch (error) {
    console.warn(`Warning: using fallback for ${url}: ${error.message}`);
    return fallback;
  }
}

function money(value) {
  return `$${Math.round(Number(value ?? 0)).toLocaleString()}`;
}

function pct(value) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

function posKey(position) {
  return `${position.symbol}:${position.side}`;
}

function normalizePosition(position) {
  const size = Number(position.size ?? 0);
  const markPrice = Number(position.mark_price ?? 0);
  const entryPrice = Number(position.entry_price ?? 0);
  return {
    symbol: position.symbol,
    side: position.side,
    size,
    entry_price: entryPrice,
    mark_price: markPrice,
    notional_usd: Math.abs(size * markPrice),
    leverage: Number(position.leverage ?? 0),
    upnl: Number(position.upnl ?? 0),
    upnl_pct: Number(position.upnl_pct ?? 0),
    liquidation_price: position.liquidation_price,
    updated_at: position.updated_at,
  };
}

function compactPosition(position) {
  const direction = position.side === "short" ? "S" : "L";
  return `${position.symbol} ${direction} notional ${money(position.notional_usd)} uPnL ${money(position.upnl)} liq ${position.liquidation_price ?? "n/a"}`;
}

function shortWallet(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function titleWords(value) {
  return String(value || "")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function formatSignedMoney(value) {
  const number = Number(value ?? 0);
  if (number > 0) return `+${money(Math.abs(number))}`;
  if (number < 0) return `-${money(Math.abs(number))}`;
  return money(0);
}

function hoursSince(timestamp, generatedAt = new Date()) {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return (generatedAt.getTime() - date.getTime()) / 36e5;
}

function tokenRiskBucket(symbol) {
  const token = String(symbol || "").replace(/^xyz:/, "").toUpperCase();
  if (["PAXG", "USDC", "USDT", "STABLE"].includes(token)) return "defensive";
  if (["BTC", "ETH"].includes(token)) return "majors";
  if (["HYPE", "SOL", "ZEC", "PURR", "ENA", "LDO", "CRV", "BNB", "DOGE", "TAO"].includes(token)) return "high_beta";
  if (token.includes("OIL") || token.includes("SPX") || token.includes("GOOGL")) return "macro";
  return "other";
}

function participantAction(type) {
  return {
    existing_position: "holding",
    position_opened: "entered",
    position_added: "added",
    position_trimmed: "trimmed",
    position_closed: "exited",
    upnl_changed: "pnl_changed",
  }[type] ?? type;
}

function positionExposureSummary(positions) {
  return positions.reduce((summary, position) => {
    const bucket = tokenRiskBucket(position.symbol);
    const notional = Number(position.notional_usd ?? 0);
    summary.total += notional;
    if (position.side === "short") summary.short += notional;
    else summary.long += notional;
    summary.by_bucket[bucket] = (summary.by_bucket[bucket] ?? 0) + notional;
    summary.by_token[position.symbol] = (summary.by_token[position.symbol] ?? 0) + notional;
    return summary;
  }, {
    total: 0,
    long: 0,
    short: 0,
    by_bucket: {},
    by_token: {},
  });
}

function topEntry(record) {
  return Object.entries(record)
    .sort((a, b) => Number(b[1]) - Number(a[1]))[0] ?? null;
}

function classifyPosture(wallet, alerts, generatedAt) {
  const exposure = positionExposureSummary(wallet.positions);
  const latestHours = hoursSince(wallet.latest_trade_at || wallet.last_active_at, generatedAt);
  const actions = [...new Set(alerts.map((alert) => participantAction(alert.type)))];
  const active = wallet.positions.length > 0 || (latestHours !== null && latestHours <= 24);

  if (!wallet.positions.length) {
    return {
      active,
      activity_status: active ? "recently_active_flat" : "inactive_flat",
      posture: "flat",
      posture_label: "Flat / Waiting",
      risk_mode: "neutral",
      actions,
      exposure,
    };
  }

  const defensiveLong = wallet.positions.some((position) => (
    position.side === "long" && tokenRiskBucket(position.symbol) === "defensive"
  ));
  const highBetaLong = wallet.positions.some((position) => (
    position.side === "long" && tokenRiskBucket(position.symbol) === "high_beta"
  ));
  const majorShort = wallet.positions.some((position) => (
    position.side === "short" && ["majors", "high_beta"].includes(tokenRiskBucket(position.symbol))
  ));
  const addOrEntry = alerts.some((alert) => ["position_opened", "position_added"].includes(alert.type));
  const trimOrExit = alerts.some((alert) => ["position_trimmed", "position_closed"].includes(alert.type));

  if (defensiveLong) {
    return {
      active,
      activity_status: "active_positioned",
      posture: addOrEntry ? "defensive_rotation_entry" : "defensive_rotation",
      posture_label: addOrEntry ? "Defensive Rotation / Fresh Entry" : "Defensive Rotation",
      risk_mode: "risk_off",
      actions,
      exposure,
    };
  }

  if (majorShort && exposure.short >= exposure.long * 1.15) {
    return {
      active,
      activity_status: "active_positioned",
      posture: addOrEntry ? "bearish_risk_added" : "short_bias",
      posture_label: addOrEntry ? "Bearish Risk Added" : "Short Bias",
      risk_mode: "risk_off",
      actions,
      exposure,
    };
  }

  if (trimOrExit && exposure.long >= exposure.short) {
    return {
      active,
      activity_status: "active_positioned",
      posture: "risk_reduction",
      posture_label: "Risk Reduction",
      risk_mode: "de_risking",
      actions,
      exposure,
    };
  }

  if (highBetaLong && exposure.long > exposure.short) {
    return {
      active,
      activity_status: "active_positioned",
      posture: addOrEntry ? "risk_on_added" : "risk_on_long_bias",
      posture_label: addOrEntry ? "Risk-On / Added" : "Risk-On Long Bias",
      risk_mode: "risk_on",
      actions,
      exposure,
    };
  }

  if (exposure.long > exposure.short * 1.15) {
    return {
      active,
      activity_status: "active_positioned",
      posture: "long_bias",
      posture_label: "Long Bias",
      risk_mode: "risk_on",
      actions,
      exposure,
    };
  }

  if (exposure.short > exposure.long * 1.15) {
    return {
      active,
      activity_status: "active_positioned",
      posture: "short_bias",
      posture_label: "Short Bias",
      risk_mode: "risk_off",
      actions,
      exposure,
    };
  }

  return {
    active,
    activity_status: "active_positioned",
    posture: "mixed_book",
    posture_label: "Mixed Book",
    risk_mode: "mixed",
    actions,
    exposure,
  };
}

function buildParticipantStates(currentWallets, alerts, generatedAtIso) {
  const generatedAt = new Date(generatedAtIso);
  const alertsByAddress = new Map();
  for (const alert of alerts) {
    if (!alertsByAddress.has(alert.address)) alertsByAddress.set(alert.address, []);
    alertsByAddress.get(alert.address).push(alert);
  }

  const states = currentWallets.map((wallet) => {
    const walletAlerts = alertsByAddress.get(wallet.address) ?? [];
    const classified = classifyPosture(wallet, walletAlerts, generatedAt);
    const topToken = topEntry(classified.exposure.by_token);
    return {
      address: wallet.address,
      wallet: shortWallet(wallet.address),
      wallet_rank: walletRank(wallet.source_row),
      behavior_profile: behaviorProfile(wallet.source_row, wallet.behavior_row),
      priority: wallet.priority,
      active: classified.active,
      activity_status: classified.activity_status,
      posture: classified.posture,
      posture_label: classified.posture_label,
      risk_mode: classified.risk_mode,
      actions: classified.actions.length ? classified.actions : [wallet.positions.length ? "holding" : "waiting"],
      account_value: Number(wallet.account_value ?? 0),
      exposure_total: classified.exposure.total,
      exposure_long: classified.exposure.long,
      exposure_short: classified.exposure.short,
      top_token: topToken?.[0] ?? null,
      top_token_notional: topToken ? Number(topToken[1]) : 0,
      latest_trade_at: wallet.latest_trade_at,
      latest_trade_symbol: wallet.latest_trade_symbol,
      latest_trade_action: wallet.latest_trade_action,
      positions: wallet.positions.map((position) => ({
        symbol: position.symbol,
        side: position.side,
        notional_usd: position.notional_usd,
        upnl: position.upnl,
        risk_bucket: tokenRiskBucket(position.symbol),
      })),
    };
  });

  const marketActionStates = states.filter((state) => (
    state.exposure_total > 0 ||
    state.actions.some((action) => ["entered", "added", "trimmed", "exited"].includes(action))
  ));
  const riskCounts = marketActionStates.reduce((counts, state) => {
    counts[state.risk_mode] = (counts[state.risk_mode] ?? 0) + 1;
    return counts;
  }, {});
  const postureCounts = marketActionStates.reduce((counts, state) => {
    counts[state.posture] = (counts[state.posture] ?? 0) + 1;
    return counts;
  }, {});
  const tokenExposure = marketActionStates.reduce((tokens, state) => {
    for (const position of state.positions) {
      const key = `${position.symbol}:${position.side}`;
      tokens[key] = (tokens[key] ?? 0) + Number(position.notional_usd ?? 0);
    }
    return tokens;
  }, {});
  const topTokenExposure = Object.entries(tokenExposure)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, notional]) => {
      const [symbol, side] = key.split(":");
      return { symbol, side, notional_usd: notional };
    });

  const riskOn = riskCounts.risk_on ?? 0;
  const riskOff = riskCounts.risk_off ?? 0;
  const deRisking = riskCounts.de_risking ?? 0;
  const mixed = riskCounts.mixed ?? 0;
  const riskOnNotional = marketActionStates
    .filter((state) => state.risk_mode === "risk_on")
    .reduce((total, state) => total + state.exposure_total, 0);
  const riskOffNotional = marketActionStates
    .filter((state) => ["risk_off", "de_risking"].includes(state.risk_mode))
    .reduce((total, state) => total + state.exposure_total, 0);
  let netPosture = "mixed / watchful";
  if (riskOffNotional > riskOnNotional * 1.25) netPosture = "cautious / risk-off by notional";
  else if (riskOnNotional > riskOffNotional * 1.25 && riskOn > riskOff + deRisking) netPosture = "risk-on by breadth and notional";
  else if (riskOn > riskOff + deRisking) netPosture = "risk-on breadth / hedged notional";
  else if (riskOff + deRisking > riskOn + mixed) netPosture = "cautious / risk-off";
  else if (!marketActionStates.length) netPosture = "quiet / inactive";

  const highestValue = [...marketActionStates]
    .sort((a, b) => b.exposure_total - a.exposure_total)[0] ?? null;
  const freshActions = states.filter((state) => (
    state.actions.some((action) => ["entered", "added", "trimmed", "exited"].includes(action))
  ));

  const readLines = [];
  if (highestValue) {
    readLines.push(`${highestValue.wallet} is the largest active participant: ${highestValue.posture_label.toLowerCase()} via ${highestValue.top_token ?? "multi-asset"} exposure.`);
  }
  if (riskOff || deRisking) readLines.push(`${riskOff + deRisking} active wallet(s) are showing risk-off or de-risking behavior.`);
  if (riskOn) readLines.push(`${riskOn} active wallet(s) are still expressing risk-on long bias.`);
  if (riskOffNotional > riskOnNotional && riskOn > riskOff + deRisking) {
    readLines.push("Breadth is risk-on, but notional is dominated by the largest risk-off participant.");
  }
  if (freshActions.length) readLines.push(`${freshActions.length} wallet(s) had fresh behavior changes worth review.`);
  if (!readLines.length) readLines.push("No strong participant shift detected; current state is mostly watchful baseline.");

  return {
    generated_at: generatedAtIso,
    active_wallets: marketActionStates.length,
    tracked_wallets: states.length,
    net_posture: netPosture,
    risk_on_notional: riskOnNotional,
    risk_off_notional: riskOffNotional,
    risk_mode_counts: riskCounts,
    posture_counts: postureCounts,
    top_token_exposure: topTokenExposure,
    read: readLines.join(" "),
    states,
  };
}

function participantStateLine(state, index) {
  const exposure = state.exposure_total ? `${money(state.exposure_total)} exposure` : "flat";
  const top = state.top_token ? `top ${state.top_token} ${money(state.top_token_notional)}` : "no top token";
  return `${index + 1}. ${state.wallet} | ${state.wallet_rank} / ${state.behavior_profile}
   ${state.posture_label} (${state.risk_mode}); ${exposure}; ${top}
   Actions: ${state.actions.join(", ")}`;
}

function buildMarketParticipantRead(participantState) {
  const topExposure = participantState.top_token_exposure.length
    ? participantState.top_token_exposure.map((item) => `${item.symbol} ${item.side} ${money(item.notional_usd)}`).join("; ")
    : "none";
  const activeStates = participantState.states.filter((state) => (
    state.exposure_total > 0 ||
    state.actions.some((action) => ["entered", "added", "trimmed", "exited"].includes(action))
  ));

  return `🧠 HL INTEL | MARKET PARTICIPANT READ

Active VIP wallets: ${participantState.active_wallets}/${participantState.tracked_wallets}
Net posture: ${participantState.net_posture}
Top exposure: ${topExposure}

Read:
${participantState.read}

Active participants:
${activeStates.length ? activeStates.map(participantStateLine).join("\n\n") : "No active participants in this run."}

Data only. NFA.`;
}

function eventLabel(type, alertLane) {
  if (type === "position_opened" && alertLane?.includes("reactivation")) return "REACTIVATION";
  return {
    existing_position: "BASELINE",
    position_opened: "ENTRY",
    position_added: "ADD",
    position_trimmed: "TRIM",
    position_closed: "EXIT",
    upnl_changed: "RISK CHANGE",
  }[type] ?? titleWords(type).toUpperCase();
}

function eventType(type) {
  return {
    existing_position: "baseline",
    position_opened: "entry",
    position_added: "add",
    position_trimmed: "trim",
    position_closed: "exit",
    upnl_changed: "risk_change",
  }[type] ?? type;
}

function walletRank(row) {
  if (row.alert_lane === "profitable_open_book_unwind") return "Flagship";
  if (row.alert_lane?.includes("reactivation")) return "Reactivation Watch";
  if (row.priority === "A") return "Core Watch";
  return "Custom Watch";
}

function behaviorProfile(row, behaviorRow) {
  if (behaviorRow?.behavior_tier) return titleWords(behaviorRow.behavior_tier);
  return titleWords(row.product_bucket || row.alert_lane || "watch");
}

function riskContext(wallet, row, behaviorRow, position) {
  const risks = [];
  const leverage = Number(wallet.leverage_ratio ?? row.leverage_ratio ?? 0);
  const drawdown = Number(row.max_drawdown_pct ?? behaviorRow?.mdd_30d_pct ?? 0);

  if (leverage >= 8) risks.push(`high leverage ${leverage.toFixed(1)}x`);
  if (drawdown >= 15) risks.push(`drawdown ${drawdown.toFixed(1)}%`);
  if (behaviorRow?.source_conflict_flag) risks.push("source mismatch");
  if (position?.liquidation_price && position.liquidation_price !== "0") {
    risks.push(`liq ${position.liquidation_price}`);
  }
  if (!risks.length && row.priority !== "A") risks.push("custom-watch only");
  if (!risks.length) risks.push("context only, not a copy signal");

  return risks.join("; ");
}

function changeText(alert) {
  if (alert.notional_change_usd !== undefined) return formatSignedMoney(alert.notional_change_usd);
  if (alert.upnl_change_usd !== undefined) return formatSignedMoney(alert.upnl_change_usd);
  return "n/a";
}

function whyItMatters(alert, row) {
  if (row.alert_lane === "profitable_open_book_unwind") {
    if (alert.type === "position_closed") return "Flagship BTC wallet closed a large watched position; this is a high-value unwind signal.";
    if (alert.type === "position_trimmed") return "Flagship BTC wallet reduced exposure while holding meaningful open profit.";
    if (alert.type === "position_added") return "Flagship BTC wallet increased exposure while already in an important watched position.";
    if (alert.type === "upnl_changed") return "Large open-profit compression or expansion can change the read on this flagship BTC watch.";
    return "This is the cleanest ranked wallet currently monitored; the next add, trim, exit, or flip matters.";
  }

  if (row.alert_lane?.includes("reactivation")) {
    return "A high-quality inactive wallet reactivated; this maps directly to token-specific entry monitoring.";
  }

  if (row.priority !== "A") {
    return "Useful for custom watchlists, but keep it out of the flagship feed unless the user asked for this token or wallet.";
  }

  return "Ranked wallet behavior changed enough to review, but this remains market intelligence only.";
}

function buildTelegramAlert(event) {
  const positionLine = event.side ? `${event.token} ${event.side}` : event.token;
  const sizeLabel = event.event_type === "exit" ? "Closed size" : "Size";
  const changeLine = event.change && event.change !== "n/a" ? `Change: ${event.change}\n` : "";

  return `🔒 HL INTEL PRO | ${event.event_label}

🐋 Wallet: ${event.wallet}
Rank: ${event.wallet_rank} / ${event.behavior_profile}

📍 ${positionLine}
Event: ${event.position_change}

📊 ${sizeLabel}: ${event.notional}
${changeLine}Open uPnL: ${event.open_upnl}

⚠️ Risk: ${event.risk_context}

🧠 Why it matters:
${event.why_it_matters}

Data only. NFA.`;
}

function digestWalletLine(wallet, index) {
  const row = wallet.source_row;
  const behaviorRow = wallet.behavior_row;
  const positions = wallet.positions.length
    ? wallet.positions.map((position) => {
      const side = position.side === "short" ? "short" : "long";
      return `${position.symbol} ${side}, ${money(position.notional_usd)}, ${formatSignedMoney(position.upnl)} uPnL`;
    }).join("; ")
    : `flat; latest activity ${wallet.latest_trade_symbol || "n/a"} ${wallet.latest_trade_action || ""}`.trim();

  return `${index + 1}. ${shortWallet(wallet.address)} | ${walletRank(row)} / ${behaviorProfile(row, behaviorRow)}
   ${positions}
   Watch: ${row.alert_policy}`;
}

function buildCurrentDigest(currentWallets, generatedAt, participantState = null) {
  const ordered = [...currentWallets].sort((a, b) => {
    const priorityScore = { A: 0, B: 1, C: 2 };
    return (priorityScore[a.priority] ?? 9) - (priorityScore[b.priority] ?? 9);
  });
  const flagship = ordered.find((wallet) => wallet.source_row.alert_lane === "profitable_open_book_unwind");
  const activeCount = ordered.filter((wallet) => wallet.positions.length).length;
  const summary = flagship?.positions.length
    ? `${shortWallet(flagship.address)} remains the highest-value watch. No broad curated-feed expansion unless a material add, trim, exit, flip, or uPnL compression fires.`
    : "No flagship active position is open right now. Reactivation alerts are the highest-value next signal.";
  const participantBlock = participantState
    ? `
Market participant read:
Active VIP wallets: ${participantState.active_wallets}/${participantState.tracked_wallets}
Net posture: ${participantState.net_posture}
${participantState.read}
`
    : "";

  return `🔒 HL INTEL PRO | MINI DIGEST

Window: current wallet check
Generated: ${generatedAt}
Tracked wallets: ${ordered.length}
Active wallets: ${activeCount}
${participantBlock}

${ordered.map(digestWalletLine).join("\n\n")}

Summary:
${summary}

Data only. NFA.`;
}

function normalizeTokenList(tokens) {
  if (!Array.isArray(tokens)) return [];
  return tokens.map((token) => String(token).trim().toUpperCase()).filter(Boolean);
}

function watchRuleFor(config, address) {
  if (!config?.wallets?.length) return null;
  return config.wallets.find((wallet) => wallet.address?.toLowerCase() === address.toLowerCase()) ?? null;
}

function isAllowedByWatchConfig(alert, config) {
  if (!config) return true;

  const rule = watchRuleFor(config, alert.address);
  if (!rule) return false;

  const position = alert.current_position ?? alert.previous_position ?? null;
  const token = String(position?.symbol ?? alert.wallet.latest_trade_symbol ?? "").toUpperCase();
  const globalTokens = normalizeTokenList(config.tokens);
  const walletTokens = normalizeTokenList(rule.tokens);
  const allowedTokens = walletTokens.length ? walletTokens : globalTokens;

  if (allowedTokens.length && token && !allowedTokens.includes(token)) return false;

  if (rule.min_notional_change_usd && alert.notional_change_usd !== undefined) {
    if (Math.abs(alert.notional_change_usd) < Number(rule.min_notional_change_usd)) return false;
  }
  if (rule.min_upnl_change_usd && alert.upnl_change_usd !== undefined) {
    if (Math.abs(alert.upnl_change_usd) < Number(rule.min_upnl_change_usd)) return false;
  }

  return true;
}

function classifyWallet(row) {
  if (row.priority === "A") return "pilot_core";
  return "pilot_expanded";
}

function diffWallet(previousWallet, currentWallet) {
  if (!previousWallet) {
    if (!currentWallet.positions.length) return [];
    return currentWallet.positions.map((position) => ({
      severity: "baseline",
      type: "existing_position",
      detail: `Baseline open position: ${compactPosition(position)}`,
    }));
  }

  const alerts = [];
  const previousPositions = new Map(previousWallet.positions.map((position) => [posKey(position), position]));
  const currentPositions = new Map(currentWallet.positions.map((position) => [posKey(position), position]));

  for (const [key, current] of currentPositions) {
    const previous = previousPositions.get(key);
    if (!previous) {
      alerts.push({
        severity: "high",
        type: "position_opened",
        current_position: current,
        detail: `New ${current.side} ${current.symbol}: ${compactPosition(current)}`,
      });
      continue;
    }

    const sizeChange = current.size - previous.size;
    const sizeChangePct = previous.size ? (sizeChange / previous.size) * 100 : 0;
    const notionalChange = current.notional_usd - previous.notional_usd;
    const upnlChange = current.upnl - previous.upnl;

    if (
      Math.abs(sizeChangePct) >= minSizeChangePct &&
      Math.abs(notionalChange) >= minNotionalChangeUsd
    ) {
      alerts.push({
        severity: "medium",
        type: sizeChange > 0 ? "position_added" : "position_trimmed",
        current_position: current,
        previous_position: previous,
        size_change_pct: sizeChangePct,
        notional_change_usd: notionalChange,
        detail: `${current.symbol} ${current.side} size changed ${pct(sizeChangePct)}; notional change ${money(notionalChange)}. Current: ${compactPosition(current)}`,
      });
    }

    if (Math.abs(upnlChange) >= minUpnlChangeUsd) {
      alerts.push({
        severity: "low",
        type: "upnl_changed",
        current_position: current,
        previous_position: previous,
        upnl_change_usd: upnlChange,
        detail: `${current.symbol} ${current.side} uPnL changed ${money(upnlChange)} to ${money(current.upnl)}.`,
      });
    }
  }

  for (const [key, previous] of previousPositions) {
    if (currentPositions.has(key)) continue;
    alerts.push({
      severity: "high",
      type: "position_closed",
      previous_position: previous,
      detail: `Closed ${previous.side} ${previous.symbol}. Previous: ${compactPosition(previous)}`,
    });
  }

  return alerts;
}

function reportSection(title, rows) {
  if (!rows.length) return `## ${title}\n\nNone.\n`;
  return `## ${title}\n\n${rows.map((row, index) => {
    const positions = row.positions.length ? row.positions.map(compactPosition).join("; ") : "no open positions";
    return `${index + 1}. \`${row.address}\` - ${row.priority}/${row.alert_lane}. ${positions}`;
  }).join("\n")}\n`;
}

await mkdir(dirname(statePath), { recursive: true });

const rows = parseCsv(await readFile(reviewPath, "utf8"));
const behaviorRows = existsSync(behaviorPath)
  ? parseCsv(await readFile(behaviorPath, "utf8"))
  : [];
const behaviorByAddress = new Map(behaviorRows.map((row) => [row.address, row]));
const watchConfig = await readJsonIfExists(watchConfigPath);
const monitoredRows = rows.filter((row) => row.priority === "A" || row.priority === "B");
const previous = existsSync(statePath)
  ? JSON.parse(await readFile(statePath, "utf8"))
  : null;

const snapshot = {
  generated_at: new Date().toISOString(),
  wallets: {},
};

const currentRows = [];
const alertRows = [];

for (const row of monitoredRows) {
  const [trader, positionsPayload, tradesPayload] = await Promise.all([
    getJson(`https://hypercopy.app/api/trader/${row.address}`),
    getJson(`https://hypercopy.app/api/trader/${row.address}/positions`),
    fetchRecentTrades
      ? getJsonOrFallback(`https://hypercopy.app/api/trader/${row.address}/trades?page=1&per_page=5`, { trades: [] })
      : Promise.resolve({ trades: [] }),
  ]);
  const positions = positionsPayload.map(normalizePosition);
  const latestTrade = tradesPayload.trades?.[0] ?? null;
  const wallet = {
    address: row.address,
    priority: row.priority,
    source_row: row,
    behavior_row: behaviorByAddress.get(row.address) ?? null,
    product_bucket: row.product_bucket,
    alert_lane: row.alert_lane,
    monitor_lane: classifyWallet(row),
    score: Number(row.score),
    account_value: trader.account?.total_value ?? null,
    leverage_ratio: trader.account?.leverage_ratio ?? null,
    last_active_at: trader.last_active_at,
    latest_trade_at: latestTrade?.executed_at ?? null,
    latest_trade_symbol: latestTrade?.symbol ?? null,
    latest_trade_action: latestTrade?.action ?? null,
    latest_trade_side: latestTrade?.side ?? null,
    latest_trade_notional_usd: latestTrade?.notional_usd ?? null,
    positions,
  };

  snapshot.wallets[row.address] = wallet;
  currentRows.push(wallet);

  const previousWallet = previous?.wallets?.[row.address] ?? null;
  for (const alert of diffWallet(previousWallet, wallet)) {
    alertRows.push({
      address: row.address,
      priority: row.priority,
      monitor_lane: wallet.monitor_lane,
      alert_lane: row.alert_lane,
      product_bucket: row.product_bucket,
      row,
      wallet,
      ...alert,
    });
  }
}

const paidPilotAlertRows = alertRows.filter((alert) => isAllowedByWatchConfig(alert, watchConfig));
const participantState = buildParticipantStates(currentRows, paidPilotAlertRows, snapshot.generated_at);
const marketParticipantRead = buildMarketParticipantRead(participantState);
const alertEvents = paidPilotAlertRows.map((alert) => {
  const position = alert.current_position ?? alert.previous_position ?? null;
  const behaviorRow = behaviorByAddress.get(alert.address);
  const token = position?.symbol ?? alert.wallet.latest_trade_symbol ?? "n/a";
  const side = position?.side ?? alert.wallet.latest_trade_side ?? "";
  const event = {
    generated_at: snapshot.generated_at,
    severity: alert.severity,
    event_type: eventType(alert.type),
    event_label: eventLabel(alert.type, alert.alert_lane),
    wallet_address: alert.address,
    wallet: shortWallet(alert.address),
    wallet_rank: walletRank(alert.row),
    behavior_profile: behaviorProfile(alert.row, behaviorRow),
    token,
    side,
    notional: position ? money(position.notional_usd) : "n/a",
    change: changeText(alert),
    position_change: alert.type.replaceAll("_", " "),
    open_upnl: position ? formatSignedMoney(position.upnl) : "n/a",
    risk_context: riskContext(alert.wallet, alert.row, behaviorRow, position),
    market_participant_context: `${participantState.net_posture}; ${participantState.read}`,
    why_it_matters: whyItMatters(alert, alert.row),
    action_note: "Data only. NFA.",
    raw_detail: alert.detail,
  };

  return {
    ...event,
    telegram_text: buildTelegramAlert(event),
  };
});

const currentHeaders = [
  "priority",
  "monitor_lane",
  "alert_lane",
  "address",
  "score",
  "account_value",
  "leverage_ratio",
  "last_active_at",
  "latest_trade_at",
  "latest_trade_symbol",
  "latest_trade_action",
  "latest_trade_side",
  "latest_trade_notional_usd",
  "participant_activity_status",
  "participant_posture",
  "participant_risk_mode",
  "participant_actions",
  "open_positions",
  "positions",
];

const currentCsv = [
  currentHeaders.join(","),
  ...currentRows.map((row) => {
    const participant = participantState.states.find((state) => state.address === row.address);
    return [
    row.priority,
    row.monitor_lane,
    row.alert_lane,
    row.address,
    row.score,
    row.account_value,
    row.leverage_ratio,
    row.last_active_at,
    row.latest_trade_at,
    row.latest_trade_symbol,
    row.latest_trade_action,
    row.latest_trade_side,
    row.latest_trade_notional_usd,
    participant?.activity_status,
    participant?.posture,
    participant?.risk_mode,
    participant?.actions,
    row.positions.length,
    row.positions.map(compactPosition),
  ].map(csv).join(",");
  }),
].join("\n");

const highAlerts = alertRows.filter((alert) => alert.severity === "high");
const mediumAlerts = alertRows.filter((alert) => alert.severity === "medium");
const lowAlerts = alertRows.filter((alert) => alert.severity === "low");
const baselineAlerts = alertRows.filter((alert) => alert.severity === "baseline");
const pilotCore = currentRows.filter((row) => row.monitor_lane === "pilot_core");
const pilotExpanded = currentRows.filter((row) => row.monitor_lane === "pilot_expanded");

const alertBlock = (title, alerts) => {
  if (!alerts.length) return `## ${title}\n\nNone.\n`;
  return `## ${title}\n\n${alerts.map((alert, index) => {
    return `${index + 1}. \`${alert.address}\` - ${alert.type}: ${alert.detail}`;
  }).join("\n")}\n`;
};

const report = `# Viable Wallet Monitor Report

Generated: ${snapshot.generated_at}

This is a local monitor snapshot for the 7 viable HL Intel wallets. First run establishes the baseline; later runs will detect opens, closes, adds, trims, and meaningful uPnL changes.

## Market Participant Read

\`\`\`text
${marketParticipantRead}
\`\`\`

## Alert Counts

- High: ${highAlerts.length}
- Medium: ${mediumAlerts.length}
- Low: ${lowAlerts.length}
- Baseline: ${baselineAlerts.length}

${alertBlock("High Alerts", highAlerts)}

${alertBlock("Medium Alerts", mediumAlerts)}

${alertBlock("Low Alerts", lowAlerts)}

${alertBlock("Baseline Positions", baselineAlerts)}

${reportSection("Pilot Core", pilotCore)}

${reportSection("Pilot Expanded", pilotExpanded)}

## Monitor Rules

- Pilot core: Priority A only.
- Pilot expanded: Priority B wallets are optional and should be suppressed unless users want more movement.
- Alert on position opens, closes, flips, material adds/trims, and large uPnL changes.
- Suppress passive mark-price drift and dust-level fills.
`;

const alertFeed = `# HL Intel Alert Feed

Generated: ${snapshot.generated_at}

This file converts local monitor diffs into the buyer-requested alert contract: ranked wallet, watched token, event type, size/change, risk context, and Telegram-ready copy.

Watchlist mode: ${watchConfig ? `paid pilot (${watchConfig.customer || "unnamed"})` : "default internal monitor"}

## Event Counts

- Total: ${alertEvents.length}
- High: ${highAlerts.length}
- Medium: ${mediumAlerts.length}
- Low: ${lowAlerts.length}
- Baseline: ${baselineAlerts.length}
- Suppressed by watchlist config: ${alertRows.length - paidPilotAlertRows.length}

## Market Participant Read

\`\`\`text
${marketParticipantRead}
\`\`\`

${alertEvents.length ? alertEvents.map((event, index) => `## ${index + 1}. ${event.event_label} - ${event.wallet} ${event.token}

\`\`\`text
${event.telegram_text}
\`\`\`
`).join("\n") : "No alert events on this run.\n"}

## Current Digest

\`\`\`text
${buildCurrentDigest(currentRows, snapshot.generated_at, participantState)}
\`\`\`
`;

const currentDigest = `# HL Intel Current Digest

Generated: ${snapshot.generated_at}

\`\`\`text
${buildCurrentDigest(currentRows, snapshot.generated_at, participantState)}
\`\`\`
`;

const participantRead = `# HL Intel Market Participant Read

Generated: ${snapshot.generated_at}

\`\`\`text
${marketParticipantRead}
\`\`\`
`;

await writeFile(currentCsvPath, `${currentCsv}\n`);
await writeFile(reportPath, report);
await writeFile(alertEventsPath, JSON.stringify(alertEvents, null, 2));
await writeFile(alertFeedPath, alertFeed);
await writeFile(currentDigestPath, currentDigest);
await writeFile(participantStatePath, JSON.stringify(participantState, null, 2));
await writeFile(participantReadPath, participantRead);
await writeFile(statePath, JSON.stringify(snapshot, null, 2));

console.log(JSON.stringify({
  monitored: currentRows.length,
  high: highAlerts.length,
  medium: mediumAlerts.length,
  low: lowAlerts.length,
  baseline: baselineAlerts.length,
  alertEvents: alertEvents.length,
  watchlistMode: watchConfig ? watchConfig.customer || "paid_pilot" : "default_internal_monitor",
  suppressedByWatchlist: alertRows.length - paidPilotAlertRows.length,
  reportPath,
  currentCsvPath,
  alertEventsPath,
  alertFeedPath,
  currentDigestPath,
  participantStatePath,
  participantReadPath,
  statePath,
}, null, 2));
