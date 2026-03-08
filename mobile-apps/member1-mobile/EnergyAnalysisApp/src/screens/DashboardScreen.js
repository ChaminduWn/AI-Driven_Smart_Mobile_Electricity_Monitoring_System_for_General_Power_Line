import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useAccount } from '../contexts/AccountContext';
import { billsAPI } from '../api/billsAPI';
import { appliancesAPI } from '../api/appliancesAPI';
import { analysisAPI } from '../api/analysisAPI';
import { notificationsAPI } from '../api/notificationsAPI';
import {
  StatCard, SectionHeader, EmptyState, LoadingScreen, Card, ProgressBar,
} from '../components/SharedComponents';
import AccountSelector from '../components/AccountSelector';
import { COLORS, SPACING, RADIUS, FONTS, SHADOW } from '../utils/theme';
import { formatCurrency, formatKwh, formatMonthYear, getStatusColor, getStatusLabel, extractAccountNumbers } from '../utils/helpers';
import { Modal } from 'react-native';

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { selectedAccount, accounts, selectAccount, addAccount } = useAccount();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bills, setBills] = useState([]);
  const [applianceAnalysis, setApplianceAnalysis] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [latestBill, setLatestBill] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifModal, setShowNotifModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Get all bills first to discover accounts
      const billsRes = await billsAPI.getAll();
      const allBills = billsRes.data?.data || [];
      setBills(allBills);

      const accountNums = extractAccountNumbers(allBills);
      // Auto-register discovered accounts and select first if needed
      for (const a of accountNums) {
        await addAccount(a);
      }

      // Auto-select first account if none selected
      const account = selectedAccount || accountNums[0];
      if (!account) { setLoading(false); return; }

      // Get bills for selected account
      const accountBills = allBills.filter((b) => b.account_number === account);
      const sorted = accountBills.sort((a, b) => new Date(b.bill_date) - new Date(a.bill_date));
      setLatestBill(sorted[0] || null);

      // Appliance analysis
      try {
        const appRes = await appliancesAPI.analyze(account);
        if (appRes.data.success) setApplianceAnalysis(appRes.data);
      } catch (_) { }

      // Active budget plan
      try {
        const planRes = await analysisAPI.getPlansByAccount(account, true);
        const plans = planRes.data?.plans || [];
        setActivePlan(plans[0] || null);
      } catch (_) { }

      // Notifications
      try {
        const notifRes = await notificationsAPI.getAll(true);
        setNotifications(notifRes.data || []);
      } catch (_) { }

    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedAccount]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications([]);
    } catch (_) { }
  };

  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const allAccounts = extractAccountNumbers(bills);

  if (loading) return <LoadingScreen message="Loading dashboard..." />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day, {firstName} 👋</Text>
          <Text style={styles.subGreeting}>Your energy overview</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notifBtn} onPress={() => setShowNotifModal(true)}>
            <Text style={styles.notifIcon}>🔔</Text>
            {notifications.length > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{notifications.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutIcon}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Selector */}
      {allAccounts.length > 0 && (
        <AccountSelector
          selectedAccount={selectedAccount || allAccounts[0]}
          accounts={allAccounts}
          onSelect={selectAccount}
        />
      )}

      {/* No bills / get started */}
      {bills.length === 0 ? (
        <EmptyState
          icon="📄"
          title="No Bills Yet"
          subtitle={"Upload your first electricity bill to start\nanalyzing your energy usage."}
          action={() => navigation.navigate('Bills')}
          actionLabel="Upload Bill"
        />
      ) : (
        <>
          {/* Latest Bill Summary */}
          {latestBill && (
            <Card style={styles.billCard} accentColor={COLORS.primary}>
              <View style={styles.billRow}>
                <View>
                  <Text style={styles.billMonth}>{formatMonthYear(latestBill.bill_date)}</Text>
                  <Text style={styles.billAccount}>Acct: {latestBill.account_number}</Text>
                </View>
                <View style={styles.billRight}>
                  <Text style={styles.billAmount}>{formatCurrency(latestBill.total_charge)}</Text>
                  <Text style={styles.billUnits}>{latestBill.units_consumed} kWh</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.analyzeBillBtn}
                onPress={() => navigation.navigate('BillDetail', { bill: latestBill })}
              >
                <Text style={styles.analyzeBillText}>📊 Analyse This Bill →</Text>
              </TouchableOpacity>
            </Card>
          )}

          {/* Stats Grid */}
          <View style={styles.statsRow}>
            <StatCard
              label="Appliances"
              value={applianceAnalysis?.summary?.total_appliances ?? '—'}
              icon="⚡"
              color={COLORS.secondary}
            />
            <View style={styles.statsGap} />
            <StatCard
              label="Monthly kWh"
              value={applianceAnalysis?.summary?.total_monthly_kwh?.toFixed(1) ?? '—'}
              icon="🔋"
              color={COLORS.success}
            />
          </View>

          <View style={styles.statsRow}>
            <StatCard
              label="Est. Cost"
              value={formatCurrency(applianceAnalysis?.summary?.estimated_monthly_cost ?? 0, 0)}
              icon="💰"
              color={COLORS.warning}
            />
            <View style={styles.statsGap} />
            <StatCard
              label="Daily Avg"
              value={`${applianceAnalysis?.summary?.average_cost_per_day?.toFixed(0) ?? '—'} Rs`}
              icon="📅"
              color={COLORS.primaryLight}
            />
          </View>

          {/* Active Budget Plan */}
          {activePlan && (
            <>
              <SectionHeader title="Active Budget Plan" action={() => navigation.navigate('Tracking')} actionLabel="View →" />
              <Card style={styles.planCard} accentColor={getStatusColor(activePlan.progress_status)}>
                <View style={styles.planRow}>
                  <View>
                    <Text style={styles.planTarget}>{formatCurrency(activePlan.target_budget)}</Text>
                    <Text style={styles.planLabel}>Target Budget</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activePlan.progress_status) + '22' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(activePlan.progress_status) }]}>
                      {getStatusLabel(activePlan.progress_status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.planMeta}>
                  <Text style={styles.planMetaText}>📅 {activePlan.planning_days} days · 🎯 {activePlan.target_daily_units?.toFixed(1)} kWh/day</Text>
                </View>
              </Card>
            </>
          )}

          {/* Quick Actions */}
          <SectionHeader title="Quick Actions" />
          <View style={styles.actionsGrid}>
            <QuickAction icon="📤" label="Upload Bill" color={COLORS.primary} onPress={() => navigation.navigate('Bills')} />
            <QuickAction icon="⚡" label="Appliances" color={COLORS.secondary} onPress={() => navigation.navigate('Appliances')} />
            <QuickAction icon="📊" label="NILM Report" color={COLORS.success} onPress={() => navigation.navigate('NILM')} />
            <QuickAction icon="🎯" label="Budget Plan" color={COLORS.warning} onPress={() => navigation.navigate('Analysis')} />
          </View>
        </>
      )}

      <View style={{ height: SPACING.xxxl }} />

      {/* Notifications Modal */}
      <Modal visible={showNotifModal} animationType="slide" transparent>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowNotifModal(false)}
        >
          <View style={styles.notifSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Notifications</Text>
              <TouchableOpacity onPress={handleMarkAllRead}>
                <Text style={styles.markReadText}>Mark all as read</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.notifList}>
              {notifications.length === 0 ? (
                <Text style={styles.emptyNotif}>All caught up! No unread notifications.</Text>
              ) : (
                notifications.map(n => (
                  <View key={n.id} style={[styles.notifCard, { borderLeftColor: getNotifColor(n.type) }]}>
                    <Text style={styles.notifTitle}>{n.title}</Text>
                    <Text style={styles.notifMsg}>{n.message}</Text>
                    <Text style={styles.notifDate}>{new Date(n.created_at).toLocaleDateString()}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowNotifModal(false)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const getNotifColor = (type) => {
  switch (type) {
    case 'success': return COLORS.success;
    case 'warning': return COLORS.warning;
    case 'danger': return COLORS.danger;
    default: return COLORS.primary;
  }
};

const QuickAction = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={[styles.quickAction, { borderColor: color + '44' }]} onPress={onPress}>
    <View style={[styles.qaIcon, { backgroundColor: color + '22' }]}>
      <Text style={styles.qaIconText}>{icon}</Text>
    </View>
    <Text style={styles.qaLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg1, padding: SPACING.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  greeting: { color: COLORS.textPrimary, fontSize: 24, ...FONTS.bold },
  subGreeting: { color: COLORS.textSecondary, fontSize: 14, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  notifBtn: { padding: SPACING.sm, position: 'relative' },
  notifIcon: { fontSize: 22 },
  notifBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: COLORS.danger, width: 18, height: 18,
    borderRadius: 9, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.bg1
  },
  notifBadgeText: { color: '#fff', fontSize: 8, ...FONTS.bold },
  logoutBtn: { padding: SPACING.sm },
  logoutIcon: { fontSize: 22 },
  billCard: { marginBottom: SPACING.md },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  billMonth: { color: COLORS.textPrimary, fontSize: 18, ...FONTS.semiBold },
  billAccount: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  billRight: { alignItems: 'flex-end' },
  billAmount: { color: COLORS.success, fontSize: 22, ...FONTS.bold },
  billUnits: { color: COLORS.textSecondary, fontSize: 13 },
  analyzeBillBtn: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  analyzeBillText: { color: COLORS.primary, fontSize: 14, ...FONTS.medium },
  statsRow: { flexDirection: 'row', marginBottom: SPACING.md },
  statsGap: { width: SPACING.md },
  planCard: { marginBottom: SPACING.md },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planTarget: { color: COLORS.textPrimary, fontSize: 20, ...FONTS.bold },
  planLabel: { color: COLORS.textSecondary, fontSize: 12 },
  statusBadge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
  statusText: { fontSize: 13, ...FONTS.medium },
  planMeta: { marginTop: SPACING.sm },
  planMetaText: { color: COLORS.textSecondary, fontSize: 13 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.lg },
  quickAction: {
    width: '47%',
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    ...SHADOW.sm,
  },
  qaIcon: { width: 48, height: 48, borderRadius: RADIUS.full, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  qaIconText: { fontSize: 24 },
  qaLabel: { color: COLORS.textPrimary, fontSize: 13, ...FONTS.medium, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  notifSheet: {
    backgroundColor: COLORS.bg2, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl, minHeight: '50%', maxHeight: '80%', ...SHADOW.lg,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  sheetTitle: { color: COLORS.textPrimary, fontSize: 20, ...FONTS.bold },
  markReadText: { color: COLORS.primary, fontSize: 13, ...FONTS.medium },
  notifList: { flex: 1 },
  emptyNotif: { color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xxl, ...FONTS.medium },
  notifCard: {
    backgroundColor: COLORS.bg3, padding: SPACING.lg, borderRadius: RADIUS.md,
    marginBottom: SPACING.md, borderLeftWidth: 4,
  },
  notifTitle: { color: COLORS.textPrimary, fontSize: 15, ...FONTS.bold, marginBottom: 4 },
  notifMsg: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18 },
  notifDate: { color: COLORS.textMuted, fontSize: 11, marginTop: 8, textAlign: 'right' },
  closeBtn: {
    backgroundColor: COLORS.primary, padding: SPACING.lg, borderRadius: RADIUS.lg,
    alignItems: 'center', marginTop: SPACING.lg,
  },
  closeBtnText: { color: '#fff', fontSize: 16, ...FONTS.bold },
});

export default DashboardScreen;