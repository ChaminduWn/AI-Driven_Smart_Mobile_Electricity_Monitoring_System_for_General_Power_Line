import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Card } from '../components/Card';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { buildAssetUrl } from '../api';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export const ActivityDetailScreen = ({ route, navigation }) => {
    const { activity } = route.params;
    const { t } = useTranslation();
    const { user } = useAuth();
    const isBoardReport = activity.activityKind === 'boardReport';

    const statusColor =
        activity.status === 'Completed' || activity.status === 'Done'
            ? theme.colors.success
            : activity.status === 'Ongoing' || activity.status === 'WorkingOnIt'
                ? theme.colors.warning
                : activity.status === 'Cancelled'
                    ? theme.colors.danger
                    : theme.colors.primary;

    const detailTitle = isBoardReport ? activity.categoryTitle : activity.category || activity.title;
    const detailSubtitle = isBoardReport ? 'Electricity Board Issue' : activity.subCategory || t('activities.generalService');
    const canMakeDigitalPayment =
        !isBoardReport &&
        user?.role === 'Householder' &&
        activity.status === 'PaymentPending' &&
        activity.paymentMethod === 'Digital';

    const timelineItems = isBoardReport
        ? [
            { label: 'Issue reported', time: new Date(activity.createdAt).toLocaleString(), icon: 'create' },
            activity.statusUpdatedAt ? { label: activity.statusMessage || 'Status updated', time: new Date(activity.statusUpdatedAt).toLocaleString(), icon: 'build' } : null,
            activity.resolvedAt ? { label: 'Marked as done', time: new Date(activity.resolvedAt).toLocaleString(), icon: 'checkmark-done' } : null,
        ].filter(Boolean)
        : [
            { label: t('activityDetail.timelineSteps.requestCreated'), time: new Date(activity.createdAt).toLocaleString(), icon: 'create' },
            { label: 'Latest status', time: activity.status, icon: 'time' },
            activity.cancelledAt ? { label: 'Cancelled', time: new Date(activity.cancelledAt).toLocaleString(), icon: 'close-circle' } : null,
        ].filter(Boolean);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('activityDetail.title')}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>{t('activityDetail.issueInfo')}</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>{t('activityDetail.category')}</Text>
                        <Text style={styles.value}>{detailTitle}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>{t('activityDetail.subType')}</Text>
                        <Text style={styles.value}>{detailSubtitle}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>{t('activityDetail.status')}</Text>
                        <Text style={[styles.value, { color: statusColor }]}>{activity.status}</Text>
                    </View>
                    {activity.statusMessage ? (
                        <View style={styles.statusMessageBox}>
                            <Ionicons name="information-circle" size={18} color={statusColor} />
                            <Text style={styles.statusMessageText}>{activity.statusMessage}</Text>
                        </View>
                    ) : null}
                </Card>

                {isBoardReport ? (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>Location Details</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Address</Text>
                            <Text style={styles.valueCompact}>{activity.address}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Coordinates</Text>
                            <Text style={styles.value}>{Number(activity.locationLat).toFixed(6)}, {Number(activity.locationLng).toFixed(6)}</Text>
                        </View>
                        {activity.issuePoints?.length ? (
                            <View style={styles.pointsBlock}>
                                <Text style={styles.subSectionTitle}>Category details</Text>
                                {activity.issuePoints.map((point) => (
                                    <View key={point} style={styles.pointRow}>
                                        <Ionicons name="ellipse" size={8} color={theme.colors.warning} />
                                        <Text style={styles.pointText}>{point}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : null}
                    </Card>
                ) : (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>{t('activityDetail.electrician')}</Text>
                        <View style={styles.electricianRow}>
                            <View style={styles.avatar}>
                                <Ionicons name="person" size={22} color={theme.colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.electricianName}>{activity.electrician?.fullName || activity.electricianId || 'Assigned electrician'}</Text>
                                {activity.electrician?.phone ? (
                                    <Text style={styles.electricianMeta}>{activity.electrician.phone}</Text>
                                ) : null}
                                {activity.electrician?.rating ? (
                                    <View style={styles.stars}>
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Ionicons key={s} name={s <= activity.electrician.rating ? 'star' : 'star-outline'} size={14} color={theme.colors.warning} />
                                        ))}
                                        <Text style={styles.ratingVal}>{activity.electrician.rating}</Text>
                                    </View>
                                ) : null}
                            </View>
                        </View>
                        {activity.electrician?.acceptedCertificates?.length ? (
                            <View style={styles.certificateSection}>
                                <Text style={styles.subSectionLabel}>{t('member2.track.verifiedQualifications')}</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {activity.electrician.acceptedCertificates.map((certificate) => (
                                        <View key={certificate.id} style={styles.certificateWrap}>
                                            <Image source={{ uri: buildAssetUrl(certificate.imageUrl) }} style={styles.certificateThumb} />
                                            <Text style={styles.certificateTitle} numberOfLines={1}>{certificate.title}</Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        ) : null}
                        {activity.startCode && ['Accepted', 'InProgress', 'PaymentPending', 'AwaitingTechnicianConfirmation'].includes(activity.status) ? (
                            <View style={styles.startCodeBox}>
                                <Text style={styles.startCodeLabel}>{t('member2.track.shareCode')}</Text>
                                <Text style={styles.startCodeValue}>{activity.startCode}</Text>
                            </View>
                        ) : null}
                    </Card>
                )}

                {!isBoardReport ? (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>{t('activityDetail.payment')}</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>{t('activityDetail.amount')}</Text>
                            <Text style={[styles.value, { color: theme.colors.success, fontWeight: '700' }]}>
                                {activity.finalCost || activity.estimatedCost ? `LKR ${activity.finalCost || activity.estimatedCost}` : t('member2.dashboard.pendingPrice')}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>{t('activityDetail.date')}</Text>
                            <Text style={styles.value}>{new Date(activity.createdAt).toLocaleString()}</Text>
                        </View>
                        {activity.digitalPaymentReference ? (
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Payment reference</Text>
                                <Text style={styles.value}>{activity.digitalPaymentReference}</Text>
                            </View>
                        ) : null}
                    </Card>
                ) : null}

                {canMakeDigitalPayment ? (
                    <Button
                        title={t('member2.track.makePayment')}
                        icon="card"
                        onPress={() => navigation.navigate('PaymentGateway', { job: activity })}
                        style={{ marginBottom: theme.spacing.md }}
                    />
                ) : null}

                {activity.issuePhotos?.length ? (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>Attached Photos</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {activity.issuePhotos.map((photo, index) => (
                                <Image
                                    key={`${photo}-${index}`}
                                    source={{ uri: buildAssetUrl(photo) }}
                                    style={styles.photoThumb}
                                />
                            ))}
                        </ScrollView>
                    </Card>
                ) : null}

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>{t('activityDetail.timeline')}</Text>
                    {timelineItems.map((step, index) => (
                        <View key={`${step.label}-${index}`} style={styles.timelineStep}>
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
    valueCompact: { ...theme.typography.body, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: theme.spacing.md },
    electricianRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 44, height: 44, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    electricianName: { ...theme.typography.body, fontWeight: '700' },
    electricianMeta: { ...theme.typography.caption, marginTop: 4 },
    stars: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    ratingVal: { color: theme.colors.warning, fontSize: 13, fontWeight: '700', marginLeft: 4 },
    certificateSection: { marginTop: theme.spacing.md },
    subSectionLabel: { ...theme.typography.bodySmall, fontWeight: '700', marginBottom: theme.spacing.sm },
    certificateWrap: { width: 90, marginRight: theme.spacing.sm },
    certificateThumb: { width: 90, height: 90, borderRadius: theme.borderRadius.md, marginBottom: 6 },
    certificateTitle: { ...theme.typography.caption, textAlign: 'center' },
    startCodeBox: {
        marginTop: theme.spacing.md,
        backgroundColor: `${theme.colors.secondary}14`,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: `${theme.colors.secondary}30`,
        padding: theme.spacing.md,
    },
    startCodeLabel: { ...theme.typography.bodySmall, color: theme.colors.secondary, marginBottom: 8 },
    startCodeValue: { ...theme.typography.h2, color: theme.colors.secondary, letterSpacing: 2 },
    statusMessageBox: { flexDirection: 'row', alignItems: 'flex-start', marginTop: theme.spacing.md, backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.md, padding: theme.spacing.md },
    statusMessageText: { ...theme.typography.bodySmall, marginLeft: 8, flex: 1, lineHeight: 18 },
    pointsBlock: { marginTop: theme.spacing.md },
    subSectionTitle: { ...theme.typography.body, fontWeight: '700', marginBottom: theme.spacing.sm },
    pointRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    pointText: { ...theme.typography.bodySmall, flex: 1, marginLeft: 8, lineHeight: 18 },
    photoThumb: { width: 120, height: 120, borderRadius: theme.borderRadius.lg, marginRight: theme.spacing.sm },
    timelineStep: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    timelineDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    timelineInfo: { flex: 1 },
    timelineLabel: { ...theme.typography.body, fontSize: 14 },
    timelineTime: { ...theme.typography.caption, marginTop: 2 },
});
