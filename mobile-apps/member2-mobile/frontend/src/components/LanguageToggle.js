import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

export const LanguageToggle = ({ language = 'EN', onToggle }) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.option, language === 'EN' && styles.activeOption]}
                onPress={() => onToggle('EN')}
            >
                <Text style={[styles.text, language === 'EN' && styles.activeText]}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.option, language === 'SI' && styles.activeOption]}
                onPress={() => onToggle('SI')}
            >
                <Ionicons name="globe-outline" size={14} color={language === 'SI' ? '#FFFFFF' : theme.colors.textMuted} style={{ marginRight: 2 }} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    option: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeOption: {
        backgroundColor: theme.colors.primary,
    },
    text: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.textMuted,
    },
    activeText: {
        color: '#FFFFFF',
    },
});
