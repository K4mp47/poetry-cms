import { useState, useEffect, useCallback } from 'react';

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

// Admin password - in production, set VITE_ADMIN_PASSWORD in Netlify environment variables
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'jacopo';

export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const sessionAuth = sessionStorage.getItem('cms_authenticated');
      if (sessionAuth === 'true') {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback((password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('cms_authenticated', 'true');
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('cms_authenticated');
  }, []);

  return { isAuthenticated, isLoading, login, logout };
}
