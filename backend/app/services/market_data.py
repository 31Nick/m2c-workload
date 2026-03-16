from __future__ import annotations

import logging
from datetime import UTC, datetime

from cachetools import TTLCache
import yfinance as yf

from app.config import get_settings
from app.models import DashboardResponse, HistoryPoint, MarketSummary, StockHistory, StockOverview

logger = logging.getLogger(__name__)
settings = get_settings()
_overview_cache: TTLCache[str, DashboardResponse] = TTLCache(maxsize=1, ttl=settings.cache_ttl_seconds)
_history_cache: TTLCache[str, StockHistory] = TTLCache(maxsize=32, ttl=settings.cache_ttl_seconds)


def _coerce_float(value: object, default: float = 0.0) -> float:
    try:
        return float(value) if value is not None else default
    except (TypeError, ValueError):
        return default


def _coerce_int(value: object) -> int | None:
    try:
        return int(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def _build_overview(symbol: str) -> StockOverview:
    ticker = yf.Ticker(symbol)
    info = ticker.info or {}

    current_price = _coerce_float(
        info.get("currentPrice")
        or info.get("regularMarketPrice")
        or info.get("previousClose")
    )
    previous_close = _coerce_float(info.get("previousClose"), current_price)
    change = current_price - previous_close
    change_percent = (change / previous_close * 100) if previous_close else 0.0

    company_name = (
        info.get("shortName")
        or info.get("longName")
        or symbol
    )

    return StockOverview(
        symbol=symbol,
        company_name=company_name,
        current_price=round(current_price, 2),
        previous_close=round(previous_close, 2),
        change=round(change, 2),
        change_percent=round(change_percent, 2),
        day_high=_coerce_float(info.get("dayHigh"), 0.0) or None,
        day_low=_coerce_float(info.get("dayLow"), 0.0) or None,
        market_cap=_coerce_int(info.get("marketCap")),
        volume=_coerce_int(info.get("volume") or info.get("regularMarketVolume")),
        currency=info.get("currency") or "USD",
        exchange=info.get("fullExchangeName") or info.get("exchange"),
        logo_text=symbol[:3],
    )


def get_dashboard_data() -> DashboardResponse:
    cache_key = "dashboard"
    cached = _overview_cache.get(cache_key)
    if cached:
        return cached

    stocks: list[StockOverview] = []
    for symbol in settings.top_symbols:
        try:
            stocks.append(_build_overview(symbol))
        except Exception as exc:  # pragma: no cover - defensive for unreliable public APIs
            logger.warning("Failed to load overview for %s: %s", symbol, exc)

    stocks.sort(key=lambda item: item.change_percent, reverse=True)

    market_summary = MarketSummary(
        average_change_percent=round(
            sum(item.change_percent for item in stocks) / len(stocks), 2
        ) if stocks else 0.0,
        advancers=sum(1 for item in stocks if item.change_percent >= 0),
        decliners=sum(1 for item in stocks if item.change_percent < 0),
        total_market_cap=sum(item.market_cap or 0 for item in stocks),
        total_volume=sum(item.volume or 0 for item in stocks),
    )

    response = DashboardResponse(
        generated_at=datetime.now(UTC).isoformat(),
        market_summary=market_summary,
        stocks=stocks,
    )
    _overview_cache[cache_key] = response
    return response


def get_stock_history(symbol: str) -> StockHistory:
    cache_key = symbol.upper()
    cached = _history_cache.get(cache_key)
    if cached:
        return cached

    ticker = yf.Ticker(cache_key)
    history = ticker.history(period=settings.history_period, interval=settings.history_interval)
    info = ticker.info or {}

    points = [
        HistoryPoint(date=index.date(), close=round(float(row["Close"]), 2))
        for index, row in history.iterrows()
        if row.get("Close") is not None
    ]

    response = StockHistory(
        symbol=cache_key,
        company_name=info.get("shortName") or info.get("longName") or cache_key,
        points=points,
    )
    _history_cache[cache_key] = response
    return response
