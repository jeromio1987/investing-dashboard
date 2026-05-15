import json
import sys
from datetime import datetime, timezone

import yfinance as yf

TICKERS = ["NOG", "CIVI", "MTDR", "KNTK", "POWL", "AAON", "BEAM", "NTLA", "ARVN", "KYMR", "NXE", "UUUU"]


def fetch_all(tickers):
    stocks = {}
    failed = []

    try:
        ticker_objects = yf.Tickers(" ".join(tickers))
    except Exception as e:
        print(f"[ERROR] Failed to initialise yfinance Tickers: {e}", file=sys.stderr)
        return stocks, tickers

    for symbol in tickers:
        try:
            t = ticker_objects.tickers[symbol]
            info = t.fast_info

            price = info.last_price
            prev_close = info.previous_close
            week52_high = info.fifty_two_week_high
            week52_low = info.fifty_two_week_low
            volume = info.last_volume

            if price is None or prev_close is None:
                raise ValueError("price or prev_close is None")

            change_pct = round((price - prev_close) / prev_close * 100, 2) if prev_close else None

            stocks[symbol] = {
                "ticker": symbol,
                "price": round(float(price), 4) if price is not None else None,
                "prev_close": round(float(prev_close), 4) if prev_close is not None else None,
                "change_pct": change_pct,
                "volume": int(volume) if volume is not None else None,
                "week52_high": round(float(week52_high), 4) if week52_high is not None else None,
                "week52_low": round(float(week52_low), 4) if week52_low is not None else None,
            }

            print(
                f"[OK] {symbol:6s}  price={price:.2f}  prev_close={prev_close:.2f}"
                f"  change={change_pct:+.2f}%  vol={int(volume or 0):,}"
            )

        except Exception as e:
            print(f"[SKIP] {symbol}: {e}", file=sys.stderr)
            failed.append(symbol)

    return stocks, failed


def main():
    stocks, failed = fetch_all(TICKERS)

    if not stocks:
        print("[ERROR] All tickers failed. Aborting without writing output.", file=sys.stderr)
        sys.exit(1)

    if failed:
        print(f"[WARN] Skipped {len(failed)} ticker(s): {', '.join(failed)}", file=sys.stderr)

    payload = {
        "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "stocks": stocks,
    }

    output_path = "smid_data.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print(f"\n[DONE] Wrote {len(stocks)} ticker(s) to {output_path}")
    sys.exit(0)


if __name__ == "__main__":
    main()
