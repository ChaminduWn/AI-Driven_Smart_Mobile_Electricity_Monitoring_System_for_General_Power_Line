import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { VoiceCommander } from '../components/VoiceCommander';

export const HouseholderDashboard = ({ navigation }) => {
    const { user } = useAuth();
    const { t } = useTranslation();

    const categories = [
        { id: 'power', title: t('householder.categories.power.title'), subtitle: t('householder.categories.power.subtitle'), icon: 'flash', color: theme.colors.categoryAmber },
        { id: 'voltage', title: t('householder.categories.voltage.title'), subtitle: t('householder.categories.voltage.subtitle'), icon: 'pulse', color: theme.colors.categoryBlue },
        { id: 'safety', title: t('householder.categories.safety.title'), subtitle: t('householder.categories.safety.subtitle'), icon: 'warning', color: theme.colors.categoryRed },
        { id: 'infrastructure', title: t('householder.categories.infrastructure.title'), subtitle: t('householder.categories.infrastructure.subtitle'), icon: 'construct', color: theme.colors.categoryOrange },
        { id: 'monitoring', title: t('householder.categories.monitoring.title'), subtitle: t('householder.categories.monitoring.subtitle'), icon: 'analytics', color: theme.colors.categoryGreen },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.userName}>{t('dashboard.hello')}{user?.firstName || t('householder.user')}</Text>
                    <Text style={styles.userInfo}>
                        📍 {user?.district || t('householder.location')}
                    </Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={styles.idBadge}>
                        <Text style={styles.idText}>00H#{user?.displayId || '1'}</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Voice Command Section (Research Component) - Moved to Global Navbar */}

                {/* Quick Help Banner */}
                <Card style={styles.helpBanner} glowColor={theme.colors.secondary}>
                    <View style={styles.helpContent}>
                        <View style={styles.helpIconContainer}>
                            <Ionicons name="headset" size={24} color={theme.colors.secondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.helpTitle}>{t('householder.needQuickHelp')}</Text>
                            <Text style={styles.helpSubtitle}>{t('householder.helpSubtitle')}</Text>
                        </View>
                        <Ionicons name="arrow-forward-circle" size={24} color={theme.colors.secondary} />
                    </View>
                </Card>

                {/* Quick Actions Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        {t('householder.quickActions')}
                    </Text>
                </View>

                {/* Category Cards - List */}
                {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        style={styles.categoryCard}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('SubCategory', { category: cat })}
                    >
                        <View style={[styles.categoryIconContainer, { backgroundColor: cat.color + '15' }]}>
                            <Ionicons name={cat.icon} size={24} color={cat.color} />
                        </View>
                        <View style={styles.categoryInfo}>
                            <Text style={styles.categoryTitle}>{cat.title}</Text>
                            <Text style={styles.categorySubtitle}>{cat.subtitle}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    userName: {
        ...theme.typography.h2,
    },
    userInfo: {
        ...theme.typography.bodySmall,
        marginTop: 2,
    },
    idBadge: {
        backgroundColor: theme.colors.primary + '20',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1,
        borderColor: theme.colors.primary + '40',
    },
    idText: {
        color: theme.colors.primary,
        fontSize: 11,
        fontWeight: '700',
    },
    scrollContent: {
        padding: theme.spacing.lg,
        paddingBottom: 100,
    },
    helpBanner: {
        marginBottom: theme.spacing.lg,
        borderColor: theme.colors.secondary + '30',
    },
    helpContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    helpIconContainer: {
        width: 44,
        height: 44,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.secondary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    helpTitle: {
        ...theme.typography.h3,
        fontSize: 16,
    },
    helpSubtitle: {
        ...theme.typography.caption,
        marginTop: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        ...theme.typography.h3,
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.sm + 2,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    categoryIconContainer: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    categoryInfo: {
        flex: 1,
    },
    categoryTitle: {
        ...theme.typography.body,
        fontWeight: '600',
    },
    categorySubtitle: {
        ...theme.typography.caption,
        marginTop: 2,
    },
});
