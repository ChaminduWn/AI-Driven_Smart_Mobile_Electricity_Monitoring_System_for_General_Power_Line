import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme/outage';
import { GradientButton } from '../../components/outage/GradientButton';
import { Input } from '../../components/outage/Input';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from '../../utils/outage/i18nShim';
import { VoiceCommandButton } from '../../components/outage/VoiceCommandButton';
import {
    SERVICE_ID_BY_INTENT,
    SERVICE_SUBCATEGORY_INTENTS,
} from '../../voice/outage/intentMappings';

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
    const [loadingServices, setLoadingServices] = useState(false);

    const subcategories = useMemo(
        () => getSubcategories(category.id, t),
        [category.id, t]
    );

    const handleNext = () => {
        if (!selectedSub) return;
        if (!description.trim()) {
            setDescError(t('subCategory.validation.describeIssue'));
            return;
        }
        navigation.navigate('LocationSelection', {
            category,
            subCategory: selectedSub.name,
            description,
            issuePhotos,
            flowType: 'technicianFind',
            service: {
                serviceId: selectedSub.serviceId,
                name: selectedSub.name,
                basePrice: 2500, // Hardcoded for now
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
            setIssuePhotos([...issuePhotos, result.assets[0].uri]);
        }
    };

    const handleVoiceIntent = async ({ intent }) => {
        if (!intent) return false;
        if (intent in SERVICE_ID_BY_INTENT) {
            const nextSub = subcategories.find(s => s.serviceId === SERVICE_ID_BY_INTENT[intent]);
            if (nextSub) { setSelectedSub(nextSub); return true; }
        }
        switch (intent) {
            case 'add_photo': await pickImage(); return true;
            case 'continue_to_location': handleNext(); return true;
            case 'go_back': navigation.goBack(); return true;
            default: return false;
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
                {subcategories.map((sub, index) => {
                    const selected = selectedSub?.serviceId === sub.serviceId;
                    return (
                        <TouchableOpacity
                            key={`${sub.serviceId}-${index}`}
                            style={[styles.subCard, selected && { borderColor: category.color, backgroundColor: `${category.color}10` }]}
                            onPress={() => setSelectedSub(sub)}
                        >
                            <View style={[styles.subIconContainer, { backgroundColor: `${selected ? category.color : theme.colors.textMuted}15` }]}>
                                <Ionicons name={sub.icon} size={20} color={selected ? category.color : theme.colors.textMuted} />
                            </View>
                            <View style={styles.subInfo}>
                                <Text style={[styles.subText, selected && { color: category.color, fontWeight: '700' }]}>{sub.name}</Text>
                                <Text style={styles.subPrice}>Approx. LKR 2,500</Text>
                            </View>
                            <Ionicons name={selected ? "checkmark-circle" : "chevron-forward"} size={20} color={selected ? category.color : theme.colors.textMuted} />
                        </TouchableOpacity>
                    );
                })}

                {selectedSub && (
                    <View style={styles.detailsContainer}>
                        <Text style={styles.descLabel}>{t('subCategory.ui.describeLabel')}</Text>
                        <Input
                            placeholder={t('subCategory.ui.describePlaceholder')}
                            value={description}
                            onChangeText={(input) => { setDescription(input); setDescError(''); }}
                            multiline
                            numberOfLines={4}
                            error={descError}
                        />
                        <GradientButton title={t('subCategory.ui.continueBtn')} icon="search" onPress={handleNext} style={{ marginTop: 20 }} />
                    </View>
                )}
            </ScrollView>
            <VoiceCommandButton allowedIntents={SERVICE_SUBCATEGORY_INTENTS} onIntentMatched={handleVoiceIntent} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    backButton: { padding: 8, marginRight: 8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
    headerSubtitle: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
    scrollContent: { padding: 24, paddingBottom: 40 },
    subCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: theme.colors.surface, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
    subIconContainer: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    subInfo: { flex: 1 },
    subText: { fontSize: 15, color: theme.colors.text },
    subPrice: { fontSize: 11, color: theme.colors.success, fontWeight: '700', marginTop: 4 },
    detailsContainer: { marginTop: 24 },
    descLabel: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
});

export default SubCategoryScreen;
