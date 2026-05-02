import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { theme } from '../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

export const Input = ({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    prefix,
    error,
    keyboardType,
    autoCapitalize,
    multiline,
    numberOfLines,
    editable = true,
    style,
    containerStyle,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const showEyeIcon = secureTextEntry !== undefined && secureTextEntry !== false;

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={[styles.label, isFocused && styles.labelFocused]}>{label}</Text>}
            <View style={[
                styles.inputContainer,
                isFocused && styles.inputFocused,
                error && styles.inputError,
                !editable && styles.inputDisabled,
            ]}>
                {prefix && (
                    <Text style={styles.prefix}>{prefix}</Text>
                )}
                <TextInput
                    style={[
                        styles.input,
                        multiline && { height: numberOfLines ? numberOfLines * 22 : 100, textAlignVertical: 'top', paddingTop: 12 },
                        style,
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.textMuted}
                    secureTextEntry={showEyeIcon ? !isPasswordVisible : false}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    editable={editable}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />
                {showEyeIcon && (
                    <TouchableOpacity
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        style={styles.eyeButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
                            size={20}
                            color={theme.colors.textMuted}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.md,
    },
    label: {
        ...theme.typography.label,
        marginBottom: 6,
    },
    labelFocused: {
        color: theme.colors.primary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.inputBackground,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: theme.spacing.md,
    },
    inputFocused: {
        borderColor: theme.colors.primary,
    },
    inputError: {
        borderColor: theme.colors.danger,
    },
    inputDisabled: {
        opacity: 0.6,
    },
    prefix: {
        color: theme.colors.textMuted,
        fontWeight: '600',
        fontSize: 15,
        marginRight: 4,
    },
    input: {
        flex: 1,
        color: theme.colors.text,
        paddingVertical: 14,
        fontSize: 15,
    },
    eyeButton: {
        padding: 4,
        marginLeft: 8,
    },
    errorText: {
        color: theme.colors.danger,
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
});
