import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Card } from '../components/Card';
import { GradientButton } from '../components/GradientButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';

export const AvailableElectriciansScreen = ({ route, navigation }) => {
    const { category, subCategory, description, location, issuePhotos } = route.params;
    const { user } = useAuth();

    const [electricians] = useState([
        { id: '1', name: 'Roshan Perera', rating: 4.8, distance: '1.2 km', vehicle: 'WP CAB-1234', amount: 'LKR 1,500', reviews: 48 },
        { id: '2', name: 'Nimal Silva', rating: 4.5, distance: '2.5 km', vehicle: 'WP BAT-5678', amount: 'LKR 1,200', reviews: 32 },
        { id: '3', name: 'Kamal De Soysa', rating: 4.9, distance: '0.8 km', vehicle: 'WP AAB-9999', amount: 'LKR 2,000', reviews: 67 },
    ]);

    const handleAccept = (electrician) => {
        Alert.alert(
            'Confirm Request',
            `Request ${electrician.name} for ${electrician.amount}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            const payload = {
                                householderId: user?.id,
                                electricianId: electrician.id, // Currently hardcoded IDs in frontend state, would need real IDs if this was a live live list
                                title: `${category.title} Issue`,
                                description: description,
                                locationLat: location.latitude,
                                locationLng: location.longitude,
                                district: user?.district || 'Colombo', // Fallback
                                category: category.id,
                                subCategory: subCategory,
                                issuePhotos: issuePhotos || [],
                            };

                            const response = await fetch('http://192.168.8.101:8003/api/jobs', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(payload)
                            });

                            const data = await response.json();
                            if (data.success) {
                                // Pass the generated startCode from the backend job to the tracking screen
                                navigation.navigate('TrackElectrician', {
                                    electrician,
                                    location,
                                    job: data.job
                                });
                            } else {
                                Alert.alert('Error', data.message || 'Failed to create job request.');
                            }
                        } catch (err) {
                            Alert.alert('Network Error', 'Could not connect to the server to create the job.');
                        }
                    },
                },
            ]
        );
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i <= rating ? 'star' : i - 0.5 <= rating ? 'star-half' : 'star-outline'}
                    size={14}
                    color={theme.colors.warning}
                />
            );
        }
        return stars;
    };

    const renderItem = ({ item }) => (
        <Card style={styles.card} glowColor={theme.colors.primary}>
            <View style={styles.cardTop}>
                {/* Avatar */}
                <View style={styles.avatar}>
                    <Ionicons name="person" size={22} color={theme.colors.primary} />
                </View>

                {/* Info */}
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.ratingRow}>
                        {renderStars(item.rating)}
                        <Text style={styles.ratingText}>{item.rating}</Text>
                        <Text style={styles.reviewCount}>({item.reviews})</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="car" size={14} color={theme.colors.textMuted} />
                        <Text style={styles.detailText}>{item.vehicle}</Text>
                    </View>
                </View>

                {/* Amount */}
                <View style={styles.amountContainer}>
                    <Text style={styles.amount}>{item.amount}</Text>
                    <View style={styles.distanceBadge}>
                        <Ionicons name="navigate" size={12} color={theme.colors.secondary} />
                        <Text style={styles.distanceText}>{item.distance}</Text>
                    </View>
                </View>
            </View>

            <GradientButton
                title="Accept"
                onPress={() => handleAccept(item)}
                style={styles.acceptButton}
            />
        </Card>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Nearby Electricians</Text>
                    <Text style={styles.headerSubtitle}>{category.title} • {subCategory}</Text>
                </View>
            </View>

            {electricians.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="sad-outline" size={64} color={theme.colors.textMuted} />
                    </View>
                    <Text style={styles.emptyTitle}>No Electricians Available</Text>
                    <Text style={styles.emptyDesc}>
                        We couldn't find any available electricians near your location at this moment.
                    </Text>

                    <View style={styles.cebBox}>
                        <Ionicons name="call" size={24} color={theme.colors.primary} />
                        <View style={styles.cebInfo}>
                            <Text style={styles.cebTitle}>Call CEB Hotline</Text>
                            <Text style={styles.cebDesc}>Ceylon Electricity Board 24/7 Support</Text>
                        </View>
                    </View>

                    <GradientButton
                        title="Call 1987 Now"
                        icon="call"
                        onPress={() => Linking.openURL('tel:1987')}
                        style={{ marginTop: theme.spacing.lg }}
                    />
                </View>
            ) : (
                <FlatList
                    data={electricians}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
    headerTitle: {
        ...theme.typography.h3,
    },
    headerSubtitle: {
        ...theme.typography.caption,
        marginTop: 2,
    },
    list: {
        padding: theme.spacing.md,
        paddingBottom: 100,
    },
    card: {
        marginBottom: theme.spacing.md,
    },
    cardTop: {
        flexDirection: 'row',
        marginBottom: theme.spacing.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    name: {
        ...theme.typography.body,
        fontWeight: '700',
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    ratingText: {
        color: theme.colors.text,
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 4,
    },
    reviewCount: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginLeft: 2,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginLeft: 4,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        ...theme.typography.h3,
        color: theme.colors.success,
        fontSize: 16,
    },
    distanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        backgroundColor: theme.colors.secondary + '15',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: theme.borderRadius.sm,
    },
    distanceText: {
        color: theme.colors.secondary,
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
    },
    acceptButton: {
        marginTop: 0,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    emptyTitle: {
        ...theme.typography.h2,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    emptyDesc: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
        lineHeight: 22,
    },
    cebBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary + '15',
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.primary + '30',
        width: '100%',
    },
    cebInfo: {
        marginLeft: theme.spacing.md,
        flex: 1,
    },
    cebTitle: {
        ...theme.typography.h3,
        color: theme.colors.primary,
        marginBottom: 2,
    },
    cebDesc: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
});
