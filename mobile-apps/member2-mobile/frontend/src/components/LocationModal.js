import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { GradientButton } from './GradientButton';
import Ionicons from 'react-native-vector-icons/Ionicons';

export const LocationModal = ({ visible, onAllow, onSkip }) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="location" size={32} color={theme.colors.secondary} />
                        </View>
                    </View>

                    <Text style={styles.title}>Enable Location</Text>
                    <Text style={styles.description}>
                        We need your location to connect you with nearby electricians and provide better service.
                    </Text>

                    <GradientButton
                        title="Allow Location"
                        icon="navigate"
                        onPress={onAllow}
                        style={styles.allowButton}
                    />

                    <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
                        <Text style={styles.skipText}>Skip for now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay,
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        padding: theme.spacing.xl,
        paddingBottom: 40,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: theme.spacing.lg,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        ...theme.typography.h2,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    description: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
        lineHeight: 22,
        paddingHorizontal: theme.spacing.md,
    },
    allowButton: {
        width: '100%',
        marginBottom: theme.spacing.md,
    },
    skipButton: {
        paddingVertical: theme.spacing.sm,
    },
    skipText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },
});
