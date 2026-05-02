import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { Card } from '../components/Card';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl } from '../api';
import { useTranslation } from 'react-i18next';

export const ElectricianEarnedScreen = () => {
    const { user, refreshUser } = useAuth();
    const { t } = useTranslation();
    const withdrawOptions = [
        { id: 'bank', label: t('member2.earned.bankTransfer'), icon: 'business-outline' },
        { id: 'wallet', label: t('member2.earned.mobileWallet'), icon: 'phone-portrait-outline' },
        { id: 'card', label: t('member2.earned.cardPayout'), icon: 'card-outline' },
    ];
    const [earningsData, setEarningsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);

    const fetchEarnings = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            const shouldShowBlockingLoader = !earningsData;
            if (shouldShowBlockingLoader) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }
            const response = await fetch(buildApiUrl(`/earnings/${user.id}`));
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data?.message || t('member2.earned.loadFailedMsg'));
            }

            setEarningsData(data.earnings);
        } catch (err) {
            console.error('Fetch Earnings Error:', err);
            Alert.alert(t('member2.earned.loadFailedTitle'), err.message || t('member2.earned.loadFailedMsg'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [earningsData, user?.id]);

    useFocusEffect(
        useCallback(() => {
            fetchEarnings();
            refreshUser(user?.id, { silent: true });
        }, [fetchEarnings, refreshUser, user?.id])
    );

    const handleWithdraw = async (methodLabel) => {
        try {
            setWithdrawing(true);
            const amount = Number(earningsData?.withdrawableBalance || 0);
            const response = await fetch(buildApiUrl(`/earnings/${user.id}/withdraw`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount,
                    method: methodLabel,
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data?.message || 'Withdrawal could not be started');
            }

            setWithdrawOpen(false);
            await fetchEarnings();
            await refreshUser(user?.id, { silent: true });
            Alert.alert(
                t('member2.earned.withdrawRequestedTitle'),
                t('member2.earned.withdrawRequestedMsg', {
                    amount: data.withdrawal.amount ? `LKR ${data.withdrawal.amount}` : t('member2.earned.withdrawDefaultAmount'),
                    method: data.withdrawal.method,
                })
            );
        } catch (error) {
            Alert.alert(t('member2.earned.withdrawFailedTitle'), error.message || t('member2.earned.withdrawFailedMsg'));
        } finally {
            setWithdrawing(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </SafeAreaView>
        );
    }

    const weeklyData = earningsData?.weeklyData || [];
    const transactions = earningsData?.transactions || [];
    const maxAmount = weeklyData.length > 0 ? Math.max(...weeklyData.map((d) => d.amount), 1) : 1;
    const withdrawableBalance = Number(earningsData?.withdrawableBalance || 0);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('member2.earned.title')}</Text>
                <Text style={styles.headerSubtitle}>{t('member2.earned.subtitle')}</Text>
            </View>

            {refreshing && (
                <View style={styles.refreshBanner}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={styles.refreshBannerText}>{t('member2.earned.refreshing')}</Text>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Card style={[styles.chartCard, { marginBottom: theme.spacing.lg }]} glowColor={theme.colors.success}>
                    <View style={styles.topSummaryRow}>
                        <View style={styles.walletInfo}>
                                <Ionicons name="wallet" size={28} color={theme.colors.success} style={{ marginRight: 12 }} />
                            <View>
                                <Text style={styles.summaryLabel}>{t('member2.earned.totalEarned')}</Text>
                                <Text style={[styles.summaryAmount, { marginTop: 2, fontSize: 24 }]}>
                                    LKR {earningsData?.totalEarnings || 0}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.withdrawButton, !withdrawableBalance && styles.withdrawButtonDisabled]}
                            onPress={() => setWithdrawOpen(true)}
                            disabled={!withdrawableBalance}
                        >
                            <Ionicons name="cash-outline" size={18} color="#FFFFFF" />
                            <Text style={styles.withdrawButtonText}>{t('member2.earned.withdraw')}</Text>
                        </TouchableOpacity>
                    </View>
                </Card>

                <View style={styles.summaryRow}>
                    <Card style={[styles.summaryCard, { flex: 1.2 }]} glowColor={theme.colors.secondary}>
                        <Ionicons name="cash-outline" size={24} color={theme.colors.secondary} />
                        <Text style={styles.summaryAmount}>LKR {earningsData?.cashInHandAmount || earningsData?.cashCollected || 0}</Text>
                        <Text style={styles.summaryLabel}>{t('member2.earned.cashInHand')}</Text>
                    </Card>
                    <Card style={styles.summaryCard} glowColor={theme.colors.primary}>
                        <Ionicons name="card-outline" size={24} color={theme.colors.primary} />
                        <Text style={styles.summaryAmount}>LKR {earningsData?.digitalTransactionsAmount || 0}</Text>
                        <Text style={styles.summaryLabel}>{t('member2.earned.digitalTransactions')}</Text>
                    </Card>
                </View>

                {(earningsData?.commissionOwed || 0) > 0 && (
                    <Card style={[styles.chartCard, styles.warningCard]} glowColor={theme.colors.danger}>
                        <View style={styles.walletInfo}>
                            <Ionicons name="warning" size={24} color={theme.colors.danger} style={{ marginRight: 12 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.warningTitle}>{t('member2.earned.commissionOwed', { amount: earningsData.commissionOwed })}</Text>
                                <Text style={styles.warningText}>
                                    {t('member2.earned.commissionHint')}
                                </Text>
                            </View>
                        </View>
                    </Card>
                )}

                <Card style={styles.chartCard}>
                    <Text style={styles.chartTitle}>{t('member2.earned.weeklyEarnings')}</Text>
                    <View style={styles.chart}>
                        {weeklyData.map((d, i) => (
                            <View key={i} style={styles.barContainer}>
                                <View style={styles.barWrapper}>
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                height: `${(d.amount / maxAmount) * 100}%`,
                                                backgroundColor: d.amount === maxAmount && maxAmount > 0 ? theme.colors.success : theme.colors.primary,
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.barLabel}>{d.day}</Text>
                            </View>
                        ))}
                    </View>
                </Card>

                <Text style={styles.sectionTitle}>{t('member2.earned.recentTransactions')}</Text>
                {transactions.length > 0 ? transactions.map((tx) => (
                    <View key={tx.id} style={styles.transactionRow}>
                        <View style={styles.txIcon}>
                            <Ionicons
                                name={tx.paymentMethod === 'Cash' ? 'cash-outline' : 'card-outline'}
                                size={22}
                                color={theme.colors.success}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.txClient}>{tx.client}</Text>
                            <Text style={styles.txDate}>{tx.date} • {tx.paymentMethod}</Text>
                        </View>
                        <Text style={styles.txAmount}>{tx.amount}</Text>
                    </View>
                )) : (
                    <Text style={styles.emptyTransactions}>{t('member2.earned.noCompletedJobs')}</Text>
                )}
            </ScrollView>

            <Modal
                visible={withdrawOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setWithdrawOpen(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{t('member2.earned.withdrawBalance')}</Text>
                        <Text style={styles.modalSubtitle}>
                            {t('member2.earned.withdrawSubtitle', { amount: withdrawableBalance })}
                        </Text>

                        {withdrawOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={styles.gatewayOption}
                                onPress={() => handleWithdraw(option.label)}
                                disabled={withdrawing}
                            >
                                <Ionicons name={option.icon} size={22} color={theme.colors.primary} />
                                <Text style={styles.gatewayOptionText}>{option.label}</Text>
                                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setWithdrawOpen(false)}
                            disabled={withdrawing}
                        >
                            <Text style={styles.closeButtonText}>{withdrawing ? t('member2.earned.processing') : t('member2.earned.close')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    centered: { justifyContent: 'center', alignItems: 'center' },
    header: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    headerTitle: { ...theme.typography.h2 },
    headerSubtitle: { ...theme.typography.caption, marginTop: 2 },
    refreshBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: `${theme.colors.primary}08`,
    },
    refreshBannerText: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    scrollContent: { padding: theme.spacing.lg, paddingBottom: 100 },
    topSummaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    walletInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    summaryRow: { flexDirection: 'row', gap: 12, marginBottom: theme.spacing.lg },
    summaryCard: { flex: 1, alignItems: 'center', paddingVertical: theme.spacing.lg },
    summaryAmount: { ...theme.typography.h1, marginTop: 8 },
    summaryLabel: { ...theme.typography.caption, marginTop: 4 },
    chartCard: { marginBottom: theme.spacing.lg },
    chartTitle: { ...theme.typography.h3, fontSize: 16, marginBottom: theme.spacing.md },
    warningCard: { backgroundColor: theme.colors.danger + '10', borderColor: theme.colors.danger + '40', borderWidth: 1 },
    warningTitle: { ...theme.typography.body, color: theme.colors.danger, fontWeight: '700' },
    warningText: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 4 },
    chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
    barContainer: { alignItems: 'center', flex: 1 },
    barWrapper: { height: 100, width: 20, justifyContent: 'flex-end' },
    bar: { width: '100%', borderRadius: 4, minHeight: 4 },
    barLabel: { ...theme.typography.caption, marginTop: 6, fontSize: 11 },
    sectionTitle: { ...theme.typography.h3, marginBottom: theme.spacing.md },
    transactionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    txIcon: { marginRight: 12 },
    txClient: { ...theme.typography.body, fontWeight: '600', fontSize: 14 },
    txDate: { ...theme.typography.caption, marginTop: 2 },
    txAmount: { ...theme.typography.body, color: theme.colors.success, fontWeight: '700' },
    emptyTransactions: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', marginVertical: 20 },
    withdrawButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.lg,
    },
    withdrawButtonDisabled: {
        backgroundColor: theme.colors.textMuted,
    },
    withdrawButtonText: { color: '#FFFFFF', fontWeight: '700', marginLeft: 6 },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    modalCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    modalTitle: { ...theme.typography.h2, marginBottom: 8 },
    modalSubtitle: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, lineHeight: 18, marginBottom: theme.spacing.md },
    gatewayOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    gatewayOptionText: { ...theme.typography.body, flex: 1, marginLeft: 12, fontWeight: '600' },
    closeButton: {
        marginTop: theme.spacing.md,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: `${theme.colors.primary}12`,
    },
    closeButtonText: { color: theme.colors.primary, fontWeight: '700' },
});
