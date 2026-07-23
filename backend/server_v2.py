"""
Investing Dashboard — Local FastAPI Backend v2
-----------------------------------------------
Runs on http://127.0.0.1:8765

Endpoints:
  GET  /quotes?tickers=NXE,UUUU,...      → stock price snapshot
  GET  /symbol-search?q=barclays         → Yahoo symbol lookup (global equities / ETFs)
  GET  /fx?base=USD&symbols=EUR,JPY,...  → FX rates (via frankfurter.app)
  GET  /macro                            → VIX, 10Y yield, WTI, Gold, Silver, S&P500, …
  POST /game/create                      → fantasy competition + invite_code
  POST /game/join                        → join by invite_code
  GET  /game/{invite_code}               → competition + leaderboard
  GET  /game/{invite_code}/prices        → tradeable asset prices
  POST /game/trade                       → virtual buy/sell
  GET  /player/{player_id}/portfolio     → cash, holdings, P&L
  GET  /player/{player_id}/trades        → trade history
  GET  /player/{player_id}/achievements  → cosmetic badges (server-side rules)
  POST /game/{invite_code}/admin         → commissioner (token): end league, extend date, note, stock split
  GET  /game/{invite_code}/recap         → rolling 7-day league stats (text-friendly)
  GET  /news?query=uranium&count=5       → news headlines (requires NEWS_API_KEY env var)
  GET  /watchlist                        → default tickers + holdings tickers (Supabase)
  GET  /portfolio                        → raw holdings rows
  POST /portfolio                        → add holding (JSON body)
  PUT  /portfolio/{id}                   → update holding
  DELETE /portfolio/{id}                 → remove holding
  GET  /portfolio/snapshot               → enriched holdings, totals, daily P&L %, 30d chart, allocation by type
  GET  /verdict                          → finance rule warnings
  GET  /impulses                          → last N trade impulses (cross_app.impulses, source='trade_router')
  POST /impulses                          → log a trade impulse (ticker, direction, reason)
  PUT  /impulses/{id}                     → mark impulse acted / reviewed
  GET  /moving/snapshot                   → Cadix/moving dashboard export (JSON file)
  POST /cron/daily-cross-app             → write cross_app.daily_snapshot (Bearer CRON_SECRET)
  WS   /ws/prices                        → streaming: stocks + fx + macro every 30s

  GET  /health                           → status

Start:  cd backend && python server_v2.py
Prereq: pip install fastapi uvicorn httpx python-dotenv
"""

from __future__ import annotations
import asyncio
import json
import logging
import os
import secrets
import string
import re
import time as time_module
from collections import Counter
from datetime import date, datetime, timedelta
from typing import Any, Optional
from urllib.parse import quote
from zoneinfo import ZoneInfo

import httpx

try:
    from dotenv import load_dotenv

    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except Exception:
    pass

import openbb_quotes
import uvicorn
from fastapi import Body, FastAPI, Header, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("dashboard_v2")

app = FastAPI(title="Investing Dashboard Backend v2", version="2.0")

_allowed_origins = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "*").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ── Watchlists ───────────────────────────────────────────────────────────────

DEFAULT_TICKERS = [
    "NXE", "UUUU", "DNN", "UROY",          # Uranium
    "POWL", "AAON", "SMCI", "NVDA",         # AI Infra
    "KNTK", "AM", "LNG",                    # LNG / Midstream
    "NOG", "CIVI", "MTDR", "VTLE",          # E&P
    "KTOS", "BWXT", "MRCY",                 # Defence
    "AG", "SVM", "HL", "PAAS",              # Silver
    "BEAM", "NTLA", "ARVN", "KYMR",         # Gene Editing
    "RXRX", "SDGR",                         # Bio-AI
    "MNMD", "CMPS",                         # Psychedelics
    "HEI", "TDG", "AIR",                    # MRO
]

MACRO_SYMBOLS = {
    "VIX":    "^VIX",
    "TNX":    "^TNX",     # 10Y yield
    "WTI":    "CL=F",     # Crude Oil
    "GOLD":   "GC=F",     # Gold futures
    "SILVER": "SI=F",     # Silver futures
    "SPX":    "^GSPC",    # S&P 500
    "IWM":    "IWM",      # Russell 2000
    "DXY":    "DX-Y.NYB", # Dollar Index
}

NEWS_API_KEY = os.environ.get("NEWS_API_KEY", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
CRON_SECRET = os.environ.get("CRON_SECRET", "")
INVESTING_MACRO_REGIME = os.environ.get("INVESTING_MACRO_REGIME", "neutral")
MOVING_SNAPSHOT_PATH = os.environ.get(
    "MOVING_SNAPSHOT_PATH",
    os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "data", "moving_snapshot.json")),
)

# ── Caches ───────────────────────────────────────────────────────────────────

_quote_cache:  dict[str, dict] = {}
_macro_cache:  dict[str, dict] = {}
_fx_cache:     dict            = {}
_news_cache:   list            = []
# Last good fantasy prices (Yahoo / CoinGecko) for graceful degradation on reads
_game_fantasy_price_cache: dict[str, dict[str, Any]] = {}
_GAME_PRICE_CACHE_MAX_AGE_SEC = 7 * 24 * 3600

# ── Yahoo Finance helpers ─────────────────────────────────────────────────────

_YH_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 Chrome/124 Safari/537.36"
    )
}


async def _yf_fetch(symbols: list[str], client: httpx.AsyncClient) -> dict[str, dict]:
    """Fetch a batch of symbols from Yahoo Finance v7 quote endpoint."""
    sym_str = ",".join(symbols)
    url = (
        f"https://query1.finance.yahoo.com/v7/finance/quote"
        f"?symbols={sym_str}"
        f"&fields=regularMarketPrice,regularMarketChangePercent,"
        f"regularMarketVolume,regularMarketPreviousClose,shortName"
    )
    try:
        r = await client.get(url, headers=_YH_HEADERS, timeout=10.0)
        r.raise_for_status()
        data = r.json()
        results = {}
        for q in data.get("quoteResponse", {}).get("result", []):
            sym = q.get("symbol", "")
            price = q.get("regularMarketPrice")
            prev  = q.get("regularMarketPreviousClose", price)
            pct   = q.get("regularMarketChangePercent", 0.0)
            vol   = q.get("regularMarketVolume", 0)
            name  = q.get("shortName", sym)
            if price is not None:
                results[sym] = {
                    "ticker": sym,
                    "name":   name,
                    "price":  round(float(price), 2),
                    "prev":   round(float(prev), 2) if prev else round(float(price), 2),
                    "pct":    round(float(pct), 2),
                    "change": round(float(price) - float(prev), 2) if prev else 0.0,
                    "volume": int(vol) if vol else 0,
                    "ok":     True,
                }
        return results
    except Exception as exc:
        log.warning("YF batch failed: %s", exc)
        return {}


async def _yf_fetch_one(ticker: str, client: httpx.AsyncClient) -> dict:
    """Fetch a single ticker from Yahoo v8 chart endpoint (fallback)."""
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
        "?interval=1d&range=2d&includePrePost=false"
    )
    try:
        r = await client.get(url, headers=_YH_HEADERS, timeout=8.0)
        r.raise_for_status()
        d = r.json()
        meta = d["chart"]["result"][0]["meta"]
        price = float(meta.get("regularMarketPrice") or 0)
        prev  = float(meta.get("chartPreviousClose") or meta.get("previousClose") or price)
        chg   = round(price - prev, 2)
        pct   = round(chg / prev * 100, 2) if prev else 0.0
        return {
            "ticker":   ticker,
            "name":     meta.get("shortName", ticker),
            "price":    round(price, 2),
            "prev":     round(prev, 2),
            "pct":      pct,
            "change":   chg,
            "volume":   int(meta.get("regularMarketVolume") or 0),
            "currency": meta.get("currency", "USD"),
            "exchange": meta.get("exchangeName", ""),
            "ok":       True,
        }
    except Exception as exc:
        log.warning("YF v8 failed %s: %s", ticker, exc)
        if ticker in _quote_cache:
            s = dict(_quote_cache[ticker]); s["stale"] = True; return s
        return {"ticker": ticker, "ok": False, "error": str(exc)}


async def _quotes_map(tickers: list[str], client: httpx.AsyncClient) -> dict[str, dict]:
    """Prefer OpenBB (yfinance provider); merge Yahoo for any gaps."""
    t_list = [t.strip().upper() for t in tickers if t.strip()]
    merged: dict[str, dict] = {}
    if openbb_quotes.is_openbb_installed():
        try:
            obb_map = await asyncio.to_thread(openbb_quotes.quote_symbols_sync, t_list)
            merged.update(obb_map)
        except Exception as exc:
            log.warning("OpenBB batch failed: %s", exc)
    missing = [t for t in t_list if t not in merged or not merged.get(t, {}).get("ok")]
    if not missing and merged:
        return merged
    ymap = await _yf_fetch(t_list, client)
    for t, row in ymap.items():
        if t not in merged or not merged.get(t, {}).get("ok"):
            merged[t] = row
    still = [t for t in t_list if t not in merged or not merged.get(t, {}).get("ok")]
    if still:
        tasks = [_yf_fetch_one(t, client) for t in still]
        for q in await asyncio.gather(*tasks):
            merged[q["ticker"]] = q
    return merged


# ── /quotes ───────────────────────────────────────────────────────────────────

@app.get("/quotes")
async def get_quotes(
    tickers: Optional[str] = Query(None, description="Comma-separated tickers")
):
    t_list = [t.strip().upper() for t in tickers.split(",")] if tickers else DEFAULT_TICKERS

    async with httpx.AsyncClient() as client:
        results_map = await _quotes_map(t_list, client)

    _quote_cache.update(results_map)
    return {
        "quotes": [results_map.get(t, {"ticker": t, "ok": False}) for t in t_list],
        "count": len(t_list),
        "source": "openbb+yahoo" if openbb_quotes.is_openbb_installed() else "yahoo",
    }


@app.get("/symbol-search")
async def symbol_search(
    q: str = Query(..., min_length=1, max_length=80, description="Company or ticker fragment"),
    limit: int = Query(25, ge=1, le=40, description="Max Yahoo quote hits"),
):
    """
    Resolve names to Yahoo symbols (US, Europe, Asia, etc.). Use the exact `symbol`
    returned when trading — Yahoo encodes the venue in the suffix (e.g. .BR, .PA, .L).
    """
    qq = q.strip()
    url = (
        "https://query2.finance.yahoo.com/v1/finance/search?"
        f"q={quote(qq, safe='')}&quotesCount={limit}&newsCount=0"
    )
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(url, headers=_YH_HEADERS, timeout=12.0)
            r.raise_for_status()
            data = r.json()
        except Exception as exc:
            log.warning("symbol-search failed: %s", exc)
            raise HTTPException(status_code=502, detail="Symbol search unavailable") from exc

    out: list[dict[str, Any]] = []
    for row in data.get("quotes", []) or []:
        sym = row.get("symbol")
        if not sym or not isinstance(sym, str):
            continue
        out.append(
            {
                "symbol": sym.strip(),
                "name": row.get("shortname") or row.get("longname") or sym,
                "exchange": row.get("exchange") or "",
                "type": row.get("quoteType") or "",
            }
        )
        if len(out) >= limit:
            break
    return {"ok": True, "query": qq, "results": out}


