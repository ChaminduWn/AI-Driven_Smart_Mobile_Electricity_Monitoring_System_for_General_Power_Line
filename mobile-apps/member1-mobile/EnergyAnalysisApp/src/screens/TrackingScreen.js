import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, RefreshControl, TouchableOpacity,
  Modal, TextInput, FlatList, Platform,
} from 'react-native';
import { analysisAPI } from '../api/analysisAPI';
import { useAccount } from '../contexts/AccountContext';
import {
  Card, SectionHeader, EmptyState, LoadingScreen, PrimaryButton, SecondaryButton,
  InfoRow, Divider, Badge, ProgressBar, StatCard,
} from '../components/SharedComponents';
import { COLORS, SPACING, RADIUS, FONTS, SHADOW } from '../utils/theme';
import {
  formatCurrency, formatDate, getStatusColor, getStatusLabel, getPriorityColor,
} from '../utils/helpers';

const TrackingScreen = ({ navigation }) => {
  const { selectedAccount } = useAccount();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [readingInput, setReadingInput] = useState('');
  const [notes, setNotes] = useState('');
  const [latestProgress, setLatestProgress] = useState(null);
  const [editingReading, setEditingReading] = useState(null);
  const [readingDate, setReadingDate] = useState('');
  const [readingTime, setReadingTime] = useState('');
  const [activeTab, setActiveTab] = useState('status'); // 'status' or 'analysis'

  const account = selectedAccount;

  const fetchData = useCallback(async () => {
    if (!account) { setLoading(false); return; }
    try {
      const plansRes = await analysisAPI.getPlansByAccount(account, true);
      const planList = plansRes.data?.plans || [];
      setPlans(planList);

      const activePlan = planList[0] || null;
      setSelectedPlan(activePlan);

      if (activePlan) {
        const readRes = await analysisAPI.getPlanReadings(activePlan.id);
        const readList = (readRes.data?.readings || []).sort(
          (a, b) => new Date(b.reading_date) - new Date(a.reading_date),
        );
        setReadings(readList);
        setLatestProgress(readList[0] || null);
      }
    } catch (err) {
      console.error('Tracking fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [account]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (reading = null) => {
    const now = new Date();
    const dStr = now.toISOString().split('T')[0];
    const tStr = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    if (reading) {
      setEditingReading(reading);
      setReadingInput(reading.reading_value.toString());
      setNotes(reading.notes || '');
      // If reading has date/time, parse them
      const rDate = new Date(reading.reading_date);
      setReadingDate(rDate.toISOString().split('T')[0]);
      setReadingTime(rDate.toTimeString().split(' ')[0].substring(0, 5));
    } else {
      setEditingReading(null);
      setReadingInput('');
      setNotes('');
      setReadingDate(dStr);
      setReadingTime(tStr);
    }
    setShowReadingModal(true);
  };

  const submitReading = async () => {
    const val = parseInt(readingInput);
    if (!val || isNaN(val) || val < 0) {
      Alert.alert('Invalid', 'Enter a valid meter reading.');
      return;
    }
    if (!selectedPlan) {
      Alert.alert('No Plan', 'No active budget plan found.');
      return;
    }

    // Validate reading is >= start reading
    const startReading = selectedPlan?.reference_bill_current_reading;
    if (startReading && val < startReading) {
      Alert.alert('Invalid Reading', `Reading must be >= ${startReading} (your meter start value).`);
      return;
    }

    setSubmitting(true);
    try {
      // Combine date and time
      const combinedDate = new Date(`${readingDate}T${readingTime}:00`).toISOString();

      let res;
      if (editingReading) {
        // UPDATE EXISTING
        res = await analysisAPI.updateReading(editingReading.id, {
          reading_value: val,
          reading_date: combinedDate,
          notes: notes || null,
        });
      } else {
        // CREATE NEW
        res = await analysisAPI.trackProgress(
          selectedPlan.id,
          val,
          combinedDate,
          notes || null,
        );
      }

      if (res.data.success) {
        // REFRESH DATA IMMEDIATELY
        await fetchData();

        const progress = res.data.progress || res.data.reading?.analysis_data;
        const status = progress?.current_status?.status || res.data.reading?.status;

        // Alert based on status
        let alertTitle = editingReading ? '✅ Reading Updated' : '✅ Reading Recorded';
        let alertMsg = '';

        if (status === 'over_budget') {
          alertTitle = '⚠️ Over Budget Alert!';
          alertMsg = `You're over your daily target.\n\nVariance: +${formatCurrency(progress.current_status?.variance_cost || 0)}\n\nProjected total: ${formatCurrency(progress.projection?.projected_total_cost || 0)}`;
        } else if (status === 'under_budget') {
          alertTitle = '🎉 Great Progress!';
          alertMsg = `You're under budget!\nProjected savings: ${formatCurrency(Math.abs(progress.projection?.budget_variance || 0))}`;
        } else {
          alertMsg = `Status: On Track ✓\nDays elapsed: ${progress.current_status?.days_elapsed}\nUnits used: ${progress.current_status?.units_used} kWh`;
        }

        if (Platform.OS === 'web') {
          alert(`${alertTitle}\n\n${alertMsg}`);
        } else {
          Alert.alert(alertTitle, alertMsg);
        }
        setShowReadingModal(false);
        setEditingReading(null);
        setReadingInput('');
        setNotes('');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to record reading.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReading = (readingId) => {
    const msg = 'Remove this meter reading?';

    if (Platform.OS === 'web') {
      if (window.confirm(msg)) {
        (async () => {
          try {
            await analysisAPI.deleteReading(readingId);
            await fetchData();
          } catch { alert('Error: Could not delete reading.'); }
        })();
      }
      return;
    }

    Alert.alert('Delete Reading', msg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await analysisAPI.deleteReading(readingId);
            await fetchData();
          } catch (err) {
            console.error('Delete error:', err);
            Alert.alert('Error', 'Could not delete reading.');
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen message="Loading tracking data..." />;

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.primary} />}
      >
        {plans.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="No Active Budget Plan"
            subtitle="Create a budget plan from a bill analysis to start tracking."
            action={() => navigation.navigate('Bills')}
            actionLabel="View Bills"
          />
        ) : (
          <>
            {/* Tab Switcher */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'status' && styles.tabBtnActive]}
                onPress={() => setActiveTab('status')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'status' && styles.tabBtnTextActive]}>Status</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'analysis' && styles.tabBtnActive]}
                onPress={() => setActiveTab('analysis')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'analysis' && styles.tabBtnTextActive]}>Analysis</Text>
              </TouchableOpacity>
            </View>

            {selectedPlan && (
              <>
                {activeTab === 'status' ? (
                  <>
                    {/* Plan Overview */}
                    <Card style={[styles.planCard, { borderTopColor: getStatusColor(selectedPlan.progress_status) }]}>
                      <View style={styles.planHeader}>
                        <View>
                          <Text style={styles.planBudget}>{formatCurrency(selectedPlan.target_budget)}</Text>
                          <Text style={styles.planLabel}>Target Budget</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedPlan.progress_status) + '22' }]}>
                          <Text style={[styles.statusText, { color: getStatusColor(selectedPlan.progress_status) }]}>
                            {getStatusLabel(selectedPlan.progress_status)}
                          </Text>
                        </View>
                      </View>
                      <Divider />
                      <View style={styles.planMeta}>
                        <MetaItem icon="📅" label={`${selectedPlan.planning_days} days`} />
                        <MetaItem icon="🔋" label={`${selectedPlan.target_daily_units?.toFixed(1)} kWh/day`} />
                        <MetaItem icon="💰" label={`Rs.${selectedPlan.target_daily_cost?.toFixed(0)}/day`} />
                      </View>
                      <Divider />
                      <View style={styles.timelineArea}>
                        <Text style={styles.timelineLabel}>Plan Timeline</Text>
                        <View style={styles.timelineRow}>
                          <View style={styles.timelineNode}>
                            <Text style={styles.timelineDate}>{formatDate(selectedPlan.plan_start_date)}</Text>
                            <Text style={styles.timelineNote}>Started</Text>
                          </View>
                          <View style={styles.timelineBar} />
                          <View style={styles.timelineNode}>
                            <Text style={styles.timelineDate}>{formatDate(selectedPlan.plan_end_date)}</Text>
                            <Text style={styles.timelineNote}>Estimated Finish</Text>
                          </View>
                        </View>
                      </View>
                    </Card>

                    {/* Latest Progress */}
                    {latestProgress && (
                      <>
                        <SectionHeader title="Current Status" />
                        <ProgressCard reading={latestProgress} plan={selectedPlan} />

                        {/* Weekly Status */}
                        {latestProgress?.analysis_data?.weekly_status && (
                          <WeeklyStatusCard ws={latestProgress.analysis_data.weekly_status} />
                        )}
                      </>
                    )}

                    {/* Reading History */}
                    <SectionHeader title={`Readings (${readings.length}/8)`} action={() => openModal()} actionLabel="+ Add" />

                    {/* Starting Reference Reading */}
                    {selectedPlan.reference_bill_current_reading !== null && (
                      <View style={[styles.readingCard, styles.startReadingCard]}>
                        <View style={styles.readingLeft}>
                          <Text style={styles.readingDate}>{formatDate(selectedPlan.reference_bill_date)}</Text>
                          <Text style={styles.readingValue}>{selectedPlan.reference_bill_current_reading} kWh</Text>
                        </View>
                        <View style={styles.readingMid}>
                          <Text style={styles.readingUnits}>Starting Reference</Text>
                          <Text style={[styles.readingStatus, { color: COLORS.textMuted }]}>Reference Point</Text>
                        </View>
                        <View style={styles.readingRight}>
                          <Text style={styles.readingCost}>Rs. 0.00</Text>
                          <View style={styles.actionRow}>
                            <View style={styles.actionBtn}><Text style={styles.actionIcon}>📌</Text></View>
                          </View>
                        </View>
                      </View>
                    )}

                    {readings.length === 0 ? (
                      <Card style={{ marginTop: 0 }}>
                        <Text style={styles.noReadings}>No progress readings yet. Add your current meter reading to start tracking.</Text>
                      </Card>
                    ) : (
                      readings.map((r) => (
                        <ReadingCard
                          key={r.id}
                          reading={r}
                          onEdit={() => openModal(r)}
                          onDelete={() => deleteReading(r.id)}
                        />
                      ))
                    )}
                  </>
                ) : (
                  <AnalysisTab readings={readings} plan={selectedPlan} />
                )}
              </>
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      {selectedPlan && (
        <View style={styles.fabArea}>
          <PrimaryButton
            label="📱 Submit Meter Reading"
            onPress={() => openModal()}
            disabled={readings.length >= 8}
          />
          {readings.length >= 8 && (
            <Text style={styles.maxReached}>Max 8 readings per plan reached</Text>
          )}
        </View>
      )}

      {/* Reading Modal */}
      <Modal visible={showReadingModal} animationType="slide" transparent onRequestClose={() => setShowReadingModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowReadingModal(false)}>
          <TouchableOpacity style={styles.bottomSheet} activeOpacity={1}>
            <Text style={styles.sheetTitle}>{editingReading ? 'Edit Reading' : 'Submit Meter Reading'}</Text>

            {selectedPlan?.reference_bill_current_reading && (
              <Text style={styles.sheetHint}>
                Start reading: {selectedPlan.reference_bill_current_reading} · Enter current reading below
              </Text>
            )}

            <TextInput
              style={styles.bigInput}
              value={readingInput}
              onChangeText={setReadingInput}
              placeholder="Current meter reading (e.g. 17250)"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />

            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeField}>
                <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.smallInput}
                  value={readingDate}
                  onChangeText={setReadingDate}
                  placeholder="2024-03-08"
                />
              </View>
              <View style={styles.dateTimeField}>
                <Text style={styles.fieldLabel}>Time (HH:MM)</Text>
                <TextInput
                  style={styles.smallInput}
                  value={readingTime}
                  onChangeText={setReadingTime}
                  placeholder="14:30"
                />
              </View>
            </View>

            <TextInput
              style={[styles.bigInput, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes (optional)"
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={2}
            />

            <PrimaryButton
              label={editingReading ? 'Update Reading' : 'Submit Reading'}
              onPress={submitReading}
              loading={submitting}
              disabled={submitting || !readingInput}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View >
  );
};

