import React, { useEffect, useRef } from 'react';

const CONTENT = `<div class="access-legend">
  <div class="access-item"><div class="access-ring ring-open">✓</div> Fully public (stocks/ETF)</div>
  <div class="access-item"><div class="access-ring ring-partial">~</div> Partial (via proxy/ETF)</div>
  <div class="access-ring ring-closed">✕</div><div style="font-size:0.68rem;color:var(--text-dim);margin-left:-8px">Mostly closed (VC/private)</div>
</div>

<div class="chart-wrap">
<svg viewBox="0 0 900 430" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a18;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#080810;stop-opacity:1"/>
    </linearGradient>
    <filter id="glow2">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softglow2">
      <feGaussianBlur stdDeviation="7" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="curveAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:0.3"/>
      <stop offset="55%" style="stop-color:#6366f1;stop-opacity:0.07"/>
      <stop offset="100%" style="stop-color:#6366f1;stop-opacity:0"/>
    </linearGradient>
    <linearGradient id="curveLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:0.7"/>
      <stop offset="35%" style="stop-color:#6366f1;stop-opacity:1"/>
      <stop offset="65%" style="stop-color:#3b82f6;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#10b981;stop-opacity:0.8"/>
    </linearGradient>
    <filter id="curveGlow" x="-5%" y="-20%" width="110%" height="140%">
      <feGaussianBlur stdDeviation="3.5" result="blur"/>
      <feFlood flood-color="#6366f1" flood-opacity="0.6" result="col"/>
      <feComposite in="col" in2="blur" operator="in" result="shadow"/>
      <feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Axes -->
  <line x1="55" y1="30" x2="55" y2="390" stroke="#1a1a2e" stroke-width="1"/>
  <line x1="55" y1="390" x2="890" y2="390" stroke="#1a1a2e" stroke-width="1"/>

  <text x="18" y="210" fill="#222235" font-size="9" font-family="DM Sans" text-anchor="middle" transform="rotate(-90,18,210)" letter-spacing="1">EXPECTATIONS</text>
  <text x="472" y="410" fill="#222235" font-size="9" font-family="DM Sans" text-anchor="middle" letter-spacing="1">TIME →</text>

  <!-- Phase zones -->
  <rect x="56" y="30" width="145" height="360" fill="#0c0c16" opacity="0.7"/>
  <rect x="201" y="30" width="165" height="360" fill="#0e0e12" opacity="0.7"/>
  <rect x="366" y="30" width="155" height="360" fill="#0a0a18" opacity="0.7"/>
  <rect x="521" y="30" width="170" height="360" fill="#0a120a" opacity="0.5"/>
  <rect x="691" y="30" width="199" height="360" fill="#0a110a" opacity="0.5"/>

  <!-- Phase labels -->
  <text x="128" y="48" fill="#1e1e30" font-size="7.5" font-family="DM Sans" text-anchor="middle" letter-spacing="0.5">INNOVATION</text>
  <text x="128" y="58" fill="#1e1e30" font-size="7.5" font-family="DM Sans" text-anchor="middle" letter-spacing="0.5">TRIGGER</text>
  <text x="283" y="48" fill="#28280e" font-size="7.5" font-family="DM Sans" text-anchor="middle" letter-spacing="0.5">PEAK OF INFLATED</text>
  <text x="283" y="58" fill="#28280e" font-size="7.5" font-family="DM Sans" text-anchor="middle" letter-spacing="0.5">EXPECTATIONS</text>
  <text x="443" y="48" fill="#16163a" font-size="7.5" font-family="DM Sans" text-anchor="middle" letter-spacing="0.5">TROUGH OF</text>
  <text x="443" y="58" fill="#16163a" font-size="7.5" font-family="DM Sans" text-anchor="middle" letter-spacing="0.5">DISILLUSIONMENT</text>
  <text x="606" y="48" fill="#0e200e" font-size="7.5" font-family="DM Sans" text-anchor="middle" letter-spacing="0.5">SLOPE OF</text>
  <text x="606" y="58" fill="#0e200e" font-size="7.5" font-family="DM Sans" text-anchor="middle" letter-spacing="0.5">ENLIGHTENMENT</text>
  <text x="790" y="48" fill="#0a180a" font-size="7.5" font-family="DM Sans" text-anchor="middle" letter-spacing="0.5">PLATEAU OF</text>
  <text x="790" y="58" fill="#0a180a" font-size="7.5" font-family="DM Sans" text-anchor="middle" letter-spacing="0.5">PRODUCTIVITY</text>

  <!-- Dividers -->
  <line x1="201" y1="65" x2="201" y2="390" stroke="#1a1a2e" stroke-width="1" stroke-dasharray="3,5"/>
  <line x1="366" y1="65" x2="366" y2="390" stroke="#1a1a2e" stroke-width="1" stroke-dasharray="3,5"/>
  <line x1="521" y1="65" x2="521" y2="390" stroke="#1a1a2e" stroke-width="1" stroke-dasharray="3,5"/>
  <line x1="691" y1="65" x2="691" y2="390" stroke="#1a1a2e" stroke-width="1" stroke-dasharray="3,5"/>

  <!-- THE CURVE -->
  <path d="M 56,355 C 85,345 120,315 148,270 C 168,238 193,170 245,108 C 268,88 282,78 295,76 C 308,76 322,88 340,118 C 356,145 362,175 366,210 C 370,245 372,278 390,308 C 408,335 425,352 443,352 C 460,352 478,338 500,316 C 525,292 542,268 575,244 C 615,215 648,203 691,198 C 730,193 760,195 890,193"
    fill="none" stroke="#1e1e40" stroke-width="18" stroke-linecap="round"/>
  <path d="M 56,355 C 85,345 120,315 148,270 C 168,238 193,170 245,108 C 268,88 282,78 295,76 C 308,76 322,88 340,118 C 356,145 362,175 366,210 C 370,245 372,278 390,308 C 408,335 425,352 443,352 C 460,352 478,338 500,316 C 525,292 542,268 575,244 C 615,215 648,203 691,198 C 730,193 760,195 890,193"
    fill="none" stroke="#2e2e5a" stroke-width="2" stroke-linecap="round" filter="url(#glow2)"/>

  <!-- ========== ORIGINAL DATA POINTS ========== -->

  <!-- 1. Humanoid Robotics -->
  <circle cx="133" cy="270" r="13" fill="#f87171" opacity="0.9" filter="url(#softglow2)"
    class="dot" data-name="Humanoid Robotics" data-access="closed" data-phase="Innovation Trigger → Peak" data-color="#f87171"/>
  <circle cx="133" cy="270" r="13" fill="none" stroke="#f87171" stroke-width="2" opacity="0.5"/>
  <text x="133" y="249" fill="#f87171" font-size="7.5" font-family="DM Sans" text-anchor="middle" font-weight="600">Humanoid</text>
  <text x="133" y="258" fill="#f87171" font-size="7.5" font-family="DM Sans" text-anchor="middle" font-weight="600">Robotics</text>
  <text x="133" y="287" fill="#f87171" font-size="8" font-family="DM Sans" text-anchor="middle" font-weight="700">✕</text>

  <!-- 2. Nuclear / SMR -->
  <circle cx="90" cy="332" r="11" fill="#c084fc" opacity="0.85" filter="url(#glow2)"
    class="dot" data-name="Nuclear / SMR" data-access="partial" data-phase="Innovation Trigger" data-color="#c084fc"/>
  <text x="90" y="314" fill="#c084fc" font-size="7.5" font-family="DM Sans" text-anchor="middle">Nuclear</text>
  <text x="90" y="323" fill="#c084fc" font-size="7.5" font-family="DM Sans" text-anchor="middle">/ SMR</text>
  <text x="90" y="345" fill="#c084fc" font-size="8" font-family="DM Sans" text-anchor="middle" font-weight="700">~</text>

  <!-- 3. AI Infrastructure -->
  <circle cx="285" cy="79" r="12" fill="#fbbf24" opacity="0.95" filter="url(#softglow2)"
    class="dot" data-name="AI Data Center Infrastructure" data-access="partial" data-phase="Peak of Inflated Expectations" data-color="#fbbf24"/>
  <text x="285" y="60" fill="#fbbf24" font-size="7.5" font-family="DM Sans" text-anchor="middle" font-weight="600">AI Infra</text>
  <text x="285" y="69" fill="#fbbf24" font-size="7.5" font-family="DM Sans" text-anchor="middle" font-weight="600">(Data Centers)</text>
  <text x="285" y="92" fill="#fbbf24" font-size="8" font-family="DM Sans" text-anchor="middle" font-weight="700">~</text>

  <!-- 4. Defense EU -->
  <circle cx="225" cy="148" r="12" fill="#fb923c" opacity="0.9" filter="url(#glow2)"
    class="dot" data-name="Defense / Aerospace (EU)" data-access="open" data-phase="Rising toward Peak" data-color="#fb923c"/>
  <text x="225" y="128" fill="#fb923c" font-size="7.5" font-family="DM Sans" text-anchor="middle">Defense</text>
  <text x="225" y="138" fill="#fb923c" font-size="7.5" font-family="DM Sans" text-anchor="middle">EU Aero</text>
  <text x="225" y="162" fill="#fb923c" font-size="8" font-family="DM Sans" text-anchor="middle" font-weight="700">✓</text>

  <!-- 5. GLP-1 -->
  <circle cx="342" cy="120" r="11" fill="#60a5fa" opacity="0.85" filter="url(#glow2)"
    class="dot" data-name="GLP-1 / Obesity Drugs" data-access="open" data-phase="Peak → Trough" data-color="#60a5fa"/>
  <text x="342" y="102" fill="#60a5fa" font-size="7.5" font-family="DM Sans" text-anchor="middle">GLP-1</text>
  <text x="342" y="111" fill="#60a5fa" font-size="7.5" font-family="DM Sans" text-anchor="middle">Obesity</text>
  <text x="342" y="133" fill="#60a5fa" font-size="8" font-family="DM Sans" text-anchor="middle" font-weight="700">✓</text>

  <!-- 6. GenAI Software -->
  <circle cx="415" cy="336" r="11" fill="#94a3b8" opacity="0.8" filter="url(#glow2)"
    class="dot" data-name="Generative AI (software/SaaS)" data-access="open" data-phase="Trough of Disillusionment" data-color="#94a3b8"/>
  <text x="415" y="317" fill="#94a3b8" font-size="7.5" font-family="DM Sans" text-anchor="middle">GenAI</text>
  <text x="415" y="326" fill="#94a3b8" font-size="7.5" font-family="DM Sans" text-anchor="middle">Software</text>
  <text x="415" y="349" fill="#94a3b8" font-size="8" font-family="DM Sans" text-anchor="middle" font-weight="700">✓</text>

  <!-- 7. Healthcare ex-GLP1 -->
  <circle cx="457" cy="350" r="11" fill="#4ade80" opacity="0.9" filter="url(#glow2)"
    class="dot" data-name="Healthcare (ex-GLP1)" data-access="open" data-phase="Trough — Interesting!" data-color="#4ade80"/>
  <text x="457" y="331" fill="#4ade80" font-size="7.5" font-family="DM Sans" text-anchor="middle">Healthcare</text>
  <text x="457" y="340" fill="#4ade80" font-size="7.5" font-family="DM Sans" text-anchor="middle">(ex-GLP1)</text>
  <text x="457" y="363" fill="#4ade80" font-size="8" font-family="DM Sans" text-anchor="middle" font-weight="700">✓</text>

  <!-- 8. Copper -->
  <circle cx="558" cy="240" r="12" fill="#4ade80" opacity="0.9" filter="url(#glow2)"
    class="dot" data-name="Copper / Critical Minerals" data-access="open" data-phase="Slope of Enlightenment" data-color="#4ade80"/>
  <text x="558" y="221" fill="#4ade80" font-size="7.5" font-family="DM Sans" text-anchor="middle">Copper /</text>
  <text x="558" y="230" fill="#4ade80" font-size="7.5" font-family="DM Sans" text-anchor="middle">Critical Min.</text>
  <text x="558" y="253" fill="#4ade80" font-size="8" font-family="DM Sans" text-anchor="middle" font-weight="700">✓</text>

  <!-- 9. Commercial Aerospace -->
  <circle cx="612" cy="222" r="11" fill="#4ade80" opacity="0.85" filter="url(#glow2)"
    class="dot" data-name="Commercial Aerospace / MRO" data-access="open" data-phase="Slope — Interesting" data-color="#4ade80"/>
  <text x="612" y="203" fill="#4ade80" font-size="7.5" font-family="DM Sans" text-anchor="middle">Comm.</text>
  <text x="612" y="212" fill="#4ade80" font-size="7.5" font-family="DM Sans" text-anchor="middle">Aerospace</text>
  <text x="612" y="235" fill="#4ade80" font-size="8" font-family="DM Sans" text-anchor="middle" font-weight="700">✓</text>

  <!-- 10. Utilities / Power Grid -->
  <circle cx="653" cy="205" r="11" fill="#4ade80" opacity="0.85" filter="url(#glow2)"
    class="dot" data-name="Utilities / Power Grid" data-access="open" data-phase="Slope → Plateau" data-color="#4ade80"/>
  <text x="653" y="186" fill="#4ade80" font-size="7.5" font-family="DM Sans" text-anchor="middle">Utilities /</text>
  <text x="653" y="195" fill="#4ade80" font-size="7.5" font-family="DM Sans" text-anchor="middle">Power Grid</text>
  <text x="653" y="218" fill="#4ade80" font-size="8" font-family="DM Sans" text-anchor="middle" font-weight="700">✓</text>

  <!-- 11. Financials -->
  <circle cx="760" cy="194" r="11" fill="#4ade80" opacity="0.8" filter="url(#glow2)"
    class="dot" data-name="Financials / Banks" data-access="open" data-phase="Plateau of Productivity" data-color="#4ade80"/>
  <text x="760" y="175" fill="#4ade80" font-size="7.5" font-family="DM Sans" text-anchor="middle">Financials</text>
  <text x="760" y="184" fill="#4ade80" font-size="7.5" font-family="DM Sans" text-anchor="middle">/ Banks</text>
  <text x="760" y="207" fill="#4ade80" font-size="8" font-family="DM Sans" text-anchor="middle" font-weight="700">✓</text>

  <!-- 12. Silver -->
  <circle cx="170" cy="218" r="10" fill="#c084fc" opacity="0.85" filter="url(#glow2)"
    class="dot" data-name="Silver (industrieel + store of value)" data-access="open" data-phase="Rising — vroeg stadium" data-color="#c084fc"/>
  <text x="170" y="200" fill="#c084fc" font-size="7.5" font-family="DM Sans" text-anchor="middle">Silver</text>
  <text x="170" y="231" fill="#c084fc" font-size="8" font-family="DM Sans" text-anchor="middle" font-weight="700">✓</text>

  <!-- ========== NEW DATA POINTS ========== -->

  <!-- 13. LNG / Gas Infra — Slope of Enlightenment — real cash flows, overlooked -->
  <!-- Between trough and slope, x≈505, y≈320 = just climbing out of trough area -->
  <circle cx="505" cy="315" r="12" fill="#2dd4bf" opacity="0.9" filter="url(#glow2)"
    class="dot" data-name="LNG / Gas Infrastructure" data-access="open" data-phase="Slope of Enlightenment — Onderschat" data-color="#2dd4bf"/>
  <text x="505" y="296" fill="#2dd4bf" font-size="7.5" font-family="DM Sans" text-anchor="middle">LNG /</text>
  <text x="505" y="305" fill="#2dd4bf" font-size="7.5" font-family="DM Sans" text-anchor="middle">Gas Infra</text>
  <text x="505" y="328" fill="#2dd4bf" font-size="8" font-family="DM Sans" text-anchor="middle" font-weight="700">✓</text>

  <!-- 14. Bio-AI Pure Plays — very early Innovation Trigger, speculative -->
  <!-- x≈72, y≈355 (on the rising curve, very early) -->
  <circle cx="72" cy="353" r="10" fill="#f87171" opacity="0.8" filter="url(#glow2)"
    class="dot" data-name="Bio-AI Pure Plays (RXRX, SDGR)" data-access="partial" data-phase="Innovation Trigger — Speculatief" data-color="#f87171"/>
  <text x="72" y="336" fill="#f87171" font-size="7" font-family="DM Sans" text-anchor="middle">Bio-AI</text>
  <text x="72" y="344" fill="#f87171" font-size="7" font-family="DM Sans" text-anchor="middle">Pure Plays</text>
  <text x="72" y="366" fill="#f87171" font-size="7.5" font-family="DM Sans" text-anchor="middle" font-weight="700">~</text>

  <!-- 15. Energy Majors / Midstream — Plateau, cash-generative, mature -->
  <circle cx="830" cy="193" r="11" fill="#fb923c" opacity="0.85" filter="url(#glow2)"
    class="dot" data-name="Energy Majors / Midstream" data-access="open" data-phase="Plateau of Productivity" data-color="#fb923c"/>
  <text x="830" y="174" fill="#fb923c" font-size="7.5" font-family="DM Sans" text-anchor="middle">Energy</text>
  <text x="830" y="183" fill="#fb923c" font-size="7.5" font-family="DM Sans" text-anchor="middle">Majors</text>
  <text x="830" y="206" fill="#fb923c" font-size="8" font-family="DM Sans" text-anchor="middle" font-weight="700">✓</text>

</svg>
</div>

<!-- CARDS -->
<div class="cards">

  <div class="card" style="border-color:#4ade8033">
    <div class="card-header">
      <div class="card-dot" style="background:#4ade80"></div>
      <div class="card-name">Healthcare (ex-GLP1)</div>
      <div class="card-access access-open-badge">PUBLIC ✓</div>
    </div>
    <div class="card-phase">📍 Trough of Disillusionment</div>
    <div class="card-desc">Underperformed the S&P 500 by >60% over 2.5 years. Valuations historically low vs. expected returns. AI will compress costs in the sector. Policy risks (ACA, drug pricing) largely cleared.</div>
    <div class="card-tickers">UNH, CVS, Molina Healthcare, iShares Healthcare ETF (IYH)</div>
    <div class="card-verdict verdict-interesting">⭐ Interesting: cheap, defensive, ready for recovery</div>
  </div>

  <div class="card" style="border-color:#4ade8033">
    <div class="card-header">
      <div class="card-dot" style="background:#4ade80"></div>
      <div class="card-name">Copper / Critical Minerals</div>
      <div class="card-access access-open-badge">PUBLIC ✓</div>
    </div>
    <div class="card-phase">📍 Slope of Enlightenment</div>
    <div class="card-desc">Double demand: AI data centres AND the energy transition. Supply structurally constrained — new mines take 10–15 years. No longer hype, real scarcity. Strongest long-term fundamentals of 2026.</div>
    <div class="card-tickers">Freeport-McMoRan (FCX), Southern Copper (SCCO), Global X Copper ETF (COPX)</div>
    <div class="card-verdict verdict-interesting">⭐ Interesting: structural scarcity + dual demand driver</div>
  </div>

  <div class="card" style="border-color:#4ade8033">
    <div class="card-header">
      <div class="card-dot" style="background:#4ade80"></div>
      <div class="card-name">Commercial Aerospace / MRO</div>
      <div class="card-access access-open-badge">PUBLIC ✓</div>
    </div>
    <div class="card-phase">📍 Slope of Enlightenment</div>
    <div class="card-desc">Aviation recovering structurally post-COVID. OEMs cannot meet demand — MRO benefits most. Low hype, stable cashflows. Fidelity and UBS favorite.</div>
    <div class="card-tickers">GE Aerospace (GEA), TransDigm (TDG), Hexcel (HXL), RTX</div>
    <div class="card-verdict verdict-interesting">⭐ Interesting: structural recovery, low hype</div>
  </div>

  <div class="card" style="border-color:#fb923c33">
    <div class="card-header">
      <div class="card-dot" style="background:#fb923c"></div>
      <div class="card-name">Defense / Aerospace (Europa)</div>
      <div class="card-access access-open-badge">PUBLIC ✓</div>
    </div>
    <div class="card-phase">📍 Rising to the peak</div>
    <div class="card-desc">European defence budgets doubling. Already +200% in 12 months for names like Rheinmetall and SAAB. Structurally justified but some names already overvalued. Thales en Dassault screenen nog als undervalued.</div>
    <div class="card-tickers">Rheinmetall (RHM), SAAB, Thales (HO), Rolls-Royce (RR), ETF: EUAD</div>
    <div class="card-verdict verdict-caution">⚠️ Cautious: theme is right but entry is off for many</div>
  </div>

  <div class="card" style="border-color:#c084fc33">
    <div class="card-header">
      <div class="card-dot" style="background:#c084fc"></div>
      <div class="card-name">Silver</div>
      <div class="card-access access-open-badge">PUBLIC ✓</div>
    </div>
    <div class="card-phase">📍 Innovation Trigger / vroeg stadium</div>
    <div class="card-desc">Industrial demand growing (solar panels, electronics) + store-of-value narrative as gold peaks. Fifth year of supply deficit. Gold/silver ratio still high vs. historical average.</div>
    <div class="card-tickers">Pan American Silver (PAAS), First Majestic (AG), iShares Silver ETF (SLV)</div>
    <div class="card-verdict verdict-interesting">⭐ Interesting: early stage, fundamentals improving</div>
  </div>

  <div class="card" style="border-color:#fbbf2433">
    <div class="card-header">
      <div class="card-dot" style="background:#fbbf24"></div>
      <div class="card-name">AI Data Center Infrastructure</div>
      <div class="card-access access-partial-badge">GEDEELTELIJK ~</div>
    </div>
    <div class="card-phase">📍 Peak of Inflated Expectations</div>
    <div class="card-desc">Real demand but much already priced in. Cooling (Vertiv, Schneider) and grid equipment are the real bottleneck plays. Pure AI micro-caps are speculative. Opgepast voor story stocks zonder revenue. Zie Deep Dive tab voor volledige analyse.</div>
    <div class="card-tickers">Vertiv (VRT), Schneider Electric (SBGSY), Siemens Energy (SMNEY)</div>
    <div class="card-verdict verdict-caution">⚠️ Selective: solid bottleneck names yes, hype names no</div>
  </div>

  <div class="card" style="border-color:#c084fc33">
    <div class="card-header">
      <div class="card-dot" style="background:#c084fc"></div>
      <div class="card-name">Nuclear / SMR</div>
      <div class="card-access access-partial-badge">GEDEELTELIJK ~</div>
    </div>
    <div class="card-phase">📍 Innovation Trigger</div>
    <div class="card-desc">Structural demand is real (AI + decarbonisation) but SMRs only come online after 2030. Uranium miners are public. Reactor builders largely private. Uranium is consensus-thema geworden — crowding risico. Zie Deep Dive voor CCJ/URA analyse.</div>
    <div class="card-tickers">Cameco (CCJ), NexGen Energy (NXE), Uranium ETF (URA)</div>
    <div class="card-verdict verdict-caution">⚠️ Interesting but early — sentiment & crowding risk</div>
  </div>

  <div class="card" style="border-color:#f8717133">
    <div class="card-header">
      <div class="card-dot" style="background:#f87171"></div>
      <div class="card-name">Humanoid Robotics</div>
      <div class="card-access access-closed-badge">GESLOTEN ✕</div>
    </div>
    <div class="card-phase">📍 Innovation Trigger → Piek</div>
    <div class="card-desc">The real names are private: Figure AI ($39B), Boston Dynamics (Hyundai), Agility Robotics (Amazon-backed). Tesla Optimus is the only genuine public play. Proxies bestaan maar zijn indirect en duur.</div>
    <div class="card-tickers">Tesla (TSLA) as proxy — Nvidia (NVDA) — ETF: ROBO, BOTZ</div>
    <div class="card-verdict verdict-late">✕ Largely closed to public capital. Proxies are indirect and expensive.</div>
  </div>

  <div class="card" style="border-color:#94a3b833">
    <div class="card-header">
      <div class="card-dot" style="background:#94a3b8"></div>
      <div class="card-name">GenAI Software / SaaS</div>
      <div class="card-access access-open-badge">PUBLIC ✓</div>
    </div>
    <div class="card-phase">📍 Trough of Disillusionment</div>
    <div class="card-desc">Gartner already places GenAI in the trough. ROI difficult to quantify for enterprises. The trough creates opportunities — quality names unfairly sold off. Patience required. MSFT and NOW are the solide exposures.</div>
    <div class="card-tickers">Microsoft (MSFT), Salesforce (CRM), ServiceNow (NOW) — selectief</div>
    <div class="card-verdict verdict-caution">⚠️ Wait for better entry points in quality names</div>
  </div>

  <!-- NEW CARDS -->
  <div class="card" style="border-color:#2dd4bf33">
    <div class="card-header">
      <div class="card-dot" style="background:#2dd4bf"></div>
      <div class="card-name">LNG / Gas Infrastructure</div>
      <div class="card-access access-open-badge">PUBLIC ✓</div>
    </div>
    <div class="card-phase">📍 Slope of Enlightenment — onderschat</div>
    <div class="card-desc">Best bridge between geopolitics and structural energy demand. Contract-backed cashflows — not dependent on spot LNG price. Cheniere is the highest conviction in the entire energy sector. WMB (Transco) is irreplaceable infra. Less hyped than AI or defense.</div>
    <div class="card-tickers">Cheniere Energy (LNG), Williams Cos. (WMB), Targa Resources (TRGP), AMLP ETF</div>
    <div class="card-verdict verdict-interesting">⭐ Hoogste overtuiging — contract cashflows + geopolitieke waarde</div>
  </div>

  <div class="card" style="border-color:#f8717133">
    <div class="card-header">
      <div class="card-dot" style="background:#f87171"></div>
      <div class="card-name">Bio-AI Pure Plays</div>
      <div class="card-access access-partial-badge">GEDEELTELIJK ~</div>
    </div>
    <div class="card-phase">📍 Innovation Trigger — speculatief</div>
    <div class="card-desc">AI applied to drug discovery: protein folding, molecular simulation, phenomics. Recursion (RXRX) and Schrödinger (SDGR) are the pure plays. Loss-making, cash burn, binary clinical trial risks. Asymmetrische uitkomst: 5x of 0. Alleen als kleine speculatieve sleeve.</div>
    <div class="card-tickers">Recursion Pharma (RXRX), Schrödinger (SDGR) — max 2–3% of portfolio</div>
    <div class="card-verdict verdict-late">⚠️ Speculative: keep size limited. Read before entering — see Deep Dive.</div>
  </div>

  <div class="card" style="border-color:#fb923c33">
    <div class="card-header">
      <div class="card-dot" style="background:#fb923c"></div>
      <div class="card-name">Energy Majors / Midstream</div>
      <div class="card-access access-open-badge">PUBLIC ✓</div>
    </div>
    <div class="card-phase">📍 Plateau of Productivity</div>
    <div class="card-desc">Cash-generating compounders. XOM, COP and WMB are not cheap but not overvalued. COP is the cheapest quality E&P (13.3x). Midstream provides stable income without dependence on commodity price. No hype — real cash flows.</div>
    <div class="card-tickers">ExxonMobil (XOM), ConocoPhillips (COP), Williams Cos. (WMB), Targa (TRGP)</div>
    <div class="card-verdict verdict-interesting">⭐ Solid: cashflow-driven, geopolitical tailwind, low sentiment</div>
  </div>

</div>

<div class="tooltip" id="tt">
  <strong id="tt-name"></strong>
  <span id="tt-desc"></span>
</div>

<div class="note">
  <strong>How to read:</strong> Green dots = attractive on the cycle + fully publicly accessible. Orange = theme is right but entry is less obvious. Blue/grey = trough opportunities. Teal = underestimated/overlooked. ✓ = regular broker. ~ = proxy of ETF nodig. ✕ = VC/privaat, niet direct toegankelijk. <br>
  New additions (Apr 2026): LNG/Gas Infra · Bio-AI Pure Plays · Energy Majors — based on Energy/AI/Bio-AI deep dive analysis. This is personal analysis, not financial advice.
</div>`;

