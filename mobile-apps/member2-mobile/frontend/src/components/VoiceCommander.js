import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, NativeModules } from 'react-native';
import Voice from '@react-native-voice/voice';

// The Voice JS wrapper is always non-null, but the underlying native module
// (NativeModules.RNVoice) is only available in a real native/development build.
// In Expo Go it is undefined, which causes the 'startSpeech of null' crash.
const isVoiceAvailable = !!NativeModules.RCTVoice;
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';

// ---------------------------------------------------------
// 1. COMMAND & KEYWORD DEFINITIONS
// ---------------------------------------------------------
const COMMANDS = {
    REPORT_OUTAGE: 'REPORT_OUTAGE',
    OPEN_MAP: 'OPEN_MAP',
    MY_REPORTS: 'MY_REPORTS'
};

const KEYWORDS = {
    [COMMANDS.REPORT_OUTAGE]: {
        en: ['power', 'outage', 'report'],
        si: ['විදුලිය', 'නැහැ', 'වාර්තා', 'විදුලිය නැහැ'] // Added exact phrase
    },
    [COMMANDS.OPEN_MAP]: {
        en: ['map', 'open map'],
        si: ['සිතියම', 'සිතියම විවෘත කරන්න']
    },
    [COMMANDS.MY_REPORTS]: {
        en: ['my', 'reports', 'my reports'],
        si: ['මගේ', 'පැමිණිලි', 'මගේ පැමිණිලි'] // Added exact phrase
    }
};

