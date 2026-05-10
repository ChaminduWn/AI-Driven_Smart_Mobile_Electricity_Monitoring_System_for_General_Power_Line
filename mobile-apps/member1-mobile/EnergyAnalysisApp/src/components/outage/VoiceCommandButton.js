import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    PermissionsAndroid,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../../utils/outage/i18nShim';
// Note: Adjusted API import if needed. Using a relative path for now.
// In Member 1, the API might be in ../../api/authAPI or similar.
// For now, I'll assume buildApiUrl is available or I'll mock it.
import { theme } from '../../theme/outage';
import { normalizeVoiceTranscript, resolveLocalVoiceIntent } from '../../voice/outage/intentMappings';

const getVoiceCopy = (language = 'en') => {
    if (language === 'si') {
        return {
            fabLabel: 'හඬ',
            listening: 'සවන් දෙමින්...',
            processing: 'විවෘත කරමින්...',
            ready: 'උදාහරණය: "report electricity board"',
            tapToSpeak: 'මයික් සක්‍රියයි. දැන් ඔබගේ විධානය කියන්න.',
            permissionTitle: 'මයික් අවසරය අවශ්‍යයි',
            permissionMsg: 'හඬ විධාන භාවිතා කිරීමට මයික් අවසරය ලබා දෙන්න.',
            unavailableTitle: 'හඬ හඳුනාගැනීම ලබාගත නොහැක',
            unavailableMsg: 'මෙම උපාංගයේ හඬ හඳුනාගැනීම දැන් නොමැත.',
            failedTitle: 'හඬ විධානය අසාර්ථකයි',
            noMatchTitle: 'විධානය ගැළපුණේ නැත',
            noMatchMsg: 'මෙම තිරයේ එම විධානය භාවිතා කළ නොහැක.',
            heardFallback: 'ශබ්දය පැහැදිලිව ලැබුණේ නැත. නැවත උත්සාහ කරන්න.',
            lastHeard: 'ඇසුණු විධානය',
        };
    }

    return {
        fabLabel: 'Voice',
        listening: 'Listening...',
        processing: 'Opening...',
        ready: 'Example: "select report electricity board"',
        tapToSpeak: 'Mic is on. Speak your command now.',
        permissionTitle: 'Microphone permission required',
        permissionMsg: 'Please allow microphone access to use voice commands.',
        unavailableTitle: 'Speech recognition unavailable',
        unavailableMsg: 'Speech recognition is not available on this device right now.',
        failedTitle: 'Voice command failed',
        noMatchTitle: 'Command not matched',
        noMatchMsg: 'That command is not available on this screen.',
        heardFallback: 'Speech was not captured clearly. Please try again.',
        lastHeard: 'Heard',
    };
};

const getSpeechErrorMessage = (event, copy) => {
    const error = event?.error;
    const message = String(error?.message || '').trim();
    const code = String(error?.code || '').trim();
    const normalizedMessage = message.toLowerCase();

    if (
        code === '7' ||
        normalizedMessage.includes('no match') ||
        normalizedMessage.includes('no speech')
    ) {
        return copy.heardFallback;
    }

    return message || copy.heardFallback;
};

const isRecoverableSpeechError = (event) => {
    const error = event?.error;
    const message = String(error?.message || '').trim().toLowerCase();
    const code = String(error?.code || '').trim();

    return (
        code === '7' ||
        message.includes('no match') ||
        message.includes('no speech')
    );
};

const getLocaleForLanguage = (language = 'en') => {
    if (Platform.OS === 'android') {
        return language === 'si' ? 'si-LK' : 'en-IN';
    }
    return language === 'si' ? 'si-LK' : 'en-US';
};

