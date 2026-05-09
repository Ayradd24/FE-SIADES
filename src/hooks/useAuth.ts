import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  token: string | null;
  role: string | null;
  logout: () => void;
}

export const useAuth = (): AuthState => {
  const navigate = useNavigate();

  const token = localStorage.getItem('siades_token');
  const role = localStorage.getItem('siades_role');

  const isAuthenticated = !!token;
  const isAdmin = role === 'super-admin' || role === 'admin';

  const logout = useCallback(async () => {
    try {
      // Attempt to revoke token on server
      await api.post('/logout');
    } catch (error) {
      // Even if the API call fails, still clear local state
      // (network error, server error, etc.)
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear localStorage and redirect, regardless of API result
      localStorage.removeItem('siades_token');
      localStorage.removeItem('siades_role');
      localStorage.removeItem('siades_name');
      navigate('/login');
    }
  }, [navigate]);

  return { isAuthenticated, isAdmin, token, role, logout };
};
