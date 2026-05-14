import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { API_BASE } from '../config/api.js';

const SECTORS = [
  'Uranium/Nuclear', 'AI Infrastructure', 'LNG/Gas Infra', 'Energy E&P',
  'Defence SMID', 'Silver Miners', 'Gene Editing', 'Bio-AI',
  'Utilities/Power', 'Financials', 'Healthcare', 'Other',
];
const SECTOR_COLORS = {
  'Uranium/Nuclear':   '#c084fc',
  'AI Infrastructure': '#fbbf24',
  'LNG/Gas Infra':     '#2dd4bf',
  'Energy E&P':        '#fb923c',
  'Defence SMID':      '#f97316',
  'Silver Miners':     '#a78bfa',
  'Gene Editing':      '#60a5fa',
  'Bio-AI':            '#f87171',
  'Utilities/Power':   '#4ade80',
  'Financials':        '#34d399',
  'Healthcare':        '#38bdf8',
  'Other':             '#64748b',
};
const SMID_SECS = ['Uranium/Nuclear', 'AI Infrastructure', 'LNG/Gas Infra', 'Energy E&P', 'Defence SMID', 'Silver Miners', 'Gene Editing', 'Bio-AI'];

function squarify(items, x, y, w, h) {
  if (!items.length) return [];
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) return [];
  const blocks = [];

  function layout(nodes, x0, y0, w0, h0) {
    if (!nodes.length) return;
    if (nodes.length === 1) {
      blocks.push({ ...nodes[0], x: x0, y: y0, w: w0, h: h0 });
      return;
    }
    const half = nodes.reduce((s, n) => s + n.value, 0) / 2;
    let acc = 0;
    let split = 0;
    for (let i = 0; i < nodes.length; i++) {
      acc += nodes[i].value;
      if (acc >= half) { split = i + 1; break; }
    }
    const aFrac = nodes.slice(0, split).reduce((s, n) => s + n.value, 0) / (nodes.reduce((s, n) => s + n.value, 0) || 1);
    if (w0 > h0) {
      layout(nodes.slice(0, split), x0, y0, w0 * aFrac, h0);
      layout(nodes.slice(split), x0 + w0 * aFrac, y0, w0 * (1 - aFrac), h0);
    } else {
      layout(nodes.slice(0, split), x0, y0, w0, h0 * aFrac);
      layout(nodes.slice(split), x0, y0 + h0 * aFrac, w0, h0 * (1 - aFrac));
    }
  }
  layout(items, x, y, w, h);
  return blocks;
}

