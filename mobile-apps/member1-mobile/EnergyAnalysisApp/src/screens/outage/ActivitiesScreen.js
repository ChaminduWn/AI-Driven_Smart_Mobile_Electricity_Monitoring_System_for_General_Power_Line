import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme/outage';
import { Card } from '../../components/outage/Card';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../utils/outage/i18nShim';

export const ActivitiesScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [activities, setActivities] = React.useState({ boardReports: [], electricianReports: [] });
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        // Simulate fetching history
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
                    <Text style={styles.subType}>
                        {item.activityKind === 'boardReport' ? 'Reported to Electricity Board' : item.subCategory}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
            </View>
            <View style={styles.cardBottom}>
                <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={14} color={theme.colors.textMuted} />
                    <Text style={styles.detailText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                {item.estimatedCost && <Text style={styles.amount}>LKR {item.estimatedCost}</Text>}
            </View>
        </Card>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>{t('activities.title')}</Text>
                    <Text style={styles.headerSubtitle}>Track your reports and service requests</Text>
                </View>
            </View>
            {loading ? (
                <View style={styles.centeredState}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
            ) : (
                <ScrollView contentContainerStyle={styles.list}>
                    <Text style={styles.sectionHeading}>Electricity Board Reports</Text>
                    {activities.boardReports.map(renderActivityCard)}
                    <Text style={[styles.sectionHeading, { marginTop: 20 }]}>Technician Requests</Text>
                    {activities.electricianReports.map(renderActivityCard)}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    backBtn: { padding: 8, marginRight: 8 },
    headerTitle: { fontSize: 20, fontWeight: '800' },
    headerSubtitle: { fontSize: 12, color: theme.colors.textSecondary },
    centeredState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16, paddingBottom: 40 },
    sectionHeading: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: theme.colors.textMuted },
    card: { marginBottom: 12 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    typeInfo: { flex: 1 },
    issueType: { fontSize: 15, fontWeight: '700' },
    subType: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: '700' },
    cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    detailItem: { flexDirection: 'row', alignItems: 'center' },
    detailText: { fontSize: 12, color: theme.colors.textMuted, marginLeft: 4 },
    amount: { fontSize: 14, color: theme.colors.success, fontWeight: '700' },
});

export default ActivitiesScreen;
