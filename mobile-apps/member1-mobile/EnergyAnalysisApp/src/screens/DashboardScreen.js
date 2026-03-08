import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Animated,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useAccount } from '../contexts/AccountContext';
import { billsAPI } from '../api/billsAPI';
import { appliancesAPI } from '../api/appliancesAPI';
import { analysisAPI } from '../api/analysisAPI';
import {
  StatCard, SectionHeader, EmptyState, LoadingScreen, Card, ProgressBar,
} from '../components/SharedComponents';
import AccountSelector from '../components/AccountSelector';
import { COLORS, SPACING, RADIUS, FONTS, SHADOW } from '../utils/theme';
import {
  formatCurrency, formatKwh, formatMonthYear,
  getStatusColor, getStatusLabel, extractAccountNumbers,
} from '../utils/helpers';

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const C = {
  bg:        '#0B0F1A',
  bg2:       '#111827',
  bg3:       '#1A2235',
  card:      '#141C2E',
  energy:    '#00D2FF',
  solar:     '#FFD60A',
  outage:    '#FF6B35',
  safety:    '#06D6A0',
  textPrimary:   '#F0F4FF',
  textSecondary: '#8B9DC3',
  textMuted:     '#4A5568',
  divider:       '#1E2D45',
  success: '#06D6A0',
  warning: '#FFD60A',
  danger:  '#FF4D6D',
};

