import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useParams, Link } from 'react-router-dom';
import { API_BASE } from '../config/api.js';
import { getPlayerId } from './storage.js';
import './fantasy.css';

export default function FantasyShell() {
  const { inviteCode } = useParams();
  const code = (inviteCode || '').toUpperCase();
  const [detail, setDetail] = useState(null);
  const playerId = getPlayerId(code);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/game/${encodeURIComponent(code)}`);
        const d = await r.json();
        if (!cancelled && d.ok) setDetail(d);
      } catch {
        if (!cancelled) setDetail(null);
      }
    })();
    const t = setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE}/game/${encodeURIComponent(code)}`);
        const d = await r.json();
        if (!cancelled && d.ok) setDetail(d);
      } catch { /* ignore */ }
    }, 12000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [code]);

  const comp = detail?.competition;
  const rules = detail?.rules;
  const title = comp?.name || 'Competition';

  const shareLine = useMemo(() => {
    if (!comp?.invite_code) return '';
    const join = `${window.location.origin}${window.location.pathname}#/fantasy/join?code=${encodeURIComponent(comp.invite_code)}`;
    return `Join “${comp.name}” — code ${comp.invite_code} — ends ${comp.end_date}. ${join}`;
  }, [comp]);

  return (
    <div className="fantasy-wrap">
      <header style={{ marginBottom: 8 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.15rem', color: '#fff' }}>
          {title}{' '}
          <span className="fantasy-muted" style={{ fontSize: '0.75rem' }}>({code})</span>
        </h1>
        {comp && (
          <p className="fantasy-muted">
            {comp.start_date} → {comp.end_date} · status: {comp.status}
          </p>
        )}
      </header>

      {rules && (
        <div className="fantasy-card" style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: '0.95rem' }}>League rules</h2>
          <ul style={{ fontSize: '0.78rem', color: 'var(--text)', marginLeft: 18, lineHeight: 1.55 }}>
            <li>Starting bankroll: <strong>${Number(rules.starting_capital).toLocaleString()}</strong></li>
            <li>Fee: <strong>{rules.fee_bps} bps</strong> per trade notional · Slippage model: <strong>{rules.slippage_bps} bps</strong> (worse fill)</li>
            <li>Trading hours: <strong>{rules.trading_hours_mode}</strong>
              {rules.trading_hours_mode === 'us_rth' && ' (US 1–5 letter tickers: NYSE hours only)'}
            </li>
            <li>Margin: <strong>{rules.margin_enabled ? `on (max borrow ≈ (${Number(rules.leverage_max).toFixed(2)}−1)× starting cash)` : 'off'}</strong></li>
            {rules.max_position_pct != null && (
              <li>Max single-name weight: <strong>{Number(rules.max_position_pct)}%</strong> of portfolio</li>
            )}
            {rules.max_players != null && (
              <li>Player cap: <strong>{rules.max_players}</strong></li>
            )}
            <li>No short selling · {rules.pct_return_basis}</li>
            {comp?.note && <li>Commissioner note: <em>{comp.note}</em></li>}
          </ul>
          {shareLine && (
            <div style={{ marginTop: 12 }}>
              <p className="fantasy-muted" style={{ marginBottom: 6 }}>WhatsApp / share</p>
              <input className="fantasy-input" readOnly value={shareLine} onFocus={e => e.target.select()} />
            </div>
          )}
        </div>
      )}

      <nav className="fantasy-nav">
        <NavLink to="market" className={({ isActive }) => (isActive ? 'active' : '')}>Market</NavLink>
        <NavLink to="portfolio" className={({ isActive }) => (isActive ? 'active' : '')}>My portfolio</NavLink>
        <NavLink to="transactions" className={({ isActive }) => (isActive ? 'active' : '')}>Transactions</NavLink>
        <NavLink to="leaderboard" className={({ isActive }) => (isActive ? 'active' : '')}>Leaderboard</NavLink>
        <NavLink to="recap" className={({ isActive }) => (isActive ? 'active' : '')}>Recap</NavLink>
        <NavLink to="admin" className={({ isActive }) => (isActive ? 'active' : '')}>Admin</NavLink>
      </nav>

      <Outlet context={{ inviteCode: code, playerId, competition: comp, detail }} />

      <p className="fantasy-muted" style={{ textAlign: 'center', marginTop: 20 }}>
        <Link to="/fantasy">Fantasy home</Link>
        {' · '}
        <Link to="/">Dashboard</Link>
      </p>
    </div>
  );
}
