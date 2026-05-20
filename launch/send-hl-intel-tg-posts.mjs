import { readFile } from "node:fs/promises";

const flagshipWallet = "0x6979dde2781dc4ec843641b10b2a2f2e0f4bda62";
const proDefaultChat = "@HLIntelPro";
const freeDefaultChat = "@HLIntel";
const participantReadPath = new URL("./hl-intel-market-participant-read.md", import.meta.url);
const currentDigestPath = new URL("./hl-intel-current-digest.md", import.meta.url);

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function hasArg(name) {
  return process.argv.includes(name);
}

async function loadEnvFile(path) {
  if (!path) return;
  const text = await readFile(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    const value = rawValue.trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function firstEnv(names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

function money(value, digits = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "n/a";
  return `$${number.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

function compactMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "n/a";
  const abs = Math.abs(number);
  if (abs >= 1_000_000) return `$${(number / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${Math.round(number / 1_000)}K`;
  return money(number);
}

function extractFirstTextFence(markdown) {
  const match = markdown.match(/```text\n([\s\S]*?)\n```/);
  return match?.[1]?.trim() || markdown.trim();
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "HL Intel Telegram live post",
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${url}`);
  }
  return response.json();
}

function buildPosts(position) {
  const side = position.side === "short" ? "short" : "long";
  const sideUpper = position.side === "short" ? "S" : "L";
  const notional = Math.abs(Number(position.size ?? 0) * Number(position.mark_price ?? 0));
  const upnl = Number(position.upnl ?? 0);
  const liq = Number(position.liquidation_price ?? 0);

  const pro = `🔒 HL INTEL PRO | FLAGSHIP BTC WATCH

🐋 Wallet: 0x6979...da62
Rank: Flagship / Elite Behavior

📍 BTC ${side}
Event: position still active

📊 Size: ~${compactMoney(notional)} notional
Open uPnL: ${upnl >= 0 ? "+" : ""}~${compactMoney(Math.abs(upnl))}
Liq: ~${money(liq, 0)} BTC

⚠️ Risk: large notional vs account value. This is context, not a copy signal.

🧠 Why it matters:
This is our cleanest ranked wallet right now. The high-value alert is what it does next: trim, full exit, flip, or material add.

Current policy:
We are watching for >=10% size change, >=$25K notional change, full exit, or flip.

Data only. NFA.`;

  const free = `HL INTEL FREE

A ranked BTC wallet is still sitting in a large profitable ${side}.

Pro is watching for:
- material add
- trim
- full exit
- flip
- major uPnL compression

The point is not to copy blindly.
The point is to know when meaningful wallet behavior changes.

Pro:
https://launchpass.com/goonboi/launchpass-com-hlintelpro

Data only. NFA.`;

  const audit = {
    wallet: flagshipWallet,
    token: position.symbol,
    side: sideUpper,
    size: Number(position.size ?? 0),
    mark_price: Number(position.mark_price ?? 0),
    notional,
    upnl,
    liquidation_price: liq,
    updated_at: position.updated_at,
  };

  return { pro, free, audit };
}

async function buildParticipantReadPosts() {
  const markdown = await readFile(participantReadPath, "utf8");
  const pro = extractFirstTextFence(markdown);
  const free = `HL INTEL FREE

The Pro feed now includes a market participant read:
- active VIP wallets
- net posture
- top exposure
- risk-on vs risk-off behavior

The point is not just whale alerts.
The point is knowing how high-quality wallets are reacting to the market.

Pro:
https://launchpass.com/goonboi/launchpass-com-hlintelpro

Data only. NFA.`;

  return {
    pro,
    free,
    audit: {
      source: "participant_read",
      path: participantReadPath.pathname,
      chars: pro.length,
    },
  };
}

async function buildCurrentDigestPosts() {
  const markdown = await readFile(currentDigestPath, "utf8");
  const pro = extractFirstTextFence(markdown);
  const free = `HL INTEL FREE

Pro digest updated.

The paid feed tracks ranked Hyperliquid wallets for:
- position changes
- adds/trims/exits/flips
- market participant posture
- risk-on vs risk-off behavior

Pro:
https://launchpass.com/goonboi/launchpass-com-hlintelpro

Data only. NFA.`;

  return {
    pro,
    free,
    audit: {
      source: "current_digest",
      path: currentDigestPath.pathname,
      chars: pro.length,
    },
  };
}

async function sendTelegram({ botToken, chatId, text, label }) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.ok === false) {
    const description = json.description ?? `${response.status} ${response.statusText}`;
    throw new Error(`${label} send failed: ${description}`);
  }
  return json.result?.message_id;
}

await loadEnvFile(argValue("--env-file"));

const postTarget = argValue("--post", "dry-run");
const postSource = argValue("--source", "flagship-btc");
const dryRun = hasArg("--dry-run") || postTarget === "dry-run";
const allowFallbackBot = hasArg("--allow-fallback-bot");
const botToken = firstEnv(allowFallbackBot
  ? [
      "HL_INTEL_TELEGRAM_BOT_TOKEN",
      "TELEGRAM_BOT_TOKEN",
      "TCC_TELEGRAM_BOT_TOKEN",
      "BOT_TOKEN",
    ]
  : ["HL_INTEL_TELEGRAM_BOT_TOKEN", "TELEGRAM_BOT_TOKEN"]);
const freeChat = firstEnv([
  "HL_INTEL_FREE_CHAT_ID",
  "HL_INTEL_TELEGRAM_FREE_CHAT_ID",
  "FREE_CHANNEL_ID",
]) || freeDefaultChat;
const proChat = firstEnv([
  "HL_INTEL_PRO_CHAT_ID",
  "HL_INTEL_TELEGRAM_PRO_CHAT_ID",
  "PAID_CHANNEL_ID",
  "PRO_CHANNEL_ID",
]) || proDefaultChat;

if (hasArg("--get-me")) {
  if (!botToken) {
    throw new Error("Missing HL Intel bot token. Set HL_INTEL_TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN.");
  }
  const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
  const json = await response.json();
  console.log(JSON.stringify({
    ok: json.ok,
    username: json.result?.username,
    first_name: json.result?.first_name,
  }, null, 2));
  process.exit(json.ok ? 0 : 1);
}

let posts;

if (postSource === "participant-read") {
  posts = await buildParticipantReadPosts();
} else if (postSource === "current-digest") {
  posts = await buildCurrentDigestPosts();
} else if (postSource === "flagship-btc") {
  const positions = await getJson(`https://hypercopy.app/api/trader/${flagshipWallet}/positions`);
  const btcPosition = positions.find((position) => position.symbol === "BTC");

  if (!btcPosition) {
    throw new Error("Flagship wallet does not currently have a BTC position. Refusing to post stale alert.");
  }

  posts = buildPosts(btcPosition);
} else {
  throw new Error("Unknown --source. Use flagship-btc, participant-read, or current-digest.");
}

console.log("HL Intel TG post preview");
console.log(JSON.stringify(posts.audit, null, 2));
console.log("\n--- PRO ---\n");
console.log(posts.pro);
console.log("\n--- FREE ---\n");
console.log(posts.free);

if (dryRun) {
  console.log("\nDRY RUN: no Telegram messages sent.");
  process.exit(0);
}

if (!botToken) {
  throw new Error("Missing HL Intel bot token. Set HL_INTEL_TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN. Use --allow-fallback-bot only for explicit TCC/BOT_TOKEN testing.");
}

const sent = [];
if (postTarget === "pro" || postTarget === "both") {
  const id = await sendTelegram({ botToken, chatId: proChat, text: posts.pro, label: "pro" });
  sent.push(`pro:${id}`);
}
if (postTarget === "free" || postTarget === "both") {
  const id = await sendTelegram({ botToken, chatId: freeChat, text: posts.free, label: "free" });
  sent.push(`free:${id}`);
}

if (!sent.length) {
  throw new Error("Nothing sent. Use --post pro, --post free, or --post both.");
}

console.log(`Sent Telegram messages: ${sent.join(", ")}`);
