import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { buildApiUrl } from '../api';

export const ProfileSettingsScreen = ({ navigation }) => {
    const { user, updateUser } = useAuth();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [email, setEmail] = useState(user?.email || '');
    const [location, setLocation] = useState(user?.district || '');
    const [saved, setSaved] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!firstName.trim()) newErrors.firstName = t('validation.required');
        if (!lastName.trim()) newErrors.lastName = t('validation.required');
        const phoneRegex = /^0\d{9}$/;
        if (phone && !phoneRegex.test(phone)) newErrors.phone = t('validation.invalidPhone');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) newErrors.email = t('validation.invalidEmail');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setLoading(true);

        try {
            const response = await fetch(buildApiUrl(`/users/${user.id}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    phone,
                    district: location
                })
            });

            const data = await response.json();

            if (data.success) {
                await updateUser({
                    firstName,
                    lastName,
                    phone,
                    district: location
                });

                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            } else {
                Alert.alert('Error', data.message || 'Failed to update profile');
            }

        } catch (error) {
            console.error('Profile update error:', error);
            Alert.alert('Network Error', 'Could not reach server to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('profile.title')}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarLarge}>
                        <Ionicons name="person" size={36} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.avatarName}>{firstName} {lastName}</Text>
                </View>

                <Input label={t('profile.firstName')} value={firstName} onChangeText={(tInput) => { setFirstName(tInput); setErrors(e => ({ ...e, firstName: '' })); }} error={errors.firstName} />
                <Input label={t('profile.lastName')} value={lastName} onChangeText={(tInput) => { setLastName(tInput); setErrors(e => ({ ...e, lastName: '' })); }} error={errors.lastName} />
                <Input label={t('profile.location')} value={location} onChangeText={setLocation} placeholder={t('profile.location')} />
                <Input label={t('profile.phone')} value={phone} onChangeText={(tInput) => { setPhone(tInput); setErrors(e => ({ ...e, phone: '' })); }} keyboardType="phone-pad" error={errors.phone} />
                <Input label={t('profile.email')} value={email} onChangeText={(tInput) => { setEmail(tInput); setErrors(e => ({ ...e, email: '' })); }} keyboardType="email-address" autoCapitalize="none" error={errors.email} />

                <Button
                    title={loading ? t('profile.saving') : saved ? t('profile.saved') : t('profile.saveChanges')}
                    variant={saved ? 'success' : 'primary'}
                    onPress={handleSave}
                    disabled={loading}
                    style={styles.saveButton}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    backButton: { padding: theme.spacing.sm, marginRight: theme.spacing.sm },
    headerTitle: { ...theme.typography.h3 },
    scrollContent: { padding: theme.spacing.lg, paddingBottom: 40 },
    avatarSection: { alignItems: 'center', marginBottom: theme.spacing.xl },
    avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.sm, borderWidth: 2, borderColor: theme.colors.primary + '30' },
    avatarName: { ...theme.typography.h3 },
    saveButton: { marginTop: theme.spacing.md },
});
