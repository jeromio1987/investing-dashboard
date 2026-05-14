import React from 'react';

const CONTENT = `<div class="smid-wrap">

<div style="margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid var(--border);">
  <div style="font-family:'Syne',sans-serif;font-size:1.05rem;font-weight:700;color:#fff;margin-bottom:3px;">
    SMID Sector Map
    <span style="color:var(--teal);"> — Where the Small/Mid Edge Lives by Theme</span>
  </div>
  <div style="font-size:0.62rem;color:var(--text-dim);letter-spacing:0.08em;text-transform:uppercase;">
    10 Sectors · Hype Position · Macro Fit · SMID Opportunity · Curated Watchlists
  </div>
</div>

<!-- 
<!-- ── RADAR CHART ───────────────────────────────────── -->
<div class="smid-section">📡 Sector Radar — Multi-Axis Opportunity Map</div>
<div class="radar-outer">
  <canvas id="radarChart" width="400" height="330"></canvas>
  <div class="radar-right">
    <div class="radar-legend-hd">Sectors — hover to highlight</div>
    <div id="radarLegend"></div>
    <div class="radar-axis-legend">
      <span style="color:var(--teal);">■</span> Macro Fit — current regime alignment<br>
      <span style="color:var(--purple);">■</span> SMID Edge — coverage gap &amp; binary catalysts<br>
      <span style="color:var(--yellow);">■</span> Hype Opp — opportunity from cycle position
    </div>
  </div>
</div>

SCORING TABLE -->
<div class="smid-section">📊 Sector Scoring Overview</div>
<div style="overflow-x:auto;margin-bottom:28px;">
<table class="smid-metrics-table" id="sector-score-tbl">
<thead><tr>
  <th style="text-align:left;">Sector</th>
  <th>Hype Position</th>
  <th>Macro Fit</th>
  <th>SMID Edge</th>
  <th>Overall</th>
  <th>Key Names</th>
</tr></thead>
<tbody>
  <tr>
    <td style="font-weight:600;color:#fff;">Uranium / Nuclear</td>
    <td><span style="color:var(--yellow);">Peak</span></td>
    <td><span style="color:var(--green);">★★★</span></td>
    <td><span style="color:var(--green);">★★★</span></td>
    <td><span style="color:var(--green);font-weight:700;">Strong Buy</span></td>
    <td style="color:var(--text-dim);">NXE, UUUU, DNN</td>
  </tr>
  <tr>
    <td style="font-weight:600;color:#fff;">AI Infrastructure</td>
    <td><span style="color:var(--green);">Rising to Peak</span></td>
    <td><span style="color:var(--green);">★★★</span></td>
    <td><span style="color:var(--green);">★★★</span></td>
    <td><span style="color:var(--green);font-weight:700;">Strong Buy</span></td>
    <td style="color:var(--text-dim);">POWL, AAON, NVEC</td>
  </tr>
  <tr>
    <td style="font-weight:600;color:#fff;">LNG / Gas Midstream</td>
    <td><span style="color:var(--yellow);">Peak</span></td>
    <td><span style="color:var(--green);">★★★</span></td>
    <td><span style="color:var(--yellow);">★★☆</span></td>
    <td><span style="color:var(--yellow);font-weight:700;">Buy</span></td>
    <td style="color:var(--text-dim);">KNTK, AM</td>
  </tr>
  <tr>
    <td style="font-weight:600;color:#fff;">Energy E&amp;P SMID</td>
    <td><span style="color:var(--yellow);">Early Majority</span></td>
    <td><span style="color:var(--yellow);">★★☆</span></td>
    <td><span style="color:var(--green);">★★★</span></td>
    <td><span style="color:var(--yellow);font-weight:700;">Buy</span></td>
    <td style="color:var(--text-dim);">NOG, CIVI, MTDR</td>
  </tr>
  <tr>
    <td style="font-weight:600;color:#fff;">Defence SMID</td>
    <td><span style="color:var(--green);">Rising to Peak</span></td>
    <td><span style="color:var(--green);">★★★</span></td>
    <td><span style="color:var(--yellow);">★★☆</span></td>
    <td><span style="color:var(--yellow);font-weight:700;">Buy</span></td>
    <td style="color:var(--text-dim);">KTOS, BWXT</td>
  </tr>
  <tr>
    <td style="font-weight:600;color:#fff;">Silver Miners</td>
    <td><span style="color:var(--yellow);">Rising</span></td>
    <td><span style="color:var(--yellow);">★★☆</span></td>
    <td><span style="color:var(--green);">★★★</span></td>
    <td><span style="color:var(--yellow);font-weight:700;">Buy</span></td>
    <td style="color:var(--text-dim);">AG, SVM, HL</td>
  </tr>
  <tr>
    <td style="font-weight:600;color:#fff;">Gene Editing</td>
    <td><span style="color:var(--blue);">Trough</span></td>
    <td><span style="color:var(--text-dim);">★☆☆</span></td>
    <td><span style="color:var(--green);">★★★</span></td>
    <td><span style="color:var(--teal);font-weight:700;">Selective</span></td>
    <td style="color:var(--text-dim);">BEAM, NTLA, ARVN</td>
  </tr>
  <tr>
    <td style="font-weight:600;color:#fff;">Bio-AI Drug Discovery</td>
    <td><span style="color:var(--green);">Rising</span></td>
    <td><span style="color:var(--yellow);">★★☆</span></td>
    <td><span style="color:var(--green);">★★★</span></td>
    <td><span style="color:var(--teal);font-weight:700;">Selective</span></td>
    <td style="color:var(--text-dim);">RXRX, SDGR</td>
  </tr>
  <tr>
    <td style="font-weight:600;color:#fff;">Psychedelics</td>
    <td><span style="color:var(--blue);">Trough</span></td>
    <td><span style="color:var(--text-dim);">★☆☆</span></td>
    <td><span style="color:var(--yellow);">★★☆</span></td>
    <td><span style="color:var(--text-dim);font-weight:700;">Watch</span></td>
    <td style="color:var(--text-dim);">MNMD, CMPS</td>
  </tr>
  <tr>
    <td style="font-weight:600;color:#fff;">Aviation MRO</td>
    <td><span style="color:var(--yellow);">Early Majority</span></td>
    <td><span style="color:var(--yellow);">★★☆</span></td>
    <td><span style="color:var(--text-dim);">★☆☆</span></td>
    <td><span style="color:var(--text-dim);font-weight:700;">Watch</span></td>
    <td style="color:var(--text-dim);">HEI, TDG</td>
  </tr>
</tbody>
</table>
</div>

<!-- SECTOR SUB-TABS -->
<div class="smid-tabs" id="sector-tabs">
  <button class="smid-tab active" onclick="switchSector('uranium')">⚛️ Uranium</button>
  <button class="smid-tab" onclick="switchSector('aiinfra')">🏭 AI Infra</button>
  <button class="smid-tab" onclick="switchSector('lng')">🔥 LNG</button>
  <button class="smid-tab" onclick="switchSector('ep')">🛢 E&amp;P</button>
  <button class="smid-tab" onclick="switchSector('defence')">🛡 Defence</button>
  <button class="smid-tab" onclick="switchSector('silver')">🥈 Silver</button>
  <button class="smid-tab" onclick="switchSector('geneedit')">🧬 Gene Editing</button>
  <button class="smid-tab" onclick="switchSector('bioai')">🤖 Bio-AI</button>
  <button class="smid-tab" onclick="switchSector('psych')">🍄 Psychedelics</button>
  <button class="smid-tab" onclick="switchSector('mro')">✈️ MRO</button>
</div>

<!-- ── SECTOR PANELS ── -->

<!-- URANIUM -->
<div class="smid-panel active" id="sec-uranium">
  <div class="smid-box">
    <strong>Thesis:</strong> Double demand shock — AI data centres need 24/7 baseload power, only nuclear delivers it without carbon. Supply structurally constrained: new mines take 10–15 years. No longer hype — real scarcity. Utilities are signing long-term contracts at $70–80/lb. The SMID edge: NXE and UUUU have thin analyst coverage (3–5) and binary catalysts (permitting, production updates).
  </div>
  <div class="smid-box blue">
    <strong>Key catalysts:</strong> Kazatomprom production guidance (quarterly) · US utility contract announcements · NRC/DOE permitting decisions · Uranium spot price crossing $100/lb · Any data centre operator announcing nuclear PPA.
  </div>
  <div class="smid-box green">
    <strong>Risk:</strong> Permitting delays (biggest risk for NXE Rook I) · Kazakhstan political instability · SMR timelines pushed past 2035 · Spot price correction if China demand slows.
  </div>
  <div class="smid-section">⚛️ Uranium SMID Watchlist</div>
  <table class="smid-metrics-table">
  <thead><tr>
    <th style="text-align:left;">Name</th><th>Ticker</th><th>Price</th><th>Chg%</th>
    <th>Type</th><th>Market Cap</th><th>Key Catalyst</th>
  </tr></thead>
  <tbody>
    <tr><td style="color:#fff;font-weight:600;">NexGen Energy</td><td>NXE</td>
      <td id="sp-NXE">—</td><td id="sc-NXE">—</td>
      <td><span class="tag tag-uranium">Pure Play</span></td><td>~$3B</td><td>Rook I permitting</td></tr>
    <tr><td style="color:#fff;font-weight:600;">Energy Fuels</td><td>UUUU</td>
      <td id="sp-UUUU">—</td><td id="sc-UUUU">—</td>
      <td><span class="tag tag-uranium">Pure Play</span></td><td>~$800M</td><td>White Mesa mill expansion</td></tr>
    <tr><td style="color:#fff;font-weight:600;">Denison Mines</td><td>DNN</td>
      <td id="sp-DNN">—</td><td id="sc-DNN">—</td>
      <td><span class="tag tag-uranium">Pure Play</span></td><td>~$1B</td><td>Wheeler River ISR approval</td></tr>
    <tr><td style="color:#fff;font-weight:600;">Uranium Royalty</td><td>UROY</td>
      <td id="sp-UROY">—</td><td id="sc-UROY">—</td>
      <td><span class="tag tag-uranium">Royalty</span></td><td>~$200M</td><td>Royalty stream activation</td></tr>
  </tbody>
  </table>
</div>

<!-- AI INFRA -->
<div class="smid-panel" id="sec-aiinfra">
  <div class="smid-box">
    <strong>Thesis:</strong> AI buildout is not about the model makers — it is about the physical infrastructure they need. Power distribution, thermal management, switchgear, HVAC. POWL builds the switchgear for data centres; AAON builds precision cooling. 3–5 analyst coverage. Earnings calls are the catalyst. These companies have real backlogs, real margins, and the market still underestimates the duration of the buildout.
  </div>
  <div class="smid-box blue">
    <strong>Key catalysts:</strong> Quarterly earnings with backlog guidance · Hyperscaler capex announcements (MSFT, GOOG, AMZN, META) · Power grid upgrade bills (US Infrastructure) · New data centre campus announcements.
  </div>
  <div class="smid-box green">
    <strong>Risk:</strong> Hyperscaler capex cut · AI adoption slower than expected · Competition from larger industrial incumbents (Eaton, ABB) · Valuation multiple compression after run.
  </div>
  <div class="smid-section">🏭 AI Infrastructure SMID Watchlist</div>
  <table class="smid-metrics-table">
  <thead><tr>
    <th style="text-align:left;">Name</th><th>Ticker</th><th>Price</th><th>Chg%</th>
    <th>Type</th><th>Market Cap</th><th>Key Catalyst</th>
  </tr></thead>
  <tbody>
    <tr><td style="color:#fff;font-weight:600;">Powell Industries</td><td>POWL</td>
      <td id="sp-POWL">—</td><td id="sc-POWL">—</td>
      <td><span class="tag tag-aiinfra">Switchgear</span></td><td>~$3B</td><td>Q backlog guide</td></tr>
    <tr><td style="color:#fff;font-weight:600;">AAON Inc.</td><td>AAON</td>
      <td id="sp-AAON">—</td><td id="sc-AAON">—</td>
      <td><span class="tag tag-aiinfra">HVAC/Cooling</span></td><td>~$5B</td><td>DataCenter segment revenue</td></tr>
    <tr><td style="color:#fff;font-weight:600;">Super Micro Computer</td><td>SMCI</td>
      <td id="sp-SMCI">—</td><td id="sc-SMCI">—</td>
      <td><span class="tag tag-aiinfra">Servers</span></td><td>~$25B</td><td>Annual filings + guidance</td></tr>
    <tr><td style="color:#fff;font-weight:600;">NVIDIA Corp.</td><td>NVDA</td>
      <td id="sp-NVDA">—</td><td id="sc-NVDA">—</td>
      <td><span class="tag tag-aiinfra">GPU/Compute</span></td><td>~$3T</td><td>Quarterly revenue guide</td></tr>
  </tbody>
  </table>
</div>

<!-- LNG -->
<div class="smid-panel" id="sec-lng">
  <div class="smid-box">
    <strong>Thesis:</strong> Best bridge between geopolitics and structural energy demand. Contract-backed cashflows — not dependent on spot LNG price. Europe locked in for decade-long US LNG supply. Kinder Morgan's natural gas network is the domestic backbone. SMID midstream names like KNTK have limited analyst coverage and fee-based revenue. The geopolitical floor is durable.
  </div>
  <div class="smid-box blue">
    <strong>Key catalysts:</strong> European LNG terminal completions · US LNG export capacity additions · Natural gas price floor above $2.50/MMBtu · Russia/Ukraine resolution (removes some premium but validates supply shift).
  </div>
  <div class="smid-box green">
    <strong>Risk:</strong> LNG oversupply post-2026 (Australian, Qatari volumes) · Warm European winter reducing storage demand · Rate sensitivity (midstream is duration-exposed) · Cheniere contract renegotiation risk.
  </div>
  <div class="smid-section">🔥 LNG / Midstream Watchlist</div>
  <table class="smid-metrics-table">
  <thead><tr>
    <th style="text-align:left;">Name</th><th>Ticker</th><th>Price</th><th>Chg%</th>
    <th>Type</th><th>Market Cap</th><th>Key Catalyst</th>
  </tr></thead>
  <tbody>
    <tr><td style="color:#fff;font-weight:600;">Kinetik Holdings</td><td>KNTK</td>
      <td id="sp-KNTK">—</td><td id="sc-KNTK">—</td>
      <td><span class="tag tag-energy">Midstream</span></td><td>~$6B</td><td>Permian volume expansion</td></tr>
    <tr><td style="color:#fff;font-weight:600;">Antero Midstream</td><td>AM</td>
      <td id="sp-AM">—</td><td id="sc-AM">—</td>
      <td><span class="tag tag-energy">Midstream</span></td><td>~$6B</td><td>FCF + dividend growth</td></tr>
    <tr><td style="color:#fff;font-weight:600;">Cheniere Energy</td><td>LNG</td>
      <td id="sp-LNG">—</td><td id="sc-LNG">—</td>
      <td><span class="tag tag-energy">LNG Export</span></td><td>~$42B</td><td>Contract backlog updates</td></tr>
  </tbody>
  </table>
</div>

<!-- E&P -->
<div class="smid-panel" id="sec-ep">
  <div class="smid-box">
    <strong>Thesis:</strong> Non-operator model (NOG) gives commodity exposure with acquisition optionality and no operational risk. CIVI and MTDR are pure Permian/DJ Basin plays with FCF inflection at $65+ WTI. These are not growth stories — they are return-of-capital stories. The SMID edge: acquirers (majors) need bolt-ons. NOG and CIVI are ideal targets.
  </div>
  <div class="smid-box blue">
    <strong>Key catalysts:</strong> WTI crude staying above $65 · Quarterly FCF and buyback announcements · M&amp;A activity in Permian Basin · OPEC+ production discipline.
  </div>
  <div class="smid-box green">
    <strong>Risk:</strong> WTI below $60 for sustained period · OPEC+ production surge · Demand destruction from global recession · Permian well cost inflation.
  </div>
  <div class="smid-section">🛢 Energy E&amp;P SMID Watchlist</div>
  <table class="smid-metrics-table">
  <thead><tr>
    <th style="text-align:left;">Name</th><th>Ticker</th><th>Price</th><th>Chg%</th>
    <th>Type</th><th>Market Cap</th><th>Key Catalyst</th>
  </tr></thead>
  <tbody>
    <tr><td style="color:#fff;font-weight:600;">Northern Oil &amp; Gas</td><td>NOG</td>
      <td id="sp-NOG">—</td><td id="sc-NOG">—</td>
      <td><span class="tag tag-energy">Non-Op</span></td><td>~$4B</td><td>Acquisition + buyback</td></tr>
    <tr><td style="color:#fff;font-weight:600;">Civitas Resources</td><td>CIVI</td>
      <td id="sp-CIVI">—</td><td id="sc-CIVI">—</td>
      <td><span class="tag tag-energy">DJ + Permian</span></td><td>~$5B</td><td>FCF yield + buyback</td></tr>
    <tr><td style="color:#fff;font-weight:600;">Matador Resources</td><td>MTDR</td>
      <td id="sp-MTDR">—</td><td id="sc-MTDR">—</td>
      <td><span class="tag tag-energy">Permian</span></td><td>~$6B</td><td>Delaware Basin production</td></tr>
    <tr><td style="color:#fff;font-weight:600;">Vital Energy</td><td>VTLE</td>
      <td id="sp-VTLE">—</td><td id="sc-VTLE">—</td>
      <td><span class="tag tag-energy">Permian</span></td><td>~$1.5B</td><td>Debt reduction milestones</td></tr>
  </tbody>
  </table>
</div>

<!-- DEFENCE -->
<div class="smid-panel" id="sec-defence">
  <div class="smid-box">
    <strong>Thesis:</strong> European defence budgets doubling (NATO 2% GDP → structural 3%+). US defence backlog at record levels. SMID plays: KTOS builds low-cost attritable drones — the future of warfare is volume, not platforms. BWXT makes naval nuclear reactors — only supplier, no competition. These are not trading sardines: they have contract-backed multi-year revenue.
  </div>
  <div class="smid-box blue">
    <strong>Key catalysts:</strong> US defence budget reconciliation · European rearmament spending announcements · Drone warfare expansion in Ukraine/Middle East · KTOS Valkyrie production contract · BWXT reactor programme extensions.
  </div>
  <div class="smid-box green">
    <strong>Risk:</strong> Geopolitical resolution reducing urgency · US debt ceiling forcing defence cuts · Some SMID names already +150% from lows — entry timing matters · Contract delays in bureaucratic procurement cycles.
  </div>
  <div class="smid-section">🛡 Defence SMID Watchlist</div>
  <table class="smid-metrics-table">
  <thead><tr>
    <th style="text-align:left;">Name</th><th>Ticker</th><th>Price</th><th>Chg%</th>
    <th>Type</th><th>Market Cap</th><th>Key Catalyst</th>
  </tr></thead>
  <tbody>
    <tr><td style="color:#fff;font-weight:600;">Kratos Defense</td><td>KTOS</td>
      <td id="sp-KTOS">—</td><td id="sc-KTOS">—</td>
      <td><span class="tag tag-defense">Drones</span></td><td>~$4B</td><td>Valkyrie contract award</td></tr>
    <tr><td style="color:#fff;font-weight:600;">BWX Technologies</td><td>BWXT</td>
      <td id="sp-BWXT">—</td><td id="sc-BWXT">—</td>
      <td><span class="tag tag-defense">Naval Nuclear</span></td><td>~$8B</td><td>Submarine programme expansion</td></tr>
    <tr><td style="color:#fff;font-weight:600;">Mercury Systems</td><td>MRCY</td>
      <td id="sp-MRCY">—</td><td id="sc-MRCY">—</td>
      <td><span class="tag tag-defense">Electronics</span></td><td>~$1.5B</td><td>Margin recovery + backlog</td></tr>
  </tbody>
  </table>
</div>

<!-- SILVER -->
<div class="smid-panel" id="sec-silver">
  <div class="smid-box">
    <strong>Thesis:</strong> Silver is the asymmetric play within precious metals. Gold/silver ratio historically high (83x vs. 60x long-term average). Industrial demand growing from solar panels and electronics. Fifth year of supply deficit. If gold holds $2,800+, silver re-rates significantly. SMID miners have operating leverage: 10% silver price increase = 30%+ earnings increase for mid-tier miners.
  </div>
  <div class="smid-box blue">
    <strong>Key catalysts:</strong> Gold/silver ratio compression · Solar panel installation volumes (silver paste demand) · Fed rate cuts reducing USD strength · Silver ETF inflows (SLV) · Any industrial shortage signal from LBMA.
  </div>
  <div class="smid-box green">
    <strong>Risk:</strong> Gold correction drags silver · Industrial slowdown reduces solar demand · Strong USD · Higher-for-longer rates compressing commodity multiples · Political risk in Mexican/Peruvian mining jurisdictions.
  </div>
  <div class="smid-section">🥈 Silver Miner Watchlist</div>
  <table class="smid-metrics-table">
  <thead><tr>
    <th style="text-align:left;">Name</th><th>Ticker</th><th>Price</th><th>Chg%</th>
    <th>Type</th><th>Market Cap</th><th>Key Catalyst</th>
  </tr></thead>
  <tbody>
    <tr><td style="color:#fff;font-weight:600;">First Majestic Silver</td><td>AG</td>
      <td id="sp-AG">—</td><td id="sc-AG">—</td>
      <td><span class="tag tag-uranium">Pure Play</span></td><td>~$2B</td><td>Silver spot price + Jerritt Canyon</td></tr>
    <tr><td style="color:#fff;font-weight:600;">SilverCorp Metals</td><td>SVM</td>
      <td id="sp-SVM">—</td><td id="sc-SVM">—</td>
      <td><span class="tag tag-uranium">Pure Play</span></td><td>~$700M</td><td>Ying mine production</td></tr>
    <tr><td style="color:#fff;font-weight:600;">Hecla Mining</td><td>HL</td>
      <td id="sp-HL">—</td><td id="sc-HL">—</td>
      <td><span class="tag tag-uranium">Primary Silver</span></td><td>~$3B</td><td>Lucky Friday + Greens Creek output</td></tr>
    <tr><td style="color:#fff;font-weight:600;">Pan American Silver</td><td>PAAS</td>
      <td id="sp-PAAS">—</td><td id="sc-PAAS">—</td>
      <td><span class="tag tag-uranium">Diversified</span></td><td>~$6B</td><td>Latin America portfolio</td></tr>
  </tbody>
  </table>
</div>

<!-- GENE EDITING -->
<div class="smid-panel" id="sec-geneedit">
  <div class="smid-box">
    <strong>Thesis:</strong> The trough creates opportunity. BEAM, NTLA, ARVN are at or near cash-value after the 2021–2024 biotech destruction. The binary catalyst structure is the SMID edge: interim clinical data on a single programme can double or halve the stock in one session. Position sizing is the entire game. 0.5–1% max, stop at −35%, sell 40% on the spike day.
  </div>
  <div class="smid-box blue">
    <strong>Key catalysts:</strong> BEAM ESCAPE trial interim data · NTLA-2001 Phase I update · ARVN ARV-102 clinical readout · FDA approval of first base-editing or prime-editing therapy · Pharma licensing deal for any platform.
  </div>
  <div class="smid-box green">
    <strong>Risk:</strong> Clinical failure (binary wipeout risk) · Safety signal in editing (off-target cuts) · Competition from Intellia or Caribou reducing platform premium · Cash runway (all loss-making — check burn rate vs. cash).
  </div>
  <div class="smid-section">🧬 Gene Editing Watchlist</div>
  <table class="smid-metrics-table">
  <thead><tr>
    <th style="text-align:left;">Name</th><th>Ticker</th><th>Price</th><th>Chg%</th>
    <th>Type</th><th>Market Cap</th><th>Key Catalyst</th>
  </tr></thead>
  <tbody>
    <tr><td style="color:#fff;font-weight:600;">Beam Therapeutics</td><td>BEAM</td>
      <td id="sp-BEAM">—</td><td id="sc-BEAM">—</td>
      <td><span class="tag tag-bioai">Base Editing</span></td><td>~$1.5B</td><td>ESCAPE interim data</td></tr>
    <tr><td style="color:#fff;font-weight:600;">Intellia Therapeutics</td><td>NTLA</td>
      <td id="sp-NTLA">—</td><td id="sc-NTLA">—</td>
      <td><span class="tag tag-bioai">CRISPR In Vivo</span></td><td>~$1.2B</td><td>NTLA-2001 Phase I</td></tr>
    <tr><td style="color:#fff;font-weight:600;">Arvinas</td><td>ARVN</td>
      <td id="sp-ARVN">—</td><td id="sc-ARVN">—</td>
      <td><span class="tag tag-bioai">PROTAC</span></td><td>~$1.5B</td><td>ARV-102 neuro data</td></tr>
    <tr><td style="color:#fff;font-weight:600;">Kymera Therapeutics</td><td>KYMR</td>
      <td id="sp-KYMR">—</td><td id="sc-KYMR">—</td>
      <td><span class="tag tag-bioai">Degrader</span></td><td>~$1.5B</td><td>KT-621 atopic derm P2</td></tr>
  </tbody>
  </table>
</div>

<!-- BIO-AI -->
<div class="smid-panel" id="sec-bioai">
  <div class="smid-box">
    <strong>Thesis:</strong> AI applied to drug discovery — protein folding, molecular simulation, phenomics. Recursion (RXRX) and Schrödinger (SDGR) are the pure plays. Both loss-making but the platform value is real. RXRX has partnerships with Roche and Bayer. SDGR sells software to every major pharma. The SMID edge: still covered by only 8–12 analysts, data-rich companies that the market does not fully understand yet.
  </div>
  <div class="smid-box blue">
    <strong>Key catalysts:</strong> RXRX Roche/Bayer collaboration milestones · SDGR enterprise software contract announcements · Any FDA-approved drug with AI-discovered structure · Big pharma licensing deal for AI platform · Pipeline candidate entering Phase II.
  </div>
  <div class="smid-box green">
    <strong>Risk:</strong> Cash burn — both loss-making, runway matters · AI drug discovery still unproven at Phase III · Competition from in-house big pharma AI teams · Valuation rich vs. near-term revenue.
  </div>
  <div class="smid-section">🤖 Bio-AI Watchlist</div>
  <table class="smid-metrics-table">
  <thead><tr>
    <th style="text-align:left;">Name</th><th>Ticker</th><th>Price</th><th>Chg%</th>
    <th>Type</th><th>Market Cap</th><th>Key Catalyst</th>
  </tr></thead>
  <tbody>
    <tr><td style="color:#fff;font-weight:600;">Recursion Pharmaceuticals</td><td>RXRX</td>
      <td id="sp-RXRX">—</td><td id="sc-RXRX">—</td>
      <td><span class="tag tag-bioai">AI Platform</span></td><td>~$1.5B</td><td>Roche milestone + pipeline data</td></tr>
    <tr><td style="color:#fff;font-weight:600;">Schrödinger</td><td>SDGR</td>
      <td id="sp-SDGR">—</td><td id="sc-SDGR">—</td>
      <td><span class="tag tag-bioai">Sim Software</span></td><td>~$2B</td><td>Enterprise contract growth</td></tr>
  </tbody>
  </table>
</div>

<!-- PSYCHEDELICS -->
<div class="smid-panel" id="sec-psych">
  <div class="smid-box">
    <strong>Thesis:</strong> Deep in the trough — MDMA therapy FDA rejection in 2024 reset sentiment dramatically. But psilocybin (MNMD, CMPS) is still advancing and the mechanism of action is real. Treatment-resistant depression is a $20B+ market with no good solutions. The SMID edge is patience: position at trough with 0.5–1%, wait for Phase III data. The risk-reward at current valuations is asymmetric if clinical success comes.
  </div>
  <div class="smid-box blue">
    <strong>Key catalysts:</strong> MNMD psilocybin Phase III readout · CMPS COMP360 Phase IIb data · FDA scheduling guidance on psilocybin · Any state-level legalisation (Colorado, Oregon rollout) · Big pharma licensing interest.
  </div>
  <div class="smid-box green">
    <strong>Risk:</strong> FDA rejection (happened with MDMA) · Political/regulatory headwinds · Scale challenges (therapy requires trained facilitators, not just a pill) · Cash burn at small companies · Very long catalysts (clinical trials = years).
  </div>
  <div class="smid-section">🍄 Psychedelics Watchlist</div>
  <table class="smid-metrics-table">
  <thead><tr>
    <th style="text-align:left;">Name</th><th>Ticker</th><th>Price</th><th>Chg%</th>
    <th>Type</th><th>Market Cap</th><th>Key Catalyst</th>
  </tr></thead>
  <tbody>
    <tr><td style="color:#fff;font-weight:600;">Mind Medicine</td><td>MNMD</td>
      <td id="sp-MNMD">—</td><td id="sc-MNMD">—</td>
      <td><span class="tag tag-bioai">Psilocybin</span></td><td>~$600M</td><td>MM120 Phase III data</td></tr>
    <tr><td style="color:#fff;font-weight:600;">COMPASS Pathways</td><td>CMPS</td>
      <td id="sp-CMPS">—</td><td id="sc-CMPS">—</td>
      <td><span class="tag tag-bioai">Psilocybin</span></td><td>~$400M</td><td>COMP360 Phase IIb</td></tr>
  </tbody>
  </table>
</div>

<!-- MRO -->
<div class="smid-panel" id="sec-mro">
  <div class="smid-box">
    <strong>Thesis:</strong> Aviation recovering structurally post-COVID. OEMs (Boeing, Airbus) cannot meet demand — backlogs are 8–10 years. Older fleets fly longer, MRO benefits most. HEICO and TransDigm are the SMID quality plays: proprietary parts, pricing power, sticky customer relationships. Low hype, stable cashflows, consistent compounding. Not exciting — reliably profitable.
  </div>
  <div class="smid-box blue">
    <strong>Key catalysts:</strong> Boeing 737 MAX production ramp (more planes = more MRO later) · Airline capacity utilisation above 85% · HEICO PMA parts expansion · TransDigm acquisition activity · Air travel demand resilience in recession.
  </div>
  <div class="smid-box green">
    <strong>Risk:</strong> Recession reducing air travel · Fuel price spike grounding older aircraft · Boeing quality issues reducing fleet utilisation · Valuation — HEICO and TDG are not cheap.
  </div>
  <div class="smid-section">✈️ Aviation MRO Watchlist</div>
  <table class="smid-metrics-table">
  <thead><tr>
    <th style="text-align:left;">Name</th><th>Ticker</th><th>Price</th><th>Chg%</th>
    <th>Type</th><th>Market Cap</th><th>Key Catalyst</th>
  </tr></thead>
  <tbody>
    <tr><td style="color:#fff;font-weight:600;">HEICO Corporation</td><td>HEI</td>
      <td id="sp-HEI">—</td><td id="sc-HEI">—</td>
      <td><span class="tag tag-defense">PMA Parts</span></td><td>~$28B</td><td>PMA market share gains</td></tr>
    <tr><td style="color:#fff;font-weight:600;">TransDigm Group</td><td>TDG</td>
      <td id="sp-TDG">—</td><td id="sc-TDG">—</td>
      <td><span class="tag tag-defense">Proprietary Parts</span></td><td>~$70B</td><td>Acquisition + aftermarket pricing</td></tr>
    <tr><td style="color:#fff;font-weight:600;">AAR Corp</td><td>AIR</td>
      <td id="sp-AIR">—</td><td id="sc-AIR">—</td>
      <td><span class="tag tag-defense">MRO Services</span></td><td>~$2B</td><td>Government contract wins</td></tr>
  </tbody>
  </table>
</div>

</div><!-- end smid-wrap -->`;

export default function SmidSectors({ isActive, quotes }) {
  return (
    <div
      className={`tab-panel${isActive ? ' active' : ''}`}
      id="tab-sectors"
      dangerouslySetInnerHTML={{ __html: CONTENT }}
    />
  );
}