# ── /macro ────────────────────────────────────────────────────────────────────

@app.get("/macro")
async def get_macro():
    """Fetch macro indicators: VIX, 10Y yield, WTI, Gold, Silver, S&P500, IWM, DXY."""
    symbols = list(MACRO_SYMBOLS.values())
    async with httpx.AsyncClient() as client:
        results_map = await _quotes_map(symbols, client)

    macro = {}
    for label, sym in MACRO_SYMBOLS.items():
        q = results_map.get(sym)
        if q:
            macro[label] = {
                "label":  label,
                "symbol": sym,
                "value":  q["price"],
                "pct":    q["pct"],
                "change": q["change"],
                "ok":     True,
            }
            _macro_cache[label] = macro[label]
        elif label in _macro_cache:
            stale = dict(_macro_cache[label]); stale["stale"] = True
            macro[label] = stale
        else:
            macro[label] = {"label": label, "symbol": sym, "ok": False}

    return {"macro": macro}


# ── /fx ───────────────────────────────────────────────────────────────────────

@app.get("/fx")
async def get_fx(
    base: str = Query("USD", description="Base currency"),
    symbols: Optional[str] = Query(
        "EUR,GBP,JPY,CHF,CAD,AUD", description="Comma-separated target currencies"
    ),
):
    """
    Fetch FX rates via frankfurter.app (free, no key required).
    Falls back to stale cache on failure.
    """
    targets = symbols.upper() if symbols else "EUR,GBP,JPY,CHF,CAD,AUD"
    url = f"https://api.frankfurter.app/latest?from={base.upper()}&to={targets}"
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(url, timeout=8.0)
            r.raise_for_status()
            data = r.json()
        rates = data.get("rates", {})
        result = {
            "base": base.upper(),
            "date": data.get("date", ""),
            "rates": rates,
            "ok": True,
        }
        _fx_cache.update(result)
        return result
    except Exception as exc:
        log.warning("FX fetch failed: %s", exc)
        if _fx_cache:
            stale = dict(_fx_cache); stale["stale"] = True; return stale
        return {"base": base.upper(), "ok": False, "error": str(exc)}


# ── /news ─────────────────────────────────────────────────────────────────────

@app.get("/news")
async def get_news(
    query: str = Query("uranium nuclear energy stocks", description="Search query"),
    count: int = Query(5, description="Number of headlines", ge=1, le=20),
):
    """
    Fetch news via NewsAPI.org. Requires NEWS_API_KEY environment variable.
    Without a key, returns a scaffold response with setup instructions.
    """
    if not NEWS_API_KEY:
        return {
            "ok": False,
            "error": "NEWS_API_KEY not set",
            "setup": (
                "Get a free key at https://newsapi.org (100 requests/day). "
                "Then set the NEWS_API_KEY environment variable before starting the server: "
                "Windows: set NEWS_API_KEY=your_key_here && python server_v2.py"
            ),
            "articles": [],
        }

    url = "https://newsapi.org/v2/everything"
    params = {
        "q": query,
        "apiKey": NEWS_API_KEY,
        "pageSize": count,
        "sortBy": "publishedAt",
        "language": "en",
    }
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(url, params=params, timeout=10.0)
            r.raise_for_status()
            data = r.json()
        articles = [
            {
                "title":       a.get("title", ""),
                "source":      a.get("source", {}).get("name", ""),
                "url":         a.get("url", ""),
                "publishedAt": a.get("publishedAt", ""),
                "description": a.get("description", ""),
            }
            for a in data.get("articles", [])[:count]
        ]
        result = {"ok": True, "query": query, "articles": articles, "count": len(articles)}
        _news_cache.clear()
        _news_cache.extend(articles)
        return result
    except Exception as exc:
        log.warning("News fetch failed: %s", exc)
        if _news_cache:
            return {"ok": True, "articles": _news_cache, "stale": True}
        return {"ok": False, "error": str(exc), "articles": []}


# ── Supabase portfolio + cross-app snapshot ───────────────────────────────────


def _supabase_client() -> Any | None:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return None
    try:
        from supabase import create_client

        return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    except Exception as exc:
        log.warning("Supabase client init failed: %s", exc)
        return None


def _holdings_list_sync() -> list[dict[str, Any]]:
    c = _supabase_client()
    if not c:
        return []
    try:
        r = c.table("holdings").select("*").order("created_at", desc=True).execute()
        return list(r.data or [])
    except Exception as exc:
        log.warning("holdings select failed: %s", exc)
        return []


def _holding_insert_sync(payload: dict[str, Any]) -> dict[str, Any]:
    c = _supabase_client()
    if not c:
        raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured")
    row = {
        "ticker": payload["ticker"].strip().upper(),
        "quantity": float(payload["quantity"]),
        "cost_price": float(payload["cost_price"]),
        "currency": (payload.get("currency") or "USD").upper()[:8],
        "account": (payload.get("account") or "default")[:64],
        "position_type": (payload.get("position_type") or "equity")[:16],
        "sector": payload.get("sector"),
        "notes": payload.get("notes"),
    }
    r = c.table("holdings").insert(row).execute()
    data = r.data
    return data[0] if data else row


def _holding_delete_sync(hid: str) -> None:
    c = _supabase_client()
    if not c:
        raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured")
    c.table("holdings").delete().eq("id", hid).execute()


def _holding_update_sync(hid: str, payload: dict[str, Any]) -> dict[str, Any]:
    c = _supabase_client()
    if not c:
        raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured")
    updates: dict[str, Any] = {}
    if "ticker" in payload and payload["ticker"]:
        updates["ticker"] = str(payload["ticker"]).strip().upper()
    if "quantity" in payload:
        updates["quantity"] = float(payload["quantity"])
    if "cost_price" in payload:
        updates["cost_price"] = float(payload["cost_price"])
    if "currency" in payload:
        updates["currency"] = str(payload["currency"] or "USD").upper()[:8]
    if "account" in payload:
        updates["account"] = str(payload["account"] or "default")[:64]
    if "position_type" in payload:
        updates["position_type"] = str(payload["position_type"] or "equity")[:16]
    if "sector" in payload:
        updates["sector"] = payload["sector"]
    if "notes" in payload:
        updates["notes"] = payload["notes"]
    if not updates:
        r = c.table("holdings").select("*").eq("id", hid).execute()
        rows = r.data or []
        return rows[0] if rows else {}
    r = c.table("holdings").update(updates).eq("id", hid).execute()
    data = r.data
    return data[0] if data else {**updates, "id": hid}


async def _cross_app_upsert_daily(date_str: str, regime: str | None, pnl_pct: float | None) -> bool:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        log.warning("cross_app upsert skipped — no Supabase credentials")
        return False
    # Writes to public.daily_snapshot view (INSTEAD OF INSERT trigger upserts into cross_app schema).
    # COALESCE in the trigger means only non-null fields overwrite existing values.
    base = f"{SUPABASE_URL}/rest/v1/daily_snapshot"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    body: dict[str, Any] = {"date": date_str}
    if regime is not None:
        body["regime"] = regime
    if pnl_pct is not None:
        body["pnl_pct"] = pnl_pct
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(base, headers=headers, json=body, timeout=15.0)
            ok = r.status_code in (200, 201, 204)
            if not ok:
                log.warning("cross_app POST HTTP %s: %s", r.status_code, r.text[:200])
            return ok
    except Exception as exc:
        log.warning("cross_app upsert failed: %s", exc)
        return False


# ── Trade impulse router (cross_app.impulses, source='trade_router') ─────────
# Raw REST (not supabase-py) because impulses lives in the cross_app schema,
# not public — PostgREST needs the Accept-Profile / Content-Profile headers.

_CROSS_APP_AUTH_HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}


async def _impulses_list(limit: int = 5, source: str = "trade_router") -> list[dict[str, Any]]:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return []
    headers = {**_CROSS_APP_AUTH_HEADERS, "Accept-Profile": "cross_app"}
    params = f"source=eq.{quote(source)}&select=*&order=created_at.desc&limit={int(limit)}"
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{SUPABASE_URL}/rest/v1/impulses?{params}", headers=headers, timeout=15.0)
            if r.status_code != 200:
                log.warning("impulses list HTTP %s: %s", r.status_code, r.text[:200])
                return []
            return r.json()
    except Exception as exc:
        log.warning("impulses list failed: %s", exc)
        return []


async def _impulse_insert(ticker: str, direction: str | None, reason: str | None) -> dict[str, Any] | None:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return None
    headers = {**_CROSS_APP_AUTH_HEADERS, "Content-Profile": "cross_app", "Prefer": "return=representation"}
    body = {"source": "trade_router", "ticker": ticker, "direction": direction, "reason": reason}
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(f"{SUPABASE_URL}/rest/v1/impulses", headers=headers, json=body, timeout=15.0)
            if r.status_code not in (200, 201):
                log.warning("impulse insert HTTP %s: %s", r.status_code, r.text[:200])
                return None
            data = r.json()
            return data[0] if isinstance(data, list) and data else None
    except Exception as exc:
        log.warning("impulse insert failed: %s", exc)
        return None


async def _impulse_update(impulse_id: str, patch: dict[str, Any]) -> bool:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return False
    headers = {**_CROSS_APP_AUTH_HEADERS, "Content-Profile": "cross_app", "Prefer": "return=minimal"}
    try:
        async with httpx.AsyncClient() as client:
            r = await client.patch(
                f"{SUPABASE_URL}/rest/v1/impulses?id=eq.{quote(str(impulse_id))}",
                headers=headers,
                json=patch,
                timeout=15.0,
            )
            return r.status_code in (200, 204)
    except Exception as exc:
        log.warning("impulse update failed: %s", exc)
        return False


@app.get("/watchlist")
async def get_watchlist():
    rows = await asyncio.to_thread(_holdings_list_sync)
    extra = [str(r.get("ticker", "")).upper() for r in rows if r.get("ticker")]
    merged = list(dict.fromkeys(DEFAULT_TICKERS + extra))
    return {"tickers": merged, "supabase": bool(_supabase_client())}


@app.get("/portfolio")
async def portfolio_list():
    rows = await asyncio.to_thread(_holdings_list_sync)
    return {"ok": True, "holdings": rows, "supabase": bool(_supabase_client())}


@app.post("/portfolio")
async def portfolio_add(body: dict[str, Any] = Body(...)):
    try:
        row = await asyncio.to_thread(_holding_insert_sync, body)
        return {"ok": True, "holding": row}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


