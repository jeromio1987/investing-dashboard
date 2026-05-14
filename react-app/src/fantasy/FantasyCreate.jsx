import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config/api.js';
import { setCommissionerToken } from './storage.js';
import './fantasy.css';

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function plusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function FantasyCreate() {
  const [name, setName] = useState('');
  const [starting, setStarting] = useState('100000');
  const [start, setStart] = useState(todayISO());
  const [end, setEnd] = useState(plusDays(30));
  const [note, setNote] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [feeBps, setFeeBps] = useState('0');
  const [slipBps, setSlipBps] = useState('0');
  const [maxPosPct, setMaxPosPct] = useState('');
  const [tradingHours, setTradingHours] = useState('always');
  const [margin, setMargin] = useState(false);
  const [leverageMax, setLeverageMax] = useState('2');
  const [created, setCreated] = useState(null);
  const [commToken, setCommToken] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const body = {
        name: name.trim(),
        starting_capital: parseFloat(starting) || 100000,
        start_date: start,
        end_date: end,
        trading_hours_mode: tradingHours,
        margin_enabled: margin,
        leverage_max: parseFloat(leverageMax) || 2,
        fee_bps: parseInt(feeBps, 10) || 0,
        slippage_bps: parseInt(slipBps, 10) || 0,
      };
      if (note.trim()) body.note = note.trim();
      if (maxPlayers.trim()) body.max_players = parseInt(maxPlayers, 10);
      if (maxPosPct.trim()) body.max_position_pct = parseFloat(maxPosPct);
      const r = await fetch(`${API_BASE}/game/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(typeof d.detail === 'string' ? d.detail : JSON.stringify(d.detail || d));
        return;
      }
      setCreated(d.competition);
      const tok = d.commissioner_token;
      setCommToken(tok || '');
      if (tok && d.competition?.invite_code) {
        setCommissionerToken(d.competition.invite_code, tok);
      }
    } catch (ex) {
      setErr(String(ex.message || ex));
    } finally {
      setLoading(false);
    }
  }

  const shareUrl = created
    ? `${window.location.origin}${window.location.pathname}#/fantasy/join?code=${encodeURIComponent(created.invite_code)}`
    : '';

  return (
    <div className="fantasy-wrap">
      {!created ? (
        <div className="fantasy-card">
          <h2>New competition</h2>
          <form onSubmit={submit}>
            <div className="fantasy-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <label className="fantasy-muted">League name</label>
              <input className="fantasy-input" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="fantasy-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <label className="fantasy-muted">Starting cash (USD)</label>
              <input className="fantasy-input" type="number" min="1000" step="1000" value={starting} onChange={e => setStarting(e.target.value)} />
            </div>
            <div className="fantasy-row">
              <div style={{ flex: 1 }}>
                <label className="fantasy-muted">Start date</label>
                <input className="fantasy-input" type="date" value={start} onChange={e => setStart(e.target.value)} required />
              </div>
              <div style={{ flex: 1 }}>
                <label className="fantasy-muted">End date</label>
                <input className="fantasy-input" type="date" value={end} onChange={e => setEnd(e.target.value)} required />
              </div>
            </div>
            <div className="fantasy-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <label className="fantasy-muted">Optional note (rules / house rules)</label>
              <textarea className="fantasy-input" rows={2} value={note} onChange={e => setNote(e.target.value)} />
            </div>
            <div className="fantasy-row">
              <div style={{ flex: 1 }}>
                <label className="fantasy-muted">Max players (optional)</label>
                <input className="fantasy-input" type="number" min="2" placeholder="∞" value={maxPlayers} onChange={e => setMaxPlayers(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="fantasy-muted">Max % in one name (optional)</label>
                <input className="fantasy-input" type="number" min="5" max="100" step="1" placeholder="e.g. 40" value={maxPosPct} onChange={e => setMaxPosPct(e.target.value)} />
              </div>
            </div>
            <div className="fantasy-row">
              <div style={{ flex: 1 }}>
                <label className="fantasy-muted">Fee (basis points / trade)</label>
                <input className="fantasy-input" type="number" min="0" max="500" value={feeBps} onChange={e => setFeeBps(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="fantasy-muted">Slippage (bps, worse price)</label>
                <input className="fantasy-input" type="number" min="0" max="500" value={slipBps} onChange={e => setSlipBps(e.target.value)} />
              </div>
            </div>
            <div className="fantasy-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <label className="fantasy-muted">Trading hours</label>
              <select className="fantasy-input" value={tradingHours} onChange={e => setTradingHours(e.target.value)}>
                <option value="always">24/7 (calendar league dates only)</option>
                <option value="us_rth">US stocks: NYSE regular hours only (9:30–16:00 ET)</option>
              </select>
            </div>
            <div className="fantasy-row" style={{ alignItems: 'center' }}>
              <label className="fantasy-muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={margin} onChange={e => setMargin(e.target.checked)} />
                Allow margin (borrow up to (leverage−1)× starting cash)
              </label>
            </div>
            <div className="fantasy-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <label className="fantasy-muted">Leverage max (if margin on)</label>
              <input className="fantasy-input" type="number" min="1" max="10" step="0.1" value={leverageMax} onChange={e => setLeverageMax(e.target.value)} disabled={!margin} />
            </div>
            <button type="submit" className="fantasy-btn primary" disabled={loading || !name.trim()}>
              {loading ? 'Creating…' : 'Generate invite code'}
            </button>
          </form>
          {err && <p style={{ color: 'var(--red)', fontSize: '0.8rem', marginTop: 10 }}>{err}</p>}
        </div>
      ) : (
        <div className="fantasy-card">
          <h2>Share this code</h2>
          <p className="fantasy-code" style={{ margin: '16px 0' }}>{created.invite_code}</p>
          <p className="fantasy-muted" style={{ marginBottom: 8 }}>Join link</p>
          <input className="fantasy-input" readOnly value={shareUrl} onFocus={e => e.target.select()} />
          {commToken && (
            <div style={{ marginTop: 16, padding: 12, border: '1px solid var(--yellow)', borderRadius: 8 }}>
              <p className="fantasy-muted" style={{ marginBottom: 8 }}>Commissioner token (save it — shown once). Stored in this browser for Admin.</p>
              <input className="fantasy-input" readOnly value={commToken} onFocus={e => e.target.select()} />
            </div>
          )}
          <p style={{ marginTop: 16 }}>
            <a href={`#/fantasy/join?code=${encodeURIComponent(created.invite_code)}`} className="fantasy-btn primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Preview join page
            </a>
          </p>
        </div>
      )}
      <p className="fantasy-muted" style={{ textAlign: 'center' }}>
        <Link to="/fantasy">← Home</Link>
      </p>
    </div>
  );
}
