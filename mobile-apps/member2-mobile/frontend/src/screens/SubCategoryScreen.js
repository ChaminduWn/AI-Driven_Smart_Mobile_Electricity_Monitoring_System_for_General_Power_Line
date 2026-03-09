import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Card } from '../components/Card';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { Alert, ActivityIndicator, Image } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { useTranslation } from 'react-i18next';

export const SubCategoryScreen = ({ route, navigation }) => {
    const { t } = useTranslation();
    const { category } = route.params || { category: { title: 'Unknown', id: 'unknown', color: theme.colors.primary } };
    const [selectedSub, setSelectedSub] = useState(null);
    const [description, setDescription] = useState('');
    const [descError, setDescError] = useState('');
    const [issuePhotos, setIssuePhotos] = useState([]); // Array of uploaded URLs
    const [uploadingImage, setUploadingImage] = useState(false);

    const getSubcategories = (catId) => {
        switch (catId) {
            case 'power':
                return [
                    { name: t('subCategory.power.complete'), icon: 'flash-off' },
                    { name: t('subCategory.power.partial'), icon: 'flash' },
                    { name: t('subCategory.power.intermittent'), icon: 'swap-horizontal' },
                    { name: t('subCategory.power.scheduled'), icon: 'calendar' },
                    { name: t('subCategory.power.sudden'), icon: 'thunderstorm' },
                ];
            case 'voltage':
                return [
                    { name: t('subCategory.voltage.low'), icon: 'trending-down' },
                    { name: t('subCategory.voltage.high'), icon: 'trending-up' },
                    { name: t('subCategory.voltage.fluctuating'), icon: 'pulse' },
                    { name: t('subCategory.voltage.dim'), icon: 'bulb' },
                ];
            case 'safety':
                return [
                    { name: t('subCategory.safety.sparks'), icon: 'flame' },
                    { name: t('subCategory.safety.burning'), icon: 'alert-circle' },
                    { name: t('subCategory.safety.exposed'), icon: 'warning' },
                    { name: t('subCategory.safety.shock'), icon: 'skull' },
                ];
            case 'infrastructure':
                return [
                    { name: t('subCategory.infrastructure.damagedLines'), icon: 'git-branch' },
                    { name: t('subCategory.infrastructure.fallenPole'), icon: 'arrow-down-circle' },
                    { name: t('subCategory.infrastructure.brokenBox'), icon: 'cube' },
                ];
            case 'monitoring':
                return [
                    { name: t('subCategory.monitoring.faultyReading'), icon: 'speedometer' },
                    { name: t('subCategory.monitoring.smartMeter'), icon: 'phone-portrait' },
                    { name: t('subCategory.monitoring.connectivity'), icon: 'wifi' },
                ];
            default:
                return [
                    { name: t('subCategory.general.generalIssue'), icon: 'help-circle' },
                    { name: t('subCategory.general.other'), icon: 'ellipsis-horizontal' },
                ];
        }
    };

    const subcategories = getSubcategories(category.id);

    const handleNext = () => {
        if (!description.trim()) {
            setDescError(t('subCategory.validation.describeIssue'));
            return;
        }
        navigation.navigate('LocationSelection', {
            category,
            subCategory: selectedSub,
            description,
            issuePhotos,
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
                const uploadResponse = await FileSystem.uploadAsync(
                    'http://10.48.201.167:8003/api/upload',
                    result.assets[0].uri,
                    {
                        fieldName: 'image',
                        httpMethod: 'POST',
                        uploadType: 1, // 1 represents FileSystemUploadType.MULTIPART
                        mimeType: 'image/jpeg',
                    }
                );

                const uploadData = JSON.parse(uploadResponse.body);
                if (uploadData.success && uploadData.url) {
                    setIssuePhotos([...issuePhotos, uploadData.url]);
                } else {
                    Alert.alert(t('subCategory.validation.uploadFailedTitle'), uploadData.message || t('subCategory.validation.uploadFailedMsg'));
                }
            } catch (err) {
                Alert.alert(t('subCategory.validation.uploadErrorTitle'), `${t('subCategory.validation.uploadErrorMsg')}: ${err.message || 'Unknown network error'}`);
            } finally {
                setUploadingImage(false);
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{category.title}</Text>
                    <Text style={styles.headerSubtitle}>{t('subCategory.ui.selectIssue')}</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Subcategory Cards */}
                {subcategories.map((sub, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.subCard,
                            selectedSub === sub.name && {
                                borderColor: category.color,
                                backgroundColor: category.color + '10',
                            }
                        ]}
                        onPress={() => setSelectedSub(sub.name)}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.subIconContainer,
                            { backgroundColor: (selectedSub === sub.name ? category.color : theme.colors.textMuted) + '15' }
                        ]}>
                            <Ionicons
                                name={sub.icon}
                                size={20}
                                color={selectedSub === sub.name ? category.color : theme.colors.textMuted}
                            />
                        </View>
                        <Text style={[
                            styles.subText,
                            selectedSub === sub.name && { color: category.color, fontWeight: '700' }
                        ]}>
                            {sub.name}
                        </Text>
                        {selectedSub === sub.name && (
                            <Ionicons name="checkmark-circle" size={22} color={category.color} />
                        )}
                    </TouchableOpacity>
                ))}

                {/* Description & CTA */}
                {selectedSub && (
                    <View style={styles.detailsContainer}>
                        <Text style={styles.descLabel}>{t('subCategory.ui.describeLabel')}</Text>
                        <Input
                            placeholder={t('subCategory.ui.describePlaceholder')}
                            value={description}
                            onChangeText={(tInput) => { setDescription(tInput); setDescError(''); }}
                            multiline
                            numberOfLines={4}
                            error={descError}
                        />

                        {/* Photo Upload Section */}
                        <Text style={[styles.descLabel, { marginTop: theme.spacing.md }]}>{t('subCategory.ui.addPhotos')}</Text>
                        <Text style={styles.photoHint}>{t('subCategory.ui.photoHint')}</Text>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                            {issuePhotos.map((photoUrl, index) => (
                                <View key={index} style={styles.photoThumbnailContainer}>
                                    <Image source={{ uri: `http://10.48.201.167:8003${photoUrl}` }} style={styles.photoThumbnail} />
                                    <TouchableOpacity
                                        style={styles.removePhotoBtn}
                                        onPress={() => setIssuePhotos(issuePhotos.filter((_, i) => i !== index))}
                                    >
                                        <Ionicons name="close-circle" size={24} color={theme.colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {issuePhotos.length < 3 && (
                                <TouchableOpacity
                                    style={styles.addPhotoBtn}
                                    onPress={pickImage}
                                    disabled={uploadingImage}
                                >
                                    {uploadingImage ? (
                                        <ActivityIndicator color={theme.colors.primary} />
                                    ) : (
                                        <>
                                            <Ionicons name="camera" size={28} color={theme.colors.primary} />
                                            <Text style={styles.addPhotoText}>{t('subCategory.ui.addPhotoBtn')}</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </ScrollView>

                        <GradientButton
                            title={t('subCategory.ui.continueBtn')}
                            icon="search"
                            onPress={handleNext}
                            style={{ marginTop: theme.spacing.sm }}
                        />
                    </View>
                )}
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
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        padding: theme.spacing.sm,
        marginRight: theme.spacing.sm,
    },
    headerInfo: {},
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
        width: 36,
        height: 36,
        borderRadius: theme.borderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    subText: {
        ...theme.typography.body,
        flex: 1,
    },
    detailsContainer: {
        marginTop: theme.spacing.xl,
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
        backgroundColor: theme.colors.primary + '15',
        borderWidth: 1,
        borderColor: theme.colors.primary + '40',
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
