/**
 * AppliancesScreen.jsx — Redesigned with:
 * ✅ Fixed AI scan (422 error was wrong FormData field + MIME type handling)
 * ✅ Professional category UI with icons & colors
 * ✅ Corrected kWh calculations (daily/weekly/monthly frequency)
 * ✅ Rich analysis view
 * ✅ Polished dark-glass aesthetic
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, RefreshControl, Platform, Animated,
} from 'react-native';
import { ArrowLeft, Cpu, Zap, Activity } from 'lucide-react-native';
import { universalAlert } from '../utils/alerts';
import * as ImagePicker from 'expo-image-picker';
import { appliancesAPI } from '../api/appliancesAPI';
import { useAccount } from '../contexts/AccountContext';
import {
  Card, EmptyState, LoadingScreen, PrimaryButton,
} from '../components/SharedComponents';
import { COLORS, SPACING, RADIUS, FONTS, SHADOW } from '../utils/theme';
import { formatCurrency } from '../utils/helpers';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'Cooling', icon: '❄️', color: '#38BDF8', bg: '#0EA5E915' },
  { key: 'Heating', icon: '🔥', color: '#FB923C', bg: '#FB923C15' },
  { key: 'Cooking', icon: '🍳', color: '#FBBF24', bg: '#FBBF2415' },
  { key: 'Laundry', icon: '🧺', color: '#F472B6', bg: '#F472B615' },
  { key: 'Cleaning', icon: '🫧', color: '#34D399', bg: '#34D39915' },
  { key: 'Entertainment', icon: '📺', color: '#A78BFA', bg: '#A78BFA15' },
  { key: 'Lighting', icon: '💡', color: '#FDE68A', bg: '#FDE68A15' },
  { key: 'Office', icon: '💻', color: '#6366F1', bg: '#6366F115' },
  { key: 'Water', icon: '💧', color: '#22D3EE', bg: '#22D3EE15' },
  { key: 'Safety', icon: '🔒', color: '#94A3B8', bg: '#94A3B815' },
  { key: 'Health/Beauty', icon: '✨', color: '#F472B6', bg: '#F472B615' },
  { key: 'Outdoor/Garden', icon: '🌿', color: '#4ADE80', bg: '#4ADE8015' },
  { key: 'Other', icon: '🔌', color: '#64748B', bg: '#64748B15' },
];

const FREQUENCIES = [
  { key: 'daily', label: 'Daily', multiplier: 30 },
  { key: 'weekly', label: 'Weekly', multiplier: 4.33 },
  { key: 'monthly', label: 'Monthly', multiplier: 1 },
];

const getCatMeta = (key) =>
  CATEGORIES.find((c) => c.key === key) || CATEGORIES[CATEGORIES.length - 1];

/**
 * ✅ CORRECT kWh calculation:
 *   daily_kwh  = (wattage × minutes_per_use × times_per_day) / (1000 × 60)
 *   monthly_kwh = daily_kwh × frequency_multiplier (30 for daily, 4.33 for weekly, 1 for monthly)
 */
const calcKwh = (wattage, minutesPerUse, timesPerDay, frequency, quantity) => {
  const w = parseFloat(wattage) || 0;
  const min = parseFloat(minutesPerUse) || 0;
  const tpd = parseFloat(timesPerDay) || 1;
  const qty = parseFloat(quantity) || 1;

  // Total wattage for all units
  const totalW = w * qty;

  // kWh per single day of use
  const dailyKwh = (totalW * min * tpd) / (1000 * 60);

  const freq = FREQUENCIES.find((f) => f.key === frequency) || FREQUENCIES[0];
  const monthlyKwh = dailyKwh * freq.multiplier;

  return { dailyKwh: +dailyKwh.toFixed(4), monthlyKwh: +monthlyKwh.toFixed(3) };
};

