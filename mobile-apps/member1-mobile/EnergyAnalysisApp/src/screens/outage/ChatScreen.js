import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme/outage';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../utils/outage/i18nShim';

export const ChatScreen = ({ route, navigation }) => {
    const { t } = useTranslation();
    const { job, otherPartyName } = route.params;
    const { user } = useAuth();

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef(null);

    useEffect(() => {
        // Simulate initial messages
        setLoading(true);
        setTimeout(() => {
            setMessages([
                { id: '1', text: 'Hello, I have arrived at the location.', senderId: 'tech-1', createdAt: new Date().toISOString() },
                { id: '2', text: 'Okay, I am coming out now.', senderId: user?.id, createdAt: new Date().toISOString() }
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    const handleSend = () => {
        if (!inputText.trim()) return;
        const newMessage = {
            id: Date.now().toString(),
            text: inputText,
            senderId: user?.id,
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, newMessage]);
        setInputText('');
    };

    const renderItem = ({ item }) => {
        const isMe = String(item.senderId) === String(user?.id);
        return (
            <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>{item.text}</Text>
                <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>{otherPartyName || 'Chat'}</Text>
                    <Text style={styles.headerSubtitle}>Job ID: {job?.id?.substring(0, 8) || '----'}</Text>
                </View>
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                {loading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1 }} />
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.messageList}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    />
                )}

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Type a message..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && { opacity: 0.5 }]}
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
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface },
    backButton: { padding: 8, marginRight: 8 },
    headerTitle: { fontSize: 16, fontWeight: '700' },
    headerSubtitle: { fontSize: 11, color: theme.colors.textSecondary },
    messageList: { padding: 16 },
    messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 12 },
    myMessage: { alignSelf: 'flex-end', backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 },
    theirMessage: { alignSelf: 'flex-start', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderBottomLeftRadius: 4 },
    messageText: { fontSize: 14 },
    myMessageText: { color: '#FFF' },
    theirMessageText: { color: theme.colors.text },
    timeText: { fontSize: 10, alignSelf: 'flex-end', marginTop: 4, opacity: 0.6 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface },
    textInput: { flex: 1, backgroundColor: theme.colors.background, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, maxHeight: 100 },
    sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
});

export default ChatScreen;
