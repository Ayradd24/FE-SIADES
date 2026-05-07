import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider: Validates token on app load
 * 
 * On mount:
 * 1. Check if token exists in localStorage
 * 2. If yes: call GET /me to validate with server
 * 3. If 200: Continue (fresh token, user data available)
 * 4. If 401 or error: Clear localStorage and redirect to /login
 * 
 * This replaces the blind trust of localStorage.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = React.useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('siades_token');

      // If no token, proceed normally (user will hit login guard if trying protected route)
      if (!token) {
        setIsValidating(false);
        return;
      }

      try {
        // Validate token with server
        const response = await api.get('/me');

        // 200: Token is valid, user data is fresh
        if (response.status === 200) {
          // Optionally update role from fresh server data
          const user = response.data;
          if (user && user.roles && user.roles.length > 0) {
            localStorage.setItem('siades_role', user.roles[0]);
          }
          if (user && user.name) {
            localStorage.setItem('siades_name', user.name);
          }
        }
      } catch (error: any) {
        // 401 or any other error: token is invalid/stale
        console.warn('Token validation failed:', error.response?.status);
        
        // Clear all auth data
        localStorage.removeItem('siades_token');
        localStorage.removeItem('siades_role');
        localStorage.removeItem('siades_name');

        // Redirect to login
        navigate('/login', { replace: true });
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [navigate]);

  // Show nothing while validating to prevent flash of wrong content
  if (isValidating) {
    return <div className="flex items-center justify-center min-h-screen bg-white" />;
  }

  return <>{children}</>;
};

export default AuthProvider;
