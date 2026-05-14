import React, { createContext, useContext, useReducer, useEffect } from 'react';

const DashboardContext = createContext(null);

const STORAGE_KEY = 'investing_dashboard_state';

function getInitial() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    portPos:     [],   // portfolio positions
    journalEntries: [], // decision journal
    evSaved:     [],   // saved EV calculations
    corrTickers: ['NXE','UUUU','POWL','NOG','KNTK','BEAM'],
    liveData:    {},   // { TICKER: { price, prev, change, pct } }
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'PORT_ADD':
      return { ...state, portPos: [...state.portPos, action.payload] };
    case 'PORT_REMOVE':
      return { ...state, portPos: state.portPos.filter((_, i) => i !== action.idx) };
    case 'PORT_UPDATE_PRICES': {
      const updated = state.portPos.map(p => ({
        ...p,
        livePrice: state.liveData[p.ticker]?.price ?? p.livePrice,
      }));
      return { ...state, portPos: updated };
    }
    case 'JOURNAL_ADD':
      return { ...state, journalEntries: [action.payload, ...state.journalEntries] };
    case 'JOURNAL_REMOVE':
      return { ...state, journalEntries: state.journalEntries.filter(e => e.id !== action.id) };
    case 'JOURNAL_RESOLVE': {
      const entries = state.journalEntries.map(e =>
        e.id === action.id ? { ...e, ...action.update } : e
      );
      return { ...state, journalEntries: entries };
    }
    case 'EV_SAVE':
      return { ...state, evSaved: [action.payload, ...state.evSaved] };
    case 'EV_REMOVE':
      return { ...state, evSaved: state.evSaved.filter((_, i) => i !== action.idx) };
    case 'CORR_ADD': {
      if (state.corrTickers.includes(action.ticker)) return state;
      return { ...state, corrTickers: [...state.corrTickers, action.ticker] };
    }
    case 'CORR_REMOVE':
      return { ...state, corrTickers: state.corrTickers.filter(t => t !== action.ticker) };
    case 'LIVE_DATA':
      return { ...state, liveData: action.data };
    default:
      return state;
  }
}

export function DashboardProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitial);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  return (
    <DashboardContext.Provider value={{ state, dispatch }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider');
  return ctx;
}
