import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext.jsx';

const ACTIONS    = ['BUY','ADD','REDUCE','SELL','PASS'];
const EMOTIONS   = ['Neutral','Confident','Anxious','FOMO','Contrarian'];
const CAT_TYPES  = ['Earnings','Macro Shift','Technicals','Thesis Change','Catalyst','Other'];
const CONVICTIONS= [1,2,3,4,5];

const STATUS_COLORS = { open: '#60a5fa', win: '#4ade80', loss: '#f87171', scratch: '#94a3b8', partial: '#fbbf24', 'n/a': '#64748b' };
const OUTCOMES = ['win', 'loss', 'scratch'];
const ACTION_COLORS = { BUY:'#4ade80', ADD:'#34d399', REDUCE:'#fbbf24', SELL:'#f87171', PASS:'#64748b' };

function ConvBar({ val }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {CONVICTIONS.map(v => (
        <div key={v} style={{ width: 8, height: 8, borderRadius: 2, background: v <= val ? 'var(--yellow)' : 'var(--border)' }} />
      ))}
      <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginLeft: 4 }}>{val}/5</span>
    </div>
  );
}

export default function DecisionJournal({ isActive }) {
  const { state, dispatch } = useDashboard();
  const entries = state.journalEntries;

  const [ticker,    setTicker]   = useState('');
  const [action,    setAction]   = useState('BUY');
  const [price,     setPrice]    = useState('');
  const [catType,   setCatType]  = useState('Earnings');
  const [conv,      setConv]     = useState(3);
  const [catDate,   setCatDate]  = useState('');
  const [thesis,    setThesis]   = useState('');
  const [invalid,   setInvalid]  = useState('');
  const [emotion,   setEmotion]  = useState('Neutral');
  const [filter,    setFilter]   = useState('all');

  function handleSave() {
    if (!ticker || !thesis) { alert('Ticker and thesis are required.'); return; }
    dispatch({
      type: 'JOURNAL_ADD',
      payload: {
        id: Date.now(),
        date: new Date().toISOString().slice(0, 10),
        ticker: ticker.toUpperCase(),
        action, price: parseFloat(price) || null,
        catType, conv,
        catDate: catDate || null,
        thesis, invalid, emotion,
        status: 'open',
        outcome: 'open', exitPrice: null, exitReason: null, exitDate: null, returnPct: null, thesisCorrect: null,
      }
    });
    setTicker(''); setPrice(''); setThesis(''); setInvalid(''); setCatDate('');
  }

  function handleResolve(entry) {
    const outcomeRaw = window.prompt(`Outcome for ${entry.ticker}? (win/loss/scratch)`, 'win');
    if (!outcomeRaw) return;
    const outcome = outcomeRaw.trim().toLowerCase();
    if (!OUTCOMES.includes(outcome)) { alert('Outcome must be win, loss, or scratch.'); return; }
    const exitReason  = window.prompt('Exit reason? (e.g. thesis played out, stopped out, thesis invalidated)', '') || null;
    const exitDate    = window.prompt('Exit date (YYYY-MM-DD)?', new Date().toISOString().slice(0, 10)) || new Date().toISOString().slice(0, 10);
    const returnRaw   = window.prompt('Return % (e.g. 12.5 or -8)?', '');
    const returnPct   = returnRaw !== null && returnRaw !== '' ? parseFloat(returnRaw) : null;
    const exitPrice   = parseFloat(window.prompt('Exit price ($)? (optional)') || '0') || null;
    const tc          = window.confirm('Was your original thesis correct?');
    dispatch({
      type: 'JOURNAL_RESOLVE',
      id: entry.id,
      update: { status: outcome, outcome, exitReason, exitDate, returnPct, exitPrice, thesisCorrect: tc }
    });
  }

  const resolved  = entries.filter(e => e.status !== 'open');
  const wins      = entries.filter(e => e.status === 'win').length;
  const losses    = entries.filter(e => e.status === 'loss').length;
  const scratches = entries.filter(e => e.status === 'scratch').length;
  // Win rate excludes scratches/open (standard convention: wins / decided trades)
  const winRate  = (wins + losses) > 0 ? (wins / (wins + losses) * 100).toFixed(0) : '—';
  const thesisAcc = resolved.filter(e => e.thesisCorrect !== null && e.thesisCorrect !== undefined);
  const thesisRight = thesisAcc.filter(e => e.thesisCorrect).length;
  const thesisRate = thesisAcc.length > 0 ? (thesisRight / thesisAcc.length * 100).toFixed(0) : '—';

  const holdDurationsDays = resolved
    .filter(e => e.exitDate && e.date)
    .map(e => (new Date(e.exitDate) - new Date(e.date)) / 86400000)
    .filter(d => Number.isFinite(d) && d >= 0);
  const avgHoldDays = holdDurationsDays.length > 0
    ? (holdDurationsDays.reduce((a, b) => a + b, 0) / holdDurationsDays.length).toFixed(1)
    : '—';

  const byThesisType = {};
  resolved.forEach(e => {
    const t = e.catType || 'Other';
    byThesisType[t] = byThesisType[t] || { win: 0, loss: 0, scratch: 0 };
    if (e.status === 'win') byThesisType[t].win += 1;
    else if (e.status === 'loss') byThesisType[t].loss += 1;
    else if (e.status === 'scratch') byThesisType[t].scratch += 1;
  });
  const byThesisTypeRows = Object.entries(byThesisType).map(([type, s]) => {
    const decided = s.win + s.loss;
    return { type, ...s, rate: decided > 0 ? (s.win / decided * 100).toFixed(0) : '—' };
  });

  const filtered = entries.filter(e =>
    filter === 'all' || e.status === filter || e.catType === filter
  );

  return (
    <div className={`tab-panel${isActive ? ' active' : ''}`} id="tab-journal">
      <div className="tool-wrap">
        <div className="tool-hd">
          <div className="tool-hd-title">Decision Journal <span style={{ color: 'var(--purple)' }}>— Thesis Tracker</span></div>
          <div className="tool-hd-sub">Log every entry · Resolve outcomes · Track your edge</div>
        </div>

        {/* Stats bar */}
        <div className="dj-stats-bar">
          {[
            { label: 'Total',      val: entries.length,    col: 'var(--text)'   },
            { label: 'Open',       val: entries.filter(e=>e.status==='open').length, col: 'var(--blue)' },
            { label: 'Wins',       val: wins,              col: 'var(--green)'  },
            { label: 'Losses',     val: losses,            col: 'var(--red)'    },
            { label: 'Win Rate',   val: `${winRate}%`,     col: 'var(--yellow)' },
            { label: 'Thesis Acc', val: `${thesisRate}%`,  col: 'var(--purple)' },
          ].map(s => (
            <div key={s.label} className="dj-stat">
              <div className="dj-stat-val" style={{ color: s.col }}>{s.val}</div>
              <div className="dj-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Outcomes summary */}
        {resolved.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontFamily: 'Syne', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 10 }}>
              📊 Outcomes Summary
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: byThesisTypeRows.length ? 12 : 0 }}>
              <div>
                <div className="dj-stat-val" style={{ color: 'var(--green)' }}>{winRate}%</div>
                <div className="dj-stat-lbl">Win rate (overall)</div>
              </div>
              <div>
                <div className="dj-stat-val" style={{ color: 'var(--blue)' }}>{avgHoldDays}{avgHoldDays !== '—' ? 'd' : ''}</div>
                <div className="dj-stat-lbl">Avg hold</div>
              </div>
              <div>
                <div className="dj-stat-val" style={{ color: '#94a3b8' }}>{scratches}</div>
                <div className="dj-stat-lbl">Scratches</div>
              </div>
            </div>
            {byThesisTypeRows.length > 0 && (
              <table style={{ width: '100%', fontSize: '0.65rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: 'var(--text-dim)', textAlign: 'left' }}>
                    <th style={{ padding: '4px 6px' }}>Thesis Type</th>
                    <th style={{ padding: '4px 6px' }}>W</th>
                    <th style={{ padding: '4px 6px' }}>L</th>
                    <th style={{ padding: '4px 6px' }}>Scratch</th>
                    <th style={{ padding: '4px 6px' }}>Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {byThesisTypeRows.map(r => (
                    <tr key={r.type} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '4px 6px' }}>{r.type}</td>
                      <td style={{ padding: '4px 6px', color: 'var(--green)' }}>{r.win}</td>
                      <td style={{ padding: '4px 6px', color: 'var(--red)' }}>{r.loss}</td>
                      <td style={{ padding: '4px 6px', color: 'var(--text-dim)' }}>{r.scratch}</td>
                      <td style={{ padding: '4px 6px', fontWeight: 700 }}>{r.rate}{r.rate !== '—' ? '%' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Entry form */}
        <div className="dj-form">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <div>
              <div className="dj-label">Ticker</div>
              <input className="dj-input" placeholder="BEAM" value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())} style={{ width: 80, textTransform: 'uppercase' }} />
            </div>
            <div>
              <div className="dj-label">Action</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {ACTIONS.map(a => (
                  <button key={a} className={`dj-action-btn${action === a ? ' active' : ''}`}
                    style={{ borderColor: action === a ? ACTION_COLORS[a] : undefined, color: action === a ? ACTION_COLORS[a] : undefined }}
                    onClick={() => setAction(a)}>{a}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="dj-label">Entry Price ($)</div>
              <input className="dj-input" type="number" placeholder="—" value={price}
                onChange={e => setPrice(e.target.value)} style={{ width: 90 }} />
            </div>
            <div>
              <div className="dj-label">Catalyst Type</div>
              <select className="dj-input" value={catType} onChange={e => setCatType(e.target.value)}>
                {CAT_TYPES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div className="dj-label">Conviction (1-5)</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                {CONVICTIONS.map(v => (
                  <button key={v} className="dj-conv-btn" onClick={() => setConv(v)}
                    style={{ background: v <= conv ? 'var(--yellow)' : 'var(--border)', color: v <= conv ? '#000' : 'var(--text-dim)', width: 24, height: 24, borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="dj-label">Catalyst Date</div>
              <input className="dj-input" type="date" value={catDate} onChange={e => setCatDate(e.target.value)} />
            </div>
            <div>
              <div className="dj-label">Emotional State</div>
              <select className="dj-input" value={emotion} onChange={e => setEmotion(e.target.value)}>
                {EMOTIONS.map(em => <option key={em}>{em}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div className="dj-label">Investment Thesis</div>
            <textarea className="dj-textarea" rows={3} placeholder="Why are you entering this position? What is the thesis?" value={thesis}
              onChange={e => setThesis(e.target.value)} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <div className="dj-label">Invalidation Conditions</div>
            <textarea className="dj-textarea" rows={2} placeholder="What would make this thesis wrong? At what point do you exit?" value={invalid}
              onChange={e => setInvalid(e.target.value)} />
          </div>
          <button className="dj-save-btn" onClick={handleSave}>+ Log Decision</button>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {['all','open','win','loss','scratch',...CAT_TYPES].map(f => (
            <button key={f} className={`dj-filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
              style={{ fontSize: '0.6rem', padding: '3px 8px', borderRadius: 6, border: `1px solid ${filter === f ? 'var(--yellow)' : 'var(--border)'}`, background: filter === f ? 'var(--surface)' : 'transparent', color: filter === f ? 'var(--yellow)' : 'var(--text-dim)', cursor: 'pointer' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Entries */}
        <div className="dj-entries">
          {filtered.length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem', fontStyle: 'italic' }}>
              No entries yet. Log your first decision above.
            </div>
          ) : filtered.map(entry => (
            <div key={entry.id} className="dj-entry-card"
              style={{ borderLeft: `3px solid ${STATUS_COLORS[entry.status] || '#64748b'}` }}>
              <div className="dj-entry-header">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ fontFamily: 'Syne', fontSize: '0.9rem', color: '#fff' }}>{entry.ticker}</strong>
                  <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, background: (ACTION_COLORS[entry.action] || '#64748b') + '22', color: ACTION_COLORS[entry.action] || '#64748b', fontWeight: 700 }}>{entry.action}</span>
                  <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, background: (STATUS_COLORS[entry.status] || '#64748b') + '22', color: STATUS_COLORS[entry.status] || '#64748b' }}>{entry.status.toUpperCase()}</span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>{entry.catType}</span>
                  <ConvBar val={entry.conv} />
                  {entry.emotion && entry.emotion !== 'Neutral' && (
                    <span style={{ fontSize: '0.6rem', color: 'var(--orange)' }}>⚡ {entry.emotion}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>{entry.date}</span>
                  {entry.price && <span style={{ fontSize: '0.65rem', color: 'var(--text)' }}>@ ${entry.price}</span>}
                  {entry.status === 'open' && (
                    <button className="port-rm" style={{ color: 'var(--teal)', borderColor: 'var(--teal)' }}
                      onClick={() => handleResolve(entry)}>✓ Resolve</button>
                  )}
                  <button className="port-rm" onClick={() => dispatch({ type: 'JOURNAL_REMOVE', id: entry.id })}>✕</button>
                </div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text)', marginTop: 8, lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-dim)', fontSize: '0.58rem', textTransform: 'uppercase' }}>Thesis: </strong>
                {entry.thesis}
              </div>
              {entry.invalid && (
                <div style={{ fontSize: '0.68rem', color: 'var(--orange)', marginTop: 6 }}>
                  <strong style={{ fontSize: '0.58rem', textTransform: 'uppercase' }}>Invalidation: </strong>
                  {entry.invalid}
                </div>
              )}
              {entry.status !== 'open' && (
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.6 }}>
                  Exit{entry.exitDate ? ` ${entry.exitDate}` : ''}{entry.exitPrice ? ` @ $${entry.exitPrice}` : ''}
                  {entry.returnPct != null && (
                    <span className={entry.returnPct >= 0 ? 'dj-pnl-positive' : 'dj-pnl-negative'} style={{ marginLeft: 6 }}>
                      {entry.returnPct >= 0 ? '+' : ''}{entry.returnPct}%
                    </span>
                  )}
                  {entry.exitReason && <span> · {entry.exitReason}</span>}
                  {entry.thesisCorrect != null && (
                    <span> · Thesis was {entry.thesisCorrect ? <span style={{ color: 'var(--green)' }}>✓ correct</span> : <span style={{ color: 'var(--red)' }}>✗ wrong</span>}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
