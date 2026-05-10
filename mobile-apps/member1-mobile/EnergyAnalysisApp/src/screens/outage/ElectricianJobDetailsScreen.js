import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme/outage';
import { Button } from '../../components/outage/Button';
import { Input } from '../../components/outage/Input';
import { useAuth } from '../../contexts/AuthContext';

export const ElectricianJobDetailsScreen = ({ route, navigation }) => {
    const { job: routeJob, currentLocation } = route.params;
    const { user } = useAuth();
    const [job, setJob] = useState(routeJob);
    const [processing, setProcessing] = useState(false);
    const [startCodeInput, setStartCodeInput] = useState('');

    const isPendingJob = job?.status === 'Searching' || job?.status === 'Pending';
    const isAcceptedJob = job?.status === 'Accepted';
    const isOngoingJob = job?.status === 'InProgress';

    const handleAccept = () => {
        Alert.alert('Accept Job?', 'Are you sure you want to accept this job?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Accept', onPress: () => {
                setProcessing(true);
                setTimeout(() => {
                    setJob({ ...job, status: 'Accepted' });
                    setProcessing(false);
                    Alert.alert('Job Accepted', 'You can now contact the householder.');
                }, 1500);
            }}
        ]);
    };

    const handleStartJob = () => {
        if (!startCodeInput) return Alert.alert('Error', 'Please enter the start code.');
        setProcessing(true);
        setTimeout(() => {
            setJob({ ...job, status: 'InProgress' });
            setProcessing(false);
            Alert.alert('Job Started', 'The job is now in progress.');
        }, 1500);
    };

    const handleComplete = () => {
        setProcessing(true);
        setTimeout(() => {
            setJob({ ...job, status: 'Completed' });
            setProcessing(false);
            Alert.alert('Job Completed', 'The job has been marked as finished.');
        }, 1500);
    };

    const handleCall = () => {
        Linking.openURL('tel:071XXXXXXX');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Job Details</Text>
                    <Text style={styles.headerSubtitle}>{job.category}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Card style={styles.heroCard}>
                    <View style={styles.heroTop}>
                        <View>
                            <Text style={styles.heroLabel}>Estimated Earnings</Text>
                            <Text style={styles.heroAmount}>LKR {job.estimatedCost?.toLocaleString()}</Text>
                        </View>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusBadgeText}>{job.status}</Text>
                        </View>
                    </View>
                </Card>

                <View style={styles.infoCard}>
                    <Text style={styles.sectionTitle}>Householder Info</Text>
                    <Text style={styles.infoValue}>Nimal Perera</Text>
                    <Text style={styles.infoMeta}>📍 2.5 km away</Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.sectionTitle}>Issue Description</Text>
                    <Text style={styles.descText}>{job.subCategory}</Text>
                    <Text style={styles.descSubText}>"Power keeps tripping in the kitchen area since the heavy rain started."</Text>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.secondaryAction} onPress={handleCall}>
                        <Ionicons name="call" size={20} color={theme.colors.success} />
                        <Text style={styles.actionLabel}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('Chat', { job })}>
                        <Ionicons name="chatbubble" size={20} color={theme.colors.primary} />
                        <Text style={[styles.actionLabel, { color: theme.colors.primary }]}>Chat</Text>
                    </TouchableOpacity>
                </View>

                {isAcceptedJob && (
                    <View style={styles.infoCard}>
                        <Text style={styles.sectionTitle}>Enter Start Code</Text>
                        <Input
                            placeholder="Code from householder"
                            value={startCodeInput}
                            onChangeText={setStartCodeInput}
                            keyboardType="number-pad"
                        />
                        <Button title="Start Job" onPress={handleStartJob} loading={processing} style={{ marginTop: 12 }} />
                    </View>
                )}

                {isPendingJob && (
                    <Button title="Accept This Job" onPress={handleAccept} loading={processing} />
                )}

                {isOngoingJob && (
                    <Button title="Mark as Completed" onPress={handleComplete} loading={processing} />
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    backButton: { padding: 8, marginRight: 8 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    headerSubtitle: { fontSize: 12, color: theme.colors.textSecondary },
    scrollContent: { padding: 20 },
    heroCard: { backgroundColor: `${theme.colors.primary}12`, marginBottom: 20 },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heroLabel: { fontSize: 12, color: theme.colors.textMuted },
    heroAmount: { fontSize: 24, fontWeight: '800', color: theme.colors.success },
    statusBadge: { backgroundColor: theme.colors.primary + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusBadgeText: { fontSize: 11, fontWeight: '700', color: theme.colors.primary },
    infoCard: { backgroundColor: theme.colors.surface, padding: 20, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: theme.colors.primary },
    infoValue: { fontSize: 15, fontWeight: '700' },
    infoMeta: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },
    descText: { fontSize: 14, fontWeight: '700' },
    descSubText: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 8, fontStyle: 'italic' },
    actionRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    secondaryAction: { flex: 1, height: 60, backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
    actionLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.success, marginTop: 4 },
});

export default ElectricianJobDetailsScreen;
