import Constants from 'expo-constants';

const DEFAULT_BASE = Constants?.manifest?.extra?.backendBaseUrl || 'http://10.0.2.2:5004';
const BASE_URL = DEFAULT_BASE;

async function fetchWeatherByCoords(lat, lon) {
  const res = await fetch(`${BASE_URL}/api/weather/coordinates?lat=${lat}&lon=${lon}`);
  return res.json();
}

async function fetchWeatherSummary(lat, lon) {
  const res = await fetch(`${BASE_URL}/api/weather/summary?lat=${lat}&lon=${lon}`);
  return res.json();
}

async function fetchSafetyTips() {
  const res = await fetch(`${BASE_URL}/api/safety/tips`);
  return res.json();
}

async function fetchEmergencyProtocol(type) {
  const res = await fetch(`${BASE_URL}/api/safety/emergency/${encodeURIComponent(type)}`);
  return res.json();
}

export default {
  fetchWeatherByCoords,
  fetchWeatherSummary,
  fetchSafetyTips,
  fetchEmergencyProtocol
};
