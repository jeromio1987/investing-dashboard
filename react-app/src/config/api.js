/** Backend base URL (FastAPI). Override with VITE_API_URL in .env */
export const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8765').replace(/\/$/, '');
