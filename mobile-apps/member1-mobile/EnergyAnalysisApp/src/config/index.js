// Use environment variables for API and WebSocket endpoints (Expo 49+)
const API_ENV = process.env.EXPO_PUBLIC_API_URL;
const WS_ENV = process.env.EXPO_PUBLIC_WS_URL;

// If explicitly provided, use it. Otherwise, base it on API_ENV (replaces http -> ws)
const API_BASE = API_ENV || 'http://localhost:8000/api/v1';
const WS_BASE = WS_ENV && WS_ENV.includes('/api/v1')
    ? WS_ENV
    : API_BASE.replace(/^http/, 'ws');

if (!API_ENV) {
    console.warn('⚠️ WARNING: EXPO_PUBLIC_API_URL is not defined in .env - falling back to localhost');
}

console.log('🌐 API_BASE:', API_BASE);
console.log('🔌 WS_BASE:', WS_BASE);

export { API_BASE, WS_BASE };
