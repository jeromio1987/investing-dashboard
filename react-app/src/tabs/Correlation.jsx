import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDashboard } from '../context/DashboardContext.jsx';
import { CORR_SECTOR_MAP, CORR_FACTOR_BASE, TICKER_SECTOR } from '../data/corrData.js';

function getCorrEstimate(t1, t2) {
  if (t1 === t2) return 1.0;
  // Look up ticker -> sector -> factor group
  const sec1 = TICKER_SECTOR[t1] || t1;
  const sec2 = TICKER_SECTOR[t2] || t2;
  const g1 = CORR_SECTOR_MAP[sec1]?.factor;
  const g2 = CORR_SECTOR_MAP[sec2]?.factor;
  if (!g1 || !g2) return 0.10;
  if (g1 === g2) return 0.75;
  const key1 = g1 + '_' + g2;
  const key2 = g2 + '_' + g1;
  return CORR_FACTOR_BASE[key1] ?? CORR_FACTOR_BASE[key2] ?? 0.10;
}

function drawHeatmap(canvas, tickers) {
  if (!canvas || !tickers.length) return;
  const n = tickers.length;
  const CELL = Math.min(Math.floor((canvas.parentElement?.offsetWidth || 400) / (n + 1.5)), 60);
  const LBL  = 70;
  const W    = LBL + n * CELL;
  const H    = LBL + n * CELL;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, W, H);

  const corr = tickers.map(t1 => tickers.map(t2 => getCorrEstimate(t1, t2)));

  function corrColor(v) {
    if (v >= 0.7)  return `rgba(248,113,113,${0.4 + v * 0.6})`;
    if (v >= 0.3)  return `rgba(251,191,36,${0.3 + v * 0.4})`;
    if (v >= -0.3) return `rgba(30,30,60,0.8)`;
    return `rgba(96,165,250,${0.3 + Math.abs(v) * 0.5})`;
  }

  // Cells
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = LBL + j * CELL, y = LBL + i * CELL;
      ctx.fillStyle = corrColor(corr[i][j]);
      ctx.fillRect(x, y, CELL - 1, CELL - 1);
      ctx.fillStyle = corr[i][j] > 0.4 ? '#fff' : '#808090';
      ctx.font = `${Math.min(10, CELL * 0.28)}px DM Sans`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(corr[i][j].toFixed(2), x + CELL / 2, y + CELL / 2);
    }
  }

  // Labels
  ctx.fillStyle = '#c0c0d0'; ctx.font = `600 ${Math.min(11, CELL * 0.28)}px DM Sans`;
  tickers.forEach((t, i) => {
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(t, LBL - 6, LBL + i * CELL + CELL / 2);
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.save(); ctx.translate(LBL + i * CELL + CELL / 2, LBL - 6);
    ctx.rotate(-Math.PI / 4); ctx.fillText(t, 0, 0); ctx.restore();
  });
}

export default function Correlation({ isActive }) {
  const { state, dispatch } = useDashboard();
  const tickers  = state.corrTickers;
  const [newTicker, setNewTicker] = useState('');
  const canvasRef = useRef(null);

  const redraw = useCallback(() => {
    if (canvasRef.current && tickers.length > 0) {
      drawHeatmap(canvasRef.current, tickers);
    }
  }, [tickers]);

  useEffect(() => {
    if (isActive) setTimeout(redraw, 50);
  }, [isActive, redraw]);

  function handleAdd() {
    const t = newTicker.trim().toUpperCase();
    if (!t) return;
    dispatch({ type: 'CORR_ADD', ticker: t });
    setNewTicker('');
  }

  // Find high-risk pairs
  const highPairs = [];
  for (let i = 0; i < tickers.length; i++) {
    for (let j = i + 1; j < tickers.length; j++) {
      const c = getCorrEstimate(tickers[i], tickers[j]);
      if (c >= 0.7) highPairs.push({ t1: tickers[i], t2: tickers[j], c });
    }
  }

  // Factor exposure
  const factorCounts = {};
  tickers.forEach(t => {
    const g = CORR_SECTOR_MAP[t]?.group || 'Unknown';
    factorCounts[g] = (factorCounts[g] || 0) + 1;
  });

  return (
    <div className={`tab-panel${isActive ? ' active' : ''}`} id="tab-corr">
      <div className="tool-wrap">
        <div className="tool-hd">
          <div className="tool-hd-title">Correlation Heatmap <span style={{ color: 'var(--teal)' }}>— Sector-Based Model</span></div>
          <div className="tool-hd-sub">Estimated correlations from sector factor exposure. Not historical prices.</div>
        </div>

        {/* Add ticker */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="dj-input" placeholder="Add ticker…" value={newTicker}
            onChange={e => setNewTicker(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={{ width: 120, textTransform: 'uppercase' }} />
          <button className="ev-save-btn" style={{ padding: '6px 14px' }} onClick={handleAdd}>+ Add</button>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {tickers.map(t => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '0.65rem', color: CORR_SECTOR_MAP[t]?.color || 'var(--text)' }}>
                {t}
                <button onClick={() => dispatch({ type: 'CORR_REMOVE', ticker: t })}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.7rem', lineHeight: 1, padding: 0 }}>✕</button>
              </span>
            ))}
          </div>
        </div>

        {/* Heatmap canvas */}
        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <canvas ref={canvasRef} style={{ display: 'block' }} />
        </div>

        {/* Insights */}
        {highPairs.length > 0 && (
          <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ fontFamily: 'Syne', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: 8 }}>
              ⚠️ High Concentration Risk ({highPairs.length} pairs ≥ 0.70)
            </div>
            {highPairs.map((p, i) => (
              <div key={i} style={{ fontSize: '0.68rem', color: 'var(--text)', marginBottom: 4 }}>
                <strong>{p.t1}</strong> ↔ <strong>{p.t2}</strong>: estimated correlation <span style={{ color: 'var(--red)' }}>{p.c.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Factor breakdown */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
          <div style={{ fontFamily: 'Syne', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>
            Factor Exposure Breakdown
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(factorCounts).map(([factor, count]) => (
              <div key={factor} style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '0.65rem' }}>
                <span style={{ color: 'var(--text)' }}>{factor}</span>
                <span style={{ color: 'var(--yellow)', fontWeight: 700, marginLeft: 6 }}>
                  {(count / tickers.length * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginTop: 8 }}>
            Correlations are estimated from sector membership, not historical price data. Add your ticker to CORR_SECTOR_MAP in corrData.js to improve accuracy.
          </div>
        </div>
      </div>
    </div>
  );
}
