// ─── Environment Variables (Expo 49+) ─────────────────────────────────────────
const SERVER_IP = process.env.EXPO_PUBLIC_SERVER_IP;
const API_ENV = process.env.EXPO_PUBLIC_API_URL;
const WS_ENV = process.env.EXPO_PUBLIC_WS_URL;

// ─── Fallback Configuration ──────────────────────────────────────────────────
// Update FALLBACK_IP if your PC's IP changes (check with `ipconfig` on Windows).
const FALLBACK_IP = '192.168.24.242'; 
const FALLBACK_API = `http://${FALLBACK_IP}:8000/api/v1`;
const FALLBACK_WS = `ws://${FALLBACK_IP}:8000/api/v1`;

// ─── Final Endpoints ─────────────────────────────────────────────────────────
// Priority: SERVER_IP > Specific Env Vars > Fallback
const API_BASE = SERVER_IP ? `http://${SERVER_IP}:8000/api/v1` : (API_ENV || FALLBACK_API);
const WS_BASE = SERVER_IP ? `ws://${SERVER_IP}:8000/api/v1` : (WS_ENV || FALLBACK_WS);

if (!SERVER_IP && !API_ENV) {
    console.warn('⚠️  Neither EXPO_PUBLIC_SERVER_IP nor EXPO_PUBLIC_API_URL set — using fallback:', FALLBACK_API);
}

console.log('🌐 API_BASE:', API_BASE);
console.log('🔌 WS_BASE:', WS_BASE);

export { API_BASE, WS_BASE };