import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert, Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { billsAPI } from '../api/billsAPI';
import { analysisAPI } from '../api/analysisAPI';
import { useAccount } from '../contexts/AccountContext';
import {
  SectionHeader, EmptyState, LoadingScreen, Card, PrimaryButton,
  Field, Divider, // Assume Field is available or use View/Text
} from '../components/SharedComponents';
import { COLORS, SPACING, RADIUS, FONTS, SHADOW } from '../utils/theme';
import { formatCurrency, formatDate, formatMonthYear } from '../utils/helpers';
import { Modal, TextInput } from 'react-native';

const BillsScreen = ({ navigation }) => {
  const { selectedAccount, addAccount } = useAccount();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [manualForm, setManualForm] = useState({
    current_meter_reading: '',
    past_bill_date: new Date().toISOString().split('T')[0],
    past_bill_amount: '',
    past_bill_units: '',
    past_bill_days: '30'
  });

  const fetchBills = useCallback(async () => {
    try {
      console.log('📥 Fetching bills...');
      const res = await billsAPI.getAll();
      console.log('✓ Bills fetched successfully:', res.data);
      const all = (res.data?.data || []).sort(
        (a, b) => new Date(b.bill_date) - new Date(a.bill_date),
      );
      setBills(all);

      // Register all discovered account numbers
      const seen = new Set();
      all.forEach((b) => { if (b.account_number) seen.add(b.account_number); });
      for (const acct of seen) { await addAccount(acct); }
    } catch (err) {
      console.error('❌ Bills fetch error:', err.response?.data || err.message);
      console.error('   Status:', err.response?.status);
      console.error('   Headers:', err.response?.headers);
      Alert.alert('Error', `Failed to fetch bills: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addAccount]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      doUpload(result.assets[0]);
    } catch (err) {
      Alert.alert('Error', 'Could not open file picker.');
    }
  };

  const doUpload = async (asset) => {
    setUploading(true);
    const formData = new FormData();

    if (asset.file) {
      formData.append('file', asset.file);
    } else {
      formData.append('file', {
        uri: asset.uri,
        name: asset.name || 'bill.pdf',
        type: asset.mimeType || 'application/pdf',
      });
    }

    try {
      console.log('📤 Uploading bill:', asset.name);
      const res = await billsAPI.upload(formData);
      console.log('✓ Bill uploaded successfully:', res.data);
      if (res.data.success) {
        const extracted = res.data.data;
        Alert.alert(
          '✅ Bill Uploaded',
          `Account: ${extracted?.account_number || 'N/A'}\nUnits: ${extracted?.units_consumed || '—'} kWh\nAmount: Rs. ${extracted?.total_charge?.toFixed(2) || '—'}`,
          [
            { text: 'View Bills', onPress: fetchBills },
            {
              text: '📊 Analyse',
              onPress: () => {
                fetchBills();
                navigation.navigate('BillDetail', { billId: res.data.bill_id });
              },
            },
          ],
        );
        fetchBills();
      } else {
        Alert.alert('Upload Failed', res.data.message || 'Could not extract bill data.');
      }
    } catch (err) {
      console.error('❌ Upload failed:', err.response?.data || err.message);
      console.error('   Status:', err.response?.status);
      const msg = err.response?.data?.detail || 'Upload failed. Check file and try again.';
      Alert.alert('Upload Failed', msg);
    } finally {
      setUploading(false);
    }
  };

  const deleteBill = (bill) => {
    Alert.alert('Delete Bill', `Delete bill from ${formatMonthYear(bill.bill_date)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await billsAPI.delete(bill.id);
            fetchBills();
          } catch {
            Alert.alert('Error', 'Failed to delete bill.');
          }
        },
      },
    ]);
  };

  const handleManualSubmit = async () => {
    const { current_meter_reading, past_bill_units, past_bill_amount, past_bill_days, past_bill_date } = manualForm;
    if (!current_meter_reading || !past_bill_units || !past_bill_amount) {
      Alert.alert('Incomplete', 'Please fill in reading, units and amount.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await analysisAPI.saveManualBill({
        current_meter_reading: parseInt(current_meter_reading) || 0,
        past_bill_units: parseInt(past_bill_units) || 0,
        past_bill_amount: parseFloat(past_bill_amount.toString().replace(/[^0-9.]/g, '')) || 0,
        past_bill_days: parseInt(past_bill_days) || 30,
        past_bill_date: past_bill_date
      });

      if (res.data.success) {
        Alert.alert('✅ Success', 'Manual bill data saved.');
        setShowManualModal(false);
        fetchBills();
        setManualForm({
          current_meter_reading: '',
          past_bill_date: new Date().toISOString().split('T')[0],
          past_bill_amount: '',
          past_bill_units: '',
          past_bill_days: '30'
        });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to save manual bill.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBills = selectedAccount
    ? bills.filter((b) => b.account_number === selectedAccount)
    : bills;

  if (loading) return <LoadingScreen message="Loading bills..." />;

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBills(); }} tintColor={COLORS.primary} />}
      >
        <SectionHeader title="Bill History" />

        {filteredBills.length === 0 ? (
          <EmptyState
            icon="📄"
            title="No Bills Yet"
            subtitle="Upload your electricity bill (PDF or image) to get started."
          />
        ) : (
          filteredBills.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              onPress={() => navigation.navigate('BillDetail', { bill, billId: bill.id })}
              onDelete={() => deleteBill(bill)}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Upload & Manual Area */}
      <View style={styles.fabArea}>
        <View style={styles.fabRow}>
          <PrimaryButton
            label={uploading ? 'Extracting...' : '📤 Upload Bill'}
            onPress={handleUpload}
            loading={uploading}
            disabled={uploading}
            style={[styles.fab, { flex: 1, marginRight: SPACING.sm }]}
          />
          <PrimaryButton
            label="⌨️ Manual"
            onPress={() => setShowManualModal(true)}
            color={COLORS.secondary}
            style={[styles.fab, { flex: 1 }]}
          />
        </View>
      </View>

      {/* Manual Bill Modal */}
      <Modal visible={showManualModal} animationType="slide" transparent>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowManualModal(false)}
        >
          <TouchableOpacity style={styles.bottomSheet} activeOpacity={1}>
            <Text style={styles.sheetTitle}>Manual Bill Entry</Text>
            <Text style={styles.sheetSubtitle}>Enter data as shown in your bill</Text>

            <ScrollView>
              <ManualInput
                label="Current Meter Reading"
                value={manualForm.current_meter_reading}
                onChangeText={(v) => setManualForm({ ...manualForm, current_meter_reading: v })}
                placeholder="e.g. 15200"
                keyboardType="numeric"
              />
              <ManualInput
                label="Units Consumed (kWh)"
                value={manualForm.past_bill_units}
                onChangeText={(v) => setManualForm({ ...manualForm, past_bill_units: v })}
                placeholder="e.g. 120"
                keyboardType="numeric"
              />
              <ManualInput
                label="Total Charge (Rs.)"
                value={manualForm.past_bill_amount}
                onChangeText={(v) => setManualForm({ ...manualForm, past_bill_amount: v })}
                placeholder="e.g. 4500"
                keyboardType="numeric"
              />
              <ManualInput
                label="Billing Days"
                value={manualForm.past_bill_days}
                onChangeText={(v) => setManualForm({ ...manualForm, past_bill_days: v })}
                placeholder="30"
                keyboardType="numeric"
              />
              <ManualInput
                label="Bill Date (YYYY-MM-DD)"
                value={manualForm.past_bill_date}
                onChangeText={(v) => setManualForm({ ...manualForm, past_bill_date: v })}
                placeholder="2024-03-08"
              />

              <PrimaryButton
                label="Save Bill Data"
                onPress={handleManualSubmit}
                loading={submitting}
                style={{ marginTop: SPACING.lg }}
              />
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const BillCard = ({ bill, onPress, onDelete }) => (
  <TouchableOpacity style={styles.billCard} onPress={onPress}>
    <View style={styles.billLeft}>
      <Text style={styles.billIcon}>🗒️</Text>
    </View>
    <View style={styles.billBody}>
      <Text style={styles.billMonth}>{formatMonthYear(bill.bill_date)}</Text>
      <Text style={styles.billMeta}>
        Acct: {bill.account_number || '—'} · {bill.units_consumed || '—'} kWh · {bill.billing_period_days || '—'} days
      </Text>
      {bill.total_charge && (
        <Text style={styles.billAmount}>{formatCurrency(bill.total_charge)}</Text>
      )}
    </View>
    <View style={styles.billActions}>
      <Text style={styles.chevron}>›</Text>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

const ManualInput = ({ label, value, onChangeText, placeholder, keyboardType = 'default' }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textMuted}
      keyboardType={keyboardType}
    />
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg1 },
  container: { flex: 1, padding: SPACING.lg },
  billCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOW.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  billLeft: { marginRight: SPACING.md },
  billIcon: { fontSize: 26 },
  billBody: { flex: 1 },
  billMonth: { color: COLORS.textPrimary, fontSize: 16, ...FONTS.semiBold },
  billMeta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  billAmount: { color: COLORS.success, fontSize: 16, ...FONTS.bold, marginTop: 4 },
  billActions: { alignItems: 'flex-end', gap: SPACING.sm },
  chevron: { color: COLORS.textMuted, fontSize: 24 },
  deleteIcon: { fontSize: 18 },
  fabArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    backgroundColor: COLORS.bg1,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
  },
  fabRow: { flexDirection: 'row' },
  fab: { borderRadius: RADIUS.lg },
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: COLORS.bg2,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    maxHeight: '90%',
    ...SHADOW.lg,
  },
  sheetTitle: { color: COLORS.textPrimary, fontSize: 20, ...FONTS.bold, textAlign: 'center' },
  sheetSubtitle: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: SPACING.xl },
  inputContainer: { marginBottom: SPACING.md },
  inputLabel: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 4, ...FONTS.medium },
  input: {
    backgroundColor: COLORS.bg3,
    color: COLORS.textPrimary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...FONTS.regular,
  },
});

export default BillsScreen;