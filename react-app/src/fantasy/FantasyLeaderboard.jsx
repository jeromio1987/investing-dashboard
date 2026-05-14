import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { API_BASE } from '../config/api.js';
import './fantasy.css';

export default function FantasyLeaderboard() {
  const { inviteCode, detail, playerId } = useOutletContext();
  const [rows, setRows] = useState(detail?.leaderboard || []);

  useEffect(() => {
    setRows(detail?.leaderboard || []);
  }, [detail]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch(`${API_BASE}/game/${encodeURIComponent(inviteCode)}`);
        const d = await r.json();
        if (!cancelled && d.ok && Array.isArray(d.leaderboard)) setRows(d.leaderboard);
      } catch { /* ignore */ }
    }
    const t = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [inviteCode]);

  return (
    <div className="fantasy-card">
      <h2>Leaderboard (% return)</h2>
      <p className="fantasy-muted" style={{ marginBottom: 12 }}>Updates automatically · starting bankroll from competition rules</p>
      <table className="fantasy-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Total</th>
            <th>Return</th>
            <th>Top holding</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.player_id} style={playerId && row.player_id === playerId ? { background: 'rgba(45,212,191,0.08)' } : undefined}>
              <td>{row.rank}</td>
              <td>
                <strong>{row.display_name}</strong>
                {playerId && row.player_id === playerId && <span className="fantasy-muted"> (you)</span>}
              </td>
              <td>${Number(row.total_value).toLocaleString()}</td>
              <td style={{ color: row.pct_return >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {row.pct_return >= 0 ? '+' : ''}{Number(row.pct_return).toFixed(2)}%
              </td>
              <td className="fantasy-muted">
                {row.top_holding
                  ? `${row.top_holding.ticker} (${row.top_holding.asset_type}) $${Number(row.top_holding.market_value).toLocaleString()}`
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="fantasy-muted" style={{ marginTop: 12 }}>No players yet.</p>}
      <p style={{ marginTop: 16 }}>
        <Link to="../portfolio">My portfolio</Link>
      </p>
    </div>
  );
}
