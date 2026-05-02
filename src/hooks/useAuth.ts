import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const isAdmin = role === 'admin' || role === 'ADMIN';

  const logout = useCallback(() => {
    localStorage.removeItem('siades_token');
    localStorage.removeItem('siades_role');
    navigate('/admin/login');
  }, [navigate]);

  return { isAuthenticated, isAdmin, token, role, logout };
};
