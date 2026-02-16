import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Title, TextInput, Button, Divider } from 'react-native-paper';
import { Calculator, Zap } from 'lucide-react-native';

const TariffCalculator = () => {
    const [units, setUnits] = useState('');
    const [days, setDays] = useState('30');
    const [result, setResult] = useState(null);

    const calculate = () => {
        const u = parseInt(units);
        const d = parseInt(days);
        if (isNaN(u) || isNaN(d)) return;

        // Based on standard SL tariff logic found in backend
        // Simplified for mobile UI demo but represents the logic
        let total = 0;
        if (u <= 30) {
            total = u * 8 + 120;
        } else if (u <= 60) {
            total = (30 * 8) + (u - 30) * 10 + 240;
        } else {
            total = u * 25 + 500; // Simplified average
        }

        setResult({
            energy_charge: total - 500,
            fixed_charge: 500,
            total: total
        });
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.headerCard}>
                <Card.Content>
                    <Title style={styles.whiteText}>Tariff Calculator</Title>
                    <Text style={styles.mutedText}>Estimate your bill based on unit consumption</Text>
                </Card.Content>
            </Card>

            <Card style={styles.formCard}>
                <Card.Content>
                    <TextInput
                        label="Units Consumed (kWh)"
                        value={units}
                        onChangeText={setUnits}
                        keyboardType="numeric"
                        mode="outlined"
                        style={styles.input}
                    />
                    <TextInput
                        label="Number of Days"
                        value={days}
                        onChangeText={setDays}
                        keyboardType="numeric"
                        mode="outlined"
                        style={styles.input}
                    />
                    <Button mode="contained" onPress={calculate} style={styles.button}>
                        Calculate Estimate
                    </Button>
                </Card.Content>
            </Card>

            {result && (
                <Card style={styles.resultCard}>
                    <Card.Content>
                        <Title style={styles.resultTitle}>Bill Estimate</Title>
                        <View style={styles.row}>
                            <Text style={styles.label}>Energy Charge</Text>
                            <Text style={styles.value}>Rs. {result.energy_charge.toFixed(2)}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Fixed Charge</Text>
                            <Text style={styles.value}>Rs. {result.fixed_charge.toFixed(2)}</Text>
                        </View>
                        <Divider style={styles.divider} />
                        <View style={styles.row}>
                            <Title style={styles.totalLabel}>Total Estimate</Title>
                            <Title style={styles.totalValue}>Rs. {result.total.toFixed(2)}</Title>
                        </View>
                    </Card.Content>
                </Card>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827', padding: 16 },
    headerCard: { backgroundColor: '#1F2937', marginBottom: 16, borderRadius: 12 },
    whiteText: { color: '#fff' },
    mutedText: { color: '#9CA3AF' },
    formCard: { backgroundColor: '#1F2937', marginBottom: 20, borderRadius: 16 },
    input: { marginBottom: 16, backgroundColor: '#1F2937' },
    button: { paddingVertical: 4 },
    resultCard: { backgroundColor: '#1F2937', borderRadius: 16, borderTopWidth: 4, borderTopColor: '#10B981' },
    resultTitle: { marginBottom: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    label: { color: '#9CA3AF' },
    value: { color: '#fff', fontWeight: 'bold' },
    divider: { marginVertical: 12, backgroundColor: '#374151' },
    totalLabel: { color: '#fff' },
    totalValue: { color: '#10B981', fontWeight: 'bold' },
});

export default TariffCalculator;
