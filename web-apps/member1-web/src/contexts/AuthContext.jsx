import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authHelpers } from '../services/final-apiClient';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = () => {
      const currentUser = authHelpers.getCurrentUser();
      const authenticated = authHelpers.isAuthenticated();

      setUser(currentUser);
      setIsAuthenticated(authenticated);
      setLoading(false);
    };

    initAuth();
  }, []);

  // Check token expiration periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenExpiration = () => {
      if (!authHelpers.isAuthenticated()) {
        // Token expired, logout user
        logout();
      }
    };

    // Check every minute
    const interval = setInterval(checkTokenExpiration, 60 * 1000);

    // Check immediately
    checkTokenExpiration();

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = useCallback(async (accessToken, userData) => {
    const success = authHelpers.storeAuthData(accessToken, userData);
    
    if (success) {
      setUser(userData);
      setIsAuthenticated(true);
      return true;
    }
    
    return false;
  }, []);

  const logout = useCallback(() => {
    authHelpers.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};