import React, { useEffect, useRef } from 'react';
import { RADAR_DATA, RADAR_AXES, RADAR_AXIS_COLORS, CAT_EVENTS } from '../data/radarData.js';

/* ── Radar draw (self-contained, no global deps) ─────────────────────────── */
function drawRadarOnCanvas(cv, hlIdx = -1) {
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const cx = W * 0.47, cy = H * 0.5;
  const R  = Math.min(W, H) * 0.33;
  const N  = RADAR_AXES.length;
  const MAX = 3;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0f0f1a';
  ctx.fillRect(0, 0, W, H);
  const angles = Array.from({length: N}, (_, i) => (i * 2 * Math.PI / N) - Math.PI / 2);

  for (let lv = 1; lv <= MAX; lv++) {
    const r = R * lv / MAX;
    ctx.beginPath();
    angles.forEach((a, i) => {
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = lv === MAX ? '#2a2a3e' : '#1a1a2e';
    ctx.lineWidth = lv === MAX ? 1.5 : 0.8;
    ctx.stroke();
  }

  angles.forEach((a, i) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 1; ctx.stroke();
    const ax = cx + (R + 18) * Math.cos(a);
    const ay = cy + (R + 18) * Math.sin(a);
    ctx.fillStyle = RADAR_AXIS_COLORS[i];
    ctx.font = '600 8px DM Sans';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(RADAR_AXES[i], ax, ay);
  });

  RADAR_DATA.forEach((s, idx) => {
    const pts = s.scores.map((v, i) => {
      const r = R * v / MAX;
      return [cx + r * Math.cos(angles[i]), cy + r * Math.sin(angles[i])];
    });
    const hl = idx === hlIdx;
    ctx.beginPath();
    pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.closePath();
    const [r, g, b] = hexToRgb(s.color);
    ctx.fillStyle = `rgba(${r},${g},${b},${hl ? 0.3 : 0.08})`;
    ctx.fill();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = hl ? 2.5 : 1.2;
    ctx.globalAlpha = hl ? 1 : 0.6;
    ctx.stroke();
    ctx.globalAlpha = 1;
    const [ax, ay] = centroid(pts);
    ctx.fillStyle = hl ? '#fff' : s.color;
    ctx.font = `${hl ? '700' : '500'} 7px DM Sans`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s.name, ax, ay);
  });
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function centroid(pts) {
  return [
    pts.reduce((s, p) => s + p[0], 0) / pts.length,
    pts.reduce((s, p) => s + p[1], 0) / pts.length,
  ];
}

/* ── Catalyst timeline draw ──────────────────────────────────────────────── */
function drawCatTimeline(cv) {
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0f0f1a'; ctx.fillRect(0, 0, W, H);
  const pad = 40, tw = W - pad * 2;
  const now = new Date(); const nowMs = now.getTime();
  const end = new Date(now.getFullYear(), 11, 31).getTime();
  const toX = ms => pad + (ms - nowMs) / (end - nowMs) * tw;

  ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, H/2); ctx.lineTo(W-pad, H/2); ctx.stroke();

  for (let m = now.getMonth(); m <= 11; m++) {
    const d = new Date(now.getFullYear(), m, 1);
    const x = toX(d.getTime());
    if (x < pad || x > W - pad) continue;
    ctx.strokeStyle = '#222235'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x, H/2-4); ctx.lineTo(x, H/2+4); ctx.stroke();
    ctx.fillStyle = '#2a2a4a'; ctx.font = '7px DM Sans'; ctx.textAlign = 'center';
    ctx.fillText(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m], x, H/2+14);
  }

  CAT_EVENTS.forEach((ev, i) => {
    const d = new Date(ev.date);
    const x = toX(d.getTime());
    if (x < pad - 10 || x > W - pad + 10) return;
    const above = i % 2 === 0;
    const y = above ? H/2 - 20 : H/2 + 20;
    ctx.strokeStyle = ev.color; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, H/2); ctx.lineTo(x, y); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI*2);
    ctx.fillStyle = ev.color; ctx.fill();
    ctx.fillStyle = '#e0e0f0'; ctx.font = '600 7px DM Sans'; ctx.textAlign = 'center';
    ctx.fillText(ev.label, x, above ? y - 10 : y + 14);
  });
}

