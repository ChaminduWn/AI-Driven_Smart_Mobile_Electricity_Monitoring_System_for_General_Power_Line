import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * A wrapper component that limits the width of its content on larger screens (web/tablet)
 * and centers it, while taking full width on mobile.
 */
export const ResponsiveWrapper = ({ children, maxWidth = 600, style }) => {
    return (
        <View style={[styles.outerContainer, style]}>
            <View style={[styles.innerContainer, { maxWidth }]}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
    },
    innerContainer: {
        width: '100%',
        flex: 1,
    },
});

export default ResponsiveWrapper;
