import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Card } from '../components/Card';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

export const HelpSupportScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const handleEmail = () => {
        Linking.openURL('mailto:support@powerlink.lk?subject=Help%20Request');
    };
    const handleCall = () => {
        Linking.openURL('tel:+94112345678');
    };
    const handleSMS = () => {
        Linking.openURL('sms:+94112345678');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('helpSupport.title')}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.iconSection}>
                    <View style={styles.supportIcon}>
                        <Ionicons name="headset" size={36} color={theme.colors.secondary} />
                    </View>
                    <Text style={styles.supportTitle}>{t('helpSupport.subtitle')}</Text>
                    <Text style={styles.supportDesc}>{t('helpSupport.desc')}</Text>
                </View>

                {/* Email */}
                <Card style={styles.contactCard} onPress={handleEmail}>
                    <View style={styles.contactRow}>
                        <View style={[styles.contactIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                            <Ionicons name="mail" size={22} color={theme.colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.contactLabel}>{t('helpSupport.emailSupport')}</Text>
                            <Text style={styles.contactValue}>support@powerlink.lk</Text>
                        </View>
                        <Ionicons name="open-outline" size={18} color={theme.colors.textMuted} />
                    </View>
                </Card>

                {/* Phone */}
                <Card style={styles.contactCard} onPress={handleCall}>
                    <View style={styles.contactRow}>
                        <View style={[styles.contactIconContainer, { backgroundColor: theme.colors.success + '15' }]}>
                            <Ionicons name="call" size={22} color={theme.colors.success} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.contactLabel}>{t('helpSupport.callUs')}</Text>
                            <Text style={styles.contactValue}>+94 11 234 5678</Text>
                        </View>
                        <Ionicons name="open-outline" size={18} color={theme.colors.textMuted} />
                    </View>
                </Card>

                {/* SMS */}
                <Card style={styles.contactCard} onPress={handleSMS}>
                    <View style={styles.contactRow}>
                        <View style={[styles.contactIconContainer, { backgroundColor: theme.colors.warning + '15' }]}>
                            <Ionicons name="chatbubble" size={22} color={theme.colors.warning} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.contactLabel}>{t('helpSupport.sendSms')}</Text>
                            <Text style={styles.contactValue}>+94 11 234 5678</Text>
                        </View>
                        <Ionicons name="open-outline" size={18} color={theme.colors.textMuted} />
                    </View>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    backButton: { padding: theme.spacing.sm, marginRight: theme.spacing.sm },
    headerTitle: { ...theme.typography.h3 },
    scrollContent: { padding: theme.spacing.lg },
    iconSection: { alignItems: 'center', marginBottom: theme.spacing.xl },
    supportIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.secondary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.md },
    supportTitle: { ...theme.typography.h2, marginBottom: 4 },
    supportDesc: { ...theme.typography.bodySmall, textAlign: 'center', lineHeight: 20, paddingHorizontal: theme.spacing.md },
    contactCard: { marginBottom: theme.spacing.sm },
    contactRow: { flexDirection: 'row', alignItems: 'center' },
    contactIconContainer: { width: 44, height: 44, borderRadius: theme.borderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    contactLabel: { ...theme.typography.body, fontWeight: '600' },
    contactValue: { ...theme.typography.caption, marginTop: 2 },
});
