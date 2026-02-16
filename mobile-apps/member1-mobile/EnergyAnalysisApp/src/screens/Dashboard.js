import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Paragraph, ActivityIndicator, IconButton } from 'react-native-paper';
import { Zap, FileText, LogOut } from 'lucide-react-native';
import apiClient from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const accountNumber = user?.account_number || '123456789';

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <IconButton
                    icon={() => <LogOut color="#EF4444" size={20} />}
                    onPress={logout}
                />
            ),
        });
        fetchDashboardData();
    }, [navigation, logout]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/appliances/analysis/${accountNumber}`);
            if (response.data.success) {
                setData(response.data);
            }
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator animating={true} color="#3B82F6" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.headerCard}>
                <Card.Content>
                    <Title style={styles.whiteText}>Welcome Back, {user?.full_name?.split(' ')[0] || 'User'}</Title>
                    <Paragraph style={styles.mutedText}>Energy Analysis Summary</Paragraph>
                </Card.Content>
            </Card>

            <View style={styles.quickActions}>
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#3B82F6' }]}
                    onPress={() => navigation.navigate('Bills')}
                >
                    <FileText color="#3B82F6" size={20} />
                    <Text style={styles.actionText}>Upload Bill</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#8B5CF6' }]}
                    onPress={() => navigation.navigate('Appliances')}
                >
                    <Zap color="#8B5CF6" size={20} />
                    <Text style={styles.actionText}>Add Device</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.grid}>
                <Card style={[styles.statCard, { backgroundColor: '#3B82F6' }]}>
                    <Card.Content>
                        <Text style={styles.statLabel}>Total Appliances</Text>
                        <Text style={styles.statValue}>{data?.summary?.total_appliances || 0}</Text>
                    </Card.Content>
                </Card>

                <Card style={[styles.statCard, { backgroundColor: '#8B5CF6' }]}>
                    <Card.Content>
                        <Text style={styles.statLabel}>Monthly (kWh)</Text>
                        <Text style={styles.statValue}>{data?.summary?.total_monthly_kwh?.toFixed(1) || 0}</Text>
                    </Card.Content>
                </Card>
            </View>

            <Card style={styles.infoCard}>
                <Card.Content>
                    <Title>Estimated Cost</Title>
                    <Text style={styles.costValue}>Rs. {data?.summary?.estimated_monthly_cost?.toFixed(2) || '0.00'}</Text>
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827', padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
    headerCard: { backgroundColor: '#1F2937', marginBottom: 16, borderRadius: 12 },
    whiteText: { color: '#fff' },
    mutedText: { color: '#9CA3AF' },
    grid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    statCard: { flex: 1, borderRadius: 12 },
    statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
    statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    infoCard: { backgroundColor: '#1F2937', borderRadius: 12 },
    costValue: { fontSize: 32, fontWeight: 'bold', color: '#10B981', marginTop: 8 },
    quickActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    actionBtn: {
        flex: 1,
        backgroundColor: '#1F2937',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1
    },
    actionText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});

export default Dashboard;
