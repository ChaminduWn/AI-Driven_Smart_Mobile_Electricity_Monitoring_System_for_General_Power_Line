import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, TextInput,
} from 'react-native';
import { analysisAPI } from '../api/analysisAPI';
import { billsAPI } from '../api/billsAPI';
import { appliancesAPI } from '../api/appliancesAPI';
import {
  Card, SectionHeader, InfoRow, Divider, PrimaryButton, SecondaryButton,
  StatCard, ProgressBar,
} from '../components/SharedComponents';
import { COLORS, SPACING, RADIUS, FONTS } from '../utils/theme';
import { formatCurrency, formatKwh, formatDate, calcCEB } from '../utils/helpers';

const BillDetailScreen = ({ route, navigation }) => {
  const { bill: initBill, billId } = route.params || {};
  const [bill, setBill] = useState(initBill || null);
  const [analysis, setAnalysis] = useState(null);
  const [tariffDetails, setTariffDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [budgetRecs, setBudgetRecs] = useState(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [targetBudget, setTargetBudget] = useState('');
  const [planningDays, setPlanningDays] = useState('30');
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [applianceCount, setApplianceCount] = useState(0);

  const id = billId || bill?.id;

  useEffect(() => {
    (async () => {
      try {
        // Fetch bill if not provided
        let currentBill = bill;
        if (!currentBill && id) {
          const r = await billsAPI.getById(id);
          currentBill = r.data.data;
          setBill(currentBill);
        }

        // Fetch analysis
        if (id) {
          const [aRes, bRes] = await Promise.allSettled([
            analysisAPI.analyzePastMonth(id),
            analysisAPI.getBudgetRecommendations(id),
          ]);
          if (aRes.status === 'fulfilled' && aRes.value.data?.success) {
            const an = aRes.value.data.analysis;
            setAnalysis(an);

            // Recalculate tariff details locally to ensure day-normalization accuracy
            if (currentBill?.units_consumed && currentBill?.billing_period_days) {
              const calc = calcCEB(currentBill.units_consumed, currentBill.billing_period_days);
              if (calc) {
                setTariffDetails({
                  category_name: calc.category === 1 ? 'Category 1 (0-60 kWh/mo)' : 'Category 2 (Above 60 kWh/mo)',
                  energy_charge: calc.energy,
                  fixed_charge: calc.fixed,
                  sscl: calc.sscl,
                  total: calc.total,
                  breakdown: calc.breakdown.map(b => ({
                    block: b.range + ' kWh',
                    rate: b.rate,
                    amount: b.amt
                  }))
                });
              } else {
                setTariffDetails(an?.tariff_details);
              }
            } else {
              setTariffDetails(an?.tariff_details);
            }
          }
          if (bRes.status === 'fulfilled' && bRes.value.data?.success) {
            setBudgetRecs(bRes.value.data);
            const prevCost = bRes.value.data?.current_cost || 0;
            setTargetBudget(Math.floor(prevCost * 0.9).toString());
          }
        }

        // Check appliance count for this account
        if (bill?.account_number || initBill?.account_number) {
          const acct = bill?.account_number || initBill?.account_number;
          try {
            const appRes = await appliancesAPI.getByAccount(acct);
            setApplianceCount(appRes.data?.count || 0);
          } catch (_) { }
        }
      } catch (err) {
        console.error('Bill detail error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const createPlan = async () => {
    if (applianceCount < 5) {
      Alert.alert(
        '⚠️ Appliances Required',
        `You need at least 5 appliances registered to create a budget plan.\n\nYou currently have ${applianceCount}. Add ${5 - applianceCount} more in the Appliances tab.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Appliances', onPress: () => navigation.navigate('Appliances') },
        ],
      );
      return;
    }

    const budgetVal = parseFloat(targetBudget);
    const daysVal = parseInt(planningDays);
    const prevCost = budgetRecs?.current_cost || 0;

    if (!targetBudget || isNaN(budgetVal)) {
      Alert.alert('Error', 'Enter a valid target budget.');
      return;
    }

    // Dynamic Validation: 50% - 150%
    const minB = prevCost * 0.5;
    const maxB = prevCost * 1.5;
    if (budgetVal < minB || budgetVal > maxB) {
      Alert.alert(
        'Invalid Budget',
        `Budget must be between 50% (Rs. ${Math.round(minB)}) and 150% (Rs. ${Math.round(maxB)}) of your previous bill.`
      );
      return;
    }

    // Days Validation: 10 - 60
    if (isNaN(daysVal) || daysVal < 10 || daysVal > 60) {
      Alert.alert('Invalid Period', 'Planning period must be between 10 and 60 days.');
      return;
    }

    setCreatingPlan(true);
    try {
      const res = await analysisAPI.createBudgetPlan(id, budgetVal, daysVal);
      if (res.data.success) {
        Alert.alert('✅ Budget Plan Created!', `Plan ID: ${res.data.plan_id}\nTrack your meter readings to monitor progress.`, [
          { text: 'Start Tracking', onPress: () => navigation.navigate('Tracking') },
          { text: 'OK' },
        ]);
        setShowPlanForm(false);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create plan.';
      Alert.alert('Error', msg);
    } finally {
      setCreatingPlan(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Analysing bill...</Text>
      </View>
    );
  }

  const currentBill = bill;

  return (
    <ScrollView style={styles.container}>
      {/* Bill Overview */}
      <Card style={styles.overviewCard} accentColor={COLORS.primary}>
        <Text style={styles.overviewTitle}>Bill Overview</Text>
        <InfoRow label="Account" value={currentBill?.account_number || '—'} />
        <InfoRow label="Bill Date" value={formatDate(currentBill?.bill_date)} />
        <InfoRow label="Billing Period" value={`${currentBill?.billing_period_days || '—'} days`} />
        <Divider />
        <InfoRow label="Units Consumed" value={`${currentBill?.units_consumed || '—'} kWh`} />
        <InfoRow label="Total Charge" value={formatCurrency(currentBill?.total_charge)} valueColor={COLORS.success} />
        {currentBill?.fixed_charge > 0 && (
          <InfoRow label="Fixed Charge" value={formatCurrency(currentBill.fixed_charge)} />
        )}
        {currentBill?.previous_reading && (
          <InfoRow label="Meter Readings" value={`${currentBill.previous_reading} → ${currentBill.current_reading}`} />
        )}
      </Card>

      {/* Consumption Analysis */}
      {analysis && (
        <>
          <SectionHeader title="Consumption Analysis" />
          <View style={styles.statsRow}>
            <StatCard label="Daily Avg" value={`${analysis.summary?.daily_average_units?.toFixed(1) || '—'} kWh`} icon="📅" color={COLORS.primary} />
            <View style={{ width: SPACING.md }} />
            <StatCard label="Weekly Avg" value={`${analysis.summary?.weekly_average_units?.toFixed(1) || '—'} kWh`} icon="📊" color={COLORS.secondary} />
          </View>

          {/* Tariff Breakdown */}
          {tariffDetails && (
            <Card>
              <Text style={styles.cardTitle}>💡 Tariff Breakdown</Text>
              <InfoRow label="Category" value={tariffDetails.category_name} />
              <Divider />
              {tariffDetails.breakdown?.map((item, i) => (
                <InfoRow key={i} label={`${item.block} @ Rs.${item.rate}`} value={formatCurrency(item.amount)} />
              ))}
              <Divider />
              <InfoRow label="Energy Charge" value={formatCurrency(tariffDetails.energy_charge)} />
              <InfoRow label="Fixed Charge" value={formatCurrency(tariffDetails.fixed_charge)} />
              <InfoRow label="SSCL Tax (2.565%)" value={formatCurrency(tariffDetails.sscl)} />
              <InfoRow label="Total" value={formatCurrency(tariffDetails.total)} valueColor={COLORS.success} />
            </Card>
          )}
        </>
      )}

      {/* Budget Plan Section */}
      <SectionHeader title="Create Budget Plan" />

      {applianceCount < 5 && (
        <Card style={styles.warningCard} accentColor={COLORS.warning}>
          <Text style={styles.warningTitle}>⚠️ Add More Appliances</Text>
          <Text style={styles.warningText}>
            You need at least 5 appliances to create a budget plan.{'\n'}
            Current: {applianceCount} appliance{applianceCount !== 1 ? 's' : ''} · Need {Math.max(0, 5 - applianceCount)} more
          </Text>
          <SecondaryButton
            label="Add Appliances →"
            onPress={() => navigation.navigate('Appliances')}
            color={COLORS.warning}
            style={{ marginTop: SPACING.md }}
          />
        </Card>
      )}

      {budgetRecs?.recommendations && budgetRecs.recommendations.map((rec, i) => {
        if (rec.type === 'budget_options') {
          return (
            <Card key={i}>
              <Text style={styles.cardTitle}>💰 Suggested Budgets</Text>
              {rec.options?.map((opt, j) => (
                <TouchableOpacity
                  key={j}
                  style={styles.budgetOption}
                  onPress={() => {
                    setTargetBudget(opt.budget.toString());
                    setShowPlanForm(true);
                  }}
                >
                  <View>
                    <Text style={styles.budgetLevel}>{opt.level.charAt(0).toUpperCase() + opt.level.slice(1)}</Text>
                    <Text style={styles.budgetDiff}>{opt.reduction} reduction · {opt.difficulty}</Text>
                  </View>
                  <Text style={styles.budgetAmount}>{formatCurrency(opt.budget, 0)}</Text>
                </TouchableOpacity>
              ))}
            </Card>
          );
        }
        return null;
      })}

      {!showPlanForm ? (
        <PrimaryButton
          label="🎯 Create Custom Budget Plan"
          onPress={() => setShowPlanForm(true)}
          disabled={applianceCount < 5}
        />
      ) : (
        <Card>
          <Text style={styles.cardTitle}>Set Your Budget Plan</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Target Budget (Rs.)</Text>
            <View style={styles.inputRow}>
              <Text style={styles.rsPrefix}>Rs.</Text>
              <TextInput
                style={styles.budgetInput}
                value={targetBudget}
                onChangeText={(v) => setTargetBudget(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <Text style={styles.inputHint}>
              Allowed: Rs. {Math.round(budgetRecs?.current_cost * 0.5 || 0)} - Rs. {Math.round(budgetRecs?.current_cost * 1.5 || 0)} (50%-150%)
            </Text>
          </View>

          <View style={[styles.inputContainer, { marginTop: SPACING.lg }]}>
            <Text style={styles.inputLabel}>Planning Days</Text>
            <View style={styles.daysRow}>
              {['28', '29', '30', '31', '32'].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayBtn, planningDays === d && styles.dayBtnActive]}
                  onPress={() => setPlanningDays(d)}
                >
                  <Text style={[styles.dayBtnText, planningDays === d && styles.dayBtnTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.inputRow, { marginTop: SPACING.md }]}>
              <Text style={styles.rsPrefix}>Custom:</Text>
              <TextInput
                style={styles.budgetInput}
                value={!['28', '29', '30', '31', '32'].includes(planningDays) ? planningDays : ''}
                onChangeText={(v) => setPlanningDays(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="10 - 60 days"
                placeholderTextColor={COLORS.textMuted}
              />
              <Text style={styles.rsSuffix}>days</Text>
            </View>
          </View>

          <View style={styles.planBtns}>
            <SecondaryButton label="Cancel" onPress={() => setShowPlanForm(false)} color={COLORS.textSecondary} style={{ flex: 1 }} />
            <View style={{ width: SPACING.md }} />
            <PrimaryButton
              label="Create Plan"
              onPress={createPlan}
              loading={creatingPlan}
              disabled={creatingPlan || applianceCount < 5}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      )}

      <View style={{ height: SPACING.xxxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg1, padding: SPACING.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg1 },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.md },
  overviewCard: {},
  overviewTitle: { color: COLORS.textPrimary, fontSize: 18, ...FONTS.semiBold, marginBottom: SPACING.md },
  statsRow: { flexDirection: 'row', marginBottom: SPACING.md },
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, ...FONTS.semiBold, marginBottom: SPACING.md },
  warningCard: {},
  warningTitle: { color: COLORS.warning, fontSize: 15, ...FONTS.semiBold, marginBottom: SPACING.sm },
  warningText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  budgetOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  budgetLevel: { color: COLORS.textPrimary, fontSize: 15, ...FONTS.medium },
  budgetDiff: { color: COLORS.textMuted, fontSize: 12 },
  budgetAmount: { color: COLORS.success, fontSize: 17, ...FONTS.bold },
  inputLabel: { color: COLORS.textSecondary, fontSize: 13, ...FONTS.medium, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg3,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rsPrefix: { color: COLORS.textSecondary, marginRight: SPACING.sm },
  budgetInput: { color: COLORS.textPrimary, fontSize: 16, flex: 1 },
  daysRow: { flexDirection: 'row', gap: SPACING.sm },
  dayBtn: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  dayBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayBtnText: { color: COLORS.textSecondary, ...FONTS.medium },
  dayBtnTextActive: { color: '#fff' },
  inputContainer: { marginBottom: SPACING.sm },
  inputHint: { color: COLORS.textMuted, fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  rsSuffix: { color: COLORS.textSecondary, marginLeft: SPACING.sm },
  planBtns: { flexDirection: 'row', marginTop: SPACING.lg },
});

export default BillDetailScreen;