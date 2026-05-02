import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, Platform,
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { analysisAPI } from '../api/analysisAPI';
import { appliancesAPI } from '../api/appliancesAPI';
import { useAccount } from '../contexts/AccountContext';
import {
  Card, SectionHeader, EmptyState, LoadingScreen, PremiumEmptyState,
} from '../components/SharedComponents';
import { COLORS, SPACING, RADIUS, FONTS } from '../utils/theme';
import { formatCurrency, getPriorityColor } from '../utils/helpers';

// ─── TARIFF NAV CARD ──────────────────────────────────────────────────────────
// Shown in the Tariff tab — tapping navigates to the full TariffScreen
const TariffNavCard = ({ onPress }) => (
  <TouchableOpacity style={nc.wrap} onPress={onPress} activeOpacity={0.82}>
    <View style={nc.left}>
      <Text style={nc.icon}>🧮</Text>
      <View style={{ flex: 1 }}>
        <Text style={nc.title}>CEB Tariff Calculator</Text>
        <Text style={nc.sub}>Interactive bill calculator · Oct 2025 rates</Text>
      </View>
    </View>
    <Text style={nc.arrow}>→</Text>
  </TouchableOpacity>
);

// Feature preview tiles shown below the nav card
const FEATURES = [
  { icon: '📊', label: 'Usage Gauge', desc: 'Visual consumption level indicator' },
  { icon: '⚡', label: 'Slab Breakdown', desc: 'Animated per-block energy charges' },
  { icon: '💡', label: 'Quick Presets', desc: 'Low / Mid / High instant estimates' },
  { icon: '📋', label: 'Rate Reference', desc: 'Full Oct 2025 tariff table' },
];

const nc = StyleSheet.create({
  wrap: {
    backgroundColor: '#0D1422', borderRadius: 18, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#0EA5E944', marginBottom: 12,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  icon: { fontSize: 32 },
  title: { color: '#F1F5F9', fontSize: 16, fontWeight: '800', marginBottom: 3 },
  sub: { color: '#475569', fontSize: 12 },
  arrow: { color: '#0EA5E9', fontSize: 22 },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
const AnalysisScreen = ({ navigation }) => {
  const { selectedAccount } = useAccount();
  const [tab, setTab] = useState('tariff'); // tariff | recommendations | plans
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const account = selectedAccount;

  useEffect(() => {
    if (tab === 'recommendations' && account) loadRecs();
    if (tab === 'plans' && account) loadPlans();
  }, [tab, account]);

  const loadRecs = async () => {
    if (!account) return;
    setLoadingRecs(true);
    try {
      const res = await appliancesAPI.getRecommendations(account);
      setRecommendations(res.data?.recommendations || []);
    } catch { setRecommendations([]); }
    finally { setLoadingRecs(false); }
  };

  const loadPlans = async () => {
    if (!account) return;
    setLoadingPlans(true);
    try {
      const res = await analysisAPI.getPlansByAccount(account, false);
      setPlans(res.data?.plans || []);
    } catch { setPlans([]); }
    finally { setLoadingPlans(false); }
  };

  const deletePlan = async (planId) => {
    const message = 'This will also delete all meter readings. Continue?';

    universalAlert('Delete Plan', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await analysisAPI.deletePlan(planId);
            loadPlans();
          } catch { universalAlert('Error', 'Could not delete plan.'); }
        },
      },
    ]);
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader 
        title="Analysis & Planning"
        subtitle="Energy consumption & budget tools"
        onBack={() => navigation.goBack()}
      />

      {/* TAB BAR */}
      <View style={styles.tabs}>
        {[
          { key: 'tariff', label: '🧮 Tariff' },
          { key: 'recommendations', label: '💡 Tips' },
          { key: 'plans', label: '📋 Plans' },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => setTab(key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── TARIFF TAB ── */}
        {tab === 'tariff' && (
          <View style={{ paddingTop: SPACING.md }}>

            {/* Big nav card */}
            <TariffNavCard onPress={() => navigation.navigate('Tariff')} />

            {/* Feature preview grid */}
            <Text style={styles.featuresLabel}>WHAT'S INSIDE</Text>
            <View style={styles.featuresGrid}>
              {FEATURES.map(({ icon, label, desc }) => (
                <View
                  key={label}
                  style={styles.featureCard}
                >
                  <Text style={styles.featureIcon}>{icon}</Text>
                  <Text style={styles.featureLabel}>{label}</Text>
                  <Text style={styles.featureDesc}>{desc}</Text>
                </View>
              ))}
            </View>

            {/* Verified accuracy banner */}
            <View style={styles.verifiedBanner}>
              <Text style={{ fontSize: 20 }}>✅</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.verifiedTitle}>Verified Against Real CEB Bills</Text>
                <Text style={styles.verifiedSub}>
                  Calculation confirmed with actual statements.
                  Correct slab scaling for any billing period length.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── RECOMMENDATIONS TAB ── */}
        {tab === 'recommendations' && (
          <>
            {loadingRecs
              ? <LoadingScreen message="Loading tips..." />
              : recommendations.length === 0
                ? (
                  <PremiumEmptyState 
                    icon="💡" 
                    title="No Savings Tips Yet" 
                    subtitle="Add your appliances to help our AI analyze your consumption patterns and provide tailored recommendations." 
                    features={[
                      { icon: '📊', text: 'Daily Usage Breakdown' },
                      { icon: '⚡', text: 'Potential Cost Savings' }
                    ]}
                    action={() => navigation.navigate('Appliances')}
                    actionLabel="Add Devices"
                  />
                )
                : recommendations.map((rec, i) => <RecommendationCard key={i} rec={rec} />)
            }
          </>
        )}

        {/* ── PLANS TAB ── */}
        {tab === 'plans' && (
          <>
            <SectionHeader
              title="All Budget Plans"
              action={() => navigation.navigate('Bills')}
              actionLabel="+ New"
            />
            {loadingPlans
              ? <LoadingScreen message="Loading plans..." />
              : plans.length === 0
                ? (
                  <PremiumEmptyState 
                    icon="📋" 
                    title="No Active Plans" 
                    subtitle="Budget plans are created by analyzing your past bills. Once created, you can track your progress here." 
                    features={[
                      { icon: '🧾', text: 'Bill Historical Analysis' },
                      { icon: '🎯', text: 'Target Cost Setting' }
                    ]}
                    action={() => navigation.navigate('Bills')}
                    actionLabel="Analyze a Bill"
                  />
                )
                : plans.map((p) => (
                  <PlanCard
                    key={p.id} plan={p}
                    onDelete={() => deletePlan(p.id)}
                    onTrack={() => navigation.navigate('Tracking')}
                  />
                ))
            }
          </>
        )}

        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>
    </View>
  );
};

// ─── RECOMMENDATION CARD ──────────────────────────────────────────────────────
const RecommendationCard = ({ rec }) => (
  <Card style={{ borderLeftWidth: 3, borderLeftColor: getPriorityColor(rec.priority) }}>
    <View style={styles.recHeader}>
      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(rec.priority) + '22' }]}>
        <Text style={[styles.priorityText, { color: getPriorityColor(rec.priority) }]}>
          {rec.priority?.toUpperCase()}
        </Text>
      </View>
      {rec.appliance && <Text style={styles.recAppliance}>⚡ {rec.appliance}</Text>}
    </View>
    <Text style={styles.recMessage}>{rec.message}</Text>
    <Text style={styles.recSuggestion}>{rec.suggestion}</Text>
    {rec.potential_savings_kwh > 0 && (
      <Text style={styles.recSavings}>💡 Save ~{rec.potential_savings_kwh} kWh/month</Text>
    )}
  </Card>
);

