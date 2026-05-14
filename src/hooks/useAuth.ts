import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { authStorage } from '../lib/authStorage';

export interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  token: string | null;
  role: string | null;
  logout: () => void;
}

export const useAuth = (): AuthState => {
  const navigate = useNavigate();

  const token = authStorage.getToken();
  const role = authStorage.getRole();

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
      authStorage.clearSession();
      navigate('/login');
    }
  }, [navigate]);

  return { isAuthenticated, isAdmin, token, role, logout };
};