/* ── Static content for SMID Alpha table ────────────────────────────────── */
const STATIC_CONTENT = `<!-- ── Live Data Bar ── -->
  <div class="live-bar" id="live-bar">
    <div class="live-bar-item"><span class="lb-label">SPX</span><span class="lb-val" id="lb-SPX">—</span><span class="lb-chg" id="lb-SPX-c">—</span></div>
    <div class="live-bar-item"><span class="lb-label">VIX</span><span class="lb-val" id="lb-VIX">—</span><span class="lb-chg" id="lb-VIX-c">—</span></div>
    <div class="live-bar-item"><span class="lb-label">WTI</span><span class="lb-val" id="lb-WTI">—</span><span class="lb-chg" id="lb-WTI-c">—</span></div>
    <div class="live-bar-item"><span class="lb-label">10Y</span><span class="lb-val" id="lb-TNX">—</span><span class="lb-chg" id="lb-TNX-c">—</span></div>
    <div class="live-bar-item"><span class="lb-label">Gold</span><span class="lb-val" id="lb-Gold">—</span><span class="lb-chg" id="lb-Gold-c">—</span></div>
    <div class="live-bar-item"><span class="lb-label">IWM</span><span class="lb-val" id="lb-IWM">—</span><span class="lb-chg" id="lb-IWM-c">—</span></div>
    <div class="live-status">
      <div class="live-dot loading" id="live-dot"></div>
      <span id="live-status-txt">Loading...</span>
      <button class="live-refresh-btn" onclick="fetchLiveData(true)">↻ Refresh</button>
    </div>
  </div>

<div class="smid-wrap">

<div style="margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid var(--border);">
  <div style="font-family:'Syne',sans-serif;font-size:1.05rem;font-weight:700;color:#fff;margin-bottom:3px;">
    SMID Alpha Engine
    <span style="color:var(--teal);"> — Where the Edge Actually Is</span>
  </div>
  <div style="font-size:0.62rem;color:var(--text-dim);letter-spacing:0.08em;text-transform:uppercase;">
    12 Names · Energy · AI Infra · Bio-AI · Uranium · Catalyst-Driven Framework
  </div>
</div>

<div class="smid-tabs">
  <button class="smid-tab active" onclick="switchSmid('edge')">⚡ The Edge</button>
  <button class="smid-tab" onclick="switchSmid('metrics')">📊 SMID Metrics</button>
  <button class="smid-tab" onclick="switchSmid('movers')">🎯 Price Movers</button>
  <button class="smid-tab" onclick="switchSmid('calendar')">📅 Catalyst Calendar</button>
  <button class="smid-tab" onclick="switchSmid('crossread')">🔗 Cross-Reads</button>
  <button class="smid-tab" onclick="switchSmid('playbook')">📖 Entry Playbook</button>
</div>

<!-- ─── PANEL 1: THE EDGE ─── -->
<div class="smid-panel active" id="smid-edge">
  <div class="smid-box">
    <strong>The core problem with large caps:</strong> By the time you read the thesis, Goldman's systematic desk has already priced it in. XOM's production numbers are tracked by satellite. VRT's backlog is modeled by 25 analysts. You have no information asymmetry, no speed advantage, no edge. You're just paying for consensus.
  </div>
  <div class="smid-box blue">
    <strong>Why SMID is different:</strong> POWL has 3 analysts. Information about their data center switchgear backlog diffuses slowly — it's disclosed once a quarter in an earnings call that few people attend. KYMR's Phase 2 data matters to maybe 200 sophisticated investors globally. NexGen's Environmental Assessment milestones get 4 lines in a specialist newsletter. The gap between what's happening and what's priced is real.
  </div>
  <div class="smid-box green">
    <strong>The SMID edge formula:</strong> (Thin coverage + Binary catalyst + Float constraint + Identifiable timing) = situations where a private investor can think more carefully and position more precisely than the institutional crowd.
  </div>

  <div class="smid-section">⚖️ Large Cap vs SMID — The Actual Difference</div>
  <div class="edge-grid">
    <div class="edge-card">
      <div class="edge-title" style="color:var(--red)">❌ Large Cap — What You're Competing Against</div>
      <div class="edge-row"><span class="edge-icon">🏦</span><div class="edge-text"><strong>Goldman, JPM, Citi</strong> — 15–25 analysts per name, channel checks with distributor CFOs, satellite data on tanker flows</div></div>
      <div class="edge-row"><span class="edge-icon">🤖</span><div class="edge-text"><strong>Quant funds</strong> — pricing in alt data (credit card spend, app downloads, job postings) in milliseconds</div></div>
      <div class="edge-row"><span class="edge-icon">📡</span><div class="edge-text"><strong>Satellite imagery</strong> — counting cars at XOM refineries, tracking LNG tanker positions in real-time</div></div>
      <div class="edge-row"><span class="edge-icon">📞</span><div class="edge-text"><strong>Expert networks</strong> — former executives on retainer, quarterly calls with supply chain contacts</div></div>
      <div class="edge-row"><span class="edge-icon">💰</span><div class="edge-text"><strong>Scale advantage</strong> — institutions move markets by entering; you follow the wake</div></div>
    </div>
    <div class="edge-card">
      <div class="edge-title" style="color:var(--green)">✓ SMID — Where You Can Win</div>
      <div class="edge-row"><span class="edge-icon">📋</span><div class="edge-text"><strong>2–3 analysts covering POWL</strong> — street estimates are wide, beats are frequent and large, coverage lag means the stock reacts slowly</div></div>
      <div class="edge-row"><span class="edge-icon">⏱</span><div class="edge-text"><strong>Catalyst is knowable</strong> — BEAM-101 data has a conference window. You can position before institutional attention arrives.</div></div>
      <div class="edge-row"><span class="edge-icon">🔒</span><div class="edge-text"><strong>Float constraint</strong> — A $2B float means a large fund can't build a meaningful position without moving the price. You can enter at market; they can't.</div></div>
      <div class="edge-row"><span class="edge-icon">📰</span><div class="edge-text"><strong>Information diffuses slowly</strong> — The POWL earnings call has 40 listeners. Your thesis from reading the 10-K may not be in the price yet.</div></div>
      <div class="edge-row"><span class="edge-icon">🎯</span><div class="edge-text"><strong>Binary events create asymmetry</strong> — A 50% gain on 1% position if BEAM data is positive. A 35% stop limits the downside. The math works if you size correctly.</div></div>
    </div>
  </div>

  <div class="smid-section">🧮 SMID Sizing Philosophy</div>
  <div class="edge-grid">
    <div class="edge-card">
      <div class="edge-title">Sizing by Catalyst Type</div>
      <div class="edge-row"><span class="edge-icon">🟢</span><div class="edge-text"><strong>Earnings beat plays (POWL, AAON, NOG, CIVI):</strong> 1.5–3% position. Catalyst is quarterly, not binary-existential. You can hold through and add on beats.</div></div>
      <div class="edge-row"><span class="edge-icon">🟡</span><div class="edge-text"><strong>Commodity leverage (NOG, CIVI, MTDR, NXE):</strong> 1–2%. You're taking macro + idiosyncratic risk. Cap the size; the beta already gives you the exposure.</div></div>
      <div class="edge-row"><span class="edge-icon">🔴</span><div class="edge-text"><strong>Binary clinical data (BEAM, NTLA, ARVN, KYMR):</strong> 0.5–1% max. DEFINE the exit before you enter. A 35% stop is not negotiable. Never add to a clinical loser.</div></div>
      <div class="edge-row"><span class="edge-icon">⚪</span><div class="edge-text"><strong>Pre-revenue development (NXE, UUUU, KYMR):</strong> 0.5–0.75%. These are lottery tickets with defined characteristics. Size them like lottery tickets.</div></div>
    </div>
    <div class="edge-card">
      <div class="edge-title">Portfolio Constraints</div>
      <div class="edge-row"><span class="edge-icon">📐</span><div class="edge-text"><strong>SMID total:</strong> 15–25% of portfolio max. You need the large cap anchors for stability.</div></div>
      <div class="edge-row"><span class="edge-icon">📐</span><div class="edge-text"><strong>Speculative (BEAM/NTLA/KYMR/ARVN/NXE/UUUU combined):</strong> 5–7% max. Binary risk is correlated in risk-off environments.</div></div>
      <div class="edge-row"><span class="edge-icon">📐</span><div class="edge-text"><strong>Single SMID name max:</strong> 3% for profitable names (POWL, AAON, NOG, CIVI); 1% for spec names.</div></div>
      <div class="edge-row"><span class="edge-icon">⚠️</span><div class="edge-text"><strong>Liquidity rule:</strong> Don't own more than 5 days of average daily volume in a SMID name. POWL at $8M/day = $40M max position for an institution; for you it doesn't matter but respect the bid/ask.</div></div>
    </div>
  </div>

<!-- ═══ NEW SECTORS: PSYCHEDELICS + CPU SHORTAGE ═══ -->
<div class="smid-section">💊 Emerging Sector: Psychedelic Biotech</div>
<div class="smid-box" style="border-left-color:var(--purple);">
  <strong style="color:var(--purple);">Why now — the Trump/RFK deregulatory angle:</strong> RFK Jr. as HHS Secretary + libertarian-leaning FDA under the new administration creates a potential pathway for accelerated psychedelic therapy approvals. Psilocybin and MDMA have legitimate Phase 2/3 data for treatment-resistant depression and PTSD. The FDA/DEA scheduling barrier is political as much as scientific — and that political wall is shifting.
</div>
<div class="smid-box" style="border-left-color:var(--text-dim);">
  <strong>Honest framing:</strong> This sector went through peak hype (2020–2021), crashed 70–90%, and is now in the trough of disillusionment. MDMA/PTSD was rejected by FDA in 2024 (Lykos — formerly MAPS). That reset the timeline but not the underlying science. The plays that survive will be ones with clean Phase 3 data, not platform stories. Currently: <strong style="color:var(--purple);">TROUGH → early climb</strong> on hype cycle.
</div>
<div style="overflow-x:auto;margin-bottom:20px;">
<table style="border-collapse:collapse;width:100%;min-width:700px;font-size:0.67rem;">
  <thead><tr style="background:#0a0a18;">
    <th style="padding:7px 10px;border:1px solid var(--border);color:var(--text-dim);font-size:0.58rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;text-align:left;">Ticker</th>
    <th style="padding:7px 10px;border:1px solid var(--border);color:var(--text-dim);font-size:0.58rem;text-align:left;">Name</th>
    <th style="padding:7px 10px;border:1px solid var(--border);color:var(--text-dim);font-size:0.58rem;text-align:left;">Compound</th>
    <th style="padding:7px 10px;border:1px solid var(--border);color:var(--text-dim);font-size:0.58rem;text-align:left;">Stage</th>
    <th style="padding:7px 10px;border:1px solid var(--border);color:var(--text-dim);font-size:0.58rem;text-align:left;">Primary Catalyst 2026</th>
    <th style="padding:7px 10px;border:1px solid var(--border);color:var(--text-dim);font-size:0.58rem;text-align:left;">Sizing</th>
  </tr></thead>
  <tbody>
    <tr>
      <td style="padding:8px 10px;border:1px solid var(--border);font-family:'Syne',sans-serif;font-weight:700;color:#fff;">CMPS</td>
      <td style="padding:8px 10px;border:1px solid var(--border);">COMPASS Pathways</td>
      <td style="padding:8px 10px;border:1px solid var(--border);color:var(--purple);">COMP360 (psilocybin)</td>
      <td style="padding:8px 10px;border:1px solid var(--border);">Phase 3 TRD</td>
      <td style="padding:8px 10px;border:1px solid var(--border);">Phase 3 COMP001 top-line data 2026–27. Largest psilocybin trial globally. Beat = 100%+.</td>
      <td style="padding:8px 10px;border:1px solid var(--border);color:var(--purple);font-weight:700;">0.5–0.75% — pre-data only</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid var(--border);font-family:'Syne',sans-serif;font-weight:700;color:#fff;">MNMD</td>
      <td style="padding:8px 10px;border:1px solid var(--border);">MindMed</td>
      <td style="padding:8px 10px;border:1px solid var(--border);color:var(--purple);">MM-120 (LSD derivative)</td>
      <td style="padding:8px 10px;border:1px solid var(--border);">Phase 3 GAD — Breakthrough Designation</td>
      <td style="padding:8px 10px;border:1px solid var(--border);">Phase 3 generalized anxiety disorder data 2026. <strong style="color:var(--green);">FDA Breakthrough = expedited review.</strong> Most advanced psychedelic in Phase 3.</td>
      <td style="padding:8px 10px;border:1px solid var(--border);color:var(--yellow);font-weight:700;">0.75–1% — highest conviction in sector</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid var(--border);font-family:'Syne',sans-serif;font-weight:700;color:#fff;">CYBN</td>
      <td style="padding:8px 10px;border:1px solid var(--border);">Cybin Inc</td>
      <td style="padding:8px 10px;border:1px solid var(--border);color:var(--purple);">CYB003 (deuterated psilocybin)</td>
      <td style="padding:8px 10px;border:1px solid var(--border);">Phase 3 MDD</td>
      <td style="padding:8px 10px;border:1px solid var(--border);">CYB003 Phase 3 MDD — shorter session time (proprietary formulation advantage). Data 2026–27.</td>
      <td style="padding:8px 10px;border:1px solid var(--border);color:var(--orange);font-weight:700;">0.5% — speculative, await Phase 2 confirmation</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid var(--border);font-family:'Syne',sans-serif;font-weight:700;color:#fff;">ATAI</td>
      <td style="padding:8px 10px;border:1px solid var(--border);">atai Life Sciences</td>
      <td style="padding:8px 10px;border:1px solid var(--border);color:var(--purple);">Platform (psilocybin, ibogaine, PCN-101)</td>
      <td style="padding:8px 10px;border:1px solid var(--border);">Multiple Ph2</td>
      <td style="padding:8px 10px;border:1px solid var(--border);">Diversified platform (Thiel-backed). ATAI-001 ibogaine for opioid use disorder — policy tailwind under RFK. Multiple Phase 2 catalysts.</td>
      <td style="padding:8px 10px;border:1px solid var(--border);color:var(--orange);font-weight:700;">0.5% — platform bet, cash watch</td>
    </tr>
  </tbody>
</table>
</div>
<div style="font-size:0.63rem;color:var(--text-dim);font-style:italic;margin-bottom:20px;line-height:1.6;">
  Key cross-read: MNMD MM-120 positive Phase 3 data → CMPS, CYBN, ATAI all spike 20–40% on field validation. The sector is small enough that one win re-rates everything. The MDMA/PTSD rejection in 2024 was a species-specific signal (MDMA toxicity concerns) — it does NOT invalidate psilocybin or LSD derivatives. Watch for separate regulatory pathways.
</div>

<div class="smid-section">🖥️ Emerging Sector: CPU Shortage / Semiconductor Bottleneck</div>
<div class="smid-box" style="border-left-color:var(--blue);">
  <strong style="color:var(--blue);">The structural shift:</strong> AI inference at scale requires CPUs as much as GPUs. The first wave was GPU-dominated (NVDA). The second wave — running trained models for billions of daily queries — demands high-core-count server CPUs, high-bandwidth memory, and custom silicon. AMD's EPYC is taking share from Intel in AI inference racks. The bottleneck is now shifting to: networking chips (Broadcom, Marvell), advanced packaging (AMAT, LRCX), and test equipment.
</div>
<div style="overflow-x:auto;margin-bottom:20px;">
<table style="border-collapse:collapse;width:100%;min-width:700px;font-size:0.67rem;">
  <thead><tr style="background:#0a0a18;">
    <th style="padding:7px 10px;border:1px solid var(--border);color:var(--text-dim);font-size:0.58rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;text-align:left;">Ticker</th>
    <th style="padding:7px 10px;border:1px solid var(--border);color:var(--text-dim);font-size:0.58rem;text-align:left;">Name</th>
    <th style="padding:7px 10px;border:1px solid var(--border);color:var(--text-dim);font-size:0.58rem;text-align:left;">CPU/Semi Angle</th>
    <th style="padding:7px 10px;border:1px solid var(--border);color:var(--text-dim);font-size:0.58rem;text-align:left;">Cap</th>
    <th style="padding:7px 10px;border:1px solid var(--border);color:var(--text-dim);font-size:0.58rem;text-align:left;">Primary Catalyst / Edge</th>
    <th style="padding:7px 10px;border:1px solid var(--border);color:var(--text-dim);font-size:0.58rem;text-align:left;">Sizing</th>
  </tr></thead>
  <tbody>
    <tr>
      <td style="padding:8px 10px;border:1px solid var(--border);font-family:'Syne',sans-serif;font-weight:700;color:#fff;">AMD</td>
      <td style="padding:8px 10px;border:1px solid var(--border);">Advanced Micro Devices</td>
      <td style="padding:8px 10px;border:1px solid var(--border);color:var(--blue);">EPYC server CPUs + MI300X AI accelerators</td>
      <td style="padding:8px 10px;border:1px solid var(--border);"><span style="background:rgba(96,165,250,0.1);color:var(--blue);padding:2px 6px;border-radius:3px;font-size:0.6rem;font-weight:700;">LARGE</span></td>
      <td style="padding:8px 10px;border:1px solid var(--border);">MI300X GPU/CPU hybrid taking inference share. EPYC in every new AI rack. Data center revenue guide is the catalyst each quarter. <span style="color:var(--green);">NVDA alternative with CPU synergy.</span></td>
      <td style="padding:8px 10px;border:1px solid var(--border);color:var(--blue);font-weight:700;">2–3% core position</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid var(--border);font-family:'Syne',sans-serif;font-weight:700;color:#fff;">AVGO</td>
      <td style="padding:8px 10px;border:1px solid var(--border);">Broadcom</td>
      <td style="padding:8px 10px;border:1px solid var(--border);color:var(--blue);">Custom AI ASICs + networking silicon</td>
      <td style="padding:8px 10px;border:1px solid var(--border);"><span style="background:rgba(96,165,250,0.1);color:var(--blue);padding:2px 6px;border-radius:3px;font-size:0.6rem;font-weight:700;">LARGE</span></td>
      <td style="padding:8px 10px;border:1px solid var(--border);">Google TPU, Meta MTIA custom chip partner. The networking bottleneck (Ethernet for AI clusters) is Broadcom's. AI revenue growing 4× faster than total revenue.</td>
      <td style="padding:8px 10px;border:1px solid var(--border);color:var(--blue);font-weight:700;">2% — large cap but genuinely undercovered angle</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid var(--border);font-family:'Syne',sans-serif;font-weight:700;color:#fff;">MRVL</td>
      <td style="padding:8px 10px;border:1px solid var(--border);">Marvell Technology</td>
      <td style="padding:8px 10px;border:1px solid var(--border);color:var(--blue);">Custom AI silicon + optical networking</td>
      <td style="padding:8px 10px;border:1px solid var(--border);"><span style="background:rgba(251,191,36,0.1);color:var(--yellow);padding:2px 6px;border-radius:3px;font-size:0.6rem;font-weight:700;">MID-LARGE</span></td>
      <td style="padding:8px 10px;border:1px solid var(--border);">AWS Trainium + Microsoft custom silicon partner. Data center % of revenue growing from 40% → 70%+. Quarterly DC revenue disclosure is the primary mover.</td>
      <td style="padding:8px 10px;border:1px solid var(--border);color:var(--yellow);font-weight:700;">1.5% — mid-cap AI silicon edge</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid var(--border);font-family:'Syne',sans-serif;font-weight:700;color:#fff;">COHU</td>
      <td style="padding:8px 10px;border:1px solid var(--border);">Cohu Inc</td>
      <td style="padding:8px 10px;border:1px solid var(--border);color:var(--teal);">Chip test equipment — AI chip testing</td>
      <td style="padding:8px 10px;border:1px solid var(--border);"><span style="background:rgba(45,212,191,0.1);color:var(--teal);padding:2px 6px;border-radius:3px;font-size:0.6rem;font-weight:700;">SMALL ~$800M</span></td>
      <td style="padding:8px 10px;border:1px solid var(--border);"><span style="color:var(--teal);">Pure SMID angle.</span> Tests advanced AI chips (GPUs, CPUs, custom ASICs). Semi test equipment follows capex with 12–18mo lag. Recovery from 2023–24 downcycle. Only 7 analysts.</td>
      <td style="padding:8px 10px;border:1px solid var(--border);color:var(--teal);font-weight:700;">1% — thin coverage alpha + cycle recovery</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid var(--border);font-family:'Syne',sans-serif;font-weight:700;color:#fff;">AEHR</td>
      <td style="padding:8px 10px;border:1px solid var(--border);">Aehr Test Systems</td>
      <td style="padding:8px 10px;border:1px solid var(--border);color:var(--teal);">Burn-in test for AI + SiC chips</td>
      <td style="padding:8px 10px;border:1px solid var(--border);"><span style="background:rgba(45,212,191,0.1);color:var(--teal);padding:2px 6px;border-radius:3px;font-size:0.6rem;font-weight:700;">SMALL ~$400M</span></td>
      <td style="padding:8px 10px;border:1px solid var(--border);">Burn-in testing for AI inference chips + SiC (EV). Order wins are the catalyst — lumpy, binary. Very thin coverage (4 analysts). High SI (12%+). Squeeze candidate on order wins.</td>
      <td style="padding:8px 10px;border:1px solid var(--border);color:var(--teal);font-weight:700;">0.5–0.75% — high volatility, squeeze candidate</td>
    </tr>
  </tbody>
</table>
</div>
<div style="font-size:0.63rem;color:var(--text-dim);font-style:italic;margin-bottom:8px;line-height:1.6;">
  The CPU shortage angle: AI inference requires high-core-count CPUs <em>alongside</em> GPUs. AMD EPYC is the beneficiary. But the truly uncrowded SMID play is the test equipment layer (COHU, AEHR) — every chip manufactured must be tested, test equipment demand lags production ramp by 12–18 months, and these names have coverage so thin that a single contract win is not in consensus.
</div>
</div><!-- end smid-edge -->

<!-- ─── PANEL 2: SMID METRICS ─── -->
<div class="smid-panel" id="smid-metrics">
  <div class="data-warn">
    <span>⚠️</span>
    <span>Metrics below are estimates based on analysis through early 2026. Short interest, insider transactions, and cash runway change continuously. Always verify current figures before trading. Short interest: FINRA/Nasdaq. Insiders: SEC Form 4. Cash: latest 10-Q.</span>
  </div>

  <div style="overflow-x:auto;">
  <table class="smid-metrics-table" id="smid-tbl">
    <thead>
      <tr>
        <th onclick="sortSmid(0)">Ticker</th>
        <th onclick="sortSmid(1)">Name</th>
        <th onclick="sortSmid(2)">Theme</th>
        <th onclick="sortSmid(3)">Float (approx)</th>
        <th onclick="sortSmid(4)">Short % Float</th>
        <th onclick="sortSmid(5)">Days-to-Cover</th>
        <th onclick="sortSmid(6)"># Analysts</th>
        <th onclick="sortSmid(7)">Cash Runway</th>
        <th onclick="sortSmid(8)">Insider Signal</th>
        <th onclick="sortSmid(9)">Avg Daily Vol</th>
        <th onclick="sortSmid(10)">Edge Type</th>
        <th onclick="sortSmid(11)" id="th-price" style="color:var(--blue);min-width:64px;">Price</th>
        <th onclick="sortSmid(12)" id="th-chg"   style="color:var(--blue);min-width:52px;">Chg %</th>
      </tr>
    </thead>
    <tbody id="smid-tbody">
      <tr data-ticker="NOG">
        <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:#fff;">NOG</span></td>
        <td>Northern Oil &amp; Gas</td>
        <td><span style="color:#fb923c">Energy</span></td>
        <td class="float-med">~$3.5B</td>
        <td class="si-low">4–6%</td><td>2–3d</td>
        <td class="cov-mod">8</td>
        <td class="runway-na">Profitable</td>
        <td class="insider-buy">CEO buying on dips</td>
        <td>$30M/d</td>
        <td>Variable div surprise + WTI beta</td>
      
        <td class="live-price" id="lp-NOG">—</td>
        <td class="live-chg"  id="lc-NOG">—</td>
      </tr>
      <tr data-ticker="CIVI">
        <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:#fff;">CIVI</span></td>
        <td>Civitas Resources</td>
        <td><span style="color:#fb923c">Energy</span></td>
        <td class="float-med">~$4B</td>
        <td class="si-med">5–8%</td><td>2–4d</td>
        <td class="cov-mod">14</td>
        <td class="runway-na">Profitable</td>
        <td class="insider-none">Neutral</td>
        <td>$80M/d</td>
        <td>Variable div + M&amp;A target + Permian story</td>
      
        <td class="live-price" id="lp-CIVI">—</td>
        <td class="live-chg"  id="lc-CIVI">—</td>
      </tr>
      <tr data-ticker="MTDR">
        <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:#fff;">MTDR</span></td>
        <td>Matador Resources</td>
        <td><span style="color:#fb923c">Energy</span></td>
        <td class="float-med">~$4.5B</td>
        <td class="si-med">5–9%</td><td>2–4d</td>
        <td class="cov-mod">16</td>
        <td class="runway-na">Profitable</td>
        <td class="insider-buy">Modest buys</td>
        <td>$80M/d</td>
        <td>Well productivity + midstream JV optionality</td>
      
        <td class="live-price" id="lp-MTDR">—</td>
        <td class="live-chg"  id="lc-MTDR">—</td>
      </tr>
      <tr data-ticker="KNTK">
        <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:#fff;">KNTK</span></td>
        <td>Kinetik Holdings</td>
        <td><span style="color:#fb923c">Energy</span></td>
        <td class="float-large">~$6B</td>
        <td class="si-low">2–4%</td><td>2–3d</td>
        <td class="cov-thin">10</td>
        <td class="runway-na">Profitable</td>
        <td class="insider-none">Neutral</td>
        <td>$25M/d</td>
        <td>Distribution yield + volume throughput</td>
      
        <td class="live-price" id="lp-KNTK">—</td>
        <td class="live-chg"  id="lc-KNTK">—</td>
      </tr>
      <tr data-ticker="POWL">
        <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:#fff;">POWL</span></td>
        <td>Powell Industries</td>
        <td><span style="color:#60a5fa">AI Infra</span></td>
        <td class="float-small">~$2B ⚡</td>
        <td class="si-med">6–10%</td><td>5–8d</td>
        <td class="cov-thin">3 ⭐</td>
        <td class="runway-na">Profitable, no debt</td>
        <td class="insider-buy">CEO consistent buyer</td>
        <td>$8M/d</td>
        <td>THIN COVERAGE + earnings squeeze + DC backlog mix</td>
      
        <td class="live-price" id="lp-POWL">—</td>
        <td class="live-chg"  id="lc-POWL">—</td>
      </tr>
      <tr data-ticker="AAON">
        <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:#fff;">AAON</span></td>
        <td>AAON Inc</td>
        <td><span style="color:#60a5fa">AI Infra</span></td>
        <td class="float-med">~$3.5B</td>
        <td class="si-low">3–6%</td><td>3–5d</td>
        <td class="cov-thin">7</td>
        <td class="runway-na">Profitable</td>
        <td class="insider-none">Founder selling (normal)</td>
        <td>$20M/d</td>
        <td>Gross margin quality + DC HVAC narrative</td>
      
        <td class="live-price" id="lp-AAON">—</td>
        <td class="live-chg"  id="lc-AAON">—</td>
      </tr>
      <tr data-ticker="BEAM">
        <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:#fff;">BEAM</span></td>
        <td>Beam Therapeutics</td>
        <td><span style="color:#c084fc">Bio-AI</span></td>
        <td class="float-small">~$1.5B ⚡</td>
        <td class="si-high">8–14% 🔴</td><td>6–10d</td>
        <td class="cov-mod">14</td>
        <td class="runway-ok">~24–30mo ⚠️</td>
        <td class="insider-none">Net neutral</td>
        <td>$30M/d</td>
        <td>BEAM-101 binary 2026 + squeeze fuel</td>
      
        <td class="live-price" id="lp-BEAM">—</td>
        <td class="live-chg"  id="lc-BEAM">—</td>
      </tr>
      <tr data-ticker="NTLA">
        <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:#fff;">NTLA</span></td>
        <td>Intellia Therapeutics</td>
        <td><span style="color:#c084fc">Bio-AI</span></td>
        <td class="float-small">~$2B ⚡</td>
        <td class="si-high">7–12% 🔴</td><td>5–8d</td>
        <td class="cov-mod">17</td>
        <td class="runway-ok">~24–30mo ⚠️</td>
        <td class="insider-none">Net neutral</td>
        <td>$45M/d</td>
        <td>FIRST in-vivo CRISPR Ph3 — world-first catalyst</td>
      
        <td class="live-price" id="lp-NTLA">—</td>
        <td class="live-chg"  id="lc-NTLA">—</td>
      </tr>
      <tr data-ticker="ARVN">
        <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:#fff;">ARVN</span></td>
        <td>Arvinas Inc</td>
        <td><span style="color:#c084fc">Bio-AI</span></td>
        <td class="float-small">~$1.5B ⚡</td>
        <td class="si-high">9–15% 🔴</td><td>6–10d</td>
        <td class="cov-mod">16</td>
        <td class="runway-ok">~24mo ⚠️</td>
        <td class="insider-buy">Pfizer owns 10% (floor)</td>
        <td>$35M/d</td>
        <td>Pivotal Ph3 PROTAC + Pfizer floor</td>
      
        <td class="live-price" id="lp-ARVN">—</td>
        <td class="live-chg"  id="lc-ARVN">—</td>
      </tr>
      <tr data-ticker="KYMR">
        <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:#fff;">KYMR</span></td>
        <td>Kymera Therapeutics</td>
        <td><span style="color:#c084fc">Bio-AI</span></td>
        <td class="float-small">~$1.2B ⚡</td>
        <td class="si-high">9–15% 🔴</td><td>7–10d</td>
        <td class="cov-mod">12</td>
        <td class="runway-ok">~18–24mo ⚠️</td>
        <td class="insider-none">Net neutral</td>
        <td>$15M/d</td>
        <td>First non-oncology PROTAC Ph2 + ARVN read</td>
      
        <td class="live-price" id="lp-KYMR">—</td>
        <td class="live-chg"  id="lc-KYMR">—</td>
      </tr>
      <tr data-ticker="NXE">
        <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:#fff;">NXE</span></td>
        <td>NexGen Energy</td>
        <td><span style="color:#fbbf24">Uranium</span></td>
        <td class="float-large">~$3.5B</td>
        <td class="si-low">3–5%</td><td>2–3d</td>
        <td class="cov-thin">9</td>
        <td class="runway-ok">$400M+ cash</td>
        <td class="insider-buy">Management buying</td>
        <td>$15M/d</td>
        <td>EA milestone + uranium spot leverage</td>
      
        <td class="live-price" id="lp-NXE">—</td>
        <td class="live-chg"  id="lc-NXE">—</td>
      </tr>
      <tr data-ticker="UUUU">
        <td><span style="font-family:'Syne',sans-serif;font-weight:700;color:#fff;">UUUU</span></td>
        <td>Energy Fuels Inc</td>
        <td><span style="color:#fbbf24">Uranium</span></td>
        <td class="float-small">~$800M ⚡</td>
        <td class="si-low">4–7%</td><td>3–5d</td>
        <td class="cov-thin">6 ⭐</td>
        <td class="runway-ok">$200M+ cash</td>
        <td class="insider-buy">Management buys</td>
        <td>$10M/d</td>
        <td>US domestic only uranium + REE optionality</td>
      
        <td class="live-price" id="lp-UUUU">—</td>
        <td class="live-chg"  id="lc-UUUU">—</td>
      </tr>
    </tbody>
  </table>
  </div>

  <div style="margin-top:14px;">
    <div style="font-size:0.62rem;color:var(--text-dim);line-height:1.7;">
      <strong style="color:var(--teal)">⭐ Thin coverage (≤7 analysts)</strong> = widest estimates = biggest move on beat/miss = most alpha.<br>
      <strong style="color:var(--red)">🔴 Short % >8%</strong> = squeeze fuel on positive catalyst — extends the initial move.<br>
      <strong style="color:var(--yellow)">⚠️ Runway &lt;30mo</strong> = equity raise risk building. Track quarterly burn in 10-Q.
    </div>
  </div>
</div><!-- end smid-metrics -->

<!-- ─── PANEL 3: PRICE MOVERS ─── -->
<div class="smid-panel" id="smid-movers">
  <div class="smid-box">
    <strong>How to read these cards:</strong> Click any card to expand. Drivers are ranked 1 (primary — drives 60-80% of moves) → 3+ (secondary). Move estimates are typical single-event ranges based on historical comparable events. The "Next Catalyst" shows the specific event to position around.
  </div>
  <div class="data-warn">
    <span>⚠️</span><span>Move estimates are illustrative based on historical patterns through early 2026. Actual moves depend on market conditions, current positioning, and event specifics. Always verify catalyst timing against latest company guidance.</span>
  </div>

  <div id="mover-cards-container"></div>
</div><!-- end smid-movers -->

<!-- ─── PANEL 4: CATALYST CALENDAR ─── -->
<div class="smid-panel" id="smid-calendar">
  
  <!-- ── CATALYST TIMELINE ─────────────────────────── -->
  <div class="cat-tl-wrap">
    <div class="cat-tl-hd">📅 Binary Catalyst Calendar — Next 90 Days</div>
    <canvas id="catalystTimeline" height="170"></canvas>
  </div>

  <div class="smid-box blue">
    <strong>Catalyst precision is everything in SMID.</strong> On large caps, the market is forward-looking 12 months. On small caps, the market is often backward-looking until 2–4 weeks before a known catalyst. That's the window.
  </div>
  <table class="catalyst-cal">
    <thead>
      <tr>
        <th>Timing</th><th>Ticker</th><th>Event</th><th>Type</th>
        <th>Bull Outcome (+range)</th><th>Bear Outcome (−range)</th><th>Strategy</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="timing-badge t-now">NOW</span></td>
        <td><strong>UUUU</strong></td>
        <td>Weekly uranium spot price (UxC/TradeTech publish Mondays)</td>
        <td><span class="cat-type-macro">MACRO</span></td>
        <td class="outcome-bull">&gt;$75/lb sustained → +10–15%/week trend</td>
        <td class="outcome-bear">&lt;$65/lb → sector de-rate −10–15%</td>
        <td>Track weekly. Don't trade every move. Use spot trend to size position.</td>
      </tr>
      <tr>
        <td><span class="timing-badge t-now">ONGOING</span></td>
        <td><strong>NOG / CIVI / MTDR</strong></td>
        <td>WTI oil price daily — direct beta driver</td>
        <td><span class="cat-type-macro">MACRO</span></td>
        <td class="outcome-bull">WTI &gt;$80 sustained → variable dividends at maximum</td>
        <td class="outcome-bear">WTI &lt;$65 for 3+ weeks → dividend risk, leverage concern</td>
        <td>Set WTI price alerts. Below $65 = risk trigger. Above $80 = full size.</td>
      </tr>
      <tr>
        <td><span class="timing-badge t-q1">Q2 2026</span></td>
        <td><strong>NOG</strong></td>
        <td>Q1 2026 Earnings + Variable Dividend Declaration</td>
        <td><span class="cat-type-earn">EARNINGS</span></td>
        <td class="outcome-bull">WTI &gt;$75 → $0.45–0.55/sh variable → stock +5–10%</td>
        <td class="outcome-bear">WTI &lt;$65 → reduced div → −10–15%</td>
        <td>Pre-position if WTI &gt;$70 for 3+ weeks pre-earnings.</td>
      </tr>
      <tr>
        <td><span class="timing-badge t-q1">Q2 2026</span></td>
        <td><strong>POWL</strong></td>
        <td>Q2 FY2026 Earnings — Backlog + Gross Margin</td>
        <td><span class="cat-type-earn">EARNINGS ⚡</span></td>
        <td class="outcome-bull">Backlog &gt;$850M + DC mix commentary → +20–30%</td>
        <td class="outcome-bear">Margin miss (&lt;23%) + order softness → −15–20%</td>
        <td>POWL is the high-conviction earnings trade. Hold through; the move IS the earnings. 1.5–2% position max.</td>
      </tr>
      <tr>
        <td><span class="timing-badge t-q1">Q2 2026</span></td>
        <td><strong>AAON</strong></td>
        <td>Q1 2026 Earnings — Gross Margin Trajectory</td>
        <td><span class="cat-type-earn">EARNINGS</span></td>
        <td class="outcome-bull">GM &gt;30% + DC HVAC commentary → +10–15%</td>
        <td class="outcome-bear">GM compression &lt;27% → −12–18%</td>
        <td>Buy pre-earnings if prior quarter GM trend was stable. Sell half on big beat.</td>
      </tr>
      <tr>
        <td><span class="timing-badge t-q1">H1 2026</span></td>
        <td><strong>BEAM</strong></td>
        <td>BEAM-101 Phase 1/2 Updated Data (Sickle Cell / β-Thal)</td>
        <td><span class="cat-type-data">CLINICAL ⭐</span></td>
        <td class="outcome-bull">12mo durability &gt;90% HbF, no off-targets → $30–40</td>
        <td class="outcome-bear">Efficacy fade or SAE → $8–12</td>
        <td>Pre-position 4–6 weeks before known conference window. 1% max. Define −35% exit before entry.</td>
      </tr>
      <tr>
        <td><span class="timing-badge t-q1">ASCO June 2026</span></td>
        <td><strong>ARVN</strong></td>
        <td>Vepdegestrant Phase 3 Interim / Updated Phase 2 at ASCO</td>
        <td><span class="cat-type-data">CLINICAL ⭐</span></td>
        <td class="outcome-bull">PFS benefit signal → Ph3 narrative intact → $30–40</td>
        <td class="outcome-bear">No benefit, toxicity → $8–12</td>
        <td>ASCO is conference-driven. Watch abstract release ~2 weeks before (pre-announcement leak effect).</td>
      </tr>
      <tr>
        <td><span class="timing-badge t-q2">Q3 2026</span></td>
        <td><strong>CIVI</strong></td>
        <td>Q2 2026 Earnings + Variable Dividend + Permian Update</td>
        <td><span class="cat-type-earn">EARNINGS</span></td>
        <td class="outcome-bull">Permian well results beat, WTI &gt;$75 → max div → $85–95</td>
        <td class="outcome-bear">Permian disappoints, oil weak → div cut concern → $55–60</td>
        <td>This is where the Permian acquisition thesis gets proved or denied. High information quarter.</td>
      </tr>
      <tr>
        <td><span class="timing-badge t-q2">Q3 2026</span></td>
        <td><strong>MTDR</strong></td>
        <td>Q2 2026 Well Results — Delaware Basin Productivity</td>
        <td><span class="cat-type-earn">EARNINGS</span></td>
        <td class="outcome-bull">IP-30 &gt;1,200 BOE/d avg → +12–20%</td>
        <td class="outcome-bear">Well underperformance → −15–20%</td>
        <td>Small position pre-earnings only. Size up after confirmation of well quality.</td>
      </tr>
      <tr>
        <td><span class="timing-badge t-q2">Q3 2026</span></td>
        <td><strong>KYMR</strong></td>
        <td>KT-621 Phase 2 Atopic Dermatitis Readout</td>
        <td><span class="cat-type-data">CLINICAL ⭐</span></td>
        <td class="outcome-bull">DLQI improvement + clean safety → PROTAC in immunology proven → $25–30</td>
        <td class="outcome-bear">No efficacy → $5–8</td>
        <td>Buy only if ARVN PROTAC data is already positive (platform de-risked). Otherwise wait for KYMR data. 0.5% max.</td>
      </tr>
      <tr>
        <td><span class="timing-badge t-q3">H2 2026</span></td>
        <td><strong>NTLA</strong></td>
        <td>NTLA-2001 Phase 3 TTR Interim Analysis</td>
        <td><span class="cat-type-data">CLINICAL ⭐⭐</span></td>
        <td class="outcome-bull">First in-vivo CRISPR Ph3 efficacy → sector-defining → $40–55</td>
        <td class="outcome-bear">Safety event → platform uncertainty → $8–15</td>
        <td>The most asymmetric catalyst in the SMID universe. 0.75–1% pre-position 8 weeks before interim. The field re-rates on this one.</td>
      </tr>
      <tr>
        <td><span class="timing-badge t-q3">H2 2026</span></td>
        <td><strong>POWL</strong></td>
        <td>Q3 FY2026 Earnings + Annual Guidance (Nov 2026)</td>
        <td><span class="cat-type-earn">EARNINGS ⚡</span></td>
        <td class="outcome-bull">FY2027 guide with explicit DC backlog → analyst upgrades → +20–30%</td>
        <td class="outcome-bear">Order slowdown, margin guide down → −15–20%</td>
        <td>Second POWL earnings chance. If Q2 missed, wait for this one. If Q2 beat, hold and add.</td>
      </tr>
      <tr>
        <td><span class="timing-badge t-watch">WATCH</span></td>
        <td><strong>NXE</strong></td>
        <td>Arrow Project Environmental Assessment — Key Milestone</td>
        <td><span class="cat-type-reg">REGULATORY</span></td>
        <td class="outcome-bull">Draft EA approval → production timeline visible → $8–12</td>
        <td class="outcome-bear">Further delays → 2-year discount → $4–5</td>
        <td>Set a news alert for "NexGen Environmental Assessment" and "Joint Review Panel". Buy on the milestone, not the hope.</td>
      </tr>
      <tr>
        <td><span class="timing-badge t-watch">WATCH</span></td>
        <td><strong>UUUU</strong></td>
        <td>White Mesa REE Separation — Commercial Scale Milestone</td>
        <td><span class="cat-type-reg">MILESTONE</span></td>
        <td class="outcome-bull">Commercial RE separation confirmed → critical minerals premium → $6–9</td>
        <td class="outcome-bear">Delays, technical setbacks → uranium-only story → $3–4</td>
        <td>The REE angle is UUUU's differentiation. This is the catalyst the market isn't pricing properly.</td>
      </tr>
      <tr>
        <td><span class="timing-badge t-watch">WATCH</span></td>
        <td><strong>NOG / CIVI</strong></td>
        <td>M&A Consolidation — Takeout Bid</td>
        <td><span class="cat-type-ma">M&amp;A</span></td>
        <td class="outcome-bull">COP, XOM, CVX bid at 25–40% premium → +25–40% on announcement day</td>
        <td class="outcome-bear">Deal falls through → revert to pre-rumor</td>
        <td>Can't predict but can prepare. NOG non-op model is uniquely acquirable. CIVI DJ+Permian is an ideal bolt-on. Know your exit if it happens.</td>
      </tr>
    </tbody>
  </table>
</div><!-- end smid-calendar -->

<!-- ─── PANEL 5: CROSS-READ MAP ─── -->
<div class="smid-panel" id="smid-crossread">
  <div class="smid-box">
    <strong>Cross-reads are how you double-dip on SMID alpha.</strong> When BEAM has a positive data readout, NTLA also moves +15–25% because the market re-rates the entire CRISPR field. You can hold NTLA as a "free option" on BEAM's data. Same for PROTAC (ARVN → KYMR), uranium (spot → NXE + UUUU), and AI Infra (VRT → POWL + AAON).
  </div>
  <div id="xread-container"></div>
</div><!-- end smid-crossread -->

<!-- ─── PANEL 6: ENTRY PLAYBOOK ─── -->
<div class="smid-panel" id="smid-playbook">
  <div class="smid-box green">
    <strong>The key question for every SMID position:</strong> "Is this a pre-catalyst pre-position, a post-data confirmation play, or should I not be in at all?" The answer determines sizing, timing, and exit logic.
  </div>

  <div class="smid-section">📖 Entry Strategy by Catalyst Type</div>
  <div class="playbook-grid">
    <div class="play-card">
      <div class="play-title" style="color:var(--yellow)">⚡ Earnings Beat Play</div>
      <div class="play-when">When: POWL, AAON, NOG, CIVI, MTDR, KNTK</div>
      <div class="play-rule">Enter 1–3 weeks before earnings (before institutional attention builds)</div>
      <div class="play-rule">Size: 1.5–3% for profitable SMID names</div>
      <div class="play-rule">Use options if available — buy calls 6–8 weeks out at ATM; theta is manageable</div>
      <div class="play-rule">After a big beat: sell half position day +1, let the other half run with a trailing stop</div>
      <div class="play-rule">After a miss: decide within 48 hours — don't hold hoping for a bounce on the same thesis</div>
      <div class="play-example">Example: POWL pre-earnings, 2% position, sell half on +20% day-1 beat, trail stop on rest</div>
    </div>
    <div class="play-card">
      <div class="play-title" style="color:var(--red)">🧬 Binary Clinical Data</div>
      <div class="play-when">When: BEAM-101, NTLA-2001, ARVN vepdegestrant, KYMR KT-621</div>
      <div class="play-rule">PRE-POSITION: Enter 4–6 weeks before known conference/readout window</div>
      <div class="play-rule">Size: 0.5–1% MAX. This is non-negotiable. The distribution is binary.</div>
      <div class="play-rule">DEFINE your stop BEFORE entering. −35% from entry = exit. No exceptions.</div>
      <div class="play-rule">NEVER add to a losing clinical position. If it's down −20%, the market is telling you something.</div>
      <div class="play-rule">On a positive read: sell 30–40% into the initial spike. Run the rest for the reaction period (2–4 weeks).</div>
      <div class="play-rule">CROSS-READ: If BEAM data is positive, immediately consider adding NTLA before the sympathy move extends</div>
      <div class="play-example">Example: 0.75% NTLA pre-NTLA-2001 interim. Stop at −35%. Sell 40% on the spike day.</div>
    </div>
    <div class="play-card">
      <div class="play-title" style="color:var(--blue)">🛢 Commodity Leverage</div>
      <div class="play-when">When: NOG, CIVI, MTDR (WTI) | NXE, UUUU (Uranium spot)</div>
      <div class="play-rule">Build the position when spot is below a key level ($70 WTI, $72/lb uranium)</div>
      <div class="play-rule">The stock lags the commodity by days to weeks — use that lag to enter</div>
      <div class="play-rule">Size: 1–2%. You already have oil/uranium beta via large caps (XOM, CCJ) — don't double up recklessly</div>
      <div class="play-rule">Use the "variable dividend declared" event as the actual catalyst — not just the commodity price</div>
      <div class="play-rule">Stop at commodity trend break: WTI below $65 for 3 weeks = exit SMID E&P</div>
      <div class="play-example">Example: Build CIVI at $65–70 with WTI above $70. Sell half on variable div announcement beat.</div>
    </div>
    <div class="play-card">
      <div class="play-title" style="color:var(--teal)">🔬 Thin Coverage Alpha</div>
      <div class="play-when">When: POWL (3 analysts), UUUU (6 analysts), KNTK (10)</div>
      <div class="play-rule">Read the 10-K and last 2 earnings call transcripts. With 3 analysts, this is enough to develop a differentiated view.</div>
      <div class="play-rule">Identify the 1–2 metrics the company manages to but doesn't highlight in the headline number</div>
      <div class="play-rule">For POWL: track DC backlog mix % (not disclosed but hinted in commentary)</div>
      <div class="play-rule">Watch for analyst initiation signals (SEC filings, conference appearances by new buy-side)</div>
      <div class="play-rule">When a new analyst initiates Buy: the stock moves day-1 AND attracts 2–3 more analysts to look. The coverage build is a catalyst.</div>
      <div class="play-example">Example: Own POWL before first major bank initiates. Thesis: DC backlog underpriced in 3-analyst consensus.</div>
    </div>
    <div class="play-card">
      <div class="play-title" style="color:var(--purple)">🤝 Platform Validation Play</div>
      <div class="play-when">When: NTLA data validates BEAM | ARVN validates KYMR | NXE EA validates UUUU</div>
      <div class="play-rule">Identify the "second mover" — the stock that benefits from someone else's catalyst without taking the direct clinical risk</div>
      <div class="play-rule">Size the second mover at 50% of what you'd size the primary catalyst play</div>
      <div class="play-rule">The sympathy move is typically 30–50% of the primary mover's move and comes 1–3 hours later</div>
      <div class="play-rule">For platform reads (PROTAC: ARVN→KYMR): hold the second mover for 2–4 weeks post-catalyst (the narrative takes time to build)</div>
      <div class="play-example">Example: Long BEAM (1%) + NTLA (0.5%) into BEAM-101 data. If BEAM beats, NTLA moves +15–25% on field re-rate.</div>
    </div>
    <div class="play-card">
      <div class="play-title" style="color:var(--orange)">🚨 Short Squeeze Setup</div>
      <div class="play-when">When: Short % &gt;8% + positive catalyst incoming + thin daily volume</div>
      <div class="play-rule">BEAM (8–14% SI), ARVN (9–15%), KYMR (9–15%), NTLA (7–12%) are all squeeze candidates on positive data</div>
      <div class="play-rule">The squeeze EXTENDS the initial move. A 30% up day becomes 50–80% if shorts are trapped and days-to-cover is 7+</div>
      <div class="play-rule">Don't buy BECAUSE of the short interest alone — you need the catalyst. Short interest is fuel, not fire.</div>
      <div class="play-rule">After a big move up into heavy short interest: sell into strength on day 2–3, not day 1. Shorts cover in waves.</div>
      <div class="play-example">Example: KYMR with 12% SI + KT-621 positive data → initial +40% + squeeze extension to +70% over 3 days.</div>
    </div>
  </div>

  <div class="smid-section">🧠 SMID Behavioral Rules</div>
  <div class="edge-grid">
    <div class="edge-card">
      <div class="edge-title">What Kills SMID Returns</div>
      <div class="edge-row"><span class="edge-icon">❌</span><div class="edge-text"><strong>Oversizing speculative names</strong> — 1 position at 5% that goes to zero wipes out 5 successful 1% positions that doubled. The math is brutal.</div></div>
      <div class="edge-row"><span class="edge-icon">❌</span><div class="edge-text"><strong>Adding to clinical losers</strong> — "averaging down" into a biotech after −30% pre-data almost always ends in −70% total. The market is pricing information you don't have.</div></div>
      <div class="edge-row"><span class="edge-icon">❌</span><div class="edge-text"><strong>Holding through a cash raise</strong> — If a SMID name you own announces an equity offering at a discount, sell the day of the announcement. Don't wait.</div></div>
      <div class="edge-row"><span class="edge-icon">❌</span><div class="edge-text"><strong>Buying the spike on news you missed</strong> — Chasing POWL after it's already up 20% on earnings eliminates your risk-reward. Better to miss it and wait for the next quarter.</div></div>
    </div>
    <div class="edge-card">
      <div class="edge-title">What Builds SMID Returns</div>
      <div class="edge-row"><span class="edge-icon">✓</span><div class="edge-text"><strong>Patience before the catalyst</strong> — The edge is in being early, not being right in real-time. Build the position quietly 4–8 weeks before the catalyst window.</div></div>
      <div class="edge-row"><span class="edge-icon">✓</span><div class="edge-text"><strong>Selling into strength</strong> — On a big beat or positive data: sell 30–50% into the move. Protect the gain. Let the rest run with a raised stop.</div></div>
      <div class="edge-row"><span class="edge-icon">✓</span><div class="edge-text"><strong>The cross-read basket</strong> — Own the second mover at half size of the primary. BEAM + NTLA. ARVN + KYMR. NXE + UUUU. The basket multiplies one catalyst's value.</div></div>
      <div class="edge-row"><span class="edge-icon">✓</span><div class="edge-text"><strong>Reading primary sources</strong> — With 3–8 analysts, your own 10-K read and earnings call transcript analysis can develop a genuinely differentiated view. This is the actual edge.</div></div>
    </div>
  </div>
</div><!-- end smid-playbook -->

</div><!-- end smid-wrap -->`;

