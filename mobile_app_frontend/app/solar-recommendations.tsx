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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const { width, height } = Dimensions.get('window');
const USD_TO_LKR_RATE = 320;

const PROVINCES = [
  "Western Province (Colombo)", "Central Province (Kandy)", "Southern Province (Galle)",
  "North Western Province (Kurunegala)", "North Central Province (Anuradhapura)",
  "Eastern Province (Batticaloa)", "Northern Province (Jaffna)", "Uva Province (Badulla)",
  "Sabaragamuwa Province (Ratnapura)",
];

// Define exactly what a hardware item looks like to prevent "undefined" errors
interface HardwareItem {
  brand: string;
  rank: number | string;
  type: string;
  details: {
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
    if (!form.Budget_LKR || !form.Roof_Size_m2 || !form.Energy_Usage_kWhPerDay) return;
    setLoading(true);
    try {
      // For local testing on Emulator: http://10.0.2.2:5000/recommend
      // For Physical device: Use your Computer's IP address
      const res = await fetch("http://localhost:5000/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          Budget_LKR: Number(form.Budget_LKR),
          Roof_Size_m2: Number(form.Roof_Size_m2),
          Energy_Usage_kWhPerDay: Number(form.Energy_Usage_kWhPerDay),
        }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error("Connection Error:", err);
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
            <InputField icon="wallet-outline" label="Budget (LKR)" placeholder="0.00" value={form.Budget_LKR} onChange={(t:string) => setForm({...form, Budget_LKR: t})} />
            <View style={{ width: 15 }} />
            <InputField icon="resize-outline" label="Roof (m²)" placeholder="50" value={form.Roof_Size_m2} onChange={(t:string) => setForm({...form, Roof_Size_m2: t})} />
          </View>

          <InputField icon="flash-outline" label="Usage (kWh/Day)" placeholder="15" value={form.Energy_Usage_kWhPerDay} onChange={(t:string) => setForm({...form, Energy_Usage_kWhPerDay: t})} />

          <TouchableOpacity style={[styles.mainBtn, loading && { opacity: 0.8 }]} onPress={handleGenerateAnalysis} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <View style={styles.btnRow}>
                <ThemedText style={styles.btnText}>Optimize System</ThemedText>
                <Ionicons name="sparkles" size={18} color="#fff" style={{marginLeft: 8}} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Results Area */}
        {response && (
          <View style={styles.resultsArea}>
            <ThemedText style={styles.sectionTitle}>Smart Results</ThemedText>
            
            <View style={styles.summaryCard}>
               <ThemedText style={styles.summaryLabel}>ESTIMATED TOTAL</ThemedText>
               <ThemedText style={styles.summaryPrice}>Rs. {((response.recommended_configuration?.total_cost || 0) * USD_TO_LKR_RATE).toLocaleString()}</ThemedText>
               <ThemedText style={styles.summaryStat}>{response.recommended_configuration?.system_size_kw}kW System Recommended</ThemedText>
            </View>

            {response.recommendations?.panels && (
              <HorizontalScrollSection title="Solar Panels" data={response.recommendations.panels} onPress={(i: any) => setSelectedItem({...i, type: 'Solar Panel'})} />
            )}
            
            {response.recommendations?.inverters && (
              <HorizontalScrollSection title="Inverters" data={response.recommendations.inverters} onPress={(i: any) => setSelectedItem({...i, type: 'Inverter'})} />
            )}
          </View>
        )}
      </ScrollView>

      {/* --- LOCATION MODAL --- */}
      <Modal visible={locationModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.bottomSheet}>
            <View style={styles.dragHandle} />
            <ThemedText style={styles.modalTitle}>Select Province</ThemedText>
            <FlatList data={PROVINCES} keyExtractor={(item) => item} renderItem={({ item }) => (
              <TouchableOpacity style={styles.provinceRow} onPress={() => {setForm({...form, Location: item}); setLocationModalVisible(false);}}>
                <ThemedText style={[styles.provinceText, item === form.Location && { color: '#0ea5e9', fontWeight: 'bold' }]}>{item}</ThemedText>
                {item === form.Location && <Ionicons name="checkmark-circle" size={20} color="#0ea5e9" />}
              </TouchableOpacity>
            )} />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setLocationModalVisible(false)}><ThemedText style={{color: '#ef4444', fontWeight: 'bold'}}>Cancel</ThemedText></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- BEAUTIFUL DETAIL MODAL --- */}
      <Modal visible={!!selectedItem} transparent animationType="fade">
        <View style={styles.centeredModal}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View style={styles.tierTag}>
                <ThemedText style={styles.tierTagText}>TIER {selectedItem?.rank}</ThemedText>
              </View>
              <TouchableOpacity onPress={() => setSelectedItem(null)}>
                <Ionicons name="close-circle" size={32} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <ThemedText style={styles.detailBrand}>{selectedItem?.brand}</ThemedText>
            <ThemedText style={styles.detailTypeLabel}>{selectedItem?.type}</ThemedText>
            
            <View style={styles.specGrid}>
              <View style={styles.specItem}>
                <Ionicons name="flash" size={20} color="#f59e0b" />
                <ThemedText style={styles.specLabel}>Power</ThemedText>
                <ThemedText style={styles.specValue}>
                    {selectedItem?.details?.power_w ? `${selectedItem.details.power_w}W` : (selectedItem?.details?.capacity_kwh ? `${selectedItem.details.capacity_kwh}kWh` : 'N/A')}
                </ThemedText>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="speedometer" size={20} color="#10b981" />
                <ThemedText style={styles.specLabel}>Efficiency</ThemedText>
                <ThemedText style={styles.specValue}>{selectedItem?.details?.efficiency_percent ? `${selectedItem.details.efficiency_percent}%` : 'Standard'}</ThemedText>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="ribbon" size={20} color="#3b82f6" />
                <ThemedText style={styles.specLabel}>Quality</ThemedText>
                <ThemedText style={styles.specValue}>High</ThemedText>
              </View>
            </View>

            <View style={styles.infoBox}>
               <ThemedText style={styles.infoText}>This hardware is optimized for high-temperature climates like Sri Lanka, ensuring minimal power loss during peak sun hours.</ThemedText>
            </View>

            <TouchableOpacity style={styles.actionBtn} onPress={() => setSelectedItem(null)}>
              <ThemedText style={styles.btnText}>Close Details</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

