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

const publicEndpointPrefixes = [
  '/katalog',
  '/struktur-desa',
  '/login',
  '/register',
  '/forgot-password',
  '/verify-reset-otp',
  '/reset-password',
];

const publicPagePaths = [
  '/',
  '/login',
  '/admin/login',
  '/register',
  '/lupa-password',
  '/verifikasi-otp',
  '/ganti-password',
  '/struktur-desa',
  '/katalog-jasa',
];

const isPublicEndpoint = (url?: string) => {
  if (!url) return false;

  const rawPath = url.startsWith(BASE_URL)
    ? url.slice(BASE_URL.length)
    : url;
  const path = rawPath.split('?')[0];

  return publicEndpointPrefixes.some((prefix) =>
    path === prefix || path.startsWith(`${prefix}/`)
  );
};

const isPublicPage = (path: string) => (
  publicPagePaths.includes(path)
);

// Request interceptor — inject token
api.interceptors.request.use(
  (config) => {
    const token = authStorage.getToken();
    if (token && !isPublicEndpoint(config.url)) {
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
    const currentPath = window.location.pathname;

    if (
      error.response?.status === 401
      && !isPublicEndpoint(error.config?.url)
      && !isPublicPage(currentPath)
    ) {
      const role = authStorage.getRole();
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
