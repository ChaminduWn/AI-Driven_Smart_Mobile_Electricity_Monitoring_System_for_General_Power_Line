import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Card } from '../components/Card';
import { GradientButton } from '../components/GradientButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl } from '../api';
import { useTranslation } from 'react-i18next';

const formatCurrency = (amount, t) => {
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
        return t('member2.availableElectricians.pricePending');
    }

    return `LKR ${Number(amount).toLocaleString()}`;
};

const formatEta = (minutes, t) => {
    if (!minutes) {
        return t('member2.availableElectricians.calculatingEta');
    }

    return `${minutes} ${t('member2.availableElectricians.minutesAwaySuffix')}`;
};

export const AvailableElectriciansScreen = ({ route, navigation }) => {
    const { category, subCategory, description, location, issuePhotos, address, service } = route.params;
    const { user } = useAuth();
    const { t } = useTranslation();

    const [job, setJob] = useState(null);
    const [creatingJob, setCreatingJob] = useState(true);
    const [polling, setPolling] = useState(false);
    const [searchSeconds, setSearchSeconds] = useState(0);

    const acceptedJob = job?.status === 'Accepted' || job?.status === 'InProgress' ? job : null;

    useEffect(() => {
        let mounted = true;
        let pollInterval;
        let timerInterval;

        const createJob = async () => {
            try {
                setCreatingJob(true);
                const response = await fetch(buildApiUrl('/jobs'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        householderId: user?.id,
                        title: `${category.title} ${t('member2.availableElectricians.issueSuffix')}`,
                        serviceId: service?.serviceId,
                        serviceName: service?.name || subCategory,
                        serviceAmount: service?.basePrice ?? null,
                        description,
                        issueAddress: address,
                        locationLat: location.latitude,
                        locationLng: location.longitude,
                        district: user?.district || 'Colombo',
                        category: category.title,
                        subCategory,
                        issuePhotos: issuePhotos || [],
                    }),
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data?.message || t('member2.availableElectricians.requestFailedMsg'));
                }

                if (mounted) {
                    setJob(data.job);
                }
            } catch (error) {
                Alert.alert(t('member2.availableElectricians.requestFailedTitle'), error.message || t('member2.availableElectricians.requestFailedMsg'));
                navigation.goBack();
            } finally {
                if (mounted) {
                    setCreatingJob(false);
                }
            }
        };

        createJob();

        timerInterval = setInterval(() => {
            if (mounted) {
                setSearchSeconds((current) => current + 1);
            }
        }, 1000);

        return () => {
            mounted = false;
            clearInterval(timerInterval);
            clearInterval(pollInterval);
        };
    }, []);

    useEffect(() => {
        if (!job?.id || acceptedJob) {
            return undefined;
        }

        const intervalId = setInterval(async () => {
            try {
                setPolling(true);
                const response = await fetch(buildApiUrl(`/jobs/${job.id}`));
                const data = await response.json();

                if (response.ok && data.success && data.job) {
                    setJob(data.job);
                }
            } catch (error) {
                console.error('Poll job status error', error);
            } finally {
                setPolling(false);
            }
        }, 5000);

        return () => clearInterval(intervalId);
    }, [job?.id, acceptedJob]);

    const searchingMinutes = useMemo(() => Math.floor(searchSeconds / 60), [searchSeconds]);
    const searchingRemainderSeconds = useMemo(() => searchSeconds % 60, [searchSeconds]);

    const handleCancel = async () => {
        if (!job?.id) {
            navigation.goBack();
            return;
        }

        try {
            await fetch(buildApiUrl(`/jobs/${job.id}/cancel`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason: 'Householder cancelled while waiting for technician' }),
            });
        } catch (error) {
            console.error('Cancel request error', error);
        } finally {
            navigation.goBack();
        }
    };

    const openTracking = () => {
        if (!acceptedJob) {
            return;
        }

        navigation.navigate('TrackElectrician', {
            electrician: {
                name: acceptedJob.electrician?.fullName,
                rating: acceptedJob.electrician?.rating,
                vehicle: acceptedJob.electrician?.vehicleNumber,
                phone: acceptedJob.electrician?.phone,
            },
            location,
            job: acceptedJob,
        });
    };

    const handleCallElectrician = () => {
        if (acceptedJob?.electrician?.phone) {
            Linking.openURL(`tel:${acceptedJob.electrician.phone}`);
        }
    };

    const openChat = () => {
        if (!acceptedJob) {
            return;
        }

        navigation.navigate('Chat', {
            job: acceptedJob,
            otherPartyName: acceptedJob.electrician?.fullName || 'Technician',
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>
                        {acceptedJob ? t('member2.availableElectricians.technicianAccepted') : t('member2.availableElectricians.searchingNearby')}
                    </Text>
                    <Text style={styles.headerSubtitle}>{category.title} • {subCategory}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Card style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>{t('member2.availableElectricians.selectedServiceCharge')}</Text>
                    <Text style={styles.summaryAmount}>{formatCurrency(service?.basePrice ?? job?.estimatedCost, t)}</Text>
                    <Text style={styles.summaryAddress}>{address}</Text>
                </Card>

                {creatingJob ? (
                    <Card style={styles.centerCard}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.centerTitle}>{t('member2.availableElectricians.sendingRequestTitle')}</Text>
                        <Text style={styles.centerSubtitle}>{t('member2.availableElectricians.sendingRequestMsg')}</Text>
                    </Card>
                ) : acceptedJob ? (
                    <Card style={styles.acceptedCard} glowColor={theme.colors.success}>
                        <View style={styles.acceptedHeader}>
                            <View style={styles.acceptedBadge}>
                                <Ionicons name="checkmark-done-circle" size={28} color={theme.colors.success} />
                            </View>
                            <View style={styles.acceptedInfo}>
                                <Text style={styles.acceptedTitle}>{t('member2.availableElectricians.acceptedTitle')}</Text>
                                <Text style={styles.acceptedSubtitle}>
                                    {t('member2.availableElectricians.acceptedAt')} {new Date(acceptedJob.acceptedAt || acceptedJob.updatedAt).toLocaleTimeString()}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.electricianRow}>
                            <View style={styles.avatar}>
                                <Ionicons name="person" size={22} color={theme.colors.primary} />
                            </View>
                            <View style={styles.electricianInfo}>
                                <Text style={styles.electricianName}>{acceptedJob.electrician?.fullName || t('member2.availableElectricians.assignedTechnician')}</Text>
                                <Text style={styles.electricianMeta}>
                                    Rating {acceptedJob.electrician?.rating || 0} • {formatEta(acceptedJob.etaMinutes)}
                                </Text>
                                <Text style={styles.electricianMeta}>
                                    {acceptedJob.electrician?.phone || t('member2.availableElectricians.phoneUnavailable')}
                                </Text>
                            </View>
                            <View style={styles.amountTag}>
                                <Text style={styles.amountTagText}>{formatCurrency(acceptedJob.estimatedCost, t)}</Text>
                            </View>
                        </View>

                        <View style={styles.metaGrid}>
                            <View style={styles.metaItem}>
                                <Text style={styles.metaLabel}>{t('member2.track.distance')}</Text>
                                <Text style={styles.metaValue}>
                                    {acceptedJob.distanceKm ? `${acceptedJob.distanceKm} km` : t('member2.availableElectricians.calculating')}
                                </Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Text style={styles.metaLabel}>{t('member2.availableElectricians.jobCode')}</Text>
                                <Text style={styles.metaValue}>{acceptedJob.startCode || t('member2.dashboard.pendingPrice')}</Text>
                            </View>
                        </View>

                        <View style={styles.acceptedActions}>
                            <TouchableOpacity style={styles.secondaryAction} onPress={handleCallElectrician}>
                                <Ionicons name="call" size={18} color={theme.colors.success} />
                                <Text style={styles.secondaryActionText}>{t('member2.common.call')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryAction} onPress={openChat}>
                                <Ionicons name="chatbubble-ellipses" size={18} color={theme.colors.primary} />
                                <Text style={[styles.secondaryActionText, { color: theme.colors.primary }]}>{t('member2.common.chat')}</Text>
                            </TouchableOpacity>
                            <GradientButton
                                title={t('member2.availableElectricians.trackTechnician')}
                                icon="navigate-circle"
                                onPress={openTracking}
                                style={styles.primaryTrackButton}
                            />
                        </View>
                    </Card>
                ) : (
                    <Card style={styles.searchCard} glowColor={theme.colors.primary}>
                        <View style={styles.searchPulseWrap}>
                            <View style={styles.searchPulseOuter}>
                                <View style={styles.searchPulseMiddle}>
                                    <View style={styles.searchPulseInner}>
                                        <Ionicons name="flash" size={28} color={theme.colors.warning} />
                                    </View>
                                </View>
                            </View>
                        </View>

                        <Text style={styles.searchTitle}>{t('member2.availableElectricians.searchTitle')}</Text>
                        <Text style={styles.searchSubtitle}>{t('member2.availableElectricians.searchSubtitle')}</Text>

                        <View style={styles.searchStats}>
                            <View style={styles.searchStatBox}>
                                <Text style={styles.searchStatLabel}>{t('member2.availableElectricians.elapsedTime')}</Text>
                                <Text style={styles.searchStatValue}>
                                    {String(searchingMinutes).padStart(2, '0')}:{String(searchingRemainderSeconds).padStart(2, '0')}
                                </Text>
                            </View>
                            <View style={styles.searchStatBox}>
                                <Text style={styles.searchStatLabel}>{t('member2.common.status')}</Text>
                                <Text style={styles.searchStatValue}>{polling ? t('member2.availableElectricians.refreshing') : t('member2.availableElectricians.waiting')}</Text>
                            </View>
                        </View>

                        <View style={styles.requestChecklist}>
                            <View style={styles.checkItem}>
                                <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                                <Text style={styles.checkText}>{t('member2.availableElectricians.checklistDetails')}</Text>
                            </View>
                            <View style={styles.checkItem}>
                                <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                                <Text style={styles.checkText}>{t('member2.availableElectricians.checklistLocation')}</Text>
                            </View>
                            <View style={styles.checkItem}>
                                <Ionicons name="time" size={18} color={theme.colors.warning} />
                                <Text style={styles.checkText}>{t('member2.availableElectricians.checklistWaiting')}</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                            <Text style={styles.cancelButtonText}>{t('member2.availableElectricians.cancelRequest')}</Text>
                        </TouchableOpacity>
                    </Card>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        padding: theme.spacing.sm,
        marginRight: theme.spacing.sm,
    },
    headerTitle: {
        ...theme.typography.h3,
    },
    headerSubtitle: {
        ...theme.typography.caption,
        marginTop: 2,
    },
    content: {
        padding: theme.spacing.lg,
        paddingBottom: 120,
    },
    summaryCard: {
        marginBottom: theme.spacing.md,
        backgroundColor: `${theme.colors.secondary}12`,
        borderColor: `${theme.colors.secondary}25`,
    },
    summaryLabel: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
        marginBottom: 6,
    },
    summaryAmount: {
        ...theme.typography.h2,
        color: theme.colors.success,
        marginBottom: 6,
    },
    summaryAddress: {
        ...theme.typography.bodySmall,
        lineHeight: 18,
    },
    centerCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xxl,
    },
    centerTitle: {
        ...theme.typography.h3,
        marginTop: 14,
    },
    centerSubtitle: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
    searchCard: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
    },
    searchPulseWrap: {
        marginBottom: theme.spacing.lg,
    },
    searchPulseOuter: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(37, 99, 235, 0.10)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchPulseMiddle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(37, 99, 235, 0.16)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchPulseInner: {
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchTitle: {
        ...theme.typography.h2,
        textAlign: 'center',
        marginBottom: 8,
    },
    searchSubtitle: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: theme.spacing.lg,
    },
    searchStats: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
        marginBottom: theme.spacing.lg,
    },
    searchStatBox: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
    },
    searchStatLabel: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
        marginBottom: 6,
    },
    searchStatValue: {
        ...theme.typography.h3,
    },
    requestChecklist: {
        width: '100%',
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    checkText: {
        ...theme.typography.bodySmall,
        marginLeft: 10,
        flex: 1,
    },
    cancelButton: {
        marginTop: theme.spacing.lg,
        paddingVertical: 12,
        paddingHorizontal: 18,
    },
    cancelButtonText: {
        color: theme.colors.danger,
        fontWeight: '700',
    },
    acceptedCard: {
        paddingBottom: theme.spacing.lg,
    },
    acceptedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    acceptedBadge: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: `${theme.colors.success}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    acceptedInfo: {
        flex: 1,
    },
    acceptedTitle: {
        ...theme.typography.h3,
    },
    acceptedSubtitle: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    electricianRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.md,
        backgroundColor: `${theme.colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    electricianInfo: {
        flex: 1,
    },
    electricianName: {
        ...theme.typography.body,
        fontWeight: '700',
    },
    electricianMeta: {
        ...theme.typography.caption,
        marginTop: 4,
    },
    amountTag: {
        backgroundColor: `${theme.colors.success}15`,
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    amountTagText: {
        color: theme.colors.success,
        fontWeight: '700',
        fontSize: 12,
    },
    metaGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: theme.spacing.md,
    },
    metaItem: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
    },
    metaLabel: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
        marginBottom: 6,
    },
    metaValue: {
        ...theme.typography.body,
        fontWeight: '700',
    },
    acceptedActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    secondaryAction: {
        width: 92,
        minHeight: 52,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: `${theme.colors.success}15`,
        borderWidth: 1,
        borderColor: `${theme.colors.success}30`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryActionText: {
        color: theme.colors.success,
        fontWeight: '700',
        marginTop: 4,
        fontSize: 12,
    },
    primaryTrackButton: {
        flex: 1,
    },
});
