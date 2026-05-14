"""
Investing Dashboard — Local FastAPI Backend
-------------------------------------------
Runs on http://127.0.0.1:8765

Endpoints:
  GET  /quotes?tickers=NXE,UUUU,POWL,...  → JSON snapshot
  WS   /ws/prices                          → 30-second streaming quotes

Start:  python backend/server.py
Prereq: pip install fastapi uvicorn httpx
"""

from __future__ import annotations
import asyncio
import json
import logging
from typing import Optional

import httpx
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("dashboard")

app = FastAPI(title="Investing Dashboard Backend", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],     # local dev only — never expose to internet
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ── Default watchlist ────────────────────────────────────────────────────────
DEFAULT_TICKERS = [
    "NXE", "UUUU", "CCJ",    # Uranium
    "POWL", "VRT", "GEV",    # AI Infra
    "NOG", "COP", "XOM",     # E&P / Energy
    "KNTK", "LNG", "WMB",    # LNG / Midstream
    "BEAM", "NTLA", "RXRX",  # Bio-AI / Gene Editing
    "IONQ", "NET",            # Speculative
    "GLD", "SLV",             # Commodities
]

_quote_cache: dict[str, dict] = {}


# ── Core fetch ────────────────────────────────────────────────────────────────
async def _fetch_one(ticker: str, client: httpx.AsyncClient) -> dict:
    """Fetch a single quote from Yahoo Finance v8 chart endpoint."""
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
        "?interval=1d&range=2d&includePrePost=false"
    )
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 Chrome/120 Safari/537.36"
        )
    }
    try:
        r = await client.get(url, headers=headers, timeout=8.0)
        r.raise_for_status()
        data = r.json()
        meta = data["chart"]["result"][0]["meta"]
        price = float(meta.get("regularMarketPrice") or 0)
        prev  = float(meta.get("chartPreviousClose") or meta.get("previousClose") or price)
        chg   = round(price - prev, 2)
        pct   = round(chg / prev * 100, 2) if prev else 0.0
        quote = {
            "ticker":   ticker,
            "price":    round(price, 2),
            "prev":     round(prev,  2),
            "change":   chg,
            "pct":      pct,
            "currency": meta.get("currency", "USD"),
            "exchange": meta.get("exchangeName", ""),
            "ok":       True,
        }
        _quote_cache[ticker] = quote
        return quote
    except Exception as exc:
        log.warning("Failed %s: %s", ticker, exc)
        # Return stale cache if available
        if ticker in _quote_cache:
            stale = dict(_quote_cache[ticker])
            stale["stale"] = True
            return stale
        return {"ticker": ticker, "ok": False, "error": str(exc)}


async def _fetch_batch(tickers: list[str]) -> list[dict]:
    async with httpx.AsyncClient() as client:
        tasks = [_fetch_one(t, client) for t in tickers]
        return list(await asyncio.gather(*tasks))


# ── REST endpoint ─────────────────────────────────────────────────────────────
@app.get("/quotes")
async def get_quotes(
    tickers: Optional[str] = Query(
        None, description="Comma-separated tickers. Defaults to watchlist."
    )
):
    """Snapshot quote for a list of tickers."""
    t_list = [t.strip().upper() for t in tickers.split(",")] if tickers else DEFAULT_TICKERS
    results = await _fetch_batch(t_list)
    return {"quotes": results, "count": len(results)}


@app.get("/health")
async def health():
    return {"status": "ok", "cached_tickers": len(_quote_cache)}


# ── WebSocket streaming ───────────────────────────────────────────────────────
@app.websocket("/ws/prices")
async def price_stream(ws: WebSocket):
    """
    Push live quotes every 30 seconds.
    Client can send JSON: {"tickers": ["NXE","POWL",...]} to override default list.
    """
    await ws.accept()
    tickers = DEFAULT_TICKERS[:]
    log.info("WS connected")
    try:
        while True:
            # Check for ticker override message (non-blocking)
            try:
                msg = await asyncio.wait_for(ws.receive_text(), timeout=0.1)
                payload = json.loads(msg)
                if "tickers" in payload and isinstance(payload["tickers"], list):
                    tickers = [t.upper() for t in payload["tickers"]]
                    log.info("WS ticker list updated: %s", tickers)
            except asyncio.TimeoutError:
                pass
            except Exception:
                pass

            quotes = await _fetch_batch(tickers)
            await ws.send_json({"type": "quotes", "data": quotes})
            await asyncio.sleep(30)

    except WebSocketDisconnect:
        log.info("WS disconnected")
    except Exception as exc:
        log.error("WS error: %s", exc)


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print()
    print("  🚀  Investing Dashboard Backend")
    print("  ─────────────────────────────────")
    print("  REST:  http://127.0.0.1:8765/quotes")
    print("  WS:    ws://127.0.0.1:8765/ws/prices")
    print("  Docs:  http://127.0.0.1:8765/docs")
    print()
    uvicorn.run(
        "server:app",
        host="127.0.0.1",
        port=8765,
        reload=False,
        log_level="info",
    )
