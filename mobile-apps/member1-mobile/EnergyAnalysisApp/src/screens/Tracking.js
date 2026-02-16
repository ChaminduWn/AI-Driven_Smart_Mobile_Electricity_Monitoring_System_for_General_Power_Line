import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Title, Button, TextInput, ActivityIndicator } from 'react-native-paper';
import { Activity, Calendar, Zap, TrendingUp } from 'lucide-react-native';
import apiClient from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';

const Tracking = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [reading, setReading] = useState('');
    const [progress, setProgress] = useState(null);
    const accountNumber = user?.account_number || '123456789';

    const handleTrackProgress = async () => {
        if (!reading) return;
        setLoading(true);
        try {
            // In a real app, we'd fetch the active plan first. 
            // For this port, we'll assume the backend handles the mapping.
            const response = await apiClient.post('/analysis/track-progress', {
                current_reading: parseInt(reading),
                reading_date: new Date().toISOString(),
            });

            if (response.data.success) {
                setProgress(response.data.progress);
                Alert.alert('Success', 'Meter reading recorded!');
            }
        } catch (error) {
            console.error('Error tracking progress:', error);
            Alert.alert('Error', 'Failed to submit reading. Ensure a budget plan is active.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.headerCard}>
                <Card.Content>
                    <Title style={styles.whiteText}>Usage Tracking</Title>
                    <Text style={styles.mutedText}>Monitor your consumption in real-time</Text>
                </Card.Content>
            </Card>

            <Card style={styles.mainCard}>
                <Card.Content>
                    <Title style={styles.cardTitle}>Submit Meter Reading</Title>
                    <TextInput
                        label="Current Reading (kWh)"
                        value={reading}
                        onChangeText={setReading}
                        keyboardType="numeric"
                        mode="outlined"
                        style={styles.input}
                    />
                    <Button
                        mode="contained"
                        onPress={handleTrackProgress}
                        loading={loading}
                        disabled={!reading || loading}
                        style={styles.button}
                    >
                        Track Consumption
                    </Button>
                </Card.Content>
            </Card>

            {progress && (
                <View style={styles.results}>
                    <Title style={styles.sectionTitle}>Current Status</Title>
                    <View style={styles.grid}>
                        <Card style={[styles.statCard, { borderLeftColor: progress.current_status?.status === 'over_budget' ? '#EF4444' : '#10B981' }]}>
                            <Card.Content>
                                <Text style={styles.statLabel}>Status</Text>
                                <Text style={[styles.statValue, { color: progress.current_status?.status === 'over_budget' ? '#EF4444' : '#10B981' }]}>
                                    {progress.current_status?.status?.replace('_', ' ').toUpperCase()}
                                </Text>
                            </Card.Content>
                        </Card>
                        <Card style={styles.statCard}>
                            <Card.Content>
                                <Text style={styles.statLabel}>Actual Cost</Text>
                                <Text style={styles.statValue}>Rs. {progress.current_status?.actual_cost?.toFixed(2)}</Text>
                            </Card.Content>
                        </Card>
                    </View>

                    <Card style={styles.projectionCard}>
                        <Card.Content>
                            <View style={styles.row}>
                                <TrendingUp color="#F59E0B" size={24} />
                                <View>
                                    <Text style={styles.statLabel}>Projected Monthly Total</Text>
                                    <Text style={styles.projectionValue}>Rs. {progress.projection?.projected_total_cost?.toFixed(2)}</Text>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827', padding: 16 },
    headerCard: { backgroundColor: '#1F2937', marginBottom: 16, borderRadius: 12 },
    whiteText: { color: '#fff' },
    mutedText: { color: '#9CA3AF' },
    mainCard: { backgroundColor: '#1F2937', marginBottom: 20, borderRadius: 16 },
    cardTitle: { color: '#fff', fontSize: 18, marginBottom: 12 },
    input: { backgroundColor: '#1F2937', marginBottom: 16 },
    button: { paddingVertical: 4 },
    results: { marginTop: 10 },
    sectionTitle: { color: '#fff', marginBottom: 12 },
    grid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    statCard: { flex: 1, backgroundColor: '#1F2937', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
    statLabel: { color: '#9CA3AF', fontSize: 12 },
    statValue: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 4 },
    projectionCard: { backgroundColor: '#1F2937', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    projectionValue: { color: '#F59E0B', fontSize: 24, fontWeight: 'bold', marginTop: 2 },
});

export default Tracking;
