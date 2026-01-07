import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('📤 Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('📥 Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// API Methods
export const billsAPI = {
  uploadBill: async (formData: FormData) => {
    const response = await api.post('/bills/extract', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getAllBills: async () => {
    const response = await api.get('/bills');
    return response.data;
  },
  deleteBill: async (billId: string) => {
    const response = await api.delete(`/bills/${billId}`);
    return response.data;
  },
  getAnalysis: async (billId: string) => {
    const response = await api.get(`/analysis/past-month/${billId}`);
    return response.data;
  },
};

export const appliancesAPI = {
  getAppliances: async (accountNumber: string) => {
    const response = await api.get(`/appliances/account/${accountNumber}`);
    return response.data;
  },
  addAppliance: async (data: any) => {
    const response = await api.post('/appliances/', data);
    return response.data;
  },
  deleteAppliance: async (id: string) => {
    const response = await api.delete(`/appliances/${id}`);
    return response.data;
  },
  recognizeFromImage: async (formData: FormData) => {
    const response = await api.post('/appliances/recognize-from-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getAnalysis: async (accountNumber: string) => {
    const response = await api.get(`/appliances/analysis/${accountNumber}`);
    return response.data;
  },
};

export const householdAPI = {
  getMembers: async (accountNumber: string) => {
    const response = await api.get(`/household/members/${accountNumber}`);
    return response.data;
  },
  addMember: async (data: any) => {
    const response = await api.post('/household/members', data);
    return response.data;
  },
  deleteMember: async (id: string) => {
    const response = await api.delete(`/household/members/${id}`);
    return response.data;
  },
};

export const nilmAPI = {
  verifySetup: async (accountNumber: string) => {
    const response = await api.get(`/nilm/verify-setup/${accountNumber}`);
    return response.data;
  },
  disaggregate: async (data: any) => {
    const response = await api.post('/nilm/disaggregate', data);
    return response.data;
  },
  getAccuracyReport: async (accountNumber: string) => {
    const response = await api.get(`/nilm/accuracy-report/${accountNumber}`);
    return response.data;
  },
};

export const budgetAPI = {
  getPlans: async (accountNumber: string) => {
    const response = await api.get(`/analysis/plans/account/${accountNumber}`);
    return response.data;
  },
  createPlan: async (data: any) => {
    const response = await api.post('/analysis/create-budget-plan', data);
    return response.data;
  },
  trackProgress: async (data: any) => {
    const response = await api.post('/analysis/track-progress', data);
    return response.data;
  },
  getReadings: async (planId: string) => {
    const response = await api.get(`/analysis/readings/plan/${planId}`);
    return response.data;
  },
};

export const mlAPI = {
  predictConsumption: async (data: any) => {
    const response = await api.post('/ml/predict-consumption', data);
    return response.data;
  },
};

export default api;