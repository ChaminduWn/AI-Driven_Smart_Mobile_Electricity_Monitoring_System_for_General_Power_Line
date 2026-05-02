import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { Card } from '../components/Card';
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

export const ElectricianPastActivitiesScreen = ({ navigation, route }) => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState(route.params?.initialTab === 'past' ? 'past' : 'ongoing');

    const fetchHistory = useCallback(async (isRefresh = false) => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await fetch(buildApiUrl(`/jobs/history/${user.id}`));
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data?.message || 'Could not load technician history');
            }

            setHistory(data.jobs || []);
        } catch (error) {
            console.error('Fetch technician history error', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [fetchHistory])
    );

    const ongoingJobs = useMemo(
        () => history.filter((job) => ['Accepted', 'InProgress', 'PaymentPending', 'AwaitingTechnicianConfirmation'].includes(job.status)),
        [history]
    );

    const pastJobs = useMemo(
        () => history.filter((job) => ['Completed', 'Cancelled'].includes(job.status)),
        [history]
    );

    const currentItems = activeTab === 'ongoing' ? ongoingJobs : pastJobs;

    const renderJobCard = ({ item }) => (
        <Card
            style={styles.card}
            onPress={() => navigation.navigate('ElectricianJobDetails', { job: item })}
        >
            <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.jobType}>{item.category || item.title}</Text>
                    <Text style={styles.jobSub}>{item.subCategory || item.serviceName}</Text>
                </View>
                <View style={[styles.statusBadge, item.status === 'Completed' ? styles.statusDone : item.status === 'Cancelled' ? styles.statusCancelled : styles.statusOngoing]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={15} color={theme.colors.textMuted} />
                <Text style={styles.detailText}>{item.householder?.fullName || t('householder.user')}</Text>
            </View>
            <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={15} color={theme.colors.textMuted} />
                <Text style={styles.detailText}>{item.householder?.phone || t('member2.availableElectricians.phoneUnavailable')}</Text>
            </View>
            <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={15} color={theme.colors.textMuted} />
                <Text style={styles.detailText}>{item.issueAddress || item.householder?.address || t('member2.location.selectedPoint')}</Text>
            </View>

            <View style={styles.bottomRow}>
                <View>
                    <Text style={styles.amount}>{formatCurrency(item.finalCost || item.estimatedCost, t)}</Text>
                    <Text style={styles.dateText}>
                        {new Date(item.completedAt || item.acceptedAt || item.createdAt).toLocaleString()}
                    </Text>
                </View>
                {item.householderRating ? (
                    <View style={styles.ratingWrap}>
                        <Ionicons name="star" size={15} color={theme.colors.warning} />
                        <Text style={styles.ratingValue}>{item.householderRating}</Text>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.viewButton}>
                        <Text style={styles.viewButtonText}>{t('member2.dashboard.viewJobDetails')}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </Card>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Job History</Text>
                <Text style={styles.headerSubtitle}>Track your accepted jobs, past work, and ratings</Text>
            </View>

            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'ongoing' && styles.activeTabButton]}
                    onPress={() => setActiveTab('ongoing')}
                >
                    <Text style={[styles.tabText, activeTab === 'ongoing' && styles.activeTabText]}>
                        Ongoing
                    </Text>
                    <Text style={[styles.tabCount, activeTab === 'ongoing' && styles.activeTabText]}>
                        {ongoingJobs.length}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'past' && styles.activeTabButton]}
                    onPress={() => setActiveTab('past')}
                >
                    <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
                        Past Jobs
                    </Text>
                    <Text style={[styles.tabCount, activeTab === 'past' && styles.activeTabText]}>
                        {pastJobs.length}
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={currentItems}
                renderItem={renderJobCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchHistory(true)}
                        tintColor={theme.colors.primary}
                    />
                }
                ListEmptyComponent={
                    <Card style={styles.emptyCard}>
                        <Ionicons
                            name={activeTab === 'ongoing' ? 'time-outline' : 'briefcase-outline'}
                            size={34}
                            color={theme.colors.textMuted}
                        />
                        <Text style={styles.emptyTitle}>
                            {activeTab === 'ongoing' ? 'No ongoing jobs yet' : 'No past jobs yet'}
                        </Text>
                        <Text style={styles.emptyText}>
                            {activeTab === 'ongoing'
                                ? 'Accepted technician requests will appear here right after confirmation.'
                                : 'Completed and cancelled jobs will move here automatically.'}
                        </Text>
                    </Card>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    centered: { justifyContent: 'center', alignItems: 'center' },
    header: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    headerTitle: { ...theme.typography.h2 },
    headerSubtitle: { ...theme.typography.caption, marginTop: 2 },
    tabRow: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.lg,
        paddingVertical: 12,
        gap: 8,
    },
    activeTabButton: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    tabText: {
        ...theme.typography.bodySmall,
        fontWeight: '700',
    },
    tabCount: {
        ...theme.typography.bodySmall,
        color: theme.colors.textMuted,
        fontWeight: '700',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    list: { padding: theme.spacing.md, paddingBottom: 100, flexGrow: 1 },
    card: { marginBottom: theme.spacing.sm },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    jobType: { ...theme.typography.body, fontWeight: '700' },
    jobSub: { ...theme.typography.caption, marginTop: 2 },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.full,
    },
    statusOngoing: { backgroundColor: `${theme.colors.warning}20` },
    statusDone: { backgroundColor: `${theme.colors.success}20` },
    statusCancelled: { backgroundColor: `${theme.colors.danger}18` },
    statusText: { fontSize: 12, fontWeight: '700', color: theme.colors.text },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    detailText: { ...theme.typography.bodySmall, marginLeft: 8, flex: 1, lineHeight: 18 },
    bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    amount: { ...theme.typography.h3, color: theme.colors.success, fontSize: 16 },
    dateText: { ...theme.typography.caption, marginTop: 4 },
    ratingWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${theme.colors.warning}18`,
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    ratingValue: { color: theme.colors.warning, fontWeight: '700', marginLeft: 4 },
    viewButton: {
        backgroundColor: `${theme.colors.primary}14`,
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    viewButtonText: {
        color: theme.colors.primary,
        fontWeight: '700',
        fontSize: 12,
    },
    emptyCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xxl,
        marginTop: theme.spacing.xl,
    },
    emptyTitle: { ...theme.typography.h3, marginTop: 12, marginBottom: 6 },
    emptyText: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 18 },
});
