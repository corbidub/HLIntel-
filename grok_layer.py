#!/usr/bin/env python3
"""
engine.py - Core indicator engine + rate-limited data layer for the Hyperliquid scanner.

Read-only. No wallet keys, no signing, no order placement.
Hyperliquid /info shares a 1200 weight/min budget: candleSnapshot=20, l2Book=20... actually
metaAndAssetCtxs=20, candleSnapshot=20, l2Book=2. We pace requests to stay under it.
"""
from __future__ import annotations
from dataclasses import dataclass
from collections import deque
import threading
import time
import requests
import numpy as np
import pandas as pd

# ========================= CONFIG =========================
@dataclass
class Config:
    coin: str = "BTC"
    timeframes: list[str] = None
    lookback_bars: int = 300
    account_equity: float = 5000.0
    risk_pct: float = 0.01
    atr_stop_mult: float = 1.4
    min_bars: int = 60
    leverage: dict = None

    def __post_init__(self):
        if self.timeframes is None:
            self.timeframes = ["15m", "1h", "4h"]
        if self.leverage is None:
            self.leverage = {"BTC": 40, "default": 5}

CONFIG = Config()

HL_INFO = "https://api.hyperliquid.xyz/info"
INTERVAL_MS = {
    "1m":60_000,"3m":180_000,"5m":300_000,"15m":900_000,"30m":1_800_000,
    "1h":3_600_000,"2h":7_200_000,"4h":14_400_000,"8h":28_800_000,
    "12h":43_200_000,"1d":86_400_000
}
# documented /info weights; default unknown types to 20 (the common case)
REQ_WEIGHTS = {"l2Book": 2, "allMids": 2, "metaAndAssetCtxs": 20, "candleSnapshot": 20}

# ----------------------- RATE LIMITER -----------------------
class WeightLimiter:
    """Rolling-window weight budget. Blocks until there's room under the cap."""
    def __init__(self, budget: int = 1200, window: float = 60.0, headroom: float = 0.85):
        self.cap = budget * headroom          # stay below the true 1200 cap
        self.window = window
        self.events: deque[tuple[float, int]] = deque()
        self.lock = threading.Lock()

    def acquire(self, weight: int):
        while True:
            with self.lock:
                now = time.time()
                while self.events and now - self.events[0][0] > self.window:
                    self.events.popleft()
                used = sum(w for _, w in self.events)
                if used + weight <= self.cap:
                    self.events.append((now, weight))
                    return
                wait = self.window - (now - self.events[0][0]) + 0.05
            time.sleep(max(wait, 0.05))

LIMITER = WeightLimiter()

# ----------------------- INDICATORS (audited - unchanged) -----------------------
def rma(s: pd.Series, n: int) -> pd.Series:
    return s.ewm(alpha=1 / n, adjust=False).mean()

def ema(s: pd.Series, n: int) -> pd.Series:
    return s.ewm(span=n, adjust=False).mean()

def true_range(df: pd.DataFrame) -> pd.Series:
    pc = df["close"].shift()
    return pd.concat([df["high"] - df["low"], (df["high"] - pc).abs(), (df["low"] - pc).abs()], axis=1).max(axis=1)

def atr(df: pd.DataFrame, n: int = 14) -> pd.Series:
    return rma(true_range(df), n)

def rsi(close: pd.Series, n: int = 14) -> pd.Series:
    d = close.diff()
    gain, loss = d.clip(lower=0), -d.clip(upper=0)
    rs = rma(gain, n) / rma(loss, n).replace(0, np.nan)
    return (100 - 100 / (1 + rs)).fillna(50)

def macd(close: pd.Series):
    line = ema(close, 12) - ema(close, 26)
    signal = ema(line, 9)
    return line, signal, line - signal

def bollinger_width(close: pd.Series, n: int = 20, k: float = 2.0) -> pd.Series:
    mid = close.rolling(n).mean()
    sd = close.rolling(n).std()
    return ((mid + k * sd) - (mid - k * sd)) / mid

