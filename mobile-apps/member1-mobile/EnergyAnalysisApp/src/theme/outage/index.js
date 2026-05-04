export const theme = {
    colors: {
        background: '#0F172A',       // Deep Navy
        backgroundAlt: '#111827',    // Darker variant
        surface: '#1E293B',          // Elevated dark cards
        surfaceLight: '#273549',     // Lighter surface for inputs
        primary: '#2563EB',          // Electric Blue
        primaryDark: '#1D4ED8',      // Blue 700 (gradient end)
        primaryLight: '#3B82F6',     // Blue 400
        secondary: '#06B6D4',        // Cyan accent
        success: '#22C55E',          // Neon Green
        successDark: '#16A34A',
        warning: '#F59E0B',          // Amber
        warningDark: '#D97706',
        danger: '#EF4444',           // Red
        dangerDark: '#DC2626',
        text: '#FFFFFF',
        textSecondary: '#CBD5E1',    // Slate 300 (Brighter)
        textMuted: '#94A3B8',        // Slate 400 (Brighter)
        border: '#334155',           // Slate 700
        borderLight: '#475569',      // Slate 600
        inputBackground: '#1E293B',
        overlay: 'rgba(0, 0, 0, 0.6)',
        // Category glow colors
        categoryAmber: '#F59E0B',
        categoryBlue: '#2563EB',
        categoryRed: '#EF4444',
        categoryOrange: '#F97316',
        categoryGreen: '#22C55E',
        // Gradient pairs
        gradientPrimary: ['#2563EB', '#1D4ED8'],
        gradientCTA: ['#06B6D4', '#2563EB'],   // Teal → Blue (from mockup)
        gradientSuccess: ['#22C55E', '#16A34A'],
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadius: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        full: 9999,
    },
    typography: {
        h1: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
        h2: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
        h3: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
        body: { fontSize: 15, color: '#FFFFFF' },
        bodySmall: { fontSize: 13, color: '#94A3B8' },
        caption: { fontSize: 12, color: '#94A3B8' },
        label: { fontSize: 14, fontWeight: '500', color: '#94A3B8' },
        button: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    },
    shadows: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 2,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 6,
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 12,
        },
        glow: (color) => ({
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
        }),
    },
};