const emptyForm = () => ({
  appliance_name: '',
  appliance_category: 'Other',
  wattage: '',
  quantity: '1',
  usage_duration_minutes: '60',
  usage_times_per_day: '1',
  usage_frequency: 'daily',
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

const AppliancesScreen = () => {
  const { selectedAccount } = useAccount();
  const [appliances, setAppliances] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [savingApp, setSavingApp] = useState(false);
  const [tab, setTab] = useState('list');
  const [form, setForm] = useState(emptyForm());
  const [commonApps, setCommonApps] = useState([]);
  const [preview, setPreview] = useState({ daily: 0, monthly: 0 });

  const account = selectedAccount;

  // Live preview whenever form changes
  useEffect(() => {
    const { dailyKwh, monthlyKwh } = calcKwh(
      form.wattage,
      form.usage_duration_minutes,
      form.usage_times_per_day,
      form.usage_frequency,
      form.quantity,
    );
    setPreview({ daily: dailyKwh, monthly: monthlyKwh });
  }, [form.wattage, form.usage_duration_minutes, form.usage_times_per_day, form.usage_frequency, form.quantity]);

  const fetchData = useCallback(async () => {
    if (!account) { setLoading(false); return; }
    try {
      const [appRes, anaRes] = await Promise.allSettled([
        appliancesAPI.getByAccount(account),
        appliancesAPI.analyze(account),
      ]);
      if (appRes.status === 'fulfilled') setAppliances(appRes.value.data?.appliances || []);
      if (anaRes.status === 'fulfilled' && anaRes.value.data?.success)
        setAnalysis(anaRes.value.data);
    } catch (e) { console.error('fetch:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [account]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    (async () => {
      try {
        const res = await appliancesAPI.getCommonAppliances();
        setCommonApps(res.data?.appliances || []);
      } catch (_) { }
    })();
  }, []);

  // ── AI SCAN — FIXED 422 ──────────────────────────────────────────────────
  const scanImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        universalAlert('Permission required', 'Camera access is needed for AI scan.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        // ✅ FIX 1: Use MediaType (not deprecated MediaTypeOptions)
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.75,
      });

      if (result.canceled || !result.assets?.[0]) return;
      await recognizeAppliance(result.assets[0]);
    } catch (err) {
      console.error('Camera error:', err);
      universalAlert('Camera Error', 'Could not open camera. Try again.');
    }
  };

  const recognizeAppliance = async (asset) => {
    setScanning(true);
    try {
      const uri = asset.uri;
      // Improved filename handling for web/mobile to avoid 400 error (missing extension)
      let filename = uri.split('/').pop() || 'photo.jpg';
      let ext = filename.split('.').pop()?.toLowerCase() || 'jpg';

      // Ensure we have a valid image extension for the backend
      const validExts = ['jpg', 'jpeg', 'png', 'webp'];
      if (!validExts.includes(ext)) {
        ext = 'jpg';
        filename = filename.includes('.') ? filename.split('.')[0] + '.jpg' : filename + '.jpg';
      }

      const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
      const mimeType = mimeMap[ext] || 'image/jpeg';

      const fd = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        fd.append('file', blob, filename);
      } else {
        fd.append('file', {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: filename,
          type: mimeType,
        });
      }

      const res = await appliancesAPI.recognizeFromImage(fd);

      if (res.data?.success) {
        const s = res.data.suggested_values;
        setForm({
          appliance_name: s.appliance_name || '',
          appliance_category: s.appliance_category || 'Other',
          wattage: (s.wattage ?? '').toString(),
          quantity: '1',
          usage_duration_minutes: (s.usage_duration_minutes || 60).toString(),
          usage_times_per_day: (s.usage_times_per_day || 1).toString(),
          usage_frequency: s.usage_frequency || 'daily',
        });
        universalAlert(
          '✅ Recognised!',
          `${s.appliance_name} — ${s.wattage}W\nPlease verify values before saving.`,
        );
      } else {
        universalAlert('Not Recognised', res.data?.message || 'Try a clearer photo or use a template.');
      }
    } catch (err) {
      console.error('Scan error:', err?.response?.data || err);
      const detail = err?.response?.data?.detail;
      universalAlert('Scan Failed', detail ? JSON.stringify(detail) : 'Could not process image.');
    } finally {
      setScanning(false);
    }
  };

  const useTemplate = (t) =>
    setForm({
      appliance_name: t.name,
      appliance_category: t.category,
      wattage: (t.typical_wattage || '').toString(),
      quantity: '1',
      usage_duration_minutes: '60',
      usage_times_per_day: '1',
      usage_frequency: 'daily',
    });

  const saveAppliance = async () => {
    if (!form.appliance_name.trim()) return universalAlert('Required', 'Please enter an appliance name.');
    if (!form.wattage || isNaN(parseInt(form.wattage))) return universalAlert('Required', 'Please enter a valid wattage.');
    if (!account) return universalAlert('No Account', 'Upload a bill first to get an account number.');

    setSavingApp(true);
    try {
      const res = await appliancesAPI.add({
        appliance_name: form.appliance_name.trim(),
        appliance_category: form.appliance_category,
        wattage: parseInt(form.wattage),
        quantity: parseInt(form.quantity) || 1,
        usage_duration_minutes: parseInt(form.usage_duration_minutes) || 60,
        usage_times_per_day: parseInt(form.usage_times_per_day) || 1,
        usage_frequency: form.usage_frequency,
        account_number: account,
      });
      if (res.data.success) {
        universalAlert('✅ Added!', `Monthly ~${res.data.monthly_kwh?.toFixed(1)} kWh`);
        setShowModal(false);
        setForm(emptyForm());
        fetchData();
      }
    } catch (err) {
      universalAlert('Error', err.response?.data?.detail || 'Failed to add appliance.');
    } finally {
      setSavingApp(false);
    }
  };

  const deleteAppliance = (app) => {
    console.log(`🔘 Remove appliance pressed: ${app.name} (ID: ${app.id})`);
    const isAtLimit = appliances.length <= 5;
    const title = isAtLimit ? '⚠️ Warning: Low Appliance Count' : 'Remove Appliance';
    const message = isAtLimit
      ? `Removing "${app.name}" will bring your appliance count to ${appliances.length - 1}.\n\nYour active budget plans will be STOPPED as at least 5 appliances are required for tracking. Continue?`
      : `Remove "${app.name}"?`;

    universalAlert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          console.log(`🏃 Deleting appliance ID: ${app.id}...`);
          try {
            const res = await appliancesAPI.delete(app.id);
            console.log('✅ Delete appliance response:', res.data);
            if (res.data?.warning) {
              universalAlert('Tracking Stopped', res.data.warning);
            } else {
              universalAlert('Success', 'Appliance removed.');
            }
            fetchData();
          }
          catch (err) {
            console.error('❌ Delete appliance error:', err);
            universalAlert('Error', 'Failed to remove appliance.');
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen message="Loading appliances…" />;

  const totalMonthly = appliances.reduce((s, a) => s + (a.estimated_cost || 0), 0);
  const totalKwh = appliances.reduce((s, a) => s + (a.monthly_kwh || 0), 0);

  return (
    <View style={s.root}>
      <View style={s.container}>
        {/* ── HEADER ── */}
        <View style={[s.header, { paddingTop: Platform.OS === 'ios' ? 60 : 45, backgroundColor: '#0D1422', borderBottomWidth: 1, borderBottomColor: '#1E293B', marginBottom: 16, alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard')} style={{ padding: 4, marginRight: 12 }}>
            <ArrowLeft size={24} color="#F1F5F9" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Appliances</Text>
            <Text style={s.headerSub}>
              {appliances.length} devices · {totalKwh.toFixed(0)} kWh/mo
            </Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerCost}>{formatCurrency(totalMonthly, 0)}</Text>
            <Text style={s.headerCostLbl}>est/month</Text>
          </View>
        </View>

        {/* ── TABS ── */}
        <View style={s.tabBar}>
          {[{ k: 'list', l: 'My Devices' }, { k: 'analysis', l: 'Analysis' }].map(({ k, l }) => (
            <TouchableOpacity key={k} style={[s.tab, tab === k && s.tabOn]} onPress={() => setTab(k)}>
              <Text style={[s.tabTxt, tab === k && s.tabTxtOn]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={s.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchData(); }}
              tintColor="#38BDF8"
            />
          }
        >
          {/* ── ONBOARDING PROGRESS ── */}
          {tab === 'list' && appliances.length < 5 && (
            <View style={s.progressCard}>
              <View style={s.progressTop}>
                <Text style={s.progressTitle}>🚀 Getting started</Text>
                <Text style={s.progressCount}>{appliances.length} / 5 added</Text>
              </View>
              <Text style={s.progressSub}>Add at least 5 appliances to unlock Budget Planning & NILM</Text>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${(appliances.length / 5) * 100}%` }]} />
              </View>
            </View>
          )}

          {/* ── LIST TAB ── */}
          {tab === 'list' && (
            appliances.length === 0
              ? <EmptyState icon="⚡" title="No Appliances Yet" subtitle="Tap 'Add Appliance' below to start tracking your devices." />
              : appliances.map((app) => <ApplianceRow key={app.id} app={app} onDelete={() => deleteAppliance(app)} />)
          )}

          {/* ── ANALYSIS TAB ── */}
          {tab === 'analysis' && <AnalysisView analysis={analysis} appliances={appliances} />}
        </ScrollView>

        {/* ── FAB ── */}
        {tab === 'list' && (
          <View style={s.fab}>
            <TouchableOpacity style={s.fabBtn} onPress={() => setShowModal(true)} activeOpacity={0.85}>
              <Text style={s.fabIcon}>＋</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── ADD MODAL ── */}
        <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
          <View style={s.modal}>
            {/* Modal header */}
            <View style={s.modalHdr}>
              <Text style={s.modalTitle}>Add Appliance</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); setForm(emptyForm()); }} hitSlop={12}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={s.modalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              {/* AI SCAN */}
              <TouchableOpacity style={s.scanCard} onPress={scanImage} disabled={scanning} activeOpacity={0.8}>
                <View style={s.scanLeft}>
                  <Text style={s.scanEmoji}>{scanning ? '⏳' : '📷'}</Text>
                  <View>
                    <Text style={s.scanTitle}>{scanning ? 'Analysing image…' : 'AI Scan'}</Text>
                    <Text style={s.scanSub}>Point camera at appliance or power label</Text>
                  </View>
                </View>
                {!scanning && <Text style={s.scanArrow}>→</Text>}
              </TouchableOpacity>

              <SectionDivider label="or pick a template" />

              {/* TEMPLATE CHIPS */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tmplRow}>
                {commonApps.slice(0, 10).map((t, i) => {
                  const cat = getCatMeta(t.category);
                  return (
                    <TouchableOpacity key={i} style={[s.tmplChip, { borderColor: cat.color + '55' }]} onPress={() => useTemplate(t)}>
                      <Text style={s.tmplEmoji}>{cat.icon}</Text>
                      <Text style={s.tmplName}>{t.name.replace(' (1 Ton)', '')}</Text>
                      <Text style={[s.tmplWatt, { color: cat.color }]}>{t.typical_wattage}W</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <SectionDivider label="appliance details" />

              {/* NAME */}
              <FieldLabel label="Name *" />
              <TextInput
                style={s.input}
                value={form.appliance_name}
                onChangeText={(v) => setForm({ ...form, appliance_name: v })}
                placeholder="e.g. Samsung Refrigerator"
                placeholderTextColor="#475569"
              />

              {/* WATTAGE & QTY */}
              <View style={s.row2}>
                <View style={{ flex: 2 }}>
                  <FieldLabel label="Wattage (W) *" hint="Check the label" />
                  <TextInput
                    style={s.input}
                    value={form.wattage}
                    onChangeText={(v) => setForm({ ...form, wattage: v })}
                    placeholder="e.g. 150"
                    placeholderTextColor="#475569"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <FieldLabel label="Qty" hint="How many?" />
                  <TextInput
                    style={s.input}
                    value={form.quantity}
                    onChangeText={(v) => setForm({ ...form, quantity: v })}
                    placeholder="1"
                    placeholderTextColor="#475569"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* CATEGORY */}
              <FieldLabel label="Category" />
              <View style={s.catGrid}>
                {CATEGORIES.map((cat) => {
                  const active = form.appliance_category === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[s.catChip, { borderColor: active ? cat.color : '#1E293B', backgroundColor: active ? cat.bg : '#0F172A' }]}
                      onPress={() => setForm({ ...form, appliance_category: cat.key })}
                    >
                      <Text style={s.catEmoji}>{cat.icon}</Text>
                      <Text style={[s.catLbl, { color: active ? cat.color : '#64748B' }]}>{cat.key}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <SectionDivider label="usage pattern" />

              {/* MINUTES + TIMES */}
              <View style={s.row2}>
                <View style={{ flex: 1 }}>
                  <FieldLabel label="Minutes / use" />
                  <TextInput
                    style={s.input}
                    value={form.usage_duration_minutes}
                    onChangeText={(v) => setForm({ ...form, usage_duration_minutes: v })}
                    keyboardType="numeric"
                    placeholderTextColor="#475569"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <FieldLabel label="Times per day" />
                  <TextInput
                    style={s.input}
                    value={form.usage_times_per_day}
                    onChangeText={(v) => setForm({ ...form, usage_times_per_day: v })}
                    keyboardType="numeric"
                    placeholderTextColor="#475569"
                  />
                </View>
              </View>

              {/* FREQUENCY */}
              <FieldLabel label="How often is this used?" />
              <View style={s.freqRow}>
                {FREQUENCIES.map((f) => {
                  const active = form.usage_frequency === f.key;
                  return (
                    <TouchableOpacity
                      key={f.key}
                      style={[s.freqBtn, active && s.freqBtnOn]}
                      onPress={() => setForm({ ...form, usage_frequency: f.key })}
                    >
                      <Text style={[s.freqTxt, active && s.freqTxtOn]}>{f.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* LIVE PREVIEW */}
              {form.wattage ? (
                <View style={s.previewCard}>
                  <Text style={s.previewTitle}>⚡ Estimated Consumption</Text>
                  <View style={s.previewRow}>
                    <PreviewStat label="Per day of use" value={`${preview.daily} kWh`} />
                    <PreviewStat label="Monthly total" value={`${preview.monthly} kWh`} accent />
                  </View>
                  <Text style={s.previewNote}>
                    {form.usage_frequency === 'daily' && `Used every day — ${form.usage_duration_minutes} min × ${form.usage_times_per_day}×/day × 30 days`}
                    {form.usage_frequency === 'weekly' && `Used weekly — approx 4.33 times/month`}
                    {form.usage_frequency === 'monthly' && `Used once this month`}
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[s.saveBtn, savingApp && { opacity: 0.6 }]}
                onPress={saveAppliance}
                disabled={savingApp}
              >
                <Text style={s.saveBtnTxt}>{savingApp ? 'Saving…' : 'Save Appliance'}</Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </Modal>
      </View>
    </View>
  );
};

// ─── APPLIANCE ROW ────────────────────────────────────────────────────────────

const ApplianceRow = ({ app, onDelete }) => {
  const cat = getCatMeta(app.category);
  const pct = app.monthly_kwh && app.monthly_kwh > 0 ? Math.min(app.monthly_kwh / 200 * 100, 100) : 0;
  return (
    <View style={[ar.wrap, { borderLeftColor: cat.color }]}>
      <View style={ar.top}>
        <View style={[ar.iconBox, { backgroundColor: cat.bg }]}>
          <Text style={ar.icon}>{cat.icon}</Text>
        </View>
        <View style={ar.info}>
          <Text style={ar.name}>{app.name}</Text>
          <Text style={ar.meta}>
            {cat.key} · {app.wattage}W {app.quantity > 1 ? `(×${app.quantity})` : ''} · {app.usage}
          </Text>
        </View>
        <View style={ar.right}>
          <Text style={ar.cost}>{formatCurrency(app.estimated_cost, 0)}</Text>
          <Text style={ar.kwh}>{app.monthly_kwh?.toFixed(1)} kWh</Text>
        </View>
      </View>
      <View style={ar.barTrack}>
        <View style={[ar.barFill, { width: `${pct}%`, backgroundColor: cat.color }]} />
      </View>
      <TouchableOpacity onPress={onDelete} style={ar.del} hitSlop={8}>
        <Text style={ar.delTxt}>Remove</Text>
      </TouchableOpacity>
    </View>
  );
};

const ar = StyleSheet.create({
  wrap: {
    backgroundColor: '#0D1422', borderRadius: 16, padding: 16,
    marginBottom: 10, borderLeftWidth: 3,
  },
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  icon: { fontSize: 20 },
  info: { flex: 1 },
  name: { color: '#F1F5F9', fontSize: 15, fontWeight: '700' },
  meta: { color: '#64748B', fontSize: 12, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  cost: { color: '#34D399', fontSize: 16, fontWeight: '800' },
  kwh: { color: '#64748B', fontSize: 11 },
  barTrack: { height: 3, backgroundColor: '#1E293B', borderRadius: 99, marginBottom: 8 },
  barFill: { height: 3, borderRadius: 99 },
  del: { alignSelf: 'flex-end' },
  delTxt: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
});

// ─── ANALYSIS VIEW ────────────────────────────────────────────────────────────

const AnalysisView = ({ analysis, appliances }) => {
  if (!analysis?.summary) return (
    <EmptyState icon="📊" title="No Analysis" subtitle="Add appliances to see your breakdown." />
  );
  const { summary, by_category, high_consumers } = analysis;
  return (
    <>
      {/* Summary */}
      <View style={av.summaryCard}>
        <Text style={av.sumLabel}>Monthly Bill Estimate</Text>
        <Text style={av.sumBig}>{formatCurrency(summary.estimated_monthly_cost)}</Text>
        <View style={av.sumRow}>
          <SumStat label="Daily" value={`${summary.total_daily_kwh?.toFixed(2)} kWh`} />
          <SumStat label="Monthly" value={`${summary.total_monthly_kwh?.toFixed(0)} kWh`} />
          <SumStat label="Devices" value={summary.total_appliances} />
        </View>
      </View>

      {/* By Category */}
      {by_category?.length > 0 && (
        <View style={av.card}>
          <Text style={av.cardTitle}>By Category</Text>
          {by_category.map((cat, i) => {
            const meta = getCatMeta(cat.category);
            return (
              <View key={i} style={av.catRow}>
                <Text style={av.catIcon}>{meta.icon}</Text>
                <Text style={av.catName}>{cat.category}</Text>
                <View style={av.catBarWrap}>
                  <View style={[av.catBar, { width: `${cat.percentage}%`, backgroundColor: meta.color }]} />
                </View>
                <Text style={[av.catPct, { color: meta.color }]}>{cat.percentage}%</Text>
                <Text style={av.catCost}>{formatCurrency(cat.monthly_cost, 0)}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* High consumers */}
      {high_consumers?.appliances?.length > 0 && (
        <View style={av.card}>
          <Text style={av.cardTitle}>⚠️ Top Consumers</Text>
          {high_consumers.appliances.map((app, i) => (
            <View key={i} style={av.highRow}>
              <Text style={av.highName}>{app.name}</Text>
              <Text style={av.highVal}>{app.monthly_kwh?.toFixed(1)} kWh · {formatCurrency(app.estimated_monthly_cost, 0)}</Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
};

const SumStat = ({ label, value }) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={{ color: '#F1F5F9', fontSize: 16, fontWeight: '800' }}>{value}</Text>
    <Text style={{ color: '#64748B', fontSize: 11 }}>{label}</Text>
  </View>
);

const av = StyleSheet.create({
  summaryCard: {
    backgroundColor: '#0D1422', borderRadius: 20, padding: 24,
    marginBottom: 12, borderWidth: 1, borderColor: '#38BDF822', alignItems: 'center',
  },
  sumLabel: { color: '#64748B', fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 6 },
  sumBig: { color: '#38BDF8', fontSize: 36, fontWeight: '900', marginBottom: 16 },
  sumRow: { flexDirection: 'row', gap: 32 },
  card: {
    backgroundColor: '#0D1422', borderRadius: 16, padding: 18,
    marginBottom: 12, borderWidth: 1, borderColor: '#1E293B',
  },
  cardTitle: { color: '#F1F5F9', fontSize: 15, fontWeight: '700', marginBottom: 14 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  catIcon: { fontSize: 16, width: 24 },
  catName: { color: '#94A3B8', fontSize: 13, width: 90 },
  catBarWrap: { flex: 1, height: 6, backgroundColor: '#1E293B', borderRadius: 99, marginHorizontal: 8, overflow: 'hidden' },
  catBar: { height: 6, borderRadius: 99 },
  catPct: { fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },
  catCost: { color: '#64748B', fontSize: 12, width: 52, textAlign: 'right' },
  highRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  highName: { color: '#F1F5F9', fontSize: 14 },
  highVal: { color: '#FB923C', fontSize: 13, fontWeight: '600' },
});

// ─── SMALL HELPERS ────────────────────────────────────────────────────────────

const FieldLabel = ({ label, hint }) => (
  <View style={{ marginBottom: 6, marginTop: 14 }}>
    <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>{label}</Text>
    {hint ? <Text style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>{hint}</Text> : null}
  </View>
);

const SectionDivider = ({ label }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 10 }}>
    <View style={{ flex: 1, height: 1, backgroundColor: '#1E293B' }} />
    <Text style={{ color: '#475569', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>{label}</Text>
    <View style={{ flex: 1, height: 1, backgroundColor: '#1E293B' }} />
  </View>
);

const PreviewStat = ({ label, value, accent }) => (
  <View style={{ alignItems: 'center', flex: 1 }}>
    <Text style={{ color: accent ? '#38BDF8' : '#94A3B8', fontSize: accent ? 22 : 18, fontWeight: '800' }}>{value}</Text>
    <Text style={{ color: '#475569', fontSize: 11, marginTop: 3 }}>{label}</Text>
  </View>
);

// ─── STYLESHEET ───────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060D18' },
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#060D18',
  },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
    backgroundColor: '#060D18',
  },
  headerTitle: { color: '#F1F5F9', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { color: '#475569', fontSize: 13, marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  headerCost: { color: '#34D399', fontSize: 24, fontWeight: '900' },
  headerCostLbl: { color: '#475569', fontSize: 11 },

  tabBar: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#0D1422', borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: '#1E293B',
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  tabOn: { backgroundColor: '#38BDF8' },
  tabTxt: { color: '#475569', fontSize: 14, fontWeight: '600' },
  tabTxtOn: { color: '#060D18', fontWeight: '800' },

  scroll: { flex: 1, paddingHorizontal: 20 },

  progressCard: {
    backgroundColor: '#0D1422', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#38BDF822',
  },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressTitle: { color: '#F1F5F9', fontSize: 14, fontWeight: '700' },
  progressCount: { color: '#38BDF8', fontSize: 13, fontWeight: '700' },
  progressSub: { color: '#475569', fontSize: 12, marginBottom: 10 },
  progressTrack: { height: 6, backgroundColor: '#1E293B', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#38BDF8', borderRadius: 99 },

  fab: {
    position: 'absolute', bottom: 24, right: 20,
  },
  fabBtn: {
    backgroundColor: '#38BDF8', borderRadius: 28, width: 56, height: 56,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6,
  },
  fabIcon: { color: '#060D18', fontSize: 28, fontWeight: '900', marginTop: -2 },

  // MODAL
  modal: { flex: 1, backgroundColor: '#060D18' },
  modalHdr: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#1E293B',
  },
  modalTitle: { color: '#F1F5F9', fontSize: 22, fontWeight: '900' },
  modalClose: { color: '#475569', fontSize: 22, padding: 4 },
  modalBody: { flex: 1, paddingHorizontal: 20 },

  scanCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#0D1422', borderRadius: 16, padding: 18, marginTop: 18,
    borderWidth: 1.5, borderColor: '#7C3AED55',
  },
  scanLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  scanEmoji: { fontSize: 34 },
  scanTitle: { color: '#A78BFA', fontSize: 16, fontWeight: '800' },
  scanSub: { color: '#475569', fontSize: 12, marginTop: 2 },
  scanArrow: { color: '#7C3AED', fontSize: 22 },

  tmplRow: { marginBottom: 4 },
  tmplChip: {
    backgroundColor: '#0D1422', borderRadius: 12, padding: 12,
    marginRight: 10, alignItems: 'center', minWidth: 88,
    borderWidth: 1,
  },
  tmplEmoji: { fontSize: 22, marginBottom: 4 },
  tmplName: { color: '#94A3B8', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  tmplWatt: { fontSize: 12, fontWeight: '800', marginTop: 2 },

  input: {
    backgroundColor: '#0D1422', color: '#F1F5F9',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, borderWidth: 1, borderColor: '#1E293B',
  },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
  },
  catEmoji: { fontSize: 15 },
  catLbl: { fontSize: 13, fontWeight: '600' },

  row2: { flexDirection: 'row' },
  freqRow: { flexDirection: 'row', gap: 8 },
  freqBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#1E293B', alignItems: 'center',
    backgroundColor: '#0D1422',
  },
  freqBtnOn: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
  freqTxt: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  freqTxtOn: { color: '#060D18', fontWeight: '800' },

  previewCard: {
    backgroundColor: '#0D1422', borderRadius: 16, padding: 18,
    marginTop: 16, borderWidth: 1, borderColor: '#38BDF822',
  },
  previewTitle: { color: '#38BDF8', fontSize: 13, fontWeight: '700', marginBottom: 12 },
  previewRow: { flexDirection: 'row', marginBottom: 10 },
  previewNote: { color: '#475569', fontSize: 11, textAlign: 'center' },

  saveBtn: {
    backgroundColor: '#38BDF8', borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginTop: 20,
  },
  saveBtnTxt: { color: '#060D18', fontSize: 16, fontWeight: '900' },
});

export default AppliancesScreen;