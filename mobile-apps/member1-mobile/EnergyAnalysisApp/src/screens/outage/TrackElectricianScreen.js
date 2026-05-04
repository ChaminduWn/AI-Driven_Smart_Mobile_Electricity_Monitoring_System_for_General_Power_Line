import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme/outage';
import { Button } from '../../components/outage/Button';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../utils/outage/i18nShim';
import { VoiceCommandButton } from '../../components/outage/VoiceCommandButton';
import { TRACK_TECHNICIAN_INTENTS } from '../../voice/outage/intentMappings';

const fallbackLocation = { latitude: 6.9271, longitude: 79.8612 };

export const TrackElectricianScreen = ({ route, navigation }) => {
    const { electrician, location, job: routeJob } = route.params;
    const { user } = useAuth();
    const { t } = useTranslation();
    const [job, setJob] = useState(routeJob);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Simulate job updates
        const interval = setInterval(() => {
            setJob(prev => ({
                ...prev,
                etaMinutes: Math.max(1, (prev.etaMinutes || 10) - 1),
                distanceKm: Math.max(0.1, (prev.distanceKm || 3) - 0.2).toFixed(1),
            }));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCall = () => {
        const phone = job?.electrician?.phone || electrician?.phone;
        if (phone) Linking.openURL(`tel:${phone}`);
    };

    const handleChat = () => {
        navigation.navigate('Chat', { job, otherPartyName: job?.electrician?.fullName || 'Technician' });
    };

    const handleCancel = () => {
        Alert.alert(t('member2.track.cancelTitle'), t('member2.track.cancelMsg'), [
            { text: t('member2.track.keepJob'), style: 'cancel' },
            { text: t('member2.track.cancelJob'), style: 'destructive', onPress: () => navigation.goBack() }
        ]);
    };

    const handleVoiceIntent = async ({ intent }) => {
        switch (intent) {
            case 'open_chat': handleChat(); return true;
            case 'cancel_request': handleCancel(); return true;
            default: return false;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.mapPlaceholder}>
                <Ionicons name="map" size={60} color={theme.colors.textMuted} />
                <Text style={styles.mapText}>Live Tracking Map</Text>
                <Text style={styles.mapSubText}>Tracking {job?.electrician?.fullName}</Text>
                
                <View style={styles.etaOverlay}>
                    <View style={styles.etaBadge}>
                        <Ionicons name="time" size={16} color={theme.colors.secondary} />
                        <Text style={styles.etaText}>{job?.etaMinutes} mins away</Text>
                    </View>
                </View>
            </View>

            <View style={styles.bottomCard}>
                <View style={styles.handleBar} />
                <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>{job?.status || 'On the way'}</Text>
                </View>

                <View style={styles.electricianRow}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={22} color={theme.colors.primary} />
                    </View>
                    <View style={styles.electricianInfo}>
                        <Text style={styles.electricianName}>{job?.electrician?.fullName || 'Technician'}</Text>
                        <Text style={styles.vehicleText}>{job?.electrician?.phone || '071XXXXXXX'}</Text>
                    </View>
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={14} color={theme.colors.warning} />
                        <Text style={styles.ratingText}>{job?.electrician?.rating || 4.5}</Text>
                    </View>
                </View>

                <View style={styles.infoPanel}>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Estimated Cost</Text>
                        <Text style={styles.infoValue}>LKR {job?.estimatedCost?.toLocaleString()}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Distance</Text>
                        <Text style={styles.infoValue}>{job?.distanceKm} km</Text>
                    </View>
                </View>

                <View style={styles.startCodeContainer}>
                    <View style={styles.startCodeLeft}>
                        <Ionicons name="key" size={20} color={theme.colors.secondary} />
                        <Text style={styles.startCodeLabel}>Share this code when he arrives:</Text>
                    </View>
                    <View style={styles.startCodeValueBox}>
                        <Text style={styles.startCodeValue}>{job?.startCode || '----'}</Text>
                    </View>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                        <Ionicons name="call" size={20} color={theme.colors.success} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
                        <Ionicons name="chatbubble-ellipses" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <Button
                        title={t('member2.track.cancelJob')}
                        variant="danger"
                        onPress={handleCancel}
                        style={{ flex: 1, marginLeft: 12 }}
                    />
                </View>
            </View>
            <VoiceCommandButton allowedIntents={TRACK_TECHNICIAN_INTENTS} onIntentMatched={handleVoiceIntent} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    mapPlaceholder: { flex: 1, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
    mapText: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginTop: 12 },
    mapSubText: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },
    etaOverlay: { position: 'absolute', top: 20, right: 20 },
    etaBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 10, borderRadius: 12, elevation: 5 },
    etaText: { fontSize: 14, fontWeight: '700', marginLeft: 6 },
    bottomCard: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, paddingBottom: 30, borderTopWidth: 1, borderTopColor: theme.colors.border },
    handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD', alignSelf: 'center', marginBottom: 16 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.success, marginRight: 8 },
    statusText: { fontSize: 14, color: theme.colors.success, fontWeight: '700' },
    electricianRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, padding: 16, borderRadius: 16, marginBottom: 16 },
    avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: `${theme.colors.primary}15`, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    electricianInfo: { flex: 1 },
    electricianName: { fontSize: 16, fontWeight: '700' },
    vehicleText: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${theme.colors.warning}15`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    ratingText: { color: theme.colors.warning, fontSize: 13, fontWeight: '700', marginLeft: 4 },
    infoPanel: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    infoItem: { flex: 1, backgroundColor: theme.colors.background, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border },
    infoLabel: { fontSize: 11, color: theme.colors.textMuted, marginBottom: 6 },
    infoValue: { fontSize: 14, fontWeight: '700' },
    startCodeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: `${theme.colors.secondary}15`, padding: 16, borderRadius: 16, marginBottom: 20 },
    startCodeLeft: { flex: 1 },
    startCodeLabel: { fontSize: 12, color: theme.colors.secondary, fontWeight: '600' },
    startCodeValueBox: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    startCodeValue: { fontSize: 20, fontWeight: '800', color: theme.colors.secondary, letterSpacing: 2 },
    actionRow: { flexDirection: 'row', alignItems: 'center' },
    callButton: { width: 52, height: 52, borderRadius: 16, backgroundColor: `${theme.colors.success}15`, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${theme.colors.success}30` },
    chatButton: { width: 52, height: 52, borderRadius: 16, backgroundColor: `${theme.colors.primary}15`, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${theme.colors.primary}30`, marginLeft: 12 },
});

export default TrackElectricianScreen;