export const VoiceCommandButton = ({
    allowedIntents = [],
    onIntentMatched,
    disabled = false,
    disableBackendFallback = false,
    style,
}) => {
    const { i18n } = useTranslation();
    const copy = useMemo(() => getVoiceCopy(i18n.language), [i18n.language]);
    const [speechAvailable, setSpeechAvailable] = useState(true);
    const [listening, setListening] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [speechError, setSpeechError] = useState('');
    const processingRef = useRef(false);
    const handledTranscriptRef = useRef('');
    const partialTranscriptOptionsRef = useRef([]);

    useEffect(() => {
        const submitTranscript = async (values) => {
            const transcriptOptions = [
                ...new Set(
                    (Array.isArray(values) ? values : [values])
                        .map((value) => String(value || '').trim())
                        .filter(Boolean)
                ),
            ];

            const nextTranscript = transcriptOptions[0] || '';
            if (!nextTranscript || processingRef.current || handledTranscriptRef.current === nextTranscript) {
                return;
            }

            handledTranscriptRef.current = nextTranscript;
            partialTranscriptOptionsRef.current = [];
            setTranscript(nextTranscript);
            setSpeechError('');

            try {
                await Voice.stop();
            } catch (_error) {}

            try {
                processingRef.current = true;
                setProcessing(true);

                const localMatchTranscript = transcriptOptions.find((option) =>
                    resolveLocalVoiceIntent(option, allowedIntents)
                );
                const localIntent = localMatchTranscript
                    ? resolveLocalVoiceIntent(localMatchTranscript, allowedIntents)
                    : null;

                if (localIntent) {
                    const data = {
                        success: true,
                        transcript: localMatchTranscript,
                        transcripts: transcriptOptions,
                        matchedTranscript: localMatchTranscript,
                        normalizedText: normalizeVoiceTranscript(localMatchTranscript),
                        intent: localIntent,
                        confidence: 1,
                        alternatives: [{ intent: localIntent, confidence: 1 }],
                    };
                    const handled = await onIntentMatched?.(data);
                    if (handled === false) {
                        Alert.alert(copy.noMatchTitle, copy.noMatchMsg);
                    }
                } else {
                    // Backend fallback disabled for now in Member 1 integration unless specifically needed
                    Alert.alert(copy.noMatchTitle, copy.noMatchMsg);
                }
            } catch (error) {
                setSpeechError(error.message || copy.failedTitle);
                Alert.alert(copy.failedTitle, error.message || copy.failedTitle);
            } finally {
                processingRef.current = false;
                setProcessing(false);
                setListening(false);
            }
        };

        Voice.onSpeechStart = () => {
            setListening(true);
            setSpeechError('');
        };

        Voice.onSpeechEnd = () => {
            setListening(false);
            if (!processingRef.current && partialTranscriptOptionsRef.current.length > 0) {
                submitTranscript(partialTranscriptOptionsRef.current);
            }
        };

        Voice.onSpeechResults = (event) => {
            const nextTranscripts = event?.value || [];
            if (nextTranscripts.length > 0) {
                partialTranscriptOptionsRef.current = nextTranscripts;
                submitTranscript(nextTranscripts);
            }
        };

        Voice.onSpeechPartialResults = (event) => {
            const nextTranscripts = (event?.value || [])
                .map((value) => String(value || '').trim())
                .filter(Boolean);
            const nextTranscript = nextTranscripts[0] || '';
            if (nextTranscript) {
                partialTranscriptOptionsRef.current = nextTranscripts;
                setTranscript(nextTranscript);
            }
        };

        Voice.onSpeechError = (event) => {
            setListening(false);
            if (!processingRef.current && partialTranscriptOptionsRef.current.length > 0 && isRecoverableSpeechError(event)) {
                submitTranscript(partialTranscriptOptionsRef.current);
                return;
            }
            const message = getSpeechErrorMessage(event, copy);
            setSpeechError(message);
        };

        Voice.isAvailable()
            .then((available) => setSpeechAvailable(Boolean(available)))
            .catch(() => setSpeechAvailable(false));

        return () => {
            Voice.destroy()
                .then(Voice.removeAllListeners)
                .catch(() => {});
        };
    }, [allowedIntents, copy, disableBackendFallback, onIntentMatched]);

    const requestMicrophonePermission = async () => {
        if (Platform.OS !== 'android') return true;
        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        return result === PermissionsAndroid.RESULTS.GRANTED;
    };

    const handlePress = async () => {
        if (disabled || processing) return;
        if (!speechAvailable) {
            Alert.alert(copy.unavailableTitle, copy.unavailableMsg);
            return;
        }
        if (listening) {
            try {
                await Voice.stop();
            } catch (_error) {
            } finally {
                setListening(false);
            }
            return;
        }

        try {
            const granted = await requestMicrophonePermission();
            if (!granted) {
                Alert.alert(copy.permissionTitle, copy.permissionMsg);
                return;
            }
            handledTranscriptRef.current = '';
            partialTranscriptOptionsRef.current = [];
            setTranscript('');
            setSpeechError('');
            setListening(true);
            setTranscript(copy.tapToSpeak);
            await Voice.start(getLocaleForLanguage(i18n.language));
        } catch (error) {
            setListening(false);
            Alert.alert(copy.unavailableTitle, error.message || copy.unavailableMsg);
        }
    };

    const statusText = processing
        ? copy.processing
        : listening
            ? copy.listening
            : speechError
                ? speechError
                : transcript
                    ? `${copy.lastHeard}: ${transcript}`
                    : copy.ready;

    return (
        <View pointerEvents="box-none" style={styles.wrap}>
            <View pointerEvents="none" style={styles.statusWrap}>
                <Text style={styles.statusText}>{statusText}</Text>
            </View>

            <TouchableOpacity
                style={[
                    styles.fab,
                    listening && styles.fabListening,
                    processing && styles.fabProcessing,
                    disabled && styles.fabDisabled,
                    style,
                ]}
                onPress={handlePress}
                activeOpacity={0.88}
                disabled={disabled}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
                <View style={styles.iconWrap}>
                    {processing ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Ionicons name={listening ? 'radio' : 'mic'} size={22} color="#FFFFFF" />
                    )}
                </View>
                <Text style={styles.fabText}>
                    {processing ? copy.processing : listening ? copy.listening : copy.fabLabel}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        right: 20,
        bottom: Platform.OS === 'android' ? 84 : 36,
        alignItems: 'flex-end',
        zIndex: 9999,
        elevation: 30,
    },
    statusWrap: {
        maxWidth: 250,
        marginBottom: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        ...theme.shadows.md,
    },
    statusText: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        lineHeight: 18,
    },
    fab: {
        minWidth: 118,
        height: 56,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
        borderWidth: 1,
        borderColor: theme.colors.primaryLight,
        ...theme.shadows.lg,
        zIndex: 10000,
        elevation: 31,
    },
    fabListening: {
        backgroundColor: theme.colors.success,
        borderColor: theme.colors.success,
    },
    fabProcessing: {
        minWidth: 140,
    },
    fabDisabled: {
        opacity: 0.55,
    },
    iconWrap: {
        width: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
    },
    fabText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});
