import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { LanguageToggle } from '../components/LanguageToggle';
import Ionicons from 'react-native-vector-icons/Ionicons';

export const ElectricianDashboard = ({ navigation }) => {
    const { user } = useAuth();
    const [language, setLanguage] = useState('EN');
    const [isAvailable, setIsAvailable] = useState(true);

    const pendingJobs = [
        { id: '1', type: 'Power Supply Issues', sub: 'Complete Power Outage', loc: 'Colombo 7', dist: '2.5 km', amount: 'LKR 2,000', time: '5 min ago' },
        { id: '2', type: 'Safety-Related', sub: 'Sparks from Meter', loc: 'Colombo 3', dist: '1.2 km', amount: 'LKR 1,500', time: '12 min ago' },
        { id: '3', type: 'Voltage & Technical', sub: 'Low Voltage', loc: 'Colombo 5', dist: '3.8 km', amount: 'LKR 1,800', time: '20 min ago' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.userName}>Hello, {user?.firstName || 'Electrician'}</Text>
                    <Text style={styles.userInfo}>📍 {user?.district || 'Location'}</Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={styles.idBadge}>
                        <Text style={styles.idText}>00E#{user?.displayId || '1'}</Text>
                    </View>
                    <LanguageToggle language={language} onToggle={setLanguage} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Availability Toggle */}
                <Card style={styles.statusCard} glowColor={isAvailable ? theme.colors.success : theme.colors.textMuted}>
                    <View style={styles.statusRow}>
                        <View style={styles.statusInfo}>
                            <View style={[styles.statusDot, { backgroundColor: isAvailable ? theme.colors.success : theme.colors.textMuted }]} />
                            <Text style={styles.statusText}>
                                {isAvailable ? 'Available for Jobs' : 'Unavailable'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.toggleButton, isAvailable && styles.toggleActive]}
                            onPress={() => setIsAvailable(!isAvailable)}
                        >
                            <View style={[styles.toggleThumb, isAvailable && styles.toggleThumbActive]} />
                        </TouchableOpacity>
                    </View>
                </Card>

                {/* Verification Lock Screen */}
                {!user?.isVerified ? (
                    <View style={styles.verificationContainer}>
                        <View style={styles.verificationIcon}>
                            <Ionicons name="time-outline" size={48} color={theme.colors.warning} />
                        </View>
                        <Text style={styles.verificationTitle}>Account Pending Verification</Text>
                        <Text style={styles.verificationDesc}>
                            Your NVQ Certificate or NIC is currently being reviewed by an admin. You will be able to see and accept jobs once your account is verified.
                        </Text>
                        <Button
                            title="Refresh Status"
                            variant="outline"
                            onPress={() => Alert.alert('Status', 'Still under review. Check back later.')}
                            style={{ marginTop: theme.spacing.md }}
                        />
                    </View>
                ) : (
                    <>
                        {/* Quick Stats */}
                        <View style={styles.statsRow}>
                            <Card style={styles.statCard}>
                                <Ionicons name="star" size={20} color={theme.colors.warning} />
                                <Text style={styles.statVal}>4.8</Text>
                                <Text style={styles.statLabel}>Rating</Text>
                            </Card>
                            <Card style={styles.statCard}>
                                <Ionicons name="checkmark-done" size={20} color={theme.colors.success} />
                                <Text style={styles.statVal}>12</Text>
                                <Text style={styles.statLabel}>Jobs</Text>
                            </Card>
                            <Card style={styles.statCard}>
                                <Ionicons name="wallet" size={20} color={theme.colors.secondary} />
                                <Text style={styles.statVal}>8.5k</Text>
                                <Text style={styles.statLabel}>Earned</Text>
                            </Card>
                        </View>

                        {/* Service Setup */}
                        <TouchableOpacity
                            style={styles.setupButton}
                            onPress={() => navigation.navigate('ElectricianServiceSetup')}
                            activeOpacity={0.7}
                        >
                            <View style={styles.setupIconContainer}>
                                <Ionicons name="settings" size={22} color={theme.colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.setupTitle}>Service Setup</Text>
                                <Text style={styles.setupDesc}>Configure your categories & pricing</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                        </TouchableOpacity>

                        {/* Available Jobs */}
                        <Text style={styles.sectionTitle}>Available Jobs Nearby</Text>
                        {pendingJobs.map((job) => (
                            <Card key={job.id} style={styles.jobCard}>
                                <View style={styles.jobHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.jobType}>{job.type}</Text>
                                        <Text style={styles.jobSub}>{job.sub}</Text>
                                    </View>
                                    <Text style={styles.jobAmount}>{job.amount}</Text>
                                </View>
                                <View style={styles.jobFooter}>
                                    <View style={styles.jobDetail}>
                                        <Ionicons name="location-outline" size={14} color={theme.colors.textMuted} />
                                        <Text style={styles.jobDetailText}>{job.loc} ({job.dist})</Text>
                                    </View>
                                    <Text style={styles.jobTime}>{job.time}</Text>
                                </View>
                                <Button
                                    title="Accept Job"
                                    variant="primary"
                                    onPress={() => { }}
                                    style={styles.acceptBtn}
                                />
                            </Card>
                        ))}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    headerLeft: { flex: 1 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    userName: { ...theme.typography.h2 },
    userInfo: { ...theme.typography.bodySmall, marginTop: 2 },
    idBadge: { backgroundColor: theme.colors.secondary + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.sm, borderWidth: 1, borderColor: theme.colors.secondary + '40' },
    idText: { color: theme.colors.secondary, fontSize: 11, fontWeight: '700' },
    scrollContent: { padding: theme.spacing.lg, paddingBottom: 100 },
    statusCard: { marginBottom: theme.spacing.lg },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusInfo: { flexDirection: 'row', alignItems: 'center' },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    statusText: { ...theme.typography.body, fontWeight: '600' },
    toggleButton: { width: 50, height: 28, borderRadius: 14, backgroundColor: theme.colors.border, padding: 3, justifyContent: 'center' },
    toggleActive: { backgroundColor: theme.colors.success },
    toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' },
    toggleThumbActive: { alignSelf: 'flex-end' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.lg, gap: 8 },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: theme.spacing.md },
    statVal: { ...theme.typography.h2, marginTop: 4 },
    statLabel: { ...theme.typography.caption, marginTop: 2 },
    setupButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, marginBottom: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border },
    setupIconContainer: { width: 40, height: 40, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    setupTitle: { ...theme.typography.body, fontWeight: '600' },
    setupDesc: { ...theme.typography.caption, marginTop: 2 },
    sectionTitle: { ...theme.typography.h3, marginBottom: theme.spacing.md },
    jobCard: { marginBottom: theme.spacing.sm },
    jobHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    jobType: { ...theme.typography.body, fontWeight: '700' },
    jobSub: { ...theme.typography.caption, marginTop: 2 },
    jobAmount: { ...theme.typography.h3, color: theme.colors.success, fontSize: 16 },
    jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
    jobDetail: { flexDirection: 'row', alignItems: 'center' },
    jobDetailText: { ...theme.typography.caption, marginLeft: 4 },
    acceptBtn: { marginTop: 4 },
    verificationContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: theme.spacing.xl,
        marginTop: theme.spacing.xl,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    verificationIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.warning + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.lg,
    },
    verificationTitle: {
        ...theme.typography.h2,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },
    verificationDesc: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
});