// ─── PLAN CARD ────────────────────────────────────────────────────────────────
const PlanCard = ({ plan, onDelete, onTrack }) => (
  <Card style={{
    borderLeftWidth: 3,
    borderLeftColor: plan.progress_status === 'over_budget' ? COLORS.danger : COLORS.success,
  }}>
    <View style={styles.planRow}>
      <View>
        <Text style={styles.planBudget}>{formatCurrency(plan.target_budget)}</Text>
        <Text style={styles.planMeta}>{plan.planning_days} days · {plan.progress_status}</Text>
      </View>
      <View style={styles.planActions}>
        <TouchableOpacity onPress={onTrack} style={styles.planBtn}>
          <Text style={styles.planBtnText}>Track</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          style={styles.deleteBtn}
          hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
          activeOpacity={0.6}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Card>
);

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg1 },

  tabs: {
    flexDirection: 'row', backgroundColor: COLORS.bg2,
    margin: SPACING.lg, borderRadius: RADIUS.lg, padding: 4,
  },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.md },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontSize: 12, ...FONTS.medium },
  tabTextActive: { color: '#fff', ...FONTS.semiBold },

  container: { flex: 1, paddingHorizontal: SPACING.lg },

  featuresLabel: {
    color: COLORS.textMuted, fontSize: 10, fontWeight: '800',
    letterSpacing: 2, marginBottom: SPACING.md, marginTop: SPACING.sm,
  },
  featuresGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg,
  },
  featureCard: {
    width: '47.5%', backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  featureIcon: { fontSize: 22, marginBottom: SPACING.sm },
  featureLabel: { color: COLORS.textPrimary, fontSize: 13, ...FONTS.semiBold, marginBottom: 3 },
  featureDesc: { color: COLORS.textMuted, fontSize: 11, lineHeight: 16 },

  verifiedBanner: {
    flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start',
    backgroundColor: COLORS.bg2, borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.success + '33', marginBottom: SPACING.lg,
  },
  verifiedTitle: { color: COLORS.textPrimary, fontSize: 13, ...FONTS.semiBold, marginBottom: 4 },
  verifiedSub: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 16 },

  recHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  priorityBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.sm },
  priorityText: { fontSize: 10, ...FONTS.bold },
  recAppliance: { color: COLORS.textSecondary, fontSize: 13 },
  recMessage: { color: COLORS.textPrimary, fontSize: 14, ...FONTS.medium, marginBottom: SPACING.xs },
  recSuggestion: { color: COLORS.textSecondary, fontSize: 13 },
  recSavings: { color: COLORS.success, fontSize: 13, marginTop: SPACING.sm },

  planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planBudget: { color: COLORS.textPrimary, fontSize: 18, ...FONTS.bold },
  planMeta: { color: COLORS.textSecondary, fontSize: 12 },
  planActions: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  planBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.sm,
  },
  planBtnText: { color: '#fff', fontSize: 13, ...FONTS.medium },
  deleteBtn: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  deleteIcon: {
    fontSize: 20,
  },
});

export default AnalysisScreen;