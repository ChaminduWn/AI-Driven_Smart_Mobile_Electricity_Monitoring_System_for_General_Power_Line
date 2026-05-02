import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, Animated, Modal,
} from 'react-native';
import { universalAlert } from '../utils/alerts';
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
import ScreenHeader from '../components/ScreenHeader';
import { COLORS, SPACING, RADIUS, FONTS, SHADOW } from '../utils/theme';
import {
  formatCurrency, formatKwh, formatMonthYear,
  getStatusColor, getStatusLabel, extractAccountNumbers,
} from '../utils/helpers';
import { Bell, LogOut, User } from 'lucide-react-native';

/* ─────────────────────────────────────────────
   DESIGN TOKENS  (deep navy-teal dark theme)
───────────────────────────────────────────── */
const C = {
  /* backgrounds */
  bg: '#07111F',
  bg2: '#0D1B2A',
  bg3: '#122236',
  card: '#0F1E30',

  /* brand accents */
  energy: '#00C8FF',   // electric cyan
  solar: '#FFD60A',   // amber-gold
  outage: '#FF6B35',   // coral-orange
  safety: '#00E5A0',   // mint-green

  /* semantic */
  success: '#00E5A0',
  warning: '#FFD60A',
  danger: '#FF4D6D',

  /* text */
  textPrimary: '#E8F4FF',
  textSecondary: '#7A9CC0',
  textMuted: '#3D5570',

  /* structure */
  divider: '#162A40',
  border: '#1A3050',
};

/* ─────────────────────────────────────────────
   SMALL ATOMS
───────────────────────────────────────────── */
const Pill = ({ label, color }) => (
  <View style={{
    backgroundColor: color + '25', borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 3,
    alignSelf: 'flex-start',
    borderWidth: 1, borderColor: color + '50',
  }}>
    <Text style={{ fontSize: 11, fontWeight: '700', color, letterSpacing: 0.5 }}>{label}</Text>
  </View>
);

const GlowCard = ({ accentColor, children, style }) => (
  <View style={[styles.glowCard, style]}>
    <View style={[styles.glowStripe, { backgroundColor: accentColor }]} />
    <View style={styles.glowContent}>{children}</View>
  </View>
);

