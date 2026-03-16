from __future__ import annotations

import logging
from datetime import UTC, datetime

from cachetools import TTLCache
import yfinance as yf

from app.config import get_settings
from app.models import CurrencyExchangeRate

logger = logging.getLogger(__name__)
settings = get_settings()
_forex_cache: TTLCache[str, list[CurrencyExchangeRate]] = TTLCache(maxsize=1, ttl=settings.cache_ttl_seconds)

_PAIR_DISPLAY: dict[str, tuple[str, str]] = {
    "EURUSD=X": ("EUR", "USD"),
    "GBPUSD=X": ("GBP", "USD"),
    "USDJPY=X": ("USD", "JPY"),
    "USDCHF=X": ("USD", "CHF"),
    "AUDUSD=X": ("AUD", "USD"),
    "USDCAD=X": ("USD", "CAD"),
}


def _coerce_float(value: object, default: float = 0.0) -> float:
    try:
        return float(value) if value is not None else default
    except (TypeError, ValueError):
        return default


def _build_rate(symbol: str) -> CurrencyExchangeRate | None:
    ticker = yf.Ticker(symbol)
    info = ticker.info or {}

    rate = _coerce_float(
        info.get("regularMarketPrice")
        or info.get("currentPrice")
        or info.get("previousClose")
    )
    if rate == 0.0:
        return None

    previous_close = _coerce_float(info.get("previousClose"), rate)
    change_percent = ((rate - previous_close) / previous_close * 100) if previous_close != 0.0 else 0.0

    base, target = _PAIR_DISPLAY.get(symbol, (symbol[:3], symbol[3:6]))

    return CurrencyExchangeRate(
        base_currency=base,
        target_currency=target,
        rate=round(rate, 6),
        change_percent=round(change_percent, 2),
        last_updated=datetime.now(UTC).isoformat(),
    )


def get_forex_rates() -> list[CurrencyExchangeRate]:
    cache_key = "forex"
    cached = _forex_cache.get(cache_key)
    if cached:
        return cached

    rates: list[CurrencyExchangeRate] = []
    for pair in settings.forex_pairs:
        try:
            rate = _build_rate(pair)
            if rate:
                rates.append(rate)
        except Exception as exc:  # pragma: no cover - defensive for unreliable public APIs
            logger.warning("Failed to load forex rate for %s: %s", pair, exc)

    _forex_cache[cache_key] = rates
    return rates
