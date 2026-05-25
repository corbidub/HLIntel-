import aiohttp
import asyncio
import logging
import random
import time
from typing import Any

import config


log = logging.getLogger(__name__)

HL_INFO_URL = "https://api.hyperliquid.xyz/info"
HL_LEADERBOARD_URL = "https://stats-data.hyperliquid.xyz/Mainnet/leaderboard"

_info_lock = asyncio.Lock()
_last_info_request_at = 0.0


async def _post(session: aiohttp.ClientSession, payload: dict) -> Any:
    return await _post_with_backoff(session, payload)


async def _paced_post(session: aiohttp.ClientSession, payload: dict) -> Any:
    """Serialize /info requests so wallet scans do not burst into 429s."""
    global _last_info_request_at
    async with _info_lock:
        elapsed = time.monotonic() - _last_info_request_at
        min_interval = max(config.HL_INFO_MIN_REQUEST_INTERVAL_SECONDS, 0.0)
        if elapsed < min_interval:
            await asyncio.sleep(min_interval - elapsed)

        async with session.post(HL_INFO_URL, json=payload) as resp:
            _last_info_request_at = time.monotonic()
            if resp.status == 429:
                raise aiohttp.ClientResponseError(
                    resp.request_info,
                    resp.history,
                    status=429,
                    message="Too Many Requests",
                    headers=resp.headers,
                ) from None
            resp.raise_for_status()
            return await resp.json()


async def _post_with_backoff(
    session: aiohttp.ClientSession,
    payload: dict,
    max_retries: int | None = None,
) -> Any:
    """POST with pacing and exponential backoff on 429."""
    if max_retries is None:
        max_retries = config.HL_INFO_MAX_RETRIES
    delay = 2.0
    last_exc: Exception | None = None
    for attempt in range(max_retries + 1):
        retry_after: str | None = None
        try:
            return await _paced_post(session, payload)
        except aiohttp.ClientResponseError as e:
            last_exc = e
            if e.status != 429 or attempt >= max_retries:
                raise
            retry_after = e.headers.get("retry-after") if e.headers else None

        wait = float(retry_after) if retry_after else delay + random.uniform(0, delay * 0.3)
        log.warning(f"429 — retry {attempt + 1}/{max_retries} in {wait:.1f}s")
        await asyncio.sleep(wait)
        delay = min(delay * 2, 30.0)
    raise last_exc  # type: ignore[misc]


async def get_leaderboard(top_n: int = 100) -> list[dict]:
    async with aiohttp.ClientSession() as session:
        data = await _get_json_with_backoff(session, HL_LEADERBOARD_URL)
    rows = data.get("leaderboardRows", [])
    return rows[:top_n]


async def _get_json_with_backoff(
    session: aiohttp.ClientSession,
    url: str,
    max_retries: int | None = None,
) -> Any:
    if max_retries is None:
        max_retries = config.HL_INFO_MAX_RETRIES
    delay = 2.0
    last_exc: Exception | None = None
    for attempt in range(max_retries + 1):
        try:
            async with session.get(url) as resp:
                if resp.status == 429:
                    raise aiohttp.ClientResponseError(
                        resp.request_info,
                        resp.history,
                        status=429,
                        message="Too Many Requests",
                        headers=resp.headers,
                    ) from None
                resp.raise_for_status()
                return await resp.json()
        except aiohttp.ClientResponseError as e:
            last_exc = e
            if e.status != 429 or attempt >= max_retries:
                raise
            retry_after = e.headers.get("retry-after") if e.headers else None
            wait = float(retry_after) if retry_after else delay + random.uniform(0, delay * 0.3)
            log.warning(f"429 leaderboard — retry {attempt + 1}/{max_retries} in {wait:.1f}s")
            await asyncio.sleep(wait)
            delay = min(delay * 2, 30.0)
    raise last_exc  # type: ignore[misc]


async def get_positions(address: str) -> dict:
    async with aiohttp.ClientSession() as session:
        data = await _post(session, {"type": "clearinghouseState", "user": address})
    return data


async def fetch_all_positions(addresses: list[str]) -> dict[str, Any]:
    """Fetch clearinghouse state for all addresses concurrently (semaphore-limited, 429-retried)."""
    async with aiohttp.ClientSession() as session:
        results_list = await asyncio.gather(
            *[_post_with_backoff(session, {"type": "clearinghouseState", "user": addr}) for addr in addresses],
            return_exceptions=True,
        )
    out: dict[str, Any] = {}
    for addr, result in zip(addresses, results_list):
        if isinstance(result, Exception):
            log.warning(f"Failed to fetch positions for {addr[:10]}: {result}")
        else:
            out[addr] = result
    return out


async def get_candles(coin: str, interval: str, start_ms: int, end_ms: int) -> list[dict]:
    async with aiohttp.ClientSession() as session:
        data = await _post(session, {
            "type": "candleSnapshot",
            "req": {"coin": coin, "interval": interval, "startTime": start_ms, "endTime": end_ms},
        })
    return data


async def get_funding_and_oi() -> list[dict]:
    async with aiohttp.ClientSession() as session:
        data = await _post_with_backoff(session, {"type": "metaAndAssetCtxs"})
    meta = data[0]["universe"]
    ctxs = data[1]
    results = []
    for asset, ctx in zip(meta, ctxs):
        results.append({
            "name": asset["name"],
            "funding": float(ctx.get("funding", 0)),
            "open_interest": float(ctx.get("openInterest", 0)),
            "mark_px": float(ctx.get("markPx", 0)),
            "day_volume": float(ctx.get("dayNtlVlm", 0)),
        })
    return results
