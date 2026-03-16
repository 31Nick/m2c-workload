from datetime import date

from pydantic import BaseModel, Field


class StockOverview(BaseModel):
    symbol: str
    company_name: str
    current_price: float
    previous_close: float
    change: float
    change_percent: float
    day_high: float | None = None
    day_low: float | None = None
    market_cap: int | None = None
    volume: int | None = None
    currency: str = "USD"
    exchange: str | None = None
    logo_text: str = Field(description="Two or three character badge used in the UI")


class HistoryPoint(BaseModel):
    date: date
    close: float


class StockHistory(BaseModel):
    symbol: str
    company_name: str
    points: list[HistoryPoint]


class MarketSummary(BaseModel):
    average_change_percent: float
    advancers: int
    decliners: int
    total_market_cap: int
    total_volume: int


class DashboardResponse(BaseModel):
    generated_at: str
    market_summary: MarketSummary
    stocks: list[StockOverview]
