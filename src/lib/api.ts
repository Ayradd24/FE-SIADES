import axios from 'axios';

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
    const token = localStorage.getItem('siades_token');
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
      localStorage.removeItem('siades_token');
      localStorage.removeItem('siades_role');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;
