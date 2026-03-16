import React from 'react';
import {
  View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, Modal,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS, SHADOW } from '../utils/theme';

// ─── Loading Screen ───────────────────────────────────────────────────────────
export const LoadingScreen = ({ message = 'Loading...' }) => (
  <View style={styles.center}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

// ─── Error View ───────────────────────────────────────────────────────────────
export const ErrorView = ({ message = 'Something went wrong', onRetry }) => (
  <View style={styles.center}>
    <Text style={styles.errorIcon}>⚠️</Text>
    <Text style={styles.errorText}>{message}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon = '📭', title, subtitle, action, actionLabel }) => (
  <View style={styles.center}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    {action && (
      <TouchableOpacity style={styles.actionBtn} onPress={action}>
        <Text style={styles.actionText}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, color = COLORS.primary, icon }) => (
  <View style={[styles.statCard, { borderTopColor: color }]}>
    {icon && <Text style={styles.statIcon}>{icon}</Text>}
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {sub && <Text style={styles.statSub}>{sub}</Text>}
  </View>
);

// ─── Section Header ───────────────────────────────────────────────────────────
export const SectionHeader = ({ title, action, actionLabel }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={action}>
        <Text style={styles.sectionAction}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge = ({ label, color = COLORS.primary }) => (
  <View style={[styles.badge, { backgroundColor: color + '33', borderColor: color + '66' }]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

// ─── Divider ──────────────────────────────────────────────────────────────────
export const Divider = ({ style }) => <View style={[styles.divider, style]} />;

// ─── InfoRow ──────────────────────────────────────────────────────────────────
export const InfoRow = ({ label, value, valueColor }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
  </View>
);

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, style, onPress, accentColor }) => {
  const Comp = onPress ? TouchableOpacity : View;
  return (
    <Comp
      onPress={onPress}
      style={[
        styles.card,
        accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : null,
        style,
      ]}
    >
      {children}
    </Comp>
  );
};

// ─── PrimaryButton ────────────────────────────────────────────────────────────
export const PrimaryButton = ({
  label, onPress, loading, disabled, icon, color = COLORS.primary, style,
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled || loading}
    style={[styles.primaryBtn, { backgroundColor: disabled || loading ? COLORS.textMuted : color }, style]}
  >
    {loading ? (
      <ActivityIndicator size="small" color="#fff" />
    ) : (
      <>
        {icon && <Text style={styles.btnIcon}>{icon}</Text>}
        <Text style={styles.primaryBtnText}>{label}</Text>
      </>
    )}
  </TouchableOpacity>
);

// ─── SecondaryButton ──────────────────────────────────────────────────────────
export const SecondaryButton = ({ label, onPress, color = COLORS.primary, icon, style }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.secondaryBtn, { borderColor: color }, style]}
  >
    {icon && <Text style={[styles.btnIcon, { color }]}>{icon}</Text>}
    <Text style={[styles.secondaryBtnText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export const ProgressBar = ({ progress, color = COLORS.primary, height = 8 }) => {
  const clamped = Math.max(0, Math.min(1, progress || 0));
  return (
    <View style={[styles.progressTrack, { height }]}>
      <View style={[styles.progressFill, { width: `${clamped * 100}%`, backgroundColor: color, height }]} />
    </View>
  );
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────
export const ConfirmModal = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = COLORS.primary,
  isLoading = false,
}) => (
  <Modal
    transparent
    visible={visible}
    animationType="fade"
    onRequestClose={onCancel}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{title}</Text>
        <Text style={styles.modalMessage}>{message}</Text>
        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.modalBtn, styles.modalBtnCancel]}
            onPress={onCancel}
            disabled={isLoading}
          >
            <Text style={styles.modalBtnCancelText}>{cancelLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: confirmColor }]}
            onPress={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.modalBtnConfirmText}>{confirmLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    backgroundColor: COLORS.bg1,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    fontSize: 14,
  },
  errorIcon: { fontSize: 48, marginBottom: SPACING.md },
  errorText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 15,
    marginBottom: SPACING.lg,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyIcon: { fontSize: 56, marginBottom: SPACING.md },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    ...FONTS.semiBold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  statCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderTopWidth: 3,
    flex: 1,
    ...SHADOW.sm,
  },
  statIcon: { fontSize: 22, marginBottom: SPACING.xs },
  statValue: {
    fontSize: 22,
    ...FONTS.bold,
    marginBottom: 2,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    ...FONTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    ...FONTS.semiBold,
  },
  sectionAction: {
    color: COLORS.primary,
    fontSize: 14,
    ...FONTS.medium,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    ...FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  infoLabel: { color: COLORS.textSecondary, fontSize: 14 },
  infoValue: { color: COLORS.textPrimary, fontSize: 14, ...FONTS.medium },
  card: {
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    ...FONTS.semiBold,
  },
  btnIcon: { fontSize: 18 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    gap: SPACING.sm,
  },
  secondaryBtnText: {
    fontSize: 16,
    ...FONTS.semiBold,
  },
  progressTrack: {
    backgroundColor: COLORS.bg3,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    borderRadius: RADIUS.full,
  },
});