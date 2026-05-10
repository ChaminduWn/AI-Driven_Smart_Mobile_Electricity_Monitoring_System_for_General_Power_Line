import Constants from 'expo-constants';
import axios from 'axios';
import { normalizeWeatherData, normalizeEmergencyProtocol, normalizeSafetyTips } from './transformers';

// Compatibility: try expoConfig.extra first (newer SDKs), fall back to manifest
const extra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra ?? {};
const BASE_URL = extra.backendBaseUrl || 'http://192.168.64.109:5004';

const apiClient = axios.create({ baseURL: BASE_URL, timeout: 10000 });

// Basic logging to inspect calls in Metro / Expo logs
apiClient.interceptors.request.use(
  (req) => {
    console.log('[API Request]', req.method?.toUpperCase(), req.baseURL + req.url, req.params ?? req.data ?? '');
    return req;
  },
  (err) => {
    console.log('[API Request Error]', err?.message ?? err);
    return Promise.reject(err);
  }
);

apiClient.interceptors.response.use(
  (res) => {
    console.log('[API Response]', res.status, res.config.url);
    return res;
  },
  (err) => {
    console.log('[API Response Error]', err?.message ?? err);
    return Promise.reject(err);
  }
);

async function fetchWeatherByCoords(lat, lon) {
  const res = await apiClient.get('/api/weather/coordinates', { params: { lat, lon } });
  const payload = res.data ?? {};
  return {
    status: payload.status ?? 'success',
    message: payload.message,
    data: normalizeWeatherData(payload.data ?? payload),
    timestamp: payload.timestamp
  };
}

async function fetchWeatherSummary(lat, lon) {
  const res = await apiClient.get('/api/weather/summary', { params: { lat, lon } });
  const payload = res.data ?? {};
  return {
    status: payload.status ?? 'success',
    message: payload.message,
    data: normalizeWeatherData(payload.data ?? payload),
    timestamp: payload.timestamp
  };
}

async function fetchSafetyTips() {
  const res = await apiClient.get('/api/safety/tips');
  const payload = res.data ?? {};
  return {
    status: payload.status ?? 'success',
    message: payload.message,
    data: normalizeSafetyTips(payload.data ?? payload),
    timestamp: payload.timestamp
  };
}

async function fetchEmergencyProtocol(type) {
  const res = await apiClient.get(`/api/safety/emergency/${encodeURIComponent(type)}`);
  const payload = res.data ?? {};
  // Backend shape: { status, data: { disasterType, protocol: { before,during,after }, emergencyContacts }, timestamp }
  const raw = payload.data ?? payload;
  const protocolSource = raw.protocol ?? raw; // use nested protocol if present
  const normalizedProtocol = normalizeEmergencyProtocol(protocolSource);
  // Attach extra metadata (disasterType, emergencyContacts) so UI can show contacts or use the type
  const out = {
    ...normalizedProtocol,
    disasterType: raw.disasterType ?? type,
    emergencyContacts: raw.emergencyContacts ?? null
  };
  return {
    status: payload.status ?? 'success',
    message: payload.message,
    data: out,
    timestamp: payload.timestamp
  };
}

async function fetchAssistant(prompt) {
  const res = await apiClient.post('/api/assistant', { prompt });
  // Return raw payload so caller can access data.reply
  return res.data ?? { status: 'error', message: 'No response' };
}

export default {
  fetchWeatherByCoords,
  fetchWeatherSummary,
  fetchSafetyTips,
  fetchEmergencyProtocol,
  fetchAssistant
};
