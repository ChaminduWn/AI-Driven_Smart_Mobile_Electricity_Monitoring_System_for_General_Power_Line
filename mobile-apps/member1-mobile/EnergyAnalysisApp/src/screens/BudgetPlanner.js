import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Title, Button, TextInput, Divider, ActivityIndicator } from 'react-native-paper';
import { Target, TrendingUp, Zap, Calendar } from 'lucide-react-native';
import apiClient from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';

const BudgetPlanner = ({ route, navigation }) => {
    const { user } = useAuth();
    const { billId, bill: initialBill } = route.params || {};
    const [bill, setBill] = useState(initialBill);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    // Plan inputs
    const [targetBudget, setTargetBudget] = useState('');
    const [planningDays, setPlanningDays] = useState('30');

    const accountNumber = user?.account_number || '123456789';

    useEffect(() => {
        if (billId && !bill) {
            fetchBillDetails();
        } else if (bill) {
            fetchAnalysis();
        }
    }, [billId, bill]);

    const fetchBillDetails = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/bills/${billId}`);
            if (response.data.success) {
                setBill(response.data.data);
                fetchAnalysis();
            }
        } catch (error) {
            console.error('Error fetching bill:', error);
            Alert.alert('Error', 'Failed to load bill details.');
        } finally {
            // analysis fetch will set loading to false
        }
    };

    const fetchAnalysis = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/analysis/past-month/${billId || bill.id}`);
            if (response.data.success) {
                setAnalysis(response.data.analysis);
                // Suggest a target budget (e.g., 10% less than previous)
                const previousCost = response.data.analysis.cost_summary.total_charge;
                setTargetBudget(Math.floor(previousCost * 0.9).toString());
            }
        } catch (error) {
            console.error('Error fetching analysis:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlan = async () => {
        if (!targetBudget || !planningDays) return;
        setCreating(true);
        try {
            const response = await apiClient.post('/analysis/create-budget-plan', {
                bill_id: billId || bill.id,
                target_budget: parseFloat(targetBudget),
                planning_days: parseInt(planningDays),
            });

            if (response.data.success) {
                Alert.alert('Success', 'Budget plan created! Tracking is now active.');
                navigation.navigate('Tracking');
            }
        } catch (error) {
            console.error('Error creating plan:', error);
            Alert.alert('Error', error.response?.data?.detail || 'Failed to create budget plan.');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator animating={true} color="#3B82F6" />
                <Text style={{ marginTop: 10, color: '#9CA3AF' }}>Analyzing past consumption...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.headerCard}>
                <Card.Content>
                    <Title style={styles.whiteText}>Bill Analysis</Title>
                    <Text style={styles.mutedText}>Based on your bill from {bill?.bill_date ? new Date(bill.bill_date).toLocaleDateString() : 'recent'}</Text>
                </Card.Content>
            </Card>

            {analysis && (
                <View style={styles.statsGrid}>
                    <Card style={styles.statBox}>
                        <Card.Content>
                            <Zap color="#3B82F6" size={20} />
                            <Text style={styles.statLabel}>Avg Daily</Text>
                            <Text style={styles.statValue}>{analysis.consumption_averages.daily_avg.toFixed(1)} kWh</Text>
                        </Card.Content>
                    </Card>
                    <Card style={styles.statBox}>
                        <Card.Content>
                            <TrendingUp color="#10B981" size={20} />
                            <Text style={styles.statLabel}>Past Total</Text>
                            <Text style={styles.statValue}>Rs. {analysis.cost_summary.total_charge.toFixed(0)}</Text>
                        </Card.Content>
                    </Card>
                </View>
            )}

            <Card style={styles.planCard}>
                <Card.Content>
                    <Title style={styles.whiteText}>Create New Budget Plan</Title>
                    <Divider style={styles.divider} />

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Target Budget (Rs.)</Text>
                        <TextInput
                            value={targetBudget}
                            onChangeText={setTargetBudget}
                            keyboardType="numeric"
                            mode="outlined"
                            style={styles.input}
                            placeholder="e.g. 5000"
                        />
                        <Text style={styles.helperText}>Suggested: 10% reduction from last bill</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Planning Period (Days)</Text>
                        <TextInput
                            value={planningDays}
                            onChangeText={setPlanningDays}
                            keyboardType="numeric"
                            mode="outlined"
                            style={styles.input}
                        />
                    </View>

                    <Button
                        mode="contained"
                        icon="target"
                        onPress={handleCreatePlan}
                        loading={creating}
                        disabled={creating || !targetBudget}
                        style={styles.actionButton}
                        contentStyle={{ paddingVertical: 8 }}
                    >
                        Start Budget Plan
                    </Button>
                </Card.Content>
            </Card>

            <View style={styles.tipsContainer}>
                <Title style={styles.sectionTitle}>Why set a plan?</Title>
                <Text style={styles.tipText}>• Get real-time alerts if you're exceeding targets.</Text>
                <Text style={styles.tipText}>• Receive AI recommendations tailored to your appliances.</Text>
                <Text style={styles.tipText}>• Stay in control of your monthly electricity bill.</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827', padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
    headerCard: { backgroundColor: '#1F2937', marginBottom: 16, borderRadius: 12 },
    whiteText: { color: '#fff' },
    mutedText: { color: '#9CA3AF' },
    statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    statBox: { flex: 1, backgroundColor: '#1F2937', borderRadius: 12 },
    statLabel: { color: '#9CA3AF', fontSize: 12, marginTop: 8 },
    statValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    planCard: { backgroundColor: '#1F2937', borderRadius: 16, paddingVertical: 8 },
    divider: { backgroundColor: '#374151', marginVertical: 12 },
    inputGroup: { marginBottom: 20 },
    inputLabel: { color: '#fff', marginBottom: 8, fontWeight: '500' },
    input: { backgroundColor: '#1F2937' },
    helperText: { color: '#10B981', fontSize: 11, marginTop: 4 },
    actionButton: { marginTop: 10, backgroundColor: '#3B82F6' },
    tipsContainer: { marginTop: 24, paddingBottom: 40 },
    sectionTitle: { color: '#fff', fontSize: 18, marginBottom: 12 },
    tipText: { color: '#9CA3AF', fontSize: 14, marginBottom: 8 },
});

export default BudgetPlanner;
