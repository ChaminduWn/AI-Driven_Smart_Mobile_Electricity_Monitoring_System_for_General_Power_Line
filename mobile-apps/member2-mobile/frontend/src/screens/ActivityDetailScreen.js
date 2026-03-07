import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Card } from '../components/Card';
import Ionicons from 'react-native-vector-icons/Ionicons';

export const ActivityDetailScreen = ({ route, navigation }) => {
    const { activity } = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Activity Details</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Issue Info */}
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Issue Information</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Category</Text>
                        <Text style={styles.value}>{activity.issueType}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Sub-type</Text>
                        <Text style={styles.value}>{activity.subType}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Status</Text>
                        <Text style={[styles.value, { color: activity.status === 'Completed' ? theme.colors.success : activity.status === 'Ongoing' ? theme.colors.warning : theme.colors.danger }]}>
                            {activity.status}
                        </Text>
                    </View>
                </Card>

                {/* Electrician Details */}
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Electrician</Text>
                    <View style={styles.electricianRow}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={22} color={theme.colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.electricianName}>{activity.electrician}</Text>
                            {activity.rating && (
                                <View style={styles.stars}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Ionicons key={s} name={s <= activity.rating ? 'star' : 'star-outline'} size={14} color={theme.colors.warning} />
                                    ))}
                                    <Text style={styles.ratingVal}>{activity.rating}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </Card>

                {/* Payment */}
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Payment</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Amount</Text>
                        <Text style={[styles.value, { color: theme.colors.success, fontWeight: '700' }]}>{activity.amount}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Date</Text>
                        <Text style={styles.value}>{activity.date}</Text>
                    </View>
                </Card>

                {/* Timeline */}
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Timeline</Text>
                    {[
                        { label: 'Request Created', time: '10:30 AM', icon: 'create' },
                        { label: 'Electrician Accepted', time: '10:35 AM', icon: 'checkmark' },
                        { label: 'Electrician Arrived', time: '10:50 AM', icon: 'location' },
                        { label: 'Job Completed', time: '11:30 AM', icon: 'checkmark-done' },
                    ].map((step, i) => (
                        <View key={i} style={styles.timelineStep}>
                            <View style={styles.timelineDot}>
                                <Ionicons name={step.icon} size={14} color={theme.colors.primary} />
                            </View>
                            <View style={styles.timelineInfo}>
                                <Text style={styles.timelineLabel}>{step.label}</Text>
                                <Text style={styles.timelineTime}>{step.time}</Text>
                            </View>
                        </View>
                    ))}
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
    scrollContent: { padding: theme.spacing.lg, paddingBottom: 40 },
    card: { marginBottom: theme.spacing.md },
    sectionTitle: { ...theme.typography.h3, fontSize: 16, marginBottom: theme.spacing.md, color: theme.colors.primary },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    label: { ...theme.typography.bodySmall },
    value: { ...theme.typography.body, fontWeight: '600' },
    electricianRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 44, height: 44, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    electricianName: { ...theme.typography.body, fontWeight: '700' },
    stars: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    ratingVal: { color: theme.colors.warning, fontSize: 13, fontWeight: '700', marginLeft: 4 },
    timelineStep: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    timelineDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    timelineInfo: { flex: 1 },
    timelineLabel: { ...theme.typography.body, fontSize: 14 },
    timelineTime: { ...theme.typography.caption, marginTop: 2 },
});
