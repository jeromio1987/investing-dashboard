import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardApp from './DashboardApp.jsx';
import FantasyHome from './fantasy/FantasyHome.jsx';
import FantasyJoin from './fantasy/FantasyJoin.jsx';
import FantasyCreate from './fantasy/FantasyCreate.jsx';
import FantasyShell from './fantasy/FantasyShell.jsx';
import FantasyMarket from './fantasy/FantasyMarket.jsx';
import FantasyPortfolio from './fantasy/FantasyPortfolio.jsx';
import FantasyLeaderboard from './fantasy/FantasyLeaderboard.jsx';
import FantasyTransactions from './fantasy/FantasyTransactions.jsx';
import FantasyAdmin from './fantasy/FantasyAdmin.jsx';
import FantasyRecap from './fantasy/FantasyRecap.jsx';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<DashboardApp />} />
        <Route path="/fantasy" element={<FantasyHome />} />
        <Route path="/fantasy/join" element={<FantasyJoin />} />
        <Route path="/fantasy/create" element={<FantasyCreate />} />
        <Route path="/fantasy/play/:inviteCode" element={<FantasyShell />}>
          <Route index element={<Navigate to="portfolio" replace />} />
          <Route path="market" element={<FantasyMarket />} />
          <Route path="portfolio" element={<FantasyPortfolio />} />
          <Route path="transactions" element={<FantasyTransactions />} />
          <Route path="leaderboard" element={<FantasyLeaderboard />} />
          <Route path="recap" element={<FantasyRecap />} />
          <Route path="admin" element={<FantasyAdmin />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
