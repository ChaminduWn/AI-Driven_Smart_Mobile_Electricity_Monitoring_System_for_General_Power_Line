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
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const Field = ({ label, error, children }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
    {error ? <Text style={styles.errText}>{error}</Text> : null}
  </View>
);

const RegisterScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [form, setForm] = useState({
    full_name: '', email: '', phone_number: '', account_number: '', password: '', confirm: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Google Auth Setup ───────────────────────────────────────────────────────
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'energyanalysis',
    useProxy: false,
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
    redirectUri,
  });

  // ── Handle Google response ──────────────────────────────────────────────────
  React.useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const idToken = response.params?.id_token;

      if (!idToken) {
        const accessToken = response.params?.access_token;
        if (accessToken) {
          fetchGoogleUserInfo(accessToken);
        } else {
          Alert.alert('Google Error', 'No token received from Google. Try again.');
        }
        return;
      }

      handleGoogleLogin(idToken);

    } else if (response.type === 'error') {
      Alert.alert('Google Sign-In Failed', response.error?.message || 'Please try again.');
    }
  }, [response]);

  // ── Fetch user info via access_token (fallback) ───────────────────────────
  const fetchGoogleUserInfo = async (accessToken) => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const userInfo = await res.json();

      if (!userInfo.email) {
        Alert.alert('Google Error', 'Could not get email from Google account.');
        return;
      }

      const backendRes = await authAPI.googleLogin(accessToken, userInfo);
      const data = backendRes.data;

      const appAccessToken = data.access_token || data.accessToken || data.token;
      const appRefreshToken = data.refresh_token || data.refreshToken || appAccessToken;
      const userData = data.user || data.profile;

      await login(appAccessToken, appRefreshToken, userData);

    } catch (err) {
      console.error('Google user info error:', err);
      Alert.alert('Google Auth Failed', 'Could not complete Google sign-in.');
    } finally {
      setLoading(false);
    }
  };

  // ── Standard Google login with id_token ────────────────────────────────────
  const handleGoogleLogin = async (idToken) => {
    setLoading(true);
    try {
      const res = await authAPI.googleLogin(idToken);
      const data = res.data;

      const accessToken = data.access_token || data.accessToken || data.token;
      const refreshToken = data.refresh_token || data.refreshToken || accessToken;
      const userData = data.user || data.profile;

      if (!accessToken) {
        Alert.alert('Error', 'No token received from server.');
        return;
      }

      await login(accessToken, refreshToken, userData);

    } catch (err) {
      console.error('Google Login Error:', err.response?.data || err.message);
      Alert.alert('Google Auth Failed', err.response?.data?.detail || 'Could not authenticate with Google.');
    } finally {
      setLoading(false);
    }
  };

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Required';
    else if (form.password.length < 8) e.password = 'Min 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        full_name: form.full_name.trim() || null,
        phone_number: form.phone_number.replace(/\D/g, '') || null,
        default_account_number: form.account_number.trim() || null,
      };
      const res = await authAPI.register(payload);
      const data = res.data;

      const accessToken = data.access_token || data.accessToken || data.token;
      const refreshToken = data.refresh_token || data.refreshToken || accessToken;
      const userData = data.user || data.profile || { email: form.email.trim().toLowerCase() };

      if (!accessToken) {
        Alert.alert('Error', 'Server response missing token.');
        return;
      }

      await login(accessToken, refreshToken, userData);

    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  // ── UI ──────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        style={[styles.flex, Platform.OS === 'web' && { overflow: 'scroll' }]}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        alwaysBounceVertical={true}
      >
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoIcon}>⚡</Text>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start tracking your energy</Text>
        </View>

        <View style={styles.form}>
          <Field label="Full Name (optional)">
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={COLORS.textMuted}
              value={form.full_name}
              onChangeText={(t) => set('full_name', t)}
            />
          </Field>

          <Field label="Email *" error={errors.email}>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={form.email}
              onChangeText={(t) => set('email', t)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </Field>

          <Field label="Phone (optional)">
            <TextInput
              style={styles.input}
              placeholder="0771234567"
              placeholderTextColor={COLORS.textMuted}
              value={form.phone_number}
              onChangeText={(t) => set('phone_number', t)}
              keyboardType="phone-pad"
            />
          </Field>

          <Field label="Electricity Account Number">
            <TextInput
              style={styles.input}
              placeholder="e.g. 1234567890"
              placeholderTextColor={COLORS.textMuted}
              value={form.account_number}
              onChangeText={(t) => set('account_number', t)}
            />
          </Field>

          <Field label="Password *" error={errors.password}>
            <View style={styles.passWrap}>
              <TextInput
                style={[styles.input, styles.passInput, errors.password && styles.inputError]}
                placeholder="Min 8 characters"
                placeholderTextColor={COLORS.textMuted}
                value={form.password}
                onChangeText={(t) => set('password', t)}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                <Text>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </Field>

          <Field label="Confirm Password *" error={errors.confirm}>
            <TextInput
              style={[styles.input, errors.confirm && styles.inputError]}
              placeholder="Re-enter password"
              placeholderTextColor={COLORS.textMuted}
              value={form.confirm}
              onChangeText={(t) => set('confirm', t)}
              secureTextEntry={!showPass}
            />
          </Field>

          <PrimaryButton
            label="Create Account"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            icon="🚀"
            color={COLORS.secondary}
            style={styles.btn}
          />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity
            style={[styles.googleBtn, (!request || loading) && styles.googleBtnDisabled]}
            onPress={() => promptAsync()}
            disabled={!request || loading}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.link, { color: COLORS.secondary }]}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg1 },
  container: {
    flexGrow: 1,
    padding: SPACING.lg,
    paddingTop: Platform.OS === 'web' ? SPACING.xl : SPACING.xxl,
    paddingBottom: SPACING.xxxl
  },
  header: { alignItems: 'center', marginBottom: SPACING.lg },
  logoWrap: {
    width: 60, height: 60,
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.lg,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOW.md,
  },
  logoIcon: { fontSize: 30 },
  title: { color: COLORS.textPrimary, fontSize: 24, ...FONTS.bold },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  form: {
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.md,
  },
  fieldWrap: { marginBottom: SPACING.md },
  fieldLabel: { color: COLORS.textSecondary, fontSize: 13, ...FONTS.medium, marginBottom: 4 },
  input: {
    backgroundColor: COLORS.bg3,
    color: COLORS.textPrimary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputError: { borderColor: COLORS.danger },
  passWrap: { position: 'relative' },
  passInput: { paddingRight: 50 },
  eyeBtn: { position: 'absolute', right: SPACING.md, top: '50%', transform: [{ translateY: -12 }] },
  errText: { color: COLORS.danger, fontSize: 12, marginTop: 4 },
  btn: { marginTop: SPACING.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
  footerText: { color: COLORS.textSecondary },
  link: { color: COLORS.primary, ...FONTS.semiBold },
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
  googleBtnDisabled: { opacity: 0.5 },
  googleIcon: { color: '#4285F4', fontSize: 20, fontWeight: 'bold', marginRight: 10 },
  googleBtnText: { color: '#757575', fontSize: 16, fontWeight: '600' },
});

export default RegisterScreen;