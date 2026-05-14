/**
 * chartUtils.js — canvas drawing functions
 * These are extracted from the original monolithic index.html and
 * called from React components via useEffect + useRef.
 *
 * All functions operate on a canvas DOM element passed as argument
 * (or use getElementById as fallback for legacy compatibility).
 */

// ─── Radar data (used by drawRadar) ─────────────────────────────────────────
import { RADAR_DATA, RADAR_AXES, RADAR_AXIS_COLORS, CAT_EVENTS } from '../data/radarData.js';
import { CORR_SECTOR_MAP, CORR_FACTOR_BASE } from '../data/corrData.js';

export let radarHL = -1;
export function setRadarHL(v) { radarHL = v; }

function drawRadar() {
  const cv = document.getElementById('radarChart');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const cx = W * 0.47, cy = H * 0.5;
  const R  = Math.min(W, H) * 0.33;
  const N  = RADAR_AXES.length;
  const MAX = 3;
  ctx.clearRect(0, 0, W, H);

  // BG
  ctx.fillStyle = '#0f0f1a';
  ctx.fillRect(0, 0, W, H);

  // Precompute angles (top = axis 0)
  const angles = Array.from({length:N}, (_,i) => (i*2*Math.PI/N) - Math.PI/2);

  // Grid rings
  for (let lv = 1; lv <= MAX; lv++) {
    const r = R * lv / MAX;
    ctx.beginPath();
    angles.forEach((a,i) => {
      const px = cx + r*Math.cos(a), py = cy + r*Math.sin(a);
      i === 0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
    });
    ctx.closePath();
    ctx.strokeStyle = lv === MAX ? '#252538' : '#1a1a2e';
    ctx.lineWidth   = lv === MAX ? 1.5 : 1;
    ctx.setLineDash([]);
    ctx.stroke();
  }

  // Axis lines + labels
  angles.forEach((a, i) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R*Math.cos(a), cy + R*Math.sin(a));
    ctx.strokeStyle = '#252538'; ctx.lineWidth = 1;
    ctx.setLineDash([3,4]); ctx.stroke(); ctx.setLineDash([]);
    const lx = cx + (R+26)*Math.cos(a);
    const ly = cy + (R+26)*Math.sin(a);
    ctx.fillStyle = RADAR_AXIS_COLORS[i];
    ctx.font = 'bold 10px Syne, sans-serif';
    ctx.textAlign    = lx < cx-4 ? 'right' : lx > cx+4 ? 'left' : 'center';
    ctx.textBaseline = ly < cy-4 ? 'bottom' : ly > cy+4 ? 'top'  : 'middle';
    ctx.fillText(RADAR_AXES[i], lx, ly);
  });

  // Plot sectors
  RADAR_DATA.forEach((s, idx) => {
    const hl     = radarHL === -1 || radarHL === idx;
    const alpha  = radarHL === -1 ? 0.55 : (radarHL === idx ? 0.9 : 0.1);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    s.scores.forEach((sc, i) => {
      const r = R * sc / MAX;
      const px = cx + r*Math.cos(angles[i]);
      const py = cy + r*Math.sin(angles[i]);
      i === 0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
    });
    ctx.closePath();
    // Fill
    ctx.globalAlpha = alpha * 0.28;
    ctx.fillStyle = s.color; ctx.fill();
    // Stroke
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = radarHL === idx ? 2.5 : 1.5;
    ctx.stroke();
    // Vertex dots
    s.scores.forEach((sc, i) => {
      const r = R * sc / MAX;
      ctx.beginPath();
      ctx.arc(cx+r*Math.cos(angles[i]), cy+r*Math.sin(angles[i]), radarHL===idx?4:2.5, 0, Math.PI*2);
      ctx.fillStyle = s.color; ctx.fill();
    });
    ctx.globalAlpha = 1;
  });

  // Center
  ctx.beginPath(); ctx.arc(cx,cy,3,0,Math.PI*2);
  ctx.fillStyle='#252538'; ctx.fill();
}

