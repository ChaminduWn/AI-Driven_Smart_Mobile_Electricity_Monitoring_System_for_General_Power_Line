import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Card } from '../components/Card';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

const features = [
    { key: 'reliable', icon: 'shield-checkmark', color: theme.colors.success },
    { key: 'fast', icon: 'flash', color: theme.colors.warning },
    { key: 'certified', icon: 'ribbon', color: theme.colors.primary },
    { key: 'tech', icon: 'analytics', color: theme.colors.secondary },
];

export const AboutUsScreen = ({ navigation }) => {
    const { t } = useTranslation();
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('aboutUs.title')}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Logo */}
                <View style={styles.logoSection}>
                    <View style={styles.logo}>
                        <Ionicons name="flash" size={36} color={theme.colors.secondary} />
                    </View>
                    <Text style={styles.appName}>
                        <Text style={{ fontWeight: '300' }}>Power</Text>
                        <Text style={{ fontWeight: '800' }}>Link</Text>
                    </Text>
                    <Text style={styles.tagline}>{t('aboutUs.tagline')}</Text>
                </View>

                {/* Mission */}
                <Card style={styles.missionCard}>
                    <Text style={styles.sectionTitle}>{t('aboutUs.missionTitle')}</Text>
                    <Text style={styles.missionText}>
                        {t('aboutUs.missionText')}
                    </Text>
                </Card>

                {/* Features */}
                <Text style={styles.featuresTitle}>{t('aboutUs.whyTitle')}</Text>
                {features.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                        <View style={[styles.featureIcon, { backgroundColor: f.color + '15' }]}>
                            <Ionicons name={f.icon} size={22} color={f.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.featureTitle}>{t(`aboutUs.features.${f.key}.title`)}</Text>
                            <Text style={styles.featureDesc}>{t(`aboutUs.features.${f.key}.desc`)}</Text>
                        </View>
                    </View>
                ))}

                <Text style={styles.footerText}>{t('aboutUs.footer')}</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    backButton: { padding: theme.spacing.sm, marginRight: theme.spacing.sm },
    headerTitle: { ...theme.typography.h3 },
    scrollContent: { padding: theme.spacing.lg, paddingBottom: 40 },
    logoSection: { alignItems: 'center', marginBottom: theme.spacing.xl },
    logo: { width: 72, height: 72, borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.secondary + '40' },
    appName: { fontSize: 28, color: theme.colors.text, marginBottom: 4 },
    tagline: { ...theme.typography.bodySmall },
    missionCard: { marginBottom: theme.spacing.xl },
    sectionTitle: { ...theme.typography.h3, color: theme.colors.primary, marginBottom: theme.spacing.sm },
    missionText: { ...theme.typography.body, color: theme.colors.textSecondary, lineHeight: 22 },
    featuresTitle: { ...theme.typography.h3, marginBottom: theme.spacing.md },
    featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.lg },
    featureIcon: { width: 44, height: 44, borderRadius: theme.borderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    featureTitle: { ...theme.typography.body, fontWeight: '700', marginBottom: 2 },
    featureDesc: { ...theme.typography.bodySmall, lineHeight: 18 },
    footerText: { ...theme.typography.caption, textAlign: 'center', marginTop: theme.spacing.xl },
});
