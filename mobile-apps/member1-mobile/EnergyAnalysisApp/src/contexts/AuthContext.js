import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import storage from '../utils/storage';
import { authAPI } from '../api/authAPI';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        console.log('🔐 AuthContext initializing - checking for existing tokens...');
        const [token, refresh, userData] = await storage.multiGet(['accessToken', 'refreshToken', 'user']);

        console.log('   Tokens found:', {
          accessToken: !!token[1],
          refreshToken: !!refresh[1],
          user: !!userData[1]
        });

        if (token[1] && userData[1]) {
          console.log('   ✓ Restoring session from storage');
          setUser(JSON.parse(userData[1]));
          setIsAuthenticated(true);
        } else {
          console.log('   ⚠️  No valid session found in storage');
        }
      } catch (e) {
        console.error('❌ Auth init error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (accessToken, refreshToken, userData) => {
    console.log('🔐 AuthContext.login called');
    console.log('   Storing accessToken:', accessToken.slice(0, 30) + '...');
    console.log('   Storing refreshToken:', refreshToken.slice(0, 30) + '...');
    console.log('   Storing user:', userData);

    try {
      await storage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
        ['user', JSON.stringify(userData)],
      ]);
      console.log('   ✓ Tokens stored successfully');

      // Verify tokens were actually stored (critical for Expo web)
      const verify = await storage.multiGet(['accessToken', 'refreshToken']);
      if (verify[0][1] && verify[1][1]) {
        console.log('   ✓ Storage verification: tokens confirmed in storage');
      } else {
        console.error('   ❌ Storage verification FAILED: tokens not found after storage!');
      }

      setUser(userData);
      setIsAuthenticated(true);
      console.log('   ✓ State updated');
    } catch (err) {
      console.error('   ❌ Failed to store tokens:', err);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch (_) { }
    await storage.multiRemove(['accessToken', 'refreshToken', 'user']);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateUser = useCallback(async (updated) => {
    await storage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  }, []);

  // Refresh user from /auth/me (called after profile update etc.)
  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.getMe();
      await storage.setItem('user', JSON.stringify(res.data));
      setUser(res.data);
    } catch (_) { }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};