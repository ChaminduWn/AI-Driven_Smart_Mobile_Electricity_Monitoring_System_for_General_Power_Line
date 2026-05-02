import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity,
  Modal, TextInput, Platform, Animated, Easing, Dimensions,
} from 'react-native';
import { ArrowLeft, Target, Cpu, Zap } from 'lucide-react-native';
import { universalAlert } from '../utils/alerts';
import { analysisAPI } from '../api/analysisAPI';
import { useAccount } from '../contexts/AccountContext';
import {
  Card, SectionHeader, EmptyState, LoadingScreen, PrimaryButton, SecondaryButton,
  InfoRow, Divider, ProgressBar, PremiumEmptyState,
} from '../components/SharedComponents';
import { COLORS, SPACING, RADIUS, FONTS, SHADOW } from '../utils/theme';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../utils/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_W = SCREEN_WIDTH - 64;
const CHART_H = 220;

// ─── Animated Number ──────────────────────────────────────────────────────────
const AnimatedNum = ({ value, style, prefix = 'Rs. ' }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const [disp, setDisp] = useState(0);
  useEffect(() => {
    anim.setValue(0);
    const a = Animated.timing(anim, { toValue: value, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    a.start();
    const id = anim.addListener(({ value: v }) => setDisp(v));
    return () => anim.removeListener(id);
  }, [value]);
  return <Text style={style}>{prefix}{disp.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>;
};

// ─── Sparkline Chart ──────────────────────────────────────────────────────────
// Pure RN SVG-like chart using Views – no external dependency
const ConsumptionChart = ({ readings, plan }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [readings]);

  if (!readings || readings.length === 0) {
    return (
      <View style={ch.empty}>
        <Text style={ch.emptyIcon}>📊</Text>
        <Text style={ch.emptyText}>Submit your first reading to see the chart</Text>
      </View>
    );
  }

  const totalDays = plan?.planning_days || 30;
  const targetTotalUnits = plan?.target_total_units || 0;
  const dailyTarget = plan?.target_daily_units || 0;

  // Build data points (sorted oldest → newest)
  const sorted = [...readings].sort((a, b) => new Date(a.reading_date) - new Date(b.reading_date));

  // Add origin point
  const allPoints = [{ days_elapsed: 0, units_consumed_so_far: 0 }, ...sorted];
  const maxUnits = Math.max(targetTotalUnits * 1.3, sorted[sorted.length - 1]?.units_consumed_so_far * 1.2 || 10);

  const px = (day) => (day / totalDays) * CHART_W;
  const py = (units) => CHART_H - (units / maxUnits) * CHART_H;

  // Build actual path string (for display as connected dots)
  const points = allPoints.map(r => ({ x: px(r.days_elapsed), y: py(r.units_consumed_so_far) }));

  const latestPoint = points[points.length - 1];
  const latestReading = sorted[sorted.length - 1];
  const isOver = latestReading?.status === 'over_budget';

  // Target line end point
  const targetEndX = px(totalDays);
  const targetEndY = py(targetTotalUnits);

  // Projected line from latest to end
  const projectedUnits = latestReading?.projected_total_units;
  const projEndY = projectedUnits ? py(projectedUnits) : null;

  return (
    <Animated.View style={[ch.wrap, { opacity: fadeAnim }]}>
      {/* Legend */}
      <View style={ch.legend}>
        <View style={ch.legendItem}><View style={[ch.legendDot, { backgroundColor: '#38BDF8' }]} /><Text style={ch.legendText}>Actual</Text></View>
        <View style={ch.legendItem}><View style={[ch.legendDot, { backgroundColor: '#FBBF24', borderRadius: 0 }]} /><Text style={ch.legendText}>Target</Text></View>
        {projEndY && <View style={ch.legendItem}><View style={[ch.legendDot, { backgroundColor: isOver ? '#EF4444' : '#34D399' }]} /><Text style={ch.legendText}>Projected</Text></View>}
      </View>

      <View style={[ch.canvas, { width: CHART_W, height: CHART_H }]}>
        {/* Y grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <View key={t} style={[ch.gridH, { top: CHART_H * t }]}>
            <Text style={ch.gridLabel}>{Math.round(maxUnits * (1 - t))}</Text>
          </View>
        ))}

        {/* X grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <View key={t} style={[ch.gridV, { left: CHART_W * t }]}>
            <Text style={ch.gridLabelX}>{Math.round(totalDays * t)}d</Text>
          </View>
        ))}

        {/* Target dashed line (rendered as segments) */}
        {Array.from({ length: 20 }, (_, i) => {
          const x1 = (i / 20) * CHART_W;
          const y1 = CHART_H - (i / 20) * (CHART_H - targetEndY);
          const segLen = CHART_W / 40;
          return i % 2 === 0 ? (
            <View key={i} style={{
              position: 'absolute',
              left: x1, top: y1,
              width: segLen, height: 2,
              backgroundColor: '#FBBF24',
              opacity: 0.7,
              borderRadius: 1,
            }} />
          ) : null;
        })}

        {/* Projected line from latest point to end */}
        {projEndY && latestPoint && (() => {
          const dx = CHART_W - latestPoint.x;
          const dy = projEndY - latestPoint.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View style={{
              position: 'absolute',
              left: latestPoint.x,
              top: latestPoint.y,
              width: len,
              height: 1.5,
              backgroundColor: isOver ? '#EF4444' : '#34D399',
              opacity: 0.5,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: '0 50%',
            }} />
          );
        })()}

        {/* Actual line segments */}
        {points.slice(0, -1).map((p, i) => {
          const next = points[i + 1];
          const dx = next.x - p.x;
          const dy = next.y - p.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View key={i} style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: len,
              height: 3,
              backgroundColor: '#38BDF8',
              borderRadius: 2,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: '0 50%',
            }} />
          );
        })}

        {/* Actual data dots */}
        {points.slice(1).map((p, i) => {
          const r = sorted[i];
          const over = r?.status === 'over_budget';
          return (
            <View key={i} style={{
              position: 'absolute',
              left: p.x - 6, top: p.y - 6,
              width: 12, height: 12,
              borderRadius: 6,
              backgroundColor: over ? '#EF4444' : '#38BDF8',
              borderWidth: 2,
              borderColor: '#0D1422',
            }}>
              {/* Tooltip bubble */}
              <View style={ch.tooltip}>
                <Text style={ch.tooltipText}>{r?.units_consumed_so_far}kWh</Text>
                <Text style={ch.tooltipSub}>Day {r?.days_elapsed}</Text>
              </View>
            </View>
          );
        })}

        {/* Today marker */}
        {latestPoint && (
          <View style={[ch.todayLine, { left: latestPoint.x }]} />
        )}
      </View>

      {/* Summary below chart */}
      <View style={ch.summary}>
        <View style={ch.summaryCell}>
          <Text style={[ch.summaryVal, { color: '#38BDF8' }]}>{latestReading?.units_consumed_so_far || 0} kWh</Text>
          <Text style={ch.summaryLbl}>Used so far</Text>
        </View>
        <View style={ch.summaryDivider} />
        <View style={ch.summaryCell}>
          <Text style={[ch.summaryVal, { color: '#FBBF24' }]}>{Math.round(dailyTarget * (latestReading?.days_elapsed || 0))} kWh</Text>
          <Text style={ch.summaryLbl}>Target at day {latestReading?.days_elapsed || 0}</Text>
        </View>
        <View style={ch.summaryDivider} />
        <View style={ch.summaryCell}>
          <Text style={[ch.summaryVal, { color: isOver ? '#EF4444' : '#34D399' }]}>
            {projectedUnits ? Math.round(projectedUnits) : '—'} kWh
          </Text>
          <Text style={ch.summaryLbl}>Projected total</Text>
        </View>
      </View>

      {/* Status banner */}
      <View style={[ch.statusBanner, { backgroundColor: isOver ? '#EF444415' : '#34D39915', borderColor: isOver ? '#EF4444' : '#34D399' }]}>
        <Text style={[ch.statusText, { color: isOver ? '#EF4444' : '#34D399' }]}>
          {isOver
            ? `⚠️ Over target by ${((latestReading?.units_consumed_so_far || 0) - Math.round(dailyTarget * (latestReading?.days_elapsed || 0)))} kWh — Projected Rs. ${Math.round(latestReading?.projected_total_cost || 0).toLocaleString()} vs budget Rs. ${Math.round(plan?.target_budget || 0).toLocaleString()}`
            : `✅ On track — ${Math.round(dailyTarget * (latestReading?.days_elapsed || 0)) - (latestReading?.units_consumed_so_far || 0)} kWh under target`
          }
        </Text>
      </View>
    </Animated.View>
  );
};

