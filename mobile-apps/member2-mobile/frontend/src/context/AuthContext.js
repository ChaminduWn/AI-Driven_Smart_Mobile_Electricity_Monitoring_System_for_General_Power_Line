import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildApiUrl } from '../api';

const API_URL = buildApiUrl('/auth');
const AUTH_REQUEST_TIMEOUT_MS = 15000;

const AuthContext = createContext();

const fetchJsonWithTimeout = async (url, options = {}, timeoutMs = AUTH_REQUEST_TIMEOUT_MS) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        const rawText = await response.text();
        const data = rawText ? JSON.parse(rawText) : {};
        return { response, data };
    } finally {
        clearTimeout(timer);
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const refreshUser = useCallback(async (userId = user?.id, options = {}) => {
        try {
            if (!userId) {
                return { success: false, message: 'User id is required' };
            }

            const { response, data } = await fetchJsonWithTimeout(buildApiUrl(`/users/${userId}`), {
                headers: {
                    'bypass-tunnel-reminder': 'true',
                },
            });

            if (!response.ok || !data.success || !data.user) {
                return { success: false, message: data?.message || 'Could not refresh user state' };
            }

            setUser(data.user);
            await AsyncStorage.setItem('user', JSON.stringify(data.user));
            return { success: true, user: data.user };
        } catch (error) {
            if (!options.silent) {
                console.error('Refresh user error', error);
            }
            return { success: false, message: error.message || 'Could not refresh user state' };
        }
    }, [user?.id]);

    const loadUser = useCallback(async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                if (parsedUser?.id) {
                    await refreshUser(parsedUser.id, { silent: true });
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [refreshUser]);

    const login = useCallback(async (email, password) => {
        try {
            const { response, data } = await fetchJsonWithTimeout(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'bypass-tunnel-reminder': 'true',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                return { success: false, message: data?.message || 'Login failed' };
            }

            const { user, token } = data;

            setUser(user);
            await AsyncStorage.setItem('user', JSON.stringify(user));
            await AsyncStorage.setItem('token', token);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.name === 'AbortError'
                    ? 'Request timed out. Please check the connection and try again.'
                    : error.message || 'Login failed',
            };
        }
    }, []);

    const signup = useCallback(async (userData) => {
        try {
            console.log('Signup: calling', `${API_URL}/signup`);
            const { response, data } = await fetchJsonWithTimeout(`${API_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'bypass-tunnel-reminder': 'true',
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                return { success: false, message: data?.message || 'Signup failed' };
            }

            return { success: true, data };
        } catch (error) {
            console.log('Signup error:', error.message);
            return {
                success: false,
                message: error.name === 'AbortError'
                    ? 'Request timed out. Please check the connection and try again.'
                    : error.message || 'Signup failed',
            };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('token');
            setUser(null);
        } catch (e) {
            console.error(e);
        }
    }, []);

    const updateUser = useCallback(async (updatedData) => {
        try {
            const newUser = { ...user, ...updatedData };
            setUser(newUser);
            await AsyncStorage.setItem('user', JSON.stringify(newUser));
        } catch (e) {
            console.error('Update user error in context:', e);
        }
    }, [user]);

    const contextValue = useMemo(() => ({
        user,
        loading,
        login,
        signup,
        logout,
        updateUser,
        refreshUser,
    }), [user, loading, login, signup, logout, updateUser, refreshUser]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
