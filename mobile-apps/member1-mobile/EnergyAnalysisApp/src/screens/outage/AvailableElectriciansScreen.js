import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme/outage';
import { Card } from '../../components/outage/Card';
import { GradientButton } from '../../components/outage/GradientButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../utils/outage/i18nShim';

const formatCurrency = (amount, t) => {
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
        return 'LKR 2,500 (Est.)';
    }
    return `LKR ${Number(amount).toLocaleString()}`;
};

export const AvailableElectriciansScreen = ({ route, navigation }) => {
    const { category, subCategory, description, location, issuePhotos, address, service } = route.params;
    const { user } = useAuth();
    const { t } = useTranslation();

    const [job, setJob] = useState(null);
    const [creatingJob, setCreatingJob] = useState(true);
    const [searchSeconds, setSearchSeconds] = useState(0);

    const acceptedJob = job?.status === 'Accepted' || job?.status === 'InProgress' ? job : null;

    useEffect(() => {
        let timerInterval = setInterval(() => {
            setSearchSeconds((current) => current + 1);
        }, 1000);

        // Simulate job creation and acceptance for now
        setTimeout(() => {
            setCreatingJob(false);
            setJob({
                id: 'JOB-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                status: 'Searching',
                estimatedCost: service?.basePrice || 2500,
            });
        }, 2000);

        // Simulate acceptance after 10 seconds
        setTimeout(() => {
            setJob(prev => ({
                ...prev,
                status: 'Accepted',
                acceptedAt: new Date().toISOString(),
                electrician: {
                    fullName: 'Nimal Perera',
                    rating: 4.8,
                    phone: '0712345678',
                },
                etaMinutes: 12,
                distanceKm: 3.4,
                startCode: 'PL-9921',
            }));
        }, 12000);

        return () => {
            clearInterval(timerInterval);
        };
    }, []);

    const handleCancel = () => {
        navigation.goBack();
    };

    const handleCallElectrician = () => {
        if (acceptedJob?.electrician?.phone) {
            Linking.openURL(`tel:${acceptedJob.electrician.phone}`);
        }
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
                                    Accepted at {new Date(acceptedJob.acceptedAt).toLocaleTimeString()}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.electricianRow}>
                            <View style={styles.avatar}>
                                <Ionicons name="person" size={22} color={theme.colors.primary} />
                            </View>
                            <View style={styles.electricianInfo}>
                                <Text style={styles.electricianName}>{acceptedJob.electrician?.fullName}</Text>
                                <Text style={styles.electricianMeta}>
                                    Rating {acceptedJob.electrician?.rating} • {acceptedJob.etaMinutes} mins away
                                </Text>
                            </View>
                        </View>

                        <View style={styles.metaGrid}>
                            <View style={styles.metaItem}>
                                <Text style={styles.metaLabel}>Distance</Text>
                                <Text style={styles.metaValue}>{acceptedJob.distanceKm} km</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Text style={styles.metaLabel}>OTP Code</Text>
                                <Text style={styles.metaValue}>{acceptedJob.startCode}</Text>
                            </View>
                        </View>

                        <View style={styles.acceptedActions}>
                            <TouchableOpacity style={styles.secondaryAction} onPress={handleCallElectrician}>
                                <Ionicons name="call" size={18} color={theme.colors.success} />
                                <Text style={styles.secondaryActionText}>Call</Text>
                            </TouchableOpacity>
                            <GradientButton
                                title="Track Technician"
                                icon="navigate-circle"
                                onPress={() => navigation.navigate('TrackElectrician', { job: acceptedJob, location })}
                                style={styles.primaryTrackButton}
                            />
                        </View>
                    </Card>
                ) : (
                    <Card style={styles.searchCard} glowColor={theme.colors.primary}>
                        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 20 }} />
                        <Text style={styles.searchTitle}>{t('member2.availableElectricians.searchTitle')}</Text>
                        <Text style={styles.searchSubtitle}>{t('member2.availableElectricians.searchSubtitle')}</Text>
                        <Text style={styles.timer}>Searching for {searchSeconds}s...</Text>
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
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    backButton: { padding: 8, marginRight: 8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
    headerSubtitle: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
    content: { padding: 24, paddingBottom: 120 },
    summaryCard: { marginBottom: 16, backgroundColor: `${theme.colors.secondary}12`, borderColor: `${theme.colors.secondary}25` },
    summaryLabel: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 6 },
    summaryAmount: { fontSize: 24, fontWeight: '800', color: theme.colors.success, marginBottom: 6 },
    summaryAddress: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 18 },
    centerCard: { alignItems: 'center', paddingVertical: 40 },
    centerTitle: { fontSize: 18, fontWeight: '700', marginTop: 14 },
    centerSubtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' },
    searchCard: { alignItems: 'center', paddingVertical: 40 },
    searchTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
    searchSubtitle: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    timer: { fontSize: 16, fontWeight: '700', color: theme.colors.primary, marginBottom: 20 },
    cancelButton: { paddingVertical: 12 },
    cancelButtonText: { color: theme.colors.danger, fontWeight: '700' },
    acceptedCard: { padding: 20, borderRadius: 24 },
    acceptedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    acceptedBadge: { width: 46, height: 46, borderRadius: 23, backgroundColor: `${theme.colors.success}15`, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    acceptedInfo: { flex: 1 },
    acceptedTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
    acceptedSubtitle: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },
    electricianRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 16, padding: 16, marginBottom: 16 },
    avatar: { width: 48, height: 48, borderRadius: 12, backgroundColor: `${theme.colors.primary}15`, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    electricianInfo: { flex: 1 },
    electricianName: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
    electricianMeta: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },
    metaGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    metaItem: { flex: 1, backgroundColor: theme.colors.background, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border },
    metaLabel: { fontSize: 11, color: theme.colors.textMuted, marginBottom: 6 },
    metaValue: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
    acceptedActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    secondaryAction: { width: 70, height: 52, borderRadius: 16, backgroundColor: `${theme.colors.success}15`, alignItems: 'center', justifyContent: 'center' },
    secondaryActionText: { color: theme.colors.success, fontWeight: '700', fontSize: 12, marginTop: 4 },
    primaryTrackButton: { flex: 1 },
});

export default AvailableElectriciansScreen;
