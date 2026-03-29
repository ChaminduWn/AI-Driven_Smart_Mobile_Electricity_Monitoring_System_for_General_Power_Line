// Use environment variables for API and WebSocket endpoints (Expo 49+)
const API_ENV = process.env.EXPO_PUBLIC_API_URL;
const WS_ENV = process.env.EXPO_PUBLIC_WS_URL;

// ─── Fallback IP ─────────────────────────────────────────────────────────────
// If EXPO_PUBLIC_API_URL is not set in .env, use the PC's local network IP.
// Update this IP if your PC's IP changes (check with `ipconfig` on Windows).
const FALLBACK_API = 'http://192.168.196.242:8000/api/v1';
const FALLBACK_WS = 'ws://192.168.196.242:8000/api/v1';

const API_BASE = API_ENV || FALLBACK_API;
const WS_BASE = WS_ENV || FALLBACK_WS;

if (!API_ENV) {
    console.warn('⚠️  EXPO_PUBLIC_API_URL not set — using fallback:', FALLBACK_API);
}

console.log('🌐 API_BASE:', API_BASE);
console.log('🔌 WS_BASE:', WS_BASE);

export { API_BASE, WS_BASE };