const ch = StyleSheet.create({
  wrap: { backgroundColor: '#080F1C', borderRadius: 16, padding: 16, marginBottom: 12 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { color: '#475569', fontSize: 13, textAlign: 'center' },
  legend: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#64748B', fontSize: 11, fontWeight: '600' },
  canvas: { position: 'relative', marginBottom: 4 },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#1E293B40' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#1E293B40' },
  gridLabel: { position: 'absolute', right: 2, top: -10, color: '#334155', fontSize: 8 },
  gridLabelX: { position: 'absolute', bottom: -16, left: -8, color: '#334155', fontSize: 8 },
  todayLine: { position: 'absolute', top: 0, bottom: 0, width: 1.5, backgroundColor: '#38BDF850' },
  tooltip: {
    position: 'absolute', bottom: 14, left: -20,
    backgroundColor: '#1E293B', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 3,
    minWidth: 50, alignItems: 'center',
    borderWidth: 1, borderColor: '#38BDF840',
  },
  tooltipText: { color: '#F1F5F9', fontSize: 9, fontWeight: '700' },
  tooltipSub: { color: '#64748B', fontSize: 8 },
  summary: { flexDirection: 'row', marginTop: 20, marginBottom: 12 },
  summaryCell: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 15, fontWeight: '800' },
  summaryLbl: { color: '#475569', fontSize: 10, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: '#1E293B', marginVertical: 4 },
  statusBanner: {
    borderRadius: 10, padding: 10, borderWidth: 1,
  },
  statusText: { fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 18 },
});

