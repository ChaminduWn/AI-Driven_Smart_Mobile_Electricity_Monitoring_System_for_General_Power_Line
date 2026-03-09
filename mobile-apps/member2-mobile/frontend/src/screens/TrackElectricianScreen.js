import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Linking, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Button } from '../components/Button';
import { MapView, Marker, Polyline } from '../components/MapWrapper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

export const TrackElectricianScreen = ({ route, navigation }) => {
    const { t } = useTranslation();
    const { electrician, location, job } = route.params;
    const [eta, setEta] = useState(8);
    const [status, setStatus] = useState(t('trackElectrician.statusOnTheWay'));
    const [jobStartTime] = useState(job?.createdAt ? new Date(job.createdAt) : new Date());
    const [canceling, setCanceling] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Pulsing animation for status dot
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        );
        pulse.start();

        // ETA countdown simulation
        const interval = setInterval(() => {
            setEta((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setStatus(t('trackElectrician.statusArrived'));
                    return 0;
                }
                return prev - 1;
            });
        }, 10000);

        return () => { pulse.stop(); clearInterval(interval); };
    }, []);

    const handleCall = () => {
        Linking.openURL('tel:+94771234567');
    };

    const handleCancel = () => {
        const now = new Date();
        const diffInMs = now - jobStartTime;
        const diffInMinutes = Math.floor(diffInMs / 60000);

        let cancelTitle = t('trackElectrician.cancelTitleFree');
        let cancelMessage = '';
        let isFree = true;

        if (diffInMinutes > 5) {
            cancelTitle = t('trackElectrician.cancelTitleFee');
            cancelMessage = t('trackElectrician.cancelMsgFee');
            isFree = false;
        } else {
            const timeLeft = 5 - diffInMinutes;
            cancelMessage = `${t('trackElectrician.cancelMsgFree1')}${timeLeft}${t('trackElectrician.cancelMsgFree2')}`;
        }

        Alert.alert(
            cancelTitle,
            cancelMessage,
            [
                { text: t('trackElectrician.keepJobBtn'), style: 'cancel' },
                {
                    text: isFree ? t('trackElectrician.cancelJobBtnFree') : t('trackElectrician.cancelJobBtnFee'),
                    style: 'destructive',
                    // Here we send the cancellation to the backend
                    onPress: async () => {
                        try {
                            setCanceling(true);
                            if (job?.id) {
                                await fetch(`http://10.48.201.167:8003/api/jobs/${job.id}/cancel`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ reason: t('trackElectrician.cancelReason') }),
                                });
                            }
                        } catch (err) {
                            console.error('Failed to cancel job on backend:', err);
                        } finally {
                            navigation.goBack();
                        }
                    }
                }
            ]
        );
    };

    const handleComplete = () => {
        navigation.navigate('Rating', { electrician });
    };

    const electricianLocation = {
        latitude: (location?.latitude || 6.9271) + 0.005,
        longitude: (location?.longitude || 79.8612) - 0.003,
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Map */}
            <View style={styles.mapContainer}>
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: location?.latitude || 6.9271,
                        longitude: location?.longitude || 79.8612,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                    }}
                >
                    <Marker
                        coordinate={{
                            latitude: location?.latitude || 6.9271,
                            longitude: location?.longitude || 79.8612,
                        }}
                        title="Your Location"
                    />
                    <Marker
                        coordinate={electricianLocation}
                        title={electrician.name}
                    />
                    <Polyline
                        coordinates={[
                            { latitude: location?.latitude || 6.9271, longitude: location?.longitude || 79.8612 },
                            electricianLocation,
                        ]}
                        strokeColor={theme.colors.primary}
                        strokeWidth={3}
                    />
                </MapView>

                {/* ETA Overlay */}
                <View style={styles.etaOverlay}>
                    <View style={styles.etaBadge}>
                        <Ionicons name="time" size={16} color={theme.colors.secondary} />
                        <Text style={styles.etaText}>{eta > 0 ? `${eta}${t('trackElectrician.etaMinutes')}` : t('trackElectrician.arrived')}</Text>
                    </View>
                </View>
            </View>

            {/* Bottom Sliding Card */}
            <View style={styles.bottomCard}>
                <View style={styles.handleBar} />

                {/* Status Row */}
                <View style={styles.statusRow}>
                    <Animated.View style={[styles.statusDot, { transform: [{ scale: pulseAnim }] }]} />
                    <Text style={styles.statusText}>{status}</Text>
                </View>

                {/* Electrician Info */}
                <View style={styles.electricianRow}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={22} color={theme.colors.primary} />
                    </View>
                    <View style={styles.electricianInfo}>
                        <Text style={styles.electricianName}>{electrician.name}</Text>
                        <Text style={styles.vehicleText}>{electrician.vehicle}</Text>
                    </View>
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={14} color={theme.colors.warning} />
                        <Text style={styles.ratingText}>{electrician.rating}</Text>
                    </View>
                </View>

                {/* Start Code Display */}
                {job?.startCode && (
                    <View style={styles.startCodeContainer}>
                        <View style={styles.startCodeLeft}>
                            <Ionicons name="key" size={20} color={theme.colors.secondary} />
                            <Text style={styles.startCodeLabel}>{t('trackElectrician.provideCode')}</Text>
                        </View>
                        <View style={styles.startCodeValueBox}>
                            <Text style={styles.startCodeValue}>{job.startCode}</Text>
                        </View>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                        <Ionicons name="call" size={20} color={theme.colors.success} />
                        <Text style={styles.callText}>{t('trackElectrician.call')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.msgButton}
                        onPress={() => navigation.navigate('Chat', { job: job, otherPartyName: electrician.name })}
                    >
                        <Ionicons name="chatbubble-ellipses" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>

                    {status === t('trackElectrician.statusArrived') ? (
                        <Button
                            title={t('trackElectrician.completeJob')}
                            variant="success"
                            onPress={handleComplete}
                            style={{ flex: 1, marginLeft: 12 }}
                        />
                    ) : (
                        <Button
                            title={t('trackElectrician.cancelJob')}
                            variant="danger"
                            onPress={handleCancel}
                            style={{ flex: 1, marginLeft: 12 }}
                        />
                    )}
                </View>
            </View>
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
        flex: 1,
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
        borderColor: theme.colors.secondary + '40',
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
        backgroundColor: theme.colors.primary + '15',
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
        backgroundColor: theme.colors.warning + '15',
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
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    callButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.success + '15',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.success + '30',
    },
    callText: {
        color: theme.colors.success,
        fontWeight: '700',
        marginLeft: 6,
    },
    msgButton: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.primary + '15',
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.primary + '30',
        marginLeft: 8,
    },
    startCodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.secondary + '15',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.secondary + '40',
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
