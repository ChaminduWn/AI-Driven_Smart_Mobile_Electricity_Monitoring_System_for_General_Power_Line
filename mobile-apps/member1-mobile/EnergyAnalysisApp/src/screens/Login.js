import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text, TextInput, Button, Card, Title, Paragraph, HelperText, ActivityIndicator } from 'react-native-paper';
import { Lock, Mail } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';

const Login = ({ navigation }) => {
    const { login } = useAuth();
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleLogin = async () => {
        setApiError('');
        const newErrors = {};

        if (!credentials.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(credentials.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!credentials.password) {
            newErrors.password = 'Password is required';
        } else if (credentials.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) return;

        setLoading(true);
        try {
            const response = await apiClient.post('/auth/login', {
                email: credentials.email.trim(),
                password: credentials.password,
            });

            const { access_token, user } = response.data;
            if (access_token) {
                await login(access_token, user);
            } else {
                setApiError('Authentication failed. No token received.');
            }
        } catch (err) {
            console.error('Login error:', err);
            if (err.response) {
                setApiError(err.response.data?.detail || 'Login failed. Please check your credentials.');
            } else {
                setApiError('Cannot connect to server. Please check your connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Lock color="#fff" size={40} />
                </View>
                <Title style={styles.title}>User Login</Title>
                <Paragraph style={styles.subtitle}>Welcome back! Please login to your account.</Paragraph>
            </View>

            <Card style={styles.card}>
                <Card.Content>
                    {apiError ? <HelperText type="error" visible={!!apiError} style={styles.apiError}>{apiError}</HelperText> : null}

                    <TextInput
                        label="Email Address"
                        value={credentials.email}
                        onChangeText={(text) => {
                            setCredentials({ ...credentials, email: text });
                            setErrors({ ...errors, email: '' });
                        }}
                        left={<TextInput.Icon icon={() => <Mail size={20} color="#9CA3AF" />} />}
                        mode="outlined"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        error={!!errors.email}
                        style={styles.input}
                    />
                    <HelperText type="error" visible={!!errors.email}>{errors.email}</HelperText>

                    <TextInput
                        label="Password"
                        value={credentials.password}
                        onChangeText={(text) => {
                            setCredentials({ ...credentials, password: text });
                            setErrors({ ...errors, password: '' });
                        }}
                        left={<TextInput.Icon icon={() => <Lock size={20} color="#9CA3AF" />} />}
                        mode="outlined"
                        secureTextEntry
                        error={!!errors.password}
                        style={styles.input}
                    />
                    <HelperText type="error" visible={!!errors.password}>{errors.password}</HelperText>

                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.linkText}>Forgot password?</Text>
                    </TouchableOpacity>

                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        loading={loading}
                        disabled={loading}
                        style={styles.loginButton}
                        contentStyle={styles.buttonContent}
                    >
                        Sign In
                    </Button>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.linkText}>Create one</Text>
                        </TouchableOpacity>
                    </View>
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: '#111827', padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 32 },
    iconContainer: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 30, marginBottom: 16, elevation: 4 },
    title: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
    subtitle: { color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
    card: { backgroundColor: '#1F2937', borderRadius: 16, elevation: 8 },
    input: { backgroundColor: '#1F2937', color: '#fff' },
    loginButton: { marginTop: 8, borderRadius: 12, backgroundColor: '#3B82F6' },
    buttonContent: { paddingVertical: 8 },
    forgotPassword: { alignSelf: 'flex-end', marginBottom: 16 },
    linkText: { color: '#3B82F6', fontWeight: 'bold' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    footerText: { color: '#9CA3AF' },
    apiError: { backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 8, borderRadius: 8, marginBottom: 16, textAlign: 'center' }
});

export default Login;
