import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { authStorage } from '../lib/authStorage';

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
      const token = authStorage.getToken();

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
          const roles = response.data?.roles ?? [];
          const meUser = response.data?.user;

          if (roles.length > 0) {
            authStorage.setRole(roles[0]);
          }
          if (meUser?.name) {
            authStorage.setName(meUser.name);
          }
          authStorage.setMustUpdateCredentials(Boolean(meUser?.must_update_credentials));
        }
      } catch (error: unknown) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        // 401 or any other error: token is invalid/stale
        console.warn('Token validation failed:', status);
        
        // Clear all auth data
        authStorage.clearSession();

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
