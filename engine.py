#!/usr/bin/env python3
"""
bot.py - Hyperliquid Trade-Setup Scanner (HL Intel Pro)
Final Version with improved /coin command
"""

import os
import json
import asyncio
import logging
from datetime import datetime
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from screen import run_scan, deep_dive
from grok_layer import generate_setups
from engine import CONFIG

load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
PROACTIVE_INTERVAL = 300
MIN_SCORE_FOR_ALERT = 52
ACCOUNT_EQUITY = getattr(CONFIG, "account_equity", 5000.0)

session_active = False
alerts_enabled = True
active_chats: set[int] = set()
last_alert_coins: set[str] = set()

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
log = logging.getLogger("hl_intel_bot")


def fmt(n: float) -> str:
    return f"{float(n):,.6f}".rstrip("0").rstrip(".")


def save_good_setup(setup: dict):
    try:
        with open("good_setups.json", "a") as f:
            f.write(json.dumps({
                "timestamp": datetime.utcnow().isoformat(),
                "coin": setup.get("coin"),
                "direction": setup.get("setups", [{}])[0].get("direction"),
                "entry": setup.get("setups", [{}])[0].get("entry"),
                "score": setup.get("score", 0),
            }) + "\n")
    except Exception as e:
        log.warning(f"Failed to save setup: {e}")


def calculate_position_size(entry: float, stop: float) -> dict:
    risk_usd = ACCOUNT_EQUITY * 0.01
    stop_dist = abs(entry - stop)
    if stop_dist == 0:
        return {"size_usd": 0, "size_units": 0, "risk_usd": risk_usd}
    size_units = risk_usd / stop_dist
    size_usd = size_units * entry
    return {
        "risk_usd": round(risk_usd, 2),
        "size_usd": round(size_usd, 2),
        "size_units": round(size_units, 4)
    }


def format_setup(s: dict) -> str:
    coin = s.get("coin", "???")
    score = s.get("score") or 0

    msg = f"🚀 **{coin}**  |  Score: {score}"

    for setup in s.get("setups", []):
        direction = setup.get("direction", "long").upper()
        emoji = "🟢 LONG" if direction == "LONG" else "🔴 SHORT"
        sizing = calculate_position_size(
            float(setup.get("entry", 0)),
            float(setup.get("stop", 0))
        )

        msg += f"\n\n{emoji}  |  Conf: {setup.get('confidence', 'med').upper()}"
        msg += f"\nEntry: `{fmt(setup.get('entry'))}`"
        msg += f"\nStop: `{fmt(setup.get('stop'))}`"
        msg += f"\nTargets: `{fmt(setup['targets'][0])}` → `{fmt(setup['targets'][1])}` → `{fmt(setup['targets'][2])}`"
        msg += f"\nLeverage: {setup.get('leverage_set', 5)}x  |  Risk: {setup.get('risk_pct_at_leverage', 1)}%"
        msg += f"\nPosition Size: ~${sizing['size_usd']} ({sizing['size_units']} units)"
        msg += f"\nRationale: {setup.get('rationale')}"
        msg += f"\nInvalidation: {setup.get('invalidation')}"

    return msg


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    global session_active, last_alert_coins
    session_active = True
    active_chats.add(update.effective_chat.id)
    last_alert_coins.clear()
    await update.message.reply_text(
        "🟢 **HL Intel Scanner ONLINE** — on its tippy toes.\n\n"
        "Commands:\n"
        "/scan — manual scan\n"
        "/coin SYMBOL — deep dive\n"
        "/alerts — toggle proactive alerts\n"
        "/stop — turn off\n\n"
        "High-confluence setups will ping you automatically."
    )


async def stop_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    global session_active
    session_active = False
    await update.message.reply_text("🔴 Scanner OFF.")


async def toggle_alerts(update: Update, context: ContextTypes.DEFAULT_TYPE):
    global alerts_enabled
    alerts_enabled = not alerts_enabled
    status = "🟢 ENABLED" if alerts_enabled else "🔴 DISABLED"
    await update.message.reply_text(f"Proactive alerts are now {status}")


