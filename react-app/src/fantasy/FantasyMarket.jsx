import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api.js';
import { getFantasyWatchlist, setFantasyWatchlist } from './storage.js';
import './fantasy.css';

function rowKey(a) {
  return `${a.ticker}|${a.asset_type}`;
}

export default function FantasyMarket() {
  const { inviteCode, playerId } = useOutletContext();
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [extra, setExtra] = useState([]);
  const [watch, setWatch] = useState(() => new Set(getFantasyWatchlist(inviteCode).map(x => `${x.ticker}|${x.asset_type}`)));
  const [lookupErr, setLookupErr] = useState('');
  const [lookupTicker, setLookupTicker] = useState('');
  const [findQuery, setFindQuery] = useState('');
  const [findResults, setFindResults] = useState([]);
  const [findBusy, setFindBusy] = useState(false);
  const [modal, setModal] = useState(null);
  const [qty, setQty] = useState('1');
  const [tradeErr, setTradeErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const r = await fetch(`${API_BASE}/game/${encodeURIComponent(inviteCode)}/prices`);
      const d = await r.json();
      if (d.ok && Array.isArray(d.assets)) setAssets(d.assets);
    } catch {
      /* keep */
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [inviteCode]);

  const persistWatch = useCallback(
    nextSet => {
      const list = [...nextSet].map(k => {
        const [ticker, asset_type] = k.split('|');
        return { ticker, asset_type };
      });
      setFantasyWatchlist(inviteCode, list);
    },
    [inviteCode]
  );

  const toggleWatch = useCallback(
    a => {
      const k = rowKey(a);
      setWatch(prev => {
        const n = new Set(prev);
        if (n.has(k)) n.delete(k);
        else n.add(k);
        persistWatch(n);
        return n;
      });
    },
    [persistWatch]
  );

  useEffect(() => {
    const q = findQuery.trim();
    if (q.length < 2) {
      setFindResults([]);
      setFindBusy(false);
      return;
    }
    setFindBusy(true);
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`${API_BASE}/symbol-search?q=${encodeURIComponent(q)}&limit=30`);
        const d = await r.json();
        if (d.ok && Array.isArray(d.results)) setFindResults(d.results);
        else setFindResults([]);
      } catch {
        setFindResults([]);
      } finally {
        setFindBusy(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [findQuery]);

  const merged = useMemo(() => {
    const m = new Map();
    for (const a of assets) {
      m.set(`${a.ticker}|${a.asset_type}`, a);
    }
    for (const a of extra) {
      m.set(`${a.ticker}|${a.asset_type}`, a);
    }
    return [...m.values()];
  }, [assets, extra]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = merged;
    if (q) {
      rows = merged.filter(
        a =>
          String(a.ticker).toLowerCase().includes(q) ||
          String(a.name || '').toLowerCase().includes(q) ||
          String(a.asset_type).toLowerCase().includes(q)
      );
    }
    const starred = rows.filter(a => watch.has(rowKey(a)));
    const rest = rows.filter(a => !watch.has(rowKey(a)));
    return [...starred, ...rest];
  }, [merged, search, watch]);

  async function addTicker(symbolOverride) {
    const raw = symbolOverride != null ? String(symbolOverride) : lookupTicker;
    const sym = raw.trim();
    setLookupErr('');
    if (!sym || sym.length > 32) {
      setLookupErr('Enter a valid ticker or pick a search result');
      return;
    }
    try {
      const r = await fetch(`${API_BASE}/quotes?tickers=${encodeURIComponent(sym)}`);
      const d = await r.json();
      const row = d.quotes?.[0];
      if (!row?.ok) {
        setLookupErr('Could not resolve price — check the Yahoo symbol (e.g. ABI.BR for Brussels).');
        return;
      }
      setExtra(prev => {
        const next = prev.filter(x => x.ticker !== row.ticker);
        next.push({
          ticker: row.ticker,
          asset_type: 'stock',
          name: row.name || row.ticker,
          price: row.price,
          pct: row.pct,
          ok: true,
        });
        return next;
      });
      setLookupTicker('');
      setFindQuery('');
      setFindResults([]);
    } catch (e) {
      setLookupErr(String(e.message || e));
    }
  }

  async function executeTrade() {
    if (!modal || !playerId) return;
    setTradeErr('');
    const q = parseFloat(qty);
    if (!(q > 0)) {
      setTradeErr('Quantity must be positive');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/game/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: playerId,
          ticker: modal.ticker,
          asset_type: modal.asset_type,
          direction: modal.side,
          quantity: q,
          client_request_id:
            typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cr_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setTradeErr(typeof d.detail === 'string' ? d.detail : JSON.stringify(d.detail || d));
        return;
      }
      setModal(null);
      navigate('../portfolio', { replace: false });
    } catch (e) {
      setTradeErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {!playerId && (
        <div className="fantasy-card" style={{ borderColor: 'var(--yellow)' }}>
          <p className="fantasy-muted">
            <Link to={`/fantasy/join?code=${encodeURIComponent(inviteCode)}`}>Join this competition</Link>
            {' '}with your display name to trade.
          </p>
        </div>
      )}

      <div className="fantasy-card">
        <h2>Find stocks worldwide</h2>
        <p className="fantasy-muted" style={{ marginBottom: 10 }}>
          Star rows to pin them to the top (saved in this browser). Search Yahoo for the exact symbol (often with suffixes like{' '}
          <code style={{ color: 'var(--teal)' }}>.BR</code>, <code style={{ color: 'var(--teal)' }}>.PA</code>,{' '}
          <code style={{ color: 'var(--teal)' }}>.L</code>), add to the list, then trade.
        </p>
        <div className="fantasy-row">
          <input
            className="fantasy-input"
            placeholder="Filter current list…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="fantasy-row">
          <input
            className="fantasy-input"
            placeholder="Search Yahoo (e.g. KBC, ASML, Toyota)"
            value={findQuery}
            onChange={e => setFindQuery(e.target.value)}
          />
        </div>
        {(findBusy || findResults.length > 0) && (
          <div
            style={{
              maxHeight: 220,
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 8,
              marginBottom: 10,
              fontSize: '0.78rem',
            }}
          >
            {findBusy && <div className="fantasy-muted" style={{ padding: 10 }}>Searching…</div>}
            {!findBusy && findResults.map(hit => (
              <div
                key={hit.symbol}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>
                  <strong style={{ color: '#fff' }}>{hit.symbol}</strong>
                  <span className="fantasy-muted"> · {hit.exchange || hit.type || '—'}</span>
                  <div className="fantasy-muted" style={{ marginTop: 2 }}>{hit.name}</div>
                </div>
                <button type="button" className="fantasy-btn primary" onClick={() => addTicker(hit.symbol)}>
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="fantasy-row">
          <input
            className="fantasy-input"
            placeholder="Or paste Yahoo symbol directly"
            value={lookupTicker}
            onChange={e => setLookupTicker(e.target.value)}
          />
          <button type="button" className="fantasy-btn" onClick={() => addTicker()}>
            Add by symbol
          </button>
        </div>
        {lookupErr && <p style={{ color: 'var(--red)', fontSize: '0.75rem' }}>{lookupErr}</p>}
      </div>

      <div className="fantasy-card">
        <h2>Tradeable assets</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="fantasy-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>★</th>
                <th>Type</th>
                <th>Symbol</th>
                <th>Name</th>
                <th>Price</th>
                <th>Feed</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={`${a.ticker}|${a.asset_type}`}>
                  <td>
                    <button type="button" className="fantasy-btn" style={{ padding: '4px 8px' }} title="Watchlist" onClick={() => toggleWatch(a)}>
                      {watch.has(rowKey(a)) ? '★' : '☆'}
                    </button>
                  </td>
                  <td>{a.asset_type}</td>
                  <td><strong>{a.ticker}</strong></td>
                  <td>{a.name}</td>
                  <td>{a.ok && a.price != null ? (a.asset_type === 'crypto' ? `$${Number(a.price).toLocaleString()}` : `$${Number(a.price).toFixed(2)}`) : '—'}</td>
                  <td>
                    {a.stale ? (
                      <span style={{ color: 'var(--yellow)', fontSize: '0.72rem' }} title="Cached quote — trading disabled until live feed recovers">stale</span>
                    ) : (
                      <span className="fantasy-muted" style={{ fontSize: '0.72rem' }}>live</span>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      className="fantasy-btn"
                      disabled={!playerId || !a.ok || a.stale}
                      title={a.stale ? 'Live price required to trade' : ''}
                      onClick={() => {
                        setModal({ ...a, side: 'buy' });
                        setQty(a.asset_type === 'crypto' ? '0.01' : '1');
                        setTradeErr('');
                      }}
                    >
                      Buy
                    </button>
                    {' '}
                    <button
                      type="button"
                      className="fantasy-btn"
                      disabled={!playerId || !a.ok || a.stale}
                      title={a.stale ? 'Live price required to trade' : ''}
                      onClick={() => {
                        setModal({ ...a, side: 'sell' });
                        setQty(a.asset_type === 'crypto' ? '0.01' : '1');
                        setTradeErr('');
                      }}
                    >
                      Sell
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fantasy-modal-back" role="presentation" onClick={() => !busy && setModal(null)}>
          <div className="fantasy-modal" role="dialog" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', marginBottom: 10 }}>
              {modal.side === 'buy' ? 'Buy' : 'Sell'} {modal.ticker}
            </h2>
            <p className="fantasy-muted">{modal.asset_type} · live execution price on submit</p>
            {modal.stale && (
              <p style={{ color: 'var(--yellow)', fontSize: '0.78rem', marginTop: 6 }}>
                This row is on a cached quote. Trading is disabled until the live feed returns.
              </p>
            )}
            <label className="fantasy-muted">Quantity</label>
            <input className="fantasy-input" style={{ width: '100%', marginTop: 6 }} value={qty} onChange={e => setQty(e.target.value)} type="number" min="1e-8" step="any" />
            {tradeErr && <p style={{ color: 'var(--red)', fontSize: '0.8rem', marginTop: 8 }}>{tradeErr}</p>}
            <div className="fantasy-row" style={{ marginTop: 14 }}>
              <button type="button" className="fantasy-btn" disabled={busy} onClick={() => setModal(null)}>Cancel</button>
              <button type="button" className="fantasy-btn primary" disabled={busy || modal.stale} onClick={executeTrade}>{busy ? '…' : 'Execute'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
