import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { analysisAPI } from '../api/analysisAPI';
import { appliancesAPI } from '../api/appliancesAPI';
import { useAccount } from '../contexts/AccountContext';
import {
  Card, SectionHeader, EmptyState, PrimaryButton, InfoRow, Divider,
  StatCard, Badge, LoadingScreen,
} from '../components/SharedComponents';
import { COLORS, SPACING, RADIUS, FONTS } from '../utils/theme';
import { formatCurrency, getPriorityColor } from '../utils/helpers';

const AnalysisScreen = ({ navigation }) => {
  const { selectedAccount } = useAccount();
  const [tab, setTab] = useState('tariff'); // tariff | recommendations | plans
  const [units, setUnits] = useState('');
  const [days, setDays] = useState('30');
  const [tariffResult, setTariffResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const account = selectedAccount;

  useEffect(() => {
    if (tab === 'recommendations' && account) loadRecs();
    if (tab === 'plans' && account) loadPlans();
  }, [tab, account]);

  const calculateTariff = async () => {
    const u = parseInt(units);
    if (!u || isNaN(u) || u < 0) { Alert.alert('Invalid', 'Enter a valid unit count.'); return; }
    setCalculating(true);
    try {
      const res = await analysisAPI.calculateTariff(u, parseInt(days) || 30);
      setTariffResult(res.data.calculation);
    } catch (err) {
      // Fallback to local calculation
      setTariffResult(localCalculate(u, parseInt(days) || 30));
    } finally {
      setCalculating(false);
    }
  };

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
    Alert.alert('Delete Plan', 'This will also delete all meter readings. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await analysisAPI.deletePlan(planId);
            loadPlans();
          } catch { Alert.alert('Error', 'Could not delete plan.'); }
        },
      },
    ]);
  };

  return (
    <View style={styles.flex}>
      <View style={styles.tabs}>
        {['tariff', 'recommendations', 'plans'].map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'tariff' ? '🧮 Tariff' : t === 'recommendations' ? '💡 Tips' : '📋 Plans'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.container}>
        {tab === 'tariff' && (
          <TariffTab
            units={units} setUnits={setUnits}
            days={days} setDays={setDays}
            result={tariffResult}
            onCalculate={calculateTariff}
            calculating={calculating}
          />
        )}

        {tab === 'recommendations' && (
          <>
            {loadingRecs ? <LoadingScreen message="Loading tips..." /> :
              recommendations.length === 0 ? (
                <EmptyState icon="💡" title="No Recommendations" subtitle="Add appliances to get personalised energy tips." />
              ) : (
                recommendations.map((rec, i) => <RecommendationCard key={i} rec={rec} />)
              )
            }
          </>
        )}

        {tab === 'plans' && (
          <>
            <SectionHeader title="All Budget Plans" action={() => navigation.navigate('Bills')} actionLabel="+ New" />
            {loadingPlans ? <LoadingScreen message="Loading plans..." /> :
              plans.length === 0 ? (
                <EmptyState icon="📋" title="No Plans" subtitle="Create a budget plan from bill analysis." />
              ) : (
                plans.map((p) => (
                  <PlanCard key={p.id} plan={p}
                    onDelete={() => deletePlan(p.id)}
                    onTrack={() => navigation.navigate('Tracking')}
                  />
                ))
              )
            }
          </>
        )}

        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>
    </View>
  );
};

