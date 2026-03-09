import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { GradientButton } from '../components/GradientButton';
import { MapView, Marker, PROVIDER_GOOGLE } from '../components/MapWrapper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';

export const LocationSelectionScreen = ({ route, navigation }) => {
    const { category, subCategory, description } = route.params;
    const { t } = useTranslation();
    const [region, setRegion] = useState({
        latitude: 6.9271,
        longitude: 79.8612,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCurrentLocation();
    }, []);

    const getCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                setRegion({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
            }
        } catch (error) {
            // Default to Colombo
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        navigation.navigate('AvailableElectricians', {
            category,
            subCategory,
            description,
            location: {
                latitude: region.latitude,
                longitude: region.longitude,
            },
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Back Button Overlay */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <View style={styles.backCircle}>
                    <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
                </View>
            </TouchableOpacity>

            {/* Map */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>{t('locationSelection.gettingLocation')}</Text>
                </View>
            ) : (
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        region={region}
                        onRegionChangeComplete={setRegion}
                    >
                        <Marker
                            coordinate={{
                                latitude: region.latitude,
                                longitude: region.longitude,
                            }}
                            title={t('locationSelection.yourLocation')}
                        />
                    </MapView>

                    {/* Center Pin Overlay */}
                    <View style={styles.pinOverlay} pointerEvents="none">
                        <Ionicons name="location" size={40} color={theme.colors.danger} />
                    </View>
                </View>
            )}

            {/* Bottom Panel */}
            <View style={styles.bottomPanel}>
                <View style={styles.locationInfo}>
                    <Ionicons name="location" size={20} color={theme.colors.primary} />
                    <Text style={styles.locationText}>{t('locationSelection.dragMapHint')}</Text>
                </View>
                <GradientButton
                    title={t('locationSelection.confirmBtn')}
                    icon="checkmark-circle"
                    onPress={handleConfirm}
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
    backButton: {
        position: 'absolute',
        top: 50,
        left: 16,
        zIndex: 10,
    },
    backCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.md,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.md,
    },
    mapContainer: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    pinOverlay: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -20,
        marginTop: -40,
    },
    bottomPanel: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    locationText: {
        ...theme.typography.bodySmall,
        marginLeft: 8,
    },
});
