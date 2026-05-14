import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPlayerId } from './storage.js';
import './fantasy.css';

export default function FantasyHome() {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const normalized = useMemo(() => code.trim().toUpperCase(), [code]);
  const savedPlayerId = normalized ? getPlayerId(normalized) : null;

  function goJoin(e) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return;
    navigate(`/fantasy/join?code=${encodeURIComponent(c)}`);
  }

  function goResume() {
    if (!normalized || !savedPlayerId) return;
    navigate(`/fantasy/play/${encodeURIComponent(normalized)}/portfolio`);
  }

  return (
    <div className="fantasy-wrap">
      <header style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', color: '#fff' }}>
          Fantasy <span style={{ color: 'var(--yellow)' }}>Paper</span> Market
        </h1>
        <p className="fantasy-muted">Virtual cash · Live prices · % return leaderboard</p>
      </header>

      <div className="fantasy-card">
        <h2>Join a competition</h2>
        <form onSubmit={goJoin} className="fantasy-row">
          <input
            className="fantasy-input"
            placeholder="Invite code"
            value={code}
            onChange={e => setCode(e.target.value)}
            autoCapitalize="characters"
          />
          <button type="submit" className="fantasy-btn primary" disabled={!code.trim()}>
            Join
          </button>
        </form>
        {savedPlayerId && (
          <p style={{ marginTop: 12, fontSize: '0.8rem' }}>
            <span className="fantasy-muted">This browser already has a player for that code.</span>{' '}
            <button type="button" className="fantasy-btn primary" onClick={goResume}>
              Open my portfolio
            </button>
          </p>
        )}
      </div>

      <div className="fantasy-card" style={{ textAlign: 'center' }}>
        <h2>Commissioner</h2>
        <p className="fantasy-muted" style={{ marginBottom: 14 }}>
          Create a named league, set dates and starting bankroll, share the code on WhatsApp.
        </p>
        <Link to="/fantasy/create" className="fantasy-btn primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Create competition
        </Link>
      </div>

      <p className="fantasy-muted" style={{ textAlign: 'center', marginTop: 24 }}>
        <Link to="/" style={{ color: 'var(--text)' }}>← Back to dashboard</Link>
      </p>
    </div>
  );
}
