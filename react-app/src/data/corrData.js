export const CORR_SECTOR_MAP = {
  'Uranium':        { factor:'Nuclear/Uranium', color:'#c084fc' },
  'AI Infrastructure': { factor:'AI Infrastructure', color:'#fbbf24' },
  'LNG/Gas':        { factor:'Energy/Commodities', color:'#2dd4bf' },
  'Energy E&P':     { factor:'Energy/Commodities', color:'#fb923c' },
  'Defence':        { factor:'Defence/Geopolitical', color:'#f97316' },
  'Silver/Metals':  { factor:'Metals/Macro', color:'#a78bfa' },
  'Gene Editing':   { factor:'Biotech/Gene', color:'#60a5fa' },
  'Bio-AI':         { factor:'Biotech/Gene', color:'#f87171' },
  'Psychedelics':   { factor:'Speculative Biotech', color:'#94a3b8' },
  'Aviation MRO':   { factor:'Industrials', color:'#4ade80' },
  'Broad Market':   { factor:'Broad Market', color:'#64748b' },
};
export const CORR_FACTOR_BASE = {
  'Nuclear/Uranium_Nuclear/Uranium': 0.92,
  'AI Infrastructure_AI Infrastructure': 0.85,
  'Energy/Commodities_Energy/Commodities': 0.80,
  'Defence/Geopolitical_Defence/Geopolitical': 0.75,
  'Metals/Macro_Metals/Macro': 0.78,
  'Biotech/Gene_Biotech/Gene': 0.72,
  'Speculative Biotech_Speculative Biotech': 0.65,
  'Industrials_Industrials': 0.70,
  'Broad Market_Broad Market': 0.90,
  // cross-factor
  'Energy/Commodities_Nuclear/Uranium': 0.45,
  'Energy/Commodities_Metals/Macro': 0.42,
  'Nuclear/Uranium_Metals/Macro': 0.35,
  'AI Infrastructure_Broad Market': 0.55,
  'Defence/Geopolitical_Energy/Commodities': 0.30,
  'Biotech/Gene_Speculative Biotech': 0.55,
  'Biotech/Gene_AI Infrastructure': 0.25,
};
export const corrTickers = [
  { t:'NXE',  s:'Uranium' },
  { t:'UUUU', s:'Uranium' },
  { t:'POWL', s:'AI Infrastructure' },
  { t:'NOG',  s:'Energy E&P' },
  { t:'KNTK', s:'LNG/Gas' },
  { t:'BEAM', s:'Gene Editing' },
];

// ── Ticker → sector mapping for getCorrEstimate() ──────────────────────────
// Add tickers here as you expand your watchlist
export const TICKER_SECTOR = {
  // Uranium
  NXE: 'Uranium', UUUU: 'Uranium', CCJ: 'Uranium', URA: 'Uranium',
  // AI Infrastructure
  POWL: 'AI Infrastructure', VRT: 'AI Infrastructure', GEV: 'AI Infrastructure', NET: 'AI Infrastructure',
  // LNG / Gas
  KNTK: 'LNG/Gas', LNG: 'LNG/Gas', WMB: 'LNG/Gas', TRGP: 'LNG/Gas',
  // Energy E&P
  NOG: 'Energy E&P', COP: 'Energy E&P', XOM: 'Energy E&P',
  // Defence
  RHM: 'Defence', SAAB: 'Defence', RTX: 'Defence',
  // Silver / Metals
  SLV: 'Silver/Metals', PAAS: 'Silver/Metals', AG: 'Silver/Metals',
  FCX: 'Silver/Metals', SCCO: 'Silver/Metals',
  // Gene Editing / Biotech
  BEAM: 'Gene Editing', NTLA: 'Gene Editing', CRSP: 'Gene Editing',
  // Bio-AI
  RXRX: 'Bio-AI', SDGR: 'Bio-AI',
  // Speculative
  IONQ: 'Psychedelics',
  // Broad Market
  SPY: 'Broad Market', QQQ: 'Broad Market', GLD: 'Broad Market',
};