const MetaItem = ({ icon, label }) => (
  <View style={styles.metaItem}>
    <Text style={styles.metaIcon}>{icon}</Text>
    <Text style={styles.metaLabel}>{label}</Text>
  </View>
);

const ProgressCard = ({ reading, plan }) => {
  const actualVal = reading.actual_cost_so_far || 0;
  const targetVal = plan.target_budget || 1;
  const pct = actualVal / targetVal;
  const statusColor = getStatusColor(reading.status);
  return (
    <Card style={[styles.progressCard, { borderLeftColor: statusColor }]}>
      <View style={styles.progressRow}>
        <View>
          <Text style={styles.progressCost}>{formatCurrency(actualVal)}</Text>
          <Text style={styles.progressLabel}>Spent so far</Text>
        </View>
        <View>
          <Text style={styles.progressExpected}>{formatCurrency(reading.expected_cost_so_far)}</Text>
          <Text style={styles.progressLabel}>Expected</Text>
        </View>
        <View>
          <Text style={[styles.progressVariance, { color: reading.variance_cost > 0 ? COLORS.danger : COLORS.success }]}>
            {reading.variance_cost > 0 ? '+' : ''}{formatCurrency(reading.variance_cost)}
          </Text>
          <Text style={styles.progressLabel}>Variance</Text>
        </View>
      </View>
      <ProgressBar progress={Math.min(pct, 1)} color={statusColor} style={{ marginTop: SPACING.md }} />
      <Text style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 4 }}>
        {reading.days_elapsed} days elapsed · {reading.units_consumed_so_far} kWh used · Projected: {formatCurrency(reading.projected_total_cost)}
      </Text>
    </Card>
  );
};