export default function SmidAlpha({ isActive, quotes }) {
  const radarRef = useRef(null);
  const catRef   = useRef(null);
  const hlRef    = useRef(-1);
  const wrapRef  = useRef(null);

  useEffect(() => {
    if (!isActive) return;
    const timer = setTimeout(() => {
      if (radarRef.current) drawRadarOnCanvas(radarRef.current, hlRef.current);
      if (catRef.current)   drawCatTimeline(catRef.current);
    }, 50);
    return () => clearTimeout(timer);
  }, [isActive]);

  // Replace canvas elements after dangerouslySetInnerHTML renders
  useEffect(() => {
    if (!wrapRef.current) return;
    // Wire canvas refs to the DOM elements
    const rc = wrapRef.current.querySelector('#radarChart');
    const cc = wrapRef.current.querySelector('#catalystTimeline');
    if (rc && rc !== radarRef.current) radarRef.current = rc;
    if (cc && cc !== catRef.current)   catRef.current = cc;
    if (isActive) {
      drawRadarOnCanvas(radarRef.current, hlRef.current);
      drawCatTimeline(catRef.current);
    }
  }, [isActive]);

  return (
    <div
      className={`tab-panel${isActive ? ' active' : ''}`}
      id="tab-smid"
      ref={wrapRef}
      dangerouslySetInnerHTML={{ __html: STATIC_CONTENT }}
    />
  );
}
