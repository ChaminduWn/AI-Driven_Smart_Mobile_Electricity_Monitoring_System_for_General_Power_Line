import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../components/Input';
import { GradientButton } from '../components/GradientButton';
import { Button } from '../components/Button';
import { LocationModal } from '../components/LocationModal';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useTranslation } from 'react-i18next';
import { buildApiUrl } from '../api';

const DISTRICTS = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale',
    'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna',
    'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa',
    'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura',
    'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle',
];

export const SignupScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [address, setAddress] = useState('');
    const [district, setDistrict] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('Householder');
    const [nvqImage, setNvqImage] = useState(null);
    const [showDistrictPicker, setShowDistrictPicker] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [errors, setErrors] = useState({});

    const { signup } = useAuth();
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const newErrors = {};

        if (!firstName.trim()) newErrors.firstName = t('validation.firstNameReq');
        if (!lastName.trim()) newErrors.lastName = t('validation.lastNameReq');
        if (!address.trim()) newErrors.address = t('validation.addressReq');
        if (!district) newErrors.district = t('validation.districtReq');

        // Phone validation (Sri Lankan format)
        const phoneRegex = /^0\d{9}$/;
        if (!phone.trim()) {
            newErrors.phone = t('validation.phoneReq');
        } else if (!phoneRegex.test(phone)) {
            newErrors.phone = t('validation.phoneFormat');
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            newErrors.email = t('validation.emailReq');
        } else if (!emailRegex.test(email)) {
            newErrors.email = t('validation.emailFormat');
        }

        // Password validation
        if (!password) {
            newErrors.password = t('validation.passwordReq');
        } else if (password.length < 6) {
            newErrors.password = t('validation.passwordLength');
        }

        // Confirm password
        if (!confirmPassword) {
            newErrors.confirmPassword = t('validation.confirmPasswordReq');
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = t('validation.passwordMismatch');
        }

        // Electrician specific validation
        if (role === 'Electrician' && !nvqImage) {
            newErrors.nvqImage = t('validation.nvqReq');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignup = async () => {
        if (!validate()) return;

        setLoading(true);

        let nvqCertificateUrl = null;

        // If Electrician, first upload the NVQ image to backend
        if (role === 'Electrician' && nvqImage) {
            try {
                const uploadResponse = await FileSystem.uploadAsync(
                    buildApiUrl('/upload'),
                    nvqImage.uri,
                    {
                        fieldName: 'image',
                        httpMethod: 'POST',
                        uploadType: 1, // 1 represents FileSystemUploadType.MULTIPART
                        mimeType: 'image/jpeg',
                    }
                );

                const uploadData = JSON.parse(uploadResponse.body);
                if (uploadData.success && uploadData.url) {
                    nvqCertificateUrl = uploadData.url;
                } else {
                    setLoading(false);
                    return Alert.alert('Upload Failed', uploadData.message || 'Failed to securely upload NVQ certificate');
                }
            } catch (err) {
                setLoading(false);
                return Alert.alert('Upload Error', `Could not reach server to upload the certificate: ${err.message || 'Unknown network error'}`);
            }
        }

        const userData = {
            firstName,
            lastName,
            address,
            district,
            phone,
            email,
            password,
            role,
            nvqCertificateUrl,
        };

        const res = await signup(userData);
        setLoading(false);

        if (res.success) {
            setShowLocationModal(true);
        } else {
            Alert.alert('Signup Failed', res.message);
        }
    };

    const handleLocationAllow = async () => {
        try {
            await Location.requestForegroundPermissionsAsync();
        } catch (e) {
            // Permission denied or error
        }
        setShowLocationModal(false);
        navigation.navigate('Login');
    };

    const handleLocationSkip = () => {
        setShowLocationModal(false);
        navigation.navigate('Login');
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setNvqImage(result.assets[0]);
            setErrors({ ...errors, nvqImage: '' });
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
                        <Ionicons name="flash" size={32} color={theme.colors.secondary} />
                    </View>
                    <Text style={styles.appName}>
                        <Text style={{ fontWeight: '300' }}>Power</Text>
                        <Text style={{ fontWeight: '800' }}>Link</Text>
                    </Text>
                    <Text style={styles.subtitle}>{t('auth.createAccount')}</Text>
                </View>

                {/* Role Toggle */}
                <View style={styles.roleContainer}>
                    <TouchableOpacity
                        style={[styles.roleTab, role === 'Householder' && styles.activeRoleTab]}
                        onPress={() => setRole('Householder')}
                    >
                        <Ionicons
                            name="person-outline"
                            size={18}
                            color={role === 'Householder' ? '#FFFFFF' : theme.colors.textMuted}
                            style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.roleText, role === 'Householder' && styles.activeRoleText]}>
                            {t('auth.householder')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.roleTab, role === 'Electrician' && styles.activeRoleTab]}
                        onPress={() => setRole('Electrician')}
                    >
                        <Ionicons
                            name="construct-outline"
                            size={18}
                            color={role === 'Electrician' ? '#FFFFFF' : theme.colors.textMuted}
                            style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.roleText, role === 'Electrician' && styles.activeRoleText]}>
                            {t('auth.electrician')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <Input
                    label={t('profile.firstName')}
                    value={firstName}
                    onChangeText={(tInput) => { setFirstName(tInput); setErrors(e => ({ ...e, firstName: '' })); }}
                    placeholder={t('profile.firstName')}
                    error={errors.firstName}
                />
                <Input
                    label={t('profile.lastName')}
                    value={lastName}
                    onChangeText={(tInput) => { setLastName(tInput); setErrors(e => ({ ...e, lastName: '' })); }}
                    placeholder={t('profile.lastName')}
                    error={errors.lastName}
                />
                <Input
                    label={t('auth.address')}
                    value={address}
                    onChangeText={(tInput) => { setAddress(tInput); setErrors(e => ({ ...e, address: '' })); }}
                    placeholder={t('auth.address')}
                    error={errors.address}
                />

                {/* District Dropdown */}
                <View style={{ marginBottom: theme.spacing.md }}>
                    <Text style={styles.fieldLabel}>{t('auth.district')}</Text>
                    <TouchableOpacity
                        style={[
                            styles.districtButton,
                            errors.district && { borderColor: theme.colors.danger },
                        ]}
                        onPress={() => setShowDistrictPicker(!showDistrictPicker)}
                    >
                        <Text style={[
                            styles.districtText,
                            !district && { color: theme.colors.textMuted },
                        ]}>
                            {district || t('auth.selectDistrict')}
                        </Text>
                        <Ionicons
                            name={showDistrictPicker ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={theme.colors.textMuted}
                        />
                    </TouchableOpacity>
                    {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}

                    {showDistrictPicker && (
                        <ScrollView
                            style={styles.districtList}
                            nestedScrollEnabled
                        >
                            {DISTRICTS.map((d) => (
                                <TouchableOpacity
                                    key={d}
                                    style={[styles.districtItem, district === d && styles.districtItemActive]}
                                    onPress={() => {
                                        setDistrict(d);
                                        setShowDistrictPicker(false);
                                        setErrors(e => ({ ...e, district: '' }));
                                    }}
                                >
                                    <Text style={[
                                        styles.districtItemText,
                                        district === d && { color: theme.colors.primary },
                                    ]}>
                                        {d}
                                    </Text>
                                    {district === d && (
                                        <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                <Input
                    label={t('profile.phone')}
                    value={phone}
                    onChangeText={(tInput) => { setPhone(tInput); setErrors(e => ({ ...e, phone: '' })); }}
                    keyboardType="phone-pad"
                    placeholder="0771234567"
                    error={errors.phone}
                />
                <Input
                    label={t('profile.email')}
                    value={email}
                    onChangeText={(tInput) => { setEmail(tInput); setErrors(e => ({ ...e, email: '' })); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="john@example.com"
                    error={errors.email}
                />
                <Input
                    label={t('auth.password')}
                    value={password}
                    onChangeText={(tInput) => { setPassword(tInput); setErrors(e => ({ ...e, password: '' })); }}
                    secureTextEntry
                    placeholder={t('auth.password')}
                    error={errors.password}
                />
                <Input
                    label={t('auth.confirmPassword')}
                    value={confirmPassword}
                    onChangeText={(tInput) => { setConfirmPassword(tInput); setErrors(e => ({ ...e, confirmPassword: '' })); }}
                    secureTextEntry
                    placeholder={t('auth.confirmPassword')}
                    error={errors.confirmPassword}
                />

                {/* Electrician NVQ Upload */}
                {role === 'Electrician' && (
                    <View style={styles.uploadContainer}>
                        <Text style={styles.fieldLabel}>{t('auth.nvqRequired')} <Text style={{ color: theme.colors.danger }}>*</Text></Text>
                        <TouchableOpacity
                            style={[
                                styles.uploadButton,
                                errors.nvqImage && { borderColor: theme.colors.danger },
                                nvqImage && styles.uploadButtonSuccess
                            ]}
                            onPress={pickImage}
                        >
                            <Ionicons
                                name={nvqImage ? "checkmark-circle" : "cloud-upload-outline"}
                                size={24}
                                color={nvqImage ? theme.colors.success : theme.colors.textMuted}
                            />
                            <Text style={[styles.uploadText, nvqImage && { color: theme.colors.success }]}>
                                {nvqImage ? t('auth.documentSelected') : t('auth.tapToUpload')}
                            </Text>
                        </TouchableOpacity>
                        {errors.nvqImage && <Text style={styles.errorText}>{errors.nvqImage}</Text>}
                        <Text style={styles.uploadHint}>{t('auth.adminVerifyHint')}</Text>
                    </View>
                )}

                {/* Create Account Button */}
                <GradientButton
                    title={t('auth.createAccountBtn')}
                    icon="sparkles"
                    onPress={handleSignup}
                    loading={loading}
                    style={styles.signupButton}
                />

                {/* Google Sign Up */}
                <Button
                    title={t('auth.signupWithGoogle')}
                    variant="surface"
                    icon="logo-google"
                    onPress={() => Alert.alert('Google Auth', 'Coming soon')}
                    style={styles.googleButton}
                />

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>{t('auth.alreadyHaveAccount')}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginText}>{t('auth.login')}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Location Modal */}
            <LocationModal
                visible={showLocationModal}
                onAllow={handleLocationAllow}
                onSkip={handleLocationSkip}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        padding: theme.spacing.lg,
        paddingBottom: 40,
    },
    branding: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        marginTop: theme.spacing.md,
    },
    logoContainer: {
        width: 56,
        height: 56,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.secondary + '40',
    },
    appName: {
        fontSize: 26,
        color: theme.colors.text,
        marginBottom: 4,
    },
    subtitle: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
    },
    roleContainer: {
        flexDirection: 'row',
        marginBottom: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: 4,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    roleTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: theme.borderRadius.md,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    activeRoleTab: {
        backgroundColor: theme.colors.primary,
    },
    roleText: {
        color: theme.colors.textMuted,
        fontWeight: '600',
        fontSize: 14,
    },
    activeRoleText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    fieldLabel: {
        ...theme.typography.label,
        marginBottom: 6,
    },
    districtButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.inputBackground,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 14,
    },
    districtText: {
        color: theme.colors.text,
        fontSize: 15,
    },
    districtList: {
        maxHeight: 200,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginTop: 4,
    },
    districtItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    districtItemActive: {
        backgroundColor: theme.colors.primary + '15',
    },
    districtItemText: {
        color: theme.colors.text,
        fontSize: 14,
    },
    errorText: {
        color: theme.colors.danger,
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    uploadContainer: {
        marginBottom: theme.spacing.lg,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.inputBackground,
    },
    uploadButtonSuccess: {
        borderColor: theme.colors.success,
        borderStyle: 'solid',
        backgroundColor: theme.colors.success + '10',
    },
    uploadText: {
        marginLeft: theme.spacing.sm,
        color: theme.colors.textMuted,
        fontWeight: '500',
    },
    uploadHint: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        marginTop: 6,
        marginLeft: 4,
    },
    signupButton: {
        marginBottom: theme.spacing.md,
        marginTop: theme.spacing.sm,
    },
    googleButton: {
        marginBottom: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: theme.spacing.xl,
    },
    footerText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    loginText: {
        color: theme.colors.primary,
        fontWeight: '700',
        fontSize: 14,
    },
});
