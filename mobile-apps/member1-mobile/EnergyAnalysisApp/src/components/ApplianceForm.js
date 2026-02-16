import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, SegmentedButtons, HelperText, Text } from 'react-native-paper';

const ApplianceForm = ({ formData, setFormData, onSubmit, loading, onCancel }) => {
    return (
        <View style={styles.container}>
            <TextInput
                label="Appliance Name *"
                value={formData.appliance_name}
                onChangeText={(text) => setFormData({ ...formData, appliance_name: text })}
                style={styles.input}
                mode="outlined"
            />

            <TextInput
                label="Wattage (W) *"
                value={formData.wattage?.toString()}
                onChangeText={(text) => setFormData({ ...formData, wattage: parseInt(text) || '' })}
                keyboardType="numeric"
                style={styles.input}
                mode="outlined"
            />

            <TextInput
                label="Usage (minutes per time) *"
                value={formData.usage_duration_minutes?.toString()}
                onChangeText={(text) => setFormData({ ...formData, usage_duration_minutes: parseInt(text) || '' })}
                keyboardType="numeric"
                style={styles.input}
                mode="outlined"
            />

            <TextInput
                label="Times per day *"
                value={formData.usage_times_per_day?.toString()}
                onChangeText={(text) => setFormData({ ...formData, usage_times_per_day: parseInt(text) || '' })}
                keyboardType="numeric"
                style={styles.input}
                mode="outlined"
            />

            <Text style={styles.label}>Frequency</Text>
            <SegmentedButtons
                value={formData.usage_frequency}
                onValueChange={(value) => setFormData({ ...formData, usage_frequency: value })}
                buttons={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                ]}
                style={styles.segmented}
            />

            <View style={styles.actions}>
                <Button mode="outlined" onPress={onCancel} style={styles.button}>
                    Cancel
                </Button>
                <Button
                    mode="contained"
                    onPress={onSubmit}
                    loading={loading}
                    disabled={loading || !formData.appliance_name || !formData.wattage}
                    style={styles.button}
                >
                    Add Appliance
                </Button>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingVertical: 10 },
    input: { marginBottom: 12 },
    label: { marginBottom: 8, color: '#4B5563', fontSize: 14 },
    segmented: { marginBottom: 16 },
    actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
    button: { flex: 1 },
});

export default ApplianceForm;