/* ─────────────────────────────────────────────
   MODULE CARD
───────────────────────────────────────────── */
const ModuleCard = ({ icon, title, subtitle, accent, badge, badgeColor, stat, statLabel, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    style={[styles.moduleCard, { borderColor: accent + '40' }]}
  >
    <View style={[styles.moduleBar, { backgroundColor: accent }]} />
    <View style={styles.moduleBody}>
      <View style={[styles.moduleIconWrap, { backgroundColor: accent + '20', borderColor: accent + '35', borderWidth: 1 }]}>
        <Text style={styles.moduleIcon}>{icon}</Text>
      </View>
      <View style={styles.moduleTextGroup}>
        <Text style={styles.moduleTitle}>{title}</Text>
        <Text style={styles.moduleSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.moduleRight}>
        {stat !== undefined && (
          <Text style={[styles.moduleStat, { color: accent }]}>{stat}</Text>
        )}
        {statLabel && <Text style={styles.moduleStatLabel}>{statLabel}</Text>}
        {badge && (
          <View style={[styles.moduleBadge, {
            backgroundColor: (badgeColor || accent) + '22',
            borderColor: (badgeColor || accent) + '55', borderWidth: 1,
          }]}>
            <Text style={[styles.moduleBadgeText, { color: badgeColor || accent }]}>{badge}</Text>
          </View>
        )}
        <Text style={[styles.moduleArrow, { color: accent }]}>›</Text>
      </View>
    </View>
  </TouchableOpacity>
);

/* ─────────────────────────────────────────────
   METRIC TILE
───────────────────────────────────────────── */
const MetricTile = ({ icon, value, label, color }) => (
  <View style={[styles.metricTile, { borderColor: color + '30', borderTopWidth: 2, borderTopColor: color + '80' }]}>
    <Text style={styles.metricIcon}>{icon}</Text>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

/* ─────────────────────────────────────────────
   SECTION LABEL
───────────────────────────────────────────── */
const SLabel = ({ text, action, actionLabel }) => (
  <View style={styles.sLabel}>
    <View style={styles.sLabelLeft}>
      <View style={styles.sLabelDot} />
      <Text style={styles.sLabelText}>{text}</Text>
    </View>
    {action && (
      <TouchableOpacity onPress={action}>
        <Text style={styles.sLabelAction}>{actionLabel || 'View all'}</Text>
      </TouchableOpacity>
    )}
  </View>
);

/* ─────────────────────────────────────────────
   NOTIFICATION COLOR HELPER
───────────────────────────────────────────── */
const getNotifColor = (type) => {
  switch (type) {
    case 'success': return C.success;
    case 'warning': return C.warning;
    case 'danger': return C.danger;
    default: return C.energy;
  }
};

import { useFocusEffect } from '@react-navigation/native';

/* ═══════════════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════════════ */
const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { selectedAccount, accounts, selectAccount, addAccount } = useAccount();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bills, setBills] = useState([]);
  const [applianceAnalysis, setApplianceAnalysis] = useState(null);
  const [activePlans, setActivePlans] = useState([]);
  const [latestBill, setLatestBill] = useState(null);

  // ── Notification state (from v1) ──
  const [notifications, setNotifications] = useState([]);
  const [showNotifModal, setShowNotifModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const billsRes = await billsAPI.getAll();
      const allBills = billsRes.data?.data || [];
      setBills(allBills);

      const accountNums = extractAccountNumbers(allBills);
      for (const a of accountNums) { await addAccount(a); }

      const account = selectedAccount || accountNums[0];
      if (!account) { setLoading(false); return; }

      const accountBills = allBills.filter((b) => b.account_number === account);
      const sorted = [...accountBills].sort((a, b) => new Date(b.bill_date) - new Date(a.bill_date));
      const activeBill = sorted.find((b) => b.is_active_for_dashboard);
      setLatestBill(activeBill || sorted[0] || null);

      try {
        const appRes = await appliancesAPI.analyze(account);
        if (appRes.data.success) setApplianceAnalysis(appRes.data);
      } catch (_) { }

      try {
        const planRes = await analysisAPI.getPlansByAccount(account, true);
        setActivePlans(planRes.data?.plans || []);
      } catch (_) { }

      // ── Fetch notifications (from v1) ──
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

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // ── Mark all notifications read (from v1) ──
  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications([]);
    } catch (_) { }
  };

  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const allAccounts = extractAccountNumbers(bills);

  if (loading) return <LoadingScreen message="Loading dashboard..." />;

  const totalAppliances = applianceAnalysis?.summary?.total_appliances ?? null;
  const monthlyKwh = applianceAnalysis?.summary?.total_monthly_kwh ?? null;
  const estimatedCost = applianceAnalysis?.summary?.estimated_monthly_cost ?? null;
  const dailyAvg = applianceAnalysis?.summary?.average_cost_per_day ?? null;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={`Good day, ${firstName} 👋`}
        subtitle="ElecSmart Management System"
        backgroundColor={C.bg}
        rightElement={
          <View style={styles.headerRight}>
            {/* Profile */}
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('Profile')}
            >
              <User size={22} color={C.textPrimary} strokeWidth={2} />
            </TouchableOpacity>

            {/* Bell with badge */}
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => setShowNotifModal(true)}
            >
              <Bell size={22} color={C.textPrimary} strokeWidth={2} />
              {notifications.length > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{notifications.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <LogOut size={20} color={C.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        }
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.energy}
            colors={[C.energy]}
          />
        }
      >

      {/* ── READING REMINDER BANNER ── */}
      {applianceAnalysis?.reminders?.reading_needed && (
        <TouchableOpacity 
          style={styles.reminderBanner}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Tracking')}
        >
          <View style={styles.reminderIconWrap}>
            <Text style={styles.reminderIcon}>⚠️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderTitle}>Daily Reading Needed</Text>
            <Text style={styles.reminderSub}>Please enter today's meter reading to keep your budget plan accurate.</Text>
          </View>
          <Text style={styles.reminderArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* ── ACCOUNT SELECTOR ── */}
      {allAccounts.length > 0 && (
        <AccountSelector
          selectedAccount={selectedAccount || allAccounts[0]}
          accounts={allAccounts}
          onSelect={selectAccount}
        />
      )}

      {/* ── EMPTY STATE ── */}
      {/* ── BILL HERO OR WELCOME CARD ── */}
      {bills.length === 0 ? (
        <GlowCard accentColor={C.energy} style={{ marginBottom: 18 }}>
          <View style={styles.billHeroTop}>
            <View>
              <Text style={styles.billHeroMonth}>Welcome, {firstName}!</Text>
              <Text style={styles.headerSub}>Start your energy journey today</Text>
            </View>
            <Pill label="New User" color={C.energy} />
          </View>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeText}>
              Upload your first electricity bill to unlock personalized energy analysis, 
              cost predictions, and appliance-level insights.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.analyseBtn, { backgroundColor: C.energy + '15', borderColor: C.energy + '50' }]}
            onPress={() => navigation.navigate('Bills')}
          >
            <Text style={[styles.analyseBtnText, { color: C.energy }]}>📤  Upload Your First Bill  →</Text>
          </TouchableOpacity>
        </GlowCard>
      ) : (
        <>
          {/* ── LATEST BILL HERO ── */}
          {latestBill && (
            <GlowCard accentColor={C.energy} style={{ marginBottom: 18 }}>
              <View style={styles.billHeroTop}>
                <View>
                  <Text style={styles.billHeroMonth}>{latestBill.title || formatMonthYear(latestBill.bill_date)}</Text>
                  <Text style={styles.billHeroAcct}>Account  ·  {latestBill.account_number}</Text>
                </View>
                <Pill label={latestBill.is_active_for_dashboard ? "Active" : "Latest"} color={C.energy} />
              </View>
              <View style={styles.billHeroNumbers}>
                <View style={styles.billHeroNum}>
                  <Text style={[styles.billHeroBig, { color: C.energy }]}>
                    {formatCurrency(latestBill.total_charge)}
                  </Text>
                  <Text style={styles.billHeroSmall}>Total Charge</Text>
                </View>
                <View style={styles.billHeroDivider} />
                <View style={styles.billHeroNum}>
                  <Text style={[styles.billHeroBig, { color: C.solar }]}>
                    {latestBill.units_consumed} kWh
                  </Text>
                  <Text style={styles.billHeroSmall}>Units Consumed</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.analyseBtn, { backgroundColor: C.energy + '15', borderColor: C.energy + '50' }]}
                onPress={() => navigation.navigate('BillDetail', { bill: latestBill })}
              >
                <Text style={[styles.analyseBtnText, { color: C.energy }]}>📊  Analyse This Bill  →</Text>
              </TouchableOpacity>
            </GlowCard>
          )}
        </>
      )}

      {/* ── METRIC TILES ── */}
      <View style={styles.metricRow}>
        <MetricTile icon="⚡" value={totalAppliances ?? '—'} label="Appliances" color={C.energy} />
        <MetricTile icon="🔋" value={monthlyKwh ? monthlyKwh.toFixed(1) : '—'} label="Monthly kWh" color={C.solar} />
        <MetricTile icon="💰" value={estimatedCost ? formatCurrency(estimatedCost, 0) : '—'} label="Est. Cost" color={C.safety} />
        <MetricTile icon="📅" value={dailyAvg ? `${dailyAvg.toFixed(0)} Rs` : '—'} label="Daily Avg" color={C.outage} />
      </View>

      {/* ════════════════════════════════
          4 MAIN MODULE CARDS
      ════════════════════════════════ */}
      <SLabel text="System Modules" />

      <ModuleCard
        icon="⚡"
        title="Energy Analysis & Bill Management"
        subtitle="Track consumption · upload bills · analyse trends"
        accent={C.energy}
        stat={latestBill ? formatCurrency(latestBill.total_charge, 0) : '—'}
        statLabel="latest bill"
        onPress={() => navigation.navigate('Bills')}
      />

      <ModuleCard
        icon="☀️"
        title="Solar Power Recommendation"
        subtitle="AI-powered solar sizing · ROI calculator · guide"
        accent={C.solar}
        badge="New"
        badgeColor={C.solar}
        onPress={() => navigation.navigate('Solar')}
      />

      <ModuleCard
        icon="🔴"
        title="Outage Reporting & Management"
        subtitle="Report outages · live status · area fault map"
        accent={C.outage}
        badge="Live"
        badgeColor={C.outage}
        onPress={() => navigation.navigate('Outage')}
      />

      <ModuleCard
        icon="🛡️"
        title="Safety & Disaster Management"
        subtitle="AI assistant · live weather · emergency alerts"
        accent={C.safety}
        badge="AI"
        badgeColor={C.safety}
        onPress={() => navigation.navigate('SafetyTab')}
      />

      {/* ── ACTIVE BUDGET PLANS ── */}
      {activePlans.length > 0 && (
        <>
          <SLabel
            text="Active Budget Plans"
            action={() => navigation.navigate('Tracking')}
            actionLabel="View all →"
          />
          {activePlans.map(plan => (
            <GlowCard key={plan.id} accentColor={getStatusColor(plan.progress_status)} style={{ marginBottom: 16 }}>
              <View style={styles.planRow}>
                <View>
                  <Text style={[styles.planAmount, { color: getStatusColor(plan.progress_status) }]}>
                    {formatCurrency(plan.target_budget)}
                  </Text>
                  <Text style={styles.planAmountLabel}>Target Budget</Text>
                </View>
                <Pill
                  label={getStatusLabel(plan.progress_status)}
                  color={getStatusColor(plan.progress_status)}
                />
              </View>
              <Text style={styles.planMetaTxt}>
                📅 {plan.planning_days} days  ·  🎯 {plan.target_daily_units?.toFixed(1)} kWh / day
              </Text>
              
              {/* Action buttons */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => {
                    universalAlert('Stop Tracking', 'End this plan and start a new period?', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'End Plan',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            const res = await analysisAPI.endPlan(plan.id);
                            if (res.data?.success) {
                              universalAlert('Success', 'Budget plan ended successfully.');
                              fetchData();
                            } else {
                              universalAlert('Notice', res.data?.message || 'Plan ended.');
                              fetchData();
                            }
                          } catch (err) {
                            universalAlert('Error', 'Failed to end budget plan. Please try again.');
                          }
                        },
                      },
                    ]);
                  }}
                  style={styles.stopBtnCompact}
                >
                  <Text style={styles.stopBtnCompactText}>Stop tracking</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    universalAlert('Delete Plan', 'Are you sure you want to permanently delete this plan?', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            const res = await analysisAPI.deletePlan(plan.id);
                            if (res.data?.success) fetchData();
                          } catch (err) {
                            universalAlert('Error', 'Failed to delete plan.');
                          }
                        },
                      },
                    ]);
                  }}
                  style={[styles.stopBtnCompact, { backgroundColor: '#FF4D6D15', borderColor: '#FF4D6D30' }]}
                >
                  <Text style={[styles.stopBtnCompactText, { color: '#FF4D6D' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </GlowCard>
          ))}
        </>
      )}

      {/* ── QUICK ACTIONS ── */}
      <SLabel text="Quick Actions" />
      <View style={styles.qaGrid}>
        <QA icon="📤" label="Upload Bill" color={C.energy} onPress={() => navigation.navigate('Bills')} />
        <QA icon="⚡" label="Appliances" color={C.solar} onPress={() => navigation.navigate('Appliances')} />
        <QA icon="📊" label="NILM Report" color={C.safety} onPress={() => navigation.navigate('NILM')} />
        <QA icon="🎯" label="Budget Plan" color={C.outage} onPress={() => navigation.navigate('Analysis')} />
      </View>


      <View style={{ height: 48 }} />

      {/* ════════════════════════════════
          NOTIFICATIONS MODAL  (from v1)
      ════════════════════════════════ */}
      <Modal visible={showNotifModal} animationType="slide" transparent>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowNotifModal(false)}
        >
          <View style={styles.notifSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Notifications</Text>
              <TouchableOpacity onPress={handleMarkAllRead}>
                <Text style={styles.markReadText}>Mark all as read</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.notifList} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={styles.emptyNotifWrap}>
                  <Text style={styles.emptyNotifIcon}>🔔</Text>
                  <Text style={styles.emptyNotif}>All caught up! No unread notifications.</Text>
                </View>
              ) : (
                notifications.map((n) => (
                  <View
                    key={n.id}
                    style={[styles.notifCard, { borderLeftColor: getNotifColor(n.type) }]}
                  >
                    <Text style={styles.notifTitle}>{n.title}</Text>
                    <Text style={styles.notifMsg}>{n.message}</Text>
                    <Text style={styles.notifDate}>
                      {new Date(n.created_at).toLocaleDateString()}
                    </Text>
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
    </View>
  );
};

/* ─────────────────────────────────────────────
   QUICK ACTION TILE
───────────────────────────────────────────── */
const QA = ({ icon, label, color, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    style={[styles.qaTile, { borderColor: color + '35', borderTopWidth: 2, borderTopColor: color + '70' }]}
  >
    <View style={[styles.qaIconWrap, { backgroundColor: color + '18' }]}>
      <Text style={styles.qaIconText}>{icon}</Text>
    </View>
    <Text style={styles.qaLabel}>{label}</Text>
  </TouchableOpacity>
);

/* ═══════════════════════════════════════════
   STYLES
═══════════════════════════════════════════ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 32 },

  /* ── header ── */
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBtn: { padding: 8, position: 'relative' },
  logoutBtn: {
    padding: 8, borderRadius: 10,
    backgroundColor: C.bg3, borderWidth: 1, borderColor: C.border,
  },

  /* notification badge */
  notifBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: C.danger, width: 16, height: 16,
    borderRadius: 8, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.bg,
  },
  notifBadgeText: { color: '#fff', fontSize: 8, fontWeight: '900' },

  /* ── reminder banner ── */
  reminderBanner: {
    backgroundColor: '#FF6B3515',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B3540',
    gap: 12,
  },
  reminderIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#FF6B3520',
    justifyContent: 'center', alignItems: 'center',
  },
  reminderIcon: { fontSize: 20 },
  reminderTitle: { color: '#FF6B35', fontSize: 14, fontWeight: '800' },
  reminderSub: { color: C.textSecondary, fontSize: 11, marginTop: 1, lineHeight: 15 },
  reminderArrow: { color: '#FF6B35', fontSize: 20, fontWeight: '300' },

  /* ── glow card ── */
  glowCard: {
    backgroundColor: C.card, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 18, elevation: 10,
    borderWidth: 1, borderColor: C.border,
  },
  glowStripe: { height: 3 },
  glowContent: { padding: 18 },
  welcomeContent: { marginBottom: 16 },
  welcomeText: { color: C.textSecondary, fontSize: 13, lineHeight: 20 },

  /* ── bill hero ── */
  billHeroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  billHeroMonth: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  billHeroAcct: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  billHeroNumbers: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  billHeroNum: { flex: 1, alignItems: 'center' },
  billHeroBig: { fontSize: 26, fontWeight: '800', letterSpacing: -0.8 },
  billHeroSmall: { fontSize: 12, color: C.textMuted, marginTop: 3 },
  billHeroDivider: { width: 1, height: 44, backgroundColor: C.divider, marginHorizontal: 8 },
  analyseBtn: { borderRadius: 12, borderWidth: 1, paddingVertical: 12, alignItems: 'center', marginTop: 2 },
  analyseBtnText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },

  /* ── metrics ── */
  metricRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  metricTile: {
    flex: 1, backgroundColor: C.card, borderRadius: 14, borderWidth: 1,
    paddingVertical: 13, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  metricIcon: { fontSize: 20, marginBottom: 5 },
  metricValue: { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
  metricLabel: { fontSize: 10, color: C.textMuted, marginTop: 2, textAlign: 'center' },

  /* ── section label ── */
  sLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 },
  sLabelLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sLabelDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.energy },
  sLabelText: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' },
  sLabelAction: { fontSize: 13, fontWeight: '600', color: C.energy },

  /* ── module card ── */
  moduleCard: {
    flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: C.card, borderRadius: 18, borderWidth: 1,
    marginBottom: 10, overflow: 'hidden',
    shadowColor: '#00C8FF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 6,
  },
  moduleBar: { width: 4 },
  moduleBody: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  moduleIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  moduleIcon: { fontSize: 22 },
  moduleTextGroup: { flex: 1 },
  moduleTitle: { fontSize: 14, fontWeight: '700', color: C.textPrimary, marginBottom: 3, lineHeight: 18 },
  moduleSubtitle: { fontSize: 11, color: C.textMuted, lineHeight: 15 },
  moduleRight: { alignItems: 'flex-end', gap: 4 },
  moduleStat: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  moduleStatLabel: { fontSize: 10, color: C.textMuted, marginTop: -2 },
  moduleBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  moduleBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  moduleArrow: { fontSize: 22, fontWeight: '300', lineHeight: 24, marginTop: 2 },

  /* ── plan ── */
  planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  planAmount: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  planAmountLabel: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  planMetaTxt: { fontSize: 13, color: C.textSecondary, marginBottom: 10 },
  stopBtnCompact: {
    alignSelf: 'flex-start',
    paddingVertical: 5, paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#EF444415',
    borderWidth: 1, borderColor: '#EF444430',
  },
  stopBtnCompactText: { color: '#EF4444', fontSize: 11, fontWeight: '800' },

  /* ── quick actions ── */
  qaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  qaTile: {
    width: '47.5%', backgroundColor: C.card, borderRadius: 16, borderWidth: 1,
    padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  qaIconWrap: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  qaIconText: { fontSize: 24 },
  qaLabel: { fontSize: 13, fontWeight: '600', color: C.textPrimary, textAlign: 'center' },

  /* ── notifications modal ── */
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  notifSheet: {
    backgroundColor: C.bg2,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingTop: 12,
    minHeight: '50%', maxHeight: '82%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 20,
    borderWidth: 1, borderColor: C.border,
  },
  sheetHandle: {
    width: 38, height: 4, borderRadius: 2,
    backgroundColor: C.border, alignSelf: 'center', marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  sheetTitle: { color: C.textPrimary, fontSize: 20, fontWeight: '800' },
  markReadText: { color: C.energy, fontSize: 13, fontWeight: '600' },
  notifList: { flex: 1 },
  emptyNotifWrap: { alignItems: 'center', paddingTop: 40 },
  emptyNotifIcon: { fontSize: 40, marginBottom: 12 },
  emptyNotif: { color: C.textSecondary, textAlign: 'center', fontSize: 14, fontWeight: '500' },
  notifCard: {
    backgroundColor: C.bg3, padding: 14, borderRadius: 14,
    marginBottom: 10, borderLeftWidth: 4,
    borderWidth: 1, borderColor: C.border,
  },
  notifTitle: { color: C.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  notifMsg: { color: C.textSecondary, fontSize: 13, lineHeight: 18 },
  notifDate: { color: C.textMuted, fontSize: 11, marginTop: 8, textAlign: 'right' },
  closeBtn: {
    backgroundColor: C.energy, padding: 15, borderRadius: 16,
    alignItems: 'center', marginTop: 14,
  },
  closeBtnText: { color: C.bg, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});

export default DashboardScreen;