function drawTreemap(canvas, positions) {
  if (!canvas || !positions.length) return;
  const wrap = canvas.parentElement;
  const W = wrap ? wrap.offsetWidth - 2 : 800;
  const H = 280;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, W, H);

  const totMkt = positions.reduce((s, p) => s + (p.mv || 0), 0);
  if (totMkt === 0) return;

  const items = positions.map(p => ({
    label: p.ticker,
    value: p.mv || 0,
    color: SECTOR_COLORS[p.sector] || '#64748b',
    pct:   p.pct ?? 0,
  }));

  const blocks = squarify(items, 2, 2, W - 4, H - 4);
  blocks.forEach(b => {
    const col = b.color;
    ctx.fillStyle = col + '18';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = col + '60';
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    if (b.w > 40 && b.h > 28) {
      ctx.fillStyle = '#fff';
      ctx.font = `700 ${Math.min(12, b.w / 5)}px Syne, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 - 6);
      const sign = b.pct >= 0 ? '+' : '';
      ctx.fillStyle = b.pct >= 0 ? '#4ade80' : '#f87171';
      ctx.font = `400 ${Math.min(10, b.w / 6)}px DM Sans, sans-serif`;
      ctx.fillText(`${sign}${Number(b.pct).toFixed(1)}%`, b.x + b.w / 2, b.y + b.h / 2 + 8);
    }
  });
}

function verdictColor(level) {
  if (level === 'danger') return 'var(--red)';
  if (level === 'warn') return 'var(--orange)';
  if (level === 'ok' || level === 'info') return 'var(--green)';
  return 'var(--text-dim)';
}

export default function Portfolio({ isActive }) {
  const [snapshot, setSnapshot] = useState(null);
  const [verdict, setVerdict]   = useState(null);
  const [loadErr, setLoadErr]   = useState('');
  const [editId, setEditId]     = useState(null);

  const [ticker, setTicker]       = useState('');
  const [sector, setSector]       = useState(SECTORS[0]);
  const [shares, setShares]       = useState('');
  const [cost, setCost]           = useState('');
  const [account, setAccount]     = useState('default');
  const [positionType, setPositionType] = useState('equity');
  const [notes, setNotes]         = useState('');

  const canvasRef = useRef(null);

  const load = useCallback(async () => {
    setLoadErr('');
    try {
      const [sRes, vRes] = await Promise.all([
        fetch(`${API_BASE}/portfolio/snapshot`),
        fetch(`${API_BASE}/verdict`),
      ]);
      const s = await sRes.json();
      const v = await vRes.json();
      if (!sRes.ok) throw new Error(s.error || s.detail || `snapshot ${sRes.status}`);
      setSnapshot(s);
      setVerdict(v.ok ? v : { ok: true, warnings: [{ level: 'info', code: 'VERDICT', message: 'Verdict unavailable.' }] });
    } catch (e) {
      setLoadErr(e.message || String(e));
      setSnapshot(null);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return undefined;
    load();
    const id = setInterval(load, 90_000);
    return () => clearInterval(id);
  }, [isActive, load]);

  const holdings = snapshot?.holdings || [];
  const withCalc = holdings.map(p => {
    const liveP = p.live_price ?? 0;
    const qty = Number(p.quantity);
    const cst = Number(p.cost_price);
    const cb = p.cost_basis ?? qty * cst;
    const mv = p.market_value ?? qty * liveP;
    const pnlPct = p.pnl_pct ?? (cb > 0 ? ((mv - cb) / cb) * 100 : 0);
    return {
      ...p,
      ticker: p.ticker,
      sector: p.sector || 'Other',
      shares: qty,
      cost: cst,
      livePrice: liveP,
      cb,
      mv,
      pnl: p.pnl ?? mv - cb,
      pct: pnlPct,
    };
  });

  const totMkt  = snapshot?.total_mv ?? withCalc.reduce((s, p) => s + p.mv, 0);
  const totCost = snapshot?.total_cost ?? withCalc.reduce((s, p) => s + p.cb, 0);
  const totPnl  = snapshot?.total_pnl ?? totMkt - totCost;
  const smidPct = totMkt > 0
    ? withCalc.filter(p => SMID_SECS.includes(p.sector)).reduce((s, p) => s + p.mv, 0) / totMkt * 100
    : 0;
  const topPos  = withCalc.length ? withCalc.reduce((a, b) => a.mv > b.mv ? a : b) : null;
  const dailyPct = snapshot?.daily_pnl_pct;
  const alloc = snapshot?.allocation_by_type || {};
  const chart = snapshot?.chart_30d || [];

  useEffect(() => {
    if (isActive && canvasRef.current) {
      setTimeout(() => drawTreemap(canvasRef.current, withCalc), 50);
    }
  }, [isActive, withCalc]);

  function resetForm() {
    setTicker('');
    setShares('');
    setCost('');
    setNotes('');
    setAccount('default');
    setPositionType('equity');
    setSector(SECTORS[0]);
    setEditId(null);
  }

  function startEdit(row) {
    setEditId(row.id);
    setTicker(row.ticker || '');
    setSector(row.sector && SECTORS.includes(row.sector) ? row.sector : 'Other');
    setShares(String(row.quantity ?? ''));
    setCost(String(row.cost_price ?? ''));
    setAccount(row.account || 'default');
    setPositionType(row.position_type || 'equity');
    setNotes(row.notes || '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ticker || !shares || !cost) {
      window.alert('Ticker, quantity, and cost price are required.');
      return;
    }
    const body = {
      ticker: ticker.toUpperCase(),
      quantity: parseFloat(shares),
      cost_price: parseFloat(cost),
      currency: 'USD',
      account,
      position_type: positionType,
      sector,
      notes: notes || null,
    };
    try {
      const url = editId ? `${API_BASE}/portfolio/${editId}` : `${API_BASE}/portfolio`;
      const method = editId ? 'PUT' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok || j.ok === false) throw new Error(j.error || r.statusText);
      resetForm();
      await load();
    } catch (err) {
      window.alert(err.message || String(err));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this position?')) return;
    try {
      const r = await fetch(`${API_BASE}/portfolio/${id}`, { method: 'DELETE' });
      const j = await r.json();
      if (!r.ok || j.ok === false) throw new Error(j.error || r.statusText);
      if (editId === id) resetForm();
      await load();
    } catch (err) {
      window.alert(err.message || String(err));
    }
  }

  const fmt = n => n >= 0 ? `+$${Math.round(n).toLocaleString()}` : `-$${Math.abs(Math.round(n)).toLocaleString()}`;

  return (
    <div className={`tab-panel${isActive ? ' active' : ''}`} id="tab-portfolio">
      {loadErr && (
        <div style={{ color: 'var(--red)', fontSize: '0.75rem', padding: '8px 12px', marginBottom: 8, border: '1px solid var(--border)', borderRadius: 8 }}>
          Backend: {loadErr} — start FastAPI (<code>python server_v2.py</code>) and set <code>VITE_API_URL</code> if needed.
        </div>
      )}

      {/* Finance verdict */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
        <div style={{ fontFamily: 'Syne', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>
          Finance Verdict
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(verdict?.warnings || []).map(w => (
            <div
              key={`${w.code}-${w.message}`}
              style={{ fontSize: '0.75rem', color: verdictColor(w.level), borderLeft: `3px solid ${verdictColor(w.level)}`, paddingLeft: 8 }}
            >
              {w.message}
            </div>
          ))}
        </div>
      </div>

      <div className="port-kpi-bar">
        <div className="port-kpi">
          <div className="port-kpi-val">{totMkt > 0 ? `$${Math.round(totMkt).toLocaleString()}` : '$—'}</div>
          <div className="port-kpi-lbl">Market Value</div>
        </div>
        <div className="port-kpi">
          <div className="port-kpi-val" style={{ color: totPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {totMkt > 0 ? fmt(totPnl) : '$—'}
          </div>
          <div className="port-kpi-lbl">Total P&L</div>
        </div>
        <div className="port-kpi">
          <div className="port-kpi-val" style={{ color: dailyPct == null ? 'var(--text-dim)' : dailyPct >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {dailyPct == null ? '—' : `${dailyPct >= 0 ? '+' : ''}${dailyPct.toFixed(2)}%`}
          </div>
          <div className="port-kpi-lbl">Day P&L %</div>
        </div>
        <div className="port-kpi">
          <div className="port-kpi-val">{withCalc.length}</div>
          <div className="port-kpi-lbl">Positions</div>
        </div>
        <div className="port-kpi">
          <div className="port-kpi-val" style={{ color: smidPct > 25 ? 'var(--orange)' : smidPct > 15 ? 'var(--yellow)' : 'var(--green)' }}>
            {smidPct.toFixed(1)}%
          </div>
          <div className="port-kpi-lbl">SMID Exposure</div>
        </div>
        <div className="port-kpi">
          <div className="port-kpi-val">{topPos ? `${topPos.ticker} ${totMkt > 0 ? (topPos.mv / totMkt * 100).toFixed(1) + '%' : ''}` : '—'}</div>
          <div className="port-kpi-lbl">Top Position</div>
        </div>
      </div>

      {Object.keys(alloc).length > 0 && (
        <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: 10 }}>
          Allocation by type:{' '}
          {Object.entries(alloc).map(([k, v]) => (
            <span key={k} style={{ marginRight: 10 }}><strong style={{ color: '#fff' }}>{k}</strong> {v}%</span>
          ))}
        </div>
      )}

      {chart.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <div style={{ fontFamily: 'Syne', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>
            Portfolio value (30d, equity positions)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} />
              <YAxis tick={{ fill: '#888', fontSize: 10 }} width={56} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #333' }} formatter={v => [`$${Number(v).toLocaleString()}`, 'Value']} />
              <Line type="monotone" dataKey="total_mv" name="Value" stroke="#4ade80" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <form className="port-form" onSubmit={handleSubmit}>
        <input className="port-input" placeholder="TICKER" value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())} style={{ textTransform: 'uppercase', width: 80 }} />
        <select className="port-input" value={sector} onChange={e => setSector(e.target.value)}>
          {SECTORS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="port-input" value={positionType} onChange={e => setPositionType(e.target.value)} style={{ width: 88 }}>
          <option value="equity">equity</option>
          <option value="cash">cash</option>
          <option value="other">other</option>
        </select>
        <input className="port-input" placeholder="account" value={account}
          onChange={e => setAccount(e.target.value)} style={{ width: 90 }} />
        <input className="port-input" type="number" step="any" placeholder="Qty" value={shares}
          onChange={e => setShares(e.target.value)} style={{ width: 80 }} />
        <input className="port-input" type="number" step="any" placeholder="Cost $" value={cost}
          onChange={e => setCost(e.target.value)} style={{ width: 90 }} />
        <input className="port-input" placeholder="Notes" value={notes}
          onChange={e => setNotes(e.target.value)} />
        <button type="submit" className="port-add-btn">{editId ? 'Save' : '+ Add'}</button>
        {editId && (
          <button type="button" className="port-rm" onClick={resetForm} style={{ marginLeft: 8 }}>Cancel</button>
        )}
      </form>

      {withCalc.length === 0 ? (
        <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', padding: '20px', fontStyle: 'italic' }}>
          No holdings in Supabase yet. Add above (requires <code>SUPABASE_*</code> on the backend).
        </div>
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <table className="port-table">
            <thead>
              <tr>
                {['Ticker', 'Type', 'Sector', 'Qty', 'Cost', 'Live', 'Basis', 'Mkt Val', 'P&L', '%', 'Alloc', 'Acct', 'Notes', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withCalc.map(p => {
                const col = SECTOR_COLORS[p.sector] || '#64748b';
                const allocPct = totMkt > 0 ? (p.mv / totMkt * 100).toFixed(1) : '0.0';
                return (
                  <tr key={p.id} style={{ borderLeft: `3px solid ${col}44` }}>
                    <td style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, color: '#fff' }}>{p.ticker}</td>
                    <td style={{ fontSize: '0.6rem' }}>{p.position_type}</td>
                    <td style={{ color: col, fontSize: '0.6rem' }}>{p.sector}</td>
                    <td>{p.shares.toLocaleString()}</td>
                    <td>${p.cost.toFixed(2)}</td>
                    <td>{p.livePrice ? `$${p.livePrice.toFixed(2)}` : <span style={{ color: 'var(--text-dim)' }}>n/a</span>}</td>
                    <td>${Math.round(p.cb).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>${Math.round(p.mv).toLocaleString()}</td>
                    <td style={{ color: p.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {p.pnl >= 0 ? '+$' : '-$'}{Math.abs(Math.round(p.pnl)).toLocaleString()}
                    </td>
                    <td style={{ color: p.pct >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {p.pct >= 0 ? '+' : ''}{Number(p.pct).toFixed(1)}%
                    </td>
                    <td>{allocPct}%</td>
                    <td style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>{p.account}</td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.6rem' }}>{p.notes}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button type="button" className="port-add-btn" style={{ padding: '2px 8px', marginRight: 4 }} onClick={() => startEdit(p)}>Edit</button>
                      <button type="button" className="port-rm" onClick={() => handleDelete(p.id)}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
        <div style={{ fontFamily: 'Syne', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>
          Allocation Treemap
        </div>
        <div style={{ position: 'relative' }}>
          <canvas ref={canvasRef} style={{ display: 'block', width: '100%', borderRadius: 6 }} />
          {withCalc.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
              Add positions to see treemap
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
