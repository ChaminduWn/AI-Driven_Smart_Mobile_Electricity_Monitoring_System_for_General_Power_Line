import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { buildApiUrl } from '../api';
import { useAuth } from '../context/AuthContext';

const formatCurrency = (amount) => `LKR ${Number(amount || 0).toLocaleString()}`;

export const PaymentGatewayScreen = ({ route, navigation }) => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { job } = route.params;
    const [cardHolderName, setCardHolderName] = useState(user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '');
    const [cardNumber, setCardNumber] = useState('');
    const [expiryMonth, setExpiryMonth] = useState('');
    const [expiryYear, setExpiryYear] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const openActivities = () => {
        const parentNavigator = navigation.getParent();
        if (parentNavigator) {
            parentNavigator.navigate('ActivitiesTab');
            return;
        }

        navigation.goBack();
    };

    const handlePay = async () => {
        try {
            if (!cardHolderName.trim() || !cardNumber.trim() || !expiryMonth.trim() || !expiryYear.trim()) {
                Alert.alert(t('member2.payment.detailsRequiredTitle'), t('member2.payment.detailsRequiredMsg'));
                return;
            }

            setSubmitting(true);
            const response = await fetch(buildApiUrl(`/jobs/${job.id}/pay`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    householderId: user?.id,
                    cardHolderName,
                    cardNumber,
                    expiryMonth,
                    expiryYear,
                }),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data?.message || t('member2.payment.failedMsg'));
            }

            Alert.alert(
                t('member2.payment.successTitle'),
                t('member2.payment.successMsg', {
                    amount: formatCurrency(data.job?.finalCost || data.job?.digitalPaymentAmount),
                }),
                [
                    {
                        text: t('member2.payment.openActivities'),
                        onPress: openActivities,
                    },
                ]
            );
        } catch (error) {
            if (error.message === 'This job is not waiting for digital payment.') {
                try {
                    const latestResponse = await fetch(buildApiUrl(`/jobs/${job.id}`));
                    const latestData = await latestResponse.json();

                    if (
                        latestResponse.ok &&
                        latestData.success &&
                        latestData.job &&
                        latestData.job.paymentMethod === 'Digital' &&
                        ['AwaitingTechnicianConfirmation', 'Completed'].includes(latestData.job.status)
                    ) {
                        Alert.alert(
                            t('member2.payment.alreadySubmittedTitle'),
                            t('member2.payment.alreadySubmittedMsg', {
                                amount: formatCurrency(latestData.job.finalCost || latestData.job.digitalPaymentAmount),
                            }),
                            [
                                {
                                    text: t('member2.payment.openActivities'),
                                    onPress: openActivities,
                                },
                            ]
                        );
                        return;
                    }
                } catch (refreshError) {
                    console.error('Refresh latest payment state error', refreshError);
                }
            }

            Alert.alert(t('member2.payment.failedTitle'), error.message || t('member2.payment.failedMsg'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.headerTitle}>{t('member2.payment.title')}</Text>
                    <Text style={styles.headerSubtitle}>{t('member2.payment.subtitle')}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>{t('member2.payment.amountToPay')}</Text>
                    <Text style={styles.summaryAmount}>{formatCurrency(job?.finalCost || job?.digitalPaymentAmount || job?.estimatedCost)}</Text>
                    <Text style={styles.summaryMeta}>{job?.category} · {job?.subCategory}</Text>
                </View>

                <View style={styles.formCard}>
                    <Input
                        label={t('member2.payment.cardHolderName')}
                        value={cardHolderName}
                        onChangeText={setCardHolderName}
                        placeholder={t('member2.payment.cardHolderPlaceholder')}
                    />
                    <Input
                        label={t('member2.payment.cardNumber')}
                        value={cardNumber}
                        onChangeText={setCardNumber}
                        placeholder="1234 5678 9012 3456"
                        keyboardType="number-pad"
                    />
                    <View style={styles.row}>
                        <Input
                            label={t('member2.payment.expiryMonth')}
                            value={expiryMonth}
                            onChangeText={setExpiryMonth}
                            placeholder="MM"
                            keyboardType="number-pad"
                            containerStyle={styles.rowInput}
                        />
                        <Input
                            label={t('member2.payment.expiryYear')}
                            value={expiryYear}
                            onChangeText={setExpiryYear}
                            placeholder="YY"
                            keyboardType="number-pad"
                            containerStyle={styles.rowInput}
                        />
                    </View>
                </View>

                <View style={styles.noteCard}>
                    <Ionicons name="information-circle" size={18} color={theme.colors.secondary} />
                    <Text style={styles.noteText}>{t('member2.payment.note')}</Text>
                </View>

                <Button
                    title={t('member2.payment.makePayment')}
                    icon="card"
                    onPress={handlePay}
                    loading={submitting}
                    style={styles.payButton}
                />
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
    scrollContent: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
    summaryCard: {
        backgroundColor: `${theme.colors.primary}12`,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: `${theme.colors.primary}24`,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    summaryLabel: { ...theme.typography.caption, color: theme.colors.textMuted, marginBottom: 6 },
    summaryAmount: { ...theme.typography.h2, color: theme.colors.success },
    summaryMeta: { ...theme.typography.bodySmall, marginTop: 8 },
    formCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.lg,
    },
    row: { flexDirection: 'row', gap: 12 },
    rowInput: { flex: 1 },
    noteCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: `${theme.colors.secondary}15`,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: `${theme.colors.secondary}30`,
        padding: theme.spacing.md,
        marginTop: theme.spacing.md,
    },
    noteText: { ...theme.typography.bodySmall, flex: 1, marginLeft: 8, lineHeight: 18 },
    payButton: { marginTop: theme.spacing.xl },
});
