import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../api/authAPI';
import { COLORS, SPACING, RADIUS, FONTS, SHADOW } from '../utils/theme';
import { PrimaryButton } from '../components/SharedComponents';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleLogin(id_token);
    }
  }, [response]);

  const handleGoogleLogin = async (idToken) => {
    setLoading(true);
    try {
      const res = await authAPI.googleLogin(idToken);
      const data = res.data;
      const accessToken = data.access_token || data.accessToken || data.token;
      const refreshToken = data.refresh_token || data.refreshToken || data.access_token || data.token;
      const userData = data.user || data.profile;

      await login(accessToken, refreshToken, userData);
    } catch (err) {
      console.error('Google Login Error:', err.response?.data || err.message);
      Alert.alert('Google Auth Failed', err.response?.data?.detail || 'Could not authenticate with Google.');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Min 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      console.log('🔐 Attempting login with email:', email);
      const res = await authAPI.login(email.trim().toLowerCase(), password);
      const data = res.data;

      console.log('✓ Login response received:', JSON.stringify(data, null, 2));

      // ── Flexible token extraction (handles different backend shapes) ──
      // Shape A: { access_token, refresh_token, user }
      // Shape B: { accessToken, refreshToken, user }
      // Shape C: { token, user }
      // Shape D: { access_token, user: { ... } }
      const accessToken =
        data.access_token ||
        data.accessToken ||
        data.token;

      const refreshToken =
        data.refresh_token ||
        data.refreshToken ||
        data.access_token || // fallback if no separate refresh
        data.token;

      const userData =
        data.user ||
        data.profile ||
        { email: email.trim().toLowerCase() }; // minimal fallback

      console.log('Token extracted:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasUserData: !!userData,
      });

      if (!accessToken) {
        console.error('❌ Login response structure:', JSON.stringify(data));
        Alert.alert('Login Error', 'Server response missing token. Check console for details.');
        return;
      }

      console.log('💾 Storing tokens and user data...');
      await login(accessToken, refreshToken, userData);
      console.log('✓ Login successful!');
    } catch (err) {
      console.error('❌ Login error:', err.response?.data || err.message);
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Login failed. Check your credentials.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoIcon}>⚡</Text>
          </View>
          <Text style={styles.title}>EnergyIQ</Text>
          <Text style={styles.subtitle}>Track · Analyse · Save</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Welcome back</Text>
          <Text style={styles.formSub}>Sign in to your account</Text>

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: '' })); }}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
            {errors.email ? <Text style={styles.errText}>{errors.email}</Text> : null}
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.passWrap}>
              <TextInput
                style={[styles.input, styles.passInput, errors.password && styles.inputError]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: '' })); }}
                secureTextEntry={!showPass}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                <Text style={styles.eye}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.errText}>{errors.password}</Text> : null}
          </View>

          <PrimaryButton
            label="Sign In"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            icon="🔑"
            style={styles.loginBtn}
          />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={() => promptAsync()}
            disabled={!request || loading}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg1 },
  container: { flexGrow: 1, padding: SPACING.xl, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: SPACING.xxxl },
  logoWrap: {
    width: 80, height: 80,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOW.md,
  },
  logoIcon: { fontSize: 40 },
  title: { color: COLORS.textPrimary, fontSize: 32, ...FONTS.extraBold, letterSpacing: -0.5 },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4, letterSpacing: 1 },
  form: {
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOW.md,
  },
  formTitle: { color: COLORS.textPrimary, fontSize: 22, ...FONTS.bold, marginBottom: 4 },
  formSub: { color: COLORS.textSecondary, fontSize: 14, marginBottom: SPACING.xl },
  fieldWrap: { marginBottom: SPACING.lg },
  fieldLabel: { color: COLORS.textSecondary, fontSize: 13, ...FONTS.medium, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.bg3,
    color: COLORS.textPrimary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputError: { borderColor: COLORS.danger },
  passWrap: { position: 'relative' },
  passInput: { paddingRight: 50 },
  eyeBtn: { position: 'absolute', right: SPACING.md, top: '50%', transform: [{ translateY: -12 }] },
  eye: { fontSize: 20 },
  errText: { color: COLORS.danger, fontSize: 12, marginTop: 4 },
  loginBtn: { marginTop: SPACING.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
  footerText: { color: COLORS.textSecondary, fontSize: 14 },
  link: { color: COLORS.primary, fontSize: 14, ...FONTS.semiBold },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.lg },
  line: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textMuted, marginHorizontal: SPACING.md, fontSize: 12 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: '#ddd',
    ...SHADOW.sm,
  },
  googleIcon: { color: '#4285F4', fontSize: 20, fontWeight: 'bold', marginRight: 10 },
  googleBtnText: { color: '#757575', fontSize: 16, fontWeight: '600' },
});

export default LoginScreen;