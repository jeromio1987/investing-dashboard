#\!/usr/bin/env python3
"""SMID Alpha Engine - Live Data Fetcher"""

import json, sys, os
from datetime import datetime, timezone

try:
    import yfinance as yf
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "yfinance",
                           "--break-system-packages", "-q"])
    import yfinance as yf

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "smid_data.json")

SMID_TICKERS = [
    "NOG","CIVI","MTDR","KNTK",
    "POWL","AAON",
    "BEAM","NTLA","ARVN","KYMR",
    "NXE","UUUU",
    "MNMD","CMPS",
    "COHU","AEHR",
]

MACRO_MAP = {
    "VIX":   "^VIX",
    "WTI":   "CL=F",
    "Gold":  "GC=F",
    "TNX":   "^TNX",
    "USDJPY":"JPY=X",
    "SPX":   "^GSPC",
    "IWM":   "IWM",
}

def fetch_tickers(tickers, period="2d"):
    result = {}
    try:
        raw = yf.download(tickers, period=period, interval="1d",
                          group_by="ticker", auto_adjust=True, progress=False,
                          threads=True)
        for t in tickers:
            try:
                df = raw[t] if len(tickers) > 1 else raw
                if df is None or len(df) < 1:
                    result[t] = {"error": "no data"}
                    continue
                latest = df.iloc[-1]
                prev   = df.iloc[-2] if len(df) >= 2 else None
                price  = round(float(latest["Close"]), 4)
                raw_vol = float(latest["Volume"])
                vol = int(raw_vol) if (raw_vol == raw_vol and raw_vol > 0) else None
                chg = None
                if prev is not None:
                    pc = float(prev["Close"])
                    if pc > 0:
                        chg = round((price - pc) / pc * 100, 2)
                result[t] = {"price": price, "chg_pct": chg, "volume": vol}
            except Exception as e:
                result[t] = {"error": str(e)}
    except Exception as e:
        for t in tickers:
            result[t] = {"error": str(e)}
    return result

def enrich_avg_vol(stocks):
    for t in stocks:
        if "price" not in stocks[t]:
            continue
        try:
            info = yf.Ticker(t).fast_info
            avg = getattr(info, "three_month_average_volume", None)
            if avg and avg > 0:
                stocks[t]["avg_vol"] = int(avg)
                if stocks[t].get("volume"):
                    stocks[t]["vol_ratio"] = round(stocks[t]["volume"] / avg, 2)
        except:
            pass

def main():
    print("[%s] Fetching data..." % datetime.now().strftime("%H:%M:%S"))

    stocks = fetch_tickers(SMID_TICKERS)
    enrich_avg_vol(stocks)

    macro_tickers = list(MACRO_MAP.values())
    raw_macro = fetch_tickers(macro_tickers)
    macro = {}
    for label, ticker in MACRO_MAP.items():
        d = raw_macro.get(ticker, {"error": "not found"})
        macro[label] = {**d, "ticker": ticker}

    out = {
        "updated_utc":   datetime.now(timezone.utc).isoformat(),
        "updated_local": datetime.now().strftime("%d %b %Y %H:%M"),
        "stocks": stocks,
        "macro":  macro,
    }

    with open(OUTPUT_FILE, "w") as f:
        json.dump(out, f, indent=2)

    ok  = sum(1 for v in stocks.values() if "price" in v)
    err = sum(1 for v in stocks.values() if "error" in v)
    print("  Stocks: %d ok / %d errors" % (ok, err))
    mok = sum(1 for v in macro.values() if "price" in v)
    print("  Macro:  %d ok" % mok)
    print("  -> %s" % OUTPUT_FILE)

if __name__ == "__main__":
    main()
