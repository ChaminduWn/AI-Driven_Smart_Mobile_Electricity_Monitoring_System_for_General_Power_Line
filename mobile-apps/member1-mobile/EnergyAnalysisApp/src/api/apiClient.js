import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get API URL from .env (Expo automatically loads EXPO_PUBLIC_ prefix)
const envApiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// For Web Dev: If we're on localhost but API is set to an IP, fallback to localhost for ease of use
// unless it's already specified.
const getBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return 'http://localhost:8000/api/v1';
    }
    return envApiUrl;
};

const apiClient = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Helper to get auth data
export const authHelpers = {
    getAccountNumber: async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            return user.account_number || user.id?.toString(); // Adjust based on user model
        }
        return '123456789'; // Fallback for demo
    },
    getToken: async () => {
        return await AsyncStorage.getItem('accessToken');
    },
};

apiClient.interceptors.request.use(
    async (config) => {
        const token = await authHelpers.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default apiClient;
