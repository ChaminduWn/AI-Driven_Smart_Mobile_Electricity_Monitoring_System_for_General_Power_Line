import { Alert, Platform } from 'react-native';

/**
 * A cross-platform alert utility that works on Mobile (via Alert.alert)
 * and Web (via window.confirm/alert).
 */
export const universalAlert = (title, message, buttons = []) => {
    if (Platform.OS === 'web') {
        console.log(`🔔 [Alert] ${title}: ${message}`);

        // If no buttons, just alert
        if (!buttons || buttons.length === 0) {
            window.alert(`${title}\n\n${message}`);
            return;
        }

        // If buttons exist, find the primary/destructive action or fallback to the last one
        // On web, we usually only support two options for simple confirm: OK/Cancel
        const destructiveBtn = buttons.find(b => b.style === 'destructive');
        const defaultBtn = buttons.find(b => b.style !== 'cancel');
        const cancelBtn = buttons.find(b => b.style === 'cancel');

        const mainBtn = destructiveBtn || defaultBtn;

        if (mainBtn && cancelBtn) {
            const confirmed = window.confirm(`${title}\n\n${message}`);
            if (confirmed) {
                if (mainBtn.onPress) mainBtn.onPress();
            } else {
                if (cancelBtn.onPress) cancelBtn.onPress();
            }
        } else if (mainBtn) {
            window.alert(`${title}\n\n${message}`);
            if (mainBtn.onPress) mainBtn.onPress();
        } else {
            window.alert(`${title}\n\n${message}`);
        }
    } else {
        // Mobile
        Alert.alert(title, message, buttons);
    }
};
