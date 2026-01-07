import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Calculator, ChevronRight } from 'lucide-react-native';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

export default function ConsumptionEstimatorScreen() {
  const [step, setStep] = useState(1);
  const [totalPeople, setTotalPeople] = useState('4');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroCard}>
          <Calculator color="#FFFFFF" size={40} />
          <Text style={styles.heroTitle}>Consumption Predictor</Text>
          <Text style={styles.heroSubtitle}>ML-powered predictions</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Step {step} of 3</Text>
        </View>

        <Card>
          <Text style={styles.cardTitle}>House Information</Text>
          
          <Text style={styles.label}>House Type</Text>
          <TouchableOpacity style={styles.picker}>
            <Text style={styles.pickerText}>Single-story house</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Total People</Text>
          <TextInput
            style={styles.input}
            value={totalPeople}
            onChangeText={setTotalPeople}
            keyboardType="numeric"
            placeholderTextColor={colors.textTertiary}
          />

          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Males</Text>
              <TextInput
                style={styles.input}
                placeholder="2"
                keyboardType="numeric"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Females</Text>
              <TextInput
                style={styles.input}
                placeholder="2"
                keyboardType="numeric"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>
        </Card>

        <View style={styles.buttonRow}>
          {step > 1 && (
            <Button variant="secondary" onPress={() => setStep(step - 1)} style={{ flex: 1 }}>
              Back
            </Button>
          )}
          <Button
            variant="primary"
            onPress={() => step < 3 ? setStep(step + 1) : undefined}
            style={{ flex: 1 }}>
            {step === 3 ? 'Get Prediction' : 'Next'}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  heroSubtitle: {
    fontSize: fontSize.base,
    color: '#E9D5FF',
    marginTop: spacing.xs,
  },
  progressContainer: { marginBottom: spacing.lg },
  progressBar: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    marginBottom: spacing.md,
  },
  picker: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  pickerText: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputHalf: { flex: 1 },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
