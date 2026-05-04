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
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

WebBrowser.maybeCompleteAuthSession();

const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale',
  'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna',
  'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa',
  'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura',
  'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle',
];

const Field = ({ label, error, children }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
    {error ? <Text style={styles.errText}>{error}</Text> : null}
  </View>
);

const RegisterScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [role, setRole] = useState('Householder');
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    phone_number: '',
    account_number: '',
    address: '',
    district: '',
    password: '',
    confirm: '',
  });
  const [nvqImage, setNvqImage] = useState(null);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [agreeTerms, setAgreeTerms] = useState(false);

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

  React.useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.params?.id_token;
      if (idToken) handleGoogleLogin(idToken);
    } else if (response.type === 'error') {
      Alert.alert('Google Sign-In Failed', response.error?.message || 'Please try again.');
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

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setNvqImage(result.assets[0]);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.address.trim()) e.address = 'Required';
    if (!form.district) e.district = 'Required';
    if (!form.password) e.password = 'Required';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    if (role === 'Electrician' && !nvqImage) e.nvq = 'NVQ Certificate required';
    if (!agreeTerms) {
      Alert.alert('Terms & Conditions', 'Please agree to the Terms and Privacy Policy');
      return false;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      let nvqUrl = null;
      if (nvqImage) nvqUrl = nvqImage.uri;

      const payload = {
        email: form.email.trim().toLowerCase(),
        username: form.username.trim() || null,
        password: form.password,
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.replace(/\D/g, '') || null,
        default_account_number: form.account_number.trim() || null,
        address: form.address.trim(),
        district: form.district,
        role: role,
        nvq_certificate_url: nvqUrl,
      };

      const res = await authAPI.register(payload);
      const data = res.data;
      const accessToken = data.access_token || data.accessToken || data.token;
      const refreshToken = data.refresh_token || data.refreshToken || accessToken;
      const userData = data.user || data.profile;
      await login(accessToken, refreshToken, userData);
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.detail || 'Failed to register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoCard}>
            <Ionicons name="flash" size={32} color="#06B6D4" />
          </View>
          <Text style={styles.brandTitle}>
            <Text style={{ fontWeight: '300', color: COLORS.textPrimary }}>Power</Text>
            <Text style={{ fontWeight: '800', color: '#2563EB' }}>Link</Text>
          </Text>
          <Text style={styles.subtitle}>Create your smart energy account</Text>
        </View>

        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleTab, role === 'Householder' && styles.activeRoleTab]}
            onPress={() => setRole('Householder')}
          >
            <Ionicons name="person" size={16} color={role === 'Householder' ? '#fff' : '#64748B'} />
            <Text style={[styles.roleText, role === 'Householder' && styles.activeRoleText]}>Householder</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleTab, role === 'Electrician' && styles.activeRoleTab]}
            onPress={() => setRole('Electrician')}
          >
            <Ionicons name="construct" size={16} color={role === 'Electrician' ? '#fff' : '#64748B'} />
            <Text style={[styles.roleText, role === 'Electrician' && styles.activeRoleText]}>Electrician</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Field label="Full Name *" error={errors.full_name}>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor={COLORS.textMuted}
              value={form.full_name}
              onChangeText={(t) => set('full_name', t)}
            />
          </Field>

          <Field label="Email *" error={errors.email}>
            <TextInput
              style={styles.input}
              placeholder="john@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={form.email}
              onChangeText={(t) => set('email', t)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </Field>

          <Field label="Address *" error={errors.address}>
            <TextInput
              style={styles.input}
              placeholder="123 Grid Lane, Colombo"
              placeholderTextColor={COLORS.textMuted}
              value={form.address}
              onChangeText={(t) => set('address', t)}
            />
          </Field>

          <Field label="District *" error={errors.district}>
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setShowDistrictPicker(!showDistrictPicker)}
            >
              <Text style={[styles.pickerText, !form.district && { color: COLORS.textMuted }]}>
                {form.district || 'Select District'}
              </Text>
              <Ionicons name={showDistrictPicker ? "chevron-up" : "chevron-down"} size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
            {showDistrictPicker && (
              <View style={styles.districtList}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                  {DISTRICTS.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={styles.districtItem}
                      onPress={() => {
                        set('district', d);
                        setShowDistrictPicker(false);
                      }}
                    >
                      <Text style={styles.districtItemText}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </Field>

          {role === 'Householder' && (
            <Field label="Electricity Account Number">
              <TextInput
                style={styles.input}
                placeholder="10-digit number"
                placeholderTextColor={COLORS.textMuted}
                value={form.account_number}
                onChangeText={(t) => set('account_number', t)}
                keyboardType="numeric"
              />
            </Field>
          )}

          {role === 'Electrician' && (
            <Field label="NVQ Certificate *" error={errors.nvq}>
              <TouchableOpacity
                style={[styles.uploadBtn, nvqImage && styles.uploadBtnActive]}
                onPress={pickImage}
              >
                <Ionicons 
                  name={nvqImage ? "checkmark-circle" : "cloud-upload"} 
                  size={24} 
                  color={nvqImage ? "#10B981" : "#64748B"} 
                />
                <Text style={[styles.uploadText, nvqImage && { color: "#10B981" }]}>
                  {nvqImage ? 'Certificate Selected' : 'Upload NVQ Certificate'}
                </Text>
              </TouchableOpacity>
            </Field>
          )}

          <Field label="Password *" error={errors.password}>
            <View style={styles.passWrap}>
              <TextInput
                style={[styles.input, { paddingRight: 50 }]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={form.password}
                onChangeText={(t) => set('password', t)}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? "eye-off" : "eye"} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </Field>

          <Field label="Confirm Password *" error={errors.confirm}>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              value={form.confirm}
              onChangeText={(t) => set('confirm', t)}
              secureTextEntry={!showPass}
            />
          </Field>

          <TouchableOpacity style={styles.termsWrap} onPress={() => setAgreeTerms(!agreeTerms)}>
            <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
              {agreeTerms && <Ionicons name="checkmark" size={12} color="#fff" />}
            </View>
            <Text style={styles.termsText}>I agree to the Terms and Privacy Policy</Text>
          </TouchableOpacity>

          <PrimaryButton
            label="Create Account"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            color="#2563EB"
            style={styles.registerBtn}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.link}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoCard: {
    width: 64, height: 64,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    ...SHADOW.md,
  },
  brandTitle: { fontSize: 28, letterSpacing: -0.5 },
  subtitle: { color: '#64748B', fontSize: 14, marginTop: 4 },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: 14,
    marginBottom: 24,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
    borderRadius: 10,
  },
  activeRoleTab: { backgroundColor: '#2563EB' },
  roleText: { color: '#64748B', fontSize: 14, ...FONTS.medium },
  activeRoleText: { color: '#fff' },
  form: { gap: 4 },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { color: '#475569', fontSize: 13, ...FONTS.bold, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1E293B',
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerText: { fontSize: 15, color: '#1E293B' },
  districtList: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  districtItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  districtItemText: { fontSize: 14, color: '#1E293B' },
  passWrap: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },
  errText: { color: COLORS.danger, fontSize: 12, marginTop: 4 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    gap: 10,
  },
  uploadBtnActive: { borderColor: '#10B981', backgroundColor: '#ECFDF5', borderStyle: 'solid' },
  uploadText: { color: '#64748B', fontSize: 14, ...FONTS.medium },
  termsWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#2563EB' },
  termsText: { fontSize: 13, color: '#64748B' },
  registerBtn: { marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#64748B' },
  link: { color: '#2563EB', ...FONTS.bold },
});

export default RegisterScreen;