def adx(df: pd.DataFrame, n: int = 14):
    up, down = df["high"].diff(), -df["low"].diff()
    plus_dm = np.where((up > down) & (up > 0), up, 0.0)
    minus_dm = np.where((down > up) & (down > 0), down, 0.0)
    tr_n = rma(true_range(df), n)
    plus_di = 100 * rma(pd.Series(plus_dm, index=df.index), n) / tr_n
    minus_di = 100 * rma(pd.Series(minus_dm, index=df.index), n) / tr_n
    dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, np.nan)
    return rma(dx, n).fillna(0), plus_di.fillna(0), minus_di.fillna(0)

def anchored_vwap(df: pd.DataFrame) -> pd.Series:
    tp = (df["high"] + df["low"] + df["close"]) / 3
    return (tp * df["volume"]).cumsum() / df["volume"].cumsum().replace(0, np.nan)

def swing_points(df: pd.DataFrame, k: int = 3):
    highs, lows = [], []
    h, l = df["high"].values, df["low"].values
    for i in range(k, len(df) - k):
        if h[i] == max(h[i - k:i + k + 1]): highs.append((i, h[i]))
        if l[i] == min(l[i - k:i + k + 1]): lows.append((i, l[i]))
    return highs, lows

# ----------------------- ANALYSIS (unchanged) -----------------------
@dataclass
class TFRead:
    tf: str; close: float; ema21: float; ema50: float; ema200: float
    adx: float; plus_di: float; minus_di: float; rsi: float; macd_hist: float
    atr: float; bb_width: float; vwap: float; structure: str; regime: str
    lean: int; notes: list; bars: int

def analyse_tf(tf: str, df: pd.DataFrame) -> TFRead:
    close = df["close"].iloc[-1]
    e21 = ema(df["close"], 21).iloc[-1]; e50 = ema(df["close"], 50).iloc[-1]; e200 = ema(df["close"], 200).iloc[-1]
    adx_v, pdi, mdi = (x.iloc[-1] for x in adx(df))
    r = rsi(df["close"]).iloc[-1]
    _, _, hist = macd(df["close"]); hist = hist.iloc[-1]
    a = atr(df).iloc[-1]; bw = bollinger_width(df["close"]).iloc[-1]; vw = anchored_vwap(df).iloc[-1]
    highs, lows = swing_points(df)
    structure = "n/a"
    if len(highs) >= 2 and len(lows) >= 2:
        hh = highs[-1][1] > highs[-2][1]; hl = lows[-1][1] > lows[-2][1]
        lh = highs[-1][1] < highs[-2][1]; ll = lows[-1][1] < lows[-2][1]
        structure = "uptrend (HH/HL)" if hh and hl else "downtrend (LH/LL)" if lh and ll else "ranging / mixed"
    if adx_v > 25 and pdi > mdi and close > e50:   regime = "trend up"
    elif adx_v > 25 and mdi > pdi and close < e50: regime = "trend down"
    elif adx_v < 20:                                regime = "chop"
    else:                                           regime = "transition"
    lean, notes = 0, []
    if close > e21 > e50: lean += 1; notes.append("price above 21>50 EMA (up)")
    elif close < e21 < e50: lean -= 1; notes.append("price below 21<50 EMA (down)")
    if pdi > mdi: lean += 1; notes.append("+DI > -DI")
    else: lean -= 1; notes.append("-DI > +DI")
    if hist > 0: lean += 1; notes.append("MACD hist positive")
    else: lean -= 1; notes.append("MACD hist negative")
    if r >= 55: lean += 1; notes.append(f"RSI {r:.0f} (up)")
    elif r <= 45: lean -= 1; notes.append(f"RSI {r:.0f} (down)")
    if close > vw: lean += 1; notes.append("above anchored VWAP")
    else: lean -= 1; notes.append("below anchored VWAP")
    return TFRead(tf, close, e21, e50, e200, adx_v, pdi, mdi, r, hist, a, bw, vw,
                  structure, regime, lean, notes, len(df))

def position_sizing(entry: float, atr_val: float):
    risk_usd = CONFIG.account_equity * CONFIG.risk_pct
    stop_dist = CONFIG.atr_stop_mult * atr_val
    size_units = risk_usd / stop_dist if stop_dist else 0.0
    return risk_usd, stop_dist, size_units, size_units * entry

