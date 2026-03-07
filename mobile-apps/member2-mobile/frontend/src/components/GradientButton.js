import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

export const GradientButton = ({
    title,
    onPress,
    style,
    icon,
    iconRight,
    loading,
    disabled,
    colors,
    textStyle,
}) => {
    const gradientColors = colors || theme.colors.gradientCTA;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            disabled={disabled || loading}
            style={[disabled && { opacity: 0.5 }, style]}
        >
            <LinearGradient
                colors={disabled ? [theme.colors.border, theme.colors.border] : gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                    <View style={styles.content}>
                        {icon && (
                            <Ionicons name={icon} size={20} color="#FFFFFF" style={styles.iconLeft} />
                        )}
                        <Text style={[styles.text, textStyle]}>{title}</Text>
                        {iconRight && (
                            <Ionicons name={iconRight} size={20} color="#FFFFFF" style={styles.iconRight} />
                        )}
                    </View>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    gradient: {
        paddingVertical: 15,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 54,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        marginLeft: 8,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