@app.delete("/portfolio/{holding_id}")
async def portfolio_delete(holding_id: str):
    try:
        await asyncio.to_thread(_holding_delete_sync, holding_id)
        return {"ok": True}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


@app.put("/portfolio/{holding_id}")
async def portfolio_update(holding_id: str, body: dict[str, Any] = Body(...)):
    try:
        row = await asyncio.to_thread(_holding_update_sync, holding_id, body)
        return {"ok": True, "holding": row}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


def _merge_price_series(
    per_ticker: list[tuple[str, list[dict[str, Any]], float]],
) -> list[dict[str, Any]]:
    """per_ticker: (ticker, [{date, close},...], quantity)"""
    date_map: dict[str, float] = {}
    for t, series, qty in per_ticker:
        for pt in series:
            d = pt["date"]
            date_map[d] = date_map.get(d, 0.0) + float(pt["close"]) * qty
    out = [{"date": d, "total_mv": round(v, 2)} for d, v in sorted(date_map.items())]
    return out[-31:]


@app.get("/portfolio/snapshot")
async def portfolio_snapshot():
    rows = await asyncio.to_thread(_holdings_list_sync)
    if not rows:
        return {
            "ok": True,
            "holdings": [],
            "total_mv": 0.0,
            "total_cost": 0.0,
            "total_pnl": 0.0,
            "daily_pnl_pct": None,
            "allocation_by_type": {},
            "chart_30d": [],
        }

    tickers = [str(r["ticker"]).strip().upper() for r in rows]
    async with httpx.AsyncClient() as client:
        qm = await _quotes_map(tickers, client)

    total_mv = 0.0
    total_cost = 0.0
    total_prev = 0.0
    enriched: list[dict[str, Any]] = []
    for r in rows:
        t = str(r["ticker"]).strip().upper()
        qty = float(r["quantity"])
        cost = float(r["cost_price"])
        q = qm.get(t, {})
        price = float(q.get("price") or 0)
        prev = float(q.get("prev") or price or 0)
        mv = qty * price
        cb = qty * cost
        prev_mv = qty * prev
        total_mv += mv
        total_cost += cb
        total_prev += prev_mv
        enriched.append(
            {
                **r,
                "live_price": price,
                "market_value": round(mv, 2),
                "cost_basis": round(cb, 2),
                "pnl": round(mv - cb, 2),
                "pnl_pct": round((mv - cb) / cb * 100, 2) if cb else None,
            }
        )

    daily_pnl_pct = None
    if total_prev > 0:
        daily_pnl_pct = round((total_mv - total_prev) / total_prev * 100, 3)

    allocation_by_type: dict[str, float] = {}
    if total_mv > 0:
        for h in enriched:
            pt = str(h.get("position_type") or "other")
            mv = float(h.get("market_value") or 0)
            allocation_by_type[pt] = allocation_by_type.get(pt, 0.0) + mv / total_mv * 100.0
        allocation_by_type = {k: round(v, 2) for k, v in sorted(allocation_by_type.items())}

    chart_30d: list[dict[str, Any]] = []
    if openbb_quotes.is_openbb_installed():
        end = date.today()
        start = end - timedelta(days=40)
        s0, s1 = str(start), str(end)
        sem = asyncio.Semaphore(4)

        async def one(sym: str, qty: float) -> tuple[str, list[dict[str, Any]], float]:
            async with sem:
                series = await asyncio.to_thread(openbb_quotes.historical_close_sync, sym, s0, s1)
                return sym, series, qty

        tasks = []
        for r in rows:
            if (r.get("position_type") or "equity") != "equity":
                continue
            sym = str(r["ticker"]).strip().upper()
            qty = float(r["quantity"])
            tasks.append(one(sym, qty))
        if tasks:
            parts = await asyncio.gather(*tasks)
            chart_30d = _merge_price_series(parts)

    return {
        "ok": True,
        "holdings": enriched,
        "total_mv": round(total_mv, 2),
        "total_cost": round(total_cost, 2),
        "total_pnl": round(total_mv - total_cost, 2),
        "daily_pnl_pct": daily_pnl_pct,
        "allocation_by_type": allocation_by_type,
        "chart_30d": chart_30d,
    }


@app.get("/verdict")
async def finance_verdict():
    snap = await portfolio_snapshot()
    if not snap.get("ok"):
        return snap
    rows = snap.get("holdings") or []
    total_mv = float(snap.get("total_mv") or 0)
    warnings: list[dict[str, Any]] = []

    if total_mv <= 0:
        return {"ok": True, "warnings": [{"level": "info", "code": "NO_VALUE", "message": "No market value to score."}]}

    weights = [float(h.get("market_value", 0) or 0) / total_mv * 100 for h in rows]
    if weights:
        mx = max(weights)
        top = rows[int(max(range(len(weights)), key=lambda i: weights[i]))]
        if mx > 25:
            warnings.append(
                {
                    "level": "danger",
                    "code": "CONCENTRATION",
                    "message": f"Largest position {top.get('ticker')} is {mx:.1f}% (>25%).",
                }
            )

    by_sector: dict[str, float] = {}
    for h in rows:
        sec = str(h.get("sector") or "Other")
        by_sector[sec] = by_sector.get(sec, 0.0) + float(h.get("market_value") or 0)
    for sec, mv in by_sector.items():
        if total_mv > 0 and mv / total_mv > 0.45:
            warnings.append(
                {
                    "level": "warn",
                    "code": "SECTOR_OVERWEIGHT",
                    "message": f"Sector {sec!r} is {mv/total_mv*100:.1f}% of portfolio (>45%).",
                }
            )

    cash_mv = sum(float(h.get("market_value") or 0) for h in rows if (h.get("position_type") or "") == "cash")
    if total_mv > 0 and cash_mv / total_mv > 0.20:
        warnings.append(
            {
                "level": "warn",
                "code": "CASH_DRAG",
                "message": f"Cash-like positions are {cash_mv/total_mv*100:.1f}% of NAV (>20%).",
            }
        )

    tc = float(snap.get("total_cost") or 0)
    tpl = float(snap.get("total_pnl") or 0)
    if tc > 0 and tpl / tc < -0.10:
        warnings.append(
            {
                "level": "danger",
                "code": "DRAWDOWN",
                "message": f"Total P&L vs cost is {tpl/tc*100:.1f}% (worse than -10%).",
            }
        )

    if not warnings:
        warnings.append({"level": "ok", "code": "CLEAR", "message": "No finance verdict flags triggered."})

    return {"ok": True, "warnings": warnings, "snapshot": {k: snap[k] for k in ("total_mv", "total_cost", "daily_pnl_pct") if k in snap}}


@app.post("/cron/daily-cross-app")
async def cron_daily_cross_app(authorization: Optional[str] = Header(None)):
    """Call from Windows Task Scheduler ~17:00 with Authorization: Bearer <CRON_SECRET>."""
    if CRON_SECRET:
        if authorization != f"Bearer {CRON_SECRET}":
            raise HTTPException(status_code=401, detail="Unauthorized")
    snap = await portfolio_snapshot()
    d = date.today().isoformat()
    regime = INVESTING_MACRO_REGIME
    pnl = snap.get("daily_pnl_pct")
    ok = await _cross_app_upsert_daily(d, regime, pnl)
    return {"ok": ok, "date": d, "regime": regime, "portfolio_pnl_pct": pnl}


@app.get("/impulses")
async def impulses_list(limit: int = Query(5, ge=1, le=50)):
    """Last N trade impulses (cross_app.impulses, source='trade_router')."""
    rows = await _impulses_list(limit=limit)
    return {"ok": True, "impulses": rows, "supabase": bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)}


@app.post("/impulses")
async def impulses_add(body: dict[str, Any] = Body(...)):
    """Log a trade impulse — 'I want to trade' button in the dashboard header."""
    ticker = str(body.get("ticker") or "").strip().upper()
    if not ticker:
        return {"ok": False, "error": "ticker is required"}
    direction = (body.get("direction") or None)
    reason = (body.get("reason") or None)
    row = await _impulse_insert(ticker, direction, reason)
    if row is None:
        return {"ok": False, "error": "Supabase not configured or insert failed — see backend logs"}
    return {"ok": True, "impulse": row}


@app.put("/impulses/{impulse_id}")
async def impulses_update(impulse_id: str, body: dict[str, Any] = Body(...)):
    """Mark an impulse acted / reviewed."""
    patch: dict[str, Any] = {}
    if "acted" in body:
        patch["acted"] = bool(body["acted"])
    if "reviewed_at" in body:
        patch["reviewed_at"] = body["reviewed_at"]
    if not patch:
        return {"ok": False, "error": "nothing to update — pass acted and/or reviewed_at"}
    ok = await _impulse_update(impulse_id, patch)
    return {"ok": ok}


@app.get("/moving/snapshot")
async def moving_snapshot():
    """Cadix / Antwerpen moving decision export from Prive/moving property_scanner."""
    path = MOVING_SNAPSHOT_PATH
    if not os.path.isfile(path):
        raise HTTPException(
            status_code=404,
            detail=f"No moving snapshot at {path}. Run: python Prive/moving/property_scanner.py",
        )
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"ok": True, "path": path, "snapshot": data}


# ── Fantasy game (Supabase: competitions, players, trades) ────────────────────

GAME_CRYPTO_TICKERS = ("BTC", "ETH", "SOL", "XRP", "DOGE", "AVAX", "LINK")
GAME_CRYPTO_COINGECKO_IDS = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "XRP": "ripple",
    "DOGE": "dogecoin",
    "AVAX": "avalanche-2",
    "LINK": "chainlink",
}
GAME_COMMODITY_TICKERS = ("GC=F", "SI=F", "CL=F")
_INVITE_ALPHABET = "".join(c for c in (string.ascii_uppercase + string.digits) if c not in "0O1IL")


def _game_random_invite_code() -> str:
    return "".join(secrets.choice(_INVITE_ALPHABET) for _ in range(8))


_game_rate_buckets: dict[str, list[float]] = {}


def _game_client_ip(request: Request) -> str:
    xf = request.headers.get("x-forwarded-for")
    if xf:
        return xf.split(",")[0].strip() or "unknown"
    if request.client:
        return request.client.host or "unknown"
    return "unknown"


def _game_rate_allow(ip: str, max_events: int = 50) -> bool:
    """Sliding window ~60s per IP for join/trade/create."""
    now = time_module.time()
    bucket = _game_rate_buckets.setdefault(ip, [])
    bucket[:] = [t for t in bucket if now - t < 60.0]
    if len(bucket) >= max_events:
        return False
    bucket.append(now)
    return True


def _game_sanitize_display_name(raw: str) -> str:
    s = re.sub(r"[\x00-\x1f<>]", "", (raw or "").strip())
    return s[:64] if s else ""


def _game_public_competition(comp: dict[str, Any]) -> dict[str, Any]:
    out = dict(comp)
    out.pop("commissioner_token", None)
    return out


