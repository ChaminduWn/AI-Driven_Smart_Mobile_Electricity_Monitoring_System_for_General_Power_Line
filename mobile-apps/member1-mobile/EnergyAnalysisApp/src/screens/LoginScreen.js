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

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Google Auth Setup ───────────────────────────────────────────────────────
  // Using useProxy: false because you are not logged into Expo
  // This uses your app's own scheme directly instead of auth.expo.io
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
        // Some flows return access_token instead of id_token
        // Exchange access_token for user info
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

    } else if (response.type === 'cancel') {
      // User cancelled — do nothing
    }
  }, [response]);

  // ── If id_token not returned, fetch user info via access_token ──────────────
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

      // Send to backend — backend handles user creation
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

  // ── Email/Password validation ───────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Min 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Email/Password login ────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authAPI.login(email.trim().toLowerCase(), password);
      const data = res.data;

      const accessToken = data.access_token || data.accessToken || data.token;
      const refreshToken = data.refresh_token || data.refreshToken || accessToken;
      const userData = data.user || data.profile || { email: email.trim().toLowerCase() };

      if (!accessToken) {
        Alert.alert('Login Error', 'Server response missing token.');
        return;
      }

      await login(accessToken, refreshToken, userData);

    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Login failed.';
      Alert.alert('Login Failed', msg);
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
            style={[styles.googleBtn, (!request || loading) && styles.googleBtnDisabled]}
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
  container: {
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
    paddingTop: Platform.OS === 'web' ? SPACING.xl : SPACING.xxxl,
    paddingBottom: SPACING.xxxl
  },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  logoWrap: {
    width: 60, height: 60,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOW.md,
  },
  logoIcon: { fontSize: 32 },
  title: { color: COLORS.textPrimary, fontSize: 28, ...FONTS.extraBold, letterSpacing: -0.5 },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4, letterSpacing: 1 },
  form: {
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.md,
  },
  formTitle: { color: COLORS.textPrimary, fontSize: 20, ...FONTS.bold, marginBottom: 4 },
  formSub: { color: COLORS.textSecondary, fontSize: 13, marginBottom: SPACING.lg },
  fieldWrap: { marginBottom: SPACING.md },
  fieldLabel: { color: COLORS.textSecondary, fontSize: 13, ...FONTS.medium, marginBottom: 6 },
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
  eye: { fontSize: 18 },
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
  googleBtnDisabled: { opacity: 0.5 },
  googleIcon: { color: '#4285F4', fontSize: 20, fontWeight: 'bold', marginRight: 10 },
  googleBtnText: { color: '#757575', fontSize: 16, fontWeight: '600' },
});

export default LoginScreen;