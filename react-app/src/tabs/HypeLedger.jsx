import React, { useEffect, useRef, useState } from 'react';

const ACCENT   = '#e63946';
const TOTAL_MS = 44000;
const MASCOT   = '/mascot.png';

// ─────────────────────────────────────────────────────────────────────────────
// INTRO SCRIPT
// Prologue → SMID structural case → edge thesis → reveal
// ─────────────────────────────────────────────────────────────────────────────
const SCRIPT = [
  // ── Prologue: the crowd ──
  { text: 'CASE FILE · ALPHA STRATEGY #001',                           size: '0.62rem',                       color: '#2a2a3a', ls: '0.35em',  w: 400, italic: false, inAt: 500,   stay: false, outAt: 3400  },
  { text: 'THE CROWD',                                                   size: 'clamp(3rem, 9vw, 5.5rem)',      color: '#ffffff', ls: '-0.03em', w: 700, italic: false, inAt: 1600,  stay: false, outAt: 5800  },
  { text: 'IS ALWAYS WRONG.',                                            size: 'clamp(1.6rem, 4.5vw, 2.8rem)', color: ACCENT,    ls: '-0.01em', w: 700, italic: false, inAt: 2900,  stay: false, outAt: 6200  },
  { text: 'Just not yet.',                                               size: '1.2rem',                        color: '#3a3a4a', ls: '0',       w: 300, italic: true,  inAt: 5600,  stay: false, outAt: 8600  },
  { text: 'Your edge is not being smarter.',                             size: '0.9rem',                        color: '#5a5a6a', ls: '0.04em',  w: 300, italic: false, inAt: 7600,  stay: false, outAt: 11000 },
  { text: "It's knowing when others will get stupid.",                   size: '0.98rem',                       color: '#aaaabc', ls: '0',       w: 400, italic: false, inAt: 9600,  stay: false, outAt: 13000 },

  // ── The structural case for SMID ──
  { text: 'SMALL & MID CAP',                                            size: 'clamp(2.4rem, 7vw, 4.2rem)',    color: '#ffffff', ls: '-0.02em', w: 700, italic: false, inAt: 12800, stay: false, outAt: 17000 },
  { text: 'STRUCTURALLY MISPRICED.',                                     size: 'clamp(1.2rem, 3.5vw, 2.2rem)', color: ACCENT,    ls: '-0.01em', w: 700, italic: false, inAt: 14200, stay: false, outAt: 17400 },
  { text: '87% covered by fewer than 3 analysts.',                      size: '0.93rem',                       color: '#3e3e52', ls: '0.02em',  w: 300, italic: false, inAt: 16600, stay: false, outAt: 20200 },
  { text: 'Institutions cannot enter without moving the price.',        size: '0.88rem',                       color: '#5a5a6e', ls: '0.01em',  w: 300, italic: false, inAt: 18800, stay: false, outAt: 22400 },
  { text: 'Less competition. Thinner ask. Wider inefficiency window.',  size: '0.85rem',                       color: '#707086', ls: '0',       w: 300, italic: false, inAt: 21200, stay: false, outAt: 25000 },

  // ── Why narrative wins here ──
  { text: 'In thin markets, narrative moves faster than fundamentals.', size: '0.9rem',                        color: '#7a7a8e', ls: '0',       w: 300, italic: false, inAt: 24000, stay: false, outAt: 27600 },
  { text: 'The move happens before consensus forms.',                   size: '1.05rem',                       color: '#c0c0d4', ls: '0',       w: 400, italic: false, inAt: 26400, stay: false, outAt: 30000 },
  { text: 'That gap — between reality and perception —',               size: '0.88rem',                       color: '#5a5a6e', ls: '0',       w: 300, italic: true,  inAt: 28800, stay: false, outAt: 32200 },
  { text: 'is where the return lives.',                                 size: 'clamp(1.3rem, 3.5vw, 2rem)',    color: '#ffffff', ls: '0',       w: 700, italic: false, inAt: 30400, stay: false, outAt: 33800 },

  // ── Title reveal ──
  { text: '— — ——',                                                     size: '0.65rem',                       color: ACCENT,    ls: '0.6em',   w: 400, italic: false, inAt: 33400, stay: true,  outAt: 99999 },
  { text: 'THE HYPE LEDGER',                                            size: 'clamp(2rem, 6vw, 3.8rem)',      color: '#ffffff', ls: '0.14em',  w: 700, italic: false, inAt: 34800, stay: true,  outAt: 99999 },
  { text: 'Forensic framework · Small-cap narrative capture',           size: '0.68rem',                       color: '#2e2e42', ls: '0.1em',   w: 300, italic: false, inAt: 36400, stay: true,  outAt: 99999 },
];

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLE CANVAS HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useParticleCanvas(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const N   = 55;
    const pts = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00022,
      vy: (Math.random() - 0.5) * 0.00022,
    }));
    let raf;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const draw = () => {
      const W = canvas.offsetWidth; const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      pts.forEach(p => {
        p.x += p.vx; if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
        p.y += p.vy; if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(230,57,70,0.18)'; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = (pts[i].x - pts[j].x) * W;
          const dy = (pts[i].y - pts[j].y) * H;
          const d  = Math.hypot(dx, dy);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x * W, pts[i].y * H);
            ctx.lineTo(pts[j].x * W, pts[j].y * H);
            ctx.strokeStyle = `rgba(230,57,70,${(1 - d / 130) * 0.07})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [canvasRef]);
}

// ─────────────────────────────────────────────────────────────────────────────
// CINEMATIC INTRO  (dog reveal at ~17s)
// ─────────────────────────────────────────────────────────────────────────────
function CinematicIntro({ onComplete }) {
  const [visible,    setVisible]    = useState(new Set());
  const [gone,       setGone]       = useState(new Set());
  const [dogVisible, setDogVisible] = useState(false);
  const canvasRef = useRef(null);
  useParticleCanvas(canvasRef);

  useEffect(() => {
    const timers = [];
    SCRIPT.forEach((line, i) => {
      timers.push(setTimeout(() => setVisible(v => new Set([...v, i])), line.inAt));
      if (!line.stay) timers.push(setTimeout(() => setGone(g => new Set([...g, i])), line.outAt));
    });
    timers.push(setTimeout(() => setDogVisible(true), 34600));
    timers.push(setTimeout(onComplete, TOTAL_MS));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000', zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    }}>
      {/* particle layer */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

      {/* ── DOG REVEAL ── full screen portrait behind text */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: dogVisible ? 1 : 0,
        transition: 'opacity 2.2s ease',
      }}>
        <img
          src={MASCOT}
          alt=""
          style={{
            height: '85vh', maxHeight: 700,
            objectFit: 'contain',
            filter: 'grayscale(1) contrast(1.1) brightness(0.35)',
            userSelect: 'none', pointerEvents: 'none',
          }}
        />
        {/* red vignette sweep over the image */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at center, transparent 30%, #000 82%)`,
          pointerEvents: 'none',
        }} />
        {/* thin red line at bottom of image area */}
        <div style={{
          position: 'absolute', bottom: '12vh', left: '50%',
          transform: `translateX(-50%) scaleX(${dogVisible ? 1 : 0})`,
          width: 180, height: 1,
          background: ACCENT,
          transition: 'transform 1.6s ease 0.8s',
          transformOrigin: 'center',
        }} />
      </div>

      {/* ── TEXT STACK ── */}
      <div style={{
        position: 'relative', zIndex: 2, textAlign: 'center',
        padding: '0 clamp(1.5rem, 6vw, 5rem)', maxWidth: 900, width: '100%',
      }}>
        {SCRIPT.map((line, i) => {
          const on = visible.has(i) && !gone.has(i);
          return (
            <div key={i} style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: line.size, color: line.color,
              letterSpacing: line.ls, fontWeight: line.w,
              fontStyle: line.italic ? 'italic' : 'normal',
              lineHeight: line.w >= 700 ? 1.05 : 1.5,
              marginBottom: line.w >= 700 ? '0.15rem' : '0.5rem',
              opacity: on ? 1 : 0,
              transform: on ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.97)',
              transition: 'opacity 1.1s ease, transform 1.1s ease',
              userSelect: 'none', pointerEvents: 'none',
              textShadow: dogVisible ? '0 2px 24px #000, 0 0 8px #000' : 'none',
            }}>
              {line.text}
            </div>
          );
        })}
      </div>

      <button
        onClick={onComplete}
        style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem',
          background: 'transparent', border: '1px solid #1e1e1e',
          color: '#2a2a2a', padding: '7px 18px',
          fontSize: '0.58rem', letterSpacing: '0.18em',
          cursor: 'pointer', fontFamily: "'Syne', sans-serif",
          textTransform: 'uppercase', zIndex: 10,
          transition: 'color 0.3s, border-color 0.3s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = '#444'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#2a2a2a'; e.currentTarget.style.borderColor = '#1e1e1e'; }}
      >
        Skip ›
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FRAMEWORK DATA
// ─────────────────────────────────────────────────────────────────────────────
const ANATOMY = [
  { label: 'Narrative', n: '01', desc: 'A story simple enough for retail to repeat on Reddit. Bigger = better. "AI cures cancer" beats "improved EBITDA margins." The crowd needs a slogan, not a thesis.' },
  { label: 'Catalyst',  n: '02', desc: 'A binary event in 2–10 weeks. Earnings, FDA decision, contract win, product launch. Date known. Stakes clear. Ambiguous catalysts are not catalysts.' },
  { label: 'Float',     n: '03', desc: 'Low float (<30M shares preferred). Institutional ownership <20%. Small fuel tank — a match creates an explosion. Large float dilutes the move.' },
  { label: 'Vacuum',    n: '04', desc: 'Low avg volume creates price dislocations. When the crowd arrives, the ask ladder is thin. Price discovery fails upward. Multipliers activate.' },
];

