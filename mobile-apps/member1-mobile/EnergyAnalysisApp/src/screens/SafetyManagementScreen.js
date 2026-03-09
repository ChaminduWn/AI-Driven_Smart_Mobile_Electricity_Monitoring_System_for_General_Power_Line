import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Animated,
  FlatList, ActivityIndicator, StatusBar, SafeAreaView,
} from 'react-native';

/* ─────────────────────────────────────────────
   DESIGN TOKENS  — deep navy + teal safety theme
───────────────────────────────────────────── */
const C = {
  bg: '#07111F',
  bg2: '#0D1B2A',
  bg3: '#122236',
  card: '#0F1E30',
  card2: '#132030',

  safety: '#00E5A0',   // primary mint-green
  energy: '#00C8FF',   // cyan
  warning: '#FFD60A',   // amber
  danger: '#FF4D6D',   // red
  calm: '#5B8CFF',   // soft blue

  textPrimary: '#E8F4FF',
  textSecondary: '#7A9CC0',
  textMuted: '#3D5570',
  border: '#1A3050',
  divider: '#162A40',
};

/* ─────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────── */
const AI_SUGGESTIONS = [
  "What should I do during a power outage?",
  "How do I handle electrical fires?",
  "Emergency kit essentials?",
  "Is it safe to use generators indoors?",
];

const INITIAL_AI_MESSAGES = [
  {
    id: '1',
    role: 'assistant',
    text: "Hello! I'm your Safety & Disaster AI assistant 🛡️\n\nI can help you with:\n• Electrical emergency guidance\n• Disaster preparedness tips\n• Safety checklists\n• Emergency contact info\n\nHow can I assist you today?",
  },
];

const WEATHER_DATA = {
  location: 'Colombo, Sri Lanka',
  temp: 31,
  feels: 36,
  condition: 'Partly Cloudy',
  icon: '⛅',
  humidity: 78,
  wind: 14,
  uvIndex: 8,
  visibility: 10,
  alerts: [
    { type: 'UV Warning', level: 'HIGH', desc: 'UV index is very high. Limit sun exposure between 10AM–4PM.', color: C.warning },
    { type: 'Heat Advisory', level: 'MODERATE', desc: 'Feels like 36°C. Stay hydrated and avoid strenuous activity.', color: C.danger },
  ],
  hourly: [
    { time: 'Now', temp: 31, icon: '⛅' },
    { time: '2PM', temp: 32, icon: '☀️' },
    { time: '4PM', temp: 30, icon: '🌤️' },
    { time: '6PM', temp: 28, icon: '⛅' },
    { time: '8PM', temp: 26, icon: '🌙' },
    { time: '10PM', temp: 25, icon: '🌙' },
  ],
};

const DISASTER_PLANS = [
  {
    id: '1',
    icon: '⚡',
    title: 'Power Outage',
    risk: 'HIGH',
    riskColor: C.danger,
    steps: [
      'Switch off main circuit breaker',
      'Use battery-powered lighting only',
      'Keep refrigerator closed — food safe 4 hrs',
      'Report outage via ElecSmart app',
      'Charge backup devices immediately',
    ],
    contacts: ['CEB Hotline: 1987', 'Emergency: 119'],
  },
  {
    id: '2',
    icon: '🌊',
    title: 'Flash Flood',
    risk: 'MODERATE',
    riskColor: C.warning,
    steps: [
      'Move to higher ground immediately',
      'Avoid walking through flood water',
      'Turn off electricity at breaker',
      'Do not drive through flooded roads',
      'Contact emergency services',
    ],
    contacts: ['DMC: 117', 'Police: 119', 'Fire: 110'],
  },
  {
    id: '3',
    icon: '🔥',
    title: 'Electrical Fire',
    risk: 'HIGH',
    riskColor: C.danger,
    steps: [
      'Do NOT use water — use CO₂ extinguisher',
      'Cut power at main breaker if safe',
      'Evacuate building immediately',
      'Call fire department right away',
      'Do not re-enter until cleared',
    ],
    contacts: ['Fire: 110', 'Emergency: 119'],
  },
  {
    id: '4',
    icon: '🌪️',
    title: 'Strong Storm',
    risk: 'LOW',
    riskColor: C.safety,
    steps: [
      'Stay indoors away from windows',
      'Unplug non-essential electronics',
      'Use surge protectors',
      'Keep emergency kit accessible',
      'Monitor weather updates',
    ],
    contacts: ['Met Dept: +94 11 2694841', 'DMC: 117'],
  },
];

