import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Set the API URL to localhost because traffic is being routed over the USB cable via ADB.
// This 100% bypasses Windows Firewall and Wi-Fi issues.
const API_URL = 'http://10.48.201.167:8003/api/auth';

// Bypass localtunnel interstitial page (kept for safety if tunneling is used later)
axios.defaults.headers.common['bypass-tunnel-reminder'] = 'true';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user');
            const token = await AsyncStorage.getItem('token');
            if (storedUser && token) {
                setUser(JSON.parse(storedUser));
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await axios.post(`${API_URL}/login`, { email, password });
            const { user, token } = response.data;

            setUser(user);
            await AsyncStorage.setItem('user', JSON.stringify(user));
            await AsyncStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const signup = async (userData) => {
        try {
            console.log('Signup: calling', `${API_URL}/signup`);
            const response = await axios.post(`${API_URL}/signup`, userData);
            return { success: true, data: response.data };
        } catch (error) {
            console.log('Signup error:', error.message);
            console.log('Signup error code:', error.code);
            console.log('Signup response status:', error.response?.status);
            console.log('Signup response data:', JSON.stringify(error.response?.data));
            return { success: false, message: error.response?.data?.message || error.message || 'Signup failed' };
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('token');
            setUser(null);
            delete axios.defaults.headers.common['Authorization'];
        } catch (e) {
            console.error(e);
        }
    };

    const updateUser = async (updatedData) => {
        try {
            const newUser = { ...user, ...updatedData };
            setUser(newUser);
            await AsyncStorage.setItem('user', JSON.stringify(newUser));
        } catch (e) {
            console.error('Update user error in context:', e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