const PROTOCOL = [
  { n: '01', rule: 'Narrative must be reducible to one sentence a distracted person would repeat. If it requires a paragraph, the crowd will not carry it.' },
  { n: '02', rule: 'Catalyst must have a hard date within 60 days. No date = no trade. "Eventually" is not a catalyst. It is hope dressed as a thesis.' },
  { n: '03', rule: 'Float under 50M preferred. Above 100M requires exceptional narrative and visible institutional catalyst flow. Pass on doubt.' },
  { n: '04', rule: 'Enter during accumulation phase — before the volume spike. After the spike, you are not an investor with edge. You are tourist capital.' },
  { n: '05', rule: "Never average down in a hype trade. The position is set at entry. The thesis was the entry. If the thesis hasn't changed, the loss is data, not opportunity." },
];

const LEDGER = [
  { tier: 'SCOUT',           pct: '0.5%',  status: 'NEUTRAL', desc: 'Narrative identified. Catalyst unconfirmed or >60 days. Proof-of-concept size. Earns the right to add when conditions improve.' },
  { tier: 'CONVICTION',      pct: '1.5%',  status: 'ACTIVE',  desc: 'All 4 anatomy signals present. Catalyst confirmed with hard date. Standard full allocation. Manage from here.' },
  { tier: 'HIGH CONVICTION', pct: '3.0%',  status: 'MAX',     desc: 'Perfect setup. Float <20M, catalyst imminent (<21 days), narrative spreading organically. Maximum allowed. Nothing above 3%.' },
];

