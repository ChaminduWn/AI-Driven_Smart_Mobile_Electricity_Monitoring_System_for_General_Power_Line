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
import * as FileSystem from 'expo-file-system';
import { theme } from '../../theme/outage';
import { getBoardReportCategories } from '../../data/outage/boardReportCategories';
import { GradientButton } from '../../components/outage/GradientButton';
import { useTranslation } from '../../utils/outage/i18nShim';
import { VoiceCommandButton } from '../../components/outage/VoiceCommandButton';
import { BOARD_CATEGORY_BY_INTENT, BOARD_REPORT_INTENTS } from '../../voice/outage/intentMappings';

// Mock API functions for now
const buildApiUrl = (path) => `http://YOUR_SERVER_IP:8000${path}`;
const buildAssetUrl = (url) => url;

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
            // Placeholder upload logic
            // In a real app, use axios to upload to your backend
            setIssuePhotos((current) => [...current, result.assets[0].uri]);
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
        if (!intent) return false;

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
                                {Array.isArray(category.points) && category.points.map((point) => (
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
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTextWrap: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
    },
    headerSubtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 48,
    },
    introCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.colors.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 24,
        marginBottom: 24,
    },
    introIcon: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: `${theme.colors.warning}18`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    introTextWrap: {
        flex: 1,
    },
    introTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 4,
    },
    introSubtitle: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        lineHeight: 20,
    },
    categoryCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 16,
        marginBottom: 10,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    categoryTextWrap: {
        flex: 1,
    },
    categoryTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text,
    },
    categoryHint: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    pointsList: {
        marginTop: 16,
        paddingLeft: 4,
        gap: 8,
    },
    pointRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    pointText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        flex: 1,
        marginLeft: 10,
        lineHeight: 18,
    },
    photoSection: {
        marginTop: 32,
    },
    photoTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 4,
    },
    photoSubtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 16,
        lineHeight: 18,
    },
    photoScroller: {
        paddingRight: 16,
    },
    addPhotoButton: {
        width: 110,
        height: 110,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: `${theme.colors.primary}55`,
        backgroundColor: `${theme.colors.primary}12`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    addPhotoText: {
        fontSize: 12,
        color: theme.colors.primary,
        fontWeight: '700',
        marginTop: 6,
    },
    photoThumbWrap: {
        marginRight: 8,
        position: 'relative',
    },
    photoThumb: {
        width: 110,
        height: 110,
        borderRadius: 16,
    },
    removePhotoButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FFFFFF',
        borderRadius: 999,
    },
    continueButton: {
        marginTop: 32,
    },
});

export default BoardIssueReportScreen;
