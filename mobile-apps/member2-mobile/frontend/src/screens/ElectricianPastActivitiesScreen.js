import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Card } from '../components/Card';
import Ionicons from 'react-native-vector-icons/Ionicons';

const MOCK_PAST = [
    { id: '1', type: 'Power Supply Issues', sub: 'Complete Power Outage', client: 'Amara Fernando', amount: 'LKR 1,500', date: '2025-02-24', rating: 5, feedback: 'Excellent work! Very professional.' },
    { id: '2', type: 'Safety-Related', sub: 'Sparks from Meter', client: 'Kavindu De Silva', amount: 'LKR 2,000', date: '2025-02-22', rating: 4, feedback: 'Good job, arrived on time.' },
    { id: '3', type: 'Voltage & Technical', sub: 'Low Voltage', client: 'Priya Gunasekera', amount: 'LKR 1,800', date: '2025-02-20', rating: 5, feedback: 'Very knowledgeable and helpful.' },
];

export const ElectricianPastActivitiesScreen = () => {
    const renderItem = ({ item }) => (
        <Card style={styles.card}>
            <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.jobType}>{item.type}</Text>
                    <Text style={styles.jobSub}>{item.sub}</Text>
                </View>
                <Text style={styles.amount}>{item.amount}</Text>
            </View>
            <View style={styles.clientRow}>
                <Ionicons name="person-outline" size={14} color={theme.colors.textMuted} />
                <Text style={styles.clientText}>{item.client}</Text>
                <Text style={styles.dateText}>{item.date}</Text>
            </View>
            {item.rating && (
                <View style={styles.feedbackSection}>
                    <View style={styles.ratingRow}>
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Ionicons key={s} name={s <= item.rating ? 'star' : 'star-outline'} size={14} color={theme.colors.warning} />
                        ))}
                        <Text style={styles.ratingVal}>{item.rating}.0</Text>
                    </View>
                    <Text style={styles.feedbackText}>"{item.feedback}"</Text>
                </View>
            )}
        </Card>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Past Activities</Text>
                <Text style={styles.headerSubtitle}>Your completed jobs</Text>
            </View>
            <FlatList
                data={MOCK_PAST}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    headerTitle: { ...theme.typography.h2 },
    headerSubtitle: { ...theme.typography.caption, marginTop: 2 },
    list: { padding: theme.spacing.md, paddingBottom: 100 },
    card: { marginBottom: theme.spacing.sm },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    jobType: { ...theme.typography.body, fontWeight: '700' },
    jobSub: { ...theme.typography.caption, marginTop: 2 },
    amount: { ...theme.typography.h3, color: theme.colors.success, fontSize: 16 },
    clientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    clientText: { ...theme.typography.caption, marginLeft: 4, flex: 1 },
    dateText: { ...theme.typography.caption },
    feedbackSection: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 8 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    ratingVal: { color: theme.colors.warning, fontSize: 13, fontWeight: '700', marginLeft: 6 },
    feedbackText: { ...theme.typography.bodySmall, fontStyle: 'italic', lineHeight: 18 },
});