const TariffTab = ({ units, setUnits, days, setDays, result, onCalculate, calculating }) => (
  <>
    <SectionHeader title="CEB Tariff Calculator" />
    <Card>
      <Text style={styles.cardTitle}>Enter Consumption Details</Text>
      <Text style={styles.fieldLabel}>Units Consumed (kWh)</Text>
      <TextInput
        style={styles.input}
        value={units}
        onChangeText={setUnits}
        placeholder="e.g. 120"
        placeholderTextColor={COLORS.textMuted}
        keyboardType="numeric"
      />
      <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Billing Days</Text>
      <View style={styles.daysRow}>
        {['28', '30', '31', '34'].map((d) => (
          <TouchableOpacity key={d} style={[styles.dayBtn, days === d && styles.dayBtnActive]} onPress={() => setDays(d)}>
            <Text style={[styles.dayText, days === d && styles.dayTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <PrimaryButton label="Calculate Bill" onPress={onCalculate} loading={calculating} disabled={calculating || !units} style={{ marginTop: SPACING.md }} />
    </Card>

    {result && (
      <Card style={styles.resultCard}>
        <Text style={styles.cardTitle}>Bill Calculation</Text>
        <View style={[styles.categoryBadge, { backgroundColor: result.category === 1 ? COLORS.success + '22' : COLORS.warning + '22' }]}>
          <Text style={[styles.categoryText, { color: result.category === 1 ? COLORS.success : COLORS.warning }]}>
            {result.category_name}
          </Text>
        </View>

        {result.breakdown?.map((item, i) => (
          <View key={i} style={styles.breakdownRow}>
            <Text style={styles.breakdownBlock}>{item.block}</Text>
            <Text style={styles.breakdownCalc}>{item.calculation}</Text>
          </View>
        ))}

        <Divider />
        <InfoRow label="Energy Charge" value={formatCurrency(result.energy_charge)} />
        <InfoRow label="Fixed Charge" value={formatCurrency(result.fixed_charge)} />
        <InfoRow label="SSCL (2.565%)" value={formatCurrency(result.sscl)} />
        <Divider />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{formatCurrency(result.total)}</Text>
        </View>
      </Card>
    )}

    {/* Tariff reference */}
    <Card>
      <Text style={styles.cardTitle}>📊 Tariff Reference (Oct 2025)</Text>
      <Text style={styles.tariffNote}>Category 1 (≤ 60 kWh)</Text>
      {[['0–30', 'Rs. 4.50/unit', 'Rs. 80 fixed'], ['31–60', 'Rs. 8.00/unit', 'Rs. 210 fixed']].map(([range, rate, fixed], i) => (
        <View key={i} style={styles.tariffRow}>
          <Text style={styles.tariffRange}>{range}</Text>
          <Text style={styles.tariffRate}>{rate}</Text>
          <Text style={styles.tariffFixed}>{fixed}</Text>
        </View>
      ))}
      <Text style={[styles.tariffNote, { marginTop: SPACING.md }]}>Category 2 ({'>'} 60 kWh)</Text>
      {[['0–60', '12.75', '—'], ['61–90', '18.50', '400'], ['91–120', '24.00', '1,000'], ['121–180', '41.00', '1,500'], ['181+', '61.00', '2,100']].map(([range, rate, fixed], i) => (
        <View key={i} style={styles.tariffRow}>
          <Text style={styles.tariffRange}>{range} kWh</Text>
          <Text style={styles.tariffRate}>Rs. {rate}/unit</Text>
          <Text style={styles.tariffFixed}>{fixed !== '—' ? `Rs. ${fixed}` : '—'}</Text>
        </View>
      ))}
    </Card>
  </>
);

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

const PlanCard = ({ plan, onDelete, onTrack }) => (
  <Card style={{ borderLeftWidth: 3, borderLeftColor: plan.progress_status === 'over_budget' ? COLORS.danger : COLORS.success }}>
    <View style={styles.planRow}>
      <View>
        <Text style={styles.planBudget}>{formatCurrency(plan.target_budget)}</Text>
        <Text style={styles.planMeta}>{plan.planning_days} days · {plan.progress_status}</Text>
      </View>
      <View style={styles.planActions}>
        <TouchableOpacity onPress={onTrack} style={styles.planBtn}>
          <Text style={styles.planBtnText}>Track</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete}>
          <Text style={{ fontSize: 18 }}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Card>
);

// Local tariff fallback if API is down
function localCalculate(units, days) {
  let fixed, slabs, energy = 0;
  if (units <= 30) { fixed = 80; slabs = [[0, 30, 4.5]]; }
  else if (units <= 60) { fixed = 210; slabs = [[0, 30, 4.5], [31, 60, 8]]; }
  else if (units <= 90) { fixed = 400; slabs = [[0, 60, 12.75], [61, 90, 18.5]]; }
  else if (units <= 120) { fixed = 1000; slabs = [[0, 60, 12.75], [61, 90, 18.5], [91, 120, 24]]; }
  else if (units <= 180) { fixed = 1500; slabs = [[0, 60, 12.75], [61, 90, 18.5], [91, 120, 24], [121, 180, 41]]; }
  else { fixed = 2100; slabs = [[0, 60, 12.75], [61, 90, 18.5], [91, 120, 24], [121, 180, 41], [181, Infinity, 61]]; }

  const breakdown = [];
  for (const [min, max, rate] of slabs) {
    if (units <= min) break;
    const u = Math.min(units, max === Infinity ? units : max) - min + 1;
    if (u > 0) { energy += u * rate; breakdown.push({ block: `${min}-${max === Infinity ? '∞' : max}`, rate, units: u, amount: u * rate, calculation: `${rate} × ${u} = ${(u * rate).toFixed(2)}` }); }
  }
  const sscl = (energy + fixed) * 0.02565;
  return { energy_charge: +energy.toFixed(2), fixed_charge: fixed, sscl: +sscl.toFixed(2), total: +(energy + fixed + sscl).toFixed(2), breakdown, category: units <= 60 ? 1 : 2, category_name: units <= 60 ? '0–60 kWh (Low)' : 'Above 60 kWh (High)' };
}

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
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, ...FONTS.semiBold, marginBottom: SPACING.md },
  fieldLabel: { color: COLORS.textSecondary, fontSize: 13, ...FONTS.medium, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.bg3, color: COLORS.textPrimary,
    borderRadius: RADIUS.md, padding: SPACING.md, fontSize: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  daysRow: { flexDirection: 'row', gap: SPACING.sm },
  dayBtn: {
    flex: 1, padding: SPACING.md, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  dayBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayText: { color: COLORS.textSecondary, ...FONTS.medium },
  dayTextActive: { color: '#fff' },
  resultCard: {},
  categoryBadge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.sm, alignSelf: 'flex-start', marginBottom: SPACING.md },
  categoryText: { fontSize: 13, ...FONTS.semiBold },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs },
  breakdownBlock: { color: COLORS.textSecondary, fontSize: 13 },
  breakdownCalc: { color: COLORS.textPrimary, fontSize: 13, ...FONTS.medium },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm },
  totalLabel: { color: COLORS.textPrimary, fontSize: 18, ...FONTS.bold },
  totalValue: { color: COLORS.success, fontSize: 22, ...FONTS.bold },
  tariffNote: { color: COLORS.primary, fontSize: 13, ...FONTS.semiBold, marginBottom: SPACING.sm },
  tariffRow: { flexDirection: 'row', paddingVertical: 4 },
  tariffRange: { color: COLORS.textSecondary, flex: 1, fontSize: 12 },
  tariffRate: { color: COLORS.textPrimary, flex: 1, fontSize: 12 },
  tariffFixed: { color: COLORS.textMuted, flex: 1, fontSize: 12, textAlign: 'right' },
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
  planBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.sm },
  planBtnText: { color: '#fff', fontSize: 13, ...FONTS.medium },
});

export default AnalysisScreen;