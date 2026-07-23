import React, { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '../config/api.js';

// Fallback store used only when the backend / Supabase is unreachable.
// TODO: once SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set in backend/.env,
// every impulse round-trips through the backend and this fallback is unused.
const FALLBACK_KEY = 'investing_trade_impulses_fallback';
const DIRECTIONS = ['long', 'short'];

function loadFallback() {
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFallback(list) {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(list.slice(0, 20)));
  } catch {
    /* ignore */
  }
}

function timeAgo(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function needsReview(imp) {
  if (imp.acted) return false;
  const ms = Date.now() - new Date(imp.created_at).getTime();
  return ms > 24 * 60 * 60 * 1000;
}

export default function TradeImpulseWidget() {
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState('');
  const [direction, setDirection] = useState('long');
  const [reason, setReason] = useState('');
  const [impulses, setImpulses] = useState([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/impulses?limit=5`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      if (d.ok && d.supabase) {
        setImpulses(d.impulses || []);
        setUsingFallback(false);
        return;
      }
      throw new Error('Supabase not configured on backend');
    } catch {
      setImpulses(loadFallback());
      setUsingFallback(true);
    }
  }, []);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ticker.trim()) return;
    setSaving(true);
    const payload = {
      ticker: ticker.trim().toUpperCase(),
      direction,
      reason: reason.trim() || null,
    };

    try {
      const r = await fetch(`${API_BASE}/impulses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json().catch(() => ({ ok: false }));
      if (!r.ok || !d.ok) throw new Error(d.error || `HTTP ${r.status}`);
      await refresh();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        '[TradeImpulseWidget] backend/Supabase unavailable — logging to localStorage fallback. ' +
          'TODO: set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in backend/.env to persist impulses cross-app.',
        err,
      );
      const fallback = loadFallback();
      fallback.unshift({
        id: `local-${Date.now()}`,
        source: 'trade_router',
        ...payload,
        acted: false,
        created_at: new Date().toISOString(),
      });
      saveFallback(fallback);
      setImpulses(fallback.slice(0, 5));
      setUsingFallback(true);
    } finally {
      setSaving(false);
      setTicker('');
      setReason('');
    }
  }

  async function toggleActed(imp) {
    const nextActed = !imp.acted;
    if (usingFallback || String(imp.id).startsWith('local-')) {
      const list = loadFallback().map((i) => (i.id === imp.id ? { ...i, acted: nextActed } : i));
      saveFallback(list);
      setImpulses(list.slice(0, 5));
      return;
    }
    try {
      await fetch(`${API_BASE}/impulses/${imp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acted: nextActed, reviewed_at: new Date().toISOString() }),
      });
      await refresh();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[TradeImpulseWidget] could not update impulse:', err);
    }
  }

  const btnStyle = {
    position: 'fixed',
    bottom: 20,
    right: 20,
    zIndex: 1000,
    fontFamily: 'Syne, sans-serif',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    padding: '12px 18px',
    borderRadius: 999,
    border: '1px solid var(--orange)',
    background: '#14142a',
    color: 'var(--orange)',
    cursor: 'pointer',
    boxShadow: '0 4px 18px rgba(0,0,0,0.4)',
  };

  return (
    <>
      <button type="button" style={btnStyle} onClick={() => setOpen((v) => !v)}>
        ⚡ I want to trade
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 78,
            right: 20,
            zIndex: 1000,
            width: 320,
            maxHeight: '70vh',
            overflowY: 'auto',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 16,
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
              Trade Impulse Router
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              ✕
            </button>
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', marginBottom: 12 }}>
            Log the urge before you act. Pause. Review after 24h.
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            <input
              className="dj-input"
              placeholder="Ticker (e.g. NXE)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              style={{ width: '100%', textTransform: 'uppercase' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 6 }}>
              {DIRECTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDirection(d)}
                  style={{
                    flex: 1,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '6px 0',
                    borderRadius: 6,
                    border: `1px solid ${direction === d ? (d === 'long' ? 'var(--green)' : 'var(--red)') : 'var(--border)'}`,
                    background: direction === d ? (d === 'long' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)') : 'transparent',
                    color: direction === d ? (d === 'long' ? 'var(--green)' : 'var(--red)') : 'var(--text-dim)',
                    cursor: 'pointer',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
            <textarea
              className="dj-textarea"
              rows={2}
              placeholder="Why now? What triggered this?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: '100%' }}
            />
            <button
              type="submit"
              disabled={saving || !ticker.trim()}
              className="dj-save-btn"
              style={{ opacity: saving || !ticker.trim() ? 0.5 : 1 }}
            >
              {saving ? 'Logging…' : '+ Log impulse'}
            </button>
          </form>

          <div style={{ fontSize: '0.58rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>
            Last 5 {usingFallback && <span style={{ color: 'var(--orange)' }}>· local fallback (backend offline)</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {impulses.length === 0 ? (
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>No impulses logged yet.</div>
            ) : (
              impulses.map((imp) => {
                const flag = needsReview(imp);
                return (
                  <div
                    key={imp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: `1px solid ${flag ? 'var(--orange)' : 'var(--border)'}`,
                      background: flag ? 'rgba(251,146,60,0.06)' : 'transparent',
                    }}
                  >
                    <input type="checkbox" checked={!!imp.acted} onChange={() => toggleActed(imp)} title="Mark acted" />
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.72rem', color: '#fff' }}>{imp.ticker}</span>
                    <span
                      style={{
                        fontSize: '0.58rem',
                        textTransform: 'uppercase',
                        padding: '1px 5px',
                        borderRadius: 4,
                        background: imp.direction === 'long' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                        color: imp.direction === 'long' ? 'var(--green)' : 'var(--red)',
                      }}
                    >
                      {imp.direction || '?'}
                    </span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', marginLeft: 'auto', flexShrink: 0 }}>
                      {timeAgo(imp.created_at)}
                    </span>
                    {flag && <span title="Unreviewed >24h" style={{ fontSize: '0.65rem' }}>⏰</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}