function buildRadarLegend() {
  const el = document.getElementById('radarLegend');
  if (!el) return;
  el.innerHTML = RADAR_DATA.map((s,i) => `
    <div class="rl-item"
         onmouseenter="radarHL=${i};drawRadar();"
         onmouseleave="radarHL=-1;drawRadar();">
      <div class="rl-dot" style="background:${s.color}"></div>
      <div class="rl-name">${s.name}</div>
      <div class="rl-verdict" style="color:${s.color}">${s.verdict}</div>
    </div>`).join('');
}

function drawCatalystTimeline() {
  const cv = document.getElementById('catalystTimeline');
  if (!cv) return;
  const W = cv.parentElement ? cv.parentElement.offsetWidth - 2 : 900;
  cv.width  = W;
  const H   = cv.height;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0f0f1a';
  ctx.fillRect(0, 0, W, H);

  const PL = 44, PR = 18, TW = W - PL - PR;
  const MAX_WK = 16, Y = H * 0.52;

  // Week grid
  for (let w = 0; w <= MAX_WK; w += 2) {
    const x = PL + (w / MAX_WK) * TW;
    ctx.beginPath(); ctx.moveTo(x, 18); ctx.lineTo(x, H-16);
    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#2a2a40'; ctx.font = '9px DM Sans';
    ctx.textAlign = 'center';
    ctx.fillText('W'+w, x, H-4);
  }

  // Axis line
  ctx.beginPath(); ctx.moveTo(PL, Y); ctx.lineTo(PL+TW, Y);
  ctx.strokeStyle = '#2a2a45'; ctx.lineWidth = 2; ctx.stroke();

  // NOW marker
  ctx.beginPath(); ctx.arc(PL, Y, 5, 0, Math.PI*2);
  ctx.fillStyle = '#fbbf24'; ctx.fill();
  ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 9px Syne';
  ctx.textAlign = 'center'; ctx.fillText('NOW', PL, Y-16);

  // Events
  CAT_EVENTS.forEach((ev, i) => {
    const x     = PL + (ev.wk / MAX_WK) * TW;
    const above = i % 2 === 0;
    const yTip  = above ? Y - 12 : Y + 12;
    const yLbl  = above ? Y - 58 : Y + 56;

    // Connector line
    ctx.beginPath(); ctx.moveTo(x, Y); ctx.lineTo(x, yLbl);
    ctx.strokeStyle = ev.col; ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;

    // Pulse ring on axis
    ctx.beginPath(); ctx.arc(x, Y, 9, 0, Math.PI*2);
    ctx.fillStyle = ev.col; ctx.globalAlpha = 0.15; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = ev.col; ctx.lineWidth = 2; ctx.stroke();

    // Ticker label
    ctx.fillStyle = ev.col;
    ctx.font = 'bold 10px Syne, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ev.t, x, above ? yLbl - 10 : yLbl + 20);

    // Event name (split across two lines if needed)
    ctx.fillStyle = '#7070a0'; ctx.font = '8.5px DM Sans';
    const words = ev.ev.split(' ');
    const mid   = Math.ceil(words.length / 2);
    ctx.fillText(words.slice(0, mid).join(' '), x, above ? yLbl+2  : yLbl+6);
    ctx.fillText(words.slice(mid).join(' '),    x, above ? yLbl+12 : yLbl+16);

    // Week tag
    ctx.fillStyle = '#33334a'; ctx.font = '8px DM Sans';
    ctx.fillText('W'+ev.wk, x, above ? Y+18 : Y-12);
  });
}

function getCorrEstimate(s1, s2) {
  if (s1 === s2) return 1.0;
  const f1 = (CORR_SECTOR_MAP[s1]||{}).factor || s1;
  const f2 = (CORR_SECTOR_MAP[s2]||{}).factor || s2;
  if (f1 === f2) return 0.78; // same factor, different ticker
  const k1 = f1+'_'+f2, k2 = f2+'_'+f1;
  return CORR_FACTOR_BASE[k1] || CORR_FACTOR_BASE[k2] || 0.15;
}