const SAFETY_CHECKLIST = [
  { id: '1', item: 'Smoke detector batteries checked', critical: true },
  { id: '2', item: 'Fire extinguisher inspected', critical: true },
  { id: '3', item: 'Emergency contacts updated', critical: false },
  { id: '4', item: 'First-aid kit stocked', critical: true },
  { id: '5', item: 'Electrical panel labeled', critical: false },
  { id: '6', item: 'Surge protectors installed', critical: false },
  { id: '7', item: 'Evacuation plan posted', critical: true },
  { id: '8', item: 'Backup power source ready', critical: false },
];

/* ─────────────────────────────────────────────
   AI RESPONSE GENERATOR (mock)
───────────────────────────────────────────── */
const getAIResponse = (question) => {
  const q = question.toLowerCase();
  if (q.includes('outage') || q.includes('power')) {
    return "During a power outage:\n\n1. **Stay calm** and locate flashlights/candles\n2. **Switch off** major appliances to prevent surge damage when power returns\n3. **Keep refrigerator closed** — food stays safe for ~4 hours\n4. **Report via ElecSmart** to alert your area utility\n5. **Charge devices** using backup batteries\n\n⚠️ Never use generators indoors — carbon monoxide risk!";
  }
  if (q.includes('fire') || q.includes('electrical fire')) {
    return "For electrical fires:\n\n🚨 **NEVER use water** on electrical fires!\n\n1. Cut power at the main breaker if safe\n2. Use a **CO₂ or dry powder extinguisher**\n3. Evacuate everyone immediately\n4. Call Fire Department: **110**\n5. Do not re-enter until fire department clears it\n\nPrevention: Check for frayed wires and overloaded outlets regularly.";
  }
  if (q.includes('kit') || q.includes('emergency kit')) {
    return "Emergency kit essentials:\n\n✅ **Basics**\n• Water (3L/person/day for 3 days)\n• Non-perishable food (3-day supply)\n• First-aid kit & medications\n\n✅ **Power & Communication**\n• Flashlights + extra batteries\n• Battery-powered radio\n• Phone charger + power bank\n\n✅ **Documents**\n• ID copies, insurance docs\n• Emergency contacts list\n• Cash in small bills";
  }
  if (q.includes('generator')) {
    return "⚠️ **Generator Safety**\n\nNEVER run generators indoors or in garages — carbon monoxide (CO) is odorless and deadly.\n\n✅ **Safe use:**\n• Place at least 6 meters from windows/doors\n• Install CO detectors in your home\n• Dry hands before operating\n• Let it cool before refueling\n• Use heavy-duty outdoor extension cords\n\nIf someone feels dizzy/nauseous near a generator — move to fresh air immediately and call 119.";
  }
  return "Thank you for your question! Here are some general safety tips:\n\n🛡️ **Stay Prepared:**\n• Keep emergency contacts saved\n• Maintain a first-aid kit\n• Know your evacuation routes\n• Check smoke detectors monthly\n\nFor specific emergencies, always contact:\n• Emergency: **119**\n• Fire: **110**\n• Police: **118**\n\nWould you like more specific guidance on any safety topic?";
};