// --- SUB-COMPONENTS ---

const InputField = ({ icon, label, value, onChange, placeholder }: any) => (
  <View style={styles.inputWrapper}>
    <ThemedText style={styles.label}>{label}</ThemedText>
    <View style={styles.inputBox}>
      <Ionicons name={icon} size={16} color="#64748b" />
      <TextInput style={styles.field} placeholder={placeholder} placeholderTextColor="#94a3b8" keyboardType="numeric" value={value} onChangeText={onChange} />
    </View>
  </View>
);

const HorizontalScrollSection = ({ title, data, onPress }: any) => (
  <View style={styles.listSection}>
    <ThemedText style={styles.listHeaderTitle}>{title}</ThemedText>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }}>
      {data.map((item: any, idx: number) => (
        <TouchableOpacity key={idx} style={styles.productCard} onPress={() => onPress(item)}>
          <View style={styles.badge}><ThemedText style={styles.badgeText}>T{item.rank}</ThemedText></View>
          <ThemedText style={styles.brandName} numberOfLines={1}>{item.brand}</ThemedText>
          <ThemedText style={styles.viewLink}>View Details</ThemedText>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15, backgroundColor: '#fff' },
  iconCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  scrollContainer: { paddingBottom: 40 },
  inputCard: { margin: 20, backgroundColor: '#fff', borderRadius: 24, padding: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
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
  summaryCard: { marginHorizontal: 20, backgroundColor: '#0ea5e9', borderRadius: 20, padding: 20, marginBottom: 25 },
  summaryLabel: { color: '#e0f2fe', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  summaryPrice: { color: '#fff', fontSize: 24, fontWeight: '900', marginVertical: 4 },
  summaryStat: { color: '#fff', opacity: 0.8, fontSize: 13, fontWeight: '600' },
  listSection: { marginBottom: 25 },
  listHeaderTitle: { fontSize: 15, fontWeight: '700', marginLeft: 20, marginBottom: 12, color: '#475569' },
  productCard: { backgroundColor: '#fff', width: 140, borderRadius: 18, padding: 15, marginRight: 15, borderWidth: 1, borderColor: '#f1f5f9' },
  badge: { backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#64748b' },
  brandName: { marginTop: 10, fontWeight: '700', fontSize: 14, color: '#1e293b' },
  viewLink: { marginTop: 4, fontSize: 11, color: '#0ea5e9', fontWeight: '700' },
  
  // MODALS
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: height * 0.6 },
  dragHandle: { width: 36, height: 4, backgroundColor: '#e2e8f0', alignSelf: 'center', borderRadius: 2, marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 15 },
  provinceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  provinceText: { fontSize: 15, color: '#475569' },
  closeBtn: { padding: 15, alignItems: 'center' },
  centeredModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  detailCard: { width: width * 0.88, backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tierTag: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tierTagText: { fontSize: 10, fontWeight: '800', color: '#0f172a' },
  detailBrand: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  detailTypeLabel: { fontSize: 14, color: '#64748b', fontWeight: '600', marginBottom: 20 },
  specGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  specItem: { alignItems: 'center', width: '30%' },
  specLabel: { fontSize: 9, color: '#94a3b8', marginTop: 5, fontWeight: '700', textTransform: 'uppercase' },
  specValue: { fontSize: 12, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  infoBox: { backgroundColor: '#f0f9ff', padding: 15, borderRadius: 12, marginBottom: 20 },
  infoText: { fontSize: 12, color: '#0c4a6e', lineHeight: 18, textAlign: 'center' },
  actionBtn: { backgroundColor: '#0f172a', padding: 15, borderRadius: 12, alignItems: 'center' }
});