import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config/api.js';

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '14px 16px',
      minWidth: 140,
    }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--yellow)' }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function PropertyMoving({ isActive }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/moving/snapshot`);
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.detail || `HTTP ${r.status}`);
        }
        const d = await r.json();
        if (!cancelled) {
          setData(d.snapshot);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setData(null);
          setError(e.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isActive]);

  if (!isActive) return null;

  if (loading) {
    return <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Moving snapshot laden…</p>;
  }

  if (error) {
    return (
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 20,
        fontSize: '0.85rem',
        lineHeight: 1.5,
      }}>
        <p style={{ color: 'var(--red)', marginBottom: 12 }}>{error}</p>
        <p style={{ color: 'var(--text-dim)' }}>
          Start backend (<code>python server_v2.py</code>) en run:
        </p>
        <pre style={{ background: '#0a0a14', padding: 12, borderRadius: 6, overflow: 'auto' }}>
          cd Prive/moving{'\n'}python property_scanner.py
        </pre>
      </div>
    );
  }

  const c = data?.cadix || {};
  const mc = data?.monte_carlo_10y || {};
  const best = data?.best_move_target || {};
  const listings = data?.top_listings_sale || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: 0 }}>
        Cadix / Antwerpen woningbeslissing — geexporteerd {data?.exported_at || '—'}.
        {' '}Volledig dashboard: <code>Prive/moving/dashboard.html</code>
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <StatCard label="Houden score" value={`${c.composite_hold ?? '—'}/10`} sub="Cadix composite" />
        <StatCard label="Equity" value={`€${(c.equity_eur || 0).toLocaleString()}`} sub={`LTV ${c.ltv_pct ?? '—'}%`} />
        <StatCard label="Supply-druk" value={`${c.supply_pressure ?? '—'}/10`} sub="Pipeline nieuwbouw" />
        <StatCard label="Verkeer" value={`${c.traffic_now ?? '—'}/10`} sub="Nu" />
        <StatCard label="Beste verhuizen" value={best.label || '—'} sub={`Score ${best.composite_move ?? '—'}`} />
      </div>

      <section>
        <h3 style={{ fontSize: '0.9rem', marginBottom: 10 }}>Monte Carlo — 10 jaar mediaan</h3>
        <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: 'var(--text-dim)', textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>Scenario</th>
              <th style={{ padding: '6px 8px' }}>Mediaan vermogen</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Houden Cadix', mc.hold_cadix],
              ['Verkopen + beleggen', mc.sell_rent_invest],
              ['Pandwissel Berchem', mc.swap_berchem],
              ['Cadix verhuren', mc.rent_out_cadix],
            ].map(([label, val]) => (
              <tr key={label} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '8px' }}>{label}</td>
                <td style={{ padding: '8px', color: 'var(--yellow)', fontWeight: 600 }}>
                  {val != null ? `€${val.toLocaleString()}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {data?.recommendation && (
        <div style={{
          background: 'var(--surface)',
          borderLeft: '3px solid var(--yellow)',
          padding: '12px 16px',
          borderRadius: 6,
          fontSize: '0.82rem',
          lineHeight: 1.5,
        }}>
          {data.recommendation}
        </div>
      )}

      {listings.length > 0 && (
        <section>
          <h3 style={{ fontSize: '0.9rem', marginBottom: 10 }}>Top listings te koop</h3>
          <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'var(--text-dim)', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>Score</th>
                <th style={{ padding: '6px 8px' }}>Buurt</th>
                <th style={{ padding: '6px 8px' }}>Prijs</th>
                <th style={{ padding: '6px 8px' }}>Fair value</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((it) => {
                const fv = it.fair_value || {};
                return (
                  <tr key={it.id || it.url} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px' }}>{it.score}</td>
                    <td style={{ padding: '8px' }}>
                      <a href={it.url} target="_blank" rel="noreferrer" style={{ color: 'var(--yellow)' }}>
                        {it.district_label}
                      </a>
                    </td>
                    <td style={{ padding: '8px' }}>{it.price ? `€${it.price.toLocaleString()}` : '—'}</td>
                    <td style={{ padding: '8px' }}>
                      {fv.delta_pct != null ? `${fv.delta_pct > 0 ? '+' : ''}${fv.delta_pct}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