function drawCorrHeatmap() {
  const cv = document.getElementById('corrCanvas');
  if (!cv || !corrTickers.length) return;
  const N    = corrTickers.length;
  const SIZE = Math.min(Math.floor((cv.parentElement.offsetWidth - 28) / N), 52);
  const LBL  = 46;
  const W    = LBL + N*SIZE;
  const H    = LBL + N*SIZE;
  cv.width = W; cv.height = H;
  const ctx  = cv.getContext('2d');
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#0a0a18'; ctx.fillRect(0,0,W,H);

  function corrColor(v) {
    // Blue (negative) → dark (zero) → Red (positive)
    if (v >= 0) {
      const t = v;
      const r = Math.round(26 + t*(239-26));
      const g = Math.round(26 + t*(68-26));
      const b = Math.round(26 + t*(68-26));
      return `rgb(${r},${g},${b})`;
    } else {
      const t = -v;
      const r = Math.round(26 + t*(59-26));
      const g = Math.round(26 + t*(130-26));
      const b = Math.round(26 + t*(246-26));
      return `rgb(${r},${g},${b})`;
    }
  }

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const v   = getCorrEstimate(corrTickers[i].s, corrTickers[j].s);
      const x   = LBL + j*SIZE;
      const y   = LBL + i*SIZE;
      ctx.fillStyle = corrColor(v);
      ctx.fillRect(x+1, y+1, SIZE-2, SIZE-2);
      // Value text
      ctx.fillStyle = Math.abs(v) > 0.5 ? '#fff' : '#8888aa';
      ctx.font = `${Math.min(10, SIZE*0.22)}px DM Sans`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(i===j ? '1.0' : v.toFixed(2), x+SIZE/2, y+SIZE/2);
    }
  }

  // Row/col labels
  ctx.font = 'bold 10px Syne, sans-serif';
  corrTickers.forEach((tk, i) => {
    const col = (CORR_SECTOR_MAP[tk.s]||{}).color || '#888';
    ctx.fillStyle = col;
    // Column header
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(tk.t, LBL + i*SIZE + SIZE/2, LBL-4);
    // Row label
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(tk.t, LBL-6, LBL + i*SIZE + SIZE/2);
  });
}

function drawEvPayoff(cur, bP, bPr, mP, mPr, rP, rPr) {
  const cv = document.getElementById('evPayoffCanvas');
  if (!cv) return;
  const W = cv.parentElement.offsetWidth - 28;
  cv.width = W; cv.height = 140;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0,0,W,140);
  ctx.fillStyle = '#0a0a18'; ctx.fillRect(0,0,W,140);

  const scenarios = [
    { label:'Bear', price:rP, prob:rPr, color:'#f87171' },
    { label:'Base', price:mP, prob:mPr, color:'#fbbf24' },
    { label:'Bull', price:bP, prob:bPr, color:'#4ade80' },
  ];

  const PAD = 50, barH = 28, spacing = 14;
  const maxProb = Math.max(...scenarios.map(s=>s.prob), 0.01);

  scenarios.forEach((s, i) => {
    const y = 12 + i*(barH+spacing);
    const barW = s.prob > 0 ? ((W-PAD-8) * (s.prob/maxProb)) : 2;
    const ret = cur > 0 ? ((s.price-cur)/cur*100) : 0;

    // Bar
    ctx.fillStyle = s.color; ctx.globalAlpha = 0.2;
    ctx.fillRect(PAD, y, barW, barH); ctx.globalAlpha = 1;
    ctx.strokeStyle = s.color; ctx.lineWidth = 1.5;
    ctx.strokeRect(PAD, y, barW, barH);

    // Label
    ctx.fillStyle = s.color; ctx.font = 'bold 10px Syne, sans-serif';
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText(s.label, PAD-6, y+8);

    // Return + prob
    ctx.fillStyle = '#fff'; ctx.font = '10px DM Sans'; ctx.textAlign = 'left';
    ctx.fillText((ret>=0?'+':'')+ret.toFixed(1)+'%  ('+Math.round(s.prob*100)+'%)', PAD+barW+8, y+9);
  });

  // Zero line
  ctx.beginPath(); ctx.moveTo(PAD,0); ctx.lineTo(PAD,140);
  ctx.strokeStyle = '#2a2a40'; ctx.lineWidth = 1; ctx.stroke();
}

export {
  drawRadar,
  buildRadarLegend,
  drawCatalystTimeline,
  getCorrEstimate,
  drawCorrHeatmap,
  drawEvPayoff,
};
