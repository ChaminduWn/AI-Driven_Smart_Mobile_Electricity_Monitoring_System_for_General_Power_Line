import { Platform } from 'react-native';

let alertListener = null;

export const setAlertListener = (listener) => {
    alertListener = listener;
};

/**
 * A production-level cross-platform alert utility.
 * Triggers the GlobalAlert component rendered at the root level.
 */
export const universalAlert = (title, message, buttons = []) => {
    if (alertListener) {
        alertListener(title, message, buttons);
    } else {
        // Fallback if triggered before React tree is fully mounted
        console.warn(`[Alert Fallback] ${title}: ${message}`);
        if (Platform.OS === 'web') {
            window.alert(`${title}\n\n${message}`);
        }
    }
};
