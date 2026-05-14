import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../config/api.js';
import { setPlayerId } from './storage.js';
import './fantasy.css';

export default function FantasyJoin() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(() => (params.get('code') || '').toUpperCase());
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const c = params.get('code');
    if (c) setCode(c.toUpperCase());
  }, [params]);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    const c = code.trim().toUpperCase();
    const dn = name.trim();
    if (!c || !dn) {
      setErr('Invite code and display name are required.');
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/game/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: c, display_name: dn }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(d.detail || d.error || r.statusText || 'Join failed');
        return;
      }
      const pid = d.player?.id;
      if (!pid) {
        setErr('Unexpected response');
        return;
      }
      setPlayerId(c, pid);
      navigate(`/fantasy/play/${c}/portfolio`);
    } catch (ex) {
      setErr(String(ex.message || ex));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fantasy-wrap">
      <div className="fantasy-card">
        <h2>Enter your name</h2>
        <p className="fantasy-muted" style={{ marginBottom: 12 }}>
          Competition code: <span className="fantasy-code">{code || '—'}</span>
        </p>
        <form onSubmit={submit}>
          <div className="fantasy-row">
            <input
              className="fantasy-input"
              placeholder="Invite code"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
            />
          </div>
          <div className="fantasy-row">
            <input
              className="fantasy-input"
              placeholder="Display name (shown on leaderboard)"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={64}
            />
            <button type="submit" className="fantasy-btn primary" disabled={loading}>
              {loading ? 'Joining…' : 'Join & open portfolio'}
            </button>
          </div>
        </form>
        {err && <p style={{ color: 'var(--red)', fontSize: '0.8rem', marginTop: 10 }}>{err}</p>}
      </div>
      <p className="fantasy-muted" style={{ textAlign: 'center' }}>
        <Link to="/fantasy">← Home</Link>
      </p>
    </div>
  );
}