// ─── AI Recommendation Card ────────────────────────────────────────────────────
const AIRecCard = ({ rec, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: Platform.OS !== 'web' }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
    }, index * 120);
  }, []);

  const catColors = {
    cooling: '#38BDF8', heating: '#FB923C', cooking: '#FBBF24',
    entertainment: '#A78BFA', laundry: '#F472B6', lighting: '#FDE68A',
    other: '#64748B',
  };
  const cat = (rec.category || 'other').toLowerCase();
  const color = catColors[cat] || catColors.other;

  return (
    <Animated.View style={[rc.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }], borderLeftColor: color }]}>
      <View style={rc.header}>
        <View style={[rc.iconBox, { backgroundColor: color + '20' }]}>
          <Text style={rc.icon}>⚡</Text>
        </View>
        <View style={rc.titleBox}>
          <Text style={rc.appName}>{rec.appliance_name || 'Appliance'}</Text>
          <View style={rc.badgeRow}>
            <View style={[rc.badge, { backgroundColor: color + '25' }]}>
              <Text style={[rc.badgeText, { color }]}>{rec.impact_percentage?.toFixed(0) || '—'}% of usage</Text>
            </View>
          </View>
        </View>
        <View style={rc.savingBox}>
          <Text style={rc.savingAmt}>-{rec.suggested_reduction_kwh || 0} kWh</Text>
          <Text style={rc.savingLbl}>save/day</Text>
        </View>
      </View>

      <View style={rc.tipBox}>
        <Text style={rc.tipText}>💡 {rec.actionable_tip}</Text>
      </View>

      <View style={rc.stats}>
        <View style={rc.statItem}>
          <Text style={[rc.statVal, { color: '#34D399' }]}>{rec.suggested_reduction_hours || 0}h</Text>
          <Text style={rc.statLbl}>Reduce daily</Text>
        </View>
        <View style={rc.statDivider} />
        <View style={rc.statItem}>
          <Text style={[rc.statVal, { color: '#38BDF8' }]}>
            Rs. {Math.round(rec.potential_monthly_saving || 0).toLocaleString()}
          </Text>
          <Text style={rc.statLbl}>Monthly saving</Text>
        </View>
        <View style={rc.statDivider} />
        <View style={rc.statItem}>
          <Text style={[rc.statVal, { color: '#FBBF24' }]}>{rec.category || '—'}</Text>
          <Text style={rc.statLbl}>Category</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const rc = StyleSheet.create({
  card: {
    backgroundColor: '#080F1C', borderRadius: 16, padding: 16,
    marginBottom: 12, borderLeftWidth: 3, borderWidth: 1, borderColor: '#1E293B',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  icon: { fontSize: 18 },
  titleBox: { flex: 1 },
  appName: { color: '#F1F5F9', fontSize: 15, fontWeight: '700' },
  badgeRow: { flexDirection: 'row', marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  savingBox: { alignItems: 'flex-end' },
  savingAmt: { color: '#34D399', fontSize: 14, fontWeight: '800' },
  savingLbl: { color: '#475569', fontSize: 10 },
  tipBox: { backgroundColor: '#1E293B40', borderRadius: 10, padding: 10, marginBottom: 10 },
  tipText: { color: '#94A3B8', fontSize: 13, lineHeight: 19 },
  stats: { flexDirection: 'row', backgroundColor: '#1E293B30', borderRadius: 10, padding: 10 },
  statItem: { flex: 1, alignItems: 'center' },
  fabMax: { fontSize: 10, color: '#94A3B8' },
  stopBtn: {
    marginTop: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EF444450',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#EF444410',
  },
  stopBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  statVal: { fontSize: 13, fontWeight: '800' },
  statLbl: { color: '#475569', fontSize: 9, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#1E293B', marginVertical: 2 },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
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
  const [freshRecs, setFreshRecs] = useState(null); // recs direct from submit response
  const [editingReading, setEditingReading] = useState(null);
  const [readingDate, setReadingDate] = useState('');
  const [readingTime, setReadingTime] = useState('');
  const [activeTab, setActiveTab] = useState('status');

  const account = selectedAccount;

  const fetchData = useCallback(async () => {
    if (!account) { setLoading(false); return; }
    try {
      const plansRes = await analysisAPI.getPlansByAccount(account, true);
      const planList = plansRes.data?.plans || [];
      setPlans(planList);

      const activePlan = planList[0] || null;
      setSelectedPlan(activePlan);
      setFreshRecs(null); // reset when plan changes

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
    if (reading) {
      setEditingReading(reading);
      setReadingInput(reading.reading_value.toString());
      setNotes(reading.notes || '');
      const rDate = new Date(reading.reading_date);
      setReadingDate(rDate.toISOString().split('T')[0]);
      setReadingTime(rDate.toTimeString().split(' ')[0].substring(0, 5));
    } else {
      setEditingReading(null);
      setReadingInput('');
      setNotes('');
      setReadingDate(now.toISOString().split('T')[0]);
      setReadingTime(now.toTimeString().split(' ')[0].substring(0, 5));
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

    const startReading = selectedPlan?.reference_bill_current_reading;
    if (startReading && val < startReading) {
      Alert.alert('Invalid Reading', `Reading must be ≥ ${startReading}`);
      return;
    }

    setSubmitting(true);
    try {
      const combinedDate = new Date(`${readingDate}T${readingTime}:00`).toISOString();
      let res;

      if (editingReading) {
        res = await analysisAPI.updateReading(editingReading.id, {
          reading_value: val,
          reading_date: combinedDate,
          notes: notes || null,
        });
      } else {
        res = await analysisAPI.trackProgress(selectedPlan.id, val, combinedDate, notes || null);
      }

      if (res.data.success) {
        // Capture recs directly from response (before fetchData overwrites state)
        if (res.data.appliance_recommendations?.length > 0) {
          setFreshRecs(res.data.appliance_recommendations);
        }
        await fetchData();
        const progress = res.data.progress || res.data.reading?.analysis_data;
        const status = progress?.current_status?.status || res.data.reading?.status;

        let title = editingReading ? '✅ Updated' : '✅ Reading Saved';
        let msg = '';
        if (status === 'over_budget') {
          title = '⚠️ Over Budget!';
          msg = `You're over target.\nVariance: +${formatCurrency(progress?.current_status?.variance_cost || 0)}\nProjected: ${formatCurrency(progress?.projection?.projected_total_cost || 0)}`;
        } else if (status === 'under_budget') {
          title = '🎉 Under Budget!';
          msg = `Great work! Projected savings: ${formatCurrency(Math.abs(progress?.projection?.budget_variance || 0))}`;
        } else {
          msg = `On track ✓\nDay ${progress?.current_status?.days_elapsed} · ${progress?.current_status?.units_used} kWh used`;
        }
        Alert.alert(title, msg);
        setShowReadingModal(false);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to record reading.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStopTracking = async () => {
    if (!selectedPlan) return;
    console.log(`🔘 Stop tracking pressed (TrackingScreen): ${selectedPlan.id}`);

    universalAlert(
      'Stop Tracking',
      'Are you sure you want to end this budget plan? This is usually done when you receive a new monthly bill.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop Tracking',
          style: 'destructive',
          onPress: async () => {
            console.log('🏃 Stopping tracking...');
            try {
              setLoading(true);
              const res = await analysisAPI.endPlan(selectedPlan.id);
              console.log('✅ End plan response:', res.data);
              if (res.data?.success) {
                universalAlert('Success', 'Budget plan ended. You can now create a new plan for the next month.');
              } else {
                universalAlert('Notice', res.data?.message || 'Plan ended.');
              }
              await fetchData();
            } catch (err) {
              console.error('❌ Stop tracking error:', err);
              universalAlert('Error', 'Failed to stop tracking');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSetPriority = async () => {
    if (!selectedPlan) return;
    try {
      await analysisAPI.setPlanPriority(selectedPlan.id);
      fetchData(); // reload
    } catch (e) {
      console.error(e);
      universalAlert('Error', 'Failed to set priority');
    }
  };

  const deleteReading = (readingId) => {
    console.log(`🔘 Delete reading pressed: ${readingId}`);
    universalAlert('Delete Reading', 'Remove this meter reading?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          console.log(`🏃 Deleting reading ID: ${readingId}...`);
          try {
            const res = await analysisAPI.deleteReading(readingId);
            console.log('✅ Delete reading response:', res.data);
            universalAlert('Success', 'Reading removed.');
            await fetchData();
          } catch (err) {
            console.error('❌ Delete reading error:', err);
            universalAlert('Error', 'Could not delete reading.');
          }
        },
      },
    ]);
  };

  // Re-run recommendations by re-submitting the latest reading value
  const handleRefreshRecs = useCallback(async () => {
    if (!selectedPlan || !latestProgress) return;
    try {
      const res = await analysisAPI.trackProgress(
        selectedPlan.id,
        latestProgress.reading_value,
        latestProgress.reading_date,
        latestProgress.notes || null,
      );
      if (res.data?.appliance_recommendations?.length > 0) {
        setFreshRecs(res.data.appliance_recommendations);
      }
      await fetchData();
    } catch (e) {
      console.error('Refresh recs error:', e);
    }
  }, [selectedPlan, latestProgress, fetchData]);

  // Extract AI recommendations: prefer fresh response recs, fall back to DB stored ones
  const applianceRecs = freshRecs || latestProgress?.analysis_data?.appliance_recommendations || [];
  const isOverBudget = latestProgress?.status === 'over_budget';

  return (
    <View style={s.flex}>
      <View style={s.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ArrowLeft size={24} color="#F1F5F9" />
        </TouchableOpacity>
        <Text style={s.headerTitleMain}>Bill Tracking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            tintColor="#38BDF8"
          />
        }
      >
        {plans.length === 0 ? (
          <PremiumEmptyState
            icon="🎯"
            title="Master Your Energy Budget"
            subtitle="Transform your energy bills into actionable goals. Track consumption in real-time and stop bill surprises before they happen."
            features={[
              { icon: '📊', text: 'Daily Reading Tracker' },
              { icon: '🤖', text: 'AI-Powered Cost Projection' },
              { icon: '⚡', text: 'Smart Appliance Recommendations' }
            ]}
            action={() => navigation.navigate('Bills')}
            actionLabel="Start Your First Plan"
            footer="Analyze a past bill in the Bills tab to generate your custom budget plan."
          />
        ) : (
          <>
            {/* Plan Selector */}
            {plans.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                {plans.map((p, idx) => {
                  const isActive = selectedPlan?.id === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setSelectedPlan(p)}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 8,
                        borderRadius: 20, marginRight: 10,
                        backgroundColor: isActive ? '#38BDF820' : '#1E293B40',
                        borderWidth: 1, borderColor: isActive ? '#38BDF850' : '#1E293B',
                      }}
                    >
                      <Text style={{
                        color: isActive ? '#38BDF8' : '#94A3B8',
                        fontSize: 13, fontWeight: isActive ? '700' : '600',
                      }}>
                        {p.is_priority ? '⭐ ' : ''}Plan {idx + 1} (Rs.{p.target_budget})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Tab Bar */}
            <View style={s.tabBar}>
              {[['status', '📊 Status'], ['analysis', '🤖 AI Analysis']].map(([k, l]) => (
                <TouchableOpacity key={k} style={[s.tab, activeTab === k && s.tabOn]} onPress={() => setActiveTab(k)}>
                  <Text style={[s.tabTxt, activeTab === k && s.tabTxtOn]}>{l}</Text>
                  {activeTab === k && applianceRecs.length > 0 && k === 'analysis' && isOverBudget && (
                    <View style={s.recBadge}><Text style={s.recBadgeText}>{applianceRecs.length}</Text></View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {selectedPlan && activeTab === 'status' && (
              <>
                {/* Plan Overview */}
                <View style={s.planCard}>
                  <View style={s.planTop}>
                    <View>
                      <Text style={s.planBudgetLabel}>Target Budget</Text>
                      <AnimatedNum value={selectedPlan.target_budget || 0} style={s.planBudget} />
                      {!selectedPlan.is_priority && (
                        <TouchableOpacity onPress={handleSetPriority} style={{ marginTop: 4 }}>
                          <Text style={{ color: '#FBBF24', fontSize: 12, fontWeight: '600' }}>⭐ Set as Priority</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={[s.statusPill, {
                      backgroundColor: getStatusColor(selectedPlan.progress_status) + '25',
                      borderColor: getStatusColor(selectedPlan.progress_status) + '60',
                    }]}>
                      <View style={[s.statusDot, { backgroundColor: getStatusColor(selectedPlan.progress_status) }]} />
                      <Text style={[s.statusTxt, { color: getStatusColor(selectedPlan.progress_status) }]}>
                        {getStatusLabel(selectedPlan.progress_status)}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 6, marginBottom: 8 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
                        borderColor: '#64748B40', backgroundColor: '#1E293B30',
                        alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6
                      }}
                      onPress={handleStopTracking}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 16 }}>⏹️</Text>
                      <Text style={{ color: '#F1F5F9', fontSize: 13, fontWeight: '700' }}>Stop Plan</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
                        borderColor: '#EF444440', backgroundColor: '#EF444415',
                        alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6
                      }}
                      onPress={() => {
                        universalAlert('Delete Plan', 'Are you sure you want to permanently delete this plan?', [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                const res = await analysisAPI.deletePlan(selectedPlan.id);
                                if (res.data?.success) fetchData();
                              } catch (err) {
                                universalAlert('Error', 'Failed to delete plan.');
                              }
                            },
                          },
                        ]);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 16 }}>🗑️</Text>
                      <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '700' }}>Delete Plan</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={s.planStats}>
                    {[
                      { icon: '📅', val: `${selectedPlan.planning_days}d`, lbl: 'Duration' },
                      { icon: '⚡', val: `${selectedPlan.target_daily_units?.toFixed(1)} kWh`, lbl: 'Daily target' },
                      { icon: '💰', val: `Rs.${selectedPlan.target_daily_cost?.toFixed(0)}`, lbl: 'Budget/day' },
                    ].map((item, i) => (
                      <View key={i} style={s.planStat}>
                        <Text style={s.planStatIcon}>{item.icon}</Text>
                        <Text style={s.planStatVal}>{item.val}</Text>
                        <Text style={s.planStatLbl}>{item.lbl}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Timeline */}
                  <View style={s.timeline}>
                    <View style={s.timelineNode}>
                      <Text style={s.timelineDate}>{formatDate(selectedPlan.plan_start_date)}</Text>
                      <Text style={s.timelineLbl}>Start</Text>
                    </View>
                    <View style={s.timelineTrack}>
                      {latestProgress && (
                        <View style={[s.timelineProgress, {
                          width: `${Math.min((latestProgress.days_elapsed / selectedPlan.planning_days) * 100, 100)}%`,
                          backgroundColor: isOverBudget ? '#EF4444' : '#38BDF8',
                        }]} />
                      )}
                    </View>
                    <View style={s.timelineNode}>
                      <Text style={s.timelineDate}>{formatDate(selectedPlan.plan_end_date)}</Text>
                      <Text style={s.timelineLbl}>End</Text>
                    </View>
                  </View>
                </View>

                {/* Current Status */}
                {latestProgress && (
                  <View style={[s.statusCard, { borderColor: getStatusColor(latestProgress.status) + '50' }]}>
                    <View style={s.statusRow}>
                      <View style={s.statusCol}>
                        <Text style={[s.bigNum, { color: getStatusColor(latestProgress.status) }]}>
                          {formatCurrency(latestProgress.actual_cost_so_far, 0)}
                        </Text>
                        <Text style={s.statusColLbl}>Spent so far</Text>
                      </View>
                      <View style={s.statusCol}>
                        <Text style={s.bigNum}>{formatCurrency(latestProgress.expected_cost_so_far, 0)}</Text>
                        <Text style={s.statusColLbl}>Expected</Text>
                      </View>
                      <View style={s.statusCol}>
                        <Text style={[s.bigNum, {
                          color: latestProgress.variance_cost > 0 ? '#EF4444' : '#34D399'
                        }]}>
                          {latestProgress.variance_cost > 0 ? '+' : ''}{formatCurrency(latestProgress.variance_cost, 0)}
                        </Text>
                        <Text style={s.statusColLbl}>Variance</Text>
                      </View>
                    </View>

                    {/* Progress bar */}
                    <View style={s.progressWrap}>
                      <View style={s.progressTrack}>
                        <Animated.View style={[s.progressFill, {
                          width: `${Math.min((latestProgress.actual_cost_so_far / selectedPlan.target_budget) * 100, 100)}%`,
                          backgroundColor: getStatusColor(latestProgress.status),
                        }]} />
                      </View>
                      <Text style={s.progressLabel}>
                        Day {latestProgress.days_elapsed} · {latestProgress.units_consumed_so_far} kWh · Projected {formatCurrency(latestProgress.projected_total_cost, 0)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Readings List */}
                <SectionHeader
                  title={`Readings (${readings.length}/8)`}
                  action={() => openModal()}
                  actionLabel="+ Add"
                />

                {/* Start reference */}
                {selectedPlan.reference_bill_current_reading != null && (
                  <View style={s.refReading}>
                    <View style={s.refLeft}>
                      <Text style={s.refDate}>{formatDate(selectedPlan.reference_bill_date)}</Text>
                      <Text style={s.refVal}>{selectedPlan.reference_bill_current_reading} kWh</Text>
                    </View>
                    <Text style={s.refLabel}>📌 Starting Reference</Text>
                  </View>
                )}

                {readings.length === 0 ? (
                  <View style={s.noReadingsCard}>
                    <Text style={s.noReadingsText}>No readings yet. Add your meter reading to begin tracking.</Text>
                  </View>
                ) : (
                  readings.map((r) => (
                    <ReadingCard key={r.id} reading={r} onEdit={() => openModal(r)} onDelete={() => deleteReading(r.id)} />
                  ))
                )}
              </>
            )}

            {selectedPlan && activeTab === 'analysis' && (
              <AnalysisTab
                readings={readings}
                plan={selectedPlan}
                applianceRecs={applianceRecs}
                isOverBudget={isOverBudget}
                latestProgress={latestProgress}
                onRefreshRecs={handleRefreshRecs}
              />
            )}
          </>
        )}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* FAB */}
      {selectedPlan && (
        <View style={s.fabArea}>
          <TouchableOpacity
            style={[s.fab, readings.length >= 8 && s.fabDisabled]}
            onPress={() => openModal()}
            disabled={readings.length >= 8}
            activeOpacity={0.85}
          >
            <Text style={s.fabIcon}>📱</Text>
            <Text style={s.fabTxt}>Submit Meter Reading</Text>
            {readings.length >= 8 && <Text style={s.fabMax}>(max 8)</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Reading Modal */}
      <Modal visible={showReadingModal} animationType="slide" transparent onRequestClose={() => setShowReadingModal(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowReadingModal(false)}>
          <TouchableOpacity style={s.sheet} activeOpacity={1}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>{editingReading ? '✏️ Edit Reading' : '📱 Submit Meter Reading'}</Text>

            {selectedPlan?.reference_bill_current_reading && (
              <View style={s.sheetHintBox}>
                <Text style={s.sheetHint}>Start: {selectedPlan.reference_bill_current_reading} kWh</Text>
              </View>
            )}

            <TextInput
              style={s.bigInput}
              value={readingInput}
              onChangeText={setReadingInput}
              placeholder="Current reading (e.g. 1462)"
              placeholderTextColor="#334155"
              keyboardType="numeric"
            />

            <View style={s.dtRow}>
              <View style={s.dtField}>
                <Text style={s.dtLabel}>Date</Text>
                <TextInput style={s.dtInput} value={readingDate} onChangeText={setReadingDate} placeholder="YYYY-MM-DD" placeholderTextColor="#334155" />
              </View>
              <View style={s.dtField}>
                <Text style={s.dtLabel}>Time</Text>
                <TextInput style={s.dtInput} value={readingTime} onChangeText={setReadingTime} placeholder="HH:MM" placeholderTextColor="#334155" />
              </View>
            </View>

            <TextInput
              style={[s.bigInput, { fontSize: 14, textAlign: 'left', minHeight: 60 }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes (optional)"
              placeholderTextColor="#334155"
              multiline
            />

            <TouchableOpacity
              style={[s.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={submitReading}
              disabled={submitting || !readingInput}
            >
              <Text style={s.submitTxt}>{submitting ? 'Saving…' : editingReading ? 'Update Reading' : 'Submit Reading'}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ─── Analysis Tab ─────────────────────────────────────────────────────────────
const AnalysisTab = ({ readings, plan, applianceRecs, isOverBudget, latestProgress, onRefreshRecs }) => (
  <ScrollView showsVerticalScrollIndicator={false}>
    <Text style={at.sectionTitle}>📈 Consumption Chart</Text>
    <ConsumptionChart readings={readings} plan={plan} />

    <Text style={at.sectionTitle}>🤖 AI Appliance Recommendations</Text>

    {applianceRecs.length > 0 ? (
      <>
        <View style={at.overBudgetBanner}>
          <Text style={at.overBudgetText}>
            {isOverBudget
              ? `⚠️ You're over budget. These appliances are the biggest contributors. Reduce their usage to get back on track.`
              : `✅ You're on track! Here are tips to stay efficient.`}
          </Text>
        </View>
        {applianceRecs.map((rec, i) => <AIRecCard key={i} rec={rec} index={i} />)}
      </>
    ) : (
      <View style={at.noRecCard}>
        <Text style={at.noRecIcon}>🔌</Text>
        <Text style={at.noRecTitle}>
          {readings.length === 0
            ? 'Add a meter reading first'
            : isOverBudget
              ? 'No recommendations yet'
              : "You're on track! No urgent recommendations."}
        </Text>
        <Text style={at.noRecSub}>
          {readings.length === 0
            ? 'Submit your current meter reading to get AI-powered appliance tips.'
            : isOverBudget
              ? 'Tap below to generate AI-powered tips based on your registered appliances.'
              : 'Keep monitoring your consumption every few days.'}
        </Text>
        {isOverBudget && readings.length > 0 && (
          <TouchableOpacity style={at.addBtn} onPress={onRefreshRecs}>
            <Text style={at.addBtnTxt}>🔄 Refresh Recommendations</Text>
          </TouchableOpacity>
        )}
      </View>
    )}
  </ScrollView>
);

const at = StyleSheet.create({
  sectionTitle: { color: '#F1F5F9', fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  overBudgetBanner: {
    backgroundColor: '#EF444415', borderRadius: 12, padding: 12,
    marginBottom: 12, borderWidth: 1, borderColor: '#EF444430',
  },
  overBudgetText: { color: '#FCA5A5', fontSize: 13, lineHeight: 19 },
  noRecCard: {
    backgroundColor: '#080F1C', borderRadius: 16, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: '#1E293B',
  },
  noRecIcon: { fontSize: 40, marginBottom: 12 },
  noRecTitle: { color: '#F1F5F9', fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  noRecSub: { color: '#64748B', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  addBtn: {
    marginTop: 16, backgroundColor: '#38BDF820', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: '#38BDF840',
  },
  addBtnTxt: { color: '#38BDF8', fontSize: 13, fontWeight: '700' },
});

// ─── Reading Card ─────────────────────────────────────────────────────────────
const ReadingCard = ({ reading, onEdit, onDelete }) => {
  const color = getStatusColor(reading.status);
  return (
    <View style={[rdc.card, { borderLeftColor: color }]}>
      <View style={rdc.top}>
        <View style={rdc.left}>
          <Text style={rdc.date}>{formatDate(reading.reading_date)}</Text>
          <Text style={rdc.val}>{reading.reading_value} kWh</Text>
        </View>
        <View style={rdc.mid}>
          <Text style={rdc.consumed}>{reading.units_consumed_so_far} consumed</Text>
          <View style={[rdc.badge, { backgroundColor: color + '20' }]}>
            <Text style={[rdc.badgeText, { color }]}>{getStatusLabel(reading.status)}</Text>
          </View>
        </View>
        <View style={rdc.right}>
          <Text style={[rdc.cost, { color }]}>{formatCurrency(reading.actual_cost_so_far, 0)}</Text>
          <View style={rdc.actions}>
            <TouchableOpacity style={rdc.actionBtn} onPress={onEdit}><Text style={rdc.actionIcon}>✏️</Text></TouchableOpacity>
            <TouchableOpacity style={rdc.actionBtn} onPress={onDelete}><Text style={rdc.actionIcon}>🗑️</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const rdc = StyleSheet.create({
  card: {
    backgroundColor: '#080F1C', borderRadius: 12, padding: 14,
    marginBottom: 8, borderLeftWidth: 3, borderWidth: 1, borderColor: '#1E293B',
  },
  top: { flexDirection: 'row', alignItems: 'center' },
  left: { flex: 1 },
  date: { color: '#475569', fontSize: 11 },
  val: { color: '#F1F5F9', fontSize: 16, fontWeight: '700' },
  mid: { flex: 1.2, alignItems: 'center' },
  consumed: { color: '#94A3B8', fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 3 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  right: { alignItems: 'flex-end' },
  cost: { fontSize: 14, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 4, marginTop: 4 },
  actionBtn: { padding: 4 },
  actionIcon: { fontSize: 14 },
});

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#060D18' },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 20,
    backgroundColor: '#0D1422',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: { padding: 4 },
  headerTitleMain: { ...FONTS.bold, fontSize: 18, color: '#F1F5F9' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#0D1422', borderRadius: 14,
    padding: 4, marginBottom: 14, borderWidth: 1, borderColor: '#1E293B',
  },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 10, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tabOn: { backgroundColor: '#38BDF8' },
  tabTxt: { color: '#475569', fontSize: 13, fontWeight: '700' },
  tabTxtOn: { color: '#060D18', fontWeight: '800' },
  recBadge: { backgroundColor: '#EF4444', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  recBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  planCard: {
    backgroundColor: '#0D1422', borderRadius: 20, padding: 20,
    marginBottom: 12, borderWidth: 1, borderColor: '#1E293B',
  },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  planBudgetLabel: { color: '#475569', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  planBudget: { color: '#38BDF8', fontSize: 26, fontWeight: '900' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusTxt: { fontSize: 12, fontWeight: '700' },
  planStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18 },
  planStat: { alignItems: 'center' },
  planStatIcon: { fontSize: 20, marginBottom: 4 },
  planStatVal: { color: '#F1F5F9', fontSize: 14, fontWeight: '700' },
  planStatLbl: { color: '#475569', fontSize: 10 },
  timeline: { flexDirection: 'row', alignItems: 'center' },
  timelineNode: { alignItems: 'center' },
  timelineDate: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  timelineLbl: { color: '#475569', fontSize: 9 },
  timelineTrack: {
    flex: 1, height: 6, backgroundColor: '#1E293B',
    borderRadius: 3, marginHorizontal: 10, overflow: 'hidden',
  },
  timelineProgress: { height: '100%', borderRadius: 3 },

  statusCard: {
    backgroundColor: '#0D1422', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  statusCol: { alignItems: 'center' },
  bigNum: { color: '#F1F5F9', fontSize: 17, fontWeight: '800' },
  statusColLbl: { color: '#475569', fontSize: 10, marginTop: 2 },
  progressWrap: {},
  progressTrack: { height: 8, backgroundColor: '#1E293B', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabel: { color: '#475569', fontSize: 11 },

  refReading: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#080F1C', borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: '#1E293B40',
    borderStyle: 'dashed',
  },
  refLeft: {},
  refDate: { color: '#334155', fontSize: 11 },
  refVal: { color: '#94A3B8', fontSize: 15, fontWeight: '600' },
  refLabel: { color: '#334155', fontSize: 12 },

  noReadingsCard: {
    backgroundColor: '#080F1C', borderRadius: 12, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#1E293B',
  },
  noReadingsText: { color: '#475569', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  fabArea: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: 28,
    backgroundColor: '#060D18CC',
    borderTopWidth: 1, borderTopColor: '#1E293B',
  },
  fab: {
    backgroundColor: '#38BDF8', borderRadius: 16, paddingVertical: 17,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  fabDisabled: { backgroundColor: '#1E293B' },
  fabIcon: { fontSize: 20 },
  fabTxt: { color: '#060D18', fontSize: 16, fontWeight: '800' },
  fabMax: { color: '#0284C780', fontSize: 12 },

  overlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0D1422', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: '#1E293B',
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: '#1E293B', borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle: { color: '#F1F5F9', fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  sheetHintBox: {
    backgroundColor: '#38BDF815', borderRadius: 10, padding: 8,
    marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#38BDF830',
  },
  sheetHint: { color: '#38BDF8', fontSize: 13, fontWeight: '600' },
  bigInput: {
    backgroundColor: '#080F1C', color: '#F1F5F9',
    borderRadius: 14, padding: 18, fontSize: 22, fontWeight: '800',
    borderWidth: 1.5, borderColor: '#1E293B', marginBottom: 12, textAlign: 'center',
  },
  dtRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  dtField: { flex: 1 },
  dtLabel: { color: '#475569', fontSize: 10, fontWeight: '700', marginBottom: 6, letterSpacing: 1 },
  dtInput: {
    backgroundColor: '#080F1C', color: '#F1F5F9',
    borderRadius: 10, padding: 12, fontSize: 14,
    borderWidth: 1, borderColor: '#1E293B',
  },
  submitBtn: {
    backgroundColor: '#38BDF8', borderRadius: 14, paddingVertical: 17,
    alignItems: 'center', marginTop: 8,
  },
  submitTxt: { color: '#060D18', fontSize: 16, fontWeight: '800' },
});

export default TrackingScreen;