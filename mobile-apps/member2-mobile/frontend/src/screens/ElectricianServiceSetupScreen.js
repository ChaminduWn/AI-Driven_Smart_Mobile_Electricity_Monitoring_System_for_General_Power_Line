import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Card } from '../components/Card';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl } from '../api';
import { useTranslation } from 'react-i18next';

const categoryIcons = {
    Power: 'flash',
    Voltage: 'pulse',
    Safety: 'warning',
    Infrastructure: 'construct',
    Monitoring: 'analytics',
};

export const ElectricianServiceSetupScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const fetchSetupData = async () => {
            try {
                setLoading(true);
                const response = await fetch(buildApiUrl(`/services/technician-setup/${user?.id}`));
                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data?.message || t('member2.serviceSetup.loadFailedMsg'));
                }

                if (mounted) {
                    setServices(data.data || []);
                }
            } catch (error) {
                console.error('Fetch technician setup services error', error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        if (user?.id) {
            fetchSetupData();
        } else {
            setLoading(false);
        }

        return () => {
            mounted = false;
        };
    }, [t, user?.id]);

    const groupedServices = useMemo(() => {
        return services.reduce((acc, service) => {
            const key = service.category || t('member2.serviceSetup.general');
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(service);
            return acc;
        }, {});
    }, [services, t]);

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.headerTitle}>{t('member2.serviceSetup.title')}</Text>
                    <Text style={styles.headerSubtitle}>{t('member2.serviceSetup.subtitle')}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {Object.entries(groupedServices).map(([categoryName, categoryServices]) => {
                    const totalRequests = categoryServices.reduce((sum, item) => sum + Number(item.totalRequests || 0), 0);
                    const acceptedRequests = categoryServices.reduce((sum, item) => sum + Number(item.acceptedByTechnician || 0), 0);

                    return (
                        <Card key={categoryName} style={styles.categoryCard}>
                            <View style={styles.categoryHeader}>
                                <View style={styles.categoryTitleWrap}>
                                    <View style={styles.categoryIconWrap}>
                                        <Ionicons name={categoryIcons[categoryName] || 'grid'} size={20} color={theme.colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.categoryTitle}>{categoryName}</Text>
                                        <Text style={styles.categoryMeta}>
                                            {t('member2.serviceSetup.jobsRequested', { count: totalRequests })} • {t('member2.serviceSetup.acceptedByYou', { count: acceptedRequests })}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {categoryServices.map((service) => (
                                <View key={service.id} style={styles.serviceRow}>
                                    <View style={styles.serviceTextWrap}>
                                        <Text style={styles.serviceName}>{service.name}</Text>
                                        <Text style={styles.serviceDesc}>
                                            {service.description || t('member2.serviceSetup.serviceDetailsFallback')}
                                        </Text>
                                    </View>
                                    <View style={styles.countColumn}>
                                        <Text style={styles.countValue}>{service.totalRequests || 0}</Text>
                                        <Text style={styles.countLabel}>{t('member2.serviceSetup.requests')}</Text>
                                    </View>
                                    <View style={styles.countColumn}>
                                        <Text style={styles.countValue}>{service.acceptedByTechnician || 0}</Text>
                                        <Text style={styles.countLabel}>{t('member2.serviceSetup.accepted')}</Text>
                                    </View>
                                </View>
                            ))}
                        </Card>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    centered: { justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: { padding: theme.spacing.sm, marginRight: theme.spacing.sm },
    headerTextWrap: { flex: 1 },
    headerTitle: { ...theme.typography.h3 },
    headerSubtitle: { ...theme.typography.caption, marginTop: 2 },
    scrollContent: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
    categoryCard: { marginBottom: theme.spacing.md },
    categoryHeader: { marginBottom: theme.spacing.md },
    categoryTitleWrap: { flexDirection: 'row', alignItems: 'center' },
    categoryIconWrap: {
        width: 42,
        height: 42,
        borderRadius: theme.borderRadius.md,
        backgroundColor: `${theme.colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    categoryTitle: { ...theme.typography.h3 },
    categoryMeta: { ...theme.typography.caption, marginTop: 4 },
    serviceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    serviceTextWrap: { flex: 1, paddingRight: theme.spacing.md },
    serviceName: { ...theme.typography.body, fontWeight: '700' },
    serviceDesc: { ...theme.typography.caption, marginTop: 4, lineHeight: 18 },
    countColumn: { alignItems: 'center', minWidth: 72 },
    countValue: { ...theme.typography.h3, fontSize: 18, color: theme.colors.primary },
    countLabel: { ...theme.typography.caption, marginTop: 4 },
});
