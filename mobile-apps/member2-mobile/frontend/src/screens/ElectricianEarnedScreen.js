import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Card } from '../components/Card';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

// Mock variables removed. Data is now fetched dynamically from backend.

export const ElectricianEarnedScreen = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [earningsData, setEarningsData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchEarnings = async () => {
            if (!user?.id) return;
            try {
                const response = await fetch(`http://10.48.201.167:8003/api/earnings/${user.id}`);
                const data = await response.json();
                if (data.success) {
                    setEarningsData(data.earnings);
                } else {
                    Alert.alert(t('earnings.errorTitle'), data.message || t('earnings.errorMsg'));
                }
            } catch (err) {
                console.error('Fetch Earnings Error:', err);
                Alert.alert(t('earnings.networkErrorTitle'), t('earnings.networkErrorMsg'));
            } finally {
                setLoading(false);
            }
        };

        fetchEarnings();
    }, [user?.id]);

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </SafeAreaView>
        );
    }

    const weeklyData = earningsData?.weeklyData || [];
    const transactions = earningsData?.transactions || [];
    const maxAmount = weeklyData.length > 0 ? Math.max(...weeklyData.map(d => d.amount)) : 1; // Prevent division by zero

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('earnings.title')}</Text>
                <Text style={styles.headerSubtitle}>{t('earnings.subtitle')}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Summary Cards */}
                <Card style={[styles.chartCard, { marginBottom: theme.spacing.lg }]} glowColor={theme.colors.success}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="wallet" size={28} color={theme.colors.success} style={{ marginRight: 12 }} />
                            <View>
                                <Text style={styles.summaryLabel}>{t('earnings.totalNet')}</Text>
                                <Text style={[styles.summaryAmount, { marginTop: 2, fontSize: 24 }]}>LKR {earningsData?.totalEarnings || 0}</Text>
                            </View>
                        </View>
                    </View>
                </Card>

                <View style={styles.summaryRow}>
                    <Card style={[styles.summaryCard, { flex: 1.2 }]} glowColor={theme.colors.secondary}>
                        <Ionicons name="cash-outline" size={24} color={theme.colors.secondary} />
                        <Text style={styles.summaryAmount}>LKR {earningsData?.cashCollected || 0}</Text>
                        <Text style={styles.summaryLabel}>{t('earnings.cashInHand')}</Text>
                    </Card>
                    <Card style={styles.summaryCard} glowColor={theme.colors.primary}>
                        <Ionicons name="card-outline" size={24} color={theme.colors.primary} />
                        <Text style={styles.summaryAmount}>LKR {earningsData?.digitalBalance || 0}</Text>
                        <Text style={styles.summaryLabel}>{t('earnings.digital')}</Text>
                    </Card>
                </View>

                {/* Commission Warning if High */}
                {(earningsData?.commissionOwed || 0) > 0 && (
                    <Card style={[styles.chartCard, { backgroundColor: theme.colors.danger + '10', borderColor: theme.colors.danger + '40', borderWidth: 1 }]} glowColor={theme.colors.danger}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="warning" size={24} color={theme.colors.danger} style={{ marginRight: 12 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ ...theme.typography.body, color: theme.colors.danger, fontWeight: '700' }}>{t('earnings.commissionOwed')}{earningsData.commissionOwed}</Text>
                                <Text style={{ ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 4 }}>{t('earnings.settleCommission')}</Text>
                            </View>
                        </View>
                    </Card>
                )}

                {/* Weekly Earnings Chart */}
                <Card style={styles.chartCard}>
                    <Text style={styles.chartTitle}>{t('earnings.weeklyEarnings')}</Text>
                    <View style={styles.chart}>
                        {weeklyData.map((d, i) => (
                            <View key={i} style={styles.barContainer}>
                                <View style={styles.barWrapper}>
                                    <View style={[
                                        styles.bar,
                                        {
                                            height: `${(d.amount / maxAmount) * 100}%`,
                                            backgroundColor: d.amount === maxAmount && maxAmount > 0 ? theme.colors.success : theme.colors.primary,
                                        }
                                    ]} />
                                </View>
                                <Text style={styles.barLabel}>{d.day}</Text>
                            </View>
                        ))}
                    </View>
                </Card>

                {/* Transaction History */}
                <Text style={styles.sectionTitle}>{t('earnings.recentTransactions')}</Text>
                {transactions.length > 0 ? transactions.map((tx) => (
                    <View key={tx.id} style={styles.transactionRow}>
                        <View style={styles.txIcon}>
                            <Ionicons name="arrow-down-circle" size={22} color={theme.colors.success} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.txClient}>{tx.client}</Text>
                            <Text style={styles.txDate}>{tx.date}</Text>
                        </View>
                        <Text style={styles.txAmount}>{tx.amount}</Text>
                    </View>
                )) : (
                    <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', marginVertical: 20 }}>{t('earnings.noTransactions')}</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    headerTitle: { ...theme.typography.h2 },
    headerSubtitle: { ...theme.typography.caption, marginTop: 2 },
    scrollContent: { padding: theme.spacing.lg, paddingBottom: 100 },
    summaryRow: { flexDirection: 'row', gap: 12, marginBottom: theme.spacing.lg },
    summaryCard: { flex: 1, alignItems: 'center', paddingVertical: theme.spacing.lg },
    summaryAmount: { ...theme.typography.h1, marginTop: 8 },
    summaryLabel: { ...theme.typography.caption, marginTop: 4 },
    chartCard: { marginBottom: theme.spacing.lg },
    chartTitle: { ...theme.typography.h3, fontSize: 16, marginBottom: theme.spacing.md },
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
});
