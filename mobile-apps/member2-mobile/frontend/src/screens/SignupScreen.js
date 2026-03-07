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

const DISTRICTS = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale',
    'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna',
    'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa',
    'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura',
    'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle',
];

export const SignupScreen = ({ navigation }) => {
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

    const prefix = role === 'Householder' ? '00H-' : '00E-';

    const validate = () => {
        const newErrors = {};

        if (!firstName.trim()) newErrors.firstName = 'First name is required';
        if (!lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!address.trim()) newErrors.address = 'Address is required';
        if (!district) newErrors.district = 'Please select a district';

        // Phone validation (Sri Lankan format)
        const phoneRegex = /^0\d{9}$/;
        if (!phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!phoneRegex.test(phone)) {
            newErrors.phone = 'Enter valid 10-digit phone (e.g., 0771234567)';
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(email)) {
            newErrors.email = 'Enter a valid email address';
        }

        // Password validation
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        // Confirm password
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        // Electrician specific validation
        if (role === 'Electrician' && !nvqImage) {
            newErrors.nvqImage = 'NVQ Certificate/NIC upload is required for Electricians';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignup = async () => {
        if (!validate()) return;

        setLoading(true);
        const fullPassword = prefix + password;

        let nvqCertificateUrl = null;

        // If Electrician, first upload the NVQ image to backend
        if (role === 'Electrician' && nvqImage) {
            try {
                const uploadResponse = await FileSystem.uploadAsync(
                    'http://192.168.8.101:8003/api/upload',
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
            password: fullPassword,
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
                    <Text style={styles.subtitle}>Create your account</Text>
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
                            Householder
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
                            Electrician
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <Input
                    label="First Name"
                    value={firstName}
                    onChangeText={(t) => { setFirstName(t); setErrors(e => ({ ...e, firstName: '' })); }}
                    placeholder="First Name"
                    error={errors.firstName}
                />
                <Input
                    label="Last Name"
                    value={lastName}
                    onChangeText={(t) => { setLastName(t); setErrors(e => ({ ...e, lastName: '' })); }}
                    placeholder="Last Name"
                    error={errors.lastName}
                />
                <Input
                    label="Address"
                    value={address}
                    onChangeText={(t) => { setAddress(t); setErrors(e => ({ ...e, address: '' })); }}
                    placeholder="Address"
                    error={errors.address}
                />

                {/* District Dropdown */}
                <View style={{ marginBottom: theme.spacing.md }}>
                    <Text style={styles.fieldLabel}>District</Text>
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
                            {district || 'Select District'}
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
                    label="Phone Number"
                    value={phone}
                    onChangeText={(t) => { setPhone(t); setErrors(e => ({ ...e, phone: '' })); }}
                    keyboardType="phone-pad"
                    placeholder="0771234567"
                    error={errors.phone}
                />
                <Input
                    label="Email"
                    value={email}
                    onChangeText={(t) => { setEmail(t); setErrors(e => ({ ...e, email: '' })); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="john@example.com"
                    error={errors.email}
                />
                <Input
                    label="Password"
                    value={password}
                    onChangeText={(t) => { setPassword(t); setErrors(e => ({ ...e, password: '' })); }}
                    secureTextEntry
                    placeholder="Password"
                    prefix={prefix}
                    error={errors.password}
                />
                <Input
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={(t) => { setConfirmPassword(t); setErrors(e => ({ ...e, confirmPassword: '' })); }}
                    secureTextEntry
                    placeholder="Confirm Password"
                    prefix={prefix}
                    error={errors.confirmPassword}
                />

                {/* Electrician NVQ Upload */}
                {role === 'Electrician' && (
                    <View style={styles.uploadContainer}>
                        <Text style={styles.fieldLabel}>NVQ Certificate or NIC <Text style={{ color: theme.colors.danger }}>*</Text></Text>
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
                                {nvqImage ? 'Document Selected' : 'Tap to upload picture'}
                            </Text>
                        </TouchableOpacity>
                        {errors.nvqImage && <Text style={styles.errorText}>{errors.nvqImage}</Text>}
                        <Text style={styles.uploadHint}>Admin will verify this document before you can accept jobs.</Text>
                    </View>
                )}

                {/* Create Account Button */}
                <GradientButton
                    title="Create Account"
                    icon="sparkles"
                    onPress={handleSignup}
                    loading={loading}
                    style={styles.signupButton}
                />

                {/* Google Sign Up */}
                <Button
                    title="Sign up with Google"
                    variant="surface"
                    icon="logo-google"
                    onPress={() => Alert.alert('Google Auth', 'Coming soon')}
                    style={styles.googleButton}
                />

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginText}>Login</Text>
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
