import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { buildApiUrl, buildAssetUrl } from '../api';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

export const AccountScreen = ({ navigation }) => {
    const { user, logout, refreshUser } = useAuth();
    const { t, i18n } = useTranslation();
    const [uploading, setUploading] = useState(false);

    const menuItems = [
        { id: 'profile', title: t('account.profileSettings'), icon: 'person-outline', screen: 'ProfileSettings' },
        { id: 'about', title: t('account.aboutUs'), icon: 'information-circle-outline', screen: 'AboutUs' },
        { id: 'help', title: t('account.helpSupport'), icon: 'headset-outline', screen: 'HelpSupport' },
    ];

    const qualificationCertificates = useMemo(
        () => (Array.isArray(user?.qualificationCertificates) ? user.qualificationCertificates : []),
        [user?.qualificationCertificates]
    );

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'si' : 'en';
        i18n.changeLanguage(newLang);
    };

    const handleLogout = () => {
        Alert.alert(t('account.logout'), t('account.logoutConfirmMsg'), [
            { text: t('account.cancel'), style: 'cancel' },
            { text: t('account.logout'), style: 'destructive', onPress: logout },
        ]);
    };

    const handleUploadCertificate = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (result.canceled) {
                return;
            }

            setUploading(true);
            const uploadResponse = await FileSystem.uploadAsync(buildApiUrl('/upload'), result.assets[0].uri, {
                fieldName: 'image',
                httpMethod: 'POST',
                uploadType: 1,
                mimeType: 'image/jpeg',
            });

            const uploadData = JSON.parse(uploadResponse.body);
            if (!uploadData.success || !uploadData.url) {
                throw new Error(uploadData.message || t('member2.account.uploadFailedMsg'));
            }

            const response = await fetch(buildApiUrl(`/users/${user?.id}/certificates`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageUrl: uploadData.url,
                    title: `Qualification Certificate ${qualificationCertificates.length + 1}`,
                }),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data?.message || t('member2.account.uploadFailedMsg'));
            }

            await refreshUser(user?.id, { silent: true });
            Alert.alert(t('member2.account.uploadedTitle'), t('member2.account.uploadedMsg'));
        } catch (error) {
            Alert.alert(t('member2.account.uploadFailedTitle'), error.message || t('member2.account.uploadFailedMsg'));
        } finally {
            setUploading(false);
        }
    };

    const renderStatusBadge = (status) => {
        const statusColor =
            status === 'Accepted'
                ? theme.colors.success
                : status === 'Rejected'
                    ? theme.colors.danger
                    : theme.colors.warning;

        const translatedStatus =
            status === 'Accepted'
                ? t('member2.account.statusAccepted')
                : status === 'Rejected'
                    ? t('member2.account.statusRejected')
                    : t('member2.account.statusPending');

        return (
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{translatedStatus}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('account.title')}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.userCard}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={28} color={theme.colors.primary} />
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
                        <Text style={styles.userEmail}>{user?.email}</Text>
                        <View style={styles.idBadge}>
                            <Text style={styles.idText}>
                                {user?.role === 'Electrician' ? t('account.electricianId') : t('account.householderId')}#{user?.displayId || '1'}
                            </Text>
                        </View>
                    </View>
                </View>

                {user?.role === 'Electrician' && (
                    <>
                        <View style={styles.documentCard}>
                            <View style={styles.documentHeader}>
                                <Ionicons name="document-text-outline" size={20} color={theme.colors.text} />
                                <Text style={styles.documentTitle}>{t('account.kycDocument')}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: user?.isVerified ? theme.colors.success + '20' : theme.colors.warning + '20' }]}>
                                    <Text style={[styles.statusText, { color: user?.isVerified ? theme.colors.success : theme.colors.warning }]}>
                                        {user?.isVerified ? t('account.verified') : t('account.pendingReview')}
                                    </Text>
                                </View>
                            </View>
                            {user?.nvqCertificateUrl ? (
                                <Image
                                    source={{ uri: buildAssetUrl(user.nvqCertificateUrl) }}
                                    style={styles.documentImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <Text style={styles.noDocText}>{t('account.noDocument')}</Text>
                            )}
                        </View>

                        <View style={styles.documentCard}>
                            <View style={styles.documentHeader}>
                                <Ionicons name="school-outline" size={20} color={theme.colors.text} />
                                <Text style={styles.documentTitle}>{t('member2.account.uploadQualifications')}</Text>
                                <TouchableOpacity style={styles.uploadButton} onPress={handleUploadCertificate} disabled={uploading}>
                                    {uploading ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" />
                                            <Text style={styles.uploadButtonText}>{t('member2.account.upload')}</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.sectionHelperText}>
                                {t('member2.account.uploadHelper')}
                            </Text>

                            {qualificationCertificates.length > 0 ? qualificationCertificates.map((certificate) => (
                                <View key={certificate.id} style={styles.certificateCard}>
                                    <Image source={{ uri: buildAssetUrl(certificate.imageUrl) }} style={styles.certificateImage} />
                                    <View style={styles.certificateInfo}>
                                        <Text style={styles.certificateTitle}>{certificate.title}</Text>
                                        <Text style={styles.certificateMeta}>
                                            {t('member2.account.uploadedOn')} {new Date(certificate.uploadedAt).toLocaleDateString()}
                                        </Text>
                                        {certificate.reviewNotes ? (
                                            <Text style={styles.certificateMeta}>{certificate.reviewNotes}</Text>
                                        ) : null}
                                    </View>
                                    {renderStatusBadge(certificate.status)}
                                </View>
                            )) : (
                                <Text style={styles.noDocText}>{t('member2.account.noExtraCertificates')}</Text>
                            )}
                        </View>
                    </>
                )}

                <View style={styles.menuContainer}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.menuItem}
                            onPress={() => navigation.navigate(item.screen)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.menuIconContainer}>
                                <Ionicons name={item.icon} size={22} color={theme.colors.primary} />
                            </View>
                            <Text style={styles.menuTitle}>{item.title}</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity style={styles.menuItem} onPress={toggleLanguage} activeOpacity={0.7}>
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="language-outline" size={22} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.menuTitle}>{t('account.language')}</Text>
                        <Ionicons name="sync-outline" size={20} color={theme.colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, styles.logoutItem]}
                        onPress={handleLogout}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.menuIconContainer, { backgroundColor: theme.colors.danger + '15' }]}>
                            <Ionicons name="log-out-outline" size={22} color={theme.colors.danger} />
                        </View>
                        <Text style={[styles.menuTitle, { color: theme.colors.danger }]}>{t('account.logout')}</Text>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.danger} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.version}>{t('account.version')} v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    headerTitle: { ...theme.typography.h2 },
    scrollContent: { paddingBottom: theme.spacing.xl },
    userCard: {
        flexDirection: 'row',
        padding: theme.spacing.lg,
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    userInfo: { flex: 1 },
    userName: { ...theme.typography.h3 },
    userEmail: { ...theme.typography.caption, marginTop: 2 },
    idBadge: { alignSelf: 'flex-start', marginTop: 6, backgroundColor: theme.colors.primary + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.xs },
    idText: { color: theme.colors.primary, fontSize: 11, fontWeight: '700' },
    documentCard: {
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    documentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm },
    documentTitle: { ...theme.typography.body, fontWeight: '600', marginLeft: 8, flex: 1 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.borderRadius.sm },
    statusText: { fontSize: 12, fontWeight: '700' },
    documentImage: { width: '100%', height: 160, borderRadius: theme.borderRadius.md, marginTop: theme.spacing.sm, backgroundColor: theme.colors.background },
    noDocText: { ...theme.typography.caption, color: theme.colors.textMuted, fontStyle: 'italic', marginTop: theme.spacing.xs },
    sectionHelperText: { ...theme.typography.caption, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm, lineHeight: 18 },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    uploadButtonText: { color: '#FFFFFF', fontWeight: '700', marginLeft: 6, fontSize: 12 },
    certificateCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
        marginTop: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    certificateImage: { width: 64, height: 64, borderRadius: theme.borderRadius.sm, backgroundColor: theme.colors.surface },
    certificateInfo: { flex: 1, marginLeft: 12, marginRight: 10 },
    certificateTitle: { ...theme.typography.bodySmall, fontWeight: '700' },
    certificateMeta: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 4 },
    menuContainer: { padding: theme.spacing.lg },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    menuIconContainer: { width: 40, height: 40, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    menuTitle: { ...theme.typography.body, fontWeight: '600', flex: 1 },
    logoutItem: { marginTop: theme.spacing.md, borderColor: theme.colors.danger + '30' },
    version: { ...theme.typography.caption, textAlign: 'center', marginBottom: theme.spacing.xl },
});
