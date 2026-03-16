from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Tech Stocks Broker Dashboard"
    api_prefix: str = "/api"
    cache_ttl_seconds: int = 300
    top_symbols: list[str] = [
        "AAPL",
        "MSFT",
        "NVDA",
        "GOOGL",
        "AMZN",
        "META",
        "TSLA",
        "AVGO",
        "ORCL",
        "AMD",
    ]
    history_period: str = "1mo"
    history_interval: str = "1d"
    forex_pairs: list[str] = [
        "EURUSD=X",
        "GBPUSD=X",
        "USDJPY=X",
        "USDCHF=X",
        "AUDUSD=X",
        "USDCAD=X",
    ]
    static_dir: Path = Path(__file__).resolve().parent / "static"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="M2C_",
        case_sensitive=False,
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
