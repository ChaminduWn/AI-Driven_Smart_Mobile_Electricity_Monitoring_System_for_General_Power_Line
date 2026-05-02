import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../components/Input';
import { GradientButton } from '../components/GradientButton';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

export const LoginScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const newErrors = {};
        if (!email.trim()) {
            newErrors.email = t('validation.emailOrPhoneReq');
        }
        if (!password.trim()) {
            newErrors.password = t('validation.passwordReq');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;

        setLoading(true);
        const res = await login(email, password);
        setLoading(false);

        if (!res.success) {
            Alert.alert('Login Failed', res.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo & Branding */}
                <View style={styles.branding}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="flash" size={36} color={theme.colors.secondary} />
                    </View>
                    <Text style={styles.welcomeText}>{t('auth.hiThere')}</Text>
                    <Text style={styles.subText}>{t('auth.welcomeBack')}<Text style={styles.brandText}>{t('auth.powerLink')}</Text></Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Input
                        label={t('auth.emailOrPhone')}
                        placeholder={t('auth.enterEmailOrPhone')}
                        value={email}
                        onChangeText={(t) => { setEmail(t); setErrors(e => ({ ...e, email: '' })); }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={errors.email}
                    />

                    <Input
                        label={t('auth.password')}
                        placeholder={t('auth.enterPassword')}
                        value={password}
                        onChangeText={(textInput) => { setPassword(textInput); setErrors(e => ({ ...e, password: '' })); }}
                        secureTextEntry
                        error={errors.password}
                    />

                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
                    </TouchableOpacity>

                    <GradientButton
                        title={t('auth.login')}
                        iconRight="arrow-forward"
                        onPress={handleLogin}
                        loading={loading}
                        style={styles.loginButton}
                    />

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>{t('auth.or')}</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Google Login */}
                    <Button
                        title={t('auth.continueWithGoogle')}
                        variant="surface"
                        icon="logo-google"
                        onPress={() => Alert.alert('Google Auth', 'Coming soon')}
                        style={styles.googleButton}
                    />

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>{t('auth.noAccount')}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                            <Text style={styles.signupText}>{t('auth.signup')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: theme.spacing.lg,
        justifyContent: 'center',
    },
    branding: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl + 8,
    },
    logoContainer: {
        width: 64,
        height: 64,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.secondary + '40',
        ...theme.shadows.glow(theme.colors.secondary),
    },
    welcomeText: {
        ...theme.typography.h1,
        marginBottom: 4,
    },
    subText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },
    brandText: {
        color: theme.colors.primary,
        fontWeight: '700',
    },
    form: {
        width: '100%',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: theme.spacing.lg,
        marginTop: -4,
    },
    forgotPasswordText: {
        color: theme.colors.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    loginButton: {
        marginBottom: theme.spacing.lg,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.border,
    },
    dividerText: {
        color: theme.colors.textMuted,
        paddingHorizontal: theme.spacing.md,
        fontSize: 13,
    },
    googleButton: {
        marginBottom: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    footerText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    signupText: {
        color: theme.colors.primary,
        fontWeight: '700',
        fontSize: 14,
    },
});
