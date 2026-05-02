import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { theme } from '../theme';
import { getBoardReportCategories } from '../data/boardReportCategories';
import { GradientButton } from '../components/GradientButton';
import { buildApiUrl, buildAssetUrl } from '../api';
import { useTranslation } from 'react-i18next';
import { VoiceCommandButton } from '../components/VoiceCommandButton';
import { BOARD_CATEGORY_BY_INTENT, BOARD_REPORT_INTENTS } from '../voice/intentMappings';

export const BoardIssueReportScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const boardReportCategories = useMemo(() => getBoardReportCategories(t), [t]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('transformer');
    const [issuePhotos, setIssuePhotos] = useState([]);
    const [uploadingImage, setUploadingImage] = useState(false);

    const selectedCategory = useMemo(
        () => boardReportCategories.find((item) => item.id === selectedCategoryId) || boardReportCategories[0],
        [boardReportCategories, selectedCategoryId]
    );

    const pickImage = async () => {
        if (issuePhotos.length >= 3) {
            return Alert.alert(t('member2.boardIssue.limitReachedTitle'), t('member2.boardIssue.limitReachedMsg'));
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (result.canceled) {
            return;
        }

        setUploadingImage(true);

        try {
            const uploadResponse = await FileSystem.uploadAsync(
                buildApiUrl('/upload'),
                result.assets[0].uri,
                {
                    fieldName: 'image',
                    httpMethod: 'POST',
                    uploadType: 1,
                    mimeType: 'image/jpeg',
                }
            );

            const uploadData = JSON.parse(uploadResponse.body);

            if (uploadData.success && uploadData.url) {
                setIssuePhotos((current) => [...current, uploadData.url]);
                return;
            }

            Alert.alert(t('member2.boardIssue.uploadFailedTitle'), uploadData.message || t('member2.boardIssue.uploadFailedMsg'));
        } catch (error) {
            Alert.alert(
                t('member2.boardIssue.uploadErrorTitle'),
                t('member2.boardIssue.uploadErrorMsg', { message: error.message || 'Unknown network error' })
            );
        } finally {
            setUploadingImage(false);
        }
    };

    const handleContinue = () => {
        navigation.navigate('LocationSelection', {
            flowType: 'boardReport',
            category: selectedCategory,
            issuePhotos,
        });
    };

    const handleVoiceIntent = async ({ intent }) => {
        if (!intent) {
            return false;
        }

        if (intent in BOARD_CATEGORY_BY_INTENT) {
            setSelectedCategoryId(BOARD_CATEGORY_BY_INTENT[intent]);
            return true;
        }

        switch (intent) {
            case 'add_photo':
                await pickImage();
                return true;
            case 'continue_next':
            case 'continue_to_location':
                handleContinue();
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
                <View style={styles.headerTextWrap}>
                    <Text style={styles.headerTitle}>{t('member2.boardIssue.headerTitle')}</Text>
                    <Text style={styles.headerSubtitle}>{t('member2.boardIssue.headerSubtitle')}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.introCard}>
                    <View style={styles.introIcon}>
                        <Ionicons name="business" size={24} color={theme.colors.warning} />
                    </View>
                    <View style={styles.introTextWrap}>
                        <Text style={styles.introTitle}>{t('member2.boardIssue.introTitle')}</Text>
                        <Text style={styles.introSubtitle}>{t('member2.boardIssue.introSubtitle')}</Text>
                    </View>
                </View>

                {boardReportCategories.map((category) => {
                    const isSelected = category.id === selectedCategoryId;

                    return (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.categoryCard,
                                isSelected && {
                                    borderColor: category.color,
                                    backgroundColor: `${category.color}12`,
                                },
                            ]}
                            activeOpacity={0.85}
                            onPress={() => setSelectedCategoryId(category.id)}
                        >
                            <View style={styles.categoryHeader}>
                                <View style={[styles.categoryIcon, { backgroundColor: `${category.color}18` }]}>
                                    <Ionicons name={category.icon} size={20} color={category.color} />
                                </View>
                                <View style={styles.categoryTextWrap}>
                                    <Text style={[styles.categoryTitle, isSelected && { color: category.color }]}>
                                        {category.title}
                                    </Text>
                                    <Text style={styles.categoryHint}>
                                        {isSelected ? t('member2.boardIssue.selectedHint') : t('member2.boardIssue.tapHint')}
                                    </Text>
                                </View>
                                <Ionicons
                                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                                    size={22}
                                    color={isSelected ? category.color : theme.colors.textMuted}
                                />
                            </View>

                            <View style={styles.pointsList}>
                                {category.points.map((point) => (
                                    <View key={point} style={styles.pointRow}>
                                        <Ionicons name="ellipse" size={8} color={isSelected ? category.color : theme.colors.textSecondary} />
                                        <Text style={styles.pointText}>{point}</Text>
                                    </View>
                                ))}
                            </View>
                        </TouchableOpacity>
                    );
                })}

                <View style={styles.photoSection}>
                    <Text style={styles.photoTitle}>{t('member2.boardIssue.photoTitle')}</Text>
                    <Text style={styles.photoSubtitle}>{t('member2.boardIssue.photoSubtitle')}</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoScroller}>
                        {issuePhotos.map((photoUrl, index) => (
                            <View key={`${photoUrl}-${index}`} style={styles.photoThumbWrap}>
                                <Image source={{ uri: buildAssetUrl(photoUrl) }} style={styles.photoThumb} />
                                <TouchableOpacity
                                    style={styles.removePhotoButton}
                                    onPress={() => setIssuePhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                                >
                                    <Ionicons name="close-circle" size={24} color={theme.colors.danger} />
                                </TouchableOpacity>
                            </View>
                        ))}

                        {issuePhotos.length < 3 && (
                            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage} disabled={uploadingImage}>
                                {uploadingImage ? (
                                    <ActivityIndicator color={theme.colors.primary} />
                                ) : (
                                    <>
                                        <Ionicons name="camera" size={28} color={theme.colors.primary} />
                                        <Text style={styles.addPhotoText}>{t('member2.boardIssue.addPhoto')}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>

                <GradientButton
                    title={t('member2.boardIssue.continue')}
                    icon="arrow-forward"
                    iconRight="navigate"
                    onPress={handleContinue}
                    style={styles.continueButton}
                />
            </ScrollView>

            <VoiceCommandButton
                allowedIntents={BOARD_REPORT_INTENTS}
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
    },
    scrollContent: {
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xxl,
    },
    introCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
    },
    introIcon: {
        width: 46,
        height: 46,
        borderRadius: theme.borderRadius.md,
        backgroundColor: `${theme.colors.warning}18`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    introTextWrap: {
        flex: 1,
    },
    introTitle: {
        ...theme.typography.h3,
        marginBottom: 4,
    },
    introSubtitle: {
        ...theme.typography.bodySmall,
        lineHeight: 20,
    },
    categoryCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm + 2,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryIcon: {
        width: 42,
        height: 42,
        borderRadius: theme.borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    categoryTextWrap: {
        flex: 1,
    },
    categoryTitle: {
        ...theme.typography.body,
        fontWeight: '700',
    },
    categoryHint: {
        ...theme.typography.caption,
        marginTop: 2,
    },
    pointsList: {
        marginTop: theme.spacing.md,
        paddingLeft: 4,
        gap: 8,
    },
    pointRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    pointText: {
        ...theme.typography.bodySmall,
        flex: 1,
        marginLeft: 10,
        lineHeight: 18,
    },
    photoSection: {
        marginTop: theme.spacing.xl,
    },
    photoTitle: {
        ...theme.typography.h3,
        marginBottom: theme.spacing.xs,
    },
    photoSubtitle: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
        lineHeight: 18,
    },
    photoScroller: {
        paddingRight: theme.spacing.md,
    },
    addPhotoButton: {
        width: 110,
        height: 110,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: `${theme.colors.primary}55`,
        backgroundColor: `${theme.colors.primary}12`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.sm,
    },
    addPhotoText: {
        ...theme.typography.caption,
        color: theme.colors.primary,
        fontWeight: '700',
        marginTop: 6,
    },
    photoThumbWrap: {
        marginRight: theme.spacing.sm,
        position: 'relative',
    },
    photoThumb: {
        width: 110,
        height: 110,
        borderRadius: theme.borderRadius.lg,
    },
    removePhotoButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FFFFFF',
        borderRadius: theme.borderRadius.full,
    },
    continueButton: {
        marginTop: theme.spacing.xl,
    },
});