async def scan(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not session_active:
        await update.message.reply_text("Use /start first.")
        return

    await update.message.reply_text("🔍 Scanning Hyperliquid...")

    try:
        discoveries = run_scan()
        if not discoveries:
            await update.message.reply_text("No pairs passed liquidity filters right now.")
            return

        good = [d for d in discoveries if d.get("score", 0) >= 35]
        if not good:
            good = discoveries[:5]

        enriched = deep_dive(good[:6])
        setups = generate_setups(enriched)

        if not setups:
            await update.message.reply_text("Scan finished but no valid setups were generated.")
            return

        for s in setups:
            text = format_setup(s)
            await update.message.reply_text(text, parse_mode="Markdown")
            if s.get("score", 0) >= MIN_SCORE_FOR_ALERT:
                save_good_setup(s)
            await asyncio.sleep(0.35)

        await update.message.reply_text("✅ Scan complete. Use /scan again anytime.")

    except Exception as e:
        log.error(f"Scan error: {e}")
        await update.message.reply_text(f"Scan error: {str(e)[:200]}")


async def coin_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("Usage: /coin SYMBOL (e.g. /coin HYPE)")
        return

    symbol = context.args[0].upper()
    await update.message.reply_text(f"🔎 Deep dive on {symbol}...")

    try:
        discoveries = run_scan()
        match = [d for d in discoveries if d["coin"].upper() == symbol]

        if not match:
            match = [d for d in discoveries if symbol in d["coin"].upper()]
            if not match:
                await update.message.reply_text(f"No recent data for {symbol}. Try /scan first.")
                return

        enriched = deep_dive(match[:1])
        setups = generate_setups(enriched)

        if not setups:
            await update.message.reply_text(f"Could not generate setup for {symbol} right now.")
            return

        for s in setups:
            await update.message.reply_text(format_setup(s), parse_mode="Markdown")

    except Exception as e:
        log.error(f"/coin error for {symbol}: {e}")
        await update.message.reply_text(f"Error analyzing {symbol}: {str(e)[:150]}")


async def proactive_scanner(app: Application):
    global last_alert_coins
    while True:
        await asyncio.sleep(PROACTIVE_INTERVAL)
        if not session_active or not alerts_enabled or not active_chats:
            continue

        try:
            discoveries = run_scan()
            high_quality = [d for d in discoveries if d.get("score", 0) >= MIN_SCORE_FOR_ALERT]
            if not high_quality:
                continue

            enriched = deep_dive(high_quality[:3])
            setups = generate_setups(enriched)

            for s in setups:
                coin_name = s.get("coin")
                if coin_name in last_alert_coins:
                    continue

                last_alert_coins.add(coin_name)
                text = "🚨 **HIGH CONFLUENCE SETUP**\n\n" + format_setup(s)

                for chat_id in list(active_chats):
                    try:
                        await app.bot.send_message(chat_id=chat_id, text=text, parse_mode="Markdown")
                    except Exception as e:
                        log.warning(f"Failed to send to {chat_id}: {e}")

                save_good_setup(s)
                log.info(f"Sent proactive alert for {coin_name}")

        except Exception as e:
            log.warning(f"Proactive error: {e}")


def main():
    if not TELEGRAM_TOKEN:
        print("❌ Missing TELEGRAM_BOT_TOKEN in .env")
        return

    app = Application.builder().token(TELEGRAM_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("stop", stop_cmd))
    app.add_handler(CommandHandler("scan", scan))
    app.add_handler(CommandHandler("coin", coin_cmd))
    app.add_handler(CommandHandler("alerts", toggle_alerts))

    asyncio.get_event_loop().create_task(proactive_scanner(app))

    print("🤖 HL Intel Pro Scanner running...")
    app.run_polling()


if __name__ == "__main__":
    main()