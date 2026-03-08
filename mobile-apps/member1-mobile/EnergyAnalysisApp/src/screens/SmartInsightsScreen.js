import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Animated, Dimensions,
} from 'react-native';
import { smartPredictionsAPI } from '../api/smartPredictionsAPI';
import { billsAPI } from '../api/billsAPI';
import { analysisAPI } from '../api/analysisAPI';
import { useAccount } from '../contexts/AccountContext';
import { COLORS, SPACING, RADIUS, FONTS, SHADOW } from '../utils/theme';
import { formatCurrency } from '../utils/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Reusable Sub-Components ──────────────────────────────────────────────────

const TabBar = ({ tabs, active, onPress }) => (
  <View style={tabStyles.container}>
    {tabs.map((tab) => (
      <TouchableOpacity
        key={tab.id}
        style={[tabStyles.tab, active === tab.id && tabStyles.activeTab]}
        onPress={() => onPress(tab.id)}
      >
        <Text style={tabStyles.emoji}>{tab.emoji}</Text>
        <Text style={[tabStyles.label, active === tab.id && tabStyles.activeLabel]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.lg,
    padding: 4,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOW.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: 2,
  },
  activeTab: { backgroundColor: COLORS.primary },
  emoji: { fontSize: 16 },
  label: { color: COLORS.textSecondary, fontSize: 10, ...FONTS.medium },
  activeLabel: { color: '#fff' },
});

const SectionCard = ({ children, style }) => (
  <View style={[cardStyles.card, style]}>{children}</View>
);

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
});

const RiskBadge = ({ risk }) => {
  const config = {
    high:    { bg: '#EF444420', text: '#EF4444', label: 'HIGH RISK' },
    medium:  { bg: '#F59E0B20', text: '#F59E0B', label: 'MEDIUM RISK' },
    low:     { bg: '#10B98120', text: '#10B981', label: 'LOW RISK' },
    danger:  { bg: '#EF444420', text: '#EF4444', label: 'DANGER' },
    warning: { bg: '#F59E0B20', text: '#F59E0B', label: 'WARNING' },
    safe:    { bg: '#10B98120', text: '#10B981', label: 'SAFE' },
    monitor: { bg: '#3B82F620', text: '#3B82F6', label: 'MONITORING' },
  };
  const c = config[risk] || config.monitor;
  return (
    <View style={[badgeStyles.badge, { backgroundColor: c.bg }]}>
      <Text style={[badgeStyles.text, { color: c.text }]}>{c.label}</Text>
    </View>
  );
};

const badgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 10, ...FONTS.bold, letterSpacing: 1 },
});

// ─── Efficiency Score Gauge ────────────────────────────────────────────────

const EfficiencyGauge = ({ score, grade, gradeLabel, gradeColor }) => {
  const rotation = useAnimatedRotation(score);

  const getArcColor = (s) => {
    if (s >= 80) return COLORS.success;
    if (s >= 65) return COLORS.primary;
    if (s >= 50) return '#F59E0B';
    if (s >= 35) return '#F97316';
    return COLORS.danger;
  };

  return (
    <View style={gaugeStyles.container}>
      <View style={[gaugeStyles.circle, { borderColor: getArcColor(score) }]}>
        <Text style={[gaugeStyles.score, { color: getArcColor(score) }]}>
          {Math.round(score)}
        </Text>
        <Text style={gaugeStyles.outOf}>/100</Text>
      </View>
      <View style={[gaugeStyles.gradeBadge, { backgroundColor: gradeColor + '25' }]}>
        <Text style={[gaugeStyles.grade, { color: gradeColor }]}>
          Grade {grade} · {gradeLabel}
        </Text>
      </View>
    </View>
  );
};

const useAnimatedRotation = (score) => {
  const anim = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: score,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [score]);
  return anim;
};

const gaugeStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: SPACING.lg },
  circle: {
    width: 120, height: 120,
    borderRadius: 60,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg3,
  },
  score: { fontSize: 32, ...FONTS.extraBold },
  outOf: { color: COLORS.textMuted, fontSize: 12, ...FONTS.medium, marginTop: -4 },
  gradeBadge: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  grade: { fontSize: 13, ...FONTS.semiBold },
});

