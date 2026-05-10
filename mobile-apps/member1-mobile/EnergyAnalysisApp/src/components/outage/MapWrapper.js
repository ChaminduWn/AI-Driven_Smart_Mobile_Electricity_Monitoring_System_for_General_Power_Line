import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme/outage';

export const MapView = ({ children, style, ...props }) => (
    <View style={[style, styles.placeholder]}>
        <Ionicons name="map" size={48} color={theme.colors.border} />
        <Text style={styles.placeholderText}>Map View Placeholder</Text>
        <Text style={styles.placeholderSub}>Live maps require react-native-maps</Text>
        {children}
    </View>
);

export const Marker = ({ children, ...props }) => (
    <View style={styles.markerPlaceholder}>
        <Ionicons name="pin" size={32} color={theme.colors.primary} />
        {children}
    </View>
);

export const Polyline = () => null;
export const PROVIDER_GOOGLE = 'google';

const styles = StyleSheet.create({
    placeholder: {
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: theme.colors.textSecondary,
        marginTop: 12,
        fontWeight: '700',
    },
    placeholderSub: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginTop: 4,
    },
    markerPlaceholder: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -16,
        marginLeft: -16,
    },
});
