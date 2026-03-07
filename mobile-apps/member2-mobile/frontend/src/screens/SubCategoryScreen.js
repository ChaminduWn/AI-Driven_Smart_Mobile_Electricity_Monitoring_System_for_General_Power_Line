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

export const SubCategoryScreen = ({ route, navigation }) => {
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
                    { name: 'Complete Power Outage', icon: 'flash-off' },
                    { name: 'Partial Power Outage', icon: 'flash' },
                    { name: 'Intermittent Supply', icon: 'swap-horizontal' },
                    { name: 'Scheduled Power Cut', icon: 'calendar' },
                    { name: 'Sudden Power Loss', icon: 'thunderstorm' },
                ];
            case 'voltage':
                return [
                    { name: 'Low Voltage', icon: 'trending-down' },
                    { name: 'High Voltage', icon: 'trending-up' },
                    { name: 'Fluctuating Voltage', icon: 'pulse' },
                    { name: 'Dim Lights', icon: 'bulb' },
                ];
            case 'safety':
                return [
                    { name: 'Sparks from Meter', icon: 'flame' },
                    { name: 'Burning Smell', icon: 'alert-circle' },
                    { name: 'Exposed Wiring', icon: 'warning' },
                    { name: 'Electric Shock Risk', icon: 'skull' },
                ];
            case 'infrastructure':
                return [
                    { name: 'Damaged Power Lines', icon: 'git-branch' },
                    { name: 'Fallen Pole', icon: 'arrow-down-circle' },
                    { name: 'Broken Meter Box', icon: 'cube' },
                ];
            case 'monitoring':
                return [
                    { name: 'Faulty Meter Reading', icon: 'speedometer' },
                    { name: 'Smart Meter Issue', icon: 'phone-portrait' },
                    { name: 'Device Connectivity', icon: 'wifi' },
                ];
            default:
                return [
                    { name: 'General Issue', icon: 'help-circle' },
                    { name: 'Other', icon: 'ellipsis-horizontal' },
                ];
        }
    };

    const subcategories = getSubcategories(category.id);

    const handleNext = () => {
        if (!description.trim()) {
            setDescError('Please describe the issue');
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
            return Alert.alert('Limit Reached', 'You can only upload up to 3 photos.');
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
                    'http://192.168.8.101:8003/api/upload',
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
                    Alert.alert('Upload Failed', uploadData.message || 'Failed to upload photo');
                }
            } catch (err) {
                Alert.alert('Upload Error', `Could not reach server to upload the photo: ${err.message || 'Unknown network error'}`);
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
                    <Text style={styles.headerSubtitle}>Select specific issue</Text>
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
                        <Text style={styles.descLabel}>Describe the Issue</Text>
                        <Input
                            placeholder="Tell us more about the problem..."
                            value={description}
                            onChangeText={(t) => { setDescription(t); setDescError(''); }}
                            multiline
                            numberOfLines={4}
                            error={descError}
                        />

                        {/* Photo Upload Section */}
                        <Text style={[styles.descLabel, { marginTop: theme.spacing.md }]}>Add Photos (Optional)</Text>
                        <Text style={styles.photoHint}>A picture of a burnt socket or tripped breaker helps the electrician.</Text>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                            {issuePhotos.map((photoUrl, index) => (
                                <View key={index} style={styles.photoThumbnailContainer}>
                                    <Image source={{ uri: `http://192.168.8.101:8003${photoUrl}` }} style={styles.photoThumbnail} />
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
                                            <Text style={styles.addPhotoText}>Add Photo</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </ScrollView>

                        <GradientButton
                            title="Continue to Location"
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
