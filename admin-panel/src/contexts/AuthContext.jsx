import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import storage from '../utils/storage';
import { authAPI, accountsAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccountState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      const token = await storage.getItem('accessToken');
      const userStr = await storage.getItem('user');
      const acctStr = await storage.getItem('selectedAccount');

      if (token && userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setIsAuthenticated(true);

        if (acctStr) setSelectedAccountState(acctStr);
        else if (userData.default_account_number) setSelectedAccountState(userData.default_account_number);

        // Load accounts
        try {
          const res = await accountsAPI.getAll();
          const accts = res.data?.accounts || res.data || [];
          setAccounts(accts);
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUserData();
    const handleLogout = () => logout();
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    const { access_token, refresh_token, user: userData } = res.data;

    await storage.multiSet([
      ['accessToken', access_token],
      ['refreshToken', refresh_token],
      ['user', JSON.stringify(userData)],
    ]);

    setUser(userData);
    setIsAuthenticated(true);

    const acct = userData.default_account_number || userData.account_number;
    if (acct) {
      setSelectedAccountState(acct);
      await storage.setItem('selectedAccount', acct);
    }

    // Load accounts after login
    try {
      const accRes = await accountsAPI.getAll();
      setAccounts(accRes.data?.accounts || accRes.data || []);
    } catch { /* ignore */ }

    return res.data;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    await storage.multiRemove(['accessToken', 'refreshToken', 'user', 'selectedAccount']);
    setUser(null);
    setIsAuthenticated(false);
    setAccounts([]);
    setSelectedAccountState(null);
  };

  const setSelectedAccount = async (account) => {
    const num = typeof account === 'string' ? account : account.account_number;
    setSelectedAccountState(num);
    await storage.setItem('selectedAccount', num);
  };

  const updateProfile = async (payload) => {
    const res = await authAPI.updateProfile(payload);
    const updatedUser = res.data;
    await storage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);

    if (updatedUser.default_account_number) {
      setSelectedAccountState(updatedUser.default_account_number);
      await storage.setItem('selectedAccount', updatedUser.default_account_number);
    }

    return updatedUser;
  };

  return (
    <AuthContext.Provider value={{
      user, accounts, selectedAccount, loading, isAuthenticated,
      login, logout, setSelectedAccount, refreshAccounts: loadUserData, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
