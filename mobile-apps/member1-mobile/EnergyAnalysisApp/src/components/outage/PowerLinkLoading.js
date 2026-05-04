import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions } from 'react-native';
import { theme } from '../../theme/outage';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

export const PowerLinkLoading = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }),
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
                    <Ionicons name="flash" size={80} color="#FFD700" />
                </Animated.View>
                <Text style={styles.title}>POWER LINK</Text>
                <Text style={styles.subtitle}>Smart Electricity Monitoring</Text>
                <View style={styles.loaderBar}>
                    <Animated.View style={styles.loaderFill} />
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logoContainer: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 4,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: 8,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    loaderBar: {
        width: 200,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        marginTop: 40,
        overflow: 'hidden',
    },
    loaderFill: {
        width: '60%',
        height: '100%',
        backgroundColor: '#FFD700',
        borderRadius: 2,
    }
});

export default PowerLinkLoading;
