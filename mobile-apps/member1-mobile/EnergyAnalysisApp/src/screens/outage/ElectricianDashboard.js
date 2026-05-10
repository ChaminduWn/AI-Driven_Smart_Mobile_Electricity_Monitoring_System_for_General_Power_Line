import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme/outage';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/outage/Card';
import { Button } from '../../components/outage/Button';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../../utils/outage/i18nShim';
import { VoiceCommandButton } from '../../components/outage/VoiceCommandButton';
import { ELECTRICIAN_HOME_INTENTS } from '../../voice/outage/intentMappings';

export const ElectricianDashboard = ({ navigation }) => {
    const { user, refreshUser } = useAuth();
    const { t } = useTranslation();
    const [isAvailable, setIsAvailable] = useState(true);
    const [pendingJobs, setPendingJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(false);

    useEffect(() => {
        // Simulate loading jobs
        setLoadingJobs(true);
        setTimeout(() => {
            setPendingJobs([
                { id: '1', category: 'Power Issue', subCategory: 'Partial Blackout', estimatedCost: 3500, distanceKm: 2.5, etaMinutes: 15 }
            ]);
            setLoadingJobs(false);
        }, 1500);
    }, [isAvailable]);

    const handleVoiceIntent = async ({ intent }) => {
        if (intent === 'open_service_setup') {
            // navigation.navigate('ElectricianServiceSetup');
            return true;
        }
        return false;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <View>
                    <Text style={styles.userName}>Hello, {user?.full_name || 'Electrician'}</Text>
                    <Text style={styles.userInfo}>📍 {user?.district || 'Not Set'}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileBtn}>
                    <Ionicons name="person-circle" size={40} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Card style={styles.statusCard} glowColor={isAvailable ? theme.colors.success : theme.colors.textMuted}>
                    <View style={styles.statusRow}>
                        <View style={styles.statusInfo}>
                            <View style={[styles.statusDot, { backgroundColor: isAvailable ? theme.colors.success : theme.colors.textMuted }]} />
                            <Text style={styles.statusText}>{isAvailable ? 'Available for Work' : 'Unavailable'}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.toggleButton, isAvailable && styles.toggleActive]}
                            onPress={() => setIsAvailable(!isAvailable)}
                        >
                            <View style={[styles.toggleThumb, isAvailable && styles.toggleThumbActive]} />
                        </TouchableOpacity>
                    </View>
                </Card>

                <View style={styles.statsRow}>
                    <Card style={styles.statCard}>
                        <Ionicons name="star" size={20} color={theme.colors.warning} />
                        <Text style={styles.statVal}>4.9</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Ionicons name="flash" size={20} color={theme.colors.success} />
                        <Text style={styles.statVal}>{pendingJobs.length}</Text>
                        <Text style={styles.statLabel}>New Jobs</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Ionicons name="checkmark-done-circle" size={20} color={theme.colors.secondary} />
                        <Text style={styles.statVal}>24</Text>
                        <Text style={styles.statLabel}>Done</Text>
                    </Card>
                </View>

                <Text style={styles.sectionTitle}>Nearby Requests</Text>
                {loadingJobs ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                ) : pendingJobs.length > 0 ? (
                    pendingJobs.map(job => (
                        <Card key={job.id} style={styles.jobCard}>
                            <View style={styles.jobHeader}>
                                <View>
                                    <Text style={styles.jobType}>{job.category}</Text>
                                    <Text style={styles.jobSub}>{job.subCategory}</Text>
                                </View>
                                <Text style={styles.jobAmount}>LKR {job.estimatedCost}</Text>
                            </View>
                            <View style={styles.jobFooter}>
                                <Text style={styles.jobDetailText}>📍 {job.distanceKm} km away</Text>
                                <Text style={styles.jobDetailText}>⏱️ {job.etaMinutes} min</Text>
                            </View>
                            <Button title="View Details" onPress={() => navigation.navigate('ElectricianJobDetails', { job })} style={{ marginTop: 12 }} />
                        </Card>
                    ))
                ) : (
                    <Card style={styles.emptyCard}>
                        <Text style={styles.emptyText}>No nearby jobs at the moment.</Text>
                    </Card>
                )}
            </ScrollView>
            <VoiceCommandButton allowedIntents={ELECTRICIAN_HOME_INTENTS} onIntentMatched={handleVoiceIntent} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    userName: { fontSize: 20, fontWeight: '800' },
    userInfo: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },
    profileBtn: { padding: 4 },
    scrollContent: { padding: 20, paddingBottom: 100 },
    statusCard: { marginBottom: 20 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusInfo: { flexDirection: 'row', alignItems: 'center' },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    statusText: { fontSize: 15, fontWeight: '700' },
    toggleButton: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#DDD', padding: 3 },
    toggleActive: { backgroundColor: theme.colors.success },
    toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF' },
    toggleThumbActive: { alignSelf: 'flex-end' },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statCard: { flex: 1, alignItems: 'center' },
    statVal: { fontSize: 18, fontWeight: '800', marginTop: 4 },
    statLabel: { fontSize: 11, color: theme.colors.textMuted },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    jobCard: { marginBottom: 12 },
    jobHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    jobType: { fontSize: 15, fontWeight: '700' },
    jobSub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
    jobAmount: { fontSize: 15, fontWeight: '800', color: theme.colors.success },
    jobFooter: { flexDirection: 'row', gap: 16, marginTop: 8 },
    jobDetailText: { fontSize: 12, color: theme.colors.textMuted },
    emptyCard: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { color: theme.colors.textMuted },
});

export default ElectricianDashboard;
