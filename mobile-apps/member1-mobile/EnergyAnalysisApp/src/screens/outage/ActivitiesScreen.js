import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme/outage';
import { Card } from '../../components/outage/Card';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../utils/outage/i18nShim';
import { LinearGradient } from 'expo-linear-gradient';

export const ActivitiesScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [activities, setActivities] = React.useState({ boardReports: [], electricianReports: [] });
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setActivities({
                boardReports: [
                    { id: '1', categoryTitle: 'Transformer Fault', status: 'Reported', address: '123 Main St, Colombo', createdAt: new Date().toISOString(), activityKind: 'boardReport' }
                ],
                electricianReports: [
                    { id: '2', title: 'Complete Power Failure', subCategory: 'Total Blackout', status: 'Ongoing', estimatedCost: 2500, createdAt: new Date().toISOString(), activityKind: 'electricianJob' }
                ]
            });
            setLoading(false);
        }, 1500);
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return theme.colors.success;
            case 'Ongoing': return theme.colors.warning;
            case 'Cancelled': return theme.colors.danger;
            case 'Reported': return theme.colors.primary;
            default: return theme.colors.textMuted;
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
                        {item.activityKind === 'boardReport' ? item.categoryTitle : item.title}
                    </Text>
                    <View style={styles.subTypeRow}>
                        <Ionicons 
                            name={item.activityKind === 'boardReport' ? "business-outline" : "construct-outline"} 
                            size={12} 
                            color={theme.colors.textSecondary} 
                        />
                        <Text style={styles.subType}>
                            {item.activityKind === 'boardReport' ? 'Electricity Board' : item.subCategory}
                        </Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '25' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardBottom}>
                <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={14} color={theme.colors.textMuted} />
                    <Text style={styles.detailText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                {item.estimatedCost ? (
                    <View style={styles.costBadge}>
                        <Text style={styles.amount}>LKR {item.estimatedCost}</Text>
                    </View>
                ) : (
                    <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                )}
            </View>
        </Card>
    );

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#1E293B', '#0F172A']}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>{t('activities.title')}</Text>
                        <Text style={styles.headerSubtitle}>Track your reports and service requests</Text>
                    </View>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.centeredState}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Fetching activities...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.iconBox, { backgroundColor: theme.colors.primary + '20' }]}>
                            <Ionicons name="megaphone" size={18} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.sectionHeading}>Electricity Board Reports</Text>
                    </View>
                    {activities.boardReports.length > 0 ? (
                        activities.boardReports.map(renderActivityCard)
                    ) : (
                        <Text style={styles.emptyText}>No board reports found</Text>
                    )}

                    <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                        <View style={[styles.iconBox, { backgroundColor: theme.colors.secondary + '20' }]}>
                            <Ionicons name="build" size={18} color={theme.colors.secondary} />
                        </View>
                        <Text style={styles.sectionHeading}>Technician Requests</Text>
                    </View>
                    {activities.electricianReports.length > 0 ? (
                        activities.electricianReports.map(renderActivityCard)
                    ) : (
                        <Text style={styles.emptyText}>No technician requests found</Text>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    headerGradient: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 20 },
    backBtn: { 
        width: 40, height: 40, 
        borderRadius: 20, 
        backgroundColor: 'rgba(255,255,255,0.05)', 
        justifyContent: 'center', alignItems: 'center', 
        marginRight: 12 
    },
    headerTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
    headerSubtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
    centeredState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: theme.colors.textSecondary, fontSize: 14 },
    list: { padding: 16, paddingBottom: 40 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    sectionHeading: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
    card: { marginBottom: 16, padding: 16 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    typeInfo: { flex: 1 },
    issueType: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
    subTypeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    subType: { fontSize: 13, color: theme.colors.textSecondary, marginLeft: 6 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    statusText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
    divider: { height: 1, backgroundColor: theme.colors.border, opacity: 0.5, marginVertical: 12 },
    cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    detailItem: { flexDirection: 'row', alignItems: 'center' },
    detailText: { fontSize: 13, color: theme.colors.textMuted, marginLeft: 6 },
    costBadge: { backgroundColor: theme.colors.success + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    amount: { fontSize: 14, color: theme.colors.success, fontWeight: '800' },
    emptyText: { color: theme.colors.textMuted, fontSize: 14, fontStyle: 'italic', marginLeft: 48 },
});

export default ActivitiesScreen;
