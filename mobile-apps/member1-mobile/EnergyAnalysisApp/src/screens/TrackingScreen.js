import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, RefreshControl, TouchableOpacity,
  Modal, TextInput, FlatList,
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
      const res = await analysisAPI.trackProgress(
        selectedPlan.id,
        val,
        new Date().toISOString(),
        notes || null,
      );

      if (res.data.success) {
        const progress = res.data.progress;
        const status = progress.current_status?.status;

        // Alert based on status
        let alertTitle = '✅ Reading Recorded';
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

        Alert.alert(alertTitle, alertMsg);
        setShowReadingModal(false);
        setReadingInput('');
        setNotes('');
        fetchData();
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to record reading.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReading = (readingId) => {
    Alert.alert('Delete Reading', 'Remove this meter reading?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await analysisAPI.deleteReading(readingId);
            fetchData();
          } catch { Alert.alert('Error', 'Could not delete.'); }
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
            {/* Plan Selector */}
            {plans.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.planChips}>
                {plans.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.planChip, selectedPlan?.id === p.id && styles.planChipActive]}
                    onPress={() => setSelectedPlan(p)}
                  >
                    <Text style={[styles.planChipText, selectedPlan?.id === p.id && styles.planChipTextActive]}>
                      Plan #{p.id} · {formatCurrency(p.target_budget, 0)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {selectedPlan && (
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
                </Card>

                {/* Latest Progress */}
                {latestProgress && (
                  <>
                    <SectionHeader title="Current Status" />
                    <ProgressCard reading={latestProgress} plan={selectedPlan} />

                    {/* AI Recommendations */}
                    {latestProgress?.analysis_data?.appliance_recommendations?.length > 0 && (
                      <>
                        <SectionHeader title="🤖 AI Recommendations" />
                        {latestProgress.analysis_data.appliance_recommendations.map((rec, i) => (
                          <RecommendationCard key={i} rec={rec} />
                        ))}
                      </>
                    )}

                    {/* Weekly Status */}
                    {latestProgress?.analysis_data?.weekly_status && (
                      <WeeklyStatusCard ws={latestProgress.analysis_data.weekly_status} />
                    )}
                  </>
                )}

                {/* Reading History */}
                <SectionHeader title={`Readings (${readings.length}/8)`} action={() => setShowReadingModal(true)} actionLabel="+ Add" />
                {readings.length === 0 ? (
                  <Card>
                    <Text style={styles.noReadings}>No readings yet. Add your current meter reading to start tracking.</Text>
                  </Card>
                ) : (
                  readings.map((r) => (
                    <ReadingCard key={r.id} reading={r} onDelete={() => deleteReading(r.id)} />
                  ))
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
            onPress={() => setShowReadingModal(true)}
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
            <Text style={styles.sheetTitle}>Submit Meter Reading</Text>

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
              autoFocus
            />

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
              label="Submit Reading"
              onPress={submitReading}
              loading={submitting}
              disabled={submitting || !readingInput}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const MetaItem = ({ icon, label }) => (
  <View style={styles.metaItem}>
    <Text style={styles.metaIcon}>{icon}</Text>
    <Text style={styles.metaLabel}>{label}</Text>
  </View>
);

const ProgressCard = ({ reading, plan }) => {
  const pct = plan.target_budget > 0 ? reading.actual_cost / plan.target_budget : 0;
  const statusColor = getStatusColor(reading.status);
  return (
    <Card style={[styles.progressCard, { borderLeftColor: statusColor }]}>
      <View style={styles.progressRow}>
        <View>
          <Text style={styles.progressCost}>{formatCurrency(reading.actual_cost)}</Text>
          <Text style={styles.progressLabel}>Spent so far</Text>
        </View>
        <View>
          <Text style={styles.progressExpected}>{formatCurrency(reading.expected_cost)}</Text>
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
        {reading.days_elapsed} days elapsed · {reading.units_consumed} kWh used · Projected: {formatCurrency(reading.projected_total_cost)}
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

const ReadingCard = ({ reading, onDelete }) => (
  <View style={styles.readingCard}>
    <View style={styles.readingLeft}>
      <Text style={styles.readingDate}>{formatDate(reading.reading_date)}</Text>
      <Text style={styles.readingValue}>{reading.reading_value} kWh</Text>
    </View>
    <View style={styles.readingMid}>
      <Text style={styles.readingUnits}>{reading.units_consumed} consumed</Text>
      <Text style={[styles.readingStatus, { color: getStatusColor(reading.status) }]}>
        {getStatusLabel(reading.status)}
      </Text>
    </View>
    <View style={styles.readingRight}>
      <Text style={styles.readingCost}>{formatCurrency(reading.actual_cost)}</Text>
      <TouchableOpacity onPress={onDelete}><Text style={styles.deleteBtn}>🗑️</Text></TouchableOpacity>
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
});

export default TrackingScreen;