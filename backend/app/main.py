from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.services.market_data import get_dashboard_data, get_stock_history
from app.services.forex_data import get_forex_rates

settings = get_settings()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = Path(settings.static_dir)
assets_dir = static_dir / "assets"
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get(f"{settings.api_prefix}/stocks/overview")
def stocks_overview():
    data = get_dashboard_data()
    if not data.stocks:
        raise HTTPException(status_code=503, detail="Unable to retrieve stock data.")
    return data


@app.get(f"{settings.api_prefix}/stocks/history/{{symbol}}")
def stock_history(symbol: str):
    data = get_stock_history(symbol)
    if not data.points:
        raise HTTPException(status_code=404, detail=f"No history found for {symbol}.")
    return data


@app.get(f"{settings.api_prefix}/forex/rates")
def forex_rates():
    data = get_forex_rates()
    if not data:
        raise HTTPException(status_code=503, detail="Unable to retrieve forex rate data.")
    return data


@app.get("/{full_path:path}")
def spa_fallback(full_path: str):
    index_file = static_dir / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="Frontend has not been built yet.")
