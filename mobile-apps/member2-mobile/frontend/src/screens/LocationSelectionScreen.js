import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import { theme } from '../theme';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { MapView, Marker, Polyline, PROVIDER_GOOGLE } from '../components/MapWrapper.native';
import { liveGoogleMapEnabled } from '../config/maps';
import { useTranslation } from 'react-i18next';
import { VoiceCommandButton } from '../components/VoiceCommandButton';
import {
    extractLocationSearchQuery,
    LOCATION_INTENTS,
} from '../voice/intentMappings';

const DEFAULT_REGION = {
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
};

const formatReverseGeoResult = (result) => {
    if (!result) {
        return '';
    }

    const parts = [
        result.name,
        result.street,
        result.city || result.subregion,
        result.region,
        result.country,
    ].filter(Boolean);

    return parts.join(', ');
};

export const LocationSelectionScreen = ({ route, navigation }) => {
    const {
        category,
        subCategory,
        description,
        issuePhotos = [],
        flowType,
        service,
    } = route.params;
    const isBoardReport = flowType === 'boardReport';
    const mapRef = useRef(null);
    const { t } = useTranslation();

    const [region, setRegion] = useState(DEFAULT_REGION);
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [addressQuery, setAddressQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [resolvingAddress, setResolvingAddress] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        loadCurrentLocation();
    }, []);

    const reverseLookup = async (latitude, longitude) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
                {
                    headers: {
                        Accept: 'application/json',
                        'User-Agent': 'PowerLink Member2 Mobile',
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data?.display_name) {
                    return data.display_name;
                }
            }
        } catch (_error) {
            // Fall back to Expo reverse geocoding below.
        }

        try {
            const fallbackResults = await Location.reverseGeocodeAsync({ latitude, longitude });
            return formatReverseGeoResult(fallbackResults[0]);
        } catch (_fallbackError) {
            return '';
        }
    };

    const animateToLocation = (latitude, longitude) => {
        const nextRegion = {
            latitude,
            longitude,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
        };

        setRegion(nextRegion);
        if (mapRef.current?.animateToRegion) {
            mapRef.current.animateToRegion(nextRegion, 600);
        }
    };

    const updateSelectedLocation = async (latitude, longitude, preferredAddress = '') => {
        setRegion((prev) => ({
            ...prev,
            latitude,
            longitude,
        }));
        setResolvingAddress(true);

        const resolvedAddress = preferredAddress || (await reverseLookup(latitude, longitude));
        if (resolvedAddress) {
            setSelectedAddress(resolvedAddress);
            setAddressQuery(resolvedAddress);
        }

        setResolvingAddress(false);
    };

    const loadCurrentLocation = async () => {
        try {
            setLoadingLocation(true);

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t('member2.location.permissionTitle'), t('member2.location.permissionMsg'));
                return;
            }

            const current = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            });

            animateToLocation(current.coords.latitude, current.coords.longitude);
            await updateSelectedLocation(current.coords.latitude, current.coords.longitude);
        } catch (_error) {
            Alert.alert(t('member2.location.unavailableTitle'), t('member2.location.unavailableMsg'));
        } finally {
            setLoadingLocation(false);
        }
    };

    const searchAddress = async (overrideQuery = '') => {
        const query = String(overrideQuery || addressQuery || '').trim();
        if (!query) {
            return;
        }

        try {
            setSearching(true);
            setSearchResults([]);

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`,
                {
                    headers: {
                        Accept: 'application/json',
                        'User-Agent': 'PowerLink Member2 Mobile',
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                const mappedResults = data.map((item, index) => ({
                    id: `${item.place_id || item.osm_id || index}`,
                    title: item.display_name,
                    latitude: Number(item.lat),
                    longitude: Number(item.lon),
                }));

                if (mappedResults.length > 0) {
                    setSearchResults(mappedResults);
                    return;
                }
            }
        } catch (_error) {
            // Fall back to Expo geocoding below.
        }

        try {
            const fallbackResults = await Location.geocodeAsync(query);
            const mappedFallback = fallbackResults.slice(0, 5).map((item, index) => ({
                id: `expo-${index}`,
                title: query,
                latitude: item.latitude,
                longitude: item.longitude,
            }));

            setSearchResults(mappedFallback);
            if (mappedFallback.length === 0) {
                Alert.alert(t('member2.location.noAddressTitle'), t('member2.location.noAddressMsg'));
            }
        } catch (_fallbackError) {
            Alert.alert(t('member2.location.searchFailedTitle'), t('member2.location.searchFailedMsg'));
        } finally {
            setSearching(false);
        }
    };

    const handleSelectSearchResult = async (result) => {
        animateToLocation(result.latitude, result.longitude);
        setSearchResults([]);
        await updateSelectedLocation(result.latitude, result.longitude, result.title);
    };

    const handleMapPress = async (event) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        await updateSelectedLocation(latitude, longitude);
    };

    const handleMarkerDragEnd = async (event) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        await updateSelectedLocation(latitude, longitude);
    };

    const handleConfirm = () => {
        const payload = {
            category,
            subCategory,
            description,
            issuePhotos,
            service,
            location: {
                latitude: region.latitude,
                longitude: region.longitude,
            },
            address: selectedAddress || addressQuery || t('member2.boardReview.selectedOnMap'),
        };

        if (isBoardReport) {
            navigation.navigate('BoardReportReview', payload);
            return;
        }

        navigation.navigate('AvailableElectricians', payload);
    };

    const handleVoiceIntent = async ({ intent, transcript }) => {
        if (!intent) {
            return false;
        }

        switch (intent) {
            case 'use_current_location':
                await loadCurrentLocation();
                return true;
            case 'search_location': {
                const query = extractLocationSearchQuery(transcript);
                if (query) {
                    setAddressQuery(query);
                    await searchAddress(query);
                    return true;
                }

                return false;
            }
            case 'review_and_confirm_issue':
            case 'confirm_location_and_report_issue':
            case 'confirm_location_technician':
            case 'find_available_technicians':
                handleConfirm();
                return true;
            case 'go_back':
                navigation.goBack();
                return true;
            default:
                return false;
        }
    };

    const title = isBoardReport ? t('member2.location.setIssueLocation') : t('member2.location.setServiceLocation');
    const subtitle = isBoardReport
        ? t('member2.location.boardSubtitle')
        : t('member2.location.serviceSubtitle');

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <Text style={styles.headerSubtitle}>{subtitle}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.searchCard}>
                    <View style={styles.searchHeader}>
                        <View style={styles.searchBadge}>
                            <Ionicons name="pin" size={18} color={theme.colors.primary} />
                        </View>
                        <View style={styles.searchTextWrap}>
                            <Text style={styles.searchTitle}>{t('member2.location.issueLocationTitle')}</Text>
                            <Text style={styles.searchSubtitle}>{t('member2.location.issueLocationSubtitle')}</Text>
                        </View>
                    </View>

                    <Input
                        value={addressQuery}
                        onChangeText={setAddressQuery}
                        placeholder={t('member2.location.searchPlaceholder')}
                        autoCapitalize="words"
                        containerStyle={styles.searchInput}
                    />

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={loadCurrentLocation}>
                            <Ionicons name="locate" size={18} color={theme.colors.secondary} />
                            <Text style={styles.secondaryButtonText}>{t('member2.location.useCurrentLocation')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.primaryActionButton} onPress={searchAddress}>
                            {searching ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="search" size={18} color="#FFFFFF" />
                                    <Text style={styles.primaryActionText}>{t('member2.location.search')}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {searchResults.length > 0 ? (
                        <View style={styles.resultsWrap}>
                            {searchResults.map((result) => (
                                <TouchableOpacity
                                    key={result.id}
                                    style={styles.resultItem}
                                    onPress={() => handleSelectSearchResult(result)}
                                >
                                    <Ionicons name="location-outline" size={18} color={theme.colors.warning} />
                                    <Text style={styles.resultText}>{result.title}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : null}

                    <View style={styles.selectedInfo}>
                        <Text style={styles.selectedLabel}>{t('member2.location.selectedAddress')}</Text>
                        {resolvingAddress ? (
                            <ActivityIndicator color={theme.colors.primary} size="small" />
                        ) : (
                            <>
                                <Text style={styles.selectedAddress}>
                                    {selectedAddress || t('member2.location.selectedAddressFallback')}
                                </Text>
                                <Text style={styles.selectedCoords}>
                                    {region.latitude.toFixed(6)}, {region.longitude.toFixed(6)}
                                </Text>
                            </>
                        )}
                    </View>
                </View>

                <View style={styles.mapCard}>
                    {loadingLocation ? (
                        <View style={styles.loadingMapState}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                            <Text style={styles.loadingMapText}>{t('member2.location.loadingMap')}</Text>
                        </View>
                    ) : !liveGoogleMapEnabled ? (
                        <View style={styles.mapDisabledState}>
                            <Ionicons name="map-outline" size={34} color={theme.colors.warning} />
                            <Text style={styles.mapDisabledTitle}>{t('member2.location.mapKeyTitle')}</Text>
                            <Text style={styles.mapDisabledText}>
                                {t('member2.location.mapKeyMsg')}
                            </Text>
                        </View>
                    ) : (
                        <>
                            <MapView
                                ref={mapRef}
                                style={styles.map}
                                provider={PROVIDER_GOOGLE}
                                initialRegion={region}
                                showsUserLocation
                                showsMyLocationButton={false}
                                onMapReady={() => setMapReady(true)}
                                onPress={handleMapPress}
                            >
                                <Marker
                                    coordinate={{ latitude: region.latitude, longitude: region.longitude }}
                                    draggable
                                    onDragEnd={handleMarkerDragEnd}
                                    title={isBoardReport ? t('member2.location.issueMarker') : t('member2.location.serviceMarker')}
                                    description={selectedAddress || t('member2.location.selectedPoint')}
                                />
                                <Polyline
                                    coordinates={[
                                        {
                                            latitude: region.latitude - 0.0008,
                                            longitude: region.longitude - 0.0008,
                                        },
                                        {
                                            latitude: region.latitude,
                                            longitude: region.longitude,
                                        },
                                    ]}
                                    strokeColor="rgba(37, 99, 235, 0.35)"
                                    strokeWidth={4}
                                />
                            </MapView>

                            <View style={styles.mapTopBadge}>
                                <Ionicons name="map" size={16} color={theme.colors.text} />
                                <Text style={styles.mapTopBadgeText}>{t('member2.location.liveMap')}</Text>
                            </View>

                            <TouchableOpacity style={styles.targetButton} onPress={loadCurrentLocation}>
                                <Ionicons name="locate" size={20} color={theme.colors.text} />
                            </TouchableOpacity>

                            <View style={styles.previewAddressCard}>
                                <Ionicons name="location" size={18} color={theme.colors.warning} />
                                <View style={styles.previewAddressTextWrap}>
                                    <Text style={styles.previewAddressTitle}>{t('member2.location.previewTitle')}</Text>
                                    <Text style={styles.previewAddressText} numberOfLines={2}>
                                        {selectedAddress || addressQuery || t('member2.location.currentLocation')}
                                    </Text>
                                </View>
                            </View>

                            {!mapReady ? (
                                <View style={styles.mapOverlayLoader}>
                                    <ActivityIndicator size="large" color="#FFFFFF" />
                                </View>
                            ) : null}
                        </>
                    )}
                </View>

                <View style={styles.bottomPanel}>
                    <View style={styles.bottomInfoRow}>
                        <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                        <Text style={styles.bottomInfoText}>
                            {isBoardReport ? t('member2.location.boardConfirmInfo') : t('member2.location.techConfirmInfo')}
                        </Text>
                    </View>

                    <GradientButton
                        title={isBoardReport ? t('member2.location.reviewIssue') : t('member2.location.findTechnicians')}
                        icon="navigate-circle"
                        onPress={handleConfirm}
                    />
                </View>
            </ScrollView>

            <VoiceCommandButton
                allowedIntents={LOCATION_INTENTS}
                onIntentMatched={handleVoiceIntent}
            />
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
        lineHeight: 17,
    },
    scrollContent: {
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xxl,
    },
    searchCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.md,
    },
    searchBadge: {
        width: 42,
        height: 42,
        borderRadius: theme.borderRadius.md,
        backgroundColor: `${theme.colors.primary}18`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    searchTextWrap: {
        flex: 1,
    },
    searchTitle: {
        ...theme.typography.h3,
        marginBottom: 4,
    },
    searchSubtitle: {
        ...theme.typography.caption,
        lineHeight: 17,
    },
    searchInput: {
        marginBottom: theme.spacing.sm,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    secondaryButton: {
        flex: 1,
        minHeight: 48,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: `${theme.colors.secondary}15`,
        borderWidth: 1,
        borderColor: `${theme.colors.secondary}35`,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.md,
    },
    secondaryButtonText: {
        ...theme.typography.bodySmall,
        color: theme.colors.secondary,
        fontWeight: '700',
        marginLeft: 8,
    },
    primaryActionButton: {
        flex: 1,
        minHeight: 48,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.md,
    },
    primaryActionText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
    },
    resultsWrap: {
        marginTop: theme.spacing.md,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    resultText: {
        ...theme.typography.bodySmall,
        flex: 1,
        marginLeft: 10,
        lineHeight: 18,
    },
    selectedInfo: {
        marginTop: theme.spacing.md,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    selectedLabel: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
        marginBottom: 6,
    },
    selectedAddress: {
        ...theme.typography.body,
        fontWeight: '700',
        marginBottom: 6,
    },
    selectedCoords: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
    },
    mapCard: {
        height: 360,
        borderRadius: theme.borderRadius.xl,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: theme.spacing.md,
        position: 'relative',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapOverlayLoader: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.28)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapTopBadge: {
        position: 'absolute',
        top: 14,
        left: 14,
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        borderRadius: theme.borderRadius.full,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    mapTopBadgeText: {
        ...theme.typography.bodySmall,
        color: theme.colors.text,
        marginLeft: 6,
        fontWeight: '700',
    },
    targetButton: {
        position: 'absolute',
        right: 18,
        bottom: 108,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewAddressCard: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderRadius: theme.borderRadius.xl,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'flex-start',
        shadowColor: '#000000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    previewAddressTextWrap: {
        flex: 1,
        marginLeft: 10,
    },
    previewAddressTitle: {
        ...theme.typography.bodySmall,
        color: theme.colors.textMuted,
        marginBottom: 4,
    },
    previewAddressText: {
        ...theme.typography.body,
        fontWeight: '700',
        lineHeight: 18,
    },
    loadingMapState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingMapText: {
        ...theme.typography.bodySmall,
        marginTop: 12,
    },
    mapDisabledState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xl,
    },
    mapDisabledTitle: {
        ...theme.typography.h3,
        marginTop: 12,
        marginBottom: 8,
        textAlign: 'center',
    },
    mapDisabledText: {
        ...theme.typography.bodySmall,
        textAlign: 'center',
        lineHeight: 18,
    },
    bottomPanel: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.lg,
    },
    bottomInfoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.md,
    },
    bottomInfoText: {
        ...theme.typography.bodySmall,
        flex: 1,
        marginLeft: 8,
        lineHeight: 18,
    },
});
