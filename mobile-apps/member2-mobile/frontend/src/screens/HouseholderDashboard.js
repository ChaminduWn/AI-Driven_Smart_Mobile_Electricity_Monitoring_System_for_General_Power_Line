import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { VoiceCommandButton } from '../components/VoiceCommandButton';
import {
    DASHBOARD_CATEGORY_BY_INTENT,
    HOUSEHOLDER_HOME_INTENTS,
} from '../voice/intentMappings';

export const HouseholderDashboard = ({ navigation }) => {
    const { user } = useAuth();
    const { t, i18n } = useTranslation();

    const categories = [
        { id: 'power', title: t('householder.categories.power.title'), subtitle: t('householder.categories.power.subtitle'), icon: 'flash', color: theme.colors.categoryAmber },
        { id: 'voltage', title: t('householder.categories.voltage.title'), subtitle: t('householder.categories.voltage.subtitle'), icon: 'pulse', color: theme.colors.categoryBlue },
        { id: 'safety', title: t('householder.categories.safety.title'), subtitle: t('householder.categories.safety.subtitle'), icon: 'warning', color: theme.colors.categoryRed },
        { id: 'infrastructure', title: t('householder.categories.infrastructure.title'), subtitle: t('householder.categories.infrastructure.subtitle'), icon: 'construct', color: theme.colors.categoryOrange },
        { id: 'monitoring', title: t('householder.categories.monitoring.title'), subtitle: t('householder.categories.monitoring.subtitle'), icon: 'analytics', color: theme.colors.categoryGreen },
    ];

    const handleVoiceIntent = async ({ intent }) => {
        if (!intent) {
            return false;
        }

        if (intent === 'open_report_to_electricity_board') {
            navigation.navigate('BoardIssueReport');
            return true;
        }

        if (intent in DASHBOARD_CATEGORY_BY_INTENT) {
            const nextCategory = categories.find((item) => item.id === DASHBOARD_CATEGORY_BY_INTENT[intent]);
            if (!nextCategory) {
                return false;
            }

            navigation.navigate('SubCategory', { category: nextCategory });
            return true;
        }

        switch (intent) {
            case 'open_activities':
            case 'view_activities':
                navigation.getParent()?.navigate('ActivitiesTab');
                return true;
            case 'open_account':
                navigation.getParent()?.navigate('AccountTab');
                return true;
            case 'open_profile_settings':
                navigation.getParent()?.navigate('AccountTab', { screen: 'ProfileSettings' });
                return true;
            case 'open_help_support':
                navigation.getParent()?.navigate('AccountTab', { screen: 'HelpSupport' });
                return true;
            case 'open_about_us':
                navigation.getParent()?.navigate('AccountTab', { screen: 'AboutUs' });
                return true;
            case 'change_language':
                await i18n.changeLanguage(i18n.language === 'en' ? 'si' : 'en');
                return true;
            case 'go_home':
                return true;
            default:
                return false;
        }
    };

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
                {/* Quick Help Banner */}
                <Card
                    style={styles.helpBanner}
                    glowColor={theme.colors.warning}
                    onPress={() => navigation.navigate('BoardIssueReport')}
                >
                    <View style={styles.helpContent}>
                        <View style={styles.helpIconContainer}>
                            <Ionicons name="business" size={24} color={theme.colors.warning} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.helpTitle}>{t('householder.needQuickHelp')}</Text>
                            <Text style={styles.helpSubtitle}>{t('householder.helpSubtitle')}</Text>
                        </View>
                        <Ionicons name="arrow-forward-circle" size={24} color={theme.colors.warning} />
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

            <VoiceCommandButton
                allowedIntents={HOUSEHOLDER_HOME_INTENTS}
                onIntentMatched={handleVoiceIntent}
                disableBackendFallback
            />
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
        borderColor: theme.colors.warning + '30',
    },
    helpContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    helpIconContainer: {
        width: 44,
        height: 44,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.warning + '15',
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
