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
  const isAdmin = role === 'super-admin' || role === 'sekretaris' || role === 'bendahara';

  const logout = useCallback(() => {
    localStorage.removeItem('siades_token');
    localStorage.removeItem('siades_role');
    localStorage.removeItem('siades_name');
    navigate('/login');
  }, [navigate]);

  return { isAuthenticated, isAdmin, token, role, logout };
};
