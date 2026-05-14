import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { API_BASE } from '../config/api.js';
import { pushLocalAchievementBadge } from './storage.js';
import './fantasy.css';

export default function FantasyRecap() {
  const { inviteCode, playerId } = useOutletContext();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!inviteCode) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/game/${encodeURIComponent(inviteCode)}/recap`);
        const d = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          setErr(typeof d.detail === 'string' ? d.detail : JSON.stringify(d.detail || d));
          setData(null);
          return;
        }
        setErr('');
        setData(d);
        if (playerId && d.ok) {
          pushLocalAchievementBadge(playerId, {
            id: 'recap_reader',
            label: 'League historian',
            description: 'Opened the weekly recap.',
          });
        }
      } catch (e) {
        if (!cancelled) setErr(String(e.message || e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inviteCode, playerId]);

  const s = data?.structured;

  return (
    <div>
      <div className="fantasy-card">
        <h2>Weekly recap</h2>
        <p className="fantasy-muted" style={{ marginBottom: 12 }}>
          Rolling 7-day league activity. Movers use Yahoo session % change for symbols your league traded (not historical OHLC).
        </p>
        {err && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{err}</p>}
        {data?.ok && (
          <>
            <p className="fantasy-muted" style={{ marginBottom: 8 }}>
              {data.trade_count} fill{data.trade_count === 1 ? '' : 's'} in window · since {data.since?.slice(0, 10)}
            </p>
            <ul style={{ fontSize: '0.88rem', lineHeight: 1.55, marginLeft: 18, color: 'var(--text)' }}>
              {(data.summary_lines || []).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            {s && (
              <div style={{ marginTop: 16, fontSize: '0.78rem' }} className="fantasy-muted">
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    background: 'rgba(0,0,0,0.25)',
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}
                >
                  {JSON.stringify(s, null, 2)}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
      <p className="fantasy-muted">
        <Link to="../portfolio">Portfolio</Link>
        {' · '}
        <Link to="../market">Market</Link>
      </p>
    </div>
  );
}
