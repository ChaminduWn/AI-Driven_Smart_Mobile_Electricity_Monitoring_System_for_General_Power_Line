import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Card, Title, Paragraph, HelperText } from 'react-native-paper';
import { UserPlus, User, Mail, Phone, Lock } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';

const Register = ({ navigation }) => {
    const { login } = useAuth();
    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!form.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(form.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!form.password) {
            newErrors.password = 'Password is required';
        } else if (form.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (form.password !== form.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        setApiError('');
        if (!validateForm()) return;

        setLoading(true);
        try {
            const payload = {
                email: form.email.trim(),
                password: form.password,
                full_name: form.full_name.trim() || null,
                phone_number: form.phone_number ? form.phone_number.replace(/[\s-]/g, '') : null,
            };

            const response = await apiClient.post('/auth/register', payload);

            const { access_token, user } = response.data;
            if (access_token) {
                await login(access_token, user);
            } else {
                setApiError('Registration succeeded but authentication failed.');
            }
        } catch (err) {
            console.error('Registration error:', err);
            if (err.response) {
                setApiError(err.response.data?.detail || 'Registration failed.');
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
                    <UserPlus color="#fff" size={40} />
                </View>
                <Title style={styles.title}>Create Account</Title>
                <Paragraph style={styles.subtitle}>Register to start tracking your electricity usage.</Paragraph>
            </View>

            <Card style={styles.card}>
                <Card.Content>
                    {apiError ? <HelperText type="error" visible={!!apiError} style={styles.apiError}>{apiError}</HelperText> : null}

                    <TextInput
                        label="Full Name"
                        value={form.full_name}
                        onChangeText={(text) => setForm({ ...form, full_name: text })}
                        left={<TextInput.Icon icon={() => <User size={20} color="#9CA3AF" />} />}
                        mode="outlined"
                        style={styles.input}
                    />
                    <HelperText type="info">Optional</HelperText>

                    <TextInput
                        label="Email Address *"
                        value={form.email}
                        onChangeText={(text) => {
                            setForm({ ...form, email: text });
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
                        label="Phone Number"
                        value={form.phone_number}
                        onChangeText={(text) => setForm({ ...form, phone_number: text })}
                        left={<TextInput.Icon icon={() => <Phone size={20} color="#9CA3AF" />} />}
                        mode="outlined"
                        keyboardType="phone-pad"
                        style={styles.input}
                        placeholder="0771234567"
                    />
                    <HelperText type="info">Optional - digits only</HelperText>

                    <TextInput
                        label="Password *"
                        value={form.password}
                        onChangeText={(text) => {
                            setForm({ ...form, password: text });
                            setErrors({ ...errors, password: '' });
                        }}
                        left={<TextInput.Icon icon={() => <Lock size={20} color="#9CA3AF" />} />}
                        mode="outlined"
                        secureTextEntry
                        error={!!errors.password}
                        style={styles.input}
                    />
                    <HelperText type="error" visible={!!errors.password}>{errors.password}</HelperText>

                    <TextInput
                        label="Confirm Password *"
                        value={form.confirmPassword}
                        onChangeText={(text) => {
                            setForm({ ...form, confirmPassword: text });
                            setErrors({ ...errors, confirmPassword: '' });
                        }}
                        left={<TextInput.Icon icon={() => <Lock size={20} color="#9CA3AF" />} />}
                        mode="outlined"
                        secureTextEntry
                        error={!!errors.confirmPassword}
                        style={styles.input}
                    />
                    <HelperText type="error" visible={!!errors.confirmPassword}>{errors.confirmPassword}</HelperText>

                    <Button
                        mode="contained"
                        onPress={handleRegister}
                        loading={loading}
                        disabled={loading}
                        style={styles.registerButton}
                        contentStyle={styles.buttonContent}
                    >
                        Sign Up
                    </Button>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.linkText}>Sign in</Text>
                        </TouchableOpacity>
                    </View>
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: '#111827', padding: 24, paddingVertical: 40 },
    header: { alignItems: 'center', marginBottom: 32 },
    iconContainer: { backgroundColor: '#8B5CF6', padding: 16, borderRadius: 30, marginBottom: 16, elevation: 4 },
    title: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
    subtitle: { color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
    card: { backgroundColor: '#1F2937', borderRadius: 16, elevation: 8 },
    input: { backgroundColor: '#1F2937' },
    registerButton: { marginTop: 16, borderRadius: 12, backgroundColor: '#8B5CF6' },
    buttonContent: { paddingVertical: 8 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 16 },
    footerText: { color: '#9CA3AF' },
    linkText: { color: '#8B5CF6', fontWeight: 'bold' },
    apiError: { backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 8, borderRadius: 8, marginBottom: 16, textAlign: 'center' }
});

export default Register;
