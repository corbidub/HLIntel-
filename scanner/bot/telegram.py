import asyncio
import io
from telegram import Bot, InputFile
from telegram.constants import ParseMode
from telegram.error import NetworkError, TimedOut
from telegram.request import HTTPXRequest
import config

_request = HTTPXRequest(
    connection_pool_size=20,
    pool_timeout=30,
    connect_timeout=10,
    read_timeout=30,
    write_timeout=30,
)
_bot = Bot(token=config.TELEGRAM_BOT_TOKEN, request=_request)
_send_lock = asyncio.Lock()


async def _send_with_retry(call, attempts: int = 3) -> None:
    async with _send_lock:
        last_error = None
        for attempt in range(1, attempts + 1):
            try:
                await call()
                return
            except (TimedOut, NetworkError) as error:
                last_error = error
                if attempt == attempts:
                    break
                await asyncio.sleep(2 * attempt)
        raise last_error

async def send_to_free(message: str) -> None:
    await _send_with_retry(
        lambda: _bot.send_message(
            chat_id=config.FREE_CHANNEL_ID,
            text=message,
            parse_mode=ParseMode.HTML,
        )
    )

async def send_to_paid(message: str) -> None:
    await _send_with_retry(
        lambda: _bot.send_message(
            chat_id=config.PAID_CHANNEL_ID,
            text=message,
            parse_mode=ParseMode.HTML,
        )
    )

async def send_alert(message: str, paid_only: bool = False) -> None:
    if paid_only:
        await send_to_paid(message)
    else:
        await send_to_free(message)
        await send_to_paid(message)

async def send_photo_alert(image_bytes: bytes, caption: str, paid_only: bool = False) -> None:
    if paid_only:
        await _send_with_retry(
            lambda: _bot.send_photo(
                chat_id=config.PAID_CHANNEL_ID,
                photo=InputFile(io.BytesIO(image_bytes), filename="alert.png"),
                caption=caption,
                parse_mode=ParseMode.HTML,
            )
        )
    else:
        # Send separately — InputFile can only be read once
        await _send_with_retry(
            lambda: _bot.send_photo(
                chat_id=config.FREE_CHANNEL_ID,
                photo=InputFile(io.BytesIO(image_bytes), filename="alert.png"),
                caption=caption,
                parse_mode=ParseMode.HTML,
            )
        )
        await _send_with_retry(
            lambda: _bot.send_photo(
                chat_id=config.PAID_CHANNEL_ID,
                photo=InputFile(io.BytesIO(image_bytes), filename="alert.png"),
                caption=caption,
                parse_mode=ParseMode.HTML,
            )
        )


async def test_connection() -> None:
    me = await _bot.get_me()
    print(f"Bot connected: @{me.username}")
    await send_to_free("✅ HL Intel bot is online.")
    await send_to_paid("✅ HL Intel Pro channel is online.")
    print("Test messages sent to both channels.")
