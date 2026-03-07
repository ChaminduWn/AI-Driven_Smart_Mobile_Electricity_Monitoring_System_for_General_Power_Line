import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Animated, Easing, Dimensions, StatusBar,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../utils/theme';
import { formatCurrency, calcCEB } from '../utils/helpers';

// ─── QUICK PRESETS ──────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Low', units: 30, days: 30, icon: '🌙', color: '#34D399' },
  { label: 'Mid', units: 90, days: 30, icon: '⚡', color: '#FBBF24' },
  { label: 'High', units: 180, days: 30, icon: '🔥', color: '#EF4444' },
];

// ─── RATE TABLE DATA ────────────────────────────────────────────────────────
const LOW_SLABS = [['0 – 30', '4.50', '80'], ['31 – 60', '8.00', '210']];
const HIGH_SLABS = [['0 – 60', '12.75', '—'], ['61 – 90', '18.50', '400'], ['91 – 120', '24.00', '1,000'], ['121 – 180', '41.00', '1,500'], ['181+', '61.00', '2,100']];

// ─── ANIMATED ROLLING NUMBER ─────────────────────────────────────────────────
function AnimatedNumber({ value, style, prefix = 'Rs. ' }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    anim.setValue(0);
    const a = Animated.timing(anim, { toValue: value, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    a.start();
    const id = anim.addListener(({ value: v }) => setDisplay(v));
    return () => anim.removeListener(id);
  }, [value]);
  return (
    <Text style={style}>
      {prefix}{display.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </Text>
  );
}

// ─── USAGE GAUGE ─────────────────────────────────────────────────────────────
function UsageGauge({ norm }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: Math.min(norm / 200, 1), friction: 7, tension: 40, useNativeDriver: false }).start();
  }, [norm]);

  const color = norm <= 30 ? '#34D399' : norm <= 60 ? '#A3E635' : norm <= 90 ? '#FBBF24' : norm <= 120 ? '#FB923C' : '#EF4444';
  const levelLabel = norm <= 30 ? 'Very Low' : norm <= 60 ? 'Low' : norm <= 90 ? 'Moderate' : norm <= 120 ? 'High' : norm <= 180 ? 'Very High' : 'Extreme';
  const barWidth = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View>
      <View style={gu.row}>
        <Text style={gu.metaLabel}>Monthly Equivalent</Text>
        <View style={[gu.badge, { backgroundColor: color + '22' }]}>
          <Text style={[gu.badgeText, { color }]}>{levelLabel}</Text>
        </View>
      </View>
      <View style={gu.track}>
        <Animated.View style={[gu.fill, { width: barWidth, backgroundColor: color }]} />
        <View style={[gu.marker, { left: '15%' }]} />
        <View style={[gu.marker, { left: '30%' }]} />
        <View style={[gu.marker, { left: '45%' }]} />
        <View style={[gu.marker, { left: '60%' }]} />
        <View style={[gu.marker, { left: '90%' }]} />
      </View>
      <View style={gu.ticks}>
        {['0', '30', '60', '90', '120', '180', '200+'].map(t => <Text key={t} style={gu.tick}>{t}</Text>)}
      </View>
      <Text style={[gu.big, { color }]}>{norm} <Text style={gu.bigUnit}>kWh / 30 days</Text></Text>
    </View>
  );
}
const gu = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  metaLabel: { color: '#475569', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  track: { height: 12, backgroundColor: '#1E293B', borderRadius: 6, overflow: 'hidden', position: 'relative' },
  fill: { height: '100%', borderRadius: 6 },
  marker: { position: 'absolute', top: 0, width: 1.5, height: '100%', backgroundColor: '#070B14' },
  ticks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  tick: { color: '#334155', fontSize: 9, fontWeight: '600' },
  big: { textAlign: 'center', fontSize: 26, fontWeight: '900', marginTop: 14, letterSpacing: -1 },
  bigUnit: { fontSize: 14, fontWeight: '500', color: '#64748B' },
});

