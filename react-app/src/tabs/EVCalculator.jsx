import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDashboard } from '../context/DashboardContext.jsx';

function drawPayoff(canvas, cur, bP, bPr, mP, mPr, rP, rPr) {
  if (!canvas) return;
  const W = canvas.width || canvas.offsetWidth || 400;
  const H = 140;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, W, H);
  if (!cur) return;

  const items = [
    { label: `▲ Bull  $${bP?.toFixed(2)||'?'}`,  ret: cur > 0 ? (bP - cur) / cur * 100 : 0, prob: bPr / 100, color: '#4ade80' },
    { label: `→ Base  $${mP?.toFixed(2)||'?'}`,  ret: cur > 0 ? (mP - cur) / cur * 100 : 0, prob: mPr / 100, color: '#fbbf24' },
    { label: `▼ Bear  $${rP?.toFixed(2)||'?'}`,  ret: cur > 0 ? (rP - cur) / cur * 100 : 0, prob: rPr / 100, color: '#f87171' },
  ];
  const maxAbs = Math.max(...items.map(i => Math.abs(i.ret)), 1);
  const barH = 28, pad = 10, labelW = 120;
  items.forEach((item, i) => {
    const y = pad + i * (barH + 8);
    const barW = Math.min(Math.abs(item.ret) / maxAbs * (W - labelW - pad * 2), W - labelW - pad * 2);
    ctx.fillStyle = item.color + '28';
    ctx.fillRect(labelW, y, barW, barH - 4);
    ctx.fillStyle = item.color;
    ctx.fillRect(labelW, y, barW, 3);
    ctx.font = '600 9px DM Sans'; ctx.fillStyle = '#b0b0c0'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(item.label, pad, y + barH / 2 - 4);
    ctx.font = '700 10px DM Sans'; ctx.fillStyle = item.color; ctx.textAlign = 'left';
    ctx.fillText(`${item.ret >= 0 ? '+' : ''}${item.ret.toFixed(1)}%  (p=${(item.prob * 100).toFixed(0)}%)`, labelW + barW + 8, y + barH / 2 - 4);
  });
}