export const VoiceCommander = () => {
    const navigation = useNavigation();
    const [isListening, setIsListening] = useState(false);
    const [spokenText, setSpokenText] = useState('');
    const [detectedLanguage, setDetectedLanguage] = useState('');
    const [isInitializing, setIsInitializing] = useState(true);

    // ---------------------------------------------------------
    // 2. SETUP VOICE RECOGNITION
    // ---------------------------------------------------------
    useEffect(() => {
        // Only set up voice events if the native module is available
        if (!isVoiceAvailable) {
            setIsInitializing(false);
            return;
        }

        const initializeVoice = async () => {
            Voice.onSpeechStart = () => setIsListening(true);
            Voice.onSpeechEnd = () => setIsListening(false);
            Voice.onSpeechResults = onSpeechResults;
            Voice.onSpeechPartialResults = onSpeechPartialResults;
            Voice.onSpeechError = (error) => {
                console.log('Voice Error:', error);
                setIsListening(false);
            };
            setIsInitializing(false);
        };

        initializeVoice();

        // Cleanup when the component is unmounted
        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, []);

    // ---------------------------------------------------------
    // 3. CUSTOM LANGUAGE DETECTION
    // ---------------------------------------------------------
    // Checks if the text contains any Sinhala Unicode characters
    const detectLanguage = (text) => {
        // The Sinhala Unicode block is from 0D80 to 0DFF
        const sinhalaRegex = /[\u0D80-\u0DFF]/;
        return sinhalaRegex.test(text) ? 'si' : 'en';
    };

    // ---------------------------------------------------------
    // 4. COMMAND RECOGNITION LOGIC
    // ---------------------------------------------------------
    const analyzeCommand = (text, language) => {
        const lowercasedText = text.toLowerCase();

        // Loop through all our defined commands
        for (const [commandName, keywordsConfig] of Object.entries(KEYWORDS)) {
            // Get the keywords for the detected language ('en' or 'si')
            const languageKeywords = keywordsConfig[language];

            // Check if the spoken text contains ANY of the keywords
            const hasMatch = languageKeywords.some(keyword =>
                lowercasedText.includes(keyword.toLowerCase())
            );

            if (hasMatch) {
                return commandName; // Return the matching command!
            }
        }

        return null; // Return null if no keywords matched
    };

    // ---------------------------------------------------------
    // 5. PROCESS RESULTS & EXECUTE NAVIGATION
    // ---------------------------------------------------------

    // Optional: Update text as they speak for better UX
    const onSpeechPartialResults = (event) => {
        if (event.value && event.value.length > 0) {
            setSpokenText(event.value[0]);
            // Determine language on the fly
            const tempLang = detectLanguage(event.value[0]);
            setDetectedLanguage(tempLang === 'si' ? 'Sinhala' : 'English');
        }
    };

    const onSpeechResults = (event) => {
        setIsListening(false);

        // event.value contains an array of possible transcriptions. 
        // We take the first one as it is the most confident result.
        if (event.value && event.value.length > 0) {
            const text = event.value[0];
            setSpokenText(text);

            // 1. Detect Language
            const languageCode = detectLanguage(text);
            setDetectedLanguage(languageCode === 'si' ? 'Sinhala' : 'English');

            console.log(`Command Detected [${languageCode}]: ${text}`);

            // 2. Detect Command
            const detectedCommand = analyzeCommand(text, languageCode);

            // 3. Execute Action
            if (detectedCommand === COMMANDS.REPORT_OUTAGE) {
                // Navigate to SubCategory Screen or Householder Location Screen based on your app flow.
                // Assuming "Power Supply Issues" category mapping -> "power"
                Alert.alert("Command Recognized", "Reporting Power Outage", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Continue", onPress: () => navigation.navigate('SubCategory', { category: { id: 'power', title: 'Report Power Outage & Supply Issues', color: theme.colors.categoryAmber } }) }
                ]);
            }
            else if (detectedCommand === COMMANDS.OPEN_MAP) {
                // Navigating to the Available Electricians Map screen (or your intended map)
                Alert.alert("Command Recognized", "Opening Map", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Continue", onPress: () => navigation.navigate('LocationSelection', { category: { id: 'power', title: 'Report Power Outage & Supply Issues', color: theme.colors.categoryAmber }, reason: 'General', issuePhotos: [] }) }
                ]);
            }
            else if (detectedCommand === COMMANDS.MY_REPORTS) {
                // Navigating to the past activities/reports screen
                Alert.alert("Command Recognized", "Opening My Reports", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Continue", onPress: () => navigation.navigate('Activities') }
                ]);
            }
            else {
                Alert.alert('No Command Detected', `We couldn't match a command for:\n\n"${text}"\n\nDetected Language: ${languageCode === 'si' ? 'Sinhala' : 'English'}`);
            }
        }
    };

    // ---------------------------------------------------------
    // 6. UI BUTTON ACTIONS
    // ---------------------------------------------------------
    const startListening = async () => {
        // Voice module is only available in a native/development build, not in Expo Go
        if (!isVoiceAvailable) {
            Alert.alert(
                'Native Build Required',
                'Voice commands require a native development build. This feature is not supported in Expo Go.\n\nTo test voice commands, build the app with:\nnpx expo run:android',
                [{ text: 'OK' }]
            );
            return;
        }
        try {
            setSpokenText('');
            setDetectedLanguage('');
            await Voice.start('');
        } catch (e) {
            console.error(e);
            Alert.alert("Microphone Error", "Failed to start voice recognition. " + e.message);
        }
    };

    const stopListening = async () => {
        try {
            await Voice.stop();
        } catch (e) {
            console.error(e);
        }
    };

    if (isInitializing) {
        return <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 20 }} />;
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.micButton, isListening && styles.micButtonListening]}
                onPress={isListening ? stopListening : startListening}
            >
                <Ionicons
                    name={isListening ? "mic" : "mic-outline"}
                    size={28}
                    color="#fff"
                />
                {isListening && (
                    <Text style={styles.micText}>
                        Listening... Tap to Stop
                    </Text>
                )}
            </TouchableOpacity>

            {spokenText !== '' && (
                <View style={styles.debugBox}>
                    <Text style={styles.debugText}><Text style={styles.boldText}>Language:</Text> {detectedLanguage}</Text>
                    <Text style={styles.debugText}><Text style={styles.boldText}>Heard:</Text> {spokenText}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90, // Positioned above the bottom tab bar mapping
        right: 20,
        alignItems: 'flex-end',
        zIndex: 9999,
        elevation: 10,
    },
    micButton: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 30,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        justifyContent: 'center'
    },
    micButtonListening: {
        backgroundColor: theme.colors.danger,
        paddingHorizontal: 24,
    },
    micText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 12,
    },
    debugBox: {
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        width: '100%',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    debugText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    boldText: {
        fontWeight: '700',
        color: theme.colors.text,
    }
});
