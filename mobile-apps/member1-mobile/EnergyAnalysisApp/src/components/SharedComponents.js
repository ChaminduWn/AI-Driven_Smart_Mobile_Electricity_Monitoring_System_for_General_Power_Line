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

// ─── Premium Empty State ──────────────────────────────────────────────────────
export const PremiumEmptyState = ({ icon, title, subtitle, features = [], action, actionLabel, footer }) => (
  <View style={styles.premiumEmptyContainer}>
    <View style={styles.premiumEmptyCard}>
      <View style={styles.premiumEmptyIconCircle}>
        <Text style={styles.premiumEmptyIcon}>{icon}</Text>
        <View style={styles.premiumEmptyIconBg} />
      </View>
      
      <Text style={styles.premiumEmptyTitle}>{title}</Text>
      <Text style={styles.premiumEmptySubtitle}>{subtitle}</Text>
      
      {features.length > 0 && (
        <View style={styles.premiumEmptyFeatures}>
          {features.map((f, i) => (
            <View key={i} style={styles.premiumEmptyFeatureLine}>
              <Text style={styles.premiumEmptyFeatureIcon}>{f.icon}</Text>
              <Text style={styles.premiumEmptyFeatureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      )}

      {action && (
        <TouchableOpacity 
          style={styles.premiumEmptyCta} 
          onPress={action}
          activeOpacity={0.8}
        >
          <Text style={styles.premiumEmptyCtaText}>{actionLabel}</Text>
          <Text style={styles.premiumEmptyCtaArrow}>→</Text>
        </TouchableOpacity>
      )}

      {footer && <Text style={styles.premiumEmptyFooter}>{footer}</Text>}
    </View>
    
    <View style={styles.premiumEmptyBlob1} />
    <View style={styles.premiumEmptyBlob2} />
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

// ─── Status Modal (Premium Alert/Confirm) ───────────────────────────────────
export const StatusModal = ({
  visible,
  type = 'info', // 'info', 'success', 'warning', 'error', 'confirm'
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  loading = false,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'confirm': return '❓';
      default: return 'ℹ️';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success': return COLORS.success;
      case 'warning': return COLORS.warning;
      case 'error': return '#f44336';
      case 'confirm': return COLORS.primary;
      default: return COLORS.primary;
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.statusModalContent}>
          <View style={[styles.statusIconCircle, { backgroundColor: getColor() + '15' }]}>
            <Text style={styles.statusIconText}>{getIcon()}</Text>
          </View>
          
          <Text style={styles.statusTitle}>{title}</Text>
          <Text style={styles.statusMessage}>{message}</Text>
          
          <View style={styles.statusActions}>
            {(type === 'confirm' || onCancel) && (
              <TouchableOpacity 
                style={styles.statusCancelBtn} 
                onPress={onCancel}
                disabled={loading}
              >
                <Text style={styles.statusCancelText}>{cancelLabel}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.statusConfirmBtn, { backgroundColor: getColor() }]} 
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.statusConfirmText}>{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

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
  // Premium Empty State
  premiumEmptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 450,
  },
  premiumEmptyCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.lg,
    zIndex: 10,
  },
  premiumEmptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    position: 'relative',
  },
  premiumEmptyIcon: {
    fontSize: 40,
    zIndex: 2,
  },
  premiumEmptyIconBg: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
    zIndex: 1,
  },
  premiumEmptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    ...FONTS.bold,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  premiumEmptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },
  premiumEmptyFeatures: {
    width: '100%',
    marginBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  premiumEmptyFeatureLine: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg1 + '50',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border + '50',
  },
  premiumEmptyFeatureIcon: {
    fontSize: 18,
    marginRight: SPACING.md,
  },
  premiumEmptyFeatureText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    ...FONTS.semiBold,
  },
  premiumEmptyCta: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    borderRadius: RADIUS.full,
    width: '100%',
    marginBottom: SPACING.xl,
  },
  premiumEmptyCtaText: {
    color: '#FFFFFF',
    fontSize: 16,
    ...FONTS.bold,
    marginRight: SPACING.sm,
  },
  premiumEmptyCtaArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    ...FONTS.bold,
  },
  premiumEmptyFooter: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    ...FONTS.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  statusModalContent: {
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...SHADOW.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  statusIconText: {
    fontSize: 32,
  },
  statusTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    ...FONTS.bold,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  statusMessage: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  statusActions: {
    flexDirection: 'row',
    width: '100%',
    gap: SPACING.md,
  },
  statusCancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  statusCancelText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    ...FONTS.semiBold,
  },
  statusConfirmBtn: {
    flex: 2,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    ...SHADOW.sm,
  },
  statusConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    ...FONTS.bold,
  },
  premiumEmptyBlob1: {
    position: 'absolute',
    top: 20,
    right: -10,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.primary,
    opacity: 0.08,
    zIndex: 0,
  },
  premiumEmptyBlob2: {
    position: 'absolute',
    bottom: 20,
    left: -10,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.secondary || COLORS.primary,
    opacity: 0.08,
    zIndex: 0,
  },
});