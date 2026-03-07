import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { theme } from '../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

export const Button = ({ title, onPress, variant = 'primary', style, icon, loading, disabled, textStyle }) => {
    const getBackgroundColor = () => {
        if (disabled) return theme.colors.border;
        switch (variant) {
            case 'primary': return theme.colors.primary;
            case 'surface': return theme.colors.surface;
            case 'success': return theme.colors.success;
            case 'danger': return theme.colors.danger;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return theme.colors[variant] || theme.colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return theme.colors.textMuted;
        switch (variant) {
            case 'primary': return '#FFFFFF';
            case 'surface': return theme.colors.text;
            case 'success': return '#FFFFFF';
            case 'danger': return '#FFFFFF';
            case 'outline': return theme.colors.primary;
            case 'ghost': return theme.colors.textSecondary;
            default: return '#FFFFFF';
        }
    };

    const borderStyle = variant === 'outline' ? { borderWidth: 1.5, borderColor: theme.colors.primary } : {};

    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor: getBackgroundColor() },
                borderStyle,
                style,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={disabled || loading}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} size="small" />
            ) : (
                <View style={styles.content}>
                    {icon && (
                        <Ionicons
                            name={icon}
                            size={20}
                            color={getTextColor()}
                            style={styles.icon}
                        />
                    )}
                    <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
                        {title}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        marginRight: 8,
    },
    text: {
        ...theme.typography.button,
    },
});
