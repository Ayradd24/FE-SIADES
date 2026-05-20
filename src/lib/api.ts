import axios from 'axios';
import { authStorage } from './authStorage';

export const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Useful for some Sanctum setups
  timeout: 15000,
});


// Request interceptor — inject token
api.interceptors.request.use(
  (config) => {
    const token = authStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const role = authStorage.getRole();
      const currentPath = window.location.pathname;
      const loginPath = currentPath.startsWith('/admin') || role === 'admin' || role === 'super-admin'
        ? '/admin/login'
        : '/login';

      authStorage.clearSession();

      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/admin/login')) {
        window.location.href = `${loginPath}?expired=true`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
