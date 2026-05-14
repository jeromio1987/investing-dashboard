"""
OpenBB equity quotes (provider yfinance — no extra API keys).
Falls back to caller if OpenBB is not installed or raises.
"""
from __future__ import annotations

import logging
from typing import Any

log = logging.getLogger("openbb_quotes")


def is_openbb_installed() -> bool:
    try:
        from openbb import obb  # noqa: F401
        return True
    except Exception:
        return False


def quote_symbols_sync(symbols: list[str]) -> dict[str, dict[str, Any]]:
    """Blocking: fetch quotes for many tickers via OpenBB yfinance."""
    from openbb import obb

    out: dict[str, dict[str, Any]] = {}
    for sym in symbols:
        s = sym.strip().upper()
        if not s:
            continue
        try:
            res = obb.equity.price.quote(symbol=s, provider="yfinance")
            df = res.to_df()
            if df is None or df.empty:
                continue
            row = df.iloc[-1]
            idx = row.index

            def pick(*keys: str) -> float | None:
                for k in keys:
                    if k in idx:
                        v = row[k]
                        if v == v:
                            try:
                                return float(v)
                            except (TypeError, ValueError):
                                continue
                return None

            price = pick("last_price", "close", "open")
            prev = pick("prev_close", "previous_close", "close")
            if price is None:
                continue
            if prev is None:
                prev = price
            chg = round(price - prev, 4)
            pct = round(chg / prev * 100, 4) if prev else 0.0
            name = s
            for nk in ("name", "short_name", "long_name"):
                if nk in idx and row[nk] == row[nk]:
                    name = str(row[nk])
                    break
            vol = int(pick("volume", "total_volume") or 0)
            out[s] = {
                "ticker": s,
                "name": name if name else s,
                "price": round(float(price), 4),
                "prev": round(float(prev), 4),
                "pct": pct,
                "change": round(float(price) - float(prev), 4),
                "volume": vol,
                "currency": str(row.get("currency", "USD") or "USD"),
                "exchange": str(row.get("exchange", "") or ""),
                "ok": True,
                "source": "openbb",
            }
        except Exception as exc:
            log.debug("OpenBB quote failed %s: %s", s, exc)
    return out


def historical_close_sync(symbol: str, start_date: str, end_date: str) -> list[dict[str, Any]]:
    """Blocking: daily rows {date, close} ascending."""
    from openbb import obb

    res = obb.equity.price.historical(
        symbol=symbol.strip().upper(),
        start_date=start_date,
        end_date=end_date,
        provider="yfinance",
    )
    df = res.to_df()
    if df is None or df.empty:
        return []
    if "close" not in df.columns:
        return []
    out: list[dict[str, Any]] = []
    for idx, row in df.iterrows():
        if hasattr(idx, "strftime"):
            d = idx.strftime("%Y-%m-%d")
        else:
            d = str(idx)[:10]
        try:
            cl = float(row["close"])
        except (TypeError, ValueError, KeyError):
            continue
        out.append({"date": d, "close": cl})
    out.sort(key=lambda x: x["date"])
    return out