export default function HypeCycle({ isActive }) {
  const wrapRef = useRef(null);

  // Wire SVG dot tooltips once mounted
  useEffect(() => {
    if (!wrapRef.current) return;
    const tt = wrapRef.current.querySelector('#tt');
    const ttName = wrapRef.current.querySelector('#tt-name');
    const ttDesc = wrapRef.current.querySelector('#tt-desc');
    const dots = wrapRef.current.querySelectorAll('.dot');
    if (!tt) return;

    dots.forEach(dot => {
      dot.addEventListener('mouseenter', (e) => {
        if (ttName) ttName.textContent = dot.dataset.name || '';
        if (ttDesc) ttDesc.textContent = dot.dataset.phase || '';
        tt.classList.add('visible');
      });
      dot.addEventListener('mouseleave', () => {
        tt.classList.remove('visible');
      });
      dot.addEventListener('mousemove', (e) => {
        const rect = wrapRef.current.getBoundingClientRect();
        tt.style.left = (e.clientX - rect.left + 12) + 'px';
        tt.style.top  = (e.clientY - rect.top  + 12) + 'px';
      });
    });
  }, []);

  return (
    <div
      className={`tab-panel${isActive ? ' active' : ''}`}
      id="tab-hype"
      ref={wrapRef}
      dangerouslySetInnerHTML={{ __html: CONTENT }}
    />
  );
}
