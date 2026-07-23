import React, { useState, useEffect, useRef } from 'react';
import regimesFile from '../data/regimes.json';
const REGIMES = regimesFile.regimes;

const FED_OPTIONS = [
  { value: 'dovish',  label: '🕊 Dovish — Fed cutting / on hold' },
  { value: 'neutral', label: '⚖️ Neutral — Pause / data dependent' },
  { value: 'hawkish', label: '🦅 Hawkish — Fed hiking / restrictive' },
];
const GEO_OPTIONS = [
  { value: 'deesc',   label: '🕊 De-escalation' },
  { value: 'base',    label: '⚖️ Status quo / frozen' },
  { value: 'esc',     label: '⚠️ Escalation' },
  { value: 'longwar', label: '🔥 Prolonged conflict' },
];
const GROWTH_OPTIONS = [
  { value: 'strong',    label: '🚀 Strong  (>2.5%)' },
  { value: 'base',      label: '📈 Moderate (1-2.5%)' },
  { value: 'slowing',   label: '📉 Slowing (<1%)' },
  { value: 'recession', label: '🔴 Recession' },
];

function getRegime(fed, geo, growth) {
  const key = `${fed}_${geo}_${growth}`;
  return REGIMES[key] || REGIMES[`dovish_${geo}_${growth}`] || null;
}

export default function MacroEngine({ isActive }) {
  const [fed,    setFed]    = useState('dovish');
  const [geo,    setGeo]    = useState('base');
  const [growth, setGrowth] = useState('base');
  const regime = getRegime(fed, geo, growth);

  return (
    <div className={`tab-panel${isActive ? ' active' : ''}`} id="tab-macro">
      <div className="regime-controls">
        <div className="regime-row">
          <label className="regime-label">Fed Policy</label>
          <div className="regime-btns">
            {FED_OPTIONS.map(o => (
              <button
                key={o.value}
                className={`regime-btn${fed === o.value ? ' active' : ''}`}
                onClick={() => setFed(o.value)}
              >{o.label}</button>
            ))}
          </div>
        </div>
        <div className="regime-row">
          <label className="regime-label">Geopolitics</label>
          <div className="regime-btns">
            {GEO_OPTIONS.map(o => (
              <button
                key={o.value}
                className={`regime-btn${geo === o.value ? ' active' : ''}`}
                onClick={() => setGeo(o.value)}
              >{o.label}</button>
            ))}
          </div>
        </div>
        <div className="regime-row">
          <label className="regime-label">Growth</label>
          <div className="regime-btns">
            {GROWTH_OPTIONS.map(o => (
              <button
                key={o.value}
                className={`regime-btn${growth === o.value ? ' active' : ''}`}
                onClick={() => setGrowth(o.value)}
              >{o.label}</button>
            ))}
          </div>
        </div>
      </div>

      {regime ? (
        <div className="regime-output" style={{ background: regime.color || 'transparent' }}>
          <div className="regime-title">{regime.title}</div>
          {regime.over?.length > 0 && (
            <div className="regime-section">
              <span className="regime-sec-lbl" style={{ color: 'var(--green)' }}>OVERWEIGHT</span>
              {regime.over.map((x, i) => <span key={i} className="regime-tag tag-over">{x}</span>)}
            </div>
          )}
          {regime.under?.length > 0 && (
            <div className="regime-section">
              <span className="regime-sec-lbl" style={{ color: 'var(--red)' }}>UNDERWEIGHT</span>
              {regime.under.map((x, i) => <span key={i} className="regime-tag tag-under">{x}</span>)}
            </div>
          )}
          {regime.hedge?.length > 0 && (
            <div className="regime-section">
              <span className="regime-sec-lbl" style={{ color: 'var(--yellow)' }}>HEDGE</span>
              {regime.hedge.map((x, i) => <span key={i} className="regime-tag tag-hedge">{x}</span>)}
            </div>
          )}
          {regime.note && (
            <div className="regime-note">{regime.note}</div>
          )}
        </div>
      ) : (
        <div className="regime-output">
          <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
            No regime data for this combination.
          </div>
        </div>
      )}
    </div>
  );
}
