import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


def _float_env(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _bool_env(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
FREE_CHANNEL_ID = os.getenv("FREE_CHANNEL_ID")
PAID_CHANNEL_ID = os.getenv("PAID_CHANNEL_ID")

SCAN_INTERVAL_SECONDS = _int_env("SCAN_INTERVAL_SECONDS", 180)
HL_INFO_MIN_REQUEST_INTERVAL_SECONDS = _float_env("HL_INFO_MIN_REQUEST_INTERVAL_SECONDS", 0.75)
HL_INFO_MAX_RETRIES = _int_env("HL_INFO_MAX_RETRIES", 5)
HL_HTTP_TIMEOUT_SECONDS = _float_env("HL_HTTP_TIMEOUT_SECONDS", 20.0)
SEND_STARTUP_MESSAGE = _bool_env("SEND_STARTUP_MESSAGE", False)
WATCHLIST_PATH = os.getenv("HL_INTEL_WATCHLIST_PATH", str(Path(__file__).with_name("watchlist.json")))

WHALE_POSITION_THRESHOLD_USD = 500_000

# Funding rate spike — alert when abs(rate) exceeds this AND moved significantly
# 0.0001 = 0.01% per 8h. Most Hyperliquid rates sit 0.001–0.025%.
FUNDING_RATE_SPIKE_THRESHOLD = 0.0001

# OI surge — % change vs 1 hour ago
# Raised to 15% — small altcoins spike 5% constantly, not meaningful
OI_SURGE_PCT_THRESHOLD = 15.0

# Minimum OI to qualify — raised to $50M, filters out low-liquidity alts
MIN_OI_FOR_SURGE = 50_000_000  # $50M

# Liquidation proximity — alert when a large position is within this % of liquidation
LIQ_PROXIMITY_THRESHOLD_PCT = 10.0   # first alert at 10%
LIQ_PROXIMITY_DANGER_PCT    = 5.0    # re-alert at 5% (escalation)
MIN_NOTIONAL_FOR_LIQ_ALERT  = 5_000_000  # only alert on positions >$5M
