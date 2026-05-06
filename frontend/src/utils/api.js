import axios from 'axios';
import { normalizeDisplayNames } from './displayNames';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => {
    res.data = normalizeDisplayNames(res.data);
    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('wp_token');
      localStorage.removeItem('wp_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
