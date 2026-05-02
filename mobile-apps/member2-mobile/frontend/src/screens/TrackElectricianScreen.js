import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Button } from '../components/Button';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { buildApiUrl, buildAssetUrl } from '../api';
import { MapView, Marker, Polyline, PROVIDER_GOOGLE } from '../components/MapWrapper.native';
import { liveGoogleMapEnabled } from '../config/maps';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { VoiceCommandButton } from '../components/VoiceCommandButton';
import { TRACK_TECHNICIAN_INTENTS } from '../voice/intentMappings';

const fallbackLocation = {
    latitude: 6.9271,
    longitude: 79.8612,
};

const formatCurrency = (amount, t) => {
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
        return t('member2.availableElectricians.pricePending');
    }

    return `LKR ${Number(amount).toLocaleString()}`;
};

export const TrackElectricianScreen = ({ route, navigation }) => {
    const { electrician, location, job: routeJob } = route.params;
    const { user } = useAuth();
    const { t } = useTranslation();
    const [job, setJob] = useState(routeJob);
    const [loading, setLoading] = useState(false);
    const mapRef = useRef(null);

    useEffect(() => {
        if (!routeJob?.id) {
            return undefined;
        }

        const intervalId = setInterval(async () => {
            try {
                const response = await fetch(buildApiUrl(`/jobs/${routeJob.id}`));
                const data = await response.json();
                if (response.ok && data.success && data.job) {
                    setJob(data.job);
                }
            } catch (error) {
                console.error('Refresh tracked job error', error);
            }
        }, 8000);

        return () => clearInterval(intervalId);
    }, [routeJob?.id]);

    const householderLocation = useMemo(
        () => ({
            latitude: job?.locationLat || location?.latitude || fallbackLocation.latitude,
            longitude: job?.locationLng || location?.longitude || fallbackLocation.longitude,
        }),
        [job?.locationLat, job?.locationLng, location?.latitude, location?.longitude]
    );

    const electricianLocation = useMemo(
        () => ({
            latitude: job?.electricianLocationLat || householderLocation.latitude + 0.004,
            longitude: job?.electricianLocationLng || householderLocation.longitude - 0.003,
        }),
        [job?.electricianLocationLat, job?.electricianLocationLng, householderLocation.latitude, householderLocation.longitude]
    );

    useEffect(() => {
        if (!mapRef.current?.fitToCoordinates) {
            return;
        }

        mapRef.current.fitToCoordinates([householderLocation, electricianLocation], {
            edgePadding: { top: 120, right: 80, bottom: 300, left: 80 },
            animated: true,
        });
    }, [householderLocation, electricianLocation]);

    const handleCall = () => {
        const phone = job?.electrician?.phone || electrician?.phone;
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        }
    };

    const handleChat = () => {
        navigation.navigate('Chat', {
            job,
            otherPartyName: job?.electrician?.fullName || electrician?.name || t('dashboard.electrician'),
        });
    };

    const handleMakePayment = () => {
        navigation.navigate('PaymentGateway', { job });
    };

    const handleCancel = () => {
        Alert.alert(
            t('member2.track.cancelTitle'),
            t('member2.track.cancelMsg'),
            [
                { text: t('member2.track.keepJob'), style: 'cancel' },
                {
                    text: t('member2.track.cancelJob'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            if (job?.id) {
                                await fetch(buildApiUrl(`/jobs/${job.id}/cancel`), {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ reason: 'Householder cancelled accepted technician job' }),
                                });
                            }
                        } catch (error) {
                            console.error('Cancel tracked job error', error);
                        } finally {
                            setLoading(false);
                            navigation.goBack();
                        }
                    },
                },
            ]
        );
    };

    const handleVoiceIntent = async ({ intent }) => {
        switch (intent) {
            case 'open_chat':
                handleChat();
                return true;
            case 'track_technician':
                return true;
            case 'make_payment':
                if (job?.status === 'PaymentPending') {
                    handleMakePayment();
                    return true;
                }
                return false;
            case 'rate_technician':
                if (job?.status === 'Completed') {
                    navigation.navigate('Rating', {
                        electrician: {
                            id: job?.electrician?.id,
                            name: job?.electrician?.fullName || electrician?.name || t('member2.track.assignedTechnician'),
                        },
                        jobId: job?.id,
                        householderId: user?.id,
                    });
                    return true;
                }
                return false;
            case 'cancel_request':
                handleCancel();
                return true;
            default:
                return false;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.mapContainer}>
                {liveGoogleMapEnabled ? (
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={{
                            latitude: householderLocation.latitude,
                            longitude: householderLocation.longitude,
                            latitudeDelta: 0.03,
                            longitudeDelta: 0.03,
                        }}
                        showsUserLocation
                    >
                        <Marker coordinate={householderLocation} title={t('member2.track.issueLocation')} pinColor={theme.colors.danger} />
                        <Marker
                            coordinate={electricianLocation}
                            title={job?.electrician?.fullName || electrician?.name || t('member2.track.assignedTechnician')}
                            description={job?.status || 'Accepted'}
                            pinColor={theme.colors.success}
                        />
                        <Polyline
                            coordinates={[electricianLocation, householderLocation]}
                            strokeColor={theme.colors.primary}
                            strokeWidth={4}
                        />
                    </MapView>
                ) : (
                    <View style={styles.mapDisabledState}>
                        <Ionicons name="map-outline" size={34} color={theme.colors.warning} />
                        <Text style={styles.mapDisabledTitle}>{t('member2.track.mapKeyTitle')}</Text>
                        <Text style={styles.mapDisabledText}>
                            {t('member2.track.mapKeyMsg')}
                        </Text>
                    </View>
                )}

                <View style={styles.etaOverlay}>
                    <View style={styles.etaBadge}>
                        <Ionicons name="time" size={16} color={theme.colors.secondary} />
                        <Text style={styles.etaText}>
                            {job?.etaMinutes ? `${job.etaMinutes} ${t('member2.availableElectricians.minutesAwaySuffix')}` : t('member2.track.etaUpdating')}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.bottomCard}>
                <View style={styles.handleBar} />

                <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>{job?.status || 'Accepted'}</Text>
                </View>

                <View style={styles.electricianRow}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={22} color={theme.colors.primary} />
                    </View>
                    <View style={styles.electricianInfo}>
                        <Text style={styles.electricianName}>
                            {job?.electrician?.fullName || electrician?.name || t('member2.track.assignedTechnician')}
                        </Text>
                        <Text style={styles.vehicleText}>
                            {job?.electrician?.phone || electrician?.phone || t('member2.track.phoneUnavailable')}
                        </Text>
                        <Text style={styles.vehicleText}>
                            {t('member2.track.acceptedAt')} {new Date(job?.acceptedAt || job?.updatedAt || Date.now()).toLocaleTimeString()}
                        </Text>
                    </View>
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={14} color={theme.colors.warning} />
                        <Text style={styles.ratingText}>{job?.electrician?.rating || electrician?.rating || 0}</Text>
                    </View>
                </View>

                <View style={styles.infoPanel}>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>{t('member2.track.chargeAmount')}</Text>
                        <Text style={styles.infoValue}>{formatCurrency(job?.estimatedCost, t)}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>{t('member2.track.distance')}</Text>
                        <Text style={styles.infoValue}>
                            {job?.distanceKm ? `${job.distanceKm} km` : t('member2.availableElectricians.calculating')}
                        </Text>
                    </View>
                </View>

                {job?.electrician?.acceptedCertificates?.length ? (
                    <View style={styles.certificatesCard}>
                        <Text style={styles.certificatesTitle}>{t('member2.track.verifiedQualifications')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {job.electrician.acceptedCertificates.map((certificate) => (
                                <View key={certificate.id} style={styles.certificateThumbWrap}>
                                    <Image
                                        source={{ uri: buildAssetUrl(certificate.imageUrl) }}
                                        style={styles.certificateThumb}
                                    />
                                    <Text style={styles.certificateThumbText} numberOfLines={1}>{certificate.title}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                ) : null}

                {job?.startCode ? (
                    <View style={styles.startCodeContainer}>
                        <View style={styles.startCodeLeft}>
                            <Ionicons name="key" size={20} color={theme.colors.secondary} />
                            <Text style={styles.startCodeLabel}>{t('member2.track.shareCode')}</Text>
                        </View>
                        <View style={styles.startCodeValueBox}>
                            <Text style={styles.startCodeValue}>{job.startCode}</Text>
                        </View>
                    </View>
                ) : null}

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                        <Ionicons name="call" size={20} color={theme.colors.success} />
                        <Text style={styles.callText}>{t('member2.common.call')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
                        <Ionicons name="chatbubble-ellipses" size={20} color={theme.colors.primary} />
                        <Text style={styles.chatText}>{t('member2.common.chat')}</Text>
                    </TouchableOpacity>

                    <Button
                        title={
                            job?.status === 'Completed'
                                ? t('member2.track.rateTechnician')
                                : job?.status === 'PaymentPending'
                                    ? t('member2.track.makePayment')
                                : loading
                                    ? t('member2.track.cancelling')
                                    : t('member2.track.cancelJob')
                        }
                        variant={job?.status === 'Completed' || job?.status === 'PaymentPending' ? 'primary' : 'danger'}
                        onPress={
                            job?.status === 'Completed'
                                ? () => navigation.navigate('Rating', {
                                    electrician: {
                                        id: job?.electrician?.id,
                                        name: job?.electrician?.fullName || electrician?.name || t('member2.track.assignedTechnician'),
                                    },
                                    jobId: job?.id,
                                    householderId: user?.id,
                                })
                                : job?.status === 'PaymentPending'
                                    ? handleMakePayment
                                : handleCancel
                        }
                        style={{ flex: 1, marginLeft: 12 }}
                        loading={loading}
                    />
                </View>
            </View>

            <VoiceCommandButton
                allowedIntents={TRACK_TECHNICIAN_INTENTS}
                onIntentMatched={handleVoiceIntent}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    mapContainer: {
        flex: 1,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapDisabledState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: theme.spacing.xl,
    },
    mapDisabledTitle: {
        ...theme.typography.h3,
        marginTop: 12,
        marginBottom: 8,
        textAlign: 'center',
    },
    mapDisabledText: {
        ...theme.typography.bodySmall,
        lineHeight: 18,
        textAlign: 'center',
    },
    etaOverlay: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
    etaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: `${theme.colors.secondary}40`,
        ...theme.shadows.md,
    },
    etaText: {
        ...theme.typography.body,
        fontWeight: '700',
        marginLeft: 6,
    },
    bottomCard: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    handleBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.colors.textMuted,
        alignSelf: 'center',
        marginBottom: theme.spacing.md,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.success,
        marginRight: 8,
    },
    statusText: {
        ...theme.typography.body,
        color: theme.colors.success,
        fontWeight: '600',
    },
    electricianRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
    },
    avatar: {
        width: 44,
        height: 44,
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
    vehicleText: {
        ...theme.typography.caption,
        marginTop: 2,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${theme.colors.warning}15`,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
    },
    ratingText: {
        color: theme.colors.warning,
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 4,
    },
    infoPanel: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: theme.spacing.lg,
    },
    infoItem: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    infoLabel: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
        marginBottom: 6,
    },
    infoValue: {
        ...theme.typography.body,
        fontWeight: '700',
    },
    certificatesCard: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: theme.spacing.lg,
    },
    certificatesTitle: {
        ...theme.typography.body,
        fontWeight: '700',
        marginBottom: theme.spacing.sm,
    },
    certificateThumbWrap: {
        width: 90,
        marginRight: theme.spacing.sm,
    },
    certificateThumb: {
        width: 90,
        height: 90,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.surface,
        marginBottom: 6,
    },
    certificateThumbText: {
        ...theme.typography.caption,
        textAlign: 'center',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    callButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${theme.colors.success}15`,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: `${theme.colors.success}30`,
    },
    callText: {
        color: theme.colors.success,
        fontWeight: '700',
        marginLeft: 6,
    },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${theme.colors.primary}15`,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: `${theme.colors.primary}30`,
        marginLeft: 12,
    },
    chatText: {
        color: theme.colors.primary,
        fontWeight: '700',
        marginLeft: 6,
    },
    startCodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: `${theme.colors.secondary}15`,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: `${theme.colors.secondary}40`,
        marginBottom: theme.spacing.lg,
    },
    startCodeLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    startCodeLabel: {
        ...theme.typography.caption,
        color: theme.colors.secondary,
        fontWeight: '600',
        marginLeft: 8,
        flexShrink: 1,
    },
    startCodeValueBox: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.secondary,
    },
    startCodeValue: {
        ...theme.typography.h2,
        color: theme.colors.secondary,
        letterSpacing: 2,
    },
});
