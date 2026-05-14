-- Fantasy game v2 — run after public_fantasy_game.sql (additive migration)
-- Safe to re-run (IF NOT EXISTS).

ALTER TABLE competitions ADD COLUMN IF NOT EXISTS commissioner_token TEXT UNIQUE;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS max_players INT;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS fee_bps INT NOT NULL DEFAULT 0;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS slippage_bps INT NOT NULL DEFAULT 0;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS max_position_pct FLOAT;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS trading_hours_mode TEXT NOT NULL DEFAULT 'always';
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS margin_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS leverage_max FLOAT NOT NULL DEFAULT 2;

COMMENT ON COLUMN competitions.trading_hours_mode IS 'always | us_rth — us_rth blocks US-style tickers outside NYSE regular hours (Mon–Fri 9:30–16:00 America/New_York)';
COMMENT ON COLUMN competitions.leverage_max IS 'When margin_enabled: max borrow ≈ starting_capital * (leverage_max - 1); buying power = cash + that cap';

ALTER TABLE trades ADD COLUMN IF NOT EXISTS fee_paid FLOAT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS corporate_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  from_shares FLOAT NOT NULL DEFAULT 1,
  to_shares FLOAT NOT NULL DEFAULT 1,
  effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corp_actions_comp ON corporate_actions(competition_id);
