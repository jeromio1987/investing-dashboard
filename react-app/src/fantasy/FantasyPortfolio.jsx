import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useOutletContext } from 'react-router-dom';
import { API_BASE } from '../config/api.js';
import { getLocalAchievementBadges } from './storage.js';
import './fantasy.css';

export default function FantasyPortfolio() {
  const { inviteCode, playerId } = useOutletContext();
  const [data, setData] = useState(null);
  const [ach, setAch] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!playerId) return;
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch(`${API_BASE}/player/${encodeURIComponent(playerId)}/portfolio`);
        const d = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          setErr(typeof d.detail === 'string' ? d.detail : JSON.stringify(d.detail || d));
          setData(null);
          return;
        }
        setErr('');
        setData(d);
      } catch (e) {
        if (!cancelled) setErr(String(e.message || e));
      }
    }
    load();
    const t = setInterval(load, 12000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [playerId]);

  useEffect(() => {
    if (!playerId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/player/${encodeURIComponent(playerId)}/achievements`);
        const d = await r.json();
        if (!cancelled && r.ok && d.ok) setAch(d);
      } catch {
        if (!cancelled) setAch(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [playerId]);

  const mergedBadges = useMemo(() => {
    const server = Array.isArray(ach?.badges) ? ach.badges : [];
    const local = getLocalAchievementBadges(playerId);
    const seen = new Set();
    const out = [];
    for (const b of [...server, ...local]) {
      if (!b?.id || seen.has(b.id)) continue;
      seen.add(b.id);
      out.push(b);
    }
    return out;
  }, [ach, playerId]);

  if (!playerId) {
    return <Navigate to={`/fantasy/join?code=${encodeURIComponent(inviteCode)}`} replace />;
  }

  const p = data?.player;
  const pct = data?.pct_return_vs_start;

  return (
    <div>
      <div className="fantasy-card">
        <h2>{p?.display_name || 'Portfolio'}</h2>
        {err && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{err}</p>}
        {data?.ok && (
          <>
            <p style={{ fontSize: '0.9rem', marginBottom: 8 }}>
              Cash <strong>${Number(p.cash_balance).toLocaleString()}</strong>
              {' · '}Holdings MV <strong>${Number(data.holdings_market_value).toLocaleString()}</strong>
            </p>
            <p style={{ fontSize: '1.05rem' }}>
              Total value <strong style={{ color: 'var(--teal)' }}>${Number(data.total_value).toLocaleString()}</strong>
              {' · '}
              vs start{' '}
              <strong style={{ color: (pct || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {(pct || 0) >= 0 ? '+' : ''}{Number(pct).toFixed(2)}%
              </strong>
            </p>
            <p className="fantasy-muted" style={{ marginTop: 6 }}>
              Unrealized P&amp;L (vs avg cost){' '}
              <strong>{Number(data.unrealized_pnl) >= 0 ? '+' : ''}{Number(data.unrealized_pnl).toFixed(2)}</strong>
            </p>
            {data.daily_pnl_mark_to_market != null && (
              <p className="fantasy-muted" style={{ marginTop: 6 }}>
                Today&apos;s est. P&amp;L (vs prior close, stocks/commodities){' '}
                <strong style={{ color: Number(data.daily_pnl_mark_to_market) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {Number(data.daily_pnl_mark_to_market) >= 0 ? '+' : ''}{Number(data.daily_pnl_mark_to_market).toFixed(2)}
                </strong>
              </p>
            )}
          </>
        )}
      </div>

      {!!mergedBadges.length && (
        <div className="fantasy-card">
          <h2>Achievements</h2>
          <p className="fantasy-muted" style={{ marginBottom: 10, fontSize: '0.78rem' }}>
            Cosmetic only. Server rules merge with badges you unlock in this browser (e.g. opening Recap).
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {mergedBadges.map(b => (
              <span
                key={b.id}
                title={b.description || b.label}
                style={{
                  fontSize: '0.75rem',
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: 'rgba(0,212,170,0.08)',
                  color: 'var(--teal)',
                }}
              >
                {b.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="fantasy-card">
        <h2>Holdings</h2>
        {!data?.holdings?.length && <p className="fantasy-muted">No open positions.</p>}
        {!!data?.holdings?.length && (
          <table className="fantasy-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Feed</th>
                <th>Value</th>
                <th>U. P&amp;L</th>
                <th>Day est.</th>
              </tr>
            </thead>
            <tbody>
              {data.holdings.map(h => (
                <tr key={`${h.ticker}-${h.asset_type}`}>
                  <td><strong>{h.ticker}</strong></td>
                  <td>{h.asset_type}</td>
                  <td>{h.quantity}</td>
                  <td>{h.current_price != null ? Number(h.current_price).toFixed(4) : '—'}</td>
                  <td>
                    {h.price_stale ? (
                      <span style={{ color: 'var(--yellow)', fontSize: '0.72rem' }} title="Mark from cached quote">stale</span>
                    ) : (
                      <span className="fantasy-muted" style={{ fontSize: '0.72rem' }}>live</span>
                    )}
                  </td>
                  <td>{h.market_value != null ? `$${Number(h.market_value).toLocaleString()}` : '—'}</td>
                  <td>{h.unrealized_pnl != null ? `$${Number(h.unrealized_pnl).toLocaleString()}` : '—'}</td>
                  <td className="fantasy-muted">
                    {h.daily_pnl != null ? `${Number(h.daily_pnl) >= 0 ? '+' : ''}$${Number(h.daily_pnl).toFixed(2)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="fantasy-muted">
        <Link to="../market">Go to market</Link>
        {' · '}
        <Link to="../recap">Weekly recap</Link>
        {' · '}
        <Link to="../transactions">Transactions</Link>
      </p>
    </div>
  );
}
