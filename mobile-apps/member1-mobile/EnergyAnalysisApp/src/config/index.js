// Centralized runtime config for API and WebSocket endpoints

// Use process.env directly for Expo 49+ / Web compatibility
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://172.28.21.71:8000/api/v1';
const WS_BASE = process.env.EXPO_PUBLIC_WS_URL || 'ws://172.28.21.71:8000';

console.log('🌐 API_BASE:', API_BASE);
console.log('🔌 WS_BASE:', WS_BASE);

export { API_BASE, WS_BASE };
