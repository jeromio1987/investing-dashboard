import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { API_BASE } from '../config/api.js';
import { getCommissionerToken, setCommissionerToken } from './storage.js';
import './fantasy.css';

export default function FantasyAdmin() {
  const { inviteCode } = useOutletContext();
  const [token, setToken] = useState(() => getCommissionerToken(inviteCode) || '');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [extendEnd, setExtendEnd] = useState('');
  const [splitTicker, setSplitTicker] = useState('');
  const [splitFrom, setSplitFrom] = useState('1');
  const [splitTo, setSplitTo] = useState('1');
  const [splitEff, setSplitEff] = useState(() => new Date().toISOString().slice(0, 16));

  async function post(body) {
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      const r = await fetch(`${API_BASE}/game/${encodeURIComponent(inviteCode)}/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissioner_token: token.trim(), ...body }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(typeof d.detail === 'string' ? d.detail : JSON.stringify(d.detail || d));
        return;
      }
      setMsg('Saved.');
      if (token.trim()) setCommissionerToken(inviteCode, token.trim());
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="fantasy-card">
        <h2>Commissioner</h2>
        <p className="fantasy-muted" style={{ marginBottom: 12 }}>
          Paste the secret token you received when creating this league (stored in this browser if you created it here).
        </p>
        <input
          className="fantasy-input"
          style={{ width: '100%', marginBottom: 10 }}
          placeholder="Commissioner token"
          value={token}
          onChange={e => setToken(e.target.value)}
        />
        {err && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{err}</p>}
        {msg && <p style={{ color: 'var(--green)', fontSize: '0.85rem' }}>{msg}</p>}

        <div style={{ marginTop: 16 }}>
          <button type="button" className="fantasy-btn primary" disabled={busy} onClick={() => post({ end_now: true })}>
            End competition now
          </button>
        </div>

        <div className="fantasy-row" style={{ marginTop: 16, flexDirection: 'column', alignItems: 'stretch' }}>
          <label className="fantasy-muted">Extend end date</label>
          <div className="fantasy-row">
            <input className="fantasy-input" type="date" value={extendEnd} onChange={e => setExtendEnd(e.target.value)} />
            <button type="button" className="fantasy-btn" disabled={busy || !extendEnd} onClick={() => post({ extend_end_date: extendEnd })}>
              Apply
            </button>
          </div>
        </div>

        <div className="fantasy-row" style={{ marginTop: 16, flexDirection: 'column', alignItems: 'stretch' }}>
          <label className="fantasy-muted">League note (shown in rules)</label>
          <textarea className="fantasy-input" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Rules reminder for players…" />
          <button type="button" className="fantasy-btn" disabled={busy} onClick={() => post({ note })} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
            Save note
          </button>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: 8 }}>Stock split (league-wide)</h3>
          <p className="fantasy-muted" style={{ marginBottom: 10 }}>
            e.g. 10-for-1: from_shares=1, to_shares=10. Adjusts share counts on leaderboard/portfolio for trades before <code>effective_at</code>.
          </p>
          <input className="fantasy-input" placeholder="Ticker e.g. NVDA" value={splitTicker} onChange={e => setSplitTicker(e.target.value.toUpperCase())} />
          <div className="fantasy-row" style={{ marginTop: 8 }}>
            <input className="fantasy-input" type="number" placeholder="from" value={splitFrom} onChange={e => setSplitFrom(e.target.value)} />
            <input className="fantasy-input" type="number" placeholder="to" value={splitTo} onChange={e => setSplitTo(e.target.value)} />
          </div>
          <input className="fantasy-input" style={{ marginTop: 8 }} type="datetime-local" value={splitEff} onChange={e => setSplitEff(e.target.value)} />
          <button
            type="button"
            className="fantasy-btn"
            disabled={busy || !splitTicker}
            style={{ marginTop: 10 }}
            onClick={() =>
              post({
                apply_split: {
                  ticker: splitTicker,
                  from_shares: parseFloat(splitFrom) || 1,
                  to_shares: parseFloat(splitTo) || 1,
                  effective_at: new Date(splitEff).toISOString(),
                },
              })
            }
          >
            Record split
          </button>
        </div>
      </div>

      <p className="fantasy-muted">
        <Link to="../leaderboard">← Leaderboard</Link>
      </p>
    </div>
  );
}
