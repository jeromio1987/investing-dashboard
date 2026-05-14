export const RADAR_DATA = [
  { name:'Uranium/Nuclear',   color:'#c084fc', scores:[3,3,2], verdict:'Strong Buy' },
  { name:'AI Infrastructure', color:'#fbbf24', scores:[3,3,2], verdict:'Strong Buy' },
  { name:'LNG/Gas Infra',     color:'#2dd4bf', scores:[3,2,2], verdict:'Buy'        },
  { name:'Energy E&P',        color:'#fb923c', scores:[2,3,2], verdict:'Buy'        },
  { name:'Defence SMID',      color:'#f97316', scores:[3,2,2], verdict:'Buy'        },
  { name:'Silver Miners',     color:'#a78bfa', scores:[2,3,2], verdict:'Buy'        },
  { name:'Gene Editing',      color:'#60a5fa', scores:[1,3,3], verdict:'Selective'  },
  { name:'Bio-AI',            color:'#f87171', scores:[2,3,2], verdict:'Selective'  },
  { name:'Psychedelics',      color:'#94a3b8', scores:[1,2,3], verdict:'Watch'      },
  { name:'Aviation MRO',      color:'#4ade80', scores:[2,1,1], verdict:'Watch'      },
];
export const RADAR_AXES  = ['Macro Fit','SMID Edge','Hype Opp'];
export const RADAR_AXIS_COLORS = ['#2dd4bf','#c084fc','#fbbf24'];
export const CAT_EVENTS = [
  { t:'NXE',   ev:'EA Final Decision',     wk:4,  col:'#c084fc', note:'Pass/fail on Environmental Assessment. Binary re-rate.' },
  { t:'POWL',  ev:'Q3 Earnings',           wk:6,  col:'#fbbf24', note:'Backlog + switchgear demand. Only 3 analysts cover this.' },
  { t:'UUUU',  ev:'Q2 Production Report',  wk:5,  col:'#a78bfa', note:'ISR uranium output numbers — spot price catalyst.' },
  { t:'NOG',   ev:'Q2 Earnings + Div',     wk:7,  col:'#fb923c', note:'Dividend declaration + acquisition pipeline update.' },
  { t:'KNTK',  ev:'Q2 Earnings',           wk:7,  col:'#2dd4bf', note:'Fee growth + new contract announcements.' },
  { t:'BEAM',  ev:'Ph2 Interim Data',      wk:9,  col:'#60a5fa', note:'BEAM-101 sickle cell. NTLA cross-read expected +15-25%.' },
  { t:'CIVI',  ev:'Analyst Day',           wk:10, col:'#f97316', note:'Capital allocation + buyback acceleration.' },
  { t:'KYMR',  ev:'Ph2 Data Readout',      wk:12, col:'#60a5fa', note:'PROTAC degrader. ARVN spillover possible.' },
  { t:'MNMD',  ev:'Ph3 PTSD Results',      wk:14, col:'#94a3b8', note:'Make-or-break for psychedelics sector re-rating.' },
];
