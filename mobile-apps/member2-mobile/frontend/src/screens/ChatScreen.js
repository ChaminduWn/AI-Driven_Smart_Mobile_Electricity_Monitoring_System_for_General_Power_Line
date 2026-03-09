import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export const ChatScreen = ({ route, navigation }) => {
    const { t } = useTranslation();
    // Both Householders and Electricians can be routed here. We need the active job and the other party's name.
    const { job, otherPartyName } = route.params;
    const { user } = useAuth();

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef(null);

    const fetchMessages = async () => {
        if (!job?.id) return;
        try {
            const response = await fetch(`http://10.48.201.167:8003/api/messages/${job.id}`);
            const data = await response.json();
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Fetch Messages Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        // Simple polling for new messages every 5 seconds (WebSockets would be better for Production)
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [job?.id]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const optimisticMessage = {
            id: Date.now().toString(),
            text: inputText,
            senderId: user.id,
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        setInputText('');

        try {
            await fetch('http://10.48.201.167:8003/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jobId: job.id,
                    text: optimisticMessage.text,
                    senderId: user.id,
                })
            });
            // Re-fetch to ensure sync
            fetchMessages();
        } catch (error) {
            console.error('Send Message Error:', error);
        }
    };

    const renderItem = ({ item }) => {
        // Since we are mocking IDs as strings vs numbers across screens sometimes, use weak equality or cast
        const isMe = String(item.senderId) === String(user?.id);

        return (
            <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                    {item.text}
                </Text>
                <Text style={styles.timeText}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{otherPartyName || t('chat.title')}</Text>
                    <Text style={styles.headerSubtitle}>{t('chat.activeJob')}{job?.id?.substring(0, 5) || '123'}</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                style={styles.chatContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.messageList}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.textMuted} />
                                <Text style={styles.emptyText}>{t('chat.emptyState')}</Text>
                            </View>
                        }
                    />
                )}

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder={t('chat.placeholder')}
                        placeholderTextColor={theme.colors.textMuted}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <Ionicons name="send" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    backButton: {
        padding: theme.spacing.sm,
        marginRight: theme.spacing.sm,
    },
    headerTitle: {
        ...theme.typography.h3,
    },
    headerSubtitle: {
        ...theme.typography.caption,
        marginTop: 2,
    },
    chatContainer: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageList: {
        padding: theme.spacing.md,
        paddingBottom: 24,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: theme.colors.primary,
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        ...theme.typography.body,
        fontSize: 15,
    },
    myMessageText: {
        color: '#FFF',
    },
    theirMessageText: {
        color: theme.colors.text,
    },
    timeText: {
        ...theme.typography.caption,
        fontSize: 10,
        alignSelf: 'flex-end',
        marginTop: 4,
        opacity: 0.7,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        ...theme.typography.body,
        color: theme.colors.textMuted,
        marginTop: 12,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    textInput: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 100,
        ...theme.typography.body,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: theme.spacing.sm,
    },
    sendButtonDisabled: {
        backgroundColor: theme.colors.border,
    },
});
