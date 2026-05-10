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
import { theme } from '../../theme/outage';
import { GradientButton } from '../../components/outage/GradientButton';
import { Input } from '../../components/outage/Input';
import { MapView, Marker, Polyline, PROVIDER_GOOGLE } from '../../components/outage/MapWrapper';
import { useTranslation } from '../../utils/outage/i18nShim';
import { VoiceCommandButton } from '../../components/outage/VoiceCommandButton';
import {
    extractLocationSearchQuery,
    LOCATION_INTENTS,
} from '../../voice/outage/intentMappings';

const DEFAULT_REGION = {
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
};

const formatReverseGeoResult = (result) => {
    if (!result) return '';
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
        if (!query) return;
        try {
            setSearching(true);
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
        // Other flows can be added here
    };

    const handleVoiceIntent = async ({ intent, transcript }) => {
        if (!intent) return false;
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

                        <TouchableOpacity style={styles.primaryActionButton} onPress={() => searchAddress()}>
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

                    {searchResults.length > 0 && (
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
                    )}

                    <View style={styles.selectedInfo}>
                        <Text style={styles.selectedLabel}>{t('member2.location.selectedAddress')}</Text>
                        {resolvingAddress ? (
                            <ActivityIndicator color={theme.colors.primary} size="small" />
                        ) : (
                            <>
                                <Text style={styles.selectedAddress}>
                                    {selectedAddress || t('member2.location.selectedAddressFallback')}
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
                    ) : (
                        <MapView style={styles.map}>
                            <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} />
                        </MapView>
                    )}
                </View>

                <View style={styles.bottomPanel}>
                    <GradientButton
                        title={t('member2.location.reviewIssue')}
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
    searchCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 24, borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 24, marginBottom: 16,
    },
    searchInput: { marginBottom: 8 },
    actionRow: { flexDirection: 'row', gap: 10 },
    secondaryButton: {
        flex: 1, height: 48, borderRadius: 12,
        backgroundColor: `${theme.colors.secondary}15`,
        borderWidth: 1, borderColor: `${theme.colors.secondary}35`,
        alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    },
    secondaryButtonText: { color: theme.colors.secondary, fontWeight: '700', marginLeft: 8 },
    primaryActionButton: {
        flex: 1, height: 48, borderRadius: 12,
        backgroundColor: theme.colors.primary,
        alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    },
    primaryActionText: { color: '#FFFFFF', fontWeight: '700', marginLeft: 8 },
    resultsWrap: {
        marginTop: 16, backgroundColor: theme.colors.background,
        borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border,
    },
    resultItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    resultText: { fontSize: 13, color: theme.colors.text, flex: 1, marginLeft: 10 },
    selectedInfo: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.border },
    selectedLabel: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 6 },
    selectedAddress: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
    mapCard: { height: 300, borderRadius: 24, overflow: 'hidden', backgroundColor: theme.colors.surface, marginBottom: 16 },
    map: { width: '100%', height: '100%' },
    loadingMapState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingMapText: { fontSize: 12, marginTop: 12, color: theme.colors.textSecondary },
    bottomPanel: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.colors.border },
});

export default LocationSelectionScreen;
