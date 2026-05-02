import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Card } from '../components/Card';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { buildApiUrl } from '../api';

export const ActivitiesScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [activities, setActivities] = React.useState({ boardReports: [], electricianReports: [] });
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchHistory = async () => {
            if (!user?.id) {
                return;
            }

            try {
                const [jobsResponse, boardReportsResponse] = await Promise.all([
                    fetch(buildApiUrl(`/jobs/history/${user.id}`)),
                    fetch(buildApiUrl(`/board-reports/user/${user.id}`)),
                ]);

                const jobsData = await jobsResponse.json();
                const boardReportsData = await boardReportsResponse.json();

                if (!jobsData.success) {
                    Alert.alert('Error', jobsData.message || t('activities.fetchError'));
                    return;
                }

                if (!boardReportsData.success) {
                    Alert.alert('Error', boardReportsData.message || t('activities.fetchError'));
                    return;
                }

                setActivities({
                    electricianReports: jobsData.jobs.map((item) => ({ ...item, activityKind: 'electricianJob' })),
                    boardReports: boardReportsData.reports.map((item) => ({ ...item, activityKind: 'boardReport' })),
                });
            } catch (error) {
                console.error('Fetch history error', error);
                Alert.alert('Error', t('activities.networkError'));
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = navigation.addListener('focus', () => {
            setLoading(true);
            fetchHistory();
        });

        return unsubscribe;
    }, [user?.id, navigation, t]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed':
            case 'Done':
                return theme.colors.success;
            case 'Ongoing':
            case 'WorkingOnIt':
            case 'PaymentPending':
            case 'AwaitingTechnicianConfirmation':
                return theme.colors.warning;
            case 'Cancelled':
                return theme.colors.danger;
            case 'Reported':
                return theme.colors.primary;
            default:
                return theme.colors.textMuted;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Completed':
                return 'checkmark-circle';
            case 'Done':
                return 'checkmark-done-circle';
            case 'Ongoing':
                return 'time';
            case 'WorkingOnIt':
                return 'build';
            case 'PaymentPending':
                return 'card';
            case 'AwaitingTechnicianConfirmation':
                return 'cash';
            case 'Cancelled':
                return 'close-circle';
            case 'Reported':
                return 'alert-circle';
            default:
                return 'ellipse';
        }
    };

    const renderActivityCard = (item) => (
        <Card
            key={item.id}
            style={styles.card}
            onPress={() => navigation.navigate('ActivityDetail', { activity: item })}
        >
            <View style={styles.cardTop}>
                <View style={styles.typeInfo}>
                    <Text style={styles.issueType}>
                        {item.activityKind === 'boardReport' ? item.categoryTitle : item.category || item.title}
                    </Text>
                    <Text style={styles.subType}>
                        {item.activityKind === 'boardReport'
                            ? item.statusMessage || 'Reported to electricity board'
                            : item.subCategory || t('activities.generalService')}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <Ionicons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.cardBottom}>
                <View style={styles.detailItem}>
                    <Ionicons
                        name={item.activityKind === 'boardReport' ? 'business-outline' : 'person-outline'}
                        size={14}
                        color={theme.colors.textMuted}
                    />
                    <Text style={styles.detailText}>
                        {item.activityKind === 'boardReport'
                            ? item.address
                            : user?.role === 'Electrician'
                                ? t('activities.clientId') + item.householderId.substring(0, 4)
                                : t('activities.techId') + (item.electricianId ? item.electricianId.substring(0, 4) : t('activities.pending'))}
                    </Text>
                </View>
                <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={14} color={theme.colors.textMuted} />
                    <Text style={styles.detailText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                {item.activityKind !== 'boardReport' && (item.finalCost || item.estimatedCost) ? (
                    <Text style={styles.amount}>LKR {item.finalCost || item.estimatedCost}</Text>
                ) : null}
            </View>

            {item.activityKind !== 'boardReport' && item.rating ? (
                <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons key={s} name={s <= item.rating ? 'star' : 'star-outline'} size={14} color={theme.colors.warning} />
                    ))}
                    <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
            ) : null}
        </Card>
    );

    const renderSection = (title, items, emptyText) => (
        <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>{title}</Text>
                <Text style={styles.sectionCount}>{items.length}</Text>
            </View>

            {items.length > 0 ? (
                items.map((item) => renderActivityCard(item))
            ) : (
                <Card style={styles.emptySectionCard}>
                    <Text style={styles.emptySectionText}>{emptyText}</Text>
                </Card>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('activities.title')}</Text>
                <Text style={styles.headerSubtitle}>{t('activities.subtitle')}</Text>
            </View>
            {loading ? (
                <View style={styles.centeredState}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : activities.boardReports.length > 0 || activities.electricianReports.length > 0 ? (
                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                    {renderSection('Reported for Electricity Board', activities.boardReports, 'No electricity board reports yet.')}
                    {renderSection('Reported to Electricians', activities.electricianReports, 'No electrician reports yet.')}
                </ScrollView>
            ) : (
                <View style={styles.centeredState}>
                    <Ionicons name="document-text-outline" size={64} color={theme.colors.textMuted} style={{ marginBottom: 16 }} />
                    <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>{t('activities.noActivities')}</Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerTitle: { ...theme.typography.h2 },
    headerSubtitle: { ...theme.typography.caption, marginTop: 2 },
    centeredState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: theme.spacing.md, paddingBottom: 100 },
    sectionBlock: { marginBottom: theme.spacing.lg },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.sm },
    sectionHeading: { ...theme.typography.h3 },
    sectionCount: { ...theme.typography.caption, color: theme.colors.secondary, fontWeight: '700' },
    card: { marginBottom: theme.spacing.sm },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    typeInfo: { flex: 1 },
    issueType: { ...theme.typography.body, fontWeight: '700' },
    subType: { ...theme.typography.caption, marginTop: 2 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.sm },
    statusText: { fontSize: 12, fontWeight: '700', marginLeft: 4 },
    cardBottom: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
    detailItem: { flexDirection: 'row', alignItems: 'center' },
    detailText: { ...theme.typography.caption, marginLeft: 4, maxWidth: 180 },
    amount: { ...theme.typography.body, color: theme.colors.success, fontWeight: '700', marginLeft: 'auto' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.border },
    ratingText: { color: theme.colors.warning, fontSize: 13, fontWeight: '700', marginLeft: 6 },
    emptySectionCard: { marginBottom: theme.spacing.sm },
    emptySectionText: { ...theme.typography.bodySmall, color: theme.colors.textSecondary },
});