def _game_us_rth_open() -> bool:
    try:
        now = datetime.now(ZoneInfo("America/New_York"))
    except Exception:
        return True
    if now.weekday() >= 5:
        return False
    minutes = now.hour * 60 + now.minute
    return (9 * 60 + 30) <= minutes < (16 * 60)


def _game_ticker_us_rth_restricted(ticker: str, asset_type: str) -> bool:
    if (asset_type or "").lower() != "stock":
        return False
    t = (ticker or "").strip().upper()
    if "." in t or "=" in t or len(t) > 5:
        return False
    return bool(re.match(r"^[A-Z]{1,5}$", t))


def _game_time_window_ok(comp: dict[str, Any], ticker: str, asset_type: str) -> tuple[bool, str]:
    mode = str(comp.get("trading_hours_mode") or "always").lower()
    if mode != "us_rth":
        return True, ""
    if not _game_ticker_us_rth_restricted(ticker, asset_type):
        return True, ""
    if _game_us_rth_open():
        return True, ""
    return False, "US stocks (no exchange suffix): trading only Mon–Fri 9:30–16:00 Eastern"


def _game_corp_splits_sync(comp_id: str) -> list[dict[str, Any]]:
    c = _supabase_client()
    if not c:
        return []
    try:
        r = (
            c.table("corporate_actions")
            .select("*")
            .eq("competition_id", comp_id)
            .order("effective_at", desc=False)
            .execute()
        )
        return list(r.data or [])
    except Exception as exc:
        log.warning("corp_actions load failed (run supabase migration?): %s", exc)
        return []


def _game_split_mult_at_trade_time(executed_at: Any, ticker: str, splits: list[dict[str, Any]]) -> float:
    """Scale historical share counts into current share equivalents (stock splits)."""
    if not splits:
        return 1.0
    tk = (ticker or "").strip().upper()
    try:
        if executed_at is None:
            t_trade = datetime.now(tz=ZoneInfo("UTC"))
        elif isinstance(executed_at, datetime):
            t_trade = executed_at if executed_at.tzinfo else executed_at.replace(tzinfo=ZoneInfo("UTC"))
        else:
            s = str(executed_at).replace("Z", "+00:00")
            t_trade = datetime.fromisoformat(s[:26]) if len(s) > 10 else datetime.now(tz=ZoneInfo("UTC"))
    except Exception:
        t_trade = datetime.now(tz=ZoneInfo("UTC"))
    mult = 1.0
    for s in splits:
        if str(s.get("ticker", "")).strip().upper() != tk:
            continue
        eff = s.get("effective_at")
        try:
            if isinstance(eff, datetime):
                t_eff = eff if eff.tzinfo else eff.replace(tzinfo=ZoneInfo("UTC"))
            else:
                es = str(eff).replace("Z", "+00:00")
                t_eff = datetime.fromisoformat(es[:26])
        except Exception:
            continue
        if t_trade < t_eff:
            frm = float(s.get("from_shares") or 1) or 1.0
            to = float(s.get("to_shares") or 1) or 1.0
            mult *= to / frm
    return mult


def _game_parse_date(val: Any) -> date:
    if isinstance(val, date):
        return val
    s = str(val)[:10]
    return date.fromisoformat(s)


def _game_competition_effective_status(comp: dict[str, Any]) -> str:
    if comp.get("status") == "ended":
        return "ended"
    try:
        if date.today() > _game_parse_date(comp.get("end_date")):
            return "ended"
    except Exception:
        pass
    return str(comp.get("status") or "active")


def _game_sync_close_competition_if_due(comp_id: str, comp: dict[str, Any]) -> dict[str, Any]:
    if _game_competition_effective_status(comp) != "ended" or comp.get("status") == "ended":
        return comp
    c = _supabase_client()
    if not c:
        return comp
    try:
        c.table("competitions").update({"status": "ended"}).eq("id", comp_id).execute()
        comp = {**comp, "status": "ended"}
    except Exception as exc:
        log.warning("game close competition failed: %s", exc)
    return comp


def _game_competition_insert_sync(body: dict[str, Any]) -> dict[str, Any]:
    c = _supabase_client()
    if not c:
        raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured")
    name = str(body.get("name") or "").strip()
    if not name:
        raise ValueError("name is required")
    start_date = body.get("start_date")
    end_date = body.get("end_date")
    if not start_date or not end_date:
        raise ValueError("start_date and end_date are required")
    sd = _game_parse_date(start_date)
    ed = _game_parse_date(end_date)
    if ed < sd:
        raise ValueError("end_date must be on or after start_date")
    starting_capital = float(body.get("starting_capital") or 100_000)
    if starting_capital <= 0:
        raise ValueError("starting_capital must be positive")
    note = body.get("note")
    note_s = str(note).strip()[:2000] if note is not None else None
    max_players = body.get("max_players")
    max_p = int(max_players) if max_players not in (None, "",) else None
    if max_p is not None and max_p < 1:
        raise ValueError("max_players must be at least 1")
    fee_bps = int(body.get("fee_bps") or 0)
    slip_bps = int(body.get("slippage_bps") or 0)
    if fee_bps < 0 or fee_bps > 500:
        raise ValueError("fee_bps must be between 0 and 500 (5%)")
    if slip_bps < 0 or slip_bps > 500:
        raise ValueError("slippage_bps must be between 0 and 500")
    max_pos = body.get("max_position_pct")
    max_pos_f = float(max_pos) if max_pos not in (None, "") else None
    if max_pos_f is not None and (max_pos_f <= 0 or max_pos_f > 100):
        raise ValueError("max_position_pct must be between 0 and 100")
    th_mode = str(body.get("trading_hours_mode") or "always").lower()
    if th_mode not in ("always", "us_rth"):
        raise ValueError("trading_hours_mode must be 'always' or 'us_rth'")
    margin_en = bool(body.get("margin_enabled"))
    lev = float(body.get("leverage_max") or 2)
    if lev < 1:
        raise ValueError("leverage_max must be >= 1")
    if lev > 10:
        raise ValueError("leverage_max cannot exceed 10")
    comm_tok = secrets.token_urlsafe(32)
    for _attempt in range(12):
        code = _game_random_invite_code()
        row: dict[str, Any] = {
            "name": name,
            "invite_code": code,
            "starting_capital": starting_capital,
            "start_date": sd.isoformat(),
            "end_date": ed.isoformat(),
            "status": "active",
            "commissioner_token": comm_tok,
            "fee_bps": fee_bps,
            "slippage_bps": slip_bps,
            "trading_hours_mode": th_mode,
            "margin_enabled": margin_en,
            "leverage_max": lev,
        }
        if note_s:
            row["note"] = note_s
        if max_p is not None:
            row["max_players"] = max_p
        if max_pos_f is not None:
            row["max_position_pct"] = max_pos_f
        try:
            r = c.table("competitions").insert(row).execute()
            data = r.data or []
            if data:
                return data[0]
        except Exception as exc:
            if "duplicate" in str(exc).lower() or "unique" in str(exc).lower():
                continue
            raise
    raise RuntimeError("Could not allocate a unique invite_code")


def _game_competition_by_invite_sync(invite_code: str) -> dict[str, Any] | None:
    c = _supabase_client()
    if not c:
        return None
    code = invite_code.strip().upper()
    try:
        r = c.table("competitions").select("*").eq("invite_code", code).limit(1).execute()
        rows = r.data or []
        return rows[0] if rows else None
    except Exception as exc:
        log.warning("game competition fetch failed: %s", exc)
        return None


def _game_player_insert_sync(comp_id: str, display_name: str, cash: float) -> dict[str, Any]:
    c = _supabase_client()
    if not c:
        raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured")
    dn = _game_sanitize_display_name(display_name)
    if not dn:
        raise ValueError("display_name is required")
    row = {"competition_id": comp_id, "display_name": dn, "cash_balance": float(cash)}
    r = c.table("players").insert(row).execute()
    data = r.data or []
    if not data:
        raise RuntimeError("player insert returned no row")
    return data[0]


def _game_player_by_id_sync(pid: str) -> dict[str, Any] | None:
    c = _supabase_client()
    if not c:
        return None
    try:
        r = c.table("players").select("*").eq("id", pid).limit(1).execute()
        rows = r.data or []
        return rows[0] if rows else None
    except Exception as exc:
        log.warning("game player fetch failed: %s", exc)
        return None


def _game_players_by_competition_sync(comp_id: str) -> list[dict[str, Any]]:
    c = _supabase_client()
    if not c:
        return []
    try:
        r = (
            c.table("players")
            .select("*")
            .eq("competition_id", comp_id)
            .order("joined_at", desc=False)
            .execute()
        )
        return list(r.data or [])
    except Exception as exc:
        log.warning("game players list failed: %s", exc)
        return []


def _game_trades_for_competition_sync(comp_id: str) -> list[dict[str, Any]]:
    c = _supabase_client()
    if not c:
        return []
    try:
        r = c.table("trades").select("*").eq("competition_id", comp_id).execute()
        return list(r.data or [])
    except Exception as exc:
        log.warning("game trades list failed: %s", exc)
        return []


def _game_trades_for_player_sync(pid: str) -> list[dict[str, Any]]:
    c = _supabase_client()
    if not c:
        return []
    try:
        r = (
            c.table("trades")
            .select("*")
            .eq("player_id", pid)
            .order("executed_at", desc=False)
            .execute()
        )
        return list(r.data or [])
    except Exception as exc:
        log.warning("game player trades failed: %s", exc)
        return []


def _game_holdings_from_trades(
    trades: list[dict[str, Any]], pid: str, comp_id: str | None = None
) -> dict[tuple[str, str], float]:
    """Aggregate (ticker, asset_type) -> quantity; optional split-adjust for stocks when comp_id set."""
    splits: list[dict[str, Any]] = _game_corp_splits_sync(comp_id) if comp_id else []
    pos: dict[tuple[str, str], float] = {}
    subset = [t for t in trades if str(t.get("player_id")) == pid]
    subset.sort(key=lambda x: str(x.get("executed_at") or x.get("id") or ""))
    for t in subset:
        key = (str(t.get("ticker", "")).strip().upper(), str(t.get("asset_type", "")).strip().lower())
        q_raw = float(t.get("quantity") or 0)
        ast = key[1]
        adj = (
            _game_split_mult_at_trade_time(t.get("executed_at"), key[0], splits)
            if comp_id and ast == "stock"
            else 1.0
        )
        q = q_raw * adj
        if t.get("direction") == "buy":
            pos[key] = pos.get(key, 0.0) + q
        elif t.get("direction") == "sell":
            pos[key] = pos.get(key, 0.0) - q
    return {k: v for k, v in pos.items() if v > 1e-12}


