-- Add if you already ran v2 without this table
CREATE TABLE IF NOT EXISTS trade_idempotency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  client_request_id TEXT NOT NULL,
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, client_request_id)
);
CREATE INDEX IF NOT EXISTS idx_idempo_player ON trade_idempotency(player_id);
