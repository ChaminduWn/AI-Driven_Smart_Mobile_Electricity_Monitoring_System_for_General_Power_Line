import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useTranslation } from 'react-i18next';
import { buildApiUrl, buildAssetUrl } from '../api';
import { VoiceCommandButton } from '../components/VoiceCommandButton';
import {
    SERVICE_ID_BY_INTENT,
    SERVICE_SUBCATEGORY_INTENTS,
} from '../voice/intentMappings';

const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
        return 'Admin price pending';
    }

    return `LKR ${Number(amount).toLocaleString()}`;
};

const getSubcategories = (catId, t) => {
    switch (catId) {
        case 'power':
            return [
                { serviceId: 'M2-POW-001', name: t('subCategory.power.complete'), icon: 'flash-off' },
                { serviceId: 'M2-POW-002', name: t('subCategory.power.partial'), icon: 'flash' },
                { serviceId: 'M2-POW-003', name: t('subCategory.power.intermittent'), icon: 'swap-horizontal' },
                { serviceId: 'M2-POW-004', name: t('subCategory.power.scheduled'), icon: 'calendar' },
                { serviceId: 'M2-POW-005', name: t('subCategory.power.sudden'), icon: 'thunderstorm' },
            ];
        case 'voltage':
            return [
                { serviceId: 'M2-VOL-001', name: t('subCategory.voltage.low'), icon: 'trending-down' },
                { serviceId: 'M2-VOL-002', name: t('subCategory.voltage.high'), icon: 'trending-up' },
                { serviceId: 'M2-VOL-003', name: t('subCategory.voltage.fluctuating'), icon: 'pulse' },
                { serviceId: 'M2-VOL-004', name: t('subCategory.voltage.dim'), icon: 'bulb' },
            ];
        case 'safety':
            return [
                { serviceId: 'M2-SAF-001', name: t('subCategory.safety.sparks'), icon: 'flame' },
                { serviceId: 'M2-SAF-002', name: t('subCategory.safety.burning'), icon: 'alert-circle' },
                { serviceId: 'M2-SAF-003', name: t('subCategory.safety.exposed'), icon: 'warning' },
                { serviceId: 'M2-SAF-004', name: t('subCategory.safety.shock'), icon: 'skull' },
            ];
        case 'infrastructure':
            return [
                { serviceId: 'M2-INF-001', name: t('subCategory.infrastructure.damagedLines'), icon: 'git-branch' },
                { serviceId: 'M2-INF-002', name: t('subCategory.infrastructure.fallenPole'), icon: 'arrow-down-circle' },
                { serviceId: 'M2-INF-003', name: t('subCategory.infrastructure.brokenBox'), icon: 'cube' },
            ];
        case 'monitoring':
            return [
                { serviceId: 'M2-MON-001', name: t('subCategory.monitoring.faultyReading'), icon: 'speedometer' },
                { serviceId: 'M2-MON-002', name: t('subCategory.monitoring.smartMeter'), icon: 'phone-portrait' },
                { serviceId: 'M2-MON-003', name: t('subCategory.monitoring.connectivity'), icon: 'wifi' },
            ];
        default:
            return [
                { serviceId: 'M2-GEN-001', name: t('subCategory.general.generalIssue'), icon: 'help-circle' },
                { serviceId: 'M2-GEN-002', name: t('subCategory.general.other'), icon: 'ellipsis-horizontal' },
            ];
    }
};