// ─── Progress Bar ──────────────────────────────────────────────────────────

const ProgressBar = ({ value, max, color = COLORS.primary, showLabel = false }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <View style={pbStyles.track}>
      <View style={[pbStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      {showLabel && (
        <Text style={pbStyles.label}>{pct.toFixed(0)}%</Text>
      )}
    </View>
  );
};

const pbStyles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: COLORS.bg3,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: RADIUS.full },
  label: { position: 'absolute', right: 0, top: -18, color: COLORS.textMuted, fontSize: 10 },
});

// ─── Factor Item ──────────────────────────────────────────────────────────

const FactorItem = ({ text, type = 'info' }) => {
  const icon = type === 'danger' ? '⚠️' : type === 'positive' ? '✅' : '📌';
  return (
    <View style={factorStyles.row}>
      <Text style={factorStyles.icon}>{icon}</Text>
      <Text style={factorStyles.text}>{text}</Text>
    </View>
  );
};

const factorStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm, gap: SPACING.sm },
  icon: { fontSize: 13, marginTop: 1 },
  text: { color: COLORS.textSecondary, fontSize: 13, flex: 1, lineHeight: 19 },
});

// ─── Tip Card ─────────────────────────────────────────────────────────────

const TipCard = ({ tip }) => (
  <View style={tipStyles.card}>
    <Text style={tipStyles.bullet}>💡</Text>
    <Text style={tipStyles.text}>{tip}</Text>
  </View>
);

const tipStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg3,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  bullet: { fontSize: 14 },
  text: { color: COLORS.textSecondary, fontSize: 13, flex: 1, lineHeight: 19 },
});

// ─── Scenario Row ─────────────────────────────────────────────────────────

const ScenarioRow = ({ scenario }) => (
  <View style={scenStyles.row}>
    <View style={scenStyles.left}>
      <Text style={scenStyles.action}>
        Reduce {scenario.reduce_per_day_kwh} kWh/day
      </Text>
      <Text style={scenStyles.result}>
        → {scenario.new_projected_kwh} kWh projected
        {scenario.category_change ? ' · 🎉 Stays in Cat 1!' : ''}
      </Text>
    </View>
    <View style={scenStyles.saving}>
      <Text style={scenStyles.savingText}>-Rs.{scenario.saving_rs}</Text>
    </View>
  </View>
);

const scenStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bg3,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  left: { flex: 1 },
  action: { color: COLORS.textPrimary, fontSize: 13, ...FONTS.medium },
  result: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  saving: {
    backgroundColor: '#10B98120',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  savingText: { color: COLORS.success, fontSize: 13, ...FONTS.bold },
});

// ─── Empty / Error States ─────────────────────────────────────────────────

const EmptyCard = ({ emoji, title, subtitle }) => (
  <SectionCard>
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.emoji}>{emoji}</Text>
      <Text style={emptyStyles.title}>{title}</Text>
      <Text style={emptyStyles.sub}>{subtitle}</Text>
    </View>
  </SectionCard>
);

const emptyStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: SPACING.xl },
  emoji: { fontSize: 36, marginBottom: SPACING.md },
  title: { color: COLORS.textPrimary, fontSize: 15, ...FONTS.semiBold, textAlign: 'center' },
  sub: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 19 },
});

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1: SPIKE PREDICTION
// ══════════════════════════════════════════════════════════════════════════════

