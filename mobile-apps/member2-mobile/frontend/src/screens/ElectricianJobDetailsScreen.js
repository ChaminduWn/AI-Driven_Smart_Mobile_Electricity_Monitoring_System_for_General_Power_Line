import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { buildApiUrl, buildAssetUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import { MapView, Marker, PROVIDER_GOOGLE } from '../components/MapWrapper.native';
import { liveGoogleMapEnabled } from '../config/maps';

const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
        return 'Price pending';
    }

    return `LKR ${Number(amount).toLocaleString()}`;
};

export const ElectricianJobDetailsScreen = ({ route, navigation }) => {
    const { job: routeJob, currentLocation } = route.params;
    const { user, updateUser, refreshUser } = useAuth();
    const [job, setJob] = useState(routeJob);
    const [processing, setProcessing] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [startCodeInput, setStartCodeInput] = useState('');

    const isPendingJob = job?.status === 'Pending';
    const isAcceptedJob = job?.status === 'Accepted';
    const isOngoingJob = job?.status === 'InProgress';
    const isWaitingForPayment = job?.status === 'PaymentPending';
    const isWaitingForTechnicianConfirmation = job?.status === 'AwaitingTechnicianConfirmation';
    const isCompletedJob = job?.status === 'Completed';
    const isPastJob = ['Completed', 'Cancelled'].includes(job?.status);

    const householderName = useMemo(
        () => job?.householder?.fullName || 'Householder',
        [job?.householder?.fullName]
    );

    const issueCoordinate = useMemo(
        () => ({
            latitude: job?.locationLat || 6.9271,
            longitude: job?.locationLng || 79.8612,
        }),
        [job?.locationLat, job?.locationLng]
    );

    const syncUser = async () => {
        const refreshed = await refreshUser(user?.id, { silent: true });
        if (refreshed.success && refreshed.user) {
            updateUser(refreshed.user);
        }
    };

    const handleAccept = () => {
        Alert.alert(
            'Accept this job?',
            `You are about to take this job for ${formatCurrency(job?.estimatedCost)}. The householder will immediately see your details and contact options.`,
            [
                { text: 'Not now', style: 'cancel' },
                {
                    text: 'Accept Job',
                    onPress: async () => {
                        try {
                            setProcessing(true);
                            const response = await fetch(buildApiUrl(`/jobs/${job.id}/accept`), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    electricianId: user?.id,
                                    latitude: currentLocation?.latitude,
                                    longitude: currentLocation?.longitude,
                                }),
                            });

                            const data = await response.json();
                            if (!response.ok || !data.success) {
                                throw new Error(data?.message || 'Could not accept this job');
                            }

                            setJob(data.job);
                            await syncUser();
                            Alert.alert(
                                'Job accepted',
                                'This request has been moved into your ongoing jobs history. You can now call or chat with the householder.'
                            );
                        } catch (error) {
                            Alert.alert('Accept failed', error.message || 'Could not accept this job right now.');
                        } finally {
                            setProcessing(false);
                        }
                    },
                },
            ]
        );
    };

    const handleStartJob = () => {
        Alert.alert(
            'Start this job?',
            'Ask the householder for the start code and enter it to begin the job.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Start Job',
                    onPress: async () => {
                        try {
                            if (!startCodeInput.trim()) {
                                Alert.alert('Start code required', 'Enter the start code shared by the householder.');
                                return;
                            }

                            setProcessing(true);
                            const response = await fetch(buildApiUrl(`/jobs/${job.id}/status`), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    actorId: user?.id,
                                    status: 'InProgress',
                                    startCode: startCodeInput,
                                    latitude: currentLocation?.latitude,
                                    longitude: currentLocation?.longitude,
                                }),
                            });

                            const data = await response.json();
                            if (!response.ok || !data.success) {
                                throw new Error(data?.message || 'Could not start this job');
                            }

                            setJob(data.job);
                            await syncUser();
                            Alert.alert('Job started', 'The mobile app admin panel will now see this under ongoing issues.');
                        } catch (error) {
                            Alert.alert('Start failed', error.message || 'Could not start this job right now.');
                        } finally {
                            setProcessing(false);
                        }
                    },
                },
            ]
        );
    };

    const handleComplete = (method) => {
        Alert.alert(
            'Complete this job?',
            method === 'Digital'
                ? 'This will request digital payment from the householder before the job can move to past jobs.'
                : 'This will complete the job and move it to past jobs immediately.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            setProcessing(true);
                            const response = await fetch(buildApiUrl(`/jobs/${job.id}/status`), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    actorId: user?.id,
                                    status: 'Completed',
                                    finalCost: job?.estimatedCost,
                                    paymentMethod: method,
                                    latitude: currentLocation?.latitude,
                                    longitude: currentLocation?.longitude,
                                }),
                            });

                            const data = await response.json();
                            if (!response.ok || !data.success) {
                                throw new Error(data?.message || 'Could not update the job');
                            }

                            setJob(data.job);
                            await syncUser();
                            Alert.alert(
                                method === 'Digital' ? 'Waiting for payment' : 'Job completed',
                                method === 'Digital'
                                    ? 'The householder now has a payment option in their app. Once they pay, you can confirm the transaction here.'
                                    : 'The job has been moved to your past jobs and earnings were updated.'
                            );
                        } catch (error) {
                            Alert.alert('Update failed', error.message || 'Could not complete the job right now.');
                        } finally {
                            setProcessing(false);
                        }
                    },
                },
            ]
        );
    };

    const confirmDigitalPayment = async () => {
        try {
            setProcessing(true);
            const response = await fetch(buildApiUrl(`/jobs/${job.id}/confirm-digital-payment`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    electricianId: user?.id,
                }),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data?.message || 'Could not confirm the payment');
            }

            setJob(data.job);
            await syncUser();
            Alert.alert('Payment confirmed', 'The digital transaction was confirmed and the job moved to past jobs.');
        } catch (error) {
            Alert.alert('Confirmation failed', error.message || 'Could not confirm the payment right now.');
        } finally {
            setProcessing(false);
        }
    };

    const handleCall = () => {
        const phone = job?.householder?.phone;
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        }
    };

    const openChat = () => {
        navigation.navigate('Chat', {
            job,
            otherPartyName: householderName,
        });
    };

    const openExternalMap = () => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${issueCoordinate.latitude},${issueCoordinate.longitude}`);
    };

    const statusColor =
        job?.status === 'Completed'
            ? theme.colors.success
            : job?.status === 'Cancelled'
                ? theme.colors.danger
                : job?.status === 'PaymentPending' || job?.status === 'AwaitingTechnicianConfirmation'
                    ? theme.colors.secondary
                    : theme.colors.warning;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.headerTitle}>Job Details</Text>
                    <Text style={styles.headerSubtitle}>{job.category} · {job.subCategory}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.heroCard}>
                    <View style={styles.heroTop}>
                        <View>
                            <Text style={styles.heroLabel}>Service charge</Text>
                            <Text style={styles.heroAmount}>{formatCurrency(job.estimatedCost || job.finalCost)}</Text>
                        </View>
                        <View style={[styles.heroBadge, { backgroundColor: `${statusColor}15` }]}>
                            <Text style={[styles.heroBadgeText, { color: statusColor }]}>{job.status}</Text>
                        </View>
                    </View>
                    <Text style={styles.heroEta}>
                        {job.etaMinutes ? `${job.etaMinutes} minutes to reach` : 'ETA updating'}
                    </Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.sectionTitle}>Householder</Text>
                    <Text style={styles.infoValue}>{householderName}</Text>
                    <Text style={styles.infoMeta}>{job.householder?.phone || 'Phone unavailable'}</Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.sectionTitle}>Issue Details</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Category</Text>
                        <Text style={styles.infoValueSmall}>{job.category}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Subcategory</Text>
                        <Text style={styles.infoValueSmall}>{job.subCategory}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Address</Text>
                        <Text style={styles.infoValueCompact}>{job.issueAddress || job.householder?.address || 'Location shared on map'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Distance</Text>
                        <Text style={styles.infoValueSmall}>{job.distanceKm ? `${job.distanceKm} km` : 'Calculating'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Travel time</Text>
                        <Text style={styles.infoValueSmall}>{job.etaMinutes ? `${job.etaMinutes} min` : 'Updating'}</Text>
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>{job.description}</Text>
                </View>

                {job.issuePhotos?.length ? (
                    <View style={styles.infoCard}>
                        <Text style={styles.sectionTitle}>Uploaded Photos</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {job.issuePhotos.map((photo, index) => (
                                <Image
                                    key={`${photo}-${index}`}
                                    source={{ uri: buildAssetUrl(photo) }}
                                    style={styles.photoThumb}
                                />
                            ))}
                        </ScrollView>
                    </View>
                ) : null}

                <View style={styles.contactRow}>
                    <TouchableOpacity style={styles.secondaryAction} onPress={handleCall}>
                        <Ionicons name="call" size={18} color={theme.colors.success} />
                        <Text style={styles.secondaryActionText}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryAction} onPress={openChat}>
                        <Ionicons name="chatbubble-ellipses" size={18} color={theme.colors.primary} />
                        <Text style={[styles.secondaryActionText, { color: theme.colors.primary }]}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryAction} onPress={() => setShowMap((current) => !current)}>
                        <Ionicons name="map" size={18} color={theme.colors.secondary} />
                        <Text style={[styles.secondaryActionText, { color: theme.colors.secondary }]}>View on Map</Text>
                    </TouchableOpacity>
                </View>

                {showMap ? (
                    <View style={styles.infoCard}>
                        <Text style={styles.sectionTitle}>Householder Location</Text>
                        {liveGoogleMapEnabled ? (
                            <MapView
                                provider={PROVIDER_GOOGLE}
                                style={styles.inlineMap}
                                initialRegion={{
                                    latitude: issueCoordinate.latitude,
                                    longitude: issueCoordinate.longitude,
                                    latitudeDelta: 0.015,
                                    longitudeDelta: 0.015,
                                }}
                            >
                                <Marker coordinate={issueCoordinate} title="Issue location" />
                            </MapView>
                        ) : (
                            <View style={styles.mapFallback}>
                                <Ionicons name="map-outline" size={28} color={theme.colors.warning} />
                                <Text style={styles.mapFallbackText}>
                                    Google Maps key is not configured in this build. You can still open the location in Google Maps.
                                </Text>
                            </View>
                        )}
                        <Button title="Open in Google Maps" variant="outline" onPress={openExternalMap} style={{ marginTop: theme.spacing.md }} />
                    </View>
                ) : null}

                {isAcceptedJob ? (
                    <View style={styles.infoCard}>
                        <Text style={styles.sectionTitle}>Start Job With Householder Code</Text>
                        <Text style={styles.helperText}>
                            Ask the householder for the start code shown in their app, then enter it here to start the job.
                        </Text>
                        <Input
                            label="Start code"
                            value={startCodeInput}
                            onChangeText={setStartCodeInput}
                            keyboardType="number-pad"
                            placeholder="Enter code from householder"
                        />
                    </View>
                ) : null}

                {isWaitingForPayment ? (
                    <View style={styles.noticeBanner}>
                        <Ionicons name="card-outline" size={18} color={theme.colors.secondary} />
                        <Text style={styles.noticeText}>
                            Waiting for the householder to complete the digital payment in their app.
                        </Text>
                    </View>
                ) : null}

                {isWaitingForTechnicianConfirmation ? (
                    <View style={styles.noticeBanner}>
                        <Ionicons name="cash-outline" size={18} color={theme.colors.success} />
                        <Text style={styles.noticeText}>
                            Received digital payment {formatCurrency(job.digitalPaymentAmount || job.finalCost)}. Reference: {job.digitalPaymentReference || 'Pending'}
                        </Text>
                    </View>
                ) : null}

                {(job.paymentMethod || job.digitalPaymentStatus) ? (
                    <View style={styles.infoCard}>
                        <Text style={styles.sectionTitle}>Payment Details</Text>
                        {job.paymentMethod ? (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Method</Text>
                                <Text style={styles.infoValueSmall}>{job.paymentMethod}</Text>
                            </View>
                        ) : null}
                        {job.digitalPaymentStatus ? (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Digital status</Text>
                                <Text style={styles.infoValueSmall}>{job.digitalPaymentStatus}</Text>
                            </View>
                        ) : null}
                        {job.digitalPaymentReference ? (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Reference</Text>
                                <Text style={styles.infoValueSmall}>{job.digitalPaymentReference}</Text>
                            </View>
                        ) : null}
                    </View>
                ) : null}

                {isCompletedJob && job.householderRating ? (
                    <View style={styles.infoCard}>
                        <Text style={styles.sectionTitle}>Householder Rating</Text>
                        <View style={styles.ratingRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Ionicons
                                    key={star}
                                    name={star <= Number(job.householderRating) ? 'star' : 'star-outline'}
                                    size={16}
                                    color={theme.colors.warning}
                                />
                            ))}
                            <Text style={styles.ratingLabel}>{job.householderRating}</Text>
                        </View>
                        {job.householderFeedback ? (
                            <Text style={styles.feedbackText}>{job.householderFeedback}</Text>
                        ) : null}
                    </View>
                ) : null}

                {isPendingJob ? (
                    <Button title="Accept This Job" variant="primary" onPress={handleAccept} loading={processing} style={styles.primaryButton} />
                ) : null}

                {isAcceptedJob ? (
                    <Button title="Enter Code and Start Job" variant="primary" onPress={handleStartJob} loading={processing} style={styles.primaryButton} />
                ) : null}

                {isOngoingJob ? (
                    <>
                        <Button title="Complete Job - Cash" variant="outline" onPress={() => handleComplete('Cash')} style={styles.secondaryButton} />
                        <Button title="Complete Job - Digital" variant="primary" onPress={() => handleComplete('Digital')} loading={processing} style={styles.primaryButton} />
                    </>
                ) : null}

                {isWaitingForTechnicianConfirmation ? (
                    <Button title="Confirm Received Transaction" variant="primary" onPress={confirmDigitalPayment} loading={processing} style={styles.primaryButton} />
                ) : null}

                {isPastJob ? (
                    <Button title="Back to History" variant="outline" onPress={() => navigation.goBack()} style={styles.secondaryButton} />
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: { padding: theme.spacing.sm, marginRight: theme.spacing.sm },
    headerTextWrap: { flex: 1 },
    headerTitle: { ...theme.typography.h3 },
    headerSubtitle: { ...theme.typography.caption, marginTop: 2 },
    scrollContent: { padding: theme.spacing.lg, paddingBottom: 40 },
    heroCard: {
        backgroundColor: `${theme.colors.primary}12`,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: `${theme.colors.primary}24`,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heroLabel: { ...theme.typography.caption, color: theme.colors.textMuted, marginBottom: 6 },
    heroAmount: { ...theme.typography.h2, color: theme.colors.success },
    heroBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.borderRadius.full },
    heroBadgeText: { fontWeight: '700', fontSize: 12 },
    heroEta: { ...theme.typography.bodySmall, marginTop: 10 },
    infoCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    sectionTitle: { ...theme.typography.h3, marginBottom: theme.spacing.md },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    infoLabel: { ...theme.typography.bodySmall },
    infoValue: { ...theme.typography.body, fontWeight: '700' },
    infoValueSmall: { ...theme.typography.body, fontWeight: '600' },
    infoValueCompact: {
        ...theme.typography.bodySmall,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
        marginLeft: theme.spacing.md,
        lineHeight: 18,
    },
    infoMeta: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: 4 },
    descriptionText: { ...theme.typography.body, lineHeight: 22 },
    photoThumb: { width: 120, height: 120, borderRadius: theme.borderRadius.lg, marginRight: theme.spacing.sm },
    contactRow: { flexDirection: 'row', gap: 12, marginBottom: theme.spacing.md },
    secondaryAction: {
        flex: 1,
        minHeight: 52,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryActionText: { fontWeight: '700', marginTop: 4, fontSize: 12, color: theme.colors.success },
    inlineMap: { width: '100%', height: 220, borderRadius: theme.borderRadius.lg },
    mapFallback: { alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xl },
    mapFallbackText: { ...theme.typography.bodySmall, textAlign: 'center', marginTop: 8, lineHeight: 18 },
    helperText: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginBottom: theme.spacing.md, lineHeight: 18 },
    noticeBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: `${theme.colors.secondary}12`,
        borderWidth: 1,
        borderColor: `${theme.colors.secondary}26`,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    noticeText: { ...theme.typography.bodySmall, flex: 1, marginLeft: 8, lineHeight: 18 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 4 },
    ratingLabel: { color: theme.colors.warning, fontWeight: '700', marginLeft: 6 },
    feedbackText: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, lineHeight: 18 },
    primaryButton: { marginTop: theme.spacing.sm },
    secondaryButton: { marginTop: theme.spacing.sm },
});
