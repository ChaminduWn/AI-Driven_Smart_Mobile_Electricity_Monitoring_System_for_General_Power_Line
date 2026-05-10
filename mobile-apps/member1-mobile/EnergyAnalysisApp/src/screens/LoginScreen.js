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
import Ionicons from 'react-native-vector-icons/Ionicons';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  // ... state same ...
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ... google auth same ...
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

  React.useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.params?.id_token;
      if (idToken) handleGoogleLogin(idToken);
    }
  }, [response]);

  const handleGoogleLogin = async (idToken) => {
    setLoading(true);
    try {
      const res = await authAPI.googleLogin(idToken);
      const data = res.data;
      const accessToken = data.access_token || data.accessToken || data.token;
      const refreshToken = data.refresh_token || data.refreshToken || accessToken;
      const userData = data.user || data.profile;
      await login(accessToken, refreshToken, userData);
    } catch (err) {
      Alert.alert('Google Auth Failed', err.response?.data?.detail || 'Could not authenticate.');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (password.length < 1) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authAPI.login(email.trim().toLowerCase(), password);
      const data = res.data;
      const accessToken = data.access_token || data.accessToken || data.token;
      const refreshToken = data.refresh_token || data.refreshToken || accessToken;
      const userData = data.user || data.profile;
      await login(accessToken, refreshToken, userData);
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.detail || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.logoCard}>
              <Ionicons name="flash" size={36} color="#06B6D4" />
            </View>
            <Text style={styles.brandTitle}>
              <Text style={{ fontWeight: '300', color: '#1E293B' }}>Power</Text>
              <Text style={{ fontWeight: '800', color: '#2563EB' }}>Link</Text>
            </Text>
            <Text style={styles.subtitle}>Smart Electricity Monitoring</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.form}>
              <Text style={styles.formTitle}>Welcome Back</Text>
              <Text style={styles.formSub}>Sign in to continue to PowerLink</Text>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="john@example.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: '' })); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                {errors.email ? <Text style={styles.errText}>{errors.email}</Text> : null}
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.passWrap}>
                  <TextInput
                    style={[styles.input, { paddingRight: 50 }, errors.password && styles.inputError]}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: '' })); }}
                    secureTextEntry={!showPass}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                    <Ionicons name={showPass ? "eye-off" : "eye"} size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
                {errors.password ? <Text style={styles.errText}>{errors.password}</Text> : null}
              </View>

              <PrimaryButton
                label="Sign In"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                color="#2563EB"
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
                <Ionicons name="logo-google" size={20} color="#EA4335" style={{ marginRight: 10 }} />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>New to PowerLink? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.link}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  container: { padding: 24, paddingBottom: 40, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 40, width: '100%' },
  logoCard: {
    width: 72, height: 72,
    backgroundColor: '#fff',
    borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    ...SHADOW.md,
  },
  brandTitle: { fontSize: 32, letterSpacing: -0.5 },
  subtitle: { color: '#64748B', fontSize: 14, marginTop: 4, letterSpacing: 0.5 },
  formContainer: { width: '100%', maxWidth: 450 },
  form: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 32,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...SHADOW.lg,
  },
  formTitle: { color: '#1E293B', fontSize: 24, ...FONTS.bold, marginBottom: 6 },
  formSub: { color: '#64748B', fontSize: 14, marginBottom: 32 },
  fieldWrap: { marginBottom: 20 },
  fieldLabel: { color: '#475569', fontSize: 13, ...FONTS.bold, marginBottom: 8 },
  input: {
    backgroundColor: '#F8FAFC',
    color: '#1E293B',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputError: { borderColor: COLORS.danger },
  passWrap: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 16, top: 14 },
  errText: { color: COLORS.danger, fontSize: 12, marginTop: 4, marginLeft: 4 },
  loginBtn: { marginTop: 8, height: 52 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { color: '#94A3B8', marginHorizontal: 16, fontSize: 12, ...FONTS.bold },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 52,
  },
  googleBtnDisabled: { opacity: 0.5 },
  googleBtnText: { color: '#475569', fontSize: 16, ...FONTS.semiBold },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: '#64748B', fontSize: 14 },
  link: { color: '#2563EB', fontSize: 14, ...FONTS.bold },
});

export default LoginScreen;