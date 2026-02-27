// Centralized runtime config for API and WebSocket endpoints
const envApi = typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL : undefined;
const envWs = typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_WS_URL : undefined;

const defaultLocalApi = (() => {
  if (typeof window !== 'undefined' && (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1')) {
    return 'http://localhost:8000/api/v1';
  }
  // For real devices and emulators on your network, use the current active IP
  return 'http://192.168.244.242:8000/api/v1';
})();

const API_BASE = envApi || defaultLocalApi;

// Derive WS base from API_BASE if EXPO_PUBLIC_WS_URL not provided
let WS_BASE = envWs;
if (!WS_BASE) {
  try {
    const _u = typeof URL !== 'undefined' ? new URL(API_BASE) : null;
    if (_u) {
      const wsProto = _u.protocol === 'https:' ? 'wss:' : 'ws:';
      WS_BASE = `${wsProto}//${_u.hostname}${_u.port ? `:${_u.port}` : ''}`;
    }
  } catch (e) {
    // Fallback by string replacement
    WS_BASE = API_BASE.replace(/^https?:/, (m) => (m === 'https:' ? 'wss:' : 'ws:')).replace(/\/api\/v1\/?$/, '');
  }
}

export { API_BASE, WS_BASE };
