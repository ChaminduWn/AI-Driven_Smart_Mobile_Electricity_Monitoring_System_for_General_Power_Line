import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../api/authAPI';
import { COLORS, SPACING, RADIUS, FONTS, SHADOW } from '../utils/theme';
import { PrimaryButton } from '../components/SharedComponents';

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
    full_name: '', email: '', phone_number: '', password: '', confirm: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
      };
      const res = await authAPI.register(payload);
      const data = res.data;
      const accessToken = data.access_token || data.accessToken || data.token;
      const refreshToken = data.refresh_token || data.refreshToken || data.access_token || data.token;
      const userData = data.user || data.profile || { email: form.email.trim().toLowerCase() };
      if (!accessToken) {
        console.error("Register response:", JSON.stringify(data));
        Alert.alert("Error", "Server response missing token. Check console.");
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

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

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
  container: { flexGrow: 1, padding: SPACING.xl, paddingTop: SPACING.xxxl },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  logoWrap: {
    width: 70, height: 70,
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.xl,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOW.md,
  },
  logoIcon: { fontSize: 36 },
  title: { color: COLORS.textPrimary, fontSize: 26, ...FONTS.bold },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  form: {
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOW.md,
  },
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
  errText: { color: COLORS.danger, fontSize: 12, marginTop: 4 },
  btn: { marginTop: SPACING.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
  footerText: { color: COLORS.textSecondary },
  link: { color: COLORS.primary, ...FONTS.semiBold },
});

export default RegisterScreen;