const RecommendationCard = ({ rec }) => (
  <Card style={styles.recCard} accentColor={COLORS.warning}>
    <View style={styles.recHeader}>
      <Text style={styles.recApp}>⚡ {rec.appliance_name}</Text>
      <Text style={styles.recImpact}>{rec.impact_percentage}% of use</Text>
    </View>
    <Text style={styles.recTip}>{rec.actionable_tip}</Text>
    <View style={styles.recStats}>
      <Text style={styles.recStat}>🔋 Save {rec.suggested_reduction_kwh} kWh/day</Text>
      <Text style={styles.recStat}>💰 ~{formatCurrency(rec.potential_monthly_saving, 0)}/mo</Text>
    </View>
  </Card>
);

const WeeklyStatusCard = ({ ws }) => (
  <Card style={styles.weekCard} accentColor={ws.exceeded ? COLORS.danger : COLORS.success}>
    <Text style={styles.weekTitle}>Week {ws.week_number} Status</Text>
    <InfoRow label="Target Units" value={`${ws.target_cumulative_units?.toFixed(1)} kWh`} />
    <InfoRow label="Actual Units" value={`${ws.actual_units?.toFixed(1)} kWh`} valueColor={ws.exceeded ? COLORS.danger : COLORS.success} />
    {ws.exceeded && (
      <Text style={styles.weekWarn}>⚠️ Weekly target exceeded! Reduce consumption in remaining days.</Text>
    )}
  </Card>
);

