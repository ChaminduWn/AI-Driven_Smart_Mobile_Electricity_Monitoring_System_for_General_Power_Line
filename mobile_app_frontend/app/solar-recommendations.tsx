import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Dimensions,
  FlatList,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const { width, height } = Dimensions.get('window');
const USD_TO_LKR_RATE = 320;

const SERVER_URL = Platform.OS === 'android' ? "http://10.0.2.2:5000/recommend" : "http://localhost:5000/recommend";

const PROVINCES = [
  "Western Province (Colombo)", "Central Province (Kandy)", "Southern Province (Galle)",
  "North Western Province (Kurunegala)", "North Central Province (Anuradhapura)",
  "Eastern Province (Batticaloa)", "Northern Province (Jaffna)", "Uva Province (Badulla)",
  "Sabaragamuwa Province (Ratnapura)",
];

interface HardwareItem {
  brand: string;
  rank: number | string;
  type: string;
  price?: number;
  details?: {
    efficiency_percent?: number;
    power_w?: number;
    capacity_kwh?: number;
  };
}

export default function SolarRecommendations() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<HardwareItem | null>(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const [form, setForm] = useState({
    Budget_LKR: '',
    Roof_Size_m2: '',
    Energy_Usage_kWhPerDay: '',
    Location: "Western Province (Colombo)",
  });

  const handleGenerateAnalysis = async () => {
    if (!form.Budget_LKR || !form.Roof_Size_m2 || !form.Energy_Usage_kWhPerDay) {
      Alert.alert("Missing Info", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(SERVER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Budget_LKR: Number(form.Budget_LKR),
          Roof_Size_m2: Number(form.Roof_Size_m2),
          Energy_Usage_kWhPerDay: Number(form.Energy_Usage_kWhPerDay),
          Location: form.Location,
        }),
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error("Connection Error:", err);
      Alert.alert("Connection Error", "Ensure your server is running on " + SERVER_URL);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconCircle}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Solar Expert</ThemedText>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Input Card */}
        <View style={styles.inputCard}>
          <ThemedText style={styles.cardHeader}>System Requirements</ThemedText>

          <TouchableOpacity style={styles.locationSelector} onPress={() => setLocationModalVisible(true)}>
            <Ionicons name="location" size={20} color="#0ea5e9" />
            <View style={styles.locationTextContainer}>
              <ThemedText style={styles.label}>Location</ThemedText>
              <ThemedText style={styles.value}>{form.Location}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.row}>
            <InputField icon="wallet-outline" label="Budget (LKR)" placeholder="0.00" value={form.Budget_LKR} onChange={(t: string) => setForm({ ...form, Budget_LKR: t })} />
            <View style={{ width: 15 }} />
            <InputField icon="resize-outline" label="Roof (m²)" placeholder="50" value={form.Roof_Size_m2} onChange={(t: string) => setForm({ ...form, Roof_Size_m2: t })} />
          </View>

          <InputField icon="flash-outline" label="Usage (kWh/Day)" placeholder="15" value={form.Energy_Usage_kWhPerDay} onChange={(t: string) => setForm({ ...form, Energy_Usage_kWhPerDay: t })} />

          <TouchableOpacity style={[styles.mainBtn, loading && { opacity: 0.8 }]} onPress={handleGenerateAnalysis} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <View style={styles.btnRow}>
                <ThemedText style={styles.btnText}>Optimize System</ThemedText>
                <Ionicons name="sparkles" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Results Area */}
        {response && (
          <View style={styles.resultsArea}>
            <ThemedText style={styles.sectionTitle}>Smart Recommendations</ThemedText>

            {/* Best System Configuration Banner */}
            <View style={styles.bestConfigCard}>
              <View style={styles.greenHeader}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <ThemedText style={styles.greenHeaderText}>Best System Configuration</ThemedText>
              </View>

              <View style={styles.configPriceContainer}>
                <ThemedText style={styles.priceLabel}>TOTAL ESTIMATED INVESTMENT</ThemedText>
                <ThemedText style={styles.summaryPrice}>Rs. {((response.recommended_configuration?.total_cost || 0) * USD_TO_LKR_RATE).toLocaleString()}</ThemedText>
                <ThemedText style={styles.summaryStat}>
                    Remaining Budget: Rs. {((response.recommended_configuration?.budget_remaining || 0) * USD_TO_LKR_RATE).toLocaleString()}
                </ThemedText>
              </View>

              {/* Configuration Details Grid */}
              <View style={styles.configDetailGrid}>
                <View style={styles.configDetailItem}>
                  <Ionicons name="sunny" size={16} color="#f59e0b" />
                  <ThemedText style={styles.detailSmallLabel}>Panel</ThemedText>
                  <ThemedText style={styles.detailSmallValue} numberOfLines={1}>
                    {response.recommended_configuration?.panel?.brand || 'N/A'}
                  </ThemedText>
                </View>
                <View style={styles.configDetailItem}>
                  <Ionicons name="flash" size={16} color="#3b82f6" />
                  <ThemedText style={styles.detailSmallLabel}>Inverter</ThemedText>
                  <ThemedText style={styles.detailSmallValue} numberOfLines={1}>
                    {response.recommended_configuration?.inverter?.brand || 'N/A'}
                  </ThemedText>
                </View>
                <View style={[styles.configDetailItem, { borderRightWidth: 0 }]}>
                  <Ionicons name="battery-charging" size={16} color="#10b981" />
                  <ThemedText style={styles.detailSmallLabel}>Storage</ThemedText>
                  <ThemedText style={styles.detailSmallValue} numberOfLines={1}>
                    {response.recommended_configuration?.battery?.brand || 'N/A'}
                  </ThemedText>
                </View>
              </View>

              {/* Installer Information */}
              <View style={styles.installerRow}>
                <Ionicons name="business" size={14} color="#64748b" />
                <ThemedText style={styles.installerText}>
                    Installer: <ThemedText style={{fontWeight: '700'}}>{response.recommended_configuration?.installer?.company || 'Local Pro'}</ThemedText>
                </ThemedText>
              </View>

              <View style={styles.paybackContainer}>
                <Ionicons name="trending-up" size={14} color="#0ea5e9" />
                <ThemedText style={styles.paybackText}>Maximum efficiency configuration based on your budget</ThemedText>
              </View>
            </View>

            {/* Hardware Lists */}
            {response.recommendations?.panels && (
              <HorizontalScrollSection title="Solar Panels" data={response.recommendations.panels} icon="sunny" color="#f59e0b" onPress={(i: any) => setSelectedItem({ ...i, type: 'Solar Panel' })} />
            )}
            {response.recommendations?.inverters && (
              <HorizontalScrollSection title="Inverters" data={response.recommendations.inverters} icon="flash" color="#3b82f6" onPress={(i: any) => setSelectedItem({ ...i, type: 'Inverter' })} />
            )}
            {response.recommendations?.batteries && (
              <HorizontalScrollSection title="Batteries" data={response.recommendations.batteries} icon="battery-charging" color="#10b981" onPress={(i: any) => setSelectedItem({ ...i, type: 'Battery' })} />
            )}
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={!!selectedItem} transparent animationType="fade">
        <View style={styles.centeredModal}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View style={styles.tierTag}><ThemedText style={styles.tierTagText}>TIER {selectedItem?.rank || '1'}</ThemedText></View>
              <TouchableOpacity onPress={() => setSelectedItem(null)}><Ionicons name="close-circle" size={32} color="#cbd5e1" /></TouchableOpacity>
            </View>
            <ThemedText style={styles.detailBrand}>{selectedItem?.brand}</ThemedText>
            <ThemedText style={styles.detailTypeLabel}>{selectedItem?.type}</ThemedText>
            
            <View style={styles.specGrid}>
              <View style={styles.specItem}>
                <Ionicons name="cash-outline" size={20} color="#10b981" /><ThemedText style={styles.specLabel}>Price</ThemedText>
                <ThemedText style={styles.specValue}>Rs. {((selectedItem?.price || 0) * USD_TO_LKR_RATE).toLocaleString()}</ThemedText>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="speedometer" size={20} color="#f59e0b" /><ThemedText style={styles.specLabel}>Status</ThemedText>
                <ThemedText style={styles.specValue}>Available</ThemedText>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="ribbon" size={20} color="#3b82f6" /><ThemedText style={styles.specLabel}>Quality</ThemedText>
                <ThemedText style={styles.specValue}>Verified</ThemedText>
              </View>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setSelectedItem(null)}><ThemedText style={styles.btnText}>Close</ThemedText></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Location Modal */}
      <Modal visible={locationModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.bottomSheet}>
            <View style={styles.dragHandle} />
            <ThemedText style={styles.modalTitle}>Select Province</ThemedText>
            <FlatList data={PROVINCES} keyExtractor={(item) => item} renderItem={({ item }) => (
              <TouchableOpacity style={styles.provinceRow} onPress={() => { setForm({ ...form, Location: item }); setLocationModalVisible(false); }}>
                <ThemedText style={[styles.provinceText, item === form.Location && { color: '#0ea5e9', fontWeight: 'bold' }]}>{item}</ThemedText>
              </TouchableOpacity>
            )} />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setLocationModalVisible(false)}><ThemedText style={{ color: '#ef4444', fontWeight: 'bold' }}>Cancel</ThemedText></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const InputField = ({ icon, label, value, onChange, placeholder }: any) => (
  <View style={styles.inputWrapper}>
    <ThemedText style={styles.label}>{label}</ThemedText>
    <View style={styles.inputBox}>
      <Ionicons name={icon} size={16} color="#64748b" />
      <TextInput style={styles.field} placeholder={placeholder} placeholderTextColor="#94a3b8" keyboardType="numeric" value={value} onChangeText={onChange} />
    </View>
  </View>
);

