import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme/outage';
import { Card } from '../../components/outage/Card';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../../utils/outage/i18nShim';
import { useAuth } from '../../contexts/AuthContext';
import ResponsiveWrapper from '../../components/ResponsiveWrapper';

export const ActivityDetailScreen = ({ route, navigation }) => {
    const { activity } = route.params;
    const { t } = useTranslation();
    const { user } = useAuth();
    const isBoardReport = activity.activityKind === 'boardReport';

    const statusColor = activity.status === 'Completed' ? theme.colors.success : activity.status === 'Ongoing' ? theme.colors.warning : theme.colors.primary;

    return (
        <SafeAreaView style={styles.container}>
            <ResponsiveWrapper maxWidth={700}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={26} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Activity Details</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Card style={styles.card}>
                        <View style={styles.sectionHeaderRow}>
                            <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
                            <Text style={styles.sectionTitle}>Information</Text>
                        </View>
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
                            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor + '40' }]}>
                                <Text style={[styles.statusText, { color: statusColor }]}>{activity.status}</Text>
                            </View>
                        </View>
                    </Card>

                    {isBoardReport ? (
                        <Card style={styles.card}>
                            <View style={styles.sectionHeaderRow}>
                                <Ionicons name="location" size={20} color={theme.colors.secondary} />
                                <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Location Details</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Address</Text>
                                <Text style={styles.valueCompact}>{activity.address}</Text>
                            </View>
                        </Card>
                    ) : (
                        <Card style={styles.card}>
                            <View style={styles.sectionHeaderRow}>
                                <Ionicons name="person" size={20} color={theme.colors.primary} />
                                <Text style={styles.sectionTitle}>Technician</Text>
                            </View>
                            <View style={styles.electricianRow}>
                                <View style={styles.avatar}><Ionicons name="person" size={24} color={theme.colors.primary} /></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.electricianName}>{activity.electrician?.fullName || 'Assigned Technician'}</Text>
                                    <Text style={styles.electricianMeta}>{activity.electrician?.phone || '071XXXXXXX'}</Text>
                                </View>
                                <TouchableOpacity style={styles.callBtn}>
                                    <Ionicons name="call" size={20} color={theme.colors.success} />
                                </TouchableOpacity>
                            </View>
                            {activity.startCode && (
                                <View style={styles.startCodeBox}>
                                    <Text style={styles.startCodeLabel}>Authentication Code</Text>
                                    <Text style={styles.startCodeValue}>{activity.startCode}</Text>
                                    <Text style={styles.startCodeHint}>Share this with the technician upon arrival</Text>
                                </View>
                            )}
                        </Card>
                    )}

                    {!isBoardReport && (
                        <Card style={styles.card}>
                            <View style={styles.sectionHeaderRow}>
                                <Ionicons name="card" size={20} color={theme.colors.success} />
                                <Text style={[styles.sectionTitle, { color: theme.colors.success }]}>Payment</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Estimated Cost</Text>
                                <Text style={[styles.valueLarge, { color: theme.colors.success }]}>LKR {activity.estimatedCost?.toLocaleString()}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Request Date</Text>
                                <Text style={styles.value}>{new Date(activity.createdAt).toLocaleString()}</Text>
                            </View>
                        </Card>
                    )}

                    <Card style={styles.card}>
                        <View style={styles.sectionHeaderRow}>
                            <Ionicons name="time" size={20} color={theme.colors.warning} />
                            <Text style={[styles.sectionTitle, { color: theme.colors.warning }]}>Timeline</Text>
                        </View>
                        <View style={styles.timelineStep}>
                            <View style={styles.timelineDot}><Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} /></View>
                            <View style={styles.timelineInfo}>
                                <Text style={styles.timelineLabel}>Reported Successfully</Text>
                                <Text style={styles.timelineTime}>{new Date(activity.createdAt).toLocaleString()}</Text>
                            </View>
                        </View>
                    </Card>
                </ScrollView>
            </ResponsiveWrapper>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 8 },
    backButton: { padding: 8, marginRight: 8, backgroundColor: theme.colors.surface, borderRadius: 12 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
    scrollContent: { padding: 20, paddingBottom: 40 },
    card: { marginBottom: 20, padding: 18, borderRadius: 20, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border + '50' },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.primary, letterSpacing: 0.5 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border + '30' },
    label: { fontSize: 14, color: theme.colors.textMuted, fontWeight: '500' },
    value: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
    valueLarge: { fontSize: 18, fontWeight: '800' },
    valueCompact: { fontSize: 15, fontWeight: '700', color: theme.colors.text, flex: 1, textAlign: 'right', marginLeft: 16 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    statusText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
    electricianRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: theme.colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
    electricianName: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
    electricianMeta: { fontSize: 13, color: theme.colors.textMuted, marginTop: 2 },
    callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.success + '15', justifyContent: 'center', alignItems: 'center' },
    startCodeBox: { marginTop: 20, backgroundColor: theme.colors.background, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.primary + '30', alignItems: 'center' },
    startCodeLabel: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 8, fontWeight: '600' },
    startCodeValue: { fontSize: 32, color: theme.colors.primary, letterSpacing: 6, fontWeight: '900' },
    startCodeHint: { fontSize: 11, color: theme.colors.textMuted, marginTop: 10, fontStyle: 'italic' },
    timelineStep: { flexDirection: 'row', alignItems: 'flex-start' },
    timelineDot: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    timelineInfo: { flex: 1 },
    timelineLabel: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
    timelineTime: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4 },
});

export default ActivityDetailScreen;