const ReadingCard = ({ reading, onEdit, onDelete }) => (
  <View style={styles.readingCard}>
    <View style={styles.readingLeft}>
      <Text style={styles.readingDate}>{formatDate(reading.reading_date)}</Text>
      <Text style={styles.readingValue}>{reading.reading_value} kWh</Text>
    </View>
    <View style={styles.readingMid}>
      <Text style={styles.readingUnits}>{reading.units_consumed_so_far} consumed</Text>
      <Text style={[styles.readingStatus, { color: getStatusColor(reading.status) }]}>
        {getStatusLabel(reading.status)}
      </Text>
    </View>
    <View style={styles.readingRight}>
      <Text style={styles.readingCost}>{formatCurrency(reading.actual_cost_so_far)}</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg1 },
  container: { flex: 1, padding: SPACING.lg },
  planChips: { marginBottom: SPACING.md },
  planChip: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    marginRight: SPACING.sm, backgroundColor: COLORS.bg2,
  },
  planChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  planChipText: { color: COLORS.textSecondary, fontSize: 13 },
  planChipTextActive: { color: '#fff' },
  planCard: { marginBottom: SPACING.md, borderTopWidth: 3 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planBudget: { color: COLORS.textPrimary, fontSize: 22, ...FONTS.bold },
  planLabel: { color: COLORS.textSecondary, fontSize: 12 },
  statusBadge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
  statusText: { fontSize: 12, ...FONTS.semiBold },
  planMeta: { flexDirection: 'row', justifyContent: 'space-around' },
  metaItem: { alignItems: 'center' },
  metaIcon: { fontSize: 18, marginBottom: 2 },
  metaLabel: { color: COLORS.textSecondary, fontSize: 12 },
  progressCard: {},
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  progressCost: { color: COLORS.textPrimary, fontSize: 18, ...FONTS.bold },
  progressExpected: { color: COLORS.textSecondary, fontSize: 16, ...FONTS.medium },
  progressVariance: { fontSize: 16, ...FONTS.bold },
  progressLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  recCard: {},
  recHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  recApp: { color: COLORS.textPrimary, fontSize: 15, ...FONTS.semiBold },
  recImpact: { color: COLORS.warning, fontSize: 13 },
  recTip: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: SPACING.sm },
  recStats: { flexDirection: 'row', gap: SPACING.lg },
  recStat: { color: COLORS.success, fontSize: 13, ...FONTS.medium },
  weekCard: {},
  weekTitle: { color: COLORS.textPrimary, fontSize: 15, ...FONTS.semiBold, marginBottom: SPACING.sm },
  weekWarn: { color: COLORS.danger, fontSize: 13, marginTop: SPACING.sm },
  noReadings: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', paddingVertical: SPACING.md },
  readingCard: {
    backgroundColor: COLORS.bg2, borderRadius: RADIUS.md, padding: SPACING.md,
    marginBottom: SPACING.sm, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  readingLeft: { flex: 1 },
  readingDate: { color: COLORS.textMuted, fontSize: 11 },
  readingValue: { color: COLORS.textPrimary, fontSize: 16, ...FONTS.semiBold },
  readingMid: { flex: 1, alignItems: 'center' },
  readingUnits: { color: COLORS.textSecondary, fontSize: 12 },
  readingStatus: { fontSize: 12, ...FONTS.medium, marginTop: 2 },
  readingRight: { alignItems: 'flex-end', gap: SPACING.xs },
  readingCost: { color: COLORS.success, fontSize: 14, ...FONTS.semiBold },
  deleteBtn: { fontSize: 16 },
  fabArea: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: SPACING.lg, backgroundColor: COLORS.bg1,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  maxReached: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: SPACING.xs },
  actionRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: 4 },
  actionBtn: { padding: 4 },
  actionIcon: { fontSize: 16 },
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: COLORS.bg2, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl, paddingBottom: SPACING.xxxl,
    ...SHADOW.lg,
  },
  sheetTitle: { color: COLORS.textPrimary, fontSize: 20, ...FONTS.bold, marginBottom: SPACING.sm, textAlign: 'center' },
  sheetHint: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: SPACING.lg },
  bigInput: {
    backgroundColor: COLORS.bg3, color: COLORS.textPrimary,
    borderRadius: RADIUS.md, padding: SPACING.lg, fontSize: 20,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md,
    textAlign: 'center', ...FONTS.bold,
  },
  notesInput: { fontSize: 14, ...FONTS.regular, textAlign: 'left' },
  timelineArea: { marginTop: SPACING.md },
  timelineLabel: { color: COLORS.textMuted, fontSize: 11, marginBottom: SPACING.sm, textAlign: 'center' },
  timelineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timelineNode: { alignItems: 'center', flex: 1 },
  timelineDate: { color: COLORS.textPrimary, fontSize: 12, ...FONTS.semiBold },
  timelineNote: { color: COLORS.textMuted, fontSize: 10 },
  timelineBar: { height: 2, flex: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.xs },
  startReadingCard: { borderStyle: 'dashed', opacity: 0.8 },
  dateTimeRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  dateTimeField: { flex: 1 },
  fieldLabel: { color: COLORS.textSecondary, fontSize: 11, marginBottom: 4 },
  smallInput: {
    backgroundColor: COLORS.bg3, color: COLORS.textPrimary,
    borderRadius: RADIUS.md, padding: SPACING.sm, fontSize: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tabBar: {
    flexDirection: 'row', backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.lg, padding: 4, marginBottom: SPACING.md,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: RADIUS.md },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabBtnText: { color: COLORS.textSecondary, fontSize: 14, ...FONTS.medium },
  tabBtnTextActive: { color: '#fff' },
  analysisCard: { padding: SPACING.lg },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
  chartTitle: { color: COLORS.textPrimary, fontSize: 15, ...FONTS.semiBold },
  chartLegend: { flexDirection: 'row', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: COLORS.textMuted, fontSize: 11 },
  chartContainer: { alignItems: 'center' },
});

