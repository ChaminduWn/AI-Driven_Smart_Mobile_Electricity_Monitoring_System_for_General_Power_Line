import apiClient from './api';

const MEMBER4_BASE = '/api/member4';

export const member4Service = {
  // Weather Integration
  getCurrentWeather: (location) => apiClient.post(`${MEMBER4_BASE}/weather/current`, location),
  getWeatherAlerts: (location) => apiClient.post(`${MEMBER4_BASE}/weather/alerts`, location),
  
  // AI Safety Assistant (Chatbot)
  sendChatMessage: (message) => apiClient.post(`${MEMBER4_BASE}/chatbot/message`, { message }),
  getChatHistory: (userId) => apiClient.get(`${MEMBER4_BASE}/chatbot/history/${userId}`),
  
  // Emergency Protocols
  getEmergencyProtocols: (disasterType) => apiClient.get(`${MEMBER4_BASE}/emergency/protocols/${disasterType}`),
  
  // Safety Notifications
  getSafetyAlerts: (userId) => apiClient.get(`${MEMBER4_BASE}/safety/alerts/${userId}`),
  
  // Risk Assessment
  assessElectricalRisk: (data) => apiClient.post(`${MEMBER4_BASE}/safety/assess`, data),
};