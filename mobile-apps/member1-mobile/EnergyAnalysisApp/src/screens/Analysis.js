import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Title, List, Divider, ActivityIndicator } from 'react-native-paper';
import { TrendingUp, AlertTriangle, Info } from 'lucide-react-native';
import apiClient from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';

const Analysis = () => {
    const { user } = useAuth();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const accountNumber = user?.account_number || '123456789';

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/appliances/recommendations/${accountNumber}`);
            if (response.data.success) {
                setRecommendations(response.data.recommendations);
            }
        } catch (error) {
            console.error('Error fetching recommendations:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.headerCard}>
                <Card.Content>
                    <Title style={styles.whiteText}>AI Energy Insights</Title>
                    <Text style={styles.mutedText}>Optimization & Recommendations</Text>
                </Card.Content>
            </Card>

            {loading ? (
                <ActivityIndicator animating={true} color="#3B82F6" style={{ marginTop: 20 }} />
            ) : (
                <View style={styles.section}>
                    <Title style={styles.sectionTitle}>Recommendations</Title>
                    {recommendations.length > 0 ? (
                        recommendations.map((rec, index) => (
                            <Card key={index} style={styles.recommendationCard}>
                                <Card.Content>
                                    <View style={styles.recHeader}>
                                        <View style={[styles.badge, { backgroundColor: rec.priority === 'high' ? '#EF4444' : '#F59E0B' }]}>
                                            <Text style={styles.badgeText}>{rec.priority.toUpperCase()}</Text>
                                        </View>
                                        <Text style={styles.recTitle}>{rec.message}</Text>
                                    </View>
                                    <Text style={styles.recDesc}>{rec.suggestion}</Text>
                                    {rec.potential_savings_kwh && (
                                        <Text style={styles.savingsText}>
                                            💡 Potential Savings: {rec.potential_savings_kwh} kWh/mo
                                        </Text>
                                    )}
                                </Card.Content>
                            </Card>
                        ))
                    ) : (
                        <Text style={styles.mutedText}>No recommendations available yet.</Text>
                    )}
                </View>
            )}

            {/* Placeholder for Outage Report (mention in prompt) */}
            <Card style={styles.infoCard}>
                <View style={styles.row}>
                    <Info color="#3B82F6" size={24} />
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoTitle}>Note on Outages</Text>
                        <Text style={styles.infoDesc}>Outage reporting is handled by Member 2. You will see alerts here if your area is affected.</Text>
                    </View>
                </View>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827', padding: 16 },
    headerCard: { backgroundColor: '#1F2937', marginBottom: 16, borderRadius: 12 },
    whiteText: { color: '#fff' },
    mutedText: { color: '#9CA3AF' },
    section: { marginBottom: 24 },
    sectionTitle: { color: '#fff', marginBottom: 12, fontSize: 20 },
    recommendationCard: { backgroundColor: '#1F2937', marginBottom: 12, borderRadius: 12 },
    recHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    recTitle: { color: '#fff', fontWeight: 'bold', flex: 1 },
    recDesc: { color: '#D1D5DB', fontSize: 14 },
    savingsText: { color: '#10B981', marginTop: 8, fontWeight: 'bold' },
    infoCard: { backgroundColor: '#1F2937', padding: 16, borderRadius: 12, marginBottom: 32 },
    row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    infoTextContainer: { flex: 1 },
    infoTitle: { color: '#3B82F6', fontWeight: 'bold', fontSize: 16 },
    infoDesc: { color: '#9CA3AF', fontSize: 14, marginTop: 4 },
});

export default Analysis;