const KILL_SWITCH = [
  { id: 'KS01', rule: 'Catalyst delayed with no new date → exit same day. The story has become uncertainty. Uncertainty does not pump.' },
  { id: 'KS02', rule: "Position up >40% in <3 days with no news → trim to SCOUT size. That's pure hype compression. You've been paid. Don't donate it back." },
  { id: 'KS03', rule: 'Volume collapses 3 consecutive days before catalyst → distribution in progress. Smart money is leaving. Exit.' },
  { id: 'KS04', rule: 'Position breaches -25% from entry → exit. No extensions. No averaging. No "but the thesis is intact." File closed.' },
  { id: 'KS05', rule: 'Narrative appears on mainstream financial media (CNBC, Bloomberg segment) → the crowd has arrived. You are the exit liquidity.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MICRO-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const SL = ({ children }) => (
  <div style={{
    fontFamily: "'Syne', sans-serif", fontSize: '0.58rem',
    letterSpacing: '0.3em', color: ACCENT, textTransform: 'uppercase',
    marginBottom: '0.8rem', fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: '0.7rem',
  }}>
    <span style={{ display: 'inline-block', width: 18, height: 1, background: ACCENT, flexShrink: 0 }} />
    {children}
  </div>
);

const Divider = () => <div style={{ width: '100%', height: 1, background: '#0e0e16', margin: '3rem 0' }} />;

// ─────────────────────────────────────────────────────────────────────────────
// FRAMEWORK PAGE
// ─────────────────────────────────────────────────────────────────────────────
function FrameworkPage({ onReplay }) {
  return (
    <div style={{
      width: '100%', maxWidth: 880, margin: '0 auto',
      padding: 'clamp(1.5rem, 4vw, 3rem)',
      fontFamily: "'DM Sans', sans-serif", color: '#c0c0d0',
    }}>

      {/* ── MASTHEAD ── */}
      <div style={{ borderBottom: `1px solid ${ACCENT}18`, paddingBottom: '2.5rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>

          {/* Left: title block */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <SL>Alpha Strategy · Case File #001 · 2026</SL>
            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(2.8rem, 8vw, 5rem)',
              fontWeight: 700, color: '#fff',
              letterSpacing: '-0.03em', lineHeight: 1,
              marginBottom: '1.2rem',
            }}>
              THE HYPE<br />
              <span style={{ color: ACCENT }}>LEDGER.</span>
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#33334a', letterSpacing: '0.04em', maxWidth: 480, lineHeight: 1.7, fontWeight: 300 }}>
              A forensic operating framework for small-cap narrative capture. Not a system for being right. A system for being positioned before everyone else gets stupid — and knowing exactly when to leave.
            </p>
          </div>

          {/* Right: analyst portrait stamp */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <div style={{
              width: 110, height: 110,
              border: `1px solid ${ACCENT}44`,
              overflow: 'hidden',
              position: 'relative',
            }}>
              <img
                src={MASCOT}
                alt="Analyst on file"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', filter: 'grayscale(1) contrast(1.05)' }}
              />
              {/* red corner stamp */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: `${ACCENT}cc`,
                padding: '3px 0', textAlign: 'center',
                fontFamily: "'Syne', sans-serif",
                fontSize: '0.42rem', letterSpacing: '0.2em',
                color: '#fff', fontWeight: 700, textTransform: 'uppercase',
              }}>
                Analyst on file
              </div>
            </div>
            <button onClick={onReplay} style={{
              background: 'transparent', border: '1px solid #141420',
              color: '#33334a', padding: '6px 14px',
              fontSize: '0.55rem', letterSpacing: '0.15em',
              cursor: 'pointer', fontFamily: "'Syne', sans-serif",
              textTransform: 'uppercase', transition: 'all 0.25s', width: '100%',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#444'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#33334a'; e.currentTarget.style.borderColor = '#141420'; }}
            >
              ↻ Replay
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 01: ANATOMY ── */}
      <div style={{ marginBottom: '3rem' }}>
        <SL>Section 01 · Prerequisite Conditions</SL>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: '0.5rem' }}>
          The Anatomy of a Pump
        </h2>
        <p style={{ fontSize: '0.75rem', color: '#2e2e3e', letterSpacing: '0.04em', marginBottom: '1.8rem', fontWeight: 300 }}>
          All four must be present. Three is a watch list. Two is a pass.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1px', background: '#0e0e16' }}>
          {ANATOMY.map((item, i) => (
            <div key={i} style={{ background: '#07070f', padding: '1.5rem 1.3rem', borderTop: `2px solid ${i === 0 ? ACCENT : 'transparent'}` }}>
              <div style={{ fontSize: '0.52rem', color: ACCENT, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.6rem', fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
                {item.n} · {item.label}
              </div>
              <p style={{ fontSize: '0.77rem', color: '#5a5a6e', lineHeight: 1.65, fontWeight: 300 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* ── SECTION 02: PROTOCOL ── */}
      <div style={{ marginBottom: '3rem' }}>
        <SL>Section 02 · Entry Rules</SL>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: '0.5rem' }}>
          The Entry Protocol
        </h2>
        <p style={{ fontSize: '0.75rem', color: '#2e2e3e', letterSpacing: '0.04em', marginBottom: '1.8rem', fontWeight: 300 }}>
          Rules are binary. They apply or they don't. There is no discretion zone.
        </p>
        {PROTOCOL.map((item, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '3.5rem 1fr', gap: '1.5rem', padding: '1.2rem 0', borderBottom: '1px solid #0c0c14', alignItems: 'start' }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.62rem', color: ACCENT, letterSpacing: '0.1em', fontWeight: 700, paddingTop: '0.12rem' }}>{item.n}</span>
            <span style={{ fontSize: '0.83rem', color: '#6a6a7e', lineHeight: 1.65, fontWeight: 300 }}>{item.rule}</span>
          </div>
        ))}
      </div>

      <Divider />

      {/* ── SECTION 03: LEDGER ── */}
      <div style={{ marginBottom: '3rem' }}>
        <SL>Section 03 · Sizing Doctrine</SL>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: '0.5rem' }}>
          The Position Ledger
        </h2>
        <p style={{ fontSize: '0.75rem', color: '#2e2e3e', letterSpacing: '0.04em', marginBottom: '1.8rem', fontWeight: 300 }}>
          Conviction is expressed through size. Nothing above 3% of portfolio. Ever.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#0e0e16' }}>
          {LEDGER.map((item, i) => (
            <div key={i} style={{ background: '#07070f', padding: '1.3rem 1.5rem', display: 'grid', gridTemplateColumns: '7rem 3.5rem 1fr', gap: '2rem', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.55rem', letterSpacing: '0.18em', color: '#22222e', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.3rem' }}>{item.tier}</div>
                <div style={{ display: 'inline-block', fontSize: '0.46rem', letterSpacing: '0.15em', color: i === 2 ? ACCENT : i === 1 ? '#4ade80' : '#44445a', border: `1px solid ${i === 2 ? ACCENT + '44' : i === 1 ? '#4ade8044' : '#22222e'}`, padding: '2px 6px', fontFamily: "'Syne', sans-serif", fontWeight: 600, textTransform: 'uppercase' }}>
                  {item.status}
                </div>
              </div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.3rem, 3vw, 1.7rem)', fontWeight: 700, color: i === 2 ? ACCENT : '#fff', letterSpacing: '-0.02em' }}>{item.pct}</span>
              <span style={{ fontSize: '0.78rem', color: '#44445a', lineHeight: 1.6, fontWeight: 300 }}>{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* ── SECTION 04: KILL SWITCH ── */}
      <div style={{ marginBottom: '3rem' }}>
        <SL>Section 04 · Exit Doctrine</SL>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: '0.5rem' }}>
          The Kill Switch
        </h2>
        <p style={{ fontSize: '0.75rem', color: '#2e2e3e', letterSpacing: '0.04em', marginBottom: '1.8rem', fontWeight: 300 }}>
          These are not guidelines. A kill switch violation is a system failure.
        </p>
        <div style={{ borderLeft: `2px solid ${ACCENT}22`, paddingLeft: '1.8rem' }}>
          {KILL_SWITCH.map((item, i) => (
            <div key={i} style={{ padding: '1.1rem 0', borderBottom: '1px solid #0c0c14', display: 'flex', gap: '1.2rem', alignItems: 'flex-start' }}>
              <span style={{ color: ACCENT, fontSize: '0.58rem', fontFamily: "'Syne', sans-serif", letterSpacing: '0.1em', paddingTop: '0.18rem', flexShrink: 0, fontWeight: 700 }}>{item.id}</span>
              <span style={{ fontSize: '0.82rem', color: '#5a5a6e', lineHeight: 1.65, fontWeight: 300 }}>{item.rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ borderTop: '1px solid #0e0e16', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.55rem', color: '#1a1a28', letterSpacing: '0.18em', textTransform: 'uppercase' }}>The Hype Ledger · Personal framework · Not financial advice</span>
        <span style={{ fontSize: '0.55rem', color: ACCENT + '30', letterSpacing: '0.12em', fontFamily: "'Syne', sans-serif" }}>v1.0 · FY2026</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function HypeLedger({ isActive }) {
  const [introSeen, setIntroSeen] = useState(false);
  if (!isActive) return null;
  if (!introSeen) return <CinematicIntro onComplete={() => setIntroSeen(true)} />;
  return (
    <div className="tab-panel active" style={{ background: 'var(--bg)' }}>
      <FrameworkPage onReplay={() => setIntroSeen(false)} />
    </div>
  );
}
