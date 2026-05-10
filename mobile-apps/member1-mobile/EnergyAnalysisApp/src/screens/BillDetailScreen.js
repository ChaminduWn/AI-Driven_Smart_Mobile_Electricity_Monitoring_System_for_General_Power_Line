import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, TextInput, Platform, Modal,
} from 'react-native';
import { analysisAPI } from '../api/analysisAPI';
import { billsAPI } from '../api/billsAPI';
import { appliancesAPI } from '../api/appliancesAPI';
import {
  Card, SectionHeader, InfoRow, Divider, PrimaryButton, SecondaryButton,
  StatCard, ProgressBar, StatusModal,
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
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetDate, setTargetDate] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTitle, setRenameTitle] = useState('');
  const [submittingRename, setSubmittingRename] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [applianceCount, setApplianceCount] = useState(0);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [statusModal, setStatusModal] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    confirmLabel: 'OK',
    onConfirm: () => {},
  });

  const id = billId || bill?.id;

  const handleRename = async () => {
    if (!renameTitle) return;
    setSubmittingRename(true);
    try {
      await billsAPI.update(id, { title: renameTitle });
      setBill({ ...bill, title: renameTitle });
      setStatusModal({
        visible: true,
        type: 'success',
        title: 'Success',
        message: 'Bill renamed successfully.',
        onConfirm: () => setStatusModal(prev => ({ ...prev, visible: false }))
      });
      setShowRenameModal(false);
    } catch (err) {
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to rename bill.',
        onConfirm: () => setStatusModal(prev => ({ ...prev, visible: false }))
      });
    } finally {
      setSubmittingRename(false);
    }
  };

  const openRenameModal = () => {
    setRenameTitle(bill?.title || '');
    setShowRenameModal(true);
  };

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
            const [appRes, plansRes] = await Promise.all([
              appliancesAPI.getByAccount(acct),
              analysisAPI.getPlansByAccount(acct, true)
            ]);
            setApplianceCount(appRes.data?.count || 0);
            const activePlans = plansRes.data?.plans || [];
            if (activePlans.length > 0) {
              setHasActivePlan(true);
              setActivePlan(activePlans[0]);
            } else {
              setHasActivePlan(false);
              setActivePlan(null);
            }
          } catch (_) { }
        }
      } catch (err) {
        console.error('Bill detail error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Sync planningDays -> targetDate based on startDate
  useEffect(() => {
    const days = parseInt(planningDays);
    if (!isNaN(days) && days > 0 && startDate) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + days);
      setTargetDate(d.toISOString().split('T')[0]);
    }
  }, [planningDays, startDate]);

  const handleStartDateChange = (dateStr) => {
    if (!dateStr) return;
    setStartDate(dateStr);
  };

  const handleDateChange = (dateStr) => {
    if (!dateStr) return;
    setTargetDate(dateStr);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0) {
      setPlanningDays(diffDays.toString());
    }
  };

  const now = new Date();
  const todayStr = now.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const createPlan = async () => {
    if (applianceCount < 5) {
      setStatusModal({
        visible: true,
        type: 'warning',
        title: '⚠️ Appliances Required',
        message: `You need at least 5 appliances registered to create a budget plan.\n\nYou currently have ${applianceCount}. Add ${5 - applianceCount} more in the Appliances tab.`,
        confirmLabel: 'Add Appliances',
        cancelLabel: 'Cancel',
        onConfirm: () => {
          setStatusModal(prev => ({ ...prev, visible: false }));
          navigation.navigate('Appliances');
        },
        onCancel: () => setStatusModal(prev => ({ ...prev, visible: false }))
      });
      return;
    }

    const budgetVal = parseFloat(targetBudget);
    const daysVal = parseInt(planningDays);
    const prevCost = budgetRecs?.current_cost || 0;

    if (!targetBudget || isNaN(budgetVal)) {
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'Invalid Budget',
        message: 'Please enter a valid target budget amount.',
        onConfirm: () => setStatusModal(prev => ({ ...prev, visible: false }))
      });
      return;
    }

    // Days Validation: 10 - 60
    if (isNaN(daysVal) || daysVal < 10 || daysVal > 60) {
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'Invalid Period',
        message: 'Planning period must be between 10 and 60 days for effective tracking.',
        onConfirm: () => setStatusModal(prev => ({ ...prev, visible: false }))
      });
      return;
    }

    // Dynamic Validation: 50% - 150%
    const minB = prevCost * 0.5;
    const maxB = prevCost * 1.5;
    const isExtreme = budgetVal < minB || budgetVal > maxB;

    const proceedWithCreation = async () => {
      setCreatingPlan(true);
      try {
        const planStartDateISO = new Date(startDate).toISOString();
        const res = await analysisAPI.createBudgetPlan(id, budgetVal, daysVal, planStartDateISO);
        if (res.data.success) {
          setStatusModal({
            visible: true,
            type: 'success',
            title: '✅ Plan Created!',
            message: `Plan ID: ${res.data.plan_id}\nTrack your meter readings to monitor progress and stay within budget.`,
            confirmLabel: 'Start Tracking',
            cancelLabel: 'Later',
            onConfirm: () => {
              setStatusModal(prev => ({ ...prev, visible: false }));
              navigation.navigate('Tracking');
            },
            onCancel: () => {
              setStatusModal(prev => ({ ...prev, visible: false }));
              setShowPlanForm(false);
              setHasActivePlan(true);
            }
          });
        }
      } catch (err) {
        const msg = err.response?.data?.detail || 'Failed to create plan.';
        setStatusModal({
          visible: true,
          type: 'error',
          title: 'Creation Failed',
          message: msg,
          onConfirm: () => setStatusModal(prev => ({ ...prev, visible: false }))
        });
      } finally {
        setCreatingPlan(false);
      }
    };

    if (isExtreme || hasActivePlan) {
      let title = "⚠️ Attention Required";
      let msg = "";
      let type = 'warning';
      
      if (isExtreme && hasActivePlan) {
        msg = `You already have an active plan for this account which will be replaced. Also, your target budget (Rs. ${budgetVal}) is outside the recommended range (Rs. ${Math.round(minB)} - ${Math.round(maxB)}).\n\nDo you want to proceed anyway?`;
      } else if (isExtreme) {
        msg = `Your target budget (Rs. ${budgetVal}) is ${budgetVal < minB ? 'very low' : 'very high'} compared to your previous bill. We recommend staying between Rs. ${Math.round(minB)} and Rs. ${Math.round(maxB)} for the most accurate tracking.\n\nProceed anyway?`;
      } else {
        msg = `You already have an active budget plan for this account. Creating a new one will automatically end the current one so you can start fresh.\n\nDo you want to replace it?`;
        type = 'confirm';
      }

      setStatusModal({
        visible: true,
        type,
        title,
        message: msg,
        confirmLabel: isExtreme ? 'Proceed Anyway' : 'Replace Plan',
        cancelLabel: 'Go Back',
        onConfirm: () => {
          setStatusModal(prev => ({ ...prev, visible: false }));
          proceedWithCreation();
        },
        onCancel: () => setStatusModal(prev => ({ ...prev, visible: false }))
      });
      return;
    }

    // Normal path
    proceedWithCreation();
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
        <View style={styles.rowBetween}>
          <Text style={styles.overviewTitle}>{currentBill?.title || 'Bill Overview'}</Text>
          <TouchableOpacity onPress={openRenameModal}>
            <Text style={styles.editBtn}>Edit Name</Text>
          </TouchableOpacity>
        </View>
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

      {/* Rename Modal */}
      <Modal visible={showRenameModal} animationType="fade" transparent>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowRenameModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename Bill</Text>
            <TextInput
              style={styles.modalInput}
              value={renameTitle}
              onChangeText={setRenameTitle}
              placeholder="e.g. Feb 2024 Bill"
              placeholderTextColor={COLORS.textMuted}
            />
            <View style={styles.modalBtns}>
              <SecondaryButton label="Cancel" onPress={() => setShowRenameModal(false)} style={{ flex: 1 }} />
              <View style={{ width: SPACING.md }} />
              <PrimaryButton label="Save" onPress={handleRename} loading={submittingRename} style={{ flex: 1 }} />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
      <SectionHeader title="Budget Planning" />

      {hasActivePlan && activePlan && (
        <Card style={styles.activePlanCard} accentColor={COLORS.success}>
          <View style={styles.rowBetween}>
            <Text style={styles.activePlanTitle}>✅ Active Plan Found</Text>
            <View style={styles.activeTag}>
              <Text style={styles.activeTagText}>TRACKING</Text>
            </View>
          </View>
          <Text style={styles.activePlanText}>
            You already have an active {activePlan.planning_days}-day budget plan for this account.
          </Text>
          <View style={styles.activePlanStats}>
            <View>
              <Text style={styles.activePlanLabel}>Target</Text>
              <Text style={styles.activePlanVal}>{formatCurrency(activePlan.target_budget)}</Text>
            </View>
            <View>
              <Text style={styles.activePlanLabel}>Ends On</Text>
              <Text style={styles.activePlanVal}>{formatDate(activePlan.plan_end_date)}</Text>
            </View>
          </View>
          <PrimaryButton
            label="View Progress Tracking →"
            onPress={() => navigation.navigate('Tracking')}
            style={{ marginTop: SPACING.md }}
          />
          <Text style={styles.activePlanNote}>
            Need to start fresh? You can create a new plan below to replace this one.
          </Text>
        </Card>
      )}

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
          <View style={styles.formHeader}>
            <Text style={styles.cardTitle}>Set Your Budget Plan</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Plan Start Date</Text>
            <View style={styles.inputRow}>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  style={{
                    flex: 1, backgroundColor: 'transparent', border: 'none',
                    color: COLORS.textPrimary, fontSize: '16px', outline: 'none', cursor: 'pointer'
                  }}
                />
              ) : (
                <TextInput
                  style={styles.budgetInput}
                  value={startDate}
                  onChangeText={handleStartDateChange}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textMuted}
                />
              )}
            </View>
          </View>

          <View style={[styles.inputContainer, { marginTop: SPACING.lg }]}>
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
              💡 Recommended Range: Rs. {Math.round(budgetRecs?.current_cost * 0.5 || 0)} - {Math.round(budgetRecs?.current_cost * 1.5 || 0)} (50%-150% of last bill)
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

          <View style={[styles.inputContainer, { marginTop: SPACING.lg }]}>
            <Text style={styles.inputLabel}>Select Expiry Date (End Date)</Text>
            <View style={styles.inputRow}>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: COLORS.textPrimary,
                    fontSize: '16px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              ) : (
                <TextInput
                  style={styles.budgetInput}
                  value={targetDate}
                  onChangeText={handleDateChange}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textMuted}
                />
              )}
            </View>
            <Text style={styles.expiryNote}>
              Plan expires on: <Text style={styles.expiryDate}>{formatDate(targetDate)}</Text>
            </Text>
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

      <StatusModal
        visible={statusModal.visible}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        confirmLabel={statusModal.confirmLabel}
        cancelLabel={statusModal.cancelLabel}
        onConfirm={statusModal.onConfirm}
        onCancel={statusModal.onCancel}
        loading={creatingPlan}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  activePlanCard: { borderLeftWidth: 4, borderLeftColor: COLORS.success },
  activePlanTitle: { color: COLORS.success, fontSize: 16, ...FONTS.bold },
  activeTag: { backgroundColor: 'rgba(76, 175, 80, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  activeTagText: { color: COLORS.success, fontSize: 10, ...FONTS.bold },
  activePlanText: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  activePlanStats: { flexDirection: 'row', gap: 40, marginTop: SPACING.md, padding: SPACING.md, backgroundColor: COLORS.bg3, borderRadius: RADIUS.md },
  activePlanLabel: { color: COLORS.textMuted, fontSize: 11, textTransform: 'uppercase' },
  activePlanVal: { color: COLORS.textPrimary, fontSize: 15, ...FONTS.semiBold },
  activePlanNote: { color: COLORS.textMuted, fontSize: 12, marginTop: SPACING.md, textAlign: 'center', fontStyle: 'italic' },
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
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  todayBox: { alignItems: 'flex-end' },
  todayLabel: { color: COLORS.primary, fontSize: 10, ...FONTS.bold, textTransform: 'uppercase' },
  todayText: { color: COLORS.textPrimary, fontSize: 13, ...FONTS.medium },
  timeText: { color: COLORS.textSecondary, fontSize: 11 },
  expiryNote: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  expiryDate: { color: COLORS.primary, ...FONTS.bold, fontStyle: 'normal' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  editBtn: { color: COLORS.primary, fontSize: 13, ...FONTS.medium },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: COLORS.bg2, width: '85%', borderRadius: RADIUS.lg, padding: SPACING.xl },
  modalTitle: { color: COLORS.textPrimary, fontSize: 18, ...FONTS.bold, marginBottom: SPACING.md, textAlign: 'center' },
  modalInput: { backgroundColor: COLORS.bg3, color: COLORS.textPrimary, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  modalBtns: { flexDirection: 'row' },
});

export default BillDetailScreen;