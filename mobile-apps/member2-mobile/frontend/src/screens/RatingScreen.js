import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

export const RatingScreen = ({ route, navigation }) => {
    const { t } = useTranslation();
    const { electrician } = route.params;
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const handleSubmit = () => {
        // Animate thank you screen
        setSubmitted(true);
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();

        // Navigate home after delay
        setTimeout(() => {
            navigation.navigate('HouseholderHome');
        }, 2500);
    };

    if (submitted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.thankYouContainer}>
                    <Animated.View style={[
                        styles.checkCircle,
                        {
                            transform: [{ scale: scaleAnim }],
                            opacity: opacityAnim,
                        }
                    ]}>
                        <View style={styles.checkInner}>
                            <Ionicons name="checkmark" size={48} color={theme.colors.success} />
                        </View>
                    </Animated.View>
                    <Animated.Text style={[styles.thankYouTitle, { opacity: opacityAnim }]}>
                        {t('rating.thankYou')}
                    </Animated.Text>
                    <Animated.Text style={[styles.thankYouSubtitle, { opacity: opacityAnim }]}>
                        {t('rating.thankYouSubtitle')}
                    </Animated.Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.avatarLarge}>
                        <Ionicons name="person" size={32} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.title}>{t('rating.title')}</Text>
                    <Text style={styles.subtitle}>{t('rating.subtitle1')}{electrician.name}{t('rating.subtitle2')}</Text>
                </View>

                {/* Star Rating */}
                <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                            key={star}
                            onPress={() => setRating(star)}
                            style={styles.starButton}
                        >
                            <Ionicons
                                name={star <= rating ? 'star' : 'star-outline'}
                                size={44}
                                color={theme.colors.warning}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={styles.ratingLabel}>
                    {rating === 0 ? t('rating.tapToRate') :
                        rating <= 2 ? t('rating.rating1_2') :
                            rating <= 3 ? t('rating.rating3') :
                                rating <= 4 ? t('rating.rating4') : t('rating.rating5')}
                </Text>

                {/* Feedback Input */}
                <Input
                    label={t('rating.feedbackLabel')}
                    placeholder={t('rating.feedbackPlaceholder')}
                    value={feedback}
                    onChangeText={setFeedback}
                    multiline
                    numberOfLines={4}
                />

                {/* Submit */}
                <GradientButton
                    title={t('rating.submitBtn')}
                    icon="send"
                    onPress={handleSubmit}
                    disabled={rating === 0}
                    style={styles.submitButton}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
        padding: theme.spacing.xl,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    avatarLarge: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        borderWidth: 2,
        borderColor: theme.colors.primary + '30',
    },
    title: {
        ...theme.typography.h1,
        marginBottom: 4,
        textAlign: 'center',
    },
    subtitle: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: theme.spacing.sm,
    },
    starButton: {
        padding: 4,
    },
    ratingLabel: {
        ...theme.typography.bodySmall,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
        color: theme.colors.warning,
        fontWeight: '600',
    },
    submitButton: {
        marginTop: theme.spacing.md,
    },
    // Thank You Animation
    thankYouContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    checkCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.success + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    checkInner: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: theme.colors.success + '25',
        justifyContent: 'center',
        alignItems: 'center',
    },
    thankYouTitle: {
        ...theme.typography.h1,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },
    thankYouSubtitle: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
});
