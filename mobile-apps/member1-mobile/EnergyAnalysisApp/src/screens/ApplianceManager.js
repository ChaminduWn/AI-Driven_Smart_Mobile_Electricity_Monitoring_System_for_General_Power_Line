import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Button, Portal, Modal, FAB, ActivityIndicator } from 'react-native-paper';
import { Camera, Trash2, Zap, CheckCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../api/apiClient';
import ApplianceForm from '../components/ApplianceForm';
import { useAuth } from '../contexts/AuthContext';

const ApplianceManager = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [appliances, setAppliances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        appliance_name: '',
        appliance_category: 'Other',
        wattage: '',
        usage_duration_minutes: 60,
        usage_times_per_day: 1,
        usage_frequency: 'daily'
    });

    const accountNumber = user?.account_number || '123456789';

    useEffect(() => {
        fetchAppliances();
    }, []);

    const fetchAppliances = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/appliances/account/${accountNumber}`);
            if (response.data.success) {
                setAppliances(response.data.appliances);
            }
        } catch (error) {
            console.error('Error fetching appliances:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera access is required for scanning.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            recognizeFromImage(result.assets[0]);
        }
    };

    const recognizeFromImage = async (asset) => {
        setScanning(true);
        const apiFormData = new FormData();

        // Create the file object similarly to how it's done in web
        const filename = asset.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        apiFormData.append('file', {
            uri: asset.uri,
            name: filename,
            type: type,
        });

        try {
            const response = await apiClient.post('/appliances/recognize-from-image', apiFormData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                const suggested = response.data.suggested_values;
                setFormData({
                    ...formData,
                    appliance_name: suggested.appliance_name,
                    appliance_category: suggested.appliance_category,
                    wattage: suggested.wattage,
                });
                Alert.alert('Recognition Success', `Appliance: ${suggested.appliance_name}\nWattage: ${suggested.wattage}W`);
            } else {
                Alert.alert('Recognition Failed', response.data.message || 'Could not recognize appliance.');
            }
        } catch (error) {
            console.error('Error in AI scanning:', error);
            Alert.alert('Error', 'Failed to scan image. Please check your connection.');
        } finally {
            setScanning(false);
        }
    };

    const handleAddAppliance = async () => {
        setLoading(true);
        try {
            const response = await apiClient.post('/appliances/', {
                ...formData,
                account_number: accountNumber
            });

            if (response.data.success) {
                Alert.alert('Success', 'Appliance added successfully!');
                setShowAddModal(false);
                setFormData({
                    appliance_name: '',
                    appliance_category: 'Other',
                    wattage: '',
                    usage_duration_minutes: 60,
                    usage_times_per_day: 1,
                    usage_frequency: 'daily'
                });
                fetchAppliances();
            }
        } catch (error) {
            console.error('Error adding appliance:', error);
            Alert.alert('Error', 'Failed to add appliance.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        Alert.alert(
            'Delete Appliance',
            `Are you sure you want to delete ${name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await apiClient.delete(`/appliances/${id}`);
                            if (response.data.success) {
                                fetchAppliances();
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete appliance.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Title style={styles.header}>Energy Monitoring</Title>

                {loading && !showAddModal ? (
                    <ActivityIndicator style={{ marginTop: 20 }} color="#3B82F6" />
                ) : (
                    appliances.map((item) => (
                        <Card key={item.id} style={styles.applianceCard}>
                            <Card.Content style={styles.cardContent}>
                                <View style={{ flex: 1 }}>
                                    <Title style={styles.whiteText}>{item.name}</Title>
                                    <Text style={styles.mutedText}>{item.category} • {item.wattage}W</Text>
                                </View>
                                <View style={styles.rightContent}>
                                    <View style={styles.costContainer}>
                                        <Text style={styles.costText}>Rs. {item.estimated_cost?.toFixed(0)}</Text>
                                        <Text style={styles.subText}>/mo</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.deleteIcon}>
                                        <Trash2 color="#EF4444" size={20} />
                                    </TouchableOpacity>
                                </View>
                            </Card.Content>
                        </Card>
                    ))
                )}
            </ScrollView>

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => setShowAddModal(true)}
                color="white"
            />

            <Portal>
                <Modal
                    visible={showAddModal}
                    onDismiss={() => !loading && setShowAddModal(false)}
                    contentContainerStyle={styles.modal}
                >
                    <ScrollView>
                        <Title style={styles.modalTitle}>Add Appliance</Title>

                        {!formData.appliance_name && !scanning && (
                            <View style={styles.choiceContainer}>
                                <TouchableOpacity style={styles.choiceCard} onPress={handlePickImage} disabled={scanning}>
                                    <View style={[styles.choiceIcon, { backgroundColor: '#8B5CF6' }]}>
                                        <Camera color="#fff" size={32} />
                                    </View>
                                    <Title style={styles.choiceTitle}>AI Scan</Title>
                                    <Text style={styles.choiceSub}>Auto-detect wattage</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.choiceCard} onPress={() => setFormData({ ...formData, appliance_name: ' ' })}>
                                    <View style={[styles.choiceIcon, { backgroundColor: '#3B82F6' }]}>
                                        <Zap color="#fff" size={32} />
                                    </View>
                                    <Title style={styles.choiceTitle}>Manual Entry</Title>
                                    <Text style={styles.choiceSub}>Enter details manually</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {(formData.appliance_name || scanning) && (
                            <>
                                {scanning ? (
                                    <View style={styles.scanningPlaceholder}>
                                        <ActivityIndicator size="large" color="#8B5CF6" />
                                        <Text style={styles.scanningText}>Analyzing image...</Text>
                                    </View>
                                ) : (
                                    <ApplianceForm
                                        formData={formData}
                                        setFormData={setFormData}
                                        onSubmit={handleAddAppliance}
                                        loading={loading}
                                        onCancel={() => {
                                            setFormData({ ...formData, appliance_name: '' });
                                            setShowAddModal(false);
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </ScrollView>
                </Modal>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    scrollContent: { padding: 16 },
    header: { color: '#fff', marginBottom: 16, fontSize: 24, fontWeight: 'bold' },
    applianceCard: { backgroundColor: '#1F2937', marginBottom: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
    cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    whiteText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    mutedText: { color: '#9CA3AF', fontSize: 13, marginTop: 4 },
    rightContent: { alignItems: 'flex-end', gap: 8 },
    costContainer: { alignItems: 'flex-end' },
    costText: { color: '#10B981', fontWeight: 'bold', fontSize: 18 },
    subText: { color: '#9CA3AF', fontSize: 10 },
    deleteIcon: { padding: 4 },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#3B82F6' },
    modal: { backgroundColor: '#fff', padding: 24, margin: 16, borderRadius: 20, maxHeight: '80%' },
    modalTitle: { marginBottom: 16, textAlign: 'center' },
    choiceContainer: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
    choiceCard: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
    choiceIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    choiceTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
    choiceSub: { fontSize: 10, color: '#6B7280', textAlign: 'center' },
    scanningPlaceholder: { padding: 40, alignItems: 'center' },
    scanningText: { marginTop: 16, color: '#4B5563', fontWeight: 'bold' },
    helperText: { color: '#6B7280', fontSize: 12, textAlign: 'center' },
});

export default ApplianceManager;
