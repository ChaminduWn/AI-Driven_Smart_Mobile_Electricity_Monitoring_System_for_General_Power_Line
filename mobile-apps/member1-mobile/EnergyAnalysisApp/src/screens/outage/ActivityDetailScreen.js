import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme/outage';
import { Card } from '../../components/outage/Card';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../../utils/outage/i18nShim';
import { Button } from '../../components/outage/Button';
import { useAuth } from '../../contexts/AuthContext';

export const ActivityDetailScreen = ({ route, navigation }) => {
    const { activity } = route.params;
    const { t } = useTranslation();
    const { user } = useAuth();
    const isBoardReport = activity.activityKind === 'boardReport';

    const statusColor = activity.status === 'Completed' ? theme.colors.success : activity.status === 'Ongoing' ? theme.colors.warning : theme.colors.primary;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Activity Details</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Information</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Category</Text>
                        <Text style={styles.value}>{isBoardReport ? activity.categoryTitle : activity.title}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Type</Text>
                        <Text style={styles.value}>{isBoardReport ? 'Electricity Board Issue' : activity.subCategory}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Status</Text>
                        <Text style={[styles.value, { color: statusColor }]}>{activity.status}</Text>
                    </View>
                </Card>

                {isBoardReport ? (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>Location Details</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Address</Text>
                            <Text style={styles.valueCompact}>{activity.address}</Text>
                        </View>
                    </Card>
                ) : (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>Technician</Text>
                        <View style={styles.electricianRow}>
                            <View style={styles.avatar}><Ionicons name="person" size={22} color={theme.colors.primary} /></View>
                            <View>
                                <Text style={styles.electricianName}>{activity.electrician?.fullName || 'Assigned Technician'}</Text>
                                <Text style={styles.electricianMeta}>{activity.electrician?.phone || '071XXXXXXX'}</Text>
                            </View>
                        </View>
                        {activity.startCode && (
                            <View style={styles.startCodeBox}>
                                <Text style={styles.startCodeLabel}>Share Code</Text>
                                <Text style={styles.startCodeValue}>{activity.startCode}</Text>
                            </View>
                        )}
                    </Card>
                )}

                {!isBoardReport && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>Payment</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Cost</Text>
                            <Text style={[styles.value, { color: theme.colors.success }]}>LKR {activity.estimatedCost?.toLocaleString()}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Date</Text>
                            <Text style={styles.value}>{new Date(activity.createdAt).toLocaleString()}</Text>
                        </View>
                    </Card>
                )}

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Timeline</Text>
                    <View style={styles.timelineStep}>
                        <View style={styles.timelineDot}><Ionicons name="create" size={14} color={theme.colors.primary} /></View>
                        <View style={styles.timelineInfo}>
                            <Text style={styles.timelineLabel}>Reported</Text>
                            <Text style={styles.timelineTime}>{new Date(activity.createdAt).toLocaleString()}</Text>
                        </View>
                    </View>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    backButton: { padding: 8, marginRight: 8 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    scrollContent: { padding: 20 },
    card: { marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: theme.colors.primary },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    label: { fontSize: 13, color: theme.colors.textMuted },
    value: { fontSize: 14, fontWeight: '600' },
    valueCompact: { fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 10 },
    electricianRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    electricianName: { fontSize: 15, fontWeight: '700' },
    electricianMeta: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
    startCodeBox: { marginTop: 16, backgroundColor: `${theme.colors.secondary}14`, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: `${theme.colors.secondary}30` },
    startCodeLabel: { fontSize: 11, color: theme.colors.secondary, marginBottom: 4 },
    startCodeValue: { fontSize: 24, color: theme.colors.secondary, letterSpacing: 2, fontWeight: '800' },
    timelineStep: { flexDirection: 'row', alignItems: 'center' },
    timelineDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    timelineInfo: { flex: 1 },
    timelineLabel: { fontSize: 14 },
    timelineTime: { fontSize: 12, color: theme.colors.textMuted },
});

export default ActivityDetailScreen;
