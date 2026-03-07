import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CATEGORIES = [
    { id: 'power', title: 'Power Supply Issues', icon: 'flash', color: theme.colors.categoryAmber },
    { id: 'voltage', title: 'Voltage & Technical', icon: 'pulse', color: theme.colors.categoryBlue },
    { id: 'safety', title: 'Safety-Related', icon: 'warning', color: theme.colors.categoryRed },
    { id: 'infrastructure', title: 'Infrastructure', icon: 'construct', color: theme.colors.categoryOrange },
    { id: 'monitoring', title: 'Monitoring & Device', icon: 'analytics', color: theme.colors.categoryGreen },
];

const SUBCATEGORIES = {
    power: ['Complete Power Outage', 'Partial Power Outage', 'Intermittent Supply'],
    voltage: ['Low Voltage', 'High Voltage', 'Fluctuating Voltage'],
    safety: ['Sparks from Meter', 'Burning Smell', 'Exposed Wiring'],
    infrastructure: ['Damaged Power Lines', 'Fallen Pole', 'Broken Meter Box'],
    monitoring: ['Faulty Meter Reading', 'Smart Meter Issue', 'Device Connectivity'],
};

export const ElectricianServiceSetupScreen = ({ navigation }) => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [amount, setAmount] = useState('');
    const [saved, setSaved] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!selectedCategory) newErrors.category = 'Select a category';
        if (!selectedSubcategory) newErrors.subcategory = 'Select a subcategory';
        if (!amount.trim()) newErrors.amount = 'Enter service amount';
        else if (isNaN(Number(amount)) || Number(amount) <= 0) newErrors.amount = 'Enter a valid amount';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Service Setup</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Category Selection */}
                <Text style={styles.sectionTitle}>Select Category</Text>
                {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[styles.catCard, selectedCategory === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '10' }]}
                        onPress={() => { setSelectedCategory(cat.id); setSelectedSubcategory(null); setErrors(e => ({ ...e, category: '' })); }}
                    >
                        <View style={[styles.catIcon, { backgroundColor: cat.color + '15' }]}>
                            <Ionicons name={cat.icon} size={20} color={cat.color} />
                        </View>
                        <Text style={[styles.catTitle, selectedCategory === cat.id && { color: cat.color }]}>{cat.title}</Text>
                        {selectedCategory === cat.id && <Ionicons name="checkmark-circle" size={20} color={cat.color} />}
                    </TouchableOpacity>
                ))}

                {/* Subcategory Selection */}
                {selectedCategory && (
                    <>
                        <Text style={styles.sectionTitle}>Select Subcategory</Text>
                        {errors.subcategory && <Text style={styles.errorText}>{errors.subcategory}</Text>}
                        {(SUBCATEGORIES[selectedCategory] || []).map((sub, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.subCard, selectedSubcategory === sub && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '10' }]}
                                onPress={() => { setSelectedSubcategory(sub); setErrors(e => ({ ...e, subcategory: '' })); }}
                            >
                                <Text style={[styles.subText, selectedSubcategory === sub && { color: theme.colors.primary, fontWeight: '700' }]}>{sub}</Text>
                                {selectedSubcategory === sub && <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </>
                )}

                {/* Amount */}
                {selectedSubcategory && (
                    <>
                        <Text style={styles.sectionTitle}>Service Amount</Text>
                        <Input
                            label="Amount (LKR)"
                            value={amount}
                            onChangeText={(t) => { setAmount(t); setErrors(e => ({ ...e, amount: '' })); }}
                            keyboardType="numeric"
                            placeholder="e.g., 1500"
                            prefix="LKR "
                            error={errors.amount}
                        />
                        <Button
                            title={saved ? '✓ Saved!' : 'Save Service'}
                            variant={saved ? 'success' : 'primary'}
                            onPress={handleSave}
                            style={{ marginTop: theme.spacing.sm }}
                        />
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    backButton: { padding: theme.spacing.sm, marginRight: theme.spacing.sm },
    headerTitle: { ...theme.typography.h3 },
    scrollContent: { padding: theme.spacing.lg, paddingBottom: 40 },
    sectionTitle: { ...theme.typography.h3, marginBottom: theme.spacing.sm, marginTop: theme.spacing.lg },
    errorText: { color: theme.colors.danger, fontSize: 12, marginBottom: 4 },
    catCard: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border },
    catIcon: { width: 36, height: 36, borderRadius: theme.borderRadius.sm, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    catTitle: { ...theme.typography.body, flex: 1 },
    subCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border },
    subText: { ...theme.typography.body },
});