# ----------------------- DATA LAYER -----------------------
def _post(body: dict, retries: int = 4):
    weight = REQ_WEIGHTS.get(body.get("type"), 20)
    for attempt in range(retries):
        LIMITER.acquire(weight)
        try:
            r = requests.post(HL_INFO, json=body, timeout=15)
        except requests.RequestException:
            if attempt == retries - 1: raise
            time.sleep(2 ** attempt); continue
        if r.status_code == 429:                 # throttled - back off and retry
            time.sleep(2 ** attempt + 1); continue
        r.raise_for_status()
        return r.json()
    raise RuntimeError(f"/info failed after {retries} retries for {body.get('type')}")

# TTL cache for the universe/ctxs (carries LIVE funding/OI/mark, so it must expire)
_uni_cache = {"data": None, "ts": 0.0}
UNIVERSE_TTL = 30.0

def get_universe_and_ctxs(force: bool = False):
    now = time.time()
    if force or _uni_cache["data"] is None or now - _uni_cache["ts"] > UNIVERSE_TTL:
        _uni_cache["data"] = _post({"type": "metaAndAssetCtxs"})
        _uni_cache["ts"] = now
    return _uni_cache["data"]

def _candles(coin: str, tf: str) -> pd.DataFrame:
    end = int(time.time() * 1000)
    start = end - INTERVAL_MS[tf] * (CONFIG.lookback_bars + 5)
    raw = _post({"type": "candleSnapshot", "req": {"coin": coin, "interval": tf, "startTime": start, "endTime": end}})
    if not raw:
        raise ValueError(f"No candles for {coin} {tf}")
    df = pd.DataFrame(raw).rename(columns={"o":"open","h":"high","l":"low","c":"close","v":"volume"})
    for c in ["open","high","low","close","volume"]:
        df[c] = df[c].astype(float)
    if "t" in df.columns:
        df = df.sort_values("t")
    return df.reset_index(drop=True)

def fetch_screen(coin: str, timeframes=("1h", "4h")):
    """Lightweight fetch for the broad scan: candles only, no order book."""
    return {tf: _candles(coin, tf) for tf in timeframes}

def fetch_live(coin: str):
    """Full fetch for a deep-dive: all CONFIG timeframes + order book + microstructure."""
    frames = {tf: _candles(coin, tf) for tf in CONFIG.timeframes}
    meta, ctxs = get_universe_and_ctxs()
    match = [i for i, a in enumerate(meta["universe"]) if a["name"] == coin]
    if not match:
        raise ValueError(f"'{coin}' not in Hyperliquid perp universe")
    ctx = ctxs[match[0]]
    book = _post({"type": "l2Book", "coin": coin})
    levels = book.get("levels", [[], []])
    bids = levels[0] if len(levels) > 0 else []
    asks = levels[1] if len(levels) > 1 else []
    bid_sz = sum(float(x["sz"]) for x in bids[:10])
    ask_sz = sum(float(x["sz"]) for x in asks[:10])
    micro = {
        "mark": float(ctx["markPx"]),
        "funding": float(ctx.get("funding") or 0),
        "open_interest": float(ctx.get("openInterest") or 0),
        "day_volume": float(ctx.get("dayNtlVlm") or 0),
        "book_imbalance": (bid_sz - ask_sz) / (bid_sz + ask_sz) if (bid_sz + ask_sz) else 0.0,
    }
    return frames, micro

def fetch_demo(coin: str):
    rng = np.random.default_rng(7)
    steps = rng.normal(0.0004, 0.011, CONFIG.lookback_bars).cumsum()
    base = 90000 * np.exp(steps)
    frames = {}
    for tf in CONFIG.timeframes:
        noise = 1 + rng.normal(0, 0.001, CONFIG.lookback_bars)
        close = base * noise
        high = close * (1 + np.abs(rng.normal(0, 0.004, CONFIG.lookback_bars)))
        low = close * (1 - np.abs(rng.normal(0, 0.004, CONFIG.lookback_bars)))
        open_ = np.concatenate([[close[0]], close[:-1]])
        vol = np.abs(rng.normal(120, 40, CONFIG.lookback_bars))
        frames[tf] = pd.DataFrame({"open":open_,"high":high,"low":low,"close":close,"volume":vol})
    last = frames[CONFIG.timeframes[-1]]["close"].iloc[-1]
    micro = {"mark": float(last), "funding": 0.0000125, "open_interest": 4_200.0, "day_volume": 9.1e8, "book_imbalance": 0.08}
    return frames, micro