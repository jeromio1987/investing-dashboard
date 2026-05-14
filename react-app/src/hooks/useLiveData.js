/**
 * useLiveData — connects to local FastAPI backend or falls back to
 * public Yahoo Finance proxy.
 *
 * Usage:
 *   const { quotes, connected } = useLiveData(tickerList);
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '../config/api.js';

const BACKEND_WS  = () => `${API_BASE.replace(/^http/, 'ws')}/ws/prices`;
const BACKEND_REST = () => `${API_BASE}/quotes`;
const YF_PROXY    = 'https://query1.finance.yahoo.com/v8/finance/chart';

async function fetchYahoo(ticker) {
  try {
    const r = await fetch(
      `${YF_PROXY}/${ticker}?interval=1d&range=2d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const data = await r.json();
    const meta = data.chart.result[0].meta;
    const price = parseFloat(meta.regularMarketPrice || 0);
    const prev  = parseFloat(meta.chartPreviousClose || meta.previousClose || price);
    return {
      ticker,
      price: +price.toFixed(2),
      prev:  +prev.toFixed(2),
      change: +(price - prev).toFixed(2),
      pct:   prev ? +((price - prev) / prev * 100).toFixed(2) : 0,
      ok: true,
    };
  } catch {
    return { ticker, ok: false };
  }
}

export function useLiveData(tickers = []) {
  const [quotes, setQuotes]       = useState({});
  const [connected, setConnected] = useState(false);
  const [mode, setMode]           = useState('checking'); // 'ws' | 'openbb' | 'rest' | 'yahoo' | 'checking'
  const wsRef = useRef(null);
  const retryRef = useRef(null);
  const tickersKey = Array.isArray(tickers) && tickers.length ? tickers.join(',') : '';

  const parseQuotes = useCallback((list) => {
    const map = {};
    list.forEach(q => { if (q.ok !== false) map[q.ticker] = q; });
    setQuotes(prev => ({ ...prev, ...map }));
  }, []);

  useEffect(() => {
    const list = tickersKey ? tickersKey.split(',') : [];
    let ws;
    let failed = false;

    const fallback = async () => {
      if (!list.length) {
        setConnected(false);
        setMode('checking');
        return;
      }
      try {
        const url = `${BACKEND_REST()}?tickers=${list.join(',')}`;
        const r = await fetch(url);
        if (r.ok) {
          const data = await r.json();
          parseQuotes(data.quotes || []);
          const src = String(data.source || '');
          setMode(src.includes('openbb') ? 'openbb' : 'rest');
          setConnected(true);
          if (retryRef.current) clearInterval(retryRef.current);
          retryRef.current = setInterval(async () => {
            try {
              const rr = await fetch(url);
              if (rr.ok) { const d = await rr.json(); parseQuotes(d.quotes || []); }
            } catch {}
          }, 60_000);
          return;
        }
      } catch {}

      setMode('yahoo');
      const all = await Promise.all(list.map(fetchYahoo));
      parseQuotes(all);
      if (retryRef.current) clearInterval(retryRef.current);
      retryRef.current = setInterval(async () => {
        const updated = await Promise.all(list.map(fetchYahoo));
        parseQuotes(updated);
      }, 120_000);
    };

    const tryWS = () => {
      ws = new WebSocket(BACKEND_WS());
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setMode('ws');
        if (list.length) ws.send(JSON.stringify({ tickers: list }));
      };
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'quotes') parseQuotes(msg.data);
        } catch {}
      };
      ws.onerror = () => { if (!failed) { failed = true; fallback(); } };
      ws.onclose = () => {
        setConnected(false);
        if (!failed) { failed = true; fallback(); }
      };
    };

    if (retryRef.current) {
      clearInterval(retryRef.current);
      retryRef.current = null;
    }
    if (list.length) tryWS();
    else {
      setConnected(false);
      setMode('checking');
    }

    return () => {
      if (ws) ws.close();
      if (retryRef.current) clearInterval(retryRef.current);
    };
  }, [tickersKey, parseQuotes]);

  return { quotes, connected, mode };
}