/* ─────────────────────────────────────────────
   SMALL ATOMS
───────────────────────────────────────────── */
const Pill = ({ label, color }) => (
  <View style={{ backgroundColor: color + '22', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' }}>
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
    activeOpacity={0.82}
    onPress={onPress}
    style={[styles.moduleCard, { borderColor: accent + '33' }]}
  >
    <View style={[styles.moduleBar, { backgroundColor: accent }]} />
    <View style={styles.moduleBody}>
      <View style={[styles.moduleIconWrap, { backgroundColor: accent + '18' }]}>
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
          <View style={[styles.moduleBadge, { backgroundColor: (badgeColor || accent) + '22' }]}>
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
  <View style={[styles.metricTile, { borderColor: color + '28' }]}>
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

/* ═══════════════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════════════ */
const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { selectedAccount, accounts, selectAccount, addAccount } = useAccount();

  const [loading, setLoading]                     = useState(true);
  const [refreshing, setRefreshing]               = useState(false);
  const [bills, setBills]                         = useState([]);
  const [applianceAnalysis, setApplianceAnalysis] = useState(null);
  const [activePlan, setActivePlan]               = useState(null);
  const [latestBill, setLatestBill]               = useState(null);

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
      setLatestBill(sorted[0] || null);

      try {
        const appRes = await appliancesAPI.analyze(account);
        if (appRes.data.success) setApplianceAnalysis(appRes.data);
      } catch (_) {}

      try {
        const planRes = await analysisAPI.getPlansByAccount(account, true);
        setActivePlan((planRes.data?.plans || [])[0] || null);
      } catch (_) {}

    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedAccount]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const firstName   = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const allAccounts = extractAccountNumbers(bills);

  if (loading) return <LoadingScreen message="Loading dashboard..." />;

  const totalAppliances = applianceAnalysis?.summary?.total_appliances ?? null;
  const monthlyKwh      = applianceAnalysis?.summary?.total_monthly_kwh ?? null;
  const estimatedCost   = applianceAnalysis?.summary?.estimated_monthly_cost ?? null;
  const dailyAvg        = applianceAnalysis?.summary?.average_cost_per_day ?? null;

  return (
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
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Good day, {firstName} 👋</Text>
          <Text style={styles.headerSub}>ElecSmart Management System</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutIcon}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* ── ACCOUNT SELECTOR ── */}
      {allAccounts.length > 0 && (
        <AccountSelector
          selectedAccount={selectedAccount || allAccounts[0]}
          accounts={allAccounts}
          onSelect={selectAccount}
        />
      )}

      {/* ── EMPTY STATE ── */}
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
          {/* ── LATEST BILL HERO ── */}
          {latestBill && (
            <GlowCard accentColor={C.energy} style={{ marginBottom: 16 }}>
              <View style={styles.billHeroTop}>
                <View>
                  <Text style={styles.billHeroMonth}>{formatMonthYear(latestBill.bill_date)}</Text>
                  <Text style={styles.billHeroAcct}>Account  ·  {latestBill.account_number}</Text>
                </View>
                <Pill label="Latest" color={C.energy} />
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
                style={[styles.analyseBtn, { backgroundColor: C.energy + '18', borderColor: C.energy + '44' }]}
                onPress={() => navigation.navigate('BillDetail', { bill: latestBill })}
              >
                <Text style={[styles.analyseBtnText, { color: C.energy }]}>📊  Analyse This Bill  →</Text>
              </TouchableOpacity>
            </GlowCard>
          )}

          {/* ── METRIC TILES ── */}
          <View style={styles.metricRow}>
            <MetricTile icon="⚡" value={totalAppliances ?? '—'}                              label="Appliances"   color={C.energy} />
            <MetricTile icon="🔋" value={monthlyKwh ? monthlyKwh.toFixed(1) : '—'}           label="Monthly kWh"  color={C.solar}  />
            <MetricTile icon="💰" value={estimatedCost ? formatCurrency(estimatedCost, 0) : '—'} label="Est. Cost" color={C.safety} />
            <MetricTile icon="📅" value={dailyAvg ? `${dailyAvg.toFixed(0)} Rs` : '—'}       label="Daily Avg"    color={C.outage} />
          </View>

          {/* ════════════════════════════════
              4 MAIN MODULE CARDS
          ════════════════════════════════ */}
          <SLabel text="System Modules" />

          {/* 1 · Energy Analysis & Bill Management */}
          <ModuleCard
            icon="⚡"
            title="Energy Analysis & Bill Management"
            subtitle="Track consumption · upload bills · analyse trends"
            accent={C.energy}
            stat={latestBill ? formatCurrency(latestBill.total_charge, 0) : '—'}
            statLabel="latest bill"
            onPress={() => navigation.navigate('Bills')}
          />

          {/* 2 · Solar Power Recommendation → SolarRecommendationScreen */}
          <ModuleCard
            icon="☀️"
            title="Solar Power Recommendation"
            subtitle="AI-powered solar sizing · ROI calculator · guide"
            accent={C.solar}
            badge="New"
            badgeColor={C.solar}
            onPress={() => navigation.navigate('Solar')}
          />

          {/* 3 · Outage Reporting & Management */}
          <ModuleCard
            icon="🔴"
            title="Outage Reporting & Management"
            subtitle="Report outages · live status · area fault map"
            accent={C.outage}
            badge="Live"
            badgeColor={C.outage}
            onPress={() => navigation.navigate('Outage')}
          />

          {/* 4 · Safety & Disaster Management */}
          <ModuleCard
            icon="🛡️"
            title="Safety & Disaster Management"
            subtitle="Hazard alerts · safety checklist · emergency contacts"
            accent={C.safety}
            onPress={() => navigation.navigate('Safety')}
          />

          {/* ── ACTIVE BUDGET PLAN ── */}
          {activePlan && (
            <>
              <SLabel
                text="Active Budget Plan"
                action={() => navigation.navigate('Tracking')}
                actionLabel="View →"
              />
              <GlowCard accentColor={getStatusColor(activePlan.progress_status)} style={{ marginBottom: 16 }}>
                <View style={styles.planRow}>
                  <View>
                    <Text style={[styles.planAmount, { color: getStatusColor(activePlan.progress_status) }]}>
                      {formatCurrency(activePlan.target_budget)}
                    </Text>
                    <Text style={styles.planAmountLabel}>Target Budget</Text>
                  </View>
                  <Pill
                    label={getStatusLabel(activePlan.progress_status)}
                    color={getStatusColor(activePlan.progress_status)}
                  />
                </View>
                <Text style={styles.planMetaTxt}>
                  📅 {activePlan.planning_days} days  ·  🎯 {activePlan.target_daily_units?.toFixed(1)} kWh / day
                </Text>
              </GlowCard>
            </>
          )}

          {/* ── QUICK ACTIONS ── */}
          <SLabel text="Quick Actions" />
          <View style={styles.qaGrid}>
            <QA icon="📤" label="Upload Bill"  color={C.energy}  onPress={() => navigation.navigate('Bills')} />
            <QA icon="⚡" label="Appliances"   color={C.solar}   onPress={() => navigation.navigate('Appliances')} />
            <QA icon="📊" label="NILM Report"  color={C.safety}  onPress={() => navigation.navigate('NILM')} />
            <QA icon="🎯" label="Budget Plan"  color={C.outage}  onPress={() => navigation.navigate('Analysis')} />
          </View>
        </>
      )}

      <View style={{ height: 48 }} />
    </ScrollView>
  );
};