def _game_insert_trade_sync(
    player_id: str,
    competition_id: str,
    ticker: str,
    asset_type: str,
    direction: str,
    quantity: float,
    price_at_trade: float,
    total_value: float,
    fee_paid: float = 0.0,
) -> dict[str, Any]:
    c = _supabase_client()
    if not c:
        raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured")
    row = {
        "player_id": player_id,
        "competition_id": competition_id,
        "ticker": ticker,
        "asset_type": asset_type,
        "direction": direction,
        "quantity": quantity,
        "price_at_trade": price_at_trade,
        "total_value": total_value,
        "fee_paid": round(float(fee_paid), 4),
    }
    r = c.table("trades").insert(row).execute()
    data = r.data or []
    return data[0] if data else row


def _game_trade_by_id_sync(trade_id: str) -> dict[str, Any] | None:
    c = _supabase_client()
    if not c:
        return None
    try:
        r = c.table("trades").select("*").eq("id", trade_id).limit(1).execute()
        rows = r.data or []
        return rows[0] if rows else None
    except Exception as exc:
        log.warning("trade by id failed: %s", exc)
        return None


def _game_idempo_get_sync(player_id: str, client_request_id: str) -> str | None:
    c = _supabase_client()
    if not c:
        return None
    try:
        r = (
            c.table("trade_idempotency")
            .select("trade_id")
            .eq("player_id", player_id)
            .eq("client_request_id", client_request_id)
            .limit(1)
            .execute()
        )
        rows = r.data or []
        return str(rows[0]["trade_id"]) if rows else None
    except Exception as exc:
        log.warning("idempotency read failed (migration applied?): %s", exc)
        return None


def _game_idempo_put_sync(player_id: str, client_request_id: str, trade_id: str) -> None:
    c = _supabase_client()
    if not c:
        return
    try:
        c.table("trade_idempotency").insert(
            {"player_id": player_id, "client_request_id": client_request_id, "trade_id": trade_id}
        ).execute()
    except Exception as exc:
        log.warning("idempotency write failed: %s", exc)


def _game_update_player_cash_optimistic_sync(player_id: str, expected_cash: float, new_cash: float) -> bool:
    c = _supabase_client()
    if not c:
        return False
    try:
        r = (
            c.table("players")
            .update({"cash_balance": round(float(new_cash), 2)})
            .eq("id", player_id)
            .eq("cash_balance", round(float(expected_cash), 2))
            .execute()
        )
        return bool(r.data)
    except Exception as exc:
        log.warning("game cash update failed: %s", exc)
        return False


def _game_price_cache_key(asset_type: str, ticker: str) -> str:
    return f"{(asset_type or '').lower()}:{(ticker or '').strip().upper()}"


def _game_cache_price_put(asset_type: str, ticker: str, price: float, **kwargs: Any) -> None:
    key = _game_price_cache_key(asset_type, ticker)
    _game_fantasy_price_cache[key] = {"price": float(price), "ts": time_module.time(), **kwargs}


def _game_cache_price_get(asset_type: str, ticker: str) -> dict[str, Any] | None:
    return _game_fantasy_price_cache.get(_game_price_cache_key(asset_type, ticker))


async def _game_fetch_coingecko_usd(client: httpx.AsyncClient) -> dict[str, float]:
    ids = ",".join(GAME_CRYPTO_COINGECKO_IDS[t] for t in GAME_CRYPTO_TICKERS)
    url = f"https://api.coingecko.com/api/v3/simple/price?ids={ids}&vs_currencies=usd"
    out: dict[str, float] = {}
    try:
        r = await client.get(url, headers=_YH_HEADERS, timeout=12.0)
        r.raise_for_status()
        data = r.json()
        for sym, gecko_id in GAME_CRYPTO_COINGECKO_IDS.items():
            row = data.get(gecko_id) or {}
            usd = row.get("usd")
            if usd is not None:
                out[sym] = float(usd)
                _game_cache_price_put("crypto", sym, float(usd))
    except Exception as exc:
        log.warning("CoinGecko price fetch failed: %s", exc)
    return out


def _game_running_cost_basis_remaining(
    trades: list[dict[str, Any]], pid: str, tk: str, ast: str
) -> tuple[float, float]:
    """Process trades in time order; return (remaining_cost_basis, remaining_quantity)."""
    tk_u = tk.upper()
    ast_l = ast.lower()
    subset = [
        t
        for t in trades
        if str(t.get("player_id")) == pid
        and str(t.get("ticker", "")).upper() == tk_u
        and str(t.get("asset_type", "")).lower() == ast_l
    ]
    subset.sort(key=lambda x: str(x.get("executed_at") or x.get("id") or ""))
    qty = 0.0
    cost = 0.0
    for t in subset:
        q = float(t.get("quantity") or 0)
        if q <= 0:
            continue
        if t.get("direction") == "buy":
            fee = float(t.get("fee_paid") or 0)
            cost += float(t.get("total_value") or 0) + fee
            qty += q
        elif t.get("direction") == "sell":
            if qty <= 1e-15:
                continue
            avg = cost / qty
            cost -= avg * q
            qty -= q
            if qty < 1e-12:
                qty = 0.0
                cost = 0.0
    return cost, qty


async def _game_default_stock_tickers() -> list[str]:
    rows = await asyncio.to_thread(_holdings_list_sync)
    extra = [str(r.get("ticker", "")).upper() for r in rows if r.get("ticker")]
    return list(dict.fromkeys(DEFAULT_TICKERS + extra))


async def _game_all_prices_bundle(client: httpx.AsyncClient) -> dict[str, Any]:
    stock_tickers = await _game_default_stock_tickers()
    yf_syms = list(dict.fromkeys(list(stock_tickers) + list(GAME_COMMODITY_TICKERS)))
    quotes_task = _quotes_map(yf_syms, client)
    crypto_task = _game_fetch_coingecko_usd(client)
    qmap, crypto_usd = await asyncio.gather(quotes_task, crypto_task)
    crypto_stale: dict[str, bool] = {}

    for t in stock_tickers:
        q = qmap.get(t, {})
        if q.get("ok") and q.get("price") is not None:
            _game_cache_price_put(
                "stock",
                t,
                float(q["price"]),
                prev=q.get("prev"),
                pct=q.get("pct"),
                name=q.get("name", t),
            )
    for sym in GAME_COMMODITY_TICKERS:
        q = qmap.get(sym, {})
        if q.get("ok") and q.get("price") is not None:
            _game_cache_price_put(
                "commodity",
                sym,
                float(q["price"]),
                prev=q.get("prev"),
                pct=q.get("pct"),
                name=q.get("name", sym),
            )

    assets: list[dict[str, Any]] = []
    for t in stock_tickers:
        q = qmap.get(t, {})
        ok = bool(q.get("ok")) and q.get("price") is not None
        assets.append(
            {
                "ticker": t,
                "asset_type": "stock",
                "name": q.get("name", t),
                "price": float(q["price"]) if ok else None,
                "pct": q.get("pct"),
                "ok": ok,
                "stale": bool(q.get("stale")),
            }
        )
    labels = {"GC=F": "Gold", "SI=F": "Silver", "CL=F": "WTI Oil"}
    for sym in GAME_COMMODITY_TICKERS:
        q = qmap.get(sym, {})
        ok = bool(q.get("ok")) and q.get("price") is not None
        assets.append(
            {
                "ticker": sym,
                "asset_type": "commodity",
                "name": labels.get(sym, sym),
                "price": float(q["price"]) if ok else None,
                "pct": q.get("pct"),
                "ok": ok,
                "stale": bool(q.get("stale")),
            }
        )
    for sym in GAME_CRYPTO_TICKERS:
        px = crypto_usd.get(sym)
        ok = px is not None
        assets.append(
            {
                "ticker": sym,
                "asset_type": "crypto",
                "name": sym,
                "price": round(px, 6) if px is not None else None,
                "pct": None,
                "ok": ok,
                "stale": False,
            }
        )

    now = time_module.time()
    for a in assets:
        if a.get("ok") and a.get("price") is not None:
            continue
        snap = _game_cache_price_get(a["asset_type"], a["ticker"])
        if not snap or now - float(snap.get("ts") or 0) > _GAME_PRICE_CACHE_MAX_AGE_SEC:
            continue
        px = float(snap["price"])
        a["price"] = round(px, 6) if a["asset_type"] == "crypto" else round(px, 2)
        a["ok"] = True
        a["stale"] = True
        a["cached_at"] = snap["ts"]
        tk = str(a["ticker"]).upper()
        if a["asset_type"] == "crypto":
            crypto_usd = dict(crypto_usd)
            crypto_usd[a["ticker"]] = px
            crypto_stale[a["ticker"]] = True
        else:
            qmap = dict(qmap)
            qmap[tk] = {
                "ticker": tk,
                "name": snap.get("name", tk),
                "price": round(px, 2),
                "prev": round(float(snap.get("prev") or px), 2),
                "pct": snap.get("pct", 0.0),
                "ok": True,
                "stale": True,
            }

    return {"quotes_map": qmap, "crypto_usd": crypto_usd, "assets": assets, "crypto_stale": crypto_stale}


def _game_price_for_asset(
    ticker: str,
    asset_type: str,
    quotes_map: dict[str, dict],
    crypto_usd: dict[str, float],
    crypto_stale: dict[str, bool] | None = None,
) -> tuple[float | None, str | None, bool]:
    at = asset_type.strip().lower()
    t = ticker.strip().upper()
    cs = crypto_stale or {}
    if at == "crypto":
        px = crypto_usd.get(t)
        if px is not None:
            return float(px), None, bool(cs.get(t))
        snap = _game_cache_price_get("crypto", t)
        if snap and time_module.time() - float(snap.get("ts") or 0) <= _GAME_PRICE_CACHE_MAX_AGE_SEC:
            return float(snap["price"]), None, True
        return None, "Could not price crypto", False
    if at == "commodity":
        q = quotes_map.get(t, {})
        if q.get("ok") and q.get("price") is not None:
            return float(q["price"]), None, bool(q.get("stale"))
        return None, "Could not price commodity", False
    if at == "stock":
        q = quotes_map.get(t, {})
        if q.get("ok") and q.get("price") is not None:
            return float(q["price"]), None, bool(q.get("stale"))
        return None, "Could not price stock", False
    return None, "Invalid asset_type", False