export default function EVCalculator({ isActive }) {
  const { state, dispatch } = useDashboard();
  const saved = state.evSaved;

  const [ticker,   setTicker]   = useState('');
  const [current,  setCurrent]  = useState('');
  const [horizon,  setHorizon]  = useState('12');
  const [bullP,    setBullP]    = useState('');
  const [bullPr,   setBullPr]   = useState('35');
  const [baseP,    setBaseP]    = useState('');
  const [basePr,   setBasePr]   = useState('45');
  const [bearP,    setBearP]    = useState('');
  const [bearPr,   setBearPr]   = useState('20');
  const [portSize, setPortSize] = useState('100000');
  const [stop,     setStop]     = useState('');

  const [result, setResult] = useState(null);
  const canvasRef = useRef(null);

  // ── Readiness gate (MY PENS health bridge) ────────────────────────────────
  const [readiness, setReadiness]     = useState(null);
  const [overrideAck, setOverrideAck] = useState(false);

  const totalProb = (+bullPr || 0) + (+basePr || 0) + (+bearPr || 0);
  const probWarn  = totalProb > 0 && Math.abs(totalProb - 100) > 0.5;

  const calc = useCallback(() => {
    const cur = parseFloat(current), bp = parseFloat(bullP), mp = parseFloat(baseP), rp = parseFloat(bearP);
    const bPr = parseFloat(bullPr) / 100, mPr = parseFloat(basePr) / 100, rPr = parseFloat(bearPr) / 100;
    const ps  = parseFloat(portSize), sl = parseFloat(stop);
    if (!cur || !bp || !mp || !rp) return;

    const bRet = (bp - cur) / cur;
    const mRet = (mp - cur) / cur;
    const rRet = (rp - cur) / cur;
    const ev   = bPr * bRet + mPr * mRet + rPr * rRet;

    const lossRet = rRet; // bear = loss scenario
    const winRet  = bPr * bRet + mPr * mRet;
    const kelly = lossRet < 0
      ? Math.max(0, (bPr * bRet + mPr * mRet + rPr * rRet) / (-lossRet))
      : 0;
    const halfKelly = Math.min(kelly * 0.5, 0.25);
    const sizeD = ps > 0 ? ps * halfKelly : null;

    // Risk/reward = EV upside / max downside
    const rr = rPr > 0 ? Math.abs((bPr * bRet + mPr * mRet) / (rPr * Math.abs(rRet))) : null;

    const r = {
      ev: ev * 100, evDollar: ev * cur,
      kelly: kelly * 100, halfKelly: halfKelly * 100,
      sizeD, rr, cur, bp, mp, rp, bPr: bPr * 100, mPr: mPr * 100, rPr: rPr * 100,
    };
    setResult(r);
    if (canvasRef.current) drawPayoff(canvasRef.current, cur, bp, bPr * 100, mp, mPr * 100, rp, rPr * 100);
  }, [current, bullP, baseP, bearP, bullPr, basePr, bearPr, portSize, stop]);

  useEffect(() => { if (isActive) calc(); }, [isActive, calc]);

  useEffect(() => {
    if (!isActive) return;
    setOverrideAck(false);
    const ctrl = new AbortController();
    fetch('http://localhost:5000/api/readiness', { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => setReadiness(d.available ? d : null))
      .catch(() => setReadiness(null)); // MY PENS offline — silent fail
    return () => ctrl.abort();
  }, [isActive]);

  function handleSave() {
    if (!result) return;
    dispatch({
      type: 'EV_SAVE',
      payload: {
        ticker: ticker || '?', date: new Date().toISOString().slice(0, 10),
        ...result,
      }
    });
  }

  const evColor = result ? (result.ev >= 10 ? 'var(--green)' : result.ev >= 0 ? 'var(--yellow)' : 'var(--red)') : 'var(--teal)';
  const interp = result
    ? result.ev >= 15
      ? `✅ Strong positive EV (+${result.ev.toFixed(1)}%). Kelly suggests ${result.halfKelly.toFixed(1)}% position. Proceed if thesis is solid.`
      : result.ev >= 5
      ? `🟡 Modest positive EV (+${result.ev.toFixed(1)}%). Acceptable but not outstanding. Size conservatively.`
      : result.ev >= 0
      ? `⚠️ Near-zero EV. Consider whether the risk/reward justifies capital allocation.`
      : `🔴 Negative EV (${result.ev.toFixed(1)}%). Do not enter. Re-examine assumptions.`
    : 'Fill in scenarios above to see results.';

  return (
    <div className={`tab-panel${isActive ? ' active' : ''}`} id="tab-ev">
      <div className="tool-wrap">

        {/* ── Readiness Gate ── */}
        {readiness && !overrideAck && !readiness.gate.clear && (() => {
          const reduced  = readiness.gate.reduced;
          const color    = reduced ? 'var(--red)' : 'var(--yellow)';
          const bg       = reduced ? 'rgba(248,113,113,0.07)' : 'rgba(251,191,36,0.07)';
          const border   = reduced ? 'rgba(248,113,113,0.3)'  : 'rgba(251,191,36,0.3)';
          const advice   = reduced
            ? 'Consider no new positions today. Impaired sleep measurably degrades decision quality.'
            : 'Consider reducing position sizes. Below-threshold readiness warrants caution.';
          const kellyCut = readiness.kellyMultiplier < 1
            ? ` Kelly suggestions shown at full size — manually apply ×${readiness.kellyMultiplier} if sizing today.`
            : '';
          return (
            <div style={{
              background: bg, border: `1px solid ${border}`, borderRadius: 10,
              padding: '12px 16px', marginBottom: 16,
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {reduced ? '⛔ Readiness Gate' : '⚠️ Readiness Gate'}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color, fontFamily: 'Syne, sans-serif' }}>
                    {readiness.overallReadiness}/100
                  </span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>
                    — {readiness.label}
                  </span>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: 3 }}>
                  Sleep {readiness.sleepHours?.toFixed(1)}h · Quality {readiness.sleepQuality}/5
                  {readiness.hrv ? ` · HRV ${readiness.hrv}ms` : ''}
                  {readiness.hrvReadiness ? ` (readiness ${readiness.hrvReadiness}/100 vs baseline)` : ''}
                </div>
                <div style={{ fontSize: '0.63rem', color }}>
                  {advice}{kellyCut}
                </div>
              </div>
              <button
                onClick={() => setOverrideAck(true)}
                style={{
                  background: 'transparent', border: `1px solid ${border}`, borderRadius: 6,
                  color, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', padding: '5px 10px', cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                Override ›
              </button>
            </div>
          );
        })()}

        <div className="tool-hd">
          <div className="tool-hd-title">Expected Value Calculator <span style={{ color: 'var(--teal)' }}>— Position Sizing Engine</span></div>
          <div className="tool-hd-sub">Bull · Base · Bear scenarios → EV · Risk/Reward · Kelly fraction</div>
        </div>

        <div className="ev-grid">
          {/* LEFT: inputs */}
          <div className="ev-input-panel">
            <div className="ev-input-title">📐 Position Setup</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'Ticker', val: ticker, set: v => setTicker(v.toUpperCase()), ph: 'POWL', w: 1 },
                { label: 'Current Price ($)', val: current, set: setCurrent, ph: '145.00', type: 'number', w: 1 },
                { label: 'Horizon (months)', val: horizon, set: setHorizon, ph: '12', type: 'number', w: 1 },
              ].map(f => (
                <div key={f.label} style={{ flex: f.w }}>
                  <div className="dj-label" style={{ marginBottom: 5 }}>{f.label}</div>
                  <input className="ev-input" type={f.type || 'text'} placeholder={f.ph} value={f.val}
                    onChange={e => f.set(e.target.value)} onBlur={calc} style={{ textTransform: f.label === 'Ticker' ? 'uppercase' : 'none' }} />
                </div>
              ))}
            </div>

            {[
              { key: 'bull', label: '▲ BULL SCENARIO', color: 'var(--green)',  pv: bullP,  setPv: setBullP,  pr: bullPr,  setPr: setBullPr  },
              { key: 'base', label: '→ BASE SCENARIO', color: 'var(--yellow)', pv: baseP,  setPv: setBaseP,  pr: basePr,  setPr: setBasePr  },
              { key: 'bear', label: '▼ BEAR SCENARIO', color: 'var(--red)',    pv: bearP,  setPv: setBearP,  pr: bearPr,  setPr: setBearPr  },
            ].map(s => (
              <div key={s.key} style={{ marginBottom: 10 }}>
                <div className="dj-label" style={{ color: s.color, marginBottom: 6 }}>{s.label}</div>
                <div className="ev-row">
                  <span className="ev-scenario-label" style={{ color: s.color }}>Target $</span>
                  <input className="ev-input" type="number" placeholder="—" value={s.pv}
                    onChange={e => s.setPv(e.target.value)} onBlur={calc} />
                  <span className="ev-input-label">Price target</span>
                </div>
                <div className="ev-row">
                  <span className="ev-scenario-label" style={{ color: s.color }}>Prob %</span>
                  <input className="ev-input" type="number" placeholder="—" value={s.pr}
                    onChange={e => s.setPr(e.target.value)} onBlur={calc} />
                  <span className="ev-input-label">Probability</span>
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div className="dj-label" style={{ marginBottom: 5 }}>Portfolio Size ($)</div>
                <input className="ev-input" type="number" value={portSize} onChange={e => setPortSize(e.target.value)} onBlur={calc} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="dj-label" style={{ marginBottom: 5 }}>Stop Loss ($)</div>
                <input className="ev-input" type="number" value={stop} onChange={e => setStop(e.target.value)} onBlur={calc} />
              </div>
            </div>

            {probWarn && <div style={{ fontSize: '0.62rem', color: 'var(--orange)', marginBottom: 8 }}>⚠️ Probabilities sum to {totalProb}%, not 100%</div>}
            <button className="ev-save-btn" onClick={handleSave}>+ Save to Position List</button>
          </div>

          {/* RIGHT: results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="ev-result-panel">
              <div>
                <div className="ev-big-label">Expected Return</div>
                <div className="ev-big-num" style={{ color: evColor }}>
                  {result ? `${result.ev >= 0 ? '+' : ''}${result.ev.toFixed(1)}%` : '—'}
                </div>
              </div>
              <div className="ev-metrics">
                {[
                  { id: 'evD',  val: result ? `$${result.evDollar.toFixed(2)}` : '—', lbl: 'EV per share ($)' },
                  { id: 'rr',   val: result?.rr ? `${result.rr.toFixed(2)}x` : '—',  lbl: 'Risk / Reward'    },
                  { id: 'kel',  val: result ? `${result.kelly.toFixed(1)}%` : '—',    lbl: 'Kelly fraction'   },
                  { id: 'siz',  val: result?.sizeD ? `$${Math.round(result.sizeD).toLocaleString()}` : '—', lbl: 'Suggested size ($)' },
                ].map(m => (
                  <div key={m.id} className="ev-metric-card">
                    <div className="ev-metric-val">{m.val}</div>
                    <div className="ev-metric-lbl">{m.lbl}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.57rem', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Kelly Position (capped 25%)</span>
                  <span className="ev-metric-val" style={{ fontSize: '0.75rem' }}>{result ? `${result.halfKelly.toFixed(1)}%` : '—'}</span>
                </div>
                <div className="ev-kelly-bar">
                  <div className="ev-kelly-fill" style={{ width: `${result ? result.halfKelly : 0}%` }} />
                </div>
              </div>
              <div style={{ fontSize: '0.67rem', color: 'var(--text)', lineHeight: 1.6, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                {interp}
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontFamily: 'Syne', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 10 }}>Payoff Distribution</div>
              <canvas ref={canvasRef} className="ev-payoff-canvas" height={140} style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        {/* Saved positions */}
        <div style={{ fontFamily: 'Syne', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 10, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
          💼 Saved Positions — EV Ranking
        </div>
        <div className="ev-position-list">
          {saved.length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontSize: '0.68rem', fontStyle: 'italic' }}>No positions saved yet. Fill in above and click Save.</div>
          ) : [...saved]
            .sort((a, b) => b.ev - a.ev)
            .map((s, i) => (
              <div key={i} className="ev-pos-card" style={{ borderLeft: `3px solid ${s.ev >= 10 ? 'var(--green)' : s.ev >= 0 ? 'var(--yellow)' : 'var(--red)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontFamily: 'Syne', fontSize: '0.85rem' }}>{s.ticker}</strong>
                  <span style={{ color: s.ev >= 10 ? 'var(--green)' : s.ev >= 0 ? 'var(--yellow)' : 'var(--red)', fontSize: '0.8rem', fontWeight: 700 }}>
                    {s.ev >= 0 ? '+' : ''}{s.ev.toFixed(1)}% EV
                  </span>
                  <button className="port-rm" onClick={() => dispatch({ type: 'EV_REMOVE', idx: state.evSaved.indexOf(s) })}>✕</button>
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', marginTop: 4 }}>
                  RR: {s.rr ? s.rr.toFixed(2) + 'x' : '—'} · Kelly: {s.halfKelly?.toFixed(1)}% · Size: {s.sizeD ? '$' + Math.round(s.sizeD).toLocaleString() : '—'} · {s.date}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