// ─── SLAB BAR ─────────────────────────────────────────────────────────────────
const SLAB_COLORS = ['#38BDF8', '#818CF8', '#FB923C', '#F472B6', '#A3E635'];
function SlabBar({ item, total, index, delay }) {
  const anim = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const pct = total > 0 ? item.amt / total : 0;
  const color = SLAB_COLORS[index % SLAB_COLORS.length];

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.spring(anim, { toValue: pct, friction: 8, useNativeDriver: false }),
        Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, [pct]);

  const barW = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View style={[sb.row, { opacity: fade }]}>
      <View style={sb.meta}>
        <View style={[sb.dot, { backgroundColor: color }]} />
        <View>
          <Text style={sb.range}>{item.range} kWh</Text>
          <Text style={sb.detail}>{item.units} units × Rs.{item.rate}/kWh</Text>
        </View>
      </View>
      <View style={sb.right}>
        <View style={sb.track}>
          <Animated.View style={[sb.fill, { width: barW, backgroundColor: color }]} />
        </View>
        <Text style={[sb.amt, { color }]}>Rs.{item.amt.toLocaleString()}</Text>
      </View>
    </Animated.View>
  );
}
const sb = StyleSheet.create({
  row: { marginVertical: 9 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  range: { color: '#E2E8F0', fontSize: 13, fontWeight: '700' },
  detail: { color: '#475569', fontSize: 11, marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  track: { flex: 1, height: 8, backgroundColor: '#1E293B', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  amt: { width: 86, textAlign: 'right', fontSize: 13, fontWeight: '800' },
});

// ─── CHARGE PILL ─────────────────────────────────────────────────────────────
function ChargePill({ label, value, accent, delay }) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }, delay);
  }, [value]);
  return (
    <Animated.View style={[pill.wrap, { transform: [{ scale }], opacity, borderColor: accent + '44' }]}>
      <Text style={pill.label}>{label}</Text>
      <Text style={[pill.value, { color: accent }]}>
        Rs.{(+value).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
      </Text>
    </Animated.View>
  );
}
const pill = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#070B14', borderRadius: 14, padding: 14, borderWidth: 1, alignItems: 'center' },
  label: { color: '#475569', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 7 },
  value: { fontSize: 12, fontWeight: '900', textAlign: 'center' },
});

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function TariffScreen() {
  const [units, setUnits] = useState('');
  const [days, setDays] = useState('30');
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('calculator');

  const resultAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const triggerPulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(pulseAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  };

  const calculate = (u = units, d = days) => {
    const r = calcCEB(parseInt(u), parseInt(d) || 30);
    if (!r) return;
    setResult(r);
    triggerPulse();
    resultAnim.setValue(0);
    Animated.spring(resultAnim, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }).start();
  };

  const applyPreset = (p) => {
    setUnits(String(p.units));
    setDays(String(p.days));
    calculate(String(p.units), String(p.days));
  };

  const resultSlide = resultAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070B14" />

      {/* HEADER */}
      <Animated.View style={[s.header, { transform: [{ scale: pulseAnim }] }]}>
        <View style={s.glow} />
        <Text style={s.eyebrow}>⚡ CEYLON ELECTRICITY BOARD</Text>
        <Text style={s.title}>Tariff Calculator</Text>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>OCT 2025 RATES</Text>
        </View>
      </Animated.View>

      {/* TABS */}
      <View style={s.tabBar}>
        {[['calculator', '🧮  Calculator'], ['table', '📊  Rate Table']].map(([key, lbl]) => (
          <TouchableOpacity key={key} style={[s.tab, activeTab === key && s.tabOn]} onPress={() => setActiveTab(key)} activeOpacity={0.8}>
            <Text style={[s.tabTxt, activeTab === key && s.tabTxtOn]}>{lbl}</Text>
            {activeTab === key && <View style={s.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">

        {/* ───── CALCULATOR TAB ───── */}
        {activeTab === 'calculator' && (
          <>
            {/* INPUT CARD */}
            <View style={s.card}>
              <Text style={s.sectionLabel}>CONSUMPTION DETAILS</Text>
              <View style={s.inputRow}>
                <View style={s.inputWrap}>
                  <Text style={s.inputLabel}>UNITS (kWh)</Text>
                  <TextInput
                    style={s.input} value={units} onChangeText={setUnits}
                    placeholder="e.g. 120" placeholderTextColor="#1E293B"
                    keyboardType="numeric" returnKeyType="done"
                  />
                </View>
                <View style={s.inputWrap}>
                  <Text style={s.inputLabel}>BILLING DAYS</Text>
                  <TextInput
                    style={s.input} value={days}
                    onChangeText={(v) => { const d = parseInt(v); if (!v || (d >= 1 && d <= 100)) setDays(v); }}
                    placeholder="30" placeholderTextColor="#1E293B"
                    keyboardType="numeric" returnKeyType="done"
                  />
                </View>
              </View>

              {/* Presets */}
              <Text style={s.inputLabel}>QUICK PRESETS</Text>
              <View style={s.presetRow}>
                {PRESETS.map((p) => (
                  <TouchableOpacity key={p.label} style={[s.preset, { borderColor: p.color + '44' }]} onPress={() => applyPreset(p)} activeOpacity={0.75}>
                    <Text style={s.presetIcon}>{p.icon}</Text>
                    <Text style={[s.presetLabel, { color: p.color }]}>{p.label}</Text>
                    <Text style={s.presetKwh}>{p.units} kWh</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[s.calcBtn, (!units || !days) && { opacity: 0.3 }]}
                onPress={() => calculate()} disabled={!units || !days} activeOpacity={0.85}
              >
                <Text style={s.calcBtnText}>Calculate Bill</Text>
                <Text style={s.calcArrow}>→</Text>
              </TouchableOpacity>
            </View>

            {/* RESULT */}
            {result && (
              <Animated.View style={{ opacity: resultAnim, transform: [{ translateY: resultSlide }] }}>

                {/* Gauge card */}
                <View style={s.card}>
                  <Text style={s.sectionLabel}>USAGE ANALYSIS</Text>
                  <UsageGauge norm={result.norm} />
                  <View style={[s.catChip, { backgroundColor: result.category === 1 ? '#064E3B' : '#431407' }]}>
                    <Text style={[s.catChipText, { color: result.category === 1 ? '#34D399' : '#FB923C' }]}>
                      {result.category === 1 ? '● Category 1' : '● Category 2'}
                      {'  ·  '}{result.label}{'  ·  '}{result.norm} kWh/mo
                    </Text>
                  </View>
                </View>

                {/* Breakdown card */}
                <View style={s.card}>
                  <Text style={s.sectionLabel}>ENERGY BREAKDOWN</Text>
                  <Text style={s.breakdownNote}>
                    Slab limits scaled for {days}-day billing period
                  </Text>
                  {result.breakdown.map((item, i) => (
                    <SlabBar key={i} item={item} total={result.energy} index={i} delay={i * 130} />
                  ))}
                  <View style={s.energyTotal}>
                    <Text style={s.energyTotalLabel}>Total Energy Charge</Text>
                    <Text style={s.energyTotalValue}>Rs.{result.energy.toLocaleString()}</Text>
                  </View>
                </View>

                {/* Summary card */}
                <View style={s.card}>
                  <Text style={s.sectionLabel}>BILL SUMMARY</Text>
                  <View style={s.pillRow}>
                    <ChargePill label="Energy" value={result.energy} accent="#38BDF8" delay={0} />
                    <ChargePill label="Fixed" value={result.fixed} accent="#818CF8" delay={100} />
                    <ChargePill label="SSCL 2.565%" value={result.sscl} accent="#64748B" delay={200} />
                  </View>

                  <View style={s.totalBox}>
                    <View>
                      <Text style={s.totalDue}>TOTAL DUE</Text>
                      <Text style={s.totalSub}>incl. all taxes · {days} days</Text>
                    </View>
                    <AnimatedNumber value={result.total} style={s.totalAmt} />
                  </View>

                  <View style={s.statsRow}>
                    {[
                      { label: 'Per Day', value: `Rs.${(result.total / (parseInt(days) || 30)).toFixed(2)}` },
                      { label: 'Per kWh', value: `Rs.${(result.total / parseInt(units)).toFixed(2)}` },
                      { label: 'Subtotal', value: `Rs.${result.subtotal.toLocaleString()}` },
                    ].map(({ label, value }, i) => (
                      <React.Fragment key={label}>
                        {i > 0 && <View style={s.statDivider} />}
                        <View style={s.stat}>
                          <Text style={s.statLabel}>{label}</Text>
                          <Text style={s.statValue}>{value}</Text>
                        </View>
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              </Animated.View>
            )}
          </>
        )}

        {/* ───── RATE TABLE TAB ───── */}
        {activeTab === 'table' && (
          <View style={s.card}>
            <Text style={s.sectionLabel}>DOMESTIC TARIFF — OCT 2025</Text>
            <Text style={s.tableNote}>Effective 15 Oct 2025 · Defined per 30-day billing period</Text>

            {/* Category 1 */}
            <View style={[s.catBlock, { borderColor: '#34D39933' }]}>
              <View style={[s.catHead, { backgroundColor: '#052E16' }]}>
                <View style={[s.catDot, { backgroundColor: '#34D399' }]} />
                <Text style={[s.catHeadText, { color: '#34D399' }]}>Category 1 — 0 to 60 kWh / month</Text>
              </View>
              <View style={s.tHead}>
                {['Block', 'Rate / kWh', 'Fixed Charge'].map(h => <Text key={h} style={s.th}>{h}</Text>)}
              </View>
              {LOW_SLABS.map(([range, rate, fixed], i) => (
                <View key={i} style={[s.tRow, i % 2 === 0 && s.tRowAlt]}>
                  <Text style={s.tdRange}>{range} kWh</Text>
                  <Text style={[s.td, { color: '#38BDF8' }]}>Rs. {rate}</Text>
                  <Text style={[s.td, { color: '#818CF8' }]}>Rs. {fixed}</Text>
                </View>
              ))}
            </View>

            {/* Category 2 */}
            <View style={[s.catBlock, { borderColor: '#FB923C33', marginTop: 18 }]}>
              <View style={[s.catHead, { backgroundColor: '#431407' }]}>
                <View style={[s.catDot, { backgroundColor: '#FB923C' }]} />
                <Text style={[s.catHeadText, { color: '#FB923C' }]}>Category 2 — Above 60 kWh / month</Text>
              </View>
              <View style={s.tHead}>
                {['Block', 'Rate / kWh', 'Fixed Charge'].map(h => <Text key={h} style={s.th}>{h}</Text>)}
              </View>
              {HIGH_SLABS.map(([range, rate, fixed], i) => (
                <View key={i} style={[s.tRow, i % 2 === 0 && s.tRowAlt]}>
                  <Text style={s.tdRange}>{range} kWh</Text>
                  <Text style={[s.td, { color: '#38BDF8' }]}>Rs. {rate}</Text>
                  <Text style={[s.td, { color: fixed === '—' ? '#334155' : '#818CF8' }]}>
                    {fixed === '—' ? '—' : `Rs. ${fixed}`}
                  </Text>
                </View>
              ))}
            </View>

            <View style={s.noteBox}>
              {['⚡  SSCL of 2.565% applied on all charges', '📅  Slab limits scale for non-30-day periods', '🔢  Category set by 30-day normalised consumption'].map(n => (
                <Text key={n} style={s.noteLine}>{n}</Text>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070B14' },

  // Header
  header: {
    paddingTop: 56, paddingBottom: 24, paddingHorizontal: 24,
    borderBottomWidth: 1, borderBottomColor: '#0F172A', overflow: 'hidden',
  },
  glow: {
    position: 'absolute', top: -60, right: -30, width: 220, height: 220,
    borderRadius: 110, backgroundColor: '#0EA5E9', opacity: 0.07,
  },
  eyebrow: { color: '#0EA5E9', fontSize: 10, fontWeight: '800', letterSpacing: 2.5, marginBottom: 10 },
  title: { color: '#F1F5F9', fontSize: 40, fontWeight: '700', lineHeight: 44, letterSpacing: 1.5 },
  headerBadge: {
    marginTop: 12, alignSelf: 'flex-start', backgroundColor: '#0F3460',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#1E40AF',
  },
  headerBadgeText: { color: '#60A5FA', fontSize: 10, fontWeight: '800', letterSpacing: 2 },

  // Tabs
  tabBar: {
    flexDirection: 'row', backgroundColor: '#0D1422',
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    borderRadius: 14, padding: 4, borderWidth: 1, borderColor: '#1E293B',
  },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 11 },
  tabOn: { backgroundColor: '#0C2240' },
  tabTxt: { color: '#334155', fontSize: 13, fontWeight: '700' },
  tabTxtOn: { color: '#38BDF8' },
  tabUnderline: { position: 'absolute', bottom: 4, width: 20, height: 2, backgroundColor: '#38BDF8', borderRadius: 1 },

  // Layout
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 14, paddingHorizontal: 16 },

  // Card
  card: {
    backgroundColor: '#0D1422', borderRadius: 20, marginBottom: 14,
    padding: 20, borderWidth: 1, borderColor: '#1E293B',
  },
  sectionLabel: {
    color: '#1E40AF', fontSize: 10, fontWeight: '800',
    letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 16,
  },

  // Inputs
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  inputWrap: { flex: 1 },
  inputLabel: { color: '#334155', fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  input: {
    backgroundColor: '#070B14', color: '#F1F5F9',
    borderRadius: 12, padding: 16, fontSize: 22, fontWeight: '800',
    borderWidth: 1.5, borderColor: '#1E293B', letterSpacing: -0.5,
  },

  // Presets
  presetRow: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 20 },
  preset: {
    flex: 1, backgroundColor: '#070B14', borderRadius: 12,
    padding: 12, alignItems: 'center', borderWidth: 1,
  },
  presetIcon: { fontSize: 22, marginBottom: 5 },
  presetLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  presetKwh: { color: '#334155', fontSize: 10, fontWeight: '700', marginTop: 3 },

  // Calc button
  calcBtn: {
    backgroundColor: '#0EA5E9', borderRadius: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 17, gap: 12,
  },
  calcBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  calcArrow: { color: '#fff', fontSize: 22 },

  // Category chip
  catChip: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, marginTop: 16 },
  catChipText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  // Breakdown
  breakdownNote: { color: '#334155', fontSize: 11, marginBottom: 12, marginTop: -8 },
  energyTotal: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#1E293B',
  },
  energyTotalLabel: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  energyTotalValue: { color: '#E2E8F0', fontSize: 16, fontWeight: '900' },

  // Charge pills
  pillRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },

  // Total box
  totalBox: {
    backgroundColor: '#070B14', borderRadius: 16, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#0EA5E933', marginBottom: 14,
  },
  totalDue: { color: '#475569', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  totalSub: { color: '#1E293B', fontSize: 10, marginTop: 4 },
  totalAmt: { color: '#38BDF8', fontSize: 24, fontWeight: '900', letterSpacing: -1 },

  // Stats row
  statsRow: {
    flexDirection: 'row', backgroundColor: '#070B14',
    borderRadius: 12, borderWidth: 1, borderColor: '#1E293B',
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statLabel: { color: '#334155', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 5 },
  statValue: { color: '#94A3B8', fontSize: 13, fontWeight: '800' },
  statDivider: { width: 1, backgroundColor: '#1E293B', marginVertical: 8 },

  // Rate table
  tableNote: { color: '#334155', fontSize: 11, marginBottom: 18, lineHeight: 16 },
  catBlock: { borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  catHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, gap: 8 },
  catDot: { width: 7, height: 7, borderRadius: 4 },
  catHeadText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3, flex: 1 },
  tHead: {
    flexDirection: 'row', backgroundColor: '#0A111E',
    paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#1E293B',
  },
  th: { flex: 1, color: '#334155', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  tRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12 },
  tRowAlt: { backgroundColor: '#070B1480' },
  tdRange: { flex: 1, color: '#CBD5E1', fontSize: 12, fontWeight: '700' },
  td: { flex: 1, fontSize: 12, fontWeight: '700' },

  // Notes
  noteBox: {
    marginTop: 18, backgroundColor: '#070B14', borderRadius: 12,
    padding: 16, gap: 9, borderWidth: 1, borderColor: '#1E293B',
  },
  noteLine: { color: '#334155', fontSize: 11, lineHeight: 17 },
});