async def _game_resolve_trade_price(
    ticker: str, asset_type: str, client: httpx.AsyncClient
) -> tuple[float | None, str | None, bool]:
    """Return (price, error, is_stale). Trades must reject when is_stale is True."""
    t = ticker.strip().upper()
    at = asset_type.strip().lower()
    now = time_module.time()
    if at == "crypto":
        crypto = await _game_fetch_coingecko_usd(client)
        px = crypto.get(t)
        if px is not None:
            return float(px), None, False
        snap = _game_cache_price_get("crypto", t)
        if snap and now - float(snap.get("ts") or 0) <= _GAME_PRICE_CACHE_MAX_AGE_SEC:
            return float(snap["price"]), None, True
        return None, "Could not price crypto", False
    if at == "commodity":
        m = await _quotes_map([t], client)
        q = m.get(t, {})
        if q.get("ok") and q.get("price") is not None:
            _game_cache_price_put("commodity", t, float(q["price"]), prev=q.get("prev"), pct=q.get("pct"), name=q.get("name", t))
            return float(q["price"]), None, bool(q.get("stale"))
        snap = _game_cache_price_get("commodity", t)
        if snap and now - float(snap.get("ts") or 0) <= _GAME_PRICE_CACHE_MAX_AGE_SEC:
            return float(snap["price"]), None, True
        return None, "Could not price commodity (use GC=F, SI=F, CL=F)", False
    if at == "stock":
        m = await _quotes_map([t], client)
        q = m.get(t, {})
        if q.get("ok") and q.get("price") is not None:
            _game_cache_price_put("stock", t, float(q["price"]), prev=q.get("prev"), pct=q.get("pct"), name=q.get("name", t))
            return float(q["price"]), None, bool(q.get("stale"))
        snap = _game_cache_price_get("stock", t)
        if snap and now - float(snap.get("ts") or 0) <= _GAME_PRICE_CACHE_MAX_AGE_SEC:
            return float(snap["price"]), None, True
        return None, "Could not price stock", False
    return None, "Invalid asset_type", False


def _game_trading_allowed(comp: dict[str, Any]) -> tuple[bool, str]:
    if comp.get("status") == "ended":
        return False, "Competition is ended"
    today = date.today()
    try:
        sd = _game_parse_date(comp.get("start_date"))
        ed = _game_parse_date(comp.get("end_date"))
    except Exception:
        return False, "Invalid competition dates"
    if today < sd:
        return False, "Competition has not started yet"
    if today > ed:
        return False, "Competition is past end date"
    return True, ""


@app.post("/game/create")
async def game_create(request: Request, body: dict[str, Any] = Body(...)):
    ip = _game_client_ip(request)
    if not _game_rate_allow(ip, max_events=20):
        raise HTTPException(status_code=429, detail="Too many requests — try again in a minute")
    try:
        row = await asyncio.to_thread(_game_competition_insert_sync, body)
        token = row.get("commissioner_token")
        return {"ok": True, "competition": _game_public_competition(row), "commissioner_token": token}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve)) from ve
    except Exception as exc:
        log.warning("game create failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/game/join")
async def game_join(request: Request, body: dict[str, Any] = Body(...)):
    ip = _game_client_ip(request)
    if not _game_rate_allow(ip, max_events=30):
        raise HTTPException(status_code=429, detail="Too many requests — try again in a minute")
    code = str(body.get("invite_code") or "").strip().upper()
    display_name = str(body.get("display_name") or "").strip()
    if not code:
        raise HTTPException(status_code=400, detail="invite_code is required")
    if not display_name:
        raise HTTPException(status_code=400, detail="display_name is required")
    comp = await asyncio.to_thread(_game_competition_by_invite_sync, code)
    if not comp:
        raise HTTPException(status_code=404, detail="Unknown invite code")
    cid = str(comp["id"])
    comp = _game_sync_close_competition_if_due(cid, comp)
    mx = comp.get("max_players")
    if mx is not None:
        try:
            mx_i = int(mx)
            players = await asyncio.to_thread(_game_players_by_competition_sync, cid)
            if len(players) >= mx_i:
                raise HTTPException(status_code=400, detail="This competition is full")
        except HTTPException:
            raise
        except Exception:
            pass
    starting = float(comp.get("starting_capital") or 100_000)
    try:
        player = await asyncio.to_thread(_game_player_insert_sync, cid, display_name, starting)
        return {"ok": True, "player": player, "competition": _game_public_competition(comp)}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve)) from ve
    except Exception as exc:
        log.warning("game join failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/game/{invite_code}")
async def game_detail(invite_code: str):
    comp = await asyncio.to_thread(_game_competition_by_invite_sync, invite_code)
    if not comp:
        raise HTTPException(status_code=404, detail="Unknown invite code")
    cid = str(comp["id"])
    comp = _game_sync_close_competition_if_due(cid, comp)
    players = await asyncio.to_thread(_game_players_by_competition_sync, cid)
    trades = await asyncio.to_thread(_game_trades_for_competition_sync, cid)
    starting = float(comp.get("starting_capital") or 100_000)

    async with httpx.AsyncClient() as client:
        bundle = await _game_all_prices_bundle(client)
    qmap = bundle["quotes_map"]
    crypto_usd = bundle["crypto_usd"]
    crypto_stale = bundle.get("crypto_stale") or {}

    leaderboard: list[dict[str, Any]] = []
    for p in players:
        pid = str(p["id"])
        hold = _game_holdings_from_trades(trades, pid, cid)
        mv = 0.0
        breakdown: list[tuple[tuple[str, str], float, float]] = []
        for (tk, ast), qty in hold.items():
            px, _err, _st = _game_price_for_asset(tk, ast, qmap, crypto_usd, crypto_stale)
            if px is None:
                continue
            v = qty * px
            mv += v
            breakdown.append(((tk, ast), qty, v))
        cash = float(p.get("cash_balance") or 0)
        total = cash + mv
        pct_ret = round((total - starting) / starting * 100, 4) if starting > 0 else 0.0
        top_holding = None
        if breakdown:
            (tk, ast), qty, v = max(breakdown, key=lambda x: x[2])
            top_holding = {
                "ticker": tk,
                "asset_type": ast,
                "quantity": round(qty, 8),
                "market_value": round(v, 2),
            }
        leaderboard.append(
            {
                "player_id": pid,
                "display_name": p.get("display_name"),
                "cash_balance": round(cash, 2),
                "holdings_market_value": round(mv, 2),
                "total_value": round(total, 2),
                "pct_return": pct_ret,
                "top_holding": top_holding,
            }
        )
    leaderboard.sort(key=lambda r: r["pct_return"], reverse=True)
    for i, row in enumerate(leaderboard):
        row["rank"] = i + 1

    rules = {
        "starting_capital": starting,
        "fee_bps": int(comp.get("fee_bps") or 0),
        "slippage_bps": int(comp.get("slippage_bps") or 0),
        "max_position_pct": comp.get("max_position_pct"),
        "max_players": comp.get("max_players"),
        "trading_hours_mode": comp.get("trading_hours_mode") or "always",
        "margin_enabled": bool(comp.get("margin_enabled")),
        "leverage_max": float(comp.get("leverage_max") or 2),
        "no_shorts": True,
        "pct_return_basis": "Total value (cash + mark-to-market positions) vs starting capital",
    }

    return {
        "ok": True,
        "competition": _game_public_competition(comp),
        "rules": rules,
        "leaderboard": leaderboard,
        "player_count": len(players),
    }


@app.get("/game/{invite_code}/prices")
async def game_prices(invite_code: str):
    comp = await asyncio.to_thread(_game_competition_by_invite_sync, invite_code)
    if not comp:
        raise HTTPException(status_code=404, detail="Unknown invite code")
    async with httpx.AsyncClient() as client:
        bundle = await _game_all_prices_bundle(client)
    return {"ok": True, "invite_code": str(comp.get("invite_code")), "assets": bundle["assets"]}


