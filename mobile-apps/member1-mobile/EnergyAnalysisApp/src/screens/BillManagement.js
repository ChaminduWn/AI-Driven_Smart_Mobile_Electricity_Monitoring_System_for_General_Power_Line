import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Button, ActivityIndicator, FAB } from 'react-native-paper';
import { FileText, Upload, ChevronRight, Clock } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import apiClient from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';

const BillManagement = ({ navigation }) => {
    const { user } = useAuth();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const accountNumber = user?.account_number || '123456789';

    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/bills/account/${accountNumber}`);
            if (response.data.success) {
                setBills(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadBill = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
            });

            if (!result.canceled) {
                uploadBill(result.assets[0]);
            }
        } catch (error) {
            console.error('Error picking document:', error);
        }
    };

    const uploadBill = async (asset) => {
        setUploading(true);
        const formData = new FormData();

        try {
            // Web platform handling: Expo DocumentPicker returns a file object or a blob-ready URI on web
            if (asset.file) {
                // Browser-native File object
                formData.append('file', asset.file);
            } else if (asset.uri && asset.uri.startsWith('blob:') || asset.uri.startsWith('data:')) {
                // If we have a blob or data URI, we can fetch it
                const response = await fetch(asset.uri);
                const blob = await response.blob();
                formData.append('file', blob, asset.name || 'bill.pdf');
            } else {
                // Native platform or fallback
                formData.append('file', {
                    uri: asset.uri,
                    name: asset.name,
                    type: asset.mimeType || 'application/pdf',
                });
            }

            const response = await apiClient.post('/bills/extract', formData, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'multipart/form-data'
                },
            });

            if (response.data.success) {
                Alert.alert('Success', 'Bill analyzed successfully!');
                fetchBills();
                // Option to go straight to planning
                Alert.alert(
                    'Analysis Complete',
                    'Would you like to create a budget plan based on this bill?',
                    [
                        { text: 'Later', style: 'cancel' },
                        {
                            text: 'Plan Now',
                            onPress: () => navigation.navigate('BudgetPlanner', { bill: response.data.data, billId: response.data.bill_id })
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Error uploading bill:', error);
            Alert.alert('Upload Failed', 'Failed to extract data from bill.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Title style={styles.header}>Bill History</Title>

                {loading ? (
                    <ActivityIndicator style={{ marginTop: 20 }} color="#3B82F6" />
                ) : bills.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Card.Content style={styles.center}>
                            <FileText size={48} color="#4B5563" />
                            <Text style={styles.emptyText}>No bills uploaded yet</Text>
                            <Button mode="contained" onPress={handleUploadBill} style={styles.emptyButton}>
                                Upload Your First Bill
                            </Button>
                        </Card.Content>
                    </Card>
                ) : (
                    bills.map((bill) => (
                        <TouchableOpacity
                            key={bill.id}
                            onPress={() => navigation.navigate('BudgetPlanner', { billId: bill.id })}
                        >
                            <Card style={styles.billCard}>
                                <Card.Content style={styles.cardContent}>
                                    <View style={styles.iconContainer}>
                                        <FileText color="#3B82F6" size={24} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Title style={styles.whiteText}>
                                            {new Date(bill.bill_date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                        </Title>
                                        <Text style={styles.mutedText}>{bill.units_consumed} Units • Rs. {bill.total_charge}</Text>
                                    </View>
                                    <ChevronRight color="#9CA3AF" />
                                </Card.Content>
                            </Card>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {uploading && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.overlayText}>Extracting Data...</Text>
                </View>
            )}

            <FAB
                icon="upload"
                label="Upload Bill"
                style={styles.fab}
                onPress={handleUploadBill}
                color="white"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    scrollContent: { padding: 16 },
    header: { color: '#fff', marginBottom: 16, fontSize: 24, fontWeight: 'bold' },
    billCard: { backgroundColor: '#1F2937', marginBottom: 12, borderRadius: 12 },
    cardContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    iconContainer: { backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 10, borderRadius: 10 },
    whiteText: { color: '#fff', fontSize: 16 },
    mutedText: { color: '#9CA3AF', fontSize: 13 },
    center: { alignItems: 'center', padding: 40 },
    emptyCard: { backgroundColor: '#1F2937', marginTop: 20 },
    emptyText: { color: '#9CA3AF', marginTop: 16, marginBottom: 20 },
    emptyButton: { backgroundColor: '#3B82F6' },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#3B82F6' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    overlayText: { color: '#fff', marginTop: 12, fontWeight: 'bold' }
});

export default BillManagement;
