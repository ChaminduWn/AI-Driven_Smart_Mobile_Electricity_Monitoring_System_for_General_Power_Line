import React, { useState, useRef } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme/outage';
import { GradientButton } from '../../components/outage/GradientButton';
import { Input } from '../../components/outage/Input';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../../utils/outage/i18nShim';

export const RatingScreen = ({ route, navigation }) => {
    const { t } = useTranslation();
    const { electrician, jobId } = route.params;
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const handleSubmit = async () => {
        setSubmitting(true);
        // Simulate submission
        setTimeout(() => {
            setSubmitted(true);
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]).start();
            setSubmitting(false);
            setTimeout(() => navigation.navigate('Activities'), 2500);
        }, 1500);
    };

    if (submitted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.thankYouContainer}>
                    <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
                        <Ionicons name="checkmark" size={48} color={theme.colors.success} />
                    </Animated.View>
                    <Animated.Text style={[styles.thankYouTitle, { opacity: opacityAnim }]}>Thank You!</Animated.Text>
                    <Animated.Text style={[styles.thankYouSubtitle, { opacity: opacityAnim }]}>Your feedback helps us improve.</Animated.Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.avatarLarge}><Ionicons name="person" size={32} color={theme.colors.primary} /></View>
                    <Text style={styles.title}>Rate Technician</Text>
                    <Text style={styles.subtitle}>How was your experience with {electrician?.name}?</Text>
                </View>

                <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starButton}>
                            <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={44} color={theme.colors.warning} />
                        </TouchableOpacity>
                    ))}
                </View>

                <Input
                    label="Feedback"
                    placeholder="Tell us more about the service..."
                    value={feedback}
                    onChangeText={setFeedback}
                    multiline
                    numberOfLines={4}
                />

                <GradientButton
                    title="Submit Rating"
                    onPress={handleSubmit}
                    disabled={rating === 0 || submitting}
                    loading={submitting}
                    style={{ marginTop: 24 }}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { flex: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 30 },
    avatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
    subtitle: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 },
    starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
    starButton: { padding: 4 },
    thankYouContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    checkCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.success + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    thankYouTitle: { fontSize: 24, fontWeight: '800' },
    thankYouSubtitle: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 8 },
});

export default RatingScreen;
