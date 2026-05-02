const DEFAULT_DEV_BASE_URL = 'http://127.0.0.1:8003';
const DEFAULT_PROD_BASE_URL = 'http://192.168.8.100:8003';

const normalizeBaseUrl = (value) => value?.replace(/\/+$/, '');
const normalizePath = (value = '') => (value.startsWith('/') ? value : `/${value}`);

const envBaseUrl = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);

export const API_BASE_URL = envBaseUrl || (__DEV__ ? DEFAULT_DEV_BASE_URL : DEFAULT_PROD_BASE_URL);
export const API_URL = `${API_BASE_URL}/api`;

export const buildApiUrl = (path = '') => `${API_URL}${normalizePath(path)}`;

export const buildAssetUrl = (path = '') => {
  if (!path) {
    return API_BASE_URL;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${normalizePath(path)}`;
};