/* ═══════════════════════════════════════════
   TAB: AI ASSISTANT
═══════════════════════════════════════════ */
const AIAssistantTab = () => {
  const [messages, setMessages] = useState(INITIAL_AI_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  const sendMessage = (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput('');

    const userEntry = { id: Date.now().toString(), role: 'user', text: userMsg };
    setMessages(prev => [...prev, userEntry]);
    setIsTyping(true);

    setTimeout(() => {
      const aiReply = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: getAIResponse(userMsg),
      };
      setMessages(prev => [...prev, aiReply]);
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1200);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={120}
    >
      {/* suggestion chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 12 }}>
        {AI_SUGGESTIONS.map((s, i) => (
          <TouchableOpacity key={i} onPress={() => sendMessage(s)} style={styles.chip}>
            <Text style={styles.chipText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* message list */}
      <ScrollView
        ref={scrollRef}
        style={styles.msgList}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(m => (
          <View
            key={m.id}
            style={[
              styles.bubble,
              m.role === 'user' ? styles.bubbleUser : styles.bubbleAI,
            ]}
          >
            {m.role === 'assistant' && (
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>🛡️ AI</Text>
              </View>
            )}
            <Text style={[styles.bubbleText, m.role === 'user' && styles.bubbleTextUser]}>
              {m.text}
            </Text>
          </View>
        ))}
        {isTyping && (
          <View style={[styles.bubble, styles.bubbleAI]}>
            <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>🛡️ AI</Text></View>
            <View style={styles.typingDots}>
              <ActivityIndicator size="small" color={C.safety} />
              <Text style={styles.typingText}>  Analysing...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about safety or emergencies..."
          placeholderTextColor={C.textMuted}
          multiline
          maxLength={300}
        />
        <TouchableOpacity onPress={() => sendMessage()} style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}>
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

/* ═══════════════════════════════════════════
   TAB: TODAY'S WEATHER
═══════════════════════════════════════════ */
const WeatherTab = () => {
  const w = WEATHER_DATA;

  const uvColor = w.uvIndex >= 8 ? C.danger : w.uvIndex >= 6 ? C.warning : C.safety;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>

      {/* main weather card */}
      <View style={styles.weatherHero}>
        <View style={styles.weatherGradientBar} />
        <View style={{ padding: 20 }}>
          <Text style={styles.weatherLocation}>📍 {w.location}</Text>
          <View style={styles.weatherMain}>
            <Text style={styles.weatherIcon}>{w.icon}</Text>
            <View>
              <Text style={styles.weatherTemp}>{w.temp}°C</Text>
              <Text style={styles.weatherCondition}>{w.condition}</Text>
              <Text style={styles.weatherFeels}>Feels like {w.feels}°C</Text>
            </View>
          </View>
          {/* hourly */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {w.hourly.map((h, i) => (
                <View key={i} style={[styles.hourlyItem, i === 0 && { backgroundColor: C.energy + '20', borderColor: C.energy + '50' }]}>
                  <Text style={styles.hourlyTime}>{h.time}</Text>
                  <Text style={styles.hourlyIcon}>{h.icon}</Text>
                  <Text style={styles.hourlyTemp}>{h.temp}°</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* stats grid */}
      <View style={styles.weatherGrid}>
        <WeatherStat icon="💧" label="Humidity" value={`${w.humidity}%`} color={C.energy} />
        <WeatherStat icon="💨" label="Wind" value={`${w.wind} km/h`} color={C.calm} />
        <WeatherStat icon="☀️" label="UV Index" value={`${w.uvIndex}/11`} color={uvColor} />
        <WeatherStat icon="👁️" label="Visibility" value={`${w.visibility} km`} color={C.safety} />
      </View>

      {/* alerts */}
      {w.alerts.length > 0 && (
        <View>
          <SectionLabel text="⚠️  Active Weather Alerts" />
          {w.alerts.map((a, i) => (
            <View key={i} style={[styles.alertCard, { borderLeftColor: a.color, borderLeftWidth: 4 }]}>
              <View style={styles.alertTop}>
                <Text style={styles.alertType}>{a.type}</Text>
                <View style={[styles.alertLevelBadge, { backgroundColor: a.color + '25', borderColor: a.color + '60', borderWidth: 1 }]}>
                  <Text style={[styles.alertLevelText, { color: a.color }]}>{a.level}</Text>
                </View>
              </View>
              <Text style={styles.alertDesc}>{a.desc}</Text>
            </View>
          ))}
        </View>
      )}

      {/* safety checklist */}
      <SectionLabel text="🛡️  Daily Safety Checklist" />
      <View style={styles.checklistCard}>
        {SAFETY_CHECKLIST.map((item, i) => (
          <ChecklistItem key={item.id} item={item} isLast={i === SAFETY_CHECKLIST.length - 1} />
        ))}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const WeatherStat = ({ icon, label, value, color }) => (
  <View style={[styles.wStat, { borderTopColor: color + '70', borderTopWidth: 2 }]}>
    <Text style={styles.wStatIcon}>{icon}</Text>
    <Text style={[styles.wStatValue, { color }]}>{value}</Text>
    <Text style={styles.wStatLabel}>{label}</Text>
  </View>
);

const ChecklistItem = ({ item, isLast }) => {
  const [checked, setChecked] = useState(false);
  return (
    <TouchableOpacity
      onPress={() => setChecked(!checked)}
      style={[styles.checkRow, !isLast && { borderBottomWidth: 1, borderBottomColor: C.divider }]}
    >
      <View style={[styles.checkbox, checked && { backgroundColor: C.safety, borderColor: C.safety }]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[styles.checkText, checked && { color: C.textMuted, textDecorationLine: 'line-through' }]}>
        {item.item}
      </Text>
      {item.critical && !checked && (
        <View style={styles.criticalBadge}>
          <Text style={styles.criticalText}>CRITICAL</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

/* ═══════════════════════════════════════════
   TAB: DISASTER MANAGEMENT
═══════════════════════════════════════════ */
const DisasterTab = () => {
  const [expanded, setExpanded] = useState(null);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>

      {/* emergency banner */}
      <View style={styles.emergencyBanner}>
        <Text style={styles.emergencyTitle}>🚨  Emergency Contacts</Text>
        <View style={styles.emergencyRow}>
          {[
            { label: 'Emergency', num: '119', color: C.danger },
            { label: 'Fire Dept', num: '110', color: C.warning },
            { label: 'CEB', num: '1987', color: C.energy },
            { label: 'DMC', num: '117', color: C.safety },
          ].map((c, i) => (
            <TouchableOpacity key={i} style={[styles.contactBtn, { borderColor: c.color + '50', backgroundColor: c.color + '15' }]}>
              <Text style={[styles.contactNum, { color: c.color }]}>{c.num}</Text>
              <Text style={styles.contactLabel}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <SectionLabel text="📋  Disaster Response Plans" />

      {DISASTER_PLANS.map(plan => (
        <TouchableOpacity
          key={plan.id}
          activeOpacity={0.85}
          onPress={() => setExpanded(expanded === plan.id ? null : plan.id)}
          style={[styles.disasterCard, { borderColor: plan.riskColor + '35' }]}
        >
          {/* card header */}
          <View style={[styles.disasterBar, { backgroundColor: plan.riskColor }]} />
          <View style={styles.disasterBody}>
            <View style={[styles.disasterIconWrap, { backgroundColor: plan.riskColor + '20', borderColor: plan.riskColor + '40', borderWidth: 1 }]}>
              <Text style={styles.disasterIcon}>{plan.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.disasterTitle}>{plan.title}</Text>
              <Text style={styles.disasterStepCount}>{plan.steps.length} response steps</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={[styles.riskBadge, { backgroundColor: plan.riskColor + '20', borderColor: plan.riskColor + '50', borderWidth: 1 }]}>
                <Text style={[styles.riskText, { color: plan.riskColor }]}>{plan.risk}</Text>
              </View>
              <Text style={[styles.expandArrow, { color: plan.riskColor, transform: [{ rotate: expanded === plan.id ? '90deg' : '0deg' }] }]}>›</Text>
            </View>
          </View>

          {/* expanded content */}
          {expanded === plan.id && (
            <View style={styles.disasterExpanded}>
              <View style={[styles.expandDivider, { backgroundColor: plan.riskColor + '30' }]} />
              <Text style={[styles.expandSubhead, { color: plan.riskColor }]}>Response Steps</Text>
              {plan.steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={[styles.stepNum, { backgroundColor: plan.riskColor + '25' }]}>
                    <Text style={[styles.stepNumText, { color: plan.riskColor }]}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
              <Text style={[styles.expandSubhead, { color: plan.riskColor, marginTop: 12 }]}>Emergency Contacts</Text>
              {plan.contacts.map((c, i) => (
                <Text key={i} style={styles.planContact}>📞 {c}</Text>
              ))}
            </View>
          )}
        </TouchableOpacity>
      ))}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

/* ─────────────────────────────────────────────
   SHARED SUB-COMPONENTS
───────────────────────────────────────────── */
const SectionLabel = ({ text }) => (
  <View style={styles.secLabel}>
    <Text style={styles.secLabelText}>{text}</Text>
  </View>
);

/* ═══════════════════════════════════════════
   ROOT SCREEN
═══════════════════════════════════════════ */
const TABS = [
  { key: 'ai', label: 'Safety AI', icon: '🤖' },
  { key: 'weather', label: 'Weather', icon: '🌤️' },
  { key: 'disaster', label: 'Disaster', icon: '🚨' },
];

const SafetyManagementScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('ai');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Safety & Disaster</Text>
          <Text style={styles.headerSub}>Management System</Text>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: C.safety + '20', borderColor: C.safety + '50', borderWidth: 1 }]}>
          <Text style={[styles.headerBadgeText, { color: C.safety }]}>🛡️ SAFE</Text>
        </View>
      </View>

      {/* ── TAB BAR ── */}
      <View style={styles.tabBar}>
        {TABS.map(t => {
          const active = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={styles.tabIcon}>{t.icon}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
              {active && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── CONTENT ── */}
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {activeTab === 'ai' && <AIAssistantTab />}
        {activeTab === 'weather' && <WeatherTab />}
        {activeTab === 'disaster' && <DisasterTab />}
      </View>
    </SafeAreaView>
  );
};

/* ═══════════════════════════════════════════
   STYLES
═══════════════════════════════════════════ */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* header */
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.bg2, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { padding: 6, marginRight: 8 },
  backIcon: { fontSize: 28, color: C.safety, fontWeight: '300', lineHeight: 30 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  headerBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  headerBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  /* tab bar */
  tabBar: {
    flexDirection: 'row', backgroundColor: C.bg2,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    position: 'relative',
  },
  tabActive: {},
  tabIcon: { fontSize: 18, marginBottom: 3 },
  tabLabel: { fontSize: 11, fontWeight: '600', color: C.textMuted },
  tabLabelActive: { color: C.safety, fontWeight: '700' },
  tabUnderline: { position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, backgroundColor: C.safety, borderRadius: 2 },

  /* AI tab */
  chips: { backgroundColor: C.bg2, maxHeight: 56, borderBottomWidth: 1, borderBottomColor: C.border },
  chip: { backgroundColor: C.safety + '15', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: C.safety + '40', alignSelf: 'flex-start' },
  chipText: { fontSize: 12, color: C.safety, fontWeight: '600' },

  msgList: { flex: 1, backgroundColor: C.bg },
  bubble: { maxWidth: '88%', borderRadius: 16, padding: 14 },
  bubbleAI: {
    backgroundColor: C.card, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: C.border,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: C.safety + '20', alignSelf: 'flex-end',
    borderWidth: 1, borderColor: C.safety + '50',
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 14, color: C.textPrimary, lineHeight: 21 },
  bubbleTextUser: { color: C.textPrimary },
  aiBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  aiBadgeText: { fontSize: 11, fontWeight: '700', color: C.safety, letterSpacing: 0.5 },
  typingDots: { flexDirection: 'row', alignItems: 'center' },
  typingText: { color: C.textMuted, fontSize: 13 },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, backgroundColor: C.bg2,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  input: {
    flex: 1, backgroundColor: C.bg3, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 10, color: C.textPrimary, fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.safety, justifyContent: 'center', alignItems: 'center' },
  sendIcon: { fontSize: 20, color: C.bg, fontWeight: '800' },

  /* weather tab */
  weatherHero: {
    backgroundColor: C.card, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
  },
  weatherGradientBar: { height: 3, backgroundColor: C.energy },
  weatherLocation: { fontSize: 13, color: C.textMuted, marginBottom: 10 },
  weatherMain: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  weatherIcon: { fontSize: 56 },
  weatherTemp: { fontSize: 42, fontWeight: '800', color: C.textPrimary, letterSpacing: -2 },
  weatherCondition: { fontSize: 16, color: C.textSecondary, fontWeight: '600' },
  weatherFeels: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  hourlyItem: {
    backgroundColor: C.bg3, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12,
    alignItems: 'center', gap: 5, borderWidth: 1, borderColor: C.border,
  },
  hourlyTime: { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  hourlyIcon: { fontSize: 20 },
  hourlyTemp: { fontSize: 14, color: C.textPrimary, fontWeight: '700' },

  weatherGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  wStat: {
    width: '47.5%', backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    paddingVertical: 14, alignItems: 'center', gap: 4,
  },
  wStatIcon: { fontSize: 22 },
  wStatValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  wStatLabel: { fontSize: 12, color: C.textMuted },

  alertCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  alertTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  alertType: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  alertLevelBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  alertLevelText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  alertDesc: { fontSize: 13, color: C.textSecondary, lineHeight: 19 },

  checklistCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  checkRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  checkmark: { fontSize: 13, color: C.bg, fontWeight: '900' },
  checkText: { flex: 1, fontSize: 14, color: C.textPrimary },
  criticalBadge: { backgroundColor: C.danger + '20', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: C.danger + '40' },
  criticalText: { fontSize: 9, fontWeight: '800', color: C.danger, letterSpacing: 0.5 },

  /* disaster tab */
  emergencyBanner: {
    backgroundColor: C.card, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: C.danger + '30',
    borderTopWidth: 3, borderTopColor: C.danger,
  },
  emergencyTitle: { fontSize: 14, fontWeight: '700', color: C.textPrimary, marginBottom: 12 },
  emergencyRow: { flexDirection: 'row', gap: 8 },
  contactBtn: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 10, alignItems: 'center', gap: 2 },
  contactNum: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  contactLabel: { fontSize: 10, color: C.textMuted, fontWeight: '600' },

  disasterCard: {
    backgroundColor: C.card, borderRadius: 18, borderWidth: 1,
    overflow: 'hidden', flexDirection: 'column',
  },
  disasterBar: { height: 3 },
  disasterBody: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  disasterIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  disasterIcon: { fontSize: 24 },
  disasterTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginBottom: 3 },
  disasterStepCount: { fontSize: 12, color: C.textMuted },
  riskBadge: { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 },
  riskText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  expandArrow: { fontSize: 22, fontWeight: '300', lineHeight: 24 },

  disasterExpanded: { paddingHorizontal: 14, paddingBottom: 16 },
  expandDivider: { height: 1, marginBottom: 14 },
  expandSubhead: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  stepNum: { width: 24, height: 24, borderRadius: 7, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  stepNumText: { fontSize: 12, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 13, color: C.textSecondary, lineHeight: 20 },
  planContact: { fontSize: 13, color: C.textSecondary, marginBottom: 4 },

  /* shared section label */
  secLabel: { marginBottom: 2 },
  secLabelText: { fontSize: 13, fontWeight: '700', color: C.textSecondary },
});

export default SafetyManagementScreen;
