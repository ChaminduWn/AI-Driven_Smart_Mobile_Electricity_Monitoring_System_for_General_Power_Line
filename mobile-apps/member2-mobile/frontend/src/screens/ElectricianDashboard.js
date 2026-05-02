import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { buildApiUrl } from '../api';
import { VoiceCommandButton } from '../components/VoiceCommandButton';
import { ELECTRICIAN_HOME_INTENTS } from '../voice/intentMappings';

export const ElectricianDashboard = ({ navigation }) => {
    const { user, refreshUser } = useAuth();
    const { t, i18n } = useTranslation();
    const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);
    const [pendingJobs, setPendingJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [refreshingStatus, setRefreshingStatus] = useState(false);

    useEffect(() => {
        setIsAvailable(user?.isAvailable ?? true);
    }, [user?.isAvailable]);

    useEffect(() => {
        let mounted = true;

        const loadCurrentLocation = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    return;
                }

                const current = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Highest,
                });

                if (mounted) {
                    setCurrentLocation({
                        latitude: current.coords.latitude,
                        longitude: current.coords.longitude,
                    });
                }
            } catch (error) {
                console.error('Electrician location error', error);
            }
        };

        loadCurrentLocation();

        return () => {
            mounted = false;
        };
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            if (user?.id) {
                refreshUser(user.id, { silent: true });
            }
        }, [refreshUser, user?.id])
    );

    useEffect(() => {
        let mounted = true;

        const fetchJobs = async () => {
            try {
                if (!user?.id || !isAvailable) {
                    if (mounted) {
                        setPendingJobs([]);
                        setLoadingJobs(false);
                    }
                    return;
                }

                setLoadingJobs(true);
                const params = new URLSearchParams({
                    electricianId: user.id,
                });

                if (currentLocation?.latitude && currentLocation?.longitude) {
                    params.append('latitude', String(currentLocation.latitude));
                    params.append('longitude', String(currentLocation.longitude));
                } else if (user?.district) {
                    params.append('district', user.district);
                }

                const response = await fetch(`${buildApiUrl('/jobs')}?${params.toString()}`);
                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data?.message || t('member2.dashboard.noPendingJobsMsg'));
                }

                if (mounted) {
                    setPendingJobs(data.jobs || []);
                }
            } catch (error) {
                console.error('Fetch electrician jobs error', error);
            } finally {
                if (mounted) {
                    setLoadingJobs(false);
                }
            }
        };

        fetchJobs();
        const intervalId = setInterval(fetchJobs, 10000);

        return () => {
            mounted = false;
            clearInterval(intervalId);
        };
    }, [user?.id, user?.district, currentLocation, isAvailable]);

    const handleRefreshStatus = async () => {
        try {
            setRefreshingStatus(true);
            const result = await refreshUser(user?.id);
            if (!result.success) {
                Alert.alert(t('member2.dashboard.statusUpdateFailedTitle'), result.message || t('member2.dashboard.statusUpdateFailedMsg'));
                return;
            }

            Alert.alert(
                result.user?.isVerified ? t('member2.dashboard.accountApprovedTitle') : t('member2.dashboard.stillReviewTitle'),
                result.user?.isVerified
                    ? t('member2.dashboard.accountApprovedMsg')
                    : t('dashboard.stillUnderReview')
            );
        } finally {
            setRefreshingStatus(false);
        }
    };

    const handleVoiceIntent = async ({ intent }) => {
        if (!intent) {
            return false;
        }

        switch (intent) {
            case 'open_jobs':
            case 'go_home':
                navigation.getParent()?.navigate('JobsTab');
                return true;
            case 'open_history':
                navigation.getParent()?.navigate('PastTab');
                return true;
            case 'open_earnings':
                navigation.getParent()?.navigate('EarnedTab');
                return true;
            case 'open_account':
                navigation.getParent()?.navigate('AccountTab');
                return true;
            case 'open_profile_settings':
                navigation.getParent()?.navigate('AccountTab', { screen: 'ProfileSettings' });
                return true;
            case 'open_help_support':
                navigation.getParent()?.navigate('AccountTab', { screen: 'HelpSupport' });
                return true;
            case 'open_about_us':
                navigation.getParent()?.navigate('AccountTab', { screen: 'AboutUs' });
                return true;
            case 'open_service_setup':
                navigation.navigate('ElectricianServiceSetup');
                return true;
            case 'view_job_details':
            case 'accept_job':
                if (!pendingJobs.length) {
                    return false;
                }

                navigation.navigate('ElectricianJobDetails', { job: pendingJobs[0], currentLocation });
                return true;
            case 'change_language':
                await i18n.changeLanguage(i18n.language === 'en' ? 'si' : 'en');
                return true;
            default:
                return false;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.userName}>{t('dashboard.hello')}{user?.firstName || t('dashboard.electrician')}</Text>
                    <Text style={styles.userInfo}>📍 {user?.district || t('dashboard.location')}</Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={styles.idBadge}>
                        <Text style={styles.idText}>00E#{user?.displayId || '1'}</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Card style={styles.statusCard} glowColor={isAvailable ? theme.colors.success : theme.colors.textMuted}>
                    <View style={styles.statusRow}>
                        <View style={styles.statusInfo}>
                            <View style={[styles.statusDot, { backgroundColor: isAvailable ? theme.colors.success : theme.colors.textMuted }]} />
                            <Text style={styles.statusText}>
                                {isAvailable ? t('dashboard.available') : t('dashboard.unavailable')}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.toggleButton, isAvailable && styles.toggleActive]}
                            onPress={() => setIsAvailable(!isAvailable)}
                        >
                            <View style={[styles.toggleThumb, isAvailable && styles.toggleThumbActive]} />
                        </TouchableOpacity>
                    </View>
                </Card>

                {!user?.isVerified ? (
                    <View style={styles.verificationContainer}>
                        <View style={styles.verificationIcon}>
                            <Ionicons name="time-outline" size={48} color={theme.colors.warning} />
                        </View>
                        <Text style={styles.verificationTitle}>{t('dashboard.pendingVerifTitle')}</Text>
                        <Text style={styles.verificationDesc}>{t('dashboard.pendingVerifDesc')}</Text>
                        <Button
                            title={refreshingStatus ? t('member2.dashboard.refreshingStatus') : t('dashboard.refreshStatus')}
                            variant="outline"
                            onPress={handleRefreshStatus}
                            loading={refreshingStatus}
                            style={{ marginTop: theme.spacing.md }}
                        />
                    </View>
                ) : (
                    <>
                        <View style={styles.statsRow}>
                            <Card style={styles.statCard}>
                                <Ionicons name="star" size={20} color={theme.colors.warning} />
                                <Text style={styles.statVal}>{user?.rating || 0}</Text>
                                <Text style={styles.statLabel}>{t('dashboard.rating')}</Text>
                            </Card>
                            <Card style={styles.statCard}>
                                <Ionicons name="flash" size={20} color={theme.colors.success} />
                                <Text style={styles.statVal}>{pendingJobs.length}</Text>
                                <Text style={styles.statLabel}>{t('member2.dashboard.openJobs')}</Text>
                            </Card>
                            <Card style={styles.statCard}>
                                <Ionicons name="checkmark-done-circle" size={20} color={theme.colors.secondary} />
                                <Text style={styles.statVal}>{user?.completedJobsCount || 0}</Text>
                                <Text style={styles.statLabel}>{t('member2.dashboard.completedJobs')}</Text>
                            </Card>
                        </View>

                        <TouchableOpacity
                            style={styles.setupButton}
                            onPress={() => navigation.navigate('ElectricianServiceSetup')}
                            activeOpacity={0.7}
                        >
                            <View style={styles.setupIconContainer}>
                                <Ionicons name="settings" size={22} color={theme.colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.setupTitle}>{t('dashboard.serviceSetup')}</Text>
                                <Text style={styles.setupDesc}>{t('dashboard.serviceSetupDesc')}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                        </TouchableOpacity>

                        <Text style={styles.sectionTitle}>{t('dashboard.availableJobsNearby')}</Text>
                        {loadingJobs ? (
                            <View style={styles.jobsLoading}>
                                <ActivityIndicator color={theme.colors.primary} size="large" />
                                <Text style={styles.jobsLoadingText}>{t('member2.dashboard.loadingNearbyJobs')}</Text>
                            </View>
                        ) : pendingJobs.length > 0 ? (
                            pendingJobs.map((job) => (
                                <Card key={job.id} style={styles.jobCard}>
                                    <View style={styles.jobHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.jobType}>{job.category}</Text>
                                            <Text style={styles.jobSub}>{job.subCategory}</Text>
                                        </View>
                                        <Text style={styles.jobAmount}>
                                            {job.estimatedCost ? `LKR ${Number(job.estimatedCost).toLocaleString()}` : t('member2.dashboard.pendingPrice')}
                                        </Text>
                                    </View>
                                    <View style={styles.jobFooter}>
                                        <View style={styles.jobDetail}>
                                            <Ionicons name="location-outline" size={14} color={theme.colors.textMuted} />
                                            <Text style={styles.jobDetailText}>
                                                {job.householder?.district || user?.district} {job.distanceKm ? `(${job.distanceKm} km)` : ''}
                                            </Text>
                                        </View>
                                        <Text style={styles.jobTime}>
                                            {job.etaMinutes ? `${job.etaMinutes} min` : t('member2.dashboard.nearby')}
                                        </Text>
                                    </View>
                                    <Button
                                        title={t('member2.dashboard.viewJobDetails')}
                                        variant="primary"
                                        onPress={() => navigation.navigate('ElectricianJobDetails', { job, currentLocation })}
                                        style={styles.acceptBtn}
                                    />
                                </Card>
                            ))
                        ) : (
                            <Card style={styles.emptyJobsCard}>
                                <Ionicons name="search" size={30} color={theme.colors.primary} />
                                <Text style={styles.emptyJobsTitle}>{t('member2.dashboard.noPendingJobsTitle')}</Text>
                                <Text style={styles.emptyJobsText}>
                                    {t('member2.dashboard.noPendingJobsMsg')}
                                </Text>
                            </Card>
                        )}
                    </>
                )}
            </ScrollView>

            <VoiceCommandButton
                allowedIntents={ELECTRICIAN_HOME_INTENTS}
                onIntentMatched={handleVoiceIntent}
                disabled={!user?.isVerified}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    headerLeft: { flex: 1 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    userName: { ...theme.typography.h2 },
    userInfo: { ...theme.typography.bodySmall, marginTop: 2 },
    idBadge: { backgroundColor: `${theme.colors.secondary}20`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.sm, borderWidth: 1, borderColor: `${theme.colors.secondary}40` },
    idText: { color: theme.colors.secondary, fontSize: 11, fontWeight: '700' },
    scrollContent: { padding: theme.spacing.lg, paddingBottom: 100 },
    statusCard: { marginBottom: theme.spacing.lg },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusInfo: { flexDirection: 'row', alignItems: 'center' },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    statusText: { ...theme.typography.body, fontWeight: '600' },
    toggleButton: { width: 50, height: 28, borderRadius: 14, backgroundColor: theme.colors.border, padding: 3, justifyContent: 'center' },
    toggleActive: { backgroundColor: theme.colors.success },
    toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' },
    toggleThumbActive: { alignSelf: 'flex-end' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.lg, gap: 8 },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: theme.spacing.md },
    statVal: { ...theme.typography.h2, marginTop: 4 },
    statLabel: { ...theme.typography.caption, marginTop: 2 },
    setupButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, marginBottom: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border },
    setupIconContainer: { width: 40, height: 40, borderRadius: theme.borderRadius.md, backgroundColor: `${theme.colors.primary}15`, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    setupTitle: { ...theme.typography.body, fontWeight: '600' },
    setupDesc: { ...theme.typography.caption, marginTop: 2 },
    sectionTitle: { ...theme.typography.h3, marginBottom: theme.spacing.md },
    jobCard: { marginBottom: theme.spacing.sm },
    jobHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    jobType: { ...theme.typography.body, fontWeight: '700' },
    jobSub: { ...theme.typography.caption, marginTop: 2 },
    jobAmount: { ...theme.typography.h3, color: theme.colors.success, fontSize: 16 },
    jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
    jobDetail: { flexDirection: 'row', alignItems: 'center' },
    jobDetailText: { ...theme.typography.caption, marginLeft: 4 },
    acceptBtn: { marginTop: 4 },
    jobsLoading: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
    jobsLoadingText: { ...theme.typography.bodySmall, marginTop: 10, color: theme.colors.textSecondary },
    emptyJobsCard: { alignItems: 'center', paddingVertical: theme.spacing.xl },
    emptyJobsTitle: { ...theme.typography.h3, marginTop: theme.spacing.sm, marginBottom: 6 },
    emptyJobsText: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 18 },
    verificationContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: theme.spacing.xl,
        marginTop: theme.spacing.xl,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    verificationIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `${theme.colors.warning}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.lg,
    },
    verificationTitle: {
        ...theme.typography.h2,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },
    verificationDesc: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
});
