import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

export const Card = ({ children, style, onPress, glowColor }) => {
    const Container = onPress ? TouchableOpacity : View;

    const glowStyle = glowColor ? {
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        borderColor: glowColor + '30',
    } : {};

    return (
        <Container
            style={[styles.card, glowStyle, style]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {children}
        </Container>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.md,
    },
});
