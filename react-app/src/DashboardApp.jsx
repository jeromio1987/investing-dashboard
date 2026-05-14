import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardProvider, useDashboard } from './context/DashboardContext.jsx';
import { useLiveData } from './hooks/useLiveData.js';

import HypeLedger from './tabs/HypeLedger.jsx';
import HypeCycle from './tabs/HypeCycle.jsx';
import MacroEngine from './tabs/MacroEngine.jsx';
import SmidAlpha from './tabs/SmidAlpha.jsx';
import SmidSectors from './tabs/SmidSectors.jsx';
import Portfolio from './tabs/Portfolio.jsx';
import EVCalculator from './tabs/EVCalculator.jsx';
import DecisionJournal from './tabs/DecisionJournal.jsx';
import Correlation from './tabs/Correlation.jsx';

import { API_BASE } from './config/api.js';

const TABS = [
  { id: 'ledger', label: 'Hype Ledger' },
  { id: 'hype', label: '📈 Hype Cycle' },
  { id: 'macro', label: '🎛 Macro Engine' },
  { id: 'smid', label: '🔬 SMID Alpha' },
  { id: 'sectors', label: '🗺 SMID Sectors' },
  { id: 'portfolio', label: '💼 Portfolio' },
  { id: 'ev', label: '⚖️ EV Calc' },
  { id: 'journal', label: '📓 Decision Journal' },
  { id: 'corr', label: '🕸 Correlation' },
];

const WATCHLIST = [
  'NXE', 'UUUU', 'CCJ', 'POWL', 'VRT', 'GEV',
  'NOG', 'COP', 'XOM', 'KNTK', 'LNG', 'WMB',
  'BEAM', 'NTLA', 'RXRX', 'IONQ', 'NET', 'GLD', 'SLV',
];

function TickerTape({ quotes }) {
  const items = Object.values(quotes).filter(q => q.ok !== false);
  if (!items.length) {
    return (
      <div className="ticker-tape">
        <div style={{ color: 'var(--text-dim)', fontSize: '0.6rem', padding: '0 16px', lineHeight: '32px' }}>
          Loading prices…
        </div>
      </div>
    );
  }

  const inner = items.map(q => {
    const pos = q.change >= 0;
    const col = pos ? 'var(--green)' : 'var(--red)';
    return (
      <span key={q.ticker} className="ticker-item" style={{ color: col }}>
        <strong>{q.ticker}</strong>
        {' '}${q.price.toFixed(2)}
        {' '}
        <span style={{ opacity: 0.75 }}>
          {pos ? '+' : ''}{q.change.toFixed(2)} ({pos ? '+' : ''}{q.pct.toFixed(2)}%)
        </span>
      </span>
    );
  });

  return (
    <div className="ticker-tape">
      <div className="ticker-scroll-inner">
        {inner}{inner}
      </div>
    </div>
  );
}

function ConnectionBadge({ connected, mode }) {
  if (connected && mode === 'ws') return <span title="WebSocket — real-time" style={{ fontSize: '0.55rem', color: 'var(--green)', marginLeft: 8 }}>● LIVE</span>;
  if (connected && mode === 'openbb') return <span title="REST via OpenBB (yfinance)" style={{ fontSize: '0.55rem', color: 'var(--green)', marginLeft: 8 }}>● OPENBB</span>;
  if (connected && mode === 'rest') return <span title="REST polling" style={{ fontSize: '0.55rem', color: 'var(--yellow)', marginLeft: 8 }}>● REST</span>;
  if (connected && mode === 'yahoo') return <span title="Yahoo Finance proxy" style={{ fontSize: '0.55rem', color: 'var(--text-dim)', marginLeft: 8 }}>● PROXY</span>;
  return <span style={{ fontSize: '0.55rem', color: 'var(--text-dim)', marginLeft: 8 }}>○ OFFLINE</span>;
}

function InnerApp() {
  const [activeTab, setActiveTab] = useState('ledger');
  const [feedTickers, setFeedTickers] = useState(WATCHLIST);
  const { dispatch } = useDashboard();
  const { quotes, connected, mode } = useLiveData(feedTickers);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/watchlist`);
        if (!r.ok) return;
        const d = await r.json();
        if (cancelled || !d.tickers?.length) return;
        const merged = [...new Set([...WATCHLIST, ...d.tickers])];
        setFeedTickers(merged);
      } catch {
        /* keep default WATCHLIST */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (Object.keys(quotes).length > 0) {
      dispatch({ type: 'LIVE_DATA', data: quotes });
      dispatch({ type: 'PORT_UPDATE_PRICES' });
    }
  }, [quotes, dispatch]);

  return (
    <>
      <header>
        <h1>
          Sectors — <span>Hype Cycle &amp; Deep Dive 2026</span>
          <ConnectionBadge connected={connected} mode={mode} />
        </h1>
        <p className="subtitle">
          Personal investment framework · {new Date().getFullYear()} ·
          Not financial advice ·{' '}
          <Link to="/fantasy" style={{ color: 'var(--yellow)' }}>Fantasy competition</Link>
        </p>
      </header>

      <div
        style={{
          width: '100%',
          maxWidth: 1240,
          margin: '0 auto 14px',
          padding: '12px 16px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span style={{ fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.45 }}>
          <strong style={{ color: '#fff' }}>Fantasy paper market</strong>
          {' — '}virtual cash, live quotes, invite-only leagues. No login; your player id stays in this browser.
        </span>
        <Link
          to="/fantasy"
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '8px 16px',
            borderRadius: 6,
            border: '1px solid var(--yellow)',
            color: 'var(--yellow)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Open fantasy
        </Link>
      </div>

      <TickerTape quotes={quotes} />

      <nav className="tab-nav">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.id === 'ledger'
              ? <><img src={`${import.meta.env.BASE_URL}mascot.png`} alt="" style={{ width: 16, height: 16, objectFit: 'cover', objectPosition: 'top', borderRadius: 2, verticalAlign: 'middle', marginRight: 6, filter: 'grayscale(1)' }} />Hype Ledger</>
              : t.label}
          </button>
        ))}
      </nav>

      <div className="tab-panels">
        <HypeLedger isActive={activeTab === 'ledger'} />
        <HypeCycle isActive={activeTab === 'hype'} />
        <MacroEngine isActive={activeTab === 'macro'} />
        <SmidAlpha isActive={activeTab === 'smid'} quotes={quotes} />
        <SmidSectors isActive={activeTab === 'sectors'} quotes={quotes} />
        <Portfolio isActive={activeTab === 'portfolio'} />
        <EVCalculator isActive={activeTab === 'ev'} />
        <DecisionJournal isActive={activeTab === 'journal'} />
        <Correlation isActive={activeTab === 'corr'} />
      </div>
    </>
  );
}

export default function DashboardApp() {
  return (
    <DashboardProvider>
      <InnerApp />
    </DashboardProvider>
  );
}
