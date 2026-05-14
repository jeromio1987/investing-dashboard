-- Cross-App Daily Snapshot — shared Supabase schema
-- Run this once in Supabase SQL editor (Project: eiyyblruwqqfrdroerhk, eu-west-1)
--
-- Purpose: each app writes one row per day. Morning Brief reads from it.
-- Sources:
--   MY PENS → writes sleep_score, hrv_readiness at end of sleep log save
--   Investing Dashboard → writes regime, pnl_pct at 17:00 via backend cron

CREATE SCHEMA IF NOT EXISTS cross_app;

-- ── Daily snapshot ──────────────────────────────────────────────────────────
-- One row per calendar date. Upsert from each app.
CREATE TABLE IF NOT EXISTS cross_app.daily_snapshot (
  date              DATE        PRIMARY KEY,
  -- From MY PENS / sleep module
  sleep_hours       FLOAT,
  sleep_quality     INT,         -- 1–5
  sleep_hrv         FLOAT,       -- ms
  sleep_score       FLOAT,       -- 0–100 computed: (hours/9)*50 + (quality/5)*50
  hrv_readiness     FLOAT,       -- 0–100: normalised HRV vs 28d EWMA
  -- From MY PENS / weight module
  true_weight_kg    FLOAT,
  -- From MY PENS / mode
  pens_mode         TEXT,        -- locked_in | balanced | off
  -- From Investing Dashboard backend (write at 17:00)
  regime            TEXT,        -- risk_on | risk_off | transition | neutral
  portfolio_pnl_pct FLOAT,       -- today's P&L % across all positions
  -- Metadata
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Impulses ─────────────────────────────────────────────────────────────────
-- Unified log: health impulses (from Dopamine Router) + trade impulses
CREATE TABLE IF NOT EXISTS cross_app.impulses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  source      TEXT        NOT NULL,   -- dopamine | trade
  -- Trade impulse fields
  ticker      TEXT,                   -- e.g. "NXE"
  direction   TEXT,                   -- buy | sell
  -- Common fields
  reason      TEXT,
  reviewed_at TIMESTAMPTZ,
  acted       BOOLEAN     DEFAULT FALSE
);

-- ── Events bus ───────────────────────────────────────────────────────────────
-- Lightweight cross-app event log — any app can write, Morning Brief can read
CREATE TABLE IF NOT EXISTS cross_app.events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  type        TEXT        NOT NULL,   -- sleep_logged | weight_logged | regime_changed | impulse_logged
  payload     JSONB       DEFAULT '{}'::jsonb,
  source_app  TEXT        NOT NULL    -- mypens | investing | jarvis
);

-- ── RLS: single-user app, lock down to service role ─────────────────────────
-- Enable RLS (rows are only accessible via service role key, never anon)
ALTER TABLE cross_app.daily_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_app.impulses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_app.events          ENABLE ROW LEVEL SECURITY;

-- ── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_impulses_created   ON cross_app.impulses (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_impulses_source    ON cross_app.impulses (source);
CREATE INDEX IF NOT EXISTS idx_events_type        ON cross_app.events (type, created_at DESC);

-- ── Helper: upsert daily snapshot (call from MY PENS after sleep save) ───────
-- Usage from supabase-js:
--   await supabase.rpc('upsert_daily_snapshot', { p_date: '2026-05-15', p_sleep_hours: 7.5, ... })
CREATE OR REPLACE FUNCTION cross_app.upsert_daily_snapshot(
  p_date              DATE,
  p_sleep_hours       FLOAT   DEFAULT NULL,
  p_sleep_quality     INT     DEFAULT NULL,
  p_sleep_hrv         FLOAT   DEFAULT NULL,
  p_sleep_score       FLOAT   DEFAULT NULL,
  p_hrv_readiness     FLOAT   DEFAULT NULL,
  p_true_weight_kg    FLOAT   DEFAULT NULL,
  p_pens_mode         TEXT    DEFAULT NULL,
  p_regime            TEXT    DEFAULT NULL,
  p_portfolio_pnl_pct FLOAT   DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO cross_app.daily_snapshot (
    date, sleep_hours, sleep_quality, sleep_hrv, sleep_score, hrv_readiness,
    true_weight_kg, pens_mode, regime, portfolio_pnl_pct, updated_at
  )
  VALUES (
    p_date, p_sleep_hours, p_sleep_quality, p_sleep_hrv, p_sleep_score, p_hrv_readiness,
    p_true_weight_kg, p_pens_mode, p_regime, p_portfolio_pnl_pct, NOW()
  )
  ON CONFLICT (date) DO UPDATE SET
    sleep_hours       = COALESCE(EXCLUDED.sleep_hours,       cross_app.daily_snapshot.sleep_hours),
    sleep_quality     = COALESCE(EXCLUDED.sleep_quality,     cross_app.daily_snapshot.sleep_quality),
    sleep_hrv         = COALESCE(EXCLUDED.sleep_hrv,         cross_app.daily_snapshot.sleep_hrv),
    sleep_score       = COALESCE(EXCLUDED.sleep_score,       cross_app.daily_snapshot.sleep_score),
    hrv_readiness     = COALESCE(EXCLUDED.hrv_readiness,     cross_app.daily_snapshot.hrv_readiness),
    true_weight_kg    = COALESCE(EXCLUDED.true_weight_kg,    cross_app.daily_snapshot.true_weight_kg),
    pens_mode         = COALESCE(EXCLUDED.pens_mode,         cross_app.daily_snapshot.pens_mode),
    regime            = COALESCE(EXCLUDED.regime,            cross_app.daily_snapshot.regime),
    portfolio_pnl_pct = COALESCE(EXCLUDED.portfolio_pnl_pct, cross_app.daily_snapshot.portfolio_pnl_pct),
    updated_at        = NOW();
END;
$$;
