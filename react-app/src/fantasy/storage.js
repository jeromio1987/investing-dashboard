const KEY = 'fantasy_players_v1';
const COMM = 'fantasy_commissioner_v1';
const WATCH = 'fantasy_watch_v1';
const LOCAL_BADGES = 'fantasy_local_badges_v1';

export function getPlayerId(inviteCode) {
  if (!inviteCode) return null;
  try {
    const m = JSON.parse(localStorage.getItem(KEY) || '{}');
    return m[String(inviteCode).toUpperCase()] || null;
  } catch {
    return null;
  }
}

export function setPlayerId(inviteCode, playerId) {
  const code = String(inviteCode).toUpperCase();
  let m = {};
  try {
    m = JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    m = {};
  }
  m[code] = playerId;
  localStorage.setItem(KEY, JSON.stringify(m));
}

export function getCommissionerToken(inviteCode) {
  if (!inviteCode) return null;
  try {
    const m = JSON.parse(localStorage.getItem(COMM) || '{}');
    return m[String(inviteCode).toUpperCase()] || null;
  } catch {
    return null;
  }
}

export function setCommissionerToken(inviteCode, token) {
  const code = String(inviteCode).toUpperCase();
  let m = {};
  try {
    m = JSON.parse(localStorage.getItem(COMM) || '{}');
  } catch {
    m = {};
  }
  m[code] = token;
  localStorage.setItem(COMM, JSON.stringify(m));
}

export function getFantasyWatchlist(inviteCode) {
  if (!inviteCode) return [];
  try {
    const m = JSON.parse(localStorage.getItem(WATCH) || '{}');
    return m[String(inviteCode).toUpperCase()] || [];
  } catch {
    return [];
  }
}

/** @param {Array<{ticker: string, asset_type: string}>} list */
export function setFantasyWatchlist(inviteCode, list) {
  const code = String(inviteCode).toUpperCase();
  let m = {};
  try {
    m = JSON.parse(localStorage.getItem(WATCH) || '{}');
  } catch {
    m = {};
  }
  m[code] = list.slice(0, 80);
  localStorage.setItem(WATCH, JSON.stringify(m));
}

/** @returns {Array<{id: string, label: string, description?: string}>} */
export function getLocalAchievementBadges(playerId) {
  if (!playerId) return [];
  try {
    const m = JSON.parse(localStorage.getItem(LOCAL_BADGES) || '{}');
    const list = m[String(playerId)] || [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** @param {{id: string, label: string, description?: string}} badge */
export function pushLocalAchievementBadge(playerId, badge) {
  if (!playerId || !badge?.id) return;
  const prev = getLocalAchievementBadges(playerId);
  if (prev.some(b => b.id === badge.id)) return;
  let m = {};
  try {
    m = JSON.parse(localStorage.getItem(LOCAL_BADGES) || '{}');
  } catch {
    m = {};
  }
  m[String(playerId)] = [...prev, { id: badge.id, label: badge.label, description: badge.description || '' }];
  localStorage.setItem(LOCAL_BADGES, JSON.stringify(m));
}