@app.post("/game/trade")
async def game_trade(request: Request, body: dict[str, Any] = Body(...)):
    ip = _game_client_ip(request)
    if not _game_rate_allow(ip, max_events=100):
        raise HTTPException(status_code=429, detail="Too many requests — try again in a minute")
    player_id = str(body.get("player_id") or "").strip()
    ticker = str(body.get("ticker") or "").strip().upper()
    asset_type = str(body.get("asset_type") or "").strip().lower()
    direction = str(body.get("direction") or "").strip().lower()
    try:
        quantity = float(body.get("quantity"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="quantity must be a number") from None
    if not player_id:
        raise HTTPException(status_code=400, detail="player_id is required")
    crid = str(body.get("client_request_id") or "").strip()
    if crid and len(crid) > 200:
        raise HTTPException(status_code=400, detail="client_request_id too long")
    if not ticker or asset_type not in ("stock", "crypto", "commodity"):
        raise HTTPException(status_code=400, detail="ticker and valid asset_type required")
    if direction not in ("buy", "sell"):
        raise HTTPException(status_code=400, detail="direction must be buy or sell")
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="quantity must be positive")

    player = await asyncio.to_thread(_game_player_by_id_sync, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Unknown player")
    comp_id = str(player.get("competition_id"))
    comp = None
    c = _supabase_client()
    if c:
        try:
            r = c.table("competitions").select("*").eq("id", comp_id).limit(1).execute()
            rows = r.data or []
            comp = rows[0] if rows else None
        except Exception:
            comp = None
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")
    comp = _game_sync_close_competition_if_due(comp_id, comp)
    ok_trade, reason = _game_trading_allowed(comp)
    if not ok_trade:
        raise HTTPException(status_code=400, detail=reason)
    tw_ok, tw_err = _game_time_window_ok(comp, ticker, asset_type)
    if not tw_ok:
        raise HTTPException(status_code=400, detail=tw_err)

    if crid:
        existing_tid = await asyncio.to_thread(_game_idempo_get_sync, player_id, crid)
        if existing_tid:
            tr = await asyncio.to_thread(_game_trade_by_id_sync, existing_tid)
            pl = await asyncio.to_thread(_game_player_by_id_sync, player_id)
            if tr and pl:
                return {
                    "ok": True,
                    "idempotent_replay": True,
                    "trade": tr,
                    "cash_balance": round(float(pl.get("cash_balance") or 0), 2),
                    "client_request_id": crid,
                }

    starting = float(comp.get("starting_capital") or 100_000)
    fee_bps = int(comp.get("fee_bps") or 0)
    slip_bps = int(comp.get("slippage_bps") or 0)
    margin_enabled = bool(comp.get("margin_enabled"))
    leverage_max = float(comp.get("leverage_max") or 2)
    borrow_cap = max(0.0, (leverage_max - 1.0) * starting) if margin_enabled else 0.0

    async with httpx.AsyncClient() as client:
        price, perr, is_stale = await _game_resolve_trade_price(ticker, asset_type, client)
        if is_stale:
            raise HTTPException(
                status_code=409,
                detail="Live price unavailable for this symbol (cached quote may appear in lists). Trading is blocked until the feed recovers.",
            )
        if price is None:
            raise HTTPException(status_code=400, detail=perr or "Price unavailable")
        bundle = await _game_all_prices_bundle(client)
    qmap = bundle["quotes_map"]
    crypto_usd = bundle["crypto_usd"]
    crypto_stale = bundle.get("crypto_stale") or {}
    slip = slip_bps / 10000.0
    if direction == "buy":
        exec_price = float(price) * (1.0 + slip)
    else:
        exec_price = float(price) * (1.0 - slip)
    notional = round(quantity * exec_price, 2)
    fee = round(notional * fee_bps / 10000.0, 2)

    trades = await asyncio.to_thread(_game_trades_for_player_sync, player_id)
    holdings = _game_holdings_from_trades(trades, player_id, comp_id)
    cash = float(player.get("cash_balance") or 0)

    def _gross_mv(h: dict[tuple[str, str], float]) -> float:
        tot = 0.0
        for (tk, ast), q in h.items():
            px, _e, _st = _game_price_for_asset(tk, ast, qmap, crypto_usd, crypto_stale)
            if px is not None:
                tot += q * px
        return tot

    if direction == "buy":
        total_out = round(notional + fee, 2)
        if total_out > cash + borrow_cap + 1e-4:
            raise HTTPException(
                status_code=400,
                detail="Insufficient buying power (cash"
                + (" + margin cap)" if margin_enabled else ")"),
            )
        prospective = dict(holdings)
        key = (ticker, asset_type)
        prospective[key] = prospective.get(key, 0.0) + quantity
        gross = _gross_mv(prospective)
        new_cash = round(cash - total_out, 2)
        total_pf = new_cash + gross
        px_here, _, _ = _game_price_for_asset(ticker, asset_type, qmap, crypto_usd, crypto_stale)
        if px_here is None:
            raise HTTPException(status_code=400, detail="Cannot evaluate position limit — price missing")
        mv_here = prospective[key] * px_here
        max_pct = comp.get("max_position_pct")
        if max_pct is not None and total_pf > 1e-6:
            if (mv_here / total_pf) * 100.0 > float(max_pct) + 0.02:
                raise HTTPException(
                    status_code=400,
                    detail=f"Position would exceed league max single-name weight ({float(max_pct):.1f}% of portfolio)",
                )
        if not await asyncio.to_thread(_game_update_player_cash_optimistic_sync, player_id, cash, new_cash):
            raise HTTPException(status_code=409, detail="Cash balance changed — retry")
        try:
            tr = await asyncio.to_thread(
                _game_insert_trade_sync,
                player_id,
                comp_id,
                ticker,
                asset_type,
                direction,
                quantity,
                round(exec_price, 8),
                notional,
                fee,
            )
        except Exception:
            await asyncio.to_thread(_game_update_player_cash_optimistic_sync, player_id, new_cash, cash)
            raise
        if crid and tr.get("id"):
            await asyncio.to_thread(_game_idempo_put_sync, player_id, crid, str(tr["id"]))
        return {"ok": True, "trade": tr, "cash_balance": new_cash, "fee_paid": fee, "exec_price": round(exec_price, 8), "client_request_id": crid or None}

    key = (ticker, asset_type)
    held = holdings.get(key, 0.0)
    if quantity > held + 1e-9:
        raise HTTPException(status_code=400, detail="Cannot sell more than you hold")
    proceeds = round(notional - fee, 2)
    new_cash = round(cash + proceeds, 2)
    if not await asyncio.to_thread(_game_update_player_cash_optimistic_sync, player_id, cash, new_cash):
        raise HTTPException(status_code=409, detail="Cash balance changed — retry")
    try:
        tr = await asyncio.to_thread(
            _game_insert_trade_sync,
            player_id,
            comp_id,
            ticker,
            asset_type,
            direction,
            quantity,
            round(exec_price, 8),
            notional,
            fee,
        )
    except Exception:
        await asyncio.to_thread(_game_update_player_cash_optimistic_sync, player_id, new_cash, cash)
        raise
    if crid and tr.get("id"):
        await asyncio.to_thread(_game_idempo_put_sync, player_id, crid, str(tr["id"]))
    return {"ok": True, "trade": tr, "cash_balance": new_cash, "fee_paid": fee, "exec_price": round(exec_price, 8), "client_request_id": crid or None}


def _game_trades_player_page_sync(player_id: str, limit: int, offset: int) -> list[dict[str, Any]]:
    c = _supabase_client()
    if not c:
        return []
    try:
        r = (
            c.table("trades")
            .select("*")
            .eq("player_id", player_id)
            .order("executed_at", desc=True)
            .limit(limit)
            .offset(offset)
            .execute()
        )
        return list(r.data or [])
    except Exception as exc:
        log.warning("player trades list failed: %s", exc)
        return []


def _game_corp_insert_sync(comp_id: str, ticker: str, from_shares: float, to_shares: float, effective_at: str) -> dict[str, Any]:
    c = _supabase_client()
    if not c:
        raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured")
    row = {
        "competition_id": comp_id,
        "ticker": ticker.strip().upper(),
        "from_shares": float(from_shares),
        "to_shares": float(to_shares),
        "effective_at": effective_at,
    }
    r = c.table("corporate_actions").insert(row).execute()
    data = r.data or []
    return data[0] if data else row


def _game_competition_patch_sync(comp_id: str, patch: dict[str, Any]) -> None:
    c = _supabase_client()
    if not c:
        raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured")
    c.table("competitions").update(patch).eq("id", comp_id).execute()


@app.get("/player/{player_id}/trades")
async def game_player_trades(
    player_id: str,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0, le=100_000),
):
    player = await asyncio.to_thread(_game_player_by_id_sync, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Unknown player")
    rows = await asyncio.to_thread(_game_trades_player_page_sync, player_id, limit, offset)
    return {"ok": True, "trades": rows, "count": len(rows)}


@app.post("/game/{invite_code}/admin")
async def game_admin(invite_code: str, request: Request, body: dict[str, Any] = Body(...)):
    ip = _game_client_ip(request)
    if not _game_rate_allow(ip, max_events=40):
        raise HTTPException(status_code=429, detail="Too many requests — try again in a minute")
    token = str(body.get("commissioner_token") or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="commissioner_token is required")
    comp = await asyncio.to_thread(_game_competition_by_invite_sync, invite_code)
    if not comp:
        raise HTTPException(status_code=404, detail="Unknown invite code")
    if comp.get("commissioner_token") != token:
        raise HTTPException(status_code=401, detail="Invalid commissioner token")
    cid = str(comp["id"])
    comp = _game_sync_close_competition_if_due(cid, comp)

    if body.get("end_now"):
        await asyncio.to_thread(_game_competition_patch_sync, cid, {"status": "ended"})
        comp = {**comp, "status": "ended"}
    if body.get("note") is not None:
        note_s = str(body.get("note") or "").strip()[:2000]
        await asyncio.to_thread(_game_competition_patch_sync, cid, {"note": note_s or None})
        comp = {**comp, "note": note_s}
    ext = body.get("extend_end_date")
    if ext:
        try:
            new_ed = _game_parse_date(ext)
            sd = _game_parse_date(comp.get("start_date"))
            if new_ed < sd:
                raise ValueError("end_date before start_date")
            await asyncio.to_thread(_game_competition_patch_sync, cid, {"end_date": new_ed.isoformat(), "status": "active"})
            comp = {**comp, "end_date": new_ed.isoformat(), "status": "active"}
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve)) from ve

    sp = body.get("apply_split")
    if sp and isinstance(sp, dict):
        tk = str(sp.get("ticker") or "").strip().upper()
        frm = float(sp.get("from_shares") or 1)
        to = float(sp.get("to_shares") or 1)
        if not tk or frm <= 0 or to <= 0:
            raise HTTPException(status_code=400, detail="apply_split needs ticker, from_shares, to_shares")
        eff = sp.get("effective_at") or datetime.now(tz=ZoneInfo("UTC")).isoformat()
        await asyncio.to_thread(_game_corp_insert_sync, cid, tk, frm, to, eff)

    refreshed = await asyncio.to_thread(_game_competition_by_invite_sync, invite_code)
    return {"ok": True, "competition": _game_public_competition(refreshed or comp)}


@app.get("/player/{player_id}/portfolio")
async def game_player_portfolio(player_id: str):
    player = await asyncio.to_thread(_game_player_by_id_sync, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Unknown player")
    comp_id = str(player.get("competition_id"))
    c = _supabase_client()
    comp = None
    if c:
        try:
            r = c.table("competitions").select("*").eq("id", comp_id).limit(1).execute()
            rows = r.data or []
            comp = rows[0] if rows else None
        except Exception:
            comp = None
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")
    comp = _game_sync_close_competition_if_due(comp_id, comp)
    starting = float(comp.get("starting_capital") or 100_000)
    trades = await asyncio.to_thread(_game_trades_for_player_sync, player_id)
    hold = _game_holdings_from_trades(trades, player_id, comp_id)

    async with httpx.AsyncClient() as client:
        bundle = await _game_all_prices_bundle(client)
    qmap = bundle["quotes_map"]
    crypto_usd = bundle["crypto_usd"]
    crypto_stale = bundle.get("crypto_stale") or {}

    rows_out: list[dict[str, Any]] = []
    mv = 0.0
    unrealized = 0.0
    daily_total = 0.0
    for (tk, ast), qty in sorted(hold.items(), key=lambda x: x[0][0]):
        px, _, st = _game_price_for_asset(tk, ast, qmap, crypto_usd, crypto_stale)
        daily_row = None
        if px is not None and ast in ("stock", "commodity"):
            qrow = qmap.get(tk, {})
            prev = float(qrow.get("prev") or px or 0)
            if prev:
                daily_row = round(qty * (float(px) - prev), 2)
                daily_total += daily_row
        if px is None:
            rows_out.append(
                {
                    "ticker": tk,
                    "asset_type": ast,
                    "quantity": round(qty, 8),
                    "current_price": None,
                    "market_value": None,
                    "cost_basis": None,
                    "unrealized_pnl": None,
                    "daily_pnl": None,
                    "ok": False,
                }
            )
            continue
        rem_cost, rem_qty = _game_running_cost_basis_remaining(trades, player_id, tk, ast)
        avg_cost = (rem_cost / rem_qty) if rem_qty > 1e-12 else 0.0
        mval = qty * px
        cb = qty * avg_cost
        ur = mval - cb
        mv += mval
        unrealized += ur
        rows_out.append(
            {
                "ticker": tk,
                "asset_type": ast,
                "quantity": round(qty, 8),
                "avg_cost": round(avg_cost, 6) if avg_cost else None,
                "current_price": round(px, 6),
                "market_value": round(mval, 2),
                "cost_basis": round(cb, 2),
                "unrealized_pnl": round(ur, 2),
                "daily_pnl": daily_row,
                "price_stale": st,
                "ok": True,
            }
        )

    cash = float(player.get("cash_balance") or 0)
    total = cash + mv
    pct_vs_start = round((total - starting) / starting * 100, 4) if starting > 0 else 0.0

    return {
        "ok": True,
        "player": {
            "id": player.get("id"),
            "display_name": player.get("display_name"),
            "cash_balance": round(cash, 2),
            "joined_at": player.get("joined_at"),
        },
        "competition": _game_public_competition(comp),
        "starting_capital": starting,
        "holdings": rows_out,
        "holdings_market_value": round(mv, 2),
        "total_value": round(total, 2),
        "pct_return_vs_start": pct_vs_start,
        "unrealized_pnl": round(unrealized, 2),
        "daily_pnl_mark_to_market": round(daily_total, 2),
    }


def _game_parse_executed_at_utc(v: Any) -> datetime | None:
    if v is None:
        return None
    try:
        s = str(v).strip().replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=ZoneInfo("UTC"))
        return dt.astimezone(ZoneInfo("UTC"))
    except Exception:
        return None


