import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity,
  Modal, TextInput, RefreshControl, FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { appliancesAPI } from '../api/appliancesAPI';
import { useAccount } from '../contexts/AccountContext';
import {
  Card, SectionHeader, EmptyState, LoadingScreen, PrimaryButton, SecondaryButton,
  Badge, Divider,
} from '../components/SharedComponents';
import { COLORS, SPACING, RADIUS, FONTS, SHADOW } from '../utils/theme';
import { formatCurrency, formatKwh, getCategoryColor } from '../utils/helpers';

const FREQUENCIES = ['daily', 'weekly', 'monthly'];
const CATEGORIES = ['Cooling', 'Heating', 'Cooking', 'Cleaning', 'Entertainment', 'Lighting', 'Other'];

const AppliancesScreen = ({ navigation }) => {
  const { selectedAccount } = useAccount();
  const [appliances, setAppliances] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [savingApp, setSavingApp] = useState(false);
  const [tab, setTab] = useState('list'); // list | analysis

  const emptyForm = {
    appliance_name: '', appliance_category: 'Other', wattage: '',
    usage_duration_minutes: '60', usage_times_per_day: '1', usage_frequency: 'daily',
  };
  const [form, setForm] = useState(emptyForm);
  const [commonAppliances, setCommonAppliances] = useState([]);

  const account = selectedAccount;

  const fetchData = useCallback(async () => {
    if (!account) { setLoading(false); return; }
    try {
      const [appRes, anaRes] = await Promise.allSettled([
        appliancesAPI.getByAccount(account),
        appliancesAPI.analyze(account),
      ]);
      if (appRes.status === 'fulfilled') setAppliances(appRes.value.data?.appliances || []);
      if (anaRes.status === 'fulfilled' && anaRes.value.data?.success) setAnalysis(anaRes.value.data);
    } catch (err) {
      console.error('Appliances fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [account]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    (async () => {
      try {
        const res = await appliancesAPI.getCommonAppliances();
        setCommonAppliances(res.data?.appliances || []);
      } catch (_) {}
    })();
  }, []);

  const scanImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access needed for AI scan.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [4, 3], quality: 0.7,
    });
    if (result.canceled) return;
    recognizeAppliance(result.assets[0]);
  };

  const recognizeAppliance = async (asset) => {
    setScanning(true);
    const fd = new FormData();
    fd.append('file', {
      uri: asset.uri,
      name: asset.uri.split('/').pop() || 'appliance.jpg',
      type: 'image/jpeg',
    });
    try {
      const res = await appliancesAPI.recognizeFromImage(fd);
      if (res.data.success) {
        const s = res.data.suggested_values;
        setForm({
          appliance_name: s.appliance_name,
          appliance_category: s.appliance_category || 'Other',
          wattage: s.wattage?.toString() || '',
          usage_duration_minutes: s.usage_duration_minutes?.toString() || '60',
          usage_times_per_day: s.usage_times_per_day?.toString() || '1',
          usage_frequency: s.usage_frequency || 'daily',
        });
        Alert.alert('✅ Recognised!', `${s.appliance_name}\n${s.wattage}W — Please verify before saving.`);
      } else {
        Alert.alert('Not Recognised', res.data.message || 'Could not detect appliance. Enter manually.');
      }
    } catch (err) {
      Alert.alert('Scan Failed', 'Could not process image.');
    } finally {
      setScanning(false);
    }
  };

  const useTemplate = (template) => {
    setForm({
      appliance_name: template.name,
      appliance_category: template.category,
      wattage: template.typical_wattage?.toString() || '',
      usage_duration_minutes: '60',
      usage_times_per_day: '1',
      usage_frequency: 'daily',
    });
  };

  const saveAppliance = async () => {
    if (!form.appliance_name.trim() || !form.wattage) {
      Alert.alert('Validation', 'Name and wattage are required.');
      return;
    }
    if (!account) {
      Alert.alert('No Account', 'Upload a bill first to get an account number.');
      return;
    }
    setSavingApp(true);
    try {
      const payload = {
        appliance_name: form.appliance_name.trim(),
        appliance_category: form.appliance_category,
        wattage: parseInt(form.wattage),
        usage_duration_minutes: parseInt(form.usage_duration_minutes) || 60,
        usage_times_per_day: parseInt(form.usage_times_per_day) || 1,
        usage_frequency: form.usage_frequency,
        account_number: account,
      };
      const res = await appliancesAPI.add(payload);
      if (res.data.success) {
        Alert.alert('✅ Added!', `Monthly: ~${res.data.monthly_kwh?.toFixed(1) || '—'} kWh · Est. Rs. ${res.data.estimated_cost?.toFixed(0) || '—'}`);
        setShowModal(false);
        setForm(emptyForm);
        fetchData();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to add appliance.');
    } finally {
      setSavingApp(false);
    }
  };

  const deleteAppliance = (app) => {
    Alert.alert('Delete Appliance', `Remove ${app.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await appliancesAPI.delete(app.id);
            fetchData();
          } catch { Alert.alert('Error', 'Failed to delete.'); }
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen message="Loading appliances..." />;

  return (
    <View style={styles.flex}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'list' && styles.tabActive]} onPress={() => setTab('list')}>
          <Text style={[styles.tabText, tab === 'list' && styles.tabTextActive]}>My Appliances ({appliances.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'analysis' && styles.tabActive]} onPress={() => setTab('analysis')}>
          <Text style={[styles.tabText, tab === 'analysis' && styles.tabTextActive]}>Analysis</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.primary} />}
      >
        {tab === 'list' ? (
          <>
            {appliances.length < 5 && (
              <View style={styles.hintCard}>
                <Text style={styles.hintText}>
                  ⚡ Add at least 5 appliances to unlock Budget Planning · {appliances.length}/5 added
                </Text>
                <View style={styles.hintBar}>
                  <View style={[styles.hintFill, { width: `${(appliances.length / 5) * 100}%` }]} />
                </View>
              </View>
            )}

            {appliances.length === 0 ? (
              <EmptyState icon="⚡" title="No Appliances" subtitle="Add your household appliances to track energy consumption." />
            ) : (
              appliances.map((app) => (
                <ApplianceCard key={app.id} appliance={app} onDelete={() => deleteAppliance(app)} />
              ))
            )}
          </>
        ) : (
          <AnalysisTab analysis={analysis} navigation={navigation} account={account} />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.fabArea}>
        <PrimaryButton label="⚡ Add Appliance" onPress={() => setShowModal(true)} />
      </View>

      {/* Add Appliance Modal */}
      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Appliance</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {/* AI Scan */}
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={scanImage}
              disabled={scanning}
            >
              <Text style={styles.scanIcon}>{scanning ? '⏳' : '📷'}</Text>
              <View>
                <Text style={styles.scanTitle}>{scanning ? 'Scanning...' : 'AI Scan Appliance'}</Text>
                <Text style={styles.scanSub}>Camera recognises appliance & wattage</Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.orText}>— or choose a template —</Text>

            {/* Common appliance templates */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templates}>
              {commonAppliances.slice(0, 8).map((t, i) => (
                <TouchableOpacity key={i} style={styles.templateChip} onPress={() => useTemplate(t)}>
                  <Text style={styles.templateName}>{t.name}</Text>
                  <Text style={styles.templateWatt}>{t.typical_wattage}W</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Divider style={{ marginVertical: SPACING.md }} />

            {/* Form Fields */}
            <FormField label="Appliance Name *" value={form.appliance_name} onChange={(v) => setForm({ ...form, appliance_name: v })} placeholder="e.g. Samsung Refrigerator" />
            <FormField label="Wattage (W) *" value={form.wattage} onChange={(v) => setForm({ ...form, wattage: v })} placeholder="e.g. 150" keyboardType="numeric" />

            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, form.appliance_category === cat && { backgroundColor: getCategoryColor(cat), borderColor: getCategoryColor(cat) }]}
                  onPress={() => setForm({ ...form, appliance_category: cat })}
                >
                  <Text style={[styles.chipText, form.appliance_category === cat && { color: '#fff' }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <FormField label="Minutes/use" value={form.usage_duration_minutes} onChange={(v) => setForm({ ...form, usage_duration_minutes: v })} keyboardType="numeric" />
              </View>
              <View style={{ width: SPACING.md }} />
              <View style={{ flex: 1 }}>
                <FormField label="Times/day" value={form.usage_times_per_day} onChange={(v) => setForm({ ...form, usage_times_per_day: v })} keyboardType="numeric" />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Frequency</Text>
            <View style={styles.freqRow}>
              {FREQUENCIES.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.freqBtn, form.usage_frequency === f && styles.freqBtnActive]}
                  onPress={() => setForm({ ...form, usage_frequency: f })}
                >
                  <Text style={[styles.freqText, form.usage_frequency === f && styles.freqTextActive]}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <PrimaryButton label="Save Appliance" onPress={saveAppliance} loading={savingApp} disabled={savingApp} style={{ marginTop: SPACING.xl }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const FormField = ({ label, value, onChange, placeholder, keyboardType }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value?.toString()}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textMuted}
      keyboardType={keyboardType}
    />
  </View>
);

const ApplianceCard = ({ appliance, onDelete }) => {
  const catColor = getCategoryColor(appliance.category);
  return (
    <View style={[styles.appCard, { borderLeftColor: catColor }]}>
      <View style={styles.appCardBody}>
        <View style={styles.appCardLeft}>
          <Text style={styles.appName}>{appliance.name}</Text>
          <Text style={styles.appMeta}>{appliance.category} · {appliance.wattage}W</Text>
          <Text style={styles.appUsage}>{appliance.usage}</Text>
        </View>
        <View style={styles.appCardRight}>
          <Text style={styles.appCost}>{formatCurrency(appliance.estimated_cost, 0)}</Text>
          <Text style={styles.appKwh}>{appliance.monthly_kwh?.toFixed(1)} kWh/mo</Text>
          <TouchableOpacity onPress={onDelete} style={{ marginTop: SPACING.sm }}>
            <Text style={styles.deleteBtn}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const AnalysisTab = ({ analysis, navigation, account }) => {
  if (!analysis || !analysis.summary) {
    return <EmptyState icon="📊" title="No Analysis Available" subtitle="Add appliances to see consumption analysis." />;
  }
  return (
    <>
      <Card style={{ marginBottom: SPACING.md }}>
        <Text style={styles.cardTitle}>📊 Consumption Summary</Text>
        <View style={styles.statsRow}>
          <StatMini label="Appliances" value={analysis.summary.total_appliances} />
          <StatMini label="Daily kWh" value={analysis.summary.total_daily_kwh?.toFixed(2)} />
          <StatMini label="Monthly kWh" value={analysis.summary.total_monthly_kwh?.toFixed(1)} />
        </View>
        <Text style={styles.bigCost}>{formatCurrency(analysis.summary.estimated_monthly_cost)}/mo</Text>
      </Card>

      {analysis.by_category?.length > 0 && (
        <Card>
          <Text style={styles.cardTitle}>🏷️ By Category</Text>
          {analysis.by_category.map((cat, i) => (
            <View key={i} style={styles.catRow}>
              <View style={[styles.catDot, { backgroundColor: getCategoryColor(cat.category) }]} />
              <Text style={styles.catName}>{cat.category}</Text>
              <Text style={styles.catPct}>{cat.percentage}%</Text>
              <Text style={styles.catCost}>{formatCurrency(cat.monthly_cost, 0)}</Text>
            </View>
          ))}
        </Card>
      )}

      {analysis.high_consumers?.appliances?.length > 0 && (
        <Card>
          <Text style={styles.cardTitle}>⚠️ High Consumers</Text>
          {analysis.high_consumers.appliances.map((app, i) => (
            <View key={i} style={styles.highRow}>
              <Text style={styles.highName}>{app.name}</Text>
              <Text style={styles.highPct}>{app.percentage}% · {formatCurrency(app.estimated_monthly_cost, 0)}</Text>
            </View>
          ))}
        </Card>
      )}
    </>
  );
};

const StatMini = ({ label, value }) => (
  <View style={{ flex: 1, alignItems: 'center' }}>
    <Text style={{ color: COLORS.textPrimary, fontSize: 18, ...FONTS.bold }}>{value}</Text>
    <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>{label}</Text>
  </View>
);

const { formatCurrency: fmtCur } = require('../utils/helpers');

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg1 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg2,
    margin: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.md },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontSize: 13, ...FONTS.medium },
  tabTextActive: { color: '#fff', ...FONTS.semiBold },
  container: { flex: 1, paddingHorizontal: SPACING.lg },
  hintCard: {
    backgroundColor: COLORS.primary + '22',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
  },
  hintText: { color: COLORS.primaryLight, fontSize: 13, marginBottom: SPACING.sm },
  hintBar: { backgroundColor: COLORS.bg3, borderRadius: RADIUS.full, height: 6, overflow: 'hidden' },
  hintFill: { height: 6, backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
  appCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    ...SHADOW.sm,
  },
  appCardBody: { flexDirection: 'row', justifyContent: 'space-between' },
  appCardLeft: { flex: 1 },
  appName: { color: COLORS.textPrimary, fontSize: 16, ...FONTS.semiBold },
  appMeta: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  appUsage: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  appCardRight: { alignItems: 'flex-end' },
  appCost: { color: COLORS.success, fontSize: 17, ...FONTS.bold },
  appKwh: { color: COLORS.textSecondary, fontSize: 12 },
  deleteBtn: { fontSize: 18 },
  fabArea: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: SPACING.lg, backgroundColor: COLORS.bg1,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  modalContainer: { flex: 1, backgroundColor: COLORS.bg1 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.lg, paddingTop: SPACING.xl,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { color: COLORS.textPrimary, fontSize: 20, ...FONTS.bold },
  modalClose: { color: COLORS.textSecondary, fontSize: 22, padding: SPACING.sm },
  modalBody: { flex: 1, padding: SPACING.lg },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.secondary + '22',
    borderRadius: RADIUS.lg, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.secondary + '44',
    marginBottom: SPACING.md,
  },
  scanIcon: { fontSize: 36 },
  scanTitle: { color: COLORS.secondary, fontSize: 16, ...FONTS.semiBold },
  scanSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  orText: { color: COLORS.textMuted, textAlign: 'center', marginVertical: SPACING.sm, fontSize: 13 },
  templates: { marginBottom: SPACING.md },
  templateChip: {
    backgroundColor: COLORS.bg3, borderRadius: RADIUS.md,
    padding: SPACING.md, marginRight: SPACING.sm, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, minWidth: 100,
  },
  templateName: { color: COLORS.textPrimary, fontSize: 12, ...FONTS.medium, textAlign: 'center' },
  templateWatt: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  fieldWrap: { marginBottom: SPACING.md },
  fieldLabel: { color: COLORS.textSecondary, fontSize: 13, ...FONTS.medium, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.bg3, color: COLORS.textPrimary,
    borderRadius: RADIUS.md, padding: SPACING.md, fontSize: 15,
    borderWidth: 1, borderColor: COLORS.border,
  },
  chips: { marginBottom: SPACING.md },
  chip: {
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderWidth: 1, borderColor: COLORS.border, marginRight: SPACING.sm,
    backgroundColor: COLORS.bg3,
  },
  chipText: { color: COLORS.textSecondary, fontSize: 13 },
  row: { flexDirection: 'row' },
  freqRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  freqBtn: {
    flex: 1, padding: SPACING.md, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  freqBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  freqText: { color: COLORS.textSecondary, ...FONTS.medium },
  freqTextActive: { color: '#fff' },
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, ...FONTS.semiBold, marginBottom: SPACING.md },
  statsRow: { flexDirection: 'row', marginBottom: SPACING.md },
  bigCost: { color: COLORS.success, fontSize: 26, ...FONTS.bold, textAlign: 'center' },
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm },
  catDot: { width: 10, height: 10, borderRadius: 5, marginRight: SPACING.sm },
  catName: { color: COLORS.textPrimary, flex: 1, fontSize: 14 },
  catPct: { color: COLORS.textSecondary, marginRight: SPACING.sm, fontSize: 13 },
  catCost: { color: COLORS.success, fontSize: 13, ...FONTS.medium },
  highRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs },
  highName: { color: COLORS.textPrimary, fontSize: 14 },
  highPct: { color: COLORS.danger, fontSize: 13 },
});

export default AppliancesScreen;