export const SubCategoryScreen = ({ route, navigation }) => {
    const { t } = useTranslation();
    const { category } = route.params || { category: { title: 'Unknown', id: 'unknown', color: theme.colors.primary } };
    const [selectedSub, setSelectedSub] = useState(null);
    const [description, setDescription] = useState('');
    const [descError, setDescError] = useState('');
    const [issuePhotos, setIssuePhotos] = useState([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [servicesById, setServicesById] = useState({});
    const [loadingServices, setLoadingServices] = useState(true);

    useEffect(() => {
        let mounted = true;

        const fetchServices = async () => {
            try {
                setLoadingServices(true);
                const response = await fetch(buildApiUrl('/services/mobile'));
                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data?.message || 'Could not load service prices');
                }

                if (!mounted) {
                    return;
                }

                const lookup = data.data.reduce((acc, service) => {
                    acc[service.serviceId] = service;
                    return acc;
                }, {});

                setServicesById(lookup);
            } catch (error) {
                console.error('Fetch mobile services error', error);
            } finally {
                if (mounted) {
                    setLoadingServices(false);
                }
            }
        };

        fetchServices();

        return () => {
            mounted = false;
        };
    }, []);

    const subcategories = useMemo(
        () =>
            getSubcategories(category.id, t).map((item) => ({
                ...item,
                service: servicesById[item.serviceId] || null,
            })),
        [category.id, servicesById, t]
    );

    const handleNext = () => {
        if (!selectedSub) {
            return;
        }

        if (!description.trim()) {
            setDescError(t('subCategory.validation.describeIssue'));
            return;
        }

        navigation.navigate('LocationSelection', {
            category,
            subCategory: selectedSub.name,
            description,
            issuePhotos,
            service: {
                serviceId: selectedSub.service?.serviceId || selectedSub.serviceId,
                name: selectedSub.service?.name || selectedSub.name,
                basePrice: selectedSub.service?.basePrice ?? null,
                category: selectedSub.service?.category || category.title,
            },
        });
    };

    const pickImage = async () => {
        if (issuePhotos.length >= 3) {
            return Alert.alert(t('subCategory.validation.limitReachedTitle'), t('subCategory.validation.limitReachedMsg'));
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setUploadingImage(true);
            try {
                const uploadResponse = await FileSystem.uploadAsync(buildApiUrl('/upload'), result.assets[0].uri, {
                    fieldName: 'image',
                    httpMethod: 'POST',
                    uploadType: 1,
                    mimeType: 'image/jpeg',
                });

                const uploadData = JSON.parse(uploadResponse.body);
                if (uploadData.success && uploadData.url) {
                    setIssuePhotos([...issuePhotos, uploadData.url]);
                } else {
                    Alert.alert(t('subCategory.validation.uploadFailedTitle'), uploadData.message || t('subCategory.validation.uploadFailedMsg'));
                }
            } catch (error) {
                Alert.alert(
                    t('subCategory.validation.uploadErrorTitle'),
                    `${t('subCategory.validation.uploadErrorMsg')}: ${error.message || 'Unknown network error'}`
                );
            } finally {
                setUploadingImage(false);
            }
        }
    };

    const handleVoiceIntent = async ({ intent }) => {
        if (!intent) {
            return false;
        }

        if (intent in SERVICE_ID_BY_INTENT) {
            const nextSubcategory = subcategories.find((item) => item.serviceId === SERVICE_ID_BY_INTENT[intent]);
            if (!nextSubcategory) {
                return false;
            }

            setSelectedSub(nextSubcategory);
            return true;
        }

        switch (intent) {
            case 'add_photo':
                await pickImage();
                return true;
            case 'continue_to_location':
                handleNext();
                return true;
            case 'go_back':
                navigation.goBack();
                return true;
            default:
                return false;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{category.title}</Text>
                    <Text style={styles.headerSubtitle}>{t('subCategory.ui.selectIssue')}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {loadingServices ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator color={theme.colors.primary} size="large" />
                        <Text style={styles.loadingText}>Loading admin-defined service prices...</Text>
                    </View>
                ) : null}

                {subcategories.map((sub, index) => {
                    const selected = selectedSub?.serviceId === sub.serviceId;

                    return (
                        <TouchableOpacity
                            key={`${sub.serviceId}-${index}`}
                            style={[
                                styles.subCard,
                                selected && {
                                    borderColor: category.color,
                                    backgroundColor: `${category.color}10`,
                                },
                            ]}
                            onPress={() => setSelectedSub(sub)}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.subIconContainer,
                                    { backgroundColor: `${selected ? category.color : theme.colors.textMuted}15` },
                                ]}
                            >
                                <Ionicons
                                    name={sub.icon}
                                    size={20}
                                    color={selected ? category.color : theme.colors.textMuted}
                                />
                            </View>

                            <View style={styles.subInfo}>
                                <Text
                                    style={[
                                        styles.subText,
                                        selected && { color: category.color, fontWeight: '700' },
                                    ]}
                                >
                                    {sub.name}
                                </Text>
                                <Text style={styles.subPrice}>{formatCurrency(sub.service?.basePrice)}</Text>
                            </View>

                            {selected ? (
                                <Ionicons name="checkmark-circle" size={22} color={category.color} />
                            ) : (
                                <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                            )}
                        </TouchableOpacity>
                    );
                })}

                {selectedSub ? (
                    <View style={styles.detailsContainer}>
                        <View style={styles.priceHero}>
                            <View>
                                <Text style={styles.priceHeroLabel}>Selected service charge</Text>
                                <Text style={styles.priceHeroValue}>{formatCurrency(selectedSub.service?.basePrice)}</Text>
                            </View>
                            <Ionicons name="cash" size={26} color={theme.colors.success} />
                        </View>

                        <Text style={styles.descLabel}>{t('subCategory.ui.describeLabel')}</Text>
                        <Input
                            placeholder={t('subCategory.ui.describePlaceholder')}
                            value={description}
                            onChangeText={(input) => {
                                setDescription(input);
                                setDescError('');
                            }}
                            multiline
                            numberOfLines={4}
                            error={descError}
                        />

                        <Text style={[styles.descLabel, { marginTop: theme.spacing.md }]}>{t('subCategory.ui.addPhotos')}</Text>
                        <Text style={styles.photoHint}>{t('subCategory.ui.photoHint')}</Text>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                            {issuePhotos.map((photoUrl, index) => (
                                <View key={index} style={styles.photoThumbnailContainer}>
                                    <Image source={{ uri: buildAssetUrl(photoUrl) }} style={styles.photoThumbnail} />
                                    <TouchableOpacity
                                        style={styles.removePhotoBtn}
                                        onPress={() => setIssuePhotos(issuePhotos.filter((_, itemIndex) => itemIndex !== index))}
                                    >
                                        <Ionicons name="close-circle" size={24} color={theme.colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {issuePhotos.length < 3 ? (
                                <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage} disabled={uploadingImage}>
                                    {uploadingImage ? (
                                        <ActivityIndicator color={theme.colors.primary} />
                                    ) : (
                                        <>
                                            <Ionicons name="camera" size={28} color={theme.colors.primary} />
                                            <Text style={styles.addPhotoText}>{t('subCategory.ui.addPhotoBtn')}</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            ) : null}
                        </ScrollView>

                        <GradientButton
                            title={t('subCategory.ui.continueBtn')}
                            icon="search"
                            onPress={handleNext}
                            style={{ marginTop: theme.spacing.sm }}
                        />
                    </View>
                ) : null}
            </ScrollView>

            <VoiceCommandButton
                allowedIntents={SERVICE_SUBCATEGORY_INTENTS}
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
        backgroundColor: theme.colors.background,
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
    scrollContent: {
        padding: theme.spacing.lg,
        paddingBottom: 40,
    },
    loadingWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.lg,
    },
    loadingText: {
        ...theme.typography.bodySmall,
        marginTop: 10,
        color: theme.colors.textSecondary,
    },
    subCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    subIconContainer: {
        width: 42,
        height: 42,
        borderRadius: theme.borderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    subInfo: {
        flex: 1,
    },
    subText: {
        ...theme.typography.body,
    },
    subPrice: {
        ...theme.typography.caption,
        marginTop: 4,
        color: theme.colors.success,
        fontWeight: '700',
    },
    detailsContainer: {
        marginTop: theme.spacing.xl,
    },
    priceHero: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: `${theme.colors.success}15`,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: `${theme.colors.success}30`,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
    },
    priceHeroLabel: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
        marginBottom: 6,
    },
    priceHeroValue: {
        ...theme.typography.h2,
        color: theme.colors.success,
    },
    descLabel: {
        ...theme.typography.h3,
        marginBottom: theme.spacing.sm,
    },
    photoHint: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
    },
    photoScroll: {
        flexDirection: 'row',
        marginBottom: theme.spacing.xl,
    },
    addPhotoBtn: {
        width: 100,
        height: 100,
        borderRadius: theme.borderRadius.md,
        backgroundColor: `${theme.colors.primary}15`,
        borderWidth: 1,
        borderColor: `${theme.colors.primary}40`,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.sm,
    },
    addPhotoText: {
        ...theme.typography.caption,
        color: theme.colors.primary,
        fontWeight: '600',
        marginTop: 4,
    },
    photoThumbnailContainer: {
        marginRight: theme.spacing.sm,
        position: 'relative',
    },
    photoThumbnail: {
        width: 100,
        height: 100,
        borderRadius: theme.borderRadius.md,
    },
    removePhotoBtn: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FFF',
        borderRadius: 12,
    },
});
