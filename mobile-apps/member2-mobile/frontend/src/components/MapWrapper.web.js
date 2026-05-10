// Web fallback: provide stub components so the app doesn't crash
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const PROVIDER_GOOGLE = 'google';

export const MapView = ({ children, style, ...props }) => (
    <View style={[styles.fallback, style]}>
        <Text style={styles.icon}>🗺️</Text>
        <Text style={styles.title}>Map view is not available on web</Text>
        <Text style={styles.subtitle}>Please use the mobile app for map features.</Text>
    </View>
);

export const Marker = () => null;
export const Polyline = () => null;

const styles = StyleSheet.create({
    fallback: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
        padding: 20,
    },
    icon: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        color: '#aaaaaa',
        fontSize: 14,
        textAlign: 'center',
    },
});
