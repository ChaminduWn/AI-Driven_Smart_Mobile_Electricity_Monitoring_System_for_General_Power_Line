// ─── Colors ──────────────────────────────────────────────────────────────────
export const COLORS = {
  // Background hierarchy
  bg0: '#0A0E1A',     // deepest background
  bg1: '#111827',     // main background
  bg2: '#1C2333',     // cards
  bg3: '#252E40',     // elevated cards / input bg

  // Accent palette
  primary: '#3B82F6',       // blue
  primaryLight: '#60A5FA',
  primaryDark: '#1D4ED8',

  secondary: '#8B5CF6',     // purple
  secondaryLight: '#A78BFA',

  success: '#10B981',       // green
  successLight: '#34D399',

  warning: '#F59E0B',       // amber
  warningLight: '#FCD34D',

  danger: '#EF4444',        // red
  dangerLight: '#F87171',

  // Text
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textDisabled: '#4B5563',

  // UI accents
  border: '#2D3748',
  divider: '#1F2D3D',
  overlay: 'rgba(0,0,0,0.6)',

  // Category colors
  cooling: '#06B6D4',
  heating: '#F97316',
  cooking: '#EAB308',
  cleaning: '#8B5CF6',
  entertainment: '#EC4899',
  lighting: '#FBBF24',
  other: '#6B7280',
};

// ─── Category Color Mapping ───────────────────────────────────────────────────
export const CATEGORY_COLORS = {
  Cooling: COLORS.cooling,
  Heating: COLORS.heating,
  Cooking: COLORS.cooking,
  Cleaning: COLORS.cleaning,
  Entertainment: COLORS.entertainment,
  Lighting: COLORS.lighting,
  Other: COLORS.other,
};

// ─── Typography ───────────────────────────────────────────────────────────────
export const FONTS = {
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semiBold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  extraBold: { fontWeight: '800' },
};

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// ─── Border Radius ────────────────────────────────────────────────────────────
export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
};

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
};

// ─── Priority Colors ─────────────────────────────────────────────────────────
export const PRIORITY_COLORS = {
  high: COLORS.danger,
  medium: COLORS.warning,
  low: COLORS.success,
};

// ─── Status Colors ────────────────────────────────────────────────────────────
export const STATUS_COLORS = {
  on_track: COLORS.success,
  under_budget: COLORS.primaryLight,
  over_budget: COLORS.danger,
  active: COLORS.success,
  completed: COLORS.textSecondary,
};