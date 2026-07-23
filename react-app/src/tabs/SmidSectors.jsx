import React, { useMemo, useState, useEffect } from 'react';
import sectorsData from '../data/sectors.json';

const COLOR = {
  green: 'var(--green)',
  yellow: 'var(--yellow)',
  blue: 'var(--blue)',
  teal: 'var(--teal)',
  dim: 'var(--text-dim)',
};

function stars(n) {
  return '★'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n));
}

function QuoteCell({ quotes, ticker, kind }) {
  const q = quotes?.[ticker];
  if (!q || q.ok === false) return '—';
  if (kind === 'price') return `$${Number(q.price).toFixed(2)}`;
  const pos = q.change >= 0;
  const pct = Number(q.pct ?? q.changePercent ?? 0);
  return `${pos ? '+' : ''}${pct.toFixed(2)}%`;
}

/**
 * SMID Sectors — content from data/sectors.json.
 * Edit the JSON to update theses / watchlists without touching this file.
 */
export default function SmidSectors({ isActive, quotes, filter = 'all' }) {
  const sectors = useMemo(
    () => sectorsData.sectors.filter((s) => filter === 'all' || s.filter === filter),
    [filter],
  );
  const scores = useMemo(
    () => sectorsData.scores.filter((s) => filter === 'all' || s.filter === filter),
    [filter],
  );
  const [activeId, setActiveId] = useState(sectors[0]?.id ?? 'uranium');

  useEffect(() => {
    if (!sectors.find((s) => s.id === activeId)) {
      setActiveId(sectors[0]?.id ?? 'uranium');
    }
  }, [sectors, activeId]);

  const active = sectors.find((s) => s.id === activeId) ?? sectors[0];

  return (
    <div className={`tab-panel${isActive ? ' active' : ''}`} id="tab-sectors">
      <div className="smid-wrap">
        <div style={{ marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 3 }}>
            {sectorsData.title}
            <span style={{ color: 'var(--teal)' }}> — {sectorsData.subtitle}</span>
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {scores.length} Sectors · Thesis frozen {sectorsData.as_of} · Edit <code>data/sectors.json</code>
          </div>
        </div>

        <div className="smid-section">📊 Sector Scoring Overview</div>
        <div style={{ overflowX: 'auto', marginBottom: 28 }}>
          <table className="smid-metrics-table" id="sector-score-tbl">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Sector</th>
                <th>Hype Position</th>
                <th>Macro Fit</th>
                <th>SMID Edge</th>
                <th>Overall</th>
                <th>Key Names</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{row.name}</td>
                  <td><span style={{ color: COLOR[row.hypeColor] || COLOR.dim }}>{row.hype}</span></td>
                  <td><span style={{ color: row.macro >= 3 ? COLOR.green : row.macro === 2 ? COLOR.yellow : COLOR.dim }}>{stars(row.macro)}</span></td>
                  <td><span style={{ color: row.smid >= 3 ? COLOR.green : row.smid === 2 ? COLOR.yellow : COLOR.dim }}>{stars(row.smid)}</span></td>
                  <td><span style={{ color: COLOR[row.overallColor] || COLOR.dim, fontWeight: 700 }}>{row.overall}</span></td>
                  <td style={{ color: 'var(--text-dim)' }}>{row.keyNames}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="smid-tabs" id="sector-tabs">
          {sectors.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`smid-tab${activeId === s.id ? ' active' : ''}`}
              onClick={() => setActiveId(s.id)}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>

        {active && (
          <div className="smid-panel active" id={`sec-${active.id}`}>
            <div className="smid-box">
              <strong>Thesis:</strong> {active.thesis}
            </div>
            <div className="smid-box blue">
              <strong>Key catalysts:</strong> {active.catalysts}
            </div>
            <div className="smid-box green">
              <strong>Risk:</strong> {active.risk}
            </div>
            <div className="smid-section">{active.emoji} {active.watchlistTitle}</div>
            <table className="smid-metrics-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Name</th>
                  <th>Ticker</th>
                  <th>Price</th>
                  <th>Chg%</th>
                  <th>Type</th>
                  <th>Market Cap</th>
                  <th>Key Catalyst</th>
                </tr>
              </thead>
              <tbody>
                {active.watchlist.map((w) => (
                  <tr key={w.ticker}>
                    <td style={{ color: '#fff', fontWeight: 600 }}>{w.name}</td>
                    <td>{w.ticker}</td>
                    <td><QuoteCell quotes={quotes} ticker={w.ticker} kind="price" /></td>
                    <td><QuoteCell quotes={quotes} ticker={w.ticker} kind="chg" /></td>
                    <td><span className={`tag tag-${w.tag}`}>{w.type}</span></td>
                    <td>{w.mcap}</td>
                    <td>{w.catalyst}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