/* ─────────────────────────────────────────────
   QUICK ACTION TILE
───────────────────────────────────────────── */
const QA = ({ icon, label, color, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    style={[styles.qaTile, { borderColor: color + '33' }]}
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
  container:     { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingHorizontal: 18, paddingTop: 52, paddingBottom: 32 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
  },
  headerGreeting: { fontSize: 24, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.5 },
  headerSub:      { fontSize: 12, color: C.textMuted, marginTop: 3, letterSpacing: 0.3 },
  logoutBtn:      { padding: 6, marginTop: 2 },
  logoutIcon:     { fontSize: 20 },

  glowCard: {
    backgroundColor: C.card, borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  glowStripe:  { height: 3 },
  glowContent: { padding: 18 },

  billHeroTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  billHeroMonth:   { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  billHeroAcct:    { fontSize: 12, color: C.textMuted, marginTop: 2 },
  billHeroNumbers: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  billHeroNum:     { flex: 1, alignItems: 'center' },
  billHeroBig:     { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  billHeroSmall:   { fontSize: 12, color: C.textMuted, marginTop: 3 },
  billHeroDivider: { width: 1, height: 40, backgroundColor: C.divider, marginHorizontal: 8 },
  analyseBtn:      { borderRadius: 10, borderWidth: 1, paddingVertical: 11, alignItems: 'center', marginTop: 2 },
  analyseBtnText:  { fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },

  metricRow:   { flexDirection: 'row', gap: 8, marginBottom: 22 },
  metricTile:  {
    flex: 1, backgroundColor: C.card, borderRadius: 14, borderWidth: 1,
    paddingVertical: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  metricIcon:  { fontSize: 20, marginBottom: 5 },
  metricValue: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  metricLabel: { fontSize: 11, color: C.textMuted, marginTop: 2, textAlign: 'center' },

  sLabel:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 },
  sLabelLeft:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sLabelDot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: C.energy },
  sLabelText:  { fontSize: 12, fontWeight: '700', color: C.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  sLabelAction:{ fontSize: 13, fontWeight: '600', color: C.energy },

  moduleCard: {
    flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1,
    marginBottom: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 10, elevation: 5,
  },
  moduleBar:       { width: 4 },
  moduleBody:      { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  moduleIconWrap:  { width: 46, height: 46, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  moduleIcon:      { fontSize: 22 },
  moduleTextGroup: { flex: 1 },
  moduleTitle:     { fontSize: 14, fontWeight: '700', color: C.textPrimary, marginBottom: 3, lineHeight: 18 },
  moduleSubtitle:  { fontSize: 11, color: C.textMuted, lineHeight: 15 },
  moduleRight:     { alignItems: 'flex-end', gap: 4 },
  moduleStat:      { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  moduleStatLabel: { fontSize: 10, color: C.textMuted, marginTop: -2 },
  moduleBadge:     { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  moduleBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  moduleArrow:     { fontSize: 22, fontWeight: '300', lineHeight: 24, marginTop: 2 },

  planRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  planAmount:      { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  planAmountLabel: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  planMetaTxt:     { fontSize: 13, color: C.textSecondary },

  qaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  qaTile: {
    width: '47.5%', backgroundColor: C.card, borderRadius: 14, borderWidth: 1,
    padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  qaIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  qaIconText: { fontSize: 24 },
  qaLabel:    { fontSize: 13, fontWeight: '600', color: C.textPrimary, textAlign: 'center' },
});

export default DashboardScreen;
