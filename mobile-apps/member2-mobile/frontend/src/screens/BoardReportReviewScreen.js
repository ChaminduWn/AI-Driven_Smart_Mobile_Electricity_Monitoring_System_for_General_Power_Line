import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';
import { GradientButton } from '../components/GradientButton';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl } from '../api';
import { useTranslation } from 'react-i18next';

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

            const response = await fetch(buildApiUrl('/board-reports'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    householderId: user?.id,
                    categoryId: category.id,
                    categoryTitle: category.title,
                    issuePoints: category.points || [],
                    address,
                    district: user?.district || '',
                    locationLat: location.latitude,
                    locationLng: location.longitude,
                    issuePhotos: issuePhotos || [],
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data?.message || t('member2.boardReview.submitFailedMsg'));
            }

            Alert.alert(
                t('member2.boardReview.successTitle'),
                t('member2.boardReview.successMsg'),
                [
                    {
                        text: t('member2.boardReview.viewActivities'),
                        onPress: () => navigation.getParent()?.navigate('ActivitiesTab'),
                    },
                ]
            );
        } catch (error) {
            Alert.alert(t('member2.boardReview.submitFailedTitle'), error.message || t('member2.boardReview.submitFailedMsg'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleFinish = () => {
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
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        padding: theme.spacing.sm,
        marginRight: theme.spacing.sm,
    },
    headerTextWrap: {
        flex: 1,
    },
    headerTitle: {
        ...theme.typography.h3,
    },
    headerSubtitle: {
        ...theme.typography.caption,
        marginTop: 2,
    },
    scrollContent: {
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xxl,
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    summaryIcon: {
        width: 52,
        height: 52,
        borderRadius: theme.borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    summaryTextWrap: {
        flex: 1,
    },
    summaryLabel: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
        marginBottom: 4,
    },
    summaryValue: {
        ...theme.typography.h3,
    },
    summaryMeta: {
        ...theme.typography.bodySmall,
        marginTop: 6,
        lineHeight: 18,
    },
    infoCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    infoLabel: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
        marginBottom: 6,
    },
    infoValue: {
        ...theme.typography.body,
        fontWeight: '700',
        marginBottom: 8,
    },
    infoMeta: {
        ...theme.typography.bodySmall,
        lineHeight: 18,
    },
    noteCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: `${theme.colors.secondary}15`,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: `${theme.colors.secondary}30`,
        padding: theme.spacing.md,
        marginTop: theme.spacing.sm,
    },
    noteText: {
        ...theme.typography.bodySmall,
        flex: 1,
        marginLeft: 10,
        lineHeight: 18,
    },
    finishButton: {
        marginTop: theme.spacing.xl,
    },
});
