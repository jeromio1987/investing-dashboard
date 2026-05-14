-- Portfolio holdings (public schema) — run once in Supabase SQL editor
-- Used by Prive/investing FastAPI backend: GET/POST/DELETE /portfolio

CREATE TABLE IF NOT EXISTS public.holdings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ticker       TEXT NOT NULL,
  quantity     DOUBLE PRECISION NOT NULL CHECK (quantity > 0),
  cost_price   DOUBLE PRECISION NOT NULL CHECK (cost_price >= 0),
  currency     TEXT NOT NULL DEFAULT 'USD',
  account      TEXT NOT NULL DEFAULT 'default',
  position_type TEXT NOT NULL DEFAULT 'equity', -- equity | cash | other
  sector       TEXT,
  notes        TEXT
);

CREATE INDEX IF NOT EXISTS idx_holdings_ticker ON public.holdings (ticker);
CREATE INDEX IF NOT EXISTS idx_holdings_account ON public.holdings (account);

-- Optional: cached closes for faster charts (backend may populate later)
CREATE TABLE IF NOT EXISTS public.asset_prices (
  ticker TEXT NOT NULL,
  date   DATE NOT NULL,
  close  DOUBLE PRECISION NOT NULL,
  PRIMARY KEY (ticker, date)
);

CREATE INDEX IF NOT EXISTS idx_asset_prices_date ON public.asset_prices (date DESC);

ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_prices ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; anon has no policy = locked down.
COMMENT ON TABLE public.holdings IS 'Investing app portfolio rows; access only via service role from local backend.';
