import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme/outage';
import { GradientButton } from '../../components/outage/GradientButton';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../utils/outage/i18nShim';

// Mock buildApiUrl if needed
const buildApiUrl = (path) => `http://YOUR_SERVER_IP:8000/api${path}`;

export const BoardReportReviewScreen = ({ route, navigation }) => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { category, location, address, issuePhotos } = route.params;
    const [submitting, setSubmitting] = useState(false);

    const summaryLine = useMemo(() => {
        if (!category?.points?.length) {
            return t('member2.boardReview.selectedIssueFallback');
        }
        return category.points.slice(0, 2).join(' • ');
    }, [category]);

    const submitReport = async () => {
        try {
            setSubmitting(true);
            // This would normally call the backend
            // For now, we simulate success
            setTimeout(() => {
                if (Platform.OS === 'web') {
                    window.alert(`${t('member2.boardReview.successTitle')}\n\n${t('member2.boardReview.successMsg')}`);
                    navigation.navigate('DashboardHome');
                } else {
                    Alert.alert(
                        t('member2.boardReview.successTitle'),
                        t('member2.boardReview.successMsg'),
                        [
                            {
                                text: t('member2.boardReview.viewActivities'),
                                onPress: () => navigation.navigate('DashboardHome'),
                            },
                        ]
                    );
                }
                setSubmitting(false);
            }, 1500);
        } catch (error) {
            if (Platform.OS === 'web') {
                window.alert(`${t('member2.boardReview.submitFailedTitle')}\n\n${error.message || t('member2.boardReview.submitFailedMsg')}`);
            } else {
                Alert.alert(t('member2.boardReview.submitFailedTitle'), error.message || t('member2.boardReview.submitFailedMsg'));
            }
            setSubmitting(false);
        }
    };

    const handleFinish = () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`${t('member2.boardReview.confirmTitle')}\n\n${t('member2.boardReview.confirmMsg')}`);
            if (confirmed) {
                submitReport();
            }
        } else {
            Alert.alert(
                t('member2.boardReview.confirmTitle'),
                t('member2.boardReview.confirmMsg'),
                [
                    { text: t('member2.common.cancel'), style: 'cancel' },
                    {
                        text: t('member2.boardReview.submit'),
                        onPress: submitReport,
                    },
                ]
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.headerTitle}>{t('member2.boardReview.reviewTitle')}</Text>
                    <Text style={styles.headerSubtitle}>{t('member2.boardReview.reviewSubtitle')}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.summaryCard}>
                    <View style={[styles.summaryIcon, { backgroundColor: `${category.color}18` }]}>
                        <Ionicons name={category.icon} size={24} color={category.color} />
                    </View>
                    <View style={styles.summaryTextWrap}>
                        <Text style={styles.summaryLabel}>{t('member2.boardReview.reportedIssue')}</Text>
                        <Text style={styles.summaryValue}>{category.title}</Text>
                        <Text style={styles.summaryMeta}>{summaryLine}</Text>
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>{t('member2.boardReview.issueLocation')}</Text>
                    <Text style={styles.infoValue}>{address || t('member2.boardReview.selectedOnMap')}</Text>
                    <Text style={styles.infoMeta}>
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>{t('member2.boardReview.attachedPhotos')}</Text>
                    <Text style={styles.infoValue}>{t('member2.boardReview.photosCount', { count: issuePhotos?.length || 0 })}</Text>
                    <Text style={styles.infoMeta}>{t('member2.boardReview.photosHint')}</Text>
                </View>

                <View style={styles.noteCard}>
                    <Ionicons name="information-circle" size={20} color={theme.colors.secondary} />
                    <Text style={styles.noteText}>
                        {t('member2.boardReview.note')}
                    </Text>
                </View>

                <GradientButton
                    title={t('member2.boardReview.confirmButton')}
                    icon="checkmark-circle"
                    onPress={handleFinish}
                    loading={submitting}
                    style={styles.finishButton}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    },
    backButton: { padding: 8, marginRight: 8 },
    headerTextWrap: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
    headerSubtitle: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
    scrollContent: { padding: 24, paddingBottom: 48 },
    summaryCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 24, borderWidth: 1, borderColor: theme.colors.border,
        padding: 16, marginBottom: 16,
    },
    summaryIcon: { width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    summaryTextWrap: { flex: 1 },
    summaryLabel: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 },
    summaryValue: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
    summaryMeta: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 6, lineHeight: 18 },
    infoCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 24, borderWidth: 1, borderColor: theme.colors.border,
        padding: 24, marginBottom: 16,
    },
    infoLabel: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 6 },
    infoValue: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
    infoMeta: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 18 },
    noteCard: {
        flexDirection: 'row', alignItems: 'flex-start',
        backgroundColor: `${theme.colors.secondary}15`,
        borderRadius: 24, borderWidth: 1, borderColor: `${theme.colors.secondary}30`,
        padding: 16, marginTop: 8,
    },
    noteText: { fontSize: 13, color: theme.colors.text, flex: 1, marginLeft: 10, lineHeight: 18 },
    finishButton: { marginTop: 24 },
});

export default BoardReportReviewScreen;
