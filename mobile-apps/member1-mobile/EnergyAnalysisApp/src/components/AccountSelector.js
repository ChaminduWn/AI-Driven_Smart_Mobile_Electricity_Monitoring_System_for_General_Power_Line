import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList, StyleSheet,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS, SHADOW } from '../utils/theme';

const AccountSelector = ({ selectedAccount, accounts, onSelect, style }) => {
  const [open, setOpen] = useState(false);

  if (!accounts || accounts.length === 0) return null;

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, style]}
        onPress={() => accounts.length > 1 && setOpen(true)}
      >
        <View style={styles.row}>
          <Text style={styles.icon}>🏠</Text>
          <View>
            <Text style={styles.label}>Account</Text>
            <Text style={styles.value}>{selectedAccount || 'Select account'}</Text>
          </View>
        </View>
        {accounts.length > 1 && <Text style={styles.chevron}>▾</Text>}
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.dropdown}>
            <Text style={styles.dropdownTitle}>Select Account</Text>
            <FlatList
              data={accounts}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, item === selectedAccount && styles.selectedOption]}
                  onPress={() => { onSelect(item); setOpen(false); }}
                >
                  <Text style={styles.optionIcon}>🏠</Text>
                  <Text style={[styles.optionText, item === selectedAccount && styles.selectedOptionText]}>
                    {item}
                  </Text>
                  {item === selectedAccount && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  icon: { fontSize: 20 },
  label: { color: COLORS.textMuted, fontSize: 11, ...FONTS.medium },
  value: { color: COLORS.textPrimary, fontSize: 15, ...FONTS.semiBold },
  chevron: { color: COLORS.textSecondary, fontSize: 18 },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  dropdown: {
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.lg,
  },
  dropdownTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    ...FONTS.semiBold,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  selectedOption: { backgroundColor: COLORS.primary + '22' },
  optionIcon: { fontSize: 18 },
  optionText: { color: COLORS.textSecondary, flex: 1, fontSize: 15 },
  selectedOptionText: { color: COLORS.primary, ...FONTS.semiBold },
  checkmark: { color: COLORS.primary, fontSize: 16 },
});

export default AccountSelector;