const SpikePredictionTab = ({ data, loading }) => {
  if (loading) return <EmptyCard emoji="⏳" title="Analysing bill history..." subtitle="Please wait" />;
  if (!data) return (
    <EmptyCard
      emoji="📊"
      title="Need Bill History"
      subtitle="Upload at least 2 months of electricity bills to enable spike prediction."
    />
  );

  const riskColor = {
    high: COLORS.danger, medium: '#F59E0B', low: COLORS.success,
  }[data.spike_risk] || COLORS.primary;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>

      {/* Risk Overview Card */}
      <SectionCard>
        <View style={s.rowBetween}>
          <View>
            <Text style={s.cardTitle}>Next Month Forecast</Text>
            <Text style={s.cardSub}>Based on {data.bills_used} months of history</Text>
          </View>
          <RiskBadge risk={data.spike_risk} />
        </View>

        {/* Big probability display */}
        <View style={s.probContainer}>
          <Text style={[s.probPct, { color: riskColor }]}>
            {Math.round(data.spike_probability * 100)}%
          </Text>
          <Text style={s.probLabel}>spike probability</Text>
        </View>

        <ProgressBar
          value={data.spike_probability * 100}
          max={100}
          color={riskColor}
        />

        <Text style={[s.message, { marginTop: SPACING.md }]}>{data.message}</Text>
      </SectionCard>

      {/* Predicted Range */}
      {data.predicted_kwh_range && (
        <SectionCard>
          <Text style={s.sectionTitle}>Predicted Usage Range</Text>
          <View style={s.rangeRow}>
            <View style={s.rangeBox}>
              <Text style={s.rangeLabel}>Low estimate</Text>
              <Text style={s.rangeValue}>{data.predicted_kwh_range[0]} kWh</Text>
              <Text style={s.rangeSub}>Rs. {data.predicted_bill_range?.[0]?.toFixed(0)}</Text>
            </View>
            <Text style={s.rangeDash}>—</Text>
            <View style={s.rangeBox}>
              <Text style={s.rangeLabel}>High estimate</Text>
              <Text style={[s.rangeValue, { color: riskColor }]}>
                {data.predicted_kwh_range[1]} kWh
              </Text>
              <Text style={s.rangeSub}>Rs. {data.predicted_bill_range?.[1]?.toFixed(0)}</Text>
            </View>
          </View>
          <View style={s.avgRow}>
            <Text style={s.avgLabel}>Your 3-month average: </Text>
            <Text style={s.avgValue}>{data.current_3month_avg_kwh} kWh</Text>
          </View>
        </SectionCard>
      )}

      {/* Factors */}
      {data.factors?.length > 0 && (
        <SectionCard>
          <Text style={s.sectionTitle}>Why this prediction?</Text>
          {data.factors.map((f, i) => (
            <FactorItem
              key={i}
              text={f}
              type={data.spike_risk === 'high' ? 'danger' : 'info'}
            />
          ))}
        </SectionCard>
      )}

      {/* Action Tips */}
      {data.action_tips?.length > 0 && (
        <SectionCard>
          <Text style={s.sectionTitle}>What to do</Text>
          {data.action_tips.map((tip, i) => <TipCard key={i} tip={tip} />)}
        </SectionCard>
      )}

      <View style={{ height: SPACING.xl }} />
    </ScrollView>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2: TARIFF CROSSING WARNING
// ══════════════════════════════════════════════════════════════════════════════

const TariffWarningTab = ({ data, loading }) => {
  if (loading) return <EmptyCard emoji="⏳" title="Calculating..." subtitle="Please wait" />;
  if (!data || data.status === 'no_data') return (
    <EmptyCard
      emoji="📏"
      title="No Meter Readings Yet"
      subtitle="Submit your meter reading in the Tracking tab to activate real-time tariff monitoring."
    />
  );

  const warning = data.warning || {};
  const statusColor = {
    danger: COLORS.danger,
    warning: '#F59E0B',
    safe: COLORS.success,
    monitor: COLORS.primary,
  }[warning.status] || COLORS.primary;

  const progressPct = data.period_progress_pct || 0;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>

      {/* Warning Banner */}
      <View style={[s.warningBanner, { backgroundColor: statusColor + '15', borderColor: statusColor }]}>
        <Text style={s.warningEmoji}>{warning.emoji}</Text>
        <View style={s.warningText}>
          <Text style={[s.warningTitle, { color: statusColor }]}>{warning.title}</Text>
          <Text style={s.warningMsg}>{warning.message}</Text>
        </View>
      </View>

      {/* Billing Period Progress */}
      <SectionCard>
        <Text style={s.sectionTitle}>Billing Period Progress</Text>
        <View style={s.rowBetween}>
          <Text style={s.cardSub}>Day {data.days_elapsed} of {data.total_billing_days}</Text>
          <Text style={s.cardSub}>{data.days_remaining} days left</Text>
        </View>
        <View style={{ marginTop: SPACING.sm }}>
          <ProgressBar value={progressPct} max={100} color={COLORS.primary} />
        </View>

        <View style={s.statGrid}>
          <View style={s.statCell}>
            <Text style={s.statValue}>{data.kwh_so_far}</Text>
            <Text style={s.statLabel}>kWh so far</Text>
          </View>
          <View style={s.statCell}>
            <Text style={s.statValue}>{data.daily_rate_kwh}</Text>
            <Text style={s.statLabel}>kWh/day rate</Text>
          </View>
          <View style={s.statCell}>
            <Text style={[s.statValue, {
              color: data.projected_kwh > 60 ? COLORS.danger : COLORS.success,
            }]}>
              {data.projected_kwh}
            </Text>
            <Text style={s.statLabel}>projected total</Text>
          </View>
        </View>
      </SectionCard>

      {/* Tariff Boundary Visualization */}
      <SectionCard>
        <Text style={s.sectionTitle}>CEB Tariff Boundaries</Text>
        {[
          { label: 'Category 1 Limit', threshold: 60, color: COLORS.danger },
          { label: '90 kWh Slab', threshold: 90, color: '#F97316' },
          { label: '120 kWh Slab', threshold: 120, color: '#F59E0B' },
        ].map((boundary) => {
          const dist = boundary.threshold - data.projected_kwh;
          const over = dist < 0;
          return (
            <View key={boundary.label} style={s.boundaryRow}>
              <View style={s.boundaryLeft}>
                <Text style={s.boundaryLabel}>{boundary.label} ({boundary.threshold} kWh)</Text>
                <Text style={[s.boundaryDist, { color: over ? boundary.color : COLORS.success }]}>
                  {over
                    ? `${Math.abs(dist).toFixed(0)} kWh OVER`
                    : `${dist.toFixed(0)} kWh away — safe`}
                </Text>
              </View>
              <View style={[s.boundaryDot, {
                backgroundColor: over ? boundary.color : COLORS.success,
              }]} />
            </View>
          );
        })}
      </SectionCard>

      {/* Bill Estimate */}
      <SectionCard>
        <Text style={s.sectionTitle}>Bill Estimate</Text>
        <View style={s.rowBetween}>
          <View>
            <Text style={s.cardSub}>Current usage ({data.kwh_so_far} kWh)</Text>
            <Text style={s.estimateValue}>Rs. {data.current_bill_estimate_rs?.toFixed(0)}</Text>
          </View>
          <Text style={s.arrowText}>→</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.cardSub}>Projected ({data.projected_kwh} kWh)</Text>
            <Text style={[s.estimateValue, { color: data.projected_kwh > 60 ? COLORS.danger : COLORS.success }]}>
              Rs. {data.projected_bill_rs?.toFixed(0)}
            </Text>
          </View>
        </View>
        {data.warning?.extra_cost_rs > 0 && (
          <View style={s.extraCostBanner}>
            <Text style={s.extraCostText}>
              ⚠️ Crossing boundary adds Rs. {data.warning.extra_cost_rs} to your bill
            </Text>
          </View>
        )}
      </SectionCard>

      {/* Reduction Scenarios */}
      {data.reduction_scenarios?.length > 0 && (
        <SectionCard>
          <Text style={s.sectionTitle}>What if I reduce usage?</Text>
          {data.reduction_scenarios.map((sc, i) => (
            <ScenarioRow key={i} scenario={sc} />
          ))}
        </SectionCard>
      )}

      {/* Action */}
      {warning.action && (
        <SectionCard>
          <Text style={s.sectionTitle}>Recommended Action</Text>
          <TipCard tip={warning.action} />
        </SectionCard>
      )}

      <View style={{ height: SPACING.xl }} />
    </ScrollView>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3: EFFICIENCY SCORE
// ══════════════════════════════════════════════════════════════════════════════

const EfficiencyScoreTab = ({ data, loading }) => {
  if (loading) return <EmptyCard emoji="⏳" title="Calculating score..." subtitle="Please wait" />;
  if (!data) return (
    <EmptyCard
      emoji="🏆"
      title="Score Unavailable"
      subtitle="Upload a bill and complete your household profile to get your efficiency score."
    />
  );

  const peerPct = data.peer_percentile || 0;
  const saving = data.saving_kwh || 0;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>

      {/* Gauge */}
      <SectionCard>
        <Text style={[s.cardTitle, { textAlign: 'center' }]}>Your Efficiency Score</Text>
        <EfficiencyGauge
          score={data.score}
          grade={data.grade}
          gradeLabel={data.grade_label}
          gradeColor={data.grade_color}
        />
        <Text style={[s.message, { textAlign: 'center' }]}>{data.comparison_message}</Text>
      </SectionCard>

      {/* Actual vs Expected */}
      <SectionCard>
        <Text style={s.sectionTitle}>Your Usage vs Expected</Text>
        <View style={s.compareRow}>
          <View style={s.compareCell}>
            <Text style={s.compareLabel}>Actual</Text>
            <Text style={[s.compareKwh, {
              color: data.actual_kwh > data.expected_kwh ? COLORS.danger : COLORS.success,
            }]}>
              {data.actual_kwh} kWh
            </Text>
            <View style={{ marginTop: SPACING.sm }}>
              <ProgressBar
                value={data.actual_kwh}
                max={Math.max(data.actual_kwh, data.expected_kwh) * 1.1}
                color={data.actual_kwh > data.expected_kwh ? COLORS.danger : COLORS.success}
              />
            </View>
          </View>

          <Text style={s.vsSep}>vs</Text>

          <View style={s.compareCell}>
            <Text style={s.compareLabel}>Expected for your household</Text>
            <Text style={[s.compareKwh, { color: COLORS.textMuted }]}>
              {data.expected_kwh} kWh
            </Text>
            <View style={{ marginTop: SPACING.sm }}>
              <ProgressBar
                value={data.expected_kwh}
                max={Math.max(data.actual_kwh, data.expected_kwh) * 1.1}
                color={COLORS.textMuted}
              />
            </View>
          </View>
        </View>

        <View style={[s.savingBox, {
          backgroundColor: saving >= 0 ? '#10B98115' : '#EF444415',
        }]}>
          <Text style={[s.savingBigText, {
            color: saving >= 0 ? COLORS.success : COLORS.danger,
          }]}>
            {saving >= 0 ? '✅' : '⚠️'} {Math.abs(saving).toFixed(0)} kWh{' '}
            {saving >= 0 ? 'below' : 'above'} expected
          </Text>
          <Text style={[s.savingSubText, {
            color: saving >= 0 ? COLORS.success : COLORS.danger,
          }]}>
            ≈ Rs. {Math.abs(data.saving_rs).toFixed(0)}/month{' '}
            {saving >= 0 ? 'saved' : 'extra'}
          </Text>
        </View>
      </SectionCard>

      {/* Peer Comparison */}
      <SectionCard>
        <Text style={s.sectionTitle}>Peer Comparison</Text>
        <Text style={s.peerText}>
          You are more efficient than{' '}
          <Text style={[s.peerPct, { color: COLORS.primary }]}>{peerPct}%</Text>
          {' '}of similar households
        </Text>
        <View style={{ marginTop: SPACING.md }}>
          <ProgressBar value={peerPct} max={100} color={COLORS.primary} />
        </View>
        <View style={s.peerLegend}>
          <Text style={s.peerLegendText}>0% (least efficient)</Text>
          <Text style={s.peerLegendText}>100% (most efficient)</Text>
        </View>

        <View style={s.breakdownBox}>
          <Text style={s.breakdownTitle}>Your household factors</Text>
          {data.score_breakdown && Object.entries({
            'People contribution': `${data.score_breakdown.people_contribution_kwh} kWh`,
            'Appliance load': `${data.score_breakdown.appliance_contribution_kwh} kWh`,
            'House type factor': `×${data.score_breakdown.house_type_factor}`,
          }).map(([label, value]) => (
            <View key={label} style={s.breakdownRow}>
              <Text style={s.breakdownLabel}>{label}</Text>
              <Text style={s.breakdownValue}>{value}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      {/* Improvement Tips */}
      {data.improvement_tips?.length > 0 && (
        <SectionCard>
          <Text style={s.sectionTitle}>
            {data.score >= 70 ? '🌟 Keep it up!' : '📈 How to improve'}
          </Text>
          {data.improvement_tips.map((tip, i) => <TipCard key={i} tip={tip} />)}
        </SectionCard>
      )}

      <View style={{ height: SPACING.xl }} />
    </ScrollView>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: 'spike',      emoji: '⚡', label: 'Spike Alert' },
  { id: 'tariff',     emoji: '📏', label: 'Tariff Watch' },
  { id: 'efficiency', emoji: '🏆', label: 'Efficiency' },
];

const SmartInsightsScreen = ({ navigation }) => {
  const { selectedAccount } = useAccount();
  const [activeTab, setActiveTab] = useState('spike');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [spikeData, setSpikeData] = useState(null);
  const [tariffData, setTariffData] = useState(null);
  const [efficiencyData, setEfficiencyData] = useState(null);
  const [alertCount, setAlertCount] = useState(0);

  const loadData = useCallback(async () => {
    if (!selectedAccount) { setLoading(false); return; }

    try {
      const insightsRes = await smartPredictionsAPI.getFullInsights(selectedAccount);
      const insights = insightsRes.data;

      setSpikeData(insights.spike_prediction);
      setTariffData(insights.tariff_warning);
      setEfficiencyData(insights.efficiency_score);
      setAlertCount(insights.summary?.alert_count || 0);

    } catch (err) {
      try {
        const billsRes = await billsAPI.getByAccount(selectedAccount);
        const bills = (billsRes.data?.bills || []).map((b) => ({
          kwh: b.total_units,
          billing_month: new Date(b.bill_date).getMonth() + 1,
          billing_year: new Date(b.bill_date).getFullYear(),
          billing_days: b.billing_days || 30,
          amount_rs: b.total_amount,
          meter_start: b.meter_reading_start || 0,
          meter_end: b.meter_reading_end || b.total_units,
        }));

        if (bills.length >= 2) {
          const spikeRes = await smartPredictionsAPI.getSpikePrediction(bills);
          setSpikeData(spikeRes.data);
        }

        const plansRes = await analysisAPI.getPlansByAccount(selectedAccount, true);
        const plan = plansRes.data?.plans?.[0];
        if (plan) {
          const readingsRes = await analysisAPI.getPlanReadings(plan.id);
          const readings = (readingsRes.data?.readings || []).map((r) => ({
            reading_value: r.current_reading,
            reading_date: r.reading_date,
            billing_period_start: plan.start_date,
            billing_period_end: plan.end_date,
          }));
          if (readings.length > 0) {
            const tariffRes = await smartPredictionsAPI.getTariffWarning(
              readings, plan.start_reading || 0
            );
            setTariffData(tariffRes.data);
          }
        }
      } catch (fallbackErr) {
        console.error('Smart insights error:', fallbackErr);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedAccount]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  return (
    <View style={s.screen}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Smart Insights</Text>
          <Text style={s.headerSub}>AI-powered electricity analysis</Text>
        </View>

        <View style={s.headerRight}>
          {alertCount > 0 && (
            <View style={s.alertBadge}>
              <Text style={s.alertBadgeText}>{alertCount}</Text>
            </View>
          )}

          {/* ── Live Meter Button ─────────────────────────────────────────── */}
          <TouchableOpacity
            style={s.liveMeterBtn}
            onPress={() => navigation.navigate('LiveMeter')}
            activeOpacity={0.8}
          >
            <Text style={s.liveMeterTxt}>📡 Live</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Bar */}
      <TabBar tabs={TABS} active={activeTab} onPress={setActiveTab} />

      {/* Content */}
      <View style={s.content}>
        {activeTab === 'spike' && (
          <SpikePredictionTab data={spikeData} loading={loading} />
        )}
        {activeTab === 'tariff' && (
          <TariffWarningTab data={tariffData} loading={loading} />
        )}
        {activeTab === 'efficiency' && (
          <EfficiencyScoreTab data={efficiencyData} loading={loading} />
        )}
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg0, paddingTop: SPACING.xl },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: 22, ...FONTS.bold },
  headerSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  alertBadge: {
    backgroundColor: COLORS.danger,
    width: 24, height: 24,
    borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  alertBadgeText: { color: '#fff', fontSize: 12, ...FONTS.bold },

  // ── Live Meter Button ───────────────────────────────────────────────────
  liveMeterBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
  },
  liveMeterTxt: { color: '#fff', fontSize: 12, ...FONTS.semiBold },

  content: { flex: 1 },

  // Card internals
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, ...FONTS.semiBold },
  cardSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 14, ...FONTS.semiBold, marginBottom: SPACING.md },
  message: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },

  // Spike tab
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  probContainer: { alignItems: 'center', marginVertical: SPACING.lg },
  probPct: { fontSize: 56, ...FONTS.extraBold, lineHeight: 60 },
  probLabel: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
  rangeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: SPACING.md },
  rangeBox: { alignItems: 'center' },
  rangeLabel: { color: COLORS.textMuted, fontSize: 11 },
  rangeValue: { color: COLORS.textPrimary, fontSize: 22, ...FONTS.bold, marginTop: 4 },
  rangeSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  rangeDash: { color: COLORS.textMuted, fontSize: 20 },
  avgRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: SPACING.md },
  avgLabel: { color: COLORS.textMuted, fontSize: 13 },
  avgValue: { color: COLORS.textPrimary, fontSize: 13, ...FONTS.semiBold },

  // Tariff tab
  warningBanner: {
    flexDirection: 'row',
    margin: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  warningEmoji: { fontSize: 24 },
  warningText: { flex: 1 },
  warningTitle: { fontSize: 15, ...FONTS.bold },
  warningMsg: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 18 },
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  statCell: { alignItems: 'center', flex: 1 },
  statValue: { color: COLORS.textPrimary, fontSize: 20, ...FONTS.bold },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 4, textAlign: 'center' },
  boundaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg3,
  },
  boundaryLeft: { flex: 1 },
  boundaryLabel: { color: COLORS.textPrimary, fontSize: 13 },
  boundaryDist: { fontSize: 12, marginTop: 2 },
  boundaryDot: { width: 10, height: 10, borderRadius: 5, marginLeft: SPACING.md },
  estimateValue: { color: COLORS.textPrimary, fontSize: 22, ...FONTS.bold, marginTop: 4 },
  arrowText: { color: COLORS.textMuted, fontSize: 20, marginHorizontal: SPACING.md },
  extraCostBanner: {
    backgroundColor: '#EF444415',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  extraCostText: { color: COLORS.danger, fontSize: 13, ...FONTS.medium, textAlign: 'center' },

  // Efficiency tab
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  compareCell: { flex: 1 },
  compareLabel: { color: COLORS.textMuted, fontSize: 11 },
  compareKwh: { fontSize: 22, ...FONTS.bold, marginTop: 4 },
  vsSep: { color: COLORS.textMuted, fontSize: 14 },
  savingBox: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  savingBigText: { fontSize: 15, ...FONTS.semiBold },
  savingSubText: { fontSize: 13, marginTop: 4 },
  peerText: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 },
  peerPct: { fontSize: 18, ...FONTS.bold },
  peerLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
  peerLegendText: { color: COLORS.textMuted, fontSize: 10 },
  breakdownBox: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.bg3,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  breakdownTitle: { color: COLORS.textMuted, fontSize: 12, ...FONTS.medium, marginBottom: SPACING.sm },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  breakdownLabel: { color: COLORS.textSecondary, fontSize: 12 },
  breakdownValue: { color: COLORS.textPrimary, fontSize: 12, ...FONTS.medium },
});

export default SmartInsightsScreen;