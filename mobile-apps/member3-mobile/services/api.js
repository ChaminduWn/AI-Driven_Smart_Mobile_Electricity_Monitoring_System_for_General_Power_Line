import Constants from 'expo-constants';
import axios from 'axios';

// Compatibility: try expoConfig.extra first (newer SDKs), fall back to manifest
const extra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra ?? {};
const BASE_URL = extra.backendBaseUrl || 'http://192.168.1.4:5004';

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
  return res.data;
}

async function fetchWeatherSummary(lat, lon) {
  const res = await apiClient.get('/api/weather/summary', { params: { lat, lon } });
  return res.data;
}

async function fetchSafetyTips() {
  const res = await apiClient.get('/api/safety/tips');
  return res.data;
}

async function fetchEmergencyProtocol(type) {
  const res = await apiClient.get(`/api/safety/emergency/${encodeURIComponent(type)}`);
  console.log('Emergency Protocol Response:', res.data);
  return res.data;
}

export default {
  fetchWeatherByCoords,
  fetchWeatherSummary,
  fetchSafetyTips,
  fetchEmergencyProtocol,
};
