export const SMID_STOCKS = {
  NOG: {
    name: "Northern Oil & Gas", theme: "Energy", sub: "Non-Op E&P",
    float: "~130M sh / ~$3.5B", shortPct: "4–6%", shortDays: "2–3",
    analysts: 8, runway: "N/A (profitable)", insider: "CEO bought 2024",
    avgVol: "$30M/day", cap: "Mid",
    preview: "#1 mover: WTI price (2-3× daily beta). #2: Variable dividend surprise each quarter.",
    drivers: [
      { rank:1, text:"WTI oil price — 2–3× daily beta. When oil moves 3%, NOG moves 6–9%. Primary driver of 80% of weekly volatility.", move:"+/−20-40% per major WTI cycle", type:"both" },
      { rank:2, text:"Variable dividend declaration — NOG returns ~50% of FCF as variable dividend quarterly. When the number beats expectations, stock pops 5–10% on the day.", move:"+5–12% on beat", type:"pos" },
      { rank:3, text:"Acquisition announcements — NOG buys non-operated working interests in shale basins. Accretive deals at <4× EBITDA move stock +8–15%.", move:"+8–15% good deal", type:"pos" },
      { rank:4, text:"Quarterly production beat — Volumes above guidance signal better-than-expected basin productivity. Small but consistent move.", move:"+3–7%", type:"pos" },
      { rank:5, text:"Hedging book reveal — Heavy hedges cap upside in bull market (stock lags peers). Light hedges = more oil beta (outperforms).", move:"±5% vs peers", type:"both" }
    ],
    nextCatalyst: { event:"Q2 2026 Earnings + Variable Dividend Declaration", timing:"~Late July 2026", bull:"WTI >$75 → $0.45–0.55/sh variable div expected → stock +5–10%", bear:"WTI <$65 → reduced/no variable div → stock −10–15%", sizing:"Full position before earnings only if WTI >$70 for 3+ weeks. Otherwise wait for the print." }
  },
  CIVI: {
    name: "Civitas Resources", theme: "Energy", sub: "DJ Basin + Permian E&P",
    float: "~75M sh / ~$4B", shortPct: "5–8%", shortDays: "2–4",
    analysts: 14, runway: "N/A (profitable)", insider: "Neutral",
    avgVol: "$80M/day", cap: "Mid",
    preview: "#1: WTI × leverage (Permian debt story). #2: Variable dividend at 50% FCF. #3: Consolidation M&A target.",
    drivers: [
      { rank:1, text:"WTI oil price × leverage — CIVI added debt via Permian acquisitions. High oil = massive FCF for deleveraging; low oil = balance sheet concern. The leverage amplifies the oil move.", move:"+/−30–50% through WTI cycle", type:"both" },
      { rank:2, text:"Variable dividend amount — 50% of FCF paid quarterly as variable dividend. At $75 WTI this is ~$8–10/sh/yr implied yield. The surprise magnitude moves stock.", move:"+5–15% beat", type:"pos" },
      { rank:3, text:"Permian integration progress — Market bought the DJ Basin company doing Permian M&A. Well results from Permian confirm/deny the thesis. First 12 months of data are high-information.", move:"+10–20% beat", type:"pos" },
      { rank:4, text:"M&A takeout speculation — CIVI has been a roll-up and a target. Any deal rumors from XOM, COP, CVX → 20–35% spike on the day.", move:"+20–40% rumor/confirm", type:"pos" },
      { rank:5, text:"Leverage ratio updates — Net debt / EBITDA trajectory is watched. Crossing below 1.0× = re-rating event. Any delay → pressure.", move:"±8–12%", type:"both" }
    ],
    nextCatalyst: { event:"Q2 2026 Earnings + Variable Dividend + Permian Update", timing:"~Late July 2026", bull:"WTI >$75, Permian wells beating type curve → max dividend → stock to $90+", bear:"WTI <$65, Permian disappoints → dividend cut + leverage concern → stock to $55–60", sizing:"Stage entry. 50% on dip below $70, 50% on Q1 print if Permian commentary positive." }
  },
  MTDR: {
    name: "Matador Resources", theme: "Energy", sub: "Delaware Basin E&P",
    float: "~80M sh / ~$4.5B", shortPct: "5–9%", shortDays: "2–4",
    analysts: 16, runway: "N/A (profitable)", insider: "Modest buys",
    avgVol: "$80M/day", cap: "Mid",
    preview: "#1: Delaware Basin well productivity per quarter. #2: San Mateo midstream JV value. #3: WTI price.",
    drivers: [
      { rank:1, text:"Delaware Basin well productivity — MTDR is a pure-play Delaware Basin (Permian sub-basin) name. Quarterly IP-30 rates and EURs vs type curve drive the thesis. One good/bad well season = 15–25% move.", move:"+15–25% strong season", type:"pos" },
      { rank:2, text:"San Mateo midstream JV — MTDR owns ~50% of San Mateo (midstream/processing). Volume growth there is a hidden value driver. Market underpays for this consistently.", move:"+8–12% JV beat", type:"pos" },
      { rank:3, text:"WTI price direct beta — Delaware is high-oil-cut. Each $10/bbl WTI move = ~$200M FCF change. More pure-play oil than CIVI.", move:"+/−20–35% through cycle", type:"both" },
      { rank:4, text:"Quarterly earnings beat — Production volumes vs guidance is the key metric. MTDR has a history of beating; a miss is punished hard.", move:"+8–15% beat / −12–18% miss", type:"both" },
      { rank:5, text:"M&A speculation — Delaware Basin consolidation (COP-Marathon, XOM-Pioneer) keeps MTDR in rotation as a target. Pure-play quality asset.", move:"+20–35% on rumors", type:"pos" }
    ],
    nextCatalyst: { event:"Q2 2026 Earnings — Well Productivity Report", timing:"~Late July 2026", bull:"IP-30 rates >1,200 BOE/d avg, production beat → +12–20%", bear:"Well underperformance, costs rise → −15–20%", sizing:"Small position pre-earnings (binary). Size up on confirmation of well quality in print." }
  },
  KNTK: {
    name: "Kinetik Holdings", theme: "Energy", sub: "Permian Midstream",
    float: "~120M sh / ~$6B", shortPct: "2–4%", shortDays: "2–3",
    analysts: 10, runway: "N/A (profitable)", insider: "Neutral",
    avgVol: "$25M/day", cap: "Mid",
    preview: "#1: Permian throughput volumes. #2: Distribution declaration (6%+ yield). #3: Long-term contract wins.",
    drivers: [
      { rank:1, text:"Permian Basin throughput volumes — KNTK gathers, processes, and transports Permian gas. Volume growth = revenue growth. Quarterly throughput vs guidance is the key metric.", move:"+8–12% beat", type:"pos" },
      { rank:2, text:"Distribution declaration amount — KNTK yields 6%+. Any increase in distribution surprises the market. Cuts are catastrophic (-20%+).", move:"+5–10% increase / −20%+ cut", type:"both" },
      { rank:3, text:"Long-term contract announcements — New gathering agreements with Permian producers signal volume visibility. Large deals move stock.", move:"+5–10% large deal", type:"pos" },
      { rank:4, text:"Leverage/credit rating — Midstream is levered. Rating upgrades → cost of capital falls → re-rate. Watch debt/EBITDA trajectory.", move:"+8–12% upgrade", type:"pos" },
      { rank:5, text:"Permian rig count — Leading indicator for future volumes. Sharp drop in Permian rigs → future throughput concern 6–9 months out.", move:"−5–10% lag effect", type:"neg" }
    ],
    nextCatalyst: { event:"Q2 2026 Earnings + Distribution Update", timing:"~Late July 2026", bull:"Throughput +5% vs Q1, distribution maintained/raised → income investors bid up → +8–12%", bear:"Volume shortfall from producer curtailments → distribution concern → −15%", sizing:"Buy for the distribution yield. Add when yield exceeds 6.5% (stock dips)." }
  },
  POWL: {
    name: "Powell Industries", theme: "AI Infra", sub: "Electrical Switchgear",
    float: "~12M sh / ~$2B", shortPct: "6–10%", shortDays: "5–8",
    analysts: 3, runway: "N/A (profitable, no debt)", insider: "Consistent buying by CEO",
    avgVol: "$8M/day", cap: "Small",
    preview: "#1: Earnings backlog conversion + gross margin (4x/year, HUGE moves). #2: Very thin coverage = analyst initiation moves +8–15%.",
    drivers: [
      { rank:1, text:"Quarterly earnings — backlog-to-revenue conversion + gross margin guidance. ONLY 3 ANALYSTS COVER IT. Street estimates are wide → beats are frequent → +15–30% on a good quarter. This is the primary event.", move:"+15–30% big beat / −15–20% miss", type:"both" },
      { rank:2, text:"Backlog size and mix — the % of backlog from data centers vs oil/gas/industrial is the hidden alpha. Market doesn't know how much is data center. When management discloses, the re-rating happens.", move:"+10–20% first DC disclosure", type:"pos" },
      { rank:3, text:"Analyst initiation — With only 3 coverage analysts, a new major initiation (BUY from Baird, Stifel, etc.) can move the stock 8–15% on the day alone.", move:"+8–15% new initiation", type:"pos" },
      { rank:4, text:"Insider buying — CEO consistently buys stock on dips. Not large amounts but the signal is reliable for a company this size. Every purchase disclosed on Form 4.", move:"+3–6% signal effect", type:"pos" },
      { rank:5, text:"Short squeeze potential — 6–10% of float short + low daily volume = any earnings beat triggers a squeeze. Days-to-cover 5–8 = fuel for extended moves.", move:"+20–40% squeeze scenario", type:"pos" }
    ],
    nextCatalyst: { event:"Q3 FY2026 Earnings (July–September quarter, reports ~Nov 2026)", timing:"~November 2026", bull:"Backlog >$900M, GM >25%, data center mix explicit commentary → +20–30%", bear:"Margin compression, order slowdown → −15–20%", sizing:"This is a pre-earnings hold. The move IS the earnings. Don't trade in-between — the liquidity is too thin. Size at 1.5–2% max given float." }
  },
  AAON: {
    name: "AAON Inc", theme: "AI Infra", sub: "Data Center HVAC/Cooling",
    float: "~51M sh / ~$3.5B", shortPct: "3–6%", shortDays: "3–5",
    analysts: 7, runway: "N/A (profitable)", insider: "Founder-led, modest selling",
    avgVol: "$20M/day", cap: "Mid",
    preview: "#1: Gross margin trajectory (AAON is the premium HVAC maker — margin IS the story). #2: Data center HVAC commentary.",
    drivers: [
      { rank:1, text:"Gross margin — AAON's moat is 30%+ gross margins in a commodity HVAC market. Any quarter where margins compress → stock punished. Expansion → strong re-rate. This is the single most watched metric.", move:"+10–15% expansion / −12–18% compression", type:"both" },
      { rank:2, text:"Data center HVAC order growth — Management commentary on data center cooling bookings has directly moved the stock +10–15% when explicit. The market wants to know: is AAON in the AI cooling cycle?", move:"+10–15% first explicit DC data", type:"pos" },
      { rank:3, text:"Revenue growth vs guidance — AAON manages backlog well. Production throughput beats → stock moves. A miss signals demand or manufacturing issue.", move:"+8–12% beat", type:"pos" },
      { rank:4, text:"Commercial HVAC cycle — Broader commercial construction drives base demand. Rising starts = tailwind; falling ABI (Architecture Billings Index) = early warning for slowdown 12–18mo out.", move:"±5–8% cycle signal", type:"both" },
      { rank:5, text:"Competitor data (Vertiv, Schneider) — When VRT or SBGSY report massive data center cooling demand, AAON often moves sympathetically (+5–8%) as market models spillover.", move:"+5–8% sympathetic", type:"pos" }
    ],
    nextCatalyst: { event:"Q2 2026 Earnings — Gross Margin + DC Commentary", timing:"~August 2026", bull:"GM >30%, DC HVAC bookings commentary explicit → stock re-rates above $80", bear:"Margin compression <27% → −12–18%", sizing:"Buy before any print where GM trend is stable. Sell half on a big beat (+15%), ride the rest." }
  },
  BEAM: {
    name: "Beam Therapeutics", theme: "Bio-AI", sub: "Base Editing Platform",
    float: "~65M sh / ~$1.5B", shortPct: "8–14%", shortDays: "6–10",
    analysts: 14, runway: "~24–30 months", insider: "Net neutral",
    avgVol: "$30M/day", cap: "Mid",
    preview: "#1: BEAM-101 clinical data (2026 BINARY). #2: Partnership/licensing deals (platform value). #3: Cash runway.",
    drivers: [
      { rank:1, text:"BEAM-101 clinical data (sickle cell / β-thalassemia) — The make-or-break catalyst for 2026. Phase 1/2 durability and safety data. Positive = 50–100% up. Failed safety = 60–80% down. Nothing else matters more.", move:"+50–100% good / −60–80% bad", type:"both" },
      { rank:2, text:"Licensing/partnership deals — BEAM's base editing IP is licensable. A deal with Pfizer, BMS, Regeneron, Lilly → +20–35% on announcement. Platform validation without clinical risk.", move:"+20–35% deal", type:"pos" },
      { rank:3, text:"FDA Fast Track / Breakthrough Therapy designation — For BEAM-101 or BEAM-302. Breakthrough = +10–15% signal that FDA sees strong early data.", move:"+10–15% breakthrough", type:"pos" },
      { rank:4, text:"Competitor data read-across — CRSP approval, NTLA positive data → validates base/prime/CRISPR editing field → BEAM +10–20% sympathetically. CRSP failure = field de-rating −15–20%.", move:"+10–20% field validation", type:"both" },
      { rank:5, text:"Cash runway update — BEAM burns ~$60–70M/quarter. Below 18 months runway → dilutive equity raise risk. Market de-rates pre-raise by 15–25%.", move:"−15–25% on raise signal", type:"neg" }
    ],
    nextCatalyst: { event:"BEAM-101 Phase 1/2 Updated Clinical Data", timing:"H2 2026 (conference or standalone readout)", bull:"12+ month durability >90% HbF, no off-target events → stock to $30–35", bear:"Efficacy fade or SAE → stock to $8–12", sizing:"Max 1% portfolio. Pre-position 4–6 weeks before known conference. Never add to a loser. Define exit at −35% entry." }
  },
  NTLA: {
    name: "Intellia Therapeutics", theme: "Bio-AI", sub: "In Vivo CRISPR",
    float: "~70M sh / ~$2B", shortPct: "7–12%", shortDays: "5–8",
    analysts: 17, runway: "~24–30 months", insider: "Net neutral",
    avgVol: "$45M/day", cap: "Mid",
    preview: "#1: NTLA-2001 TTR Phase 3 data (pivotal, world's first in vivo CRISPR trial). #2: HAE program. #3: Regeneron partnership.",
    drivers: [
      { rank:1, text:"NTLA-2001 Phase 3 TTR data — This is the first in vivo CRISPR gene editing in a large Phase 3 trial. Positive interim = re-rates entire CRISPR field + NTLA 60–100%. The asymmetry is massive. Safety event = catastrophic for the platform.", move:"+60–100% good / −70–80% bad", type:"both" },
      { rank:2, text:"NTLA-2002 HAE Phase 3 — Hereditary angioedema. A large commercial market. Phase 3 data in 2026. This is the commercial engine if approved.", move:"+30–50% positive Ph3", type:"pos" },
      { rank:3, text:"Regeneron partnership milestones — Regeneron owns ~9% and has co-development rights. Milestone payments signal progress + validate platform.", move:"+8–15% milestone", type:"pos" },
      { rank:4, text:"Competing CRISPR data (CRSP, BEAM, EDIT) — Ex vivo CRISPR approval validates editing field broadly. Market assigns NTLA in vivo premium. Any competing failure chips at the field.", move:"+8–15% field beat", type:"both" },
      { rank:5, text:"Cash position quarterly update — ~$600M–700M cash. $60–80M/quarter burn. Below 18 months → capital raise at bad valuation. Market tracks this closely.", move:"−10–20% raise signal", type:"neg" }
    ],
    nextCatalyst: { event:"NTLA-2001 Phase 3 Interim Analysis + NTLA-2002 Phase 3 Data", timing:"H2 2026 (NTLA-2001 interim) / 2026–2027 (2002)", bull:"NTLA-2001 interim meets efficacy + no safety → stock to $40–50; 2002 approval → commercial story", bear:"Safety event in TTR program → field reset → $8–15", sizing:"0.75–1% max. Split: 60% on NTLA-2001 thesis, 40% on 2002 commercial." }
  },
  ARVN: {
    name: "Arvinas Inc", theme: "Bio-AI", sub: "PROTAC Targeted Protein Degradation",
    float: "~60M sh / ~$1.5B", shortPct: "9–15%", shortDays: "6–10",
    analysts: 16, runway: "~24 months", insider: "Pfizer owns ~10%",
    avgVol: "$35M/day", cap: "Mid",
    preview: "#1: Vepdegestrant Phase 3 breast cancer (pivotal 2026-27). #2: Pfizer partnership (milestone + validation). #3: PROTAC IP platform.",
    drivers: [
      { rank:1, text:"Vepdegestrant (ARV-471) Phase 3 breast cancer data — vs Faslodex in ER+/HER2− breast cancer. This is a $3–4B revenue opportunity if approved. Pivotal data in 2026–27 is the defining catalyst. Beat = 100%+ revaluation.", move:"+80–150% positive Ph3 / −60–70% failed", type:"both" },
      { rank:2, text:"Pfizer partnership milestones — Pfizer co-develops vepdegestrant and owns ~10%. Milestone payments from Pfizer validate the Phase 3 data path and the commercial deal economics.", move:"+15–25% milestone achieved", type:"pos" },
      { rank:3, text:"KYMR / PROTAC cross-read — Kymera Therapeutics uses the same PROTAC platform for different targets. KYMR positive Phase 2 data = validates degrader modality = ARVN +8–15% sympathetically.", move:"+8–15% platform validation", type:"pos" },
      { rank:4, text:"ASCO / ESMO conference presentations — Breast cancer data presented at major oncology conferences. Updated waterfall plots, PFS data → market reacts immediately.", move:"+10–30% surprise presentation", type:"pos" },
      { rank:5, text:"Cash runway + dilution risk — ~18–24 months runway. Vepdegestrant Ph3 costs are high. Market nervous about raise before pivotal data.", move:"−15–20% pre-raise signal", type:"neg" }
    ],
    nextCatalyst: { event:"Vepdegestrant Phase 3 PFS Interim / ASCO 2026 Data Cut", timing:"2026 ASCO (June) + Pivotal readout 2026–27", bull:"PFS benefit shown vs Faslodex → Pfizer commercializes → stock $35–45", bear:"No PFS benefit, toxicity → stranded asset → $6–10", sizing:"0.75% max pre-data. Pfizer involvement gives floor support. Consider buying post-ASCO data if early signals positive." }
  },
  KYMR: {
    name: "Kymera Therapeutics", theme: "Bio-AI", sub: "PROTAC Degraders",
    float: "~50M sh / ~$1.2B", shortPct: "9–15%", shortDays: "7–10",
    analysts: 12, runway: "~18–24 months", insider: "Net neutral",
    avgVol: "$15M/day", cap: "Small",
    preview: "#1: KT-621 Phase 2 atopic derm data (2026 KEY). #2: PROTAC platform validation across any program. #3: Cash < 18mo = dilution risk.",
    drivers: [
      { rank:1, text:"KT-621 Phase 2 atopic dermatitis data — First PROTAC in a large Phase 2 for a non-oncology indication. Proof-of-concept that degraders work in immunology = massive platform value. Positive = 60–100% move, potential partner bids.", move:"+60–100% good / −50–60% bad", type:"both" },
      { rank:2, text:"STAT3/IRAK4 degrader partnerships — Pharma partnerships for KYMR's degrader IP validate the platform outside clinical data. Any large deal = +25–40%.", move:"+25–40% deal", type:"pos" },
      { rank:3, text:"ARVN vepdegestrant read-across — ARVN and KYMR use the same PROTAC mechanism. Strong ARVN data before KYMR data = 'degraders work' → KYMR +10–20%.", move:"+10–20% ARVN beat", type:"pos" },
      { rank:4, text:"Cash position — ~$400–500M cash, ~$50M/quarter burn. Below 18 months runway → equity raise at bad timing. At this market cap, raises are dilutive.", move:"−15–25% raise signal", type:"neg" },
      { rank:5, text:"Analyst initiation on thin coverage — 12 analysts for a $1.2B name is moderate. A major bank initiation BUY = +8–12% day-one move plus follow-on accumulation.", move:"+8–12% new initiation", type:"pos" }
    ],
    nextCatalyst: { event:"KT-621 Phase 2 Atopic Dermatitis Readout", timing:"H2 2026 (exact date unconfirmed)", bull:"Efficacy signal in atopic derm, DLQI improvement, clean safety → $25–30", bear:"No efficacy, toxicity signal → stranded → $5–8", sizing:"0.5% max. Smallest position in the PROTAC basket. KT-621 is the first non-oncology PROTAC Phase 2 — the read is the read." }
  },
  NXE: {
    name: "NexGen Energy", theme: "Energy", sub: "Uranium Development",
    float: "~550M sh / ~$3.5B", shortPct: "3–5%", shortDays: "2–3",
    analysts: 9, runway: "Pre-revenue; $400M+ cash", insider: "Management buying",
    avgVol: "$15M/day", cap: "Mid",
    preview: "#1: Uranium spot price (weekly). #2: Arrow project Environmental Assessment milestones. #3: US utility long-term contract signings.",
    drivers: [
      { rank:1, text:"Uranium spot price (weekly UxC/TradeTech) — NXE is a leveraged uranium option. Arrow is the largest undeveloped uranium project in the world. Spot moves directly translate: +$5/lb uranium = NXE +10–15%. The entire sector trades on this.", move:"+10–15% per +$5/lb uranium", type:"both" },
      { rank:2, text:"Saskatchewan Environmental Assessment milestones — Arrow needs a federal + provincial EA. Each milestone (panel hearings complete, draft report, final approval) triggers re-rating because timeline uncertainty drops. EA approval = production timeline visible.", move:"+20–30% EA key milestone", type:"pos" },
      { rank:3, text:"US utility long-term uranium contract signings — Utilities signing 10–20yr supply contracts with any miner signal nuclear renaissance is real. These don't involve NXE directly but validate the entire thesis.", move:"+8–15% industry contract", type:"pos" },
      { rank:4, text:"Capital raise timing and structure — NXE needs to raise $2–3B for construction. Market discount pre-raise; pricing and partner quality (Korean utility, Japanese utility) determines if raise is accretive.", move:"+15–25% strategic JV / −10–15% dilutive raise", type:"both" },
      { rank:5, text:"Global nuclear policy news — France extending reactors, Japan restarts, US SMR approvals, EU taxonomy nuclear inclusion. Each piece builds the demand picture.", move:"+5–10% per policy win", type:"pos" }
    ],
    nextCatalyst: { event:"Arrow Project EA Decision / Uranium Spot + Utility Contracting Wave", timing:"EA decision possible 2026–27; Contracting wave: ongoing", bull:"EA approved → production timeline clear → stock $9–12; Uranium >$90/lb → additional premium", bear:"EA delayed 2+ years → discount widens; Uranium <$60/lb → sector de-rates", sizing:"1% max. This is a 3–7yr position. Don't trade the weekly spot moves. Buy the EA milestone, hold for construction approval." }
  },
  UUUU: {
    name: "Energy Fuels Inc", theme: "Energy", sub: "Uranium + Rare Earths",
    float: "~165M sh / ~$800M", shortPct: "4–7%", shortDays: "3–5",
    analysts: 6, runway: "Pre-major-production; $200M+ cash", insider: "Management buys",
    avgVol: "$10M/day", cap: "Small",
    preview: "#1: Uranium spot price. #2: Rare earth (REE) processing milestones (the differentiator). #3: US DOE policy / uranium reserve program.",
    drivers: [
      { rank:1, text:"Uranium spot price — White Mesa Mill is the only conventional uranium mill operating in the US. Spot price directly drives processing economics. More volatile than NXE because of smaller float.", move:"+15–25% per major spot spike", type:"both" },
      { rank:2, text:"Rare earth separation milestones — UUUU is extracting rare earth carbonate at White Mesa as a uranium mill by-product. First RE separation facility in the US. RE milestones move the stock on the 'critical minerals' narrative.", move:"+15–25% milestone announcement", type:"pos" },
      { rank:3, text:"US Government uranium reserve program / Section 232 — DOE buying domestic uranium, banning Russian imports, Section 232 tariffs on foreign uranium all benefit UUUU as the domestic producer.", move:"+10–20% per policy win", type:"pos" },
      { rank:4, text:"Quarterly production numbers — Uranium production volumes at White Mesa + vanadium by-product. Beat vs expectations.", move:"+8–12% beat", type:"pos" },
      { rank:5, text:"Analyst initiations (very thin, 6 analysts) — New coverage from a uranium-specialist desk (Cantor, Roth, National Bank) moves the stock 8–15% day one.", move:"+8–15% initiation", type:"pos" }
    ],
    nextCatalyst: { event:"Q2 2026 Production Report + REE Separation Update", timing:"~August 2026", bull:"REE commercial-scale separation confirmed, uranium production on track, spot >$75 → $7–9/sh", bear:"Production miss, REE delays, spot <$65 → $3–4/sh", sizing:"0.5–0.75% max. High volatility small cap. Use as a higher-beta uranium bet alongside NXE. REE optionality is the unique angle." }
  }
};

export const PORT_SMID_SECS = ['Uranium/Nuclear','LNG/Gas','Energy E&P',
  'Silver/Metals','Biotech/Gene','Bio-AI','Psychedelics'];

export const PORT_SECTOR_COLORS = {
  'AI Infrastructure':'#fbbf24','Uranium/Nuclear':'#c084fc',
  'LNG/Gas':'#2dd4bf','Energy E&P':'#fb923c','Defence':'#f97316',
  'Silver/Metals':'#a78bfa','Biotech/Gene':'#60a5fa','Bio-AI':'#f87171',
  'Psychedelics':'#94a3b8','Aviation MRO':'#4ade80','Other':'#64748b'
};
