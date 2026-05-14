-- Fantasy stock competition — Supabase public schema (full v2)
-- New project: run this once. Existing v1-only DB: run public_fantasy_game_v2_migration.sql after the original file.

CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  starting_capital FLOAT DEFAULT 100000,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  commissioner_token TEXT UNIQUE,
  note TEXT,
  max_players INT,
  fee_bps INT NOT NULL DEFAULT 0,
  slippage_bps INT NOT NULL DEFAULT 0,
  max_position_pct FLOAT,
  trading_hours_mode TEXT NOT NULL DEFAULT 'always',
  margin_enabled BOOLEAN NOT NULL DEFAULT false,
  leverage_max FLOAT NOT NULL DEFAULT 2
);

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  cash_balance FLOAT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_competition ON players(competition_id);

CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  direction TEXT NOT NULL,
  quantity FLOAT NOT NULL,
  price_at_trade FLOAT NOT NULL,
  total_value FLOAT NOT NULL,
  fee_paid FLOAT NOT NULL DEFAULT 0,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_player ON trades(player_id);
CREATE INDEX IF NOT EXISTS idx_trades_competition ON trades(competition_id);

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

CREATE TABLE IF NOT EXISTS trade_idempotency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  client_request_id TEXT NOT NULL,
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, client_request_id)
);

CREATE INDEX IF NOT EXISTS idx_idempo_player ON trade_idempotency(player_id);
