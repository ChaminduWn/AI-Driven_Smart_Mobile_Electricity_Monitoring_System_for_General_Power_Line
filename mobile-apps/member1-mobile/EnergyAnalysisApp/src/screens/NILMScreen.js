import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { nilmAPI } from '../api/nilmAPI';
import { useAccount } from '../contexts/AccountContext';
import {
  Card, SectionHeader, EmptyState, LoadingScreen, PrimaryButton, InfoRow, Divider,
} from '../components/SharedComponents';
import { COLORS, SPACING, RADIUS, FONTS, SHADOW } from '../utils/theme';
import { getCategoryColor, formatKwh, getNILMExplanation } from '../utils/helpers';

const NILMScreen = ({ navigation }) => {
  const { selectedAccount } = useAccount();
  const [setup, setSetup] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

  const account = selectedAccount;

  useEffect(() => {
    if (!account) { setLoading(false); return; }
    (async () => {
      try {
        const [setupRes, accRes] = await Promise.allSettled([
          nilmAPI.verifySetup(account),
          nilmAPI.getAccuracyReport(account),
        ]);
        if (setupRes.status === 'fulfilled') setSetup(setupRes.value.data);
        if (accRes.status === 'fulfilled') setAccuracy(accRes.value.data);
      } catch (err) {
        console.error('NILM setup error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [account]);

  const runDisaggregation = async () => {
    if (!account) return;
    setRunning(true);
    try {
      const res = await nilmAPI.disaggregate(account);
      if (res.data.success) {
        setBreakdown(res.data.data);
      } else {
        Alert.alert('NILM Failed', res.data.message || res.data.suggestion || 'Could not run disaggregation.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'NILM disaggregation failed.');
    } finally {
      setRunning(false);
    }
  };

  const explanation = getNILMExplanation();

  if (loading) return <LoadingScreen message="Checking NILM setup..." />;

  if (!account) {
    return (
      <EmptyState
        icon="📡"
        title="No Account Selected"
        subtitle="Upload a bill first to set your account number."
        action={() => navigation.navigate('Bills')}
        actionLabel="Upload Bill"
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header / Explainer */}
      <Card style={styles.headerCard} accentColor={COLORS.success}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>⚡ NILM Disaggregation</Text>
            <Text style={styles.headerSub}>AI-powered appliance breakdown</Text>
          </View>
          <TouchableOpacity onPress={() => setShowExplainer(!showExplainer)}>
            <Text style={styles.infoBtn}>ℹ️</Text>
          </TouchableOpacity>
        </View>

        {showExplainer && (
          <>
            <Divider />
            <Text style={styles.explainTitle}>{explanation.title}</Text>
            <Text style={styles.explainBody}>{explanation.body}</Text>
          </>
        )}
      </Card>

      {/* Setup Status */}
      {setup && (
        <Card style={[styles.setupCard, { borderLeftColor: setup.is_ready ? COLORS.success : COLORS.warning }]}>
          <View style={styles.setupRow}>
            <Text style={styles.setupIcon}>{setup.is_ready ? '✅' : '⚠️'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.setupTitle}>{setup.status_message}</Text>
              <Text style={styles.setupMeta}>
                {setup.appliances_registered} appliances · {setup.bills_uploaded} bills
              </Text>
            </View>
          </View>
          {setup.issues?.length > 0 && (
            <View style={styles.issuesList}>
              {setup.issues.map((issue, i) => (
                <Text key={i} style={styles.issueText}>• {issue}</Text>
              ))}
            </View>
          )}
        </Card>
      )}

      {/* Accuracy Report */}
      {accuracy?.estimated_accuracy && (
        <Card>
          <Text style={styles.cardTitle}>Estimated Accuracy</Text>
          <View style={styles.accuracyRow}>
            <View style={[styles.accuracyCircle, { borderColor: accuracy.estimated_accuracy > 80 ? COLORS.success : COLORS.warning }]}>
              <Text style={styles.accuracyPct}>{accuracy.estimated_accuracy}%</Text>
              <Text style={styles.accuracyLabel}>{accuracy.confidence_level}</Text>
            </View>
            <View style={{ flex: 1, paddingLeft: SPACING.lg }}>
              <InfoRow label="Range" value={accuracy.expected_range} />
              <InfoRow label="Method" value="Bayesian + ML" />
              <InfoRow label="Appliances" value={accuracy.registered_appliances} />
            </View>
          </View>
          {accuracy.coverage_factors?.length > 0 && (
            <View style={styles.coverageList}>
              {accuracy.coverage_factors.map((f, i) => (
                <Text key={i} style={styles.coverageItem}>✓ {f}</Text>
              ))}
            </View>
          )}
        </Card>
      )}

      {/* Run Button */}
      <PrimaryButton
        label={running ? 'Running AI Analysis...' : '🤖 Run NILM Disaggregation'}
        onPress={runDisaggregation}
        loading={running}
        disabled={running || !setup?.is_ready}
        color={COLORS.success}
      />

      {!setup?.is_ready && (
        <View style={styles.notReadyHint}>
          <Text style={styles.notReadyText}>Register at least 3 appliances and 1 bill to run NILM.</Text>
          <View style={styles.notReadyBtns}>
            <TouchableOpacity onPress={() => navigation.navigate('Appliances')} style={styles.hintBtn}>
              <Text style={styles.hintBtnText}>Add Appliances →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Bills')} style={styles.hintBtn}>
              <Text style={styles.hintBtnText}>Upload Bill →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Results */}
      {breakdown && (
        <>
          <SectionHeader title="Disaggregation Results" />
          <Card>
            <InfoRow label="Total Analysed" value={`${breakdown.total_kwh?.toFixed(2)} kWh`} />
            <InfoRow label="Accounted" value={`${breakdown.accounted_percentage?.toFixed(1)}%`} valueColor={COLORS.success} />
            <InfoRow label="Method" value={breakdown.method || 'Bayesian Estimation'} />
          </Card>

          {breakdown.breakdown?.map((item, i) => (
            <ApplianceBreakdownCard key={i} item={item} total={breakdown.total_kwh} />
          ))}
        </>
      )}

      <View style={{ height: SPACING.xxxl }} />
    </ScrollView>
  );
};

const ApplianceBreakdownCard = ({ item, total }) => {
  const catColor = getCategoryColor(item.category);
  const pct = item.percentage || 0;

  return (
    <View style={styles.breakdownCard}>
      <View style={styles.breakdownHeader}>
        <View style={[styles.catDot, { backgroundColor: catColor }]} />
        <Text style={styles.breakdownName}>{item.appliance_name || item.appliance_id}</Text>
        <Text style={styles.breakdownPct}>{pct.toFixed(1)}%</Text>
      </View>

      {/* Bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: catColor }]} />
      </View>

      <View style={styles.breakdownMeta}>
        <Text style={styles.breakdownKwh}>{item.estimated_kwh?.toFixed(3)} kWh</Text>
        <Text style={styles.breakdownConf}>Confidence: {item.confidence ? `${(item.confidence * 100).toFixed(0)}%` : '—'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg1, padding: SPACING.lg },
  headerCard: {},
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  headerTitle: { color: COLORS.textPrimary, fontSize: 18, ...FONTS.bold },
  headerSub: { color: COLORS.textSecondary, fontSize: 13 },
  infoBtn: { fontSize: 24 },
  explainTitle: { color: COLORS.success, fontSize: 15, ...FONTS.semiBold, marginBottom: SPACING.sm },
  explainBody: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  setupCard: {},
  setupRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  setupIcon: { fontSize: 28 },
  setupTitle: { color: COLORS.textPrimary, fontSize: 15, ...FONTS.semiBold },
  setupMeta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  issuesList: { marginTop: SPACING.sm },
  issueText: { color: COLORS.warning, fontSize: 13 },
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, ...FONTS.semiBold, marginBottom: SPACING.md },
  accuracyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  accuracyCircle: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 3,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.bg3,
  },
  accuracyPct: { color: COLORS.textPrimary, fontSize: 20, ...FONTS.bold },
  accuracyLabel: { color: COLORS.textSecondary, fontSize: 11 },
  coverageList: { marginTop: SPACING.sm },
  coverageItem: { color: COLORS.success, fontSize: 13, marginBottom: 2 },
  notReadyHint: { marginTop: SPACING.md },
  notReadyText: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: SPACING.md },
  notReadyBtns: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.md },
  hintBtn: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border,
  },
  hintBtnText: { color: COLORS.primary, ...FONTS.medium },
  breakdownCard: {
    backgroundColor: COLORS.bg2, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  breakdownHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  catDot: { width: 10, height: 10, borderRadius: 5, marginRight: SPACING.sm },
  breakdownName: { color: COLORS.textPrimary, flex: 1, fontSize: 14, ...FONTS.medium },
  breakdownPct: { color: COLORS.textSecondary, fontSize: 13 },
  barTrack: { height: 6, backgroundColor: COLORS.bg3, borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: SPACING.sm },
  barFill: { height: 6, borderRadius: RADIUS.full },
  breakdownMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownKwh: { color: COLORS.success, fontSize: 13, ...FONTS.medium },
  breakdownConf: { color: COLORS.textMuted, fontSize: 12 },
});

export default NILMScreen;