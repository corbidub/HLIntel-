import { appendFile, readFile } from "node:fs/promises";

const freeDefaultChat = "@HLIntel";
const proDefaultChat = "@HLIntelPro";

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

async function textInput() {
  const textFile = argValue("--text-file");
  if (textFile) return (await readFile(textFile, "utf8")).trim();
  return argValue("--text").trim();
}

function buildTelegramPost({ label, text, url }) {
  const lines = [
    label,
    "",
    text,
  ];

  if (url) {
    lines.push("", "Read on X:", url);
  }

  return lines.join("\n").trim();
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
const dryRun = hasArg("--dry-run") || postTarget === "dry-run";
const url = argValue("--url").trim();
const xText = await textInput();
const logFile = argValue("--log-file");

if (!xText) {
  throw new Error("Missing X post text. Use --text or --text-file.");
}

const botToken = firstEnv(["HL_INTEL_TELEGRAM_BOT_TOKEN", "TELEGRAM_BOT_TOKEN"]);
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

const posts = {
  free: buildTelegramPost({
    label: "HL INTEL X READ",
    text: xText,
    url,
  }),
  pro: buildTelegramPost({
    label: "HL INTEL PRO | X READ",
    text: xText,
    url,
  }),
};

if (posts.free.length > 4096 || posts.pro.length > 4096) {
  throw new Error("Telegram post is too long. Keep the X text plus URL under 4096 characters.");
}

console.log("HL Intel X -> TG preview");
console.log(JSON.stringify({
  url,
  chars: xText.length,
  postTarget,
  freeChat,
  proChat,
}, null, 2));
console.log("\n--- FREE ---\n");
console.log(posts.free);
console.log("\n--- PRO ---\n");
console.log(posts.pro);

if (dryRun) {
  console.log("\nDRY RUN: no Telegram messages sent.");
  process.exit(0);
}

if (!botToken) {
  throw new Error("Missing HL Intel bot token. Set HL_INTEL_TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN.");
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

if (logFile) {
  const stamp = new Date().toISOString();
  await appendFile(logFile, `\n## ${stamp} X Cross-Post\n\nURL: ${url || "n/a"}\n\nSent: ${sent.join(", ")}\n\n\`\`\`text\n${xText}\n\`\`\`\n`);
}