const HorizontalScrollSection = ({ title, data, icon, color, onPress }: any) => (
  <View style={styles.listSection}>
    <View style={styles.sectionHeaderRow}>
      <Ionicons name={icon} size={18} color={color} />
      <ThemedText style={styles.listHeaderTitle}>{title}</ThemedText>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }}>
      {data.map((item: any, idx: number) => (
        <TouchableOpacity key={idx} style={styles.productCard} onPress={() => onPress(item)}>
          <View style={styles.badge}><ThemedText style={styles.badgeText}>TIER {item.rank || '1'}</ThemedText></View>
          <ThemedText style={styles.brandName} numberOfLines={1}>{item.brand}</ThemedText>
          <View style={styles.specsBtnOutline}><ThemedText style={styles.specsBtnText}>VIEW INFO</ThemedText></View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15, backgroundColor: '#fff' },
  iconCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  scrollContainer: { paddingBottom: 40 },
  inputCard: { margin: 20, backgroundColor: '#fff', borderRadius: 24, padding: 20, elevation: 4 },
  cardHeader: { fontSize: 16, fontWeight: '800', marginBottom: 15, color: '#1e293b' },
  locationSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#f1f5f9' },
  locationTextContainer: { flex: 1, marginLeft: 10 },
  label: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  value: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  row: { flexDirection: 'row' },
  inputWrapper: { flex: 1, marginBottom: 15 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 12, height: 48, borderWidth: 1, borderColor: '#f1f5f9' },
  field: { flex: 1, marginLeft: 8, fontWeight: '600', fontSize: 14 },
  mainBtn: { backgroundColor: '#0f172a', borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  resultsArea: { marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginLeft: 20, marginBottom: 15, color: '#0f172a' },
  bestConfigCard: { margin: 20, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
  greenHeader: { backgroundColor: '#22c55e', flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  greenHeaderText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  configPriceContainer: { padding: 20, alignItems: 'center' },
  priceLabel: { fontSize: 10, color: '#64748b', fontWeight: '800', letterSpacing: 1 },
  summaryPrice: { color: '#ef4444', fontSize: 26, fontWeight: '900', marginVertical: 4 },
  summaryStat: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  configDetailGrid: { flexDirection: 'row', paddingHorizontal: 15, paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15 },
  configDetailItem: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#f1f5f9' },
  detailSmallLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },
  detailSmallValue: { fontSize: 11, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  installerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 6 },
  installerText: { fontSize: 12, color: '#64748b' },
  paybackContainer: { backgroundColor: '#f0f9ff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 20 },
  paybackText: { fontSize: 11, color: '#0369a1', fontWeight: '600', textAlign: 'center' },
  listSection: { marginBottom: 25 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 20, marginBottom: 12, gap: 8 },
  listHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  productCard: { backgroundColor: '#fff', width: 140, borderRadius: 18, padding: 15, marginRight: 15, borderWidth: 1, borderColor: '#f1f5f9', alignItems: 'center' },
  badge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 10 },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#64748b' },
  brandName: { fontWeight: '700', fontSize: 14, color: '#1e293b', marginBottom: 10, textAlign: 'center' },
  specsBtnOutline: { borderWidth: 1, borderColor: '#3b82f6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  specsBtnText: { color: '#3b82f6', fontSize: 9, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: height * 0.6 },
  dragHandle: { width: 36, height: 4, backgroundColor: '#e2e8f0', alignSelf: 'center', borderRadius: 2, marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 15 },
  provinceRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  provinceText: { fontSize: 15, color: '#475569' },
  closeBtn: { padding: 15, alignItems: 'center' },
  centeredModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  detailCard: { width: width * 0.88, backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  tierTag: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tierTagText: { fontSize: 10, fontWeight: '800', color: '#0f172a' },
  detailBrand: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  detailTypeLabel: { fontSize: 14, color: '#64748b', fontWeight: '600', marginBottom: 20 },
  specGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  specItem: { alignItems: 'center', width: '32%' },
  specLabel: { fontSize: 9, color: '#94a3b8', marginTop: 5, fontWeight: '700', textTransform: 'uppercase' },
  specValue: { fontSize: 11, fontWeight: '800', color: '#1e293b', marginTop: 2, textAlign: 'center' },
  actionBtn: { backgroundColor: '#0f172a', padding: 15, borderRadius: 12, alignItems: 'center' }
});