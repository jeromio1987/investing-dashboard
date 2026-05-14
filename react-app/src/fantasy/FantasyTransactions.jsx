import React, { useEffect, useState } from 'react';
import { Link, Navigate, useOutletContext } from 'react-router-dom';
import { API_BASE } from '../config/api.js';
import './fantasy.css';

export default function FantasyTransactions() {
  const { inviteCode, playerId } = useOutletContext();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!playerId) return;
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch(`${API_BASE}/player/${encodeURIComponent(playerId)}/trades?limit=200`);
        const d = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          setErr(typeof d.detail === 'string' ? d.detail : JSON.stringify(d.detail || d));
          return;
        }
        setErr('');
        setRows(d.trades || []);
      } catch (e) {
        if (!cancelled) setErr(String(e.message || e));
      }
    }
    load();
    const t = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [playerId]);

  if (!playerId) {
    return <Navigate to={`/fantasy/join?code=${encodeURIComponent(inviteCode)}`} replace />;
  }

  return (
    <div className="fantasy-card">
      <h2>Transaction history</h2>
      {err && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{err}</p>}
      <p className="fantasy-muted" style={{ marginBottom: 12 }}>All virtual fills, newest first (fees &amp; slippage per league rules).</p>
      <div style={{ overflowX: 'auto' }}>
        <table className="fantasy-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Side</th>
              <th>Symbol</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Notional</th>
              <th>Fee</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(tr => (
              <tr key={tr.id}>
                <td className="fantasy-muted" style={{ whiteSpace: 'nowrap' }}>{String(tr.executed_at || '').slice(0, 19).replace('T', ' ')}</td>
                <td>{tr.direction}</td>
                <td><strong>{tr.ticker}</strong></td>
                <td>{tr.asset_type}</td>
                <td>{tr.quantity}</td>
                <td>{tr.price_at_trade != null ? Number(tr.price_at_trade).toFixed(6) : '—'}</td>
                <td>${Number(tr.total_value || 0).toLocaleString()}</td>
                <td>{tr.fee_paid != null && Number(tr.fee_paid) > 0 ? `$${Number(tr.fee_paid).toFixed(2)}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && !err && <p className="fantasy-muted" style={{ marginTop: 12 }}>No trades yet.</p>}
      <p style={{ marginTop: 16 }}>
        <Link to="../portfolio">← Portfolio</Link>
      </p>
    </div>
  );
}