@app.get("/game/{invite_code}/recap")
async def game_recap(invite_code: str):
    """Rolling 7-day league activity + session % movers among symbols that traded."""
    comp = await asyncio.to_thread(_game_competition_by_invite_sync, invite_code)
    if not comp:
        raise HTTPException(status_code=404, detail="Unknown invite code")
    cid = str(comp["id"])
    comp = _game_sync_close_competition_if_due(cid, comp)
    trades_all = await asyncio.to_thread(_game_trades_for_competition_sync, cid)
    players = await asyncio.to_thread(_game_players_by_competition_sync, cid)
    player_names = {str(p["id"]): str(p.get("display_name") or p["id"])[:80] for p in players}
    now = datetime.now(tz=ZoneInfo("UTC"))
    since = now - timedelta(days=7)
    recent: list[dict[str, Any]] = []
    for t in trades_all:
        et = _game_parse_executed_at_utc(t.get("executed_at"))
        if et is None or et < since:
            continue
        recent.append(t)

    if not recent:
        return {
            "ok": True,
            "period_days": 7,
            "since": since.isoformat(),
            "trade_count": 0,
            "summary_lines": ["No league fills in the last 7 days — quiet week."],
            "structured": {
                "most_traded_ticker": None,
                "most_active_player": None,
                "largest_notional_trade": None,
                "best_mover_session_pct": None,
                "worst_mover_session_pct": None,
            },
        }

    ticker_c: Counter[str] = Counter()
    player_c: Counter[str] = Counter()
    biggest: dict[str, Any] | None = None
    for t in recent:
        tk = str(t.get("ticker") or "").upper().strip()
        if tk:
            ticker_c[tk] += 1
        pid = str(t.get("player_id") or "")
        if pid:
            player_c[pid] += 1
        tv = float(t.get("total_value") or 0)
        if biggest is None or tv > float(biggest.get("total_value") or 0):
            biggest = dict(t)

    most_t = ticker_c.most_common(1)[0] if ticker_c else None
    most_p = player_c.most_common(1)[0] if player_c else None

    y_syms = sorted(
        {
            str(t.get("ticker")).upper().strip()
            for t in recent
            if str(t.get("asset_type", "")).lower() in ("stock", "commodity") and str(t.get("ticker") or "").strip()
        }
    )[:60]

    movers: list[dict[str, Any]] = []
    async with httpx.AsyncClient() as client:
        if y_syms:
            qm = await _quotes_map(y_syms, client)
            for sym in y_syms:
                q = qm.get(sym, {})
                if not q.get("ok"):
                    continue
                try:
                    pct = float(q.get("pct") or 0)
                except (TypeError, ValueError):
                    pct = 0.0
                movers.append({"ticker": sym, "pct": round(pct, 2), "name": q.get("name")})

    best_m = max(movers, key=lambda x: x["pct"]) if movers else None
    worst_m = min(movers, key=lambda x: x["pct"]) if movers else None

    lines: list[str] = []
    if most_t:
        lines.append(f"Most traded symbol (7d): {most_t[0]} ({most_t[1]} fills).")
    if most_p:
        nm = player_names.get(most_p[0], most_p[0])
        lines.append(f"Most active trader: {nm} ({most_p[1]} trades).")
    if biggest:
        nm = player_names.get(str(biggest.get("player_id")), "Someone")
        lines.append(
            f"Largest trade by notional: {nm} {biggest.get('direction')} {biggest.get('ticker')} "
            f"for ${float(biggest.get('total_value') or 0):,.2f}."
        )
    if best_m:
        lines.append(
            f"Among symbols your league traded this week, Yahoo session % leader: {best_m['ticker']} ({best_m['pct']:+.2f}%)."
        )
    if worst_m and (not best_m or worst_m["ticker"] != best_m["ticker"]):
        lines.append(f"Session laggard among those symbols: {worst_m['ticker']} ({worst_m['pct']:+.2f}%).")

    return {
        "ok": True,
        "period_days": 7,
        "since": since.isoformat(),
        "trade_count": len(recent),
        "summary_lines": lines,
        "structured": {
            "most_traded_ticker": {"ticker": most_t[0], "count": most_t[1]} if most_t else None,
            "most_active_player": {
                "player_id": most_p[0],
                "display_name": player_names.get(most_p[0]),
                "count": most_p[1],
            }
            if most_p
            else None,
            "largest_notional_trade": {
                "player_id": biggest.get("player_id"),
                "display_name": player_names.get(str(biggest.get("player_id"))),
                "ticker": biggest.get("ticker"),
                "asset_type": biggest.get("asset_type"),
                "direction": biggest.get("direction"),
                "total_value": round(float(biggest.get("total_value") or 0), 2),
                "executed_at": biggest.get("executed_at"),
            }
            if biggest
            else None,
            "best_mover_session_pct": best_m,
            "worst_mover_session_pct": worst_m,
        },
    }


@app.get("/player/{player_id}/achievements")
async def game_player_achievements(player_id: str):
    """Server-side cosmetic badges; client may merge with localStorage."""
    player = await asyncio.to_thread(_game_player_by_id_sync, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Unknown player")
    comp_id = str(player.get("competition_id"))
    c = _supabase_client()
    comp: dict[str, Any] | None = None
    if c:
        try:
            r = c.table("competitions").select("*").eq("id", comp_id).limit(1).execute()
            rows = r.data or []
            comp = rows[0] if rows else None
        except Exception:
            comp = None
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")
    trades = await asyncio.to_thread(_game_trades_for_player_sync, player_id)
    badges: list[dict[str, Any]] = []
    if trades:
        badges.append(
            {
                "id": "first_trade",
                "label": "First fill",
                "description": "Placed at least one trade in this league.",
            }
        )
    if len(trades) >= 10:
        badges.append(
            {
                "id": "volume_10",
                "label": "Busy desk",
                "description": "10 or more lifetime fills in this league.",
            }
        )
    tickers = {str(t.get("ticker", "")).upper().strip() for t in trades if t.get("ticker")}
    if len(tickers) >= 5:
        badges.append(
            {
                "id": "diversifier",
                "label": "Explorer",
                "description": "Traded five or more distinct tickers.",
            }
        )
    if not bool(comp.get("margin_enabled")):
        badges.append(
            {
                "id": "league_cash_only",
                "label": "No leverage league",
                "description": "This competition runs without margin.",
            }
        )

    hold = _game_holdings_from_trades(trades, player_id, comp_id)
    now = datetime.now(tz=ZoneInfo("UTC"))
    for (tk, ast), qty in sorted(hold.items(), key=lambda x: x[0][0]):
        if qty <= 1e-9:
            continue
        subset = [
            t
            for t in trades
            if str(t.get("player_id")) == player_id
            and str(t.get("ticker", "")).upper().strip() == tk
            and str(t.get("asset_type", "")).lower().strip() == ast
        ]
        subset.sort(key=lambda x: str(x.get("executed_at") or x.get("id") or ""))
        first_buy: datetime | None = None
        for t in subset:
            if t.get("direction") != "buy":
                continue
            et = _game_parse_executed_at_utc(t.get("executed_at"))
            if et is None:
                continue
            if first_buy is None or et < first_buy:
                first_buy = et
        if first_buy and (now - first_buy).total_seconds() >= 7 * 86400:
            badges.append(
                {
                    "id": f"held_7d_{tk}_{ast}",
                    "label": f"Held {tk} 7+ days",
                    "description": f"Maintained a long in {tk} ({ast}) for at least one week.",
                }
            )
            break

    return {"ok": True, "badges": badges, "source": "server"}


# ── /health ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status":         "ok",
        "version":        "2.0",
        "cached_quotes":  len(_quote_cache),
        "cached_macro":   len(_macro_cache),
        "fx_cached":      bool(_fx_cache),
        "news_key_set":   bool(NEWS_API_KEY),
        "supabase":       bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY),
        "openbb":         openbb_quotes.is_openbb_installed(),
    }


# ── WebSocket streaming ───────────────────────────────────────────────────────

@app.websocket("/ws/prices")
async def price_stream(ws: WebSocket):
    """
    Push live quotes + macro + fx every 30 seconds.
    Client can send JSON: {"tickers": [...]} to override default watchlist.
    FX is refreshed every 60 seconds (less volatile, heavier call).
    """
    await ws.accept()
    tickers = DEFAULT_TICKERS[:]
    fx_tick = 0
    log.info("WS v2 connected")

    try:
        while True:
            # Non-blocking message check
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

            # Quotes
            try:
                async with httpx.AsyncClient() as client:
                    quotes_map = await _quotes_map(tickers, client)
                _quote_cache.update(quotes_map)
                await ws.send_json({
                    "type": "quotes",
                    "data": list(quotes_map.values()),
                })
            except Exception as exc:
                log.warning("WS quotes error: %s", exc)

            # Macro
            try:
                macro_result = await get_macro()
                await ws.send_json({
                    "type": "macro",
                    "data": macro_result["macro"],
                })
            except Exception as exc:
                log.warning("WS macro error: %s", exc)

            # FX (every 2 cycles = ~60s)
            fx_tick += 1
            if fx_tick >= 2:
                fx_tick = 0
                try:
                    fx_result = await get_fx()
                    await ws.send_json({
                        "type": "fx",
                        "data": fx_result,
                    })
                except Exception as exc:
                    log.warning("WS fx error: %s", exc)

            await asyncio.sleep(30)

    except WebSocketDisconnect:
        log.info("WS v2 disconnected")
    except Exception as exc:
        log.error("WS v2 error: %s", exc)


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print()
    print("  Investing Dashboard Backend v2")
    print("  -----------------------------------------")
    print("  REST:   http://127.0.0.1:8765/quotes")
    print("  REST:   http://127.0.0.1:8765/symbol-search?q=asml")
    print("  REST:   http://127.0.0.1:8765/macro")
    print("  REST:   http://127.0.0.1:8765/fx")
    print("  REST:   http://127.0.0.1:8765/news?query=uranium")
    print("  REST:   http://127.0.0.1:8765/game/create  (fantasy competition)")
    print("  REST:   http://127.0.0.1:8765/game/{invite_code}")
    print("  WS:     ws://127.0.0.1:8765/ws/prices")
    print("  Docs:   http://127.0.0.1:8765/docs")
    print("  Health: http://127.0.0.1:8765/health")
    print()
    if not NEWS_API_KEY:
        print("  [!] NEWS_API_KEY not set -- /news endpoint disabled")
        print("       Get free key at https://newsapi.org")
    print()
    uvicorn.run(
        "server_v2:app",
        host="127.0.0.1",
        port=8765,
        reload=False,
        log_level="info",
    )