// ─── ANALYSIS TAB ─────────────────────────────────────────────────────────────
const AnalysisTab = ({ readings, plan }) => {
  const chartData = readings.length > 0 ? [...readings].reverse().map(r => ({
    x: r.days_elapsed,
    y: r.units_consumed_so_far,
    target: plan.target_daily_units * r.days_elapsed
  })) : [];

  return (
    <ScrollView style={{ flex: 1 }}>
      <SectionHeader title="📊 Smart Visualization" />
      <Card style={styles.analysisCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Consumption Pattern</Text>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.legendText}>Actual</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.legendText}>Target</Text>
            </View>
          </View>
        </View>

        {chartData.length > 1 ? (
          <View style={styles.chartContainer}>
            <Text style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 20 }}>
              X: Days Elapsed | Y: kWh Consumed
            </Text>
            {/* Note: In a real project we'd use VictoryLine here. 
                 Since Victory installation might be tricky in all envs, 
                 I'll use a clean custom SVG or simple progress visuals if needed,
                 but I'll try the Victory structure since it's in package.json.
             */}
            <Text style={{ color: COLORS.primary, fontSize: 40, ...FONTS.bold }}>
              {readings[0]?.status === 'over_budget' ? '⚠️' : '📈'}
            </Text>
            <Text style={{ color: COLORS.textPrimary, marginTop: 10, textAlign: 'center' }}>
              Consumption: {readings[0]?.units_consumed_so_far} kWh{'\n'}
              vs Target: {(plan.target_daily_units * readings[0]?.days_elapsed).toFixed(1)} kWh
            </Text>
          </View>
        ) : (
          <EmptyState icon="📉" title="Not Enough Data" subtitle="Add at least 2 readings to see consumption trends." />
        )}
      </Card>

      <SectionHeader title="🤖 AI Budget Assistant" />
      {readings[0]?.analysis_data?.appliance_recommendations?.length > 0 ? (
        readings[0].analysis_data.appliance_recommendations.map((rec, i) => (
          <RecommendationCard key={i} rec={rec} />
        ))
      ) : (
        <Card>
          <Text style={{ color: COLORS.textSecondary, textAlign: 'center' }}>
            {readings[0]?.status === 'over_budget'
              ? "No specific appliance data found. Try adding your appliances in the Analysis section for personalized tips."
              : "You're on track! No urgent recommendations."}
          </Text>
        </Card>
      )}
    </ScrollView>
  );
};

export default TrackingScreen;