import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/safety/api';

// Design Tokens (Original Safety Patterns)
const C = {
  bg: '#1a1a2e',
  card: '#16213e',
  surface: '#2a2a4e',
  accent: '#FFD700',
  textPrimary: '#ffffff',
  textSecondary: '#aaaaaa',
  textMuted: '#999999',
  border: '#FFD700',
};

const AssistantScreen = () => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: '⚡ Welcome to the Electricity Safety Assistant!\n\nI can help you with electrical hazards, safety procedures, and emergency response. How can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef();

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const askQuestion = async (q = null) => {
    const query = q || question;
    if (!query.trim()) return;

    const userMessage = {
      type: 'user',
      text: query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const data = await api.fetchAssistant(query.trim());
      let botResponse = `${data.answer}`;

      if (data.hazard_type && data.hazard_type !== 'Unknown') {
        botResponse += `\n\n🚨 Hazard Type: ${data.hazard_type}`;
      }
      if (data.source && data.source !== 'Unknown' && data.source !== 'N/A') {
        botResponse += `\n🗺️ Source: ${data.source}`;
      }

      const confScore = data.confidence ?? data.confidence_score;
      if (confScore !== undefined && confScore !== null) {
        const conf = typeof confScore === 'number' ? confScore : parseFloat(confScore);
        if (!isNaN(conf)) {
          botResponse += `\n✅ Confidence: ${(conf * 100).toFixed(0)}%`;
        }
      }

      const botMessage = {
        type: 'bot',
        text: botResponse,
        hazard_type: data.hazard_type,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Connection Error:', error);
      const errorMessage = {
        type: 'bot',
        text: `⚠️ Connection Error\n\nPlease ensure the backend is running and try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        type: 'bot',
        text: '⚡ Chat cleared. How can I help you now?',
        timestamp: new Date(),
      },
    ]);
  };

  const QuickChip = ({ label, icon, q }) => (
    <TouchableOpacity
      style={styles.quickChip}
      onPress={() => askQuestion(q)}
    >
      <Text style={styles.quickChipIcon}>{icon}</Text>
      <Text style={styles.quickChipText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconBg}>
              <Icon name="lightning-bolt" size={20} color={C.accent} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Safety AI</Text>
              <Text style={styles.headerStatus}>Online · PUCSL Guidelines</Text>
            </View>
          </View>
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
            <Icon name="delete-sweep-outline" size={22} color={C.accent} />
          </TouchableOpacity>
        </View>

        {/* Chat Area */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.messageRow,
                msg.type === 'user' ? styles.userRow : styles.botRow,
              ]}
            >
              {msg.type === 'bot' && (
                <View style={styles.botAvatar}>
                  <Icon name="robot" size={14} color={C.bg} />
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  msg.type === 'user' ? styles.userBubble : styles.botBubble,
                ]}
              >
                <Text style={[
                  styles.messageText,
                  msg.type === 'user' ? styles.userText : styles.botText,
                ]}>
                  {msg.text}
                </Text>
                <Text style={[
                  styles.timestamp,
                  msg.type === 'user' ? styles.userTimestamp : styles.botTimestamp,
                ]}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={C.accent} />
              <Text style={styles.loadingText}>AI is thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input & Suggestions */}
        <View style={styles.footer}>
          {!loading && messages.length < 5 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestions}>
              <QuickChip icon="⚡" label="Electrocution" q="What to do if someone is electrocuted?" />
              <QuickChip icon="🔌" label="Power Lines" q="How do I stay safe around power lines?" />
              <QuickChip icon="⚠️" label="Main Hazards" q="What are the main electrical hazards?" />
              <QuickChip icon="🔥" label="Fire Safety" q="How to handle an electrical fire?" />
            </ScrollView>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask a safety question..."
              placeholderTextColor={C.textMuted}
              value={question}
              onChangeText={setQuestion}
              multiline
              maxHeight={80}
              editable={!loading}
              underlineColorAndroid="transparent"
              selectionColor={C.accent}
              outlineStyle="none"
            />
            <TouchableOpacity
              style={[styles.sendButton, (!question.trim() || loading) && styles.sendButtonDisabled]}
              onPress={() => askQuestion()}
              disabled={!question.trim() || loading}
            >
              <Icon name="send" size={20} color={C.bg} />
            </TouchableOpacity>
          </View>
          <Text style={styles.disclaimer}>⚡ Consult a licensed electrician for technical repairs</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.accent,
    backgroundColor: C.card,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: { color: C.accent, fontSize: 18, fontWeight: '800' },
  headerStatus: { color: C.textSecondary, fontSize: 11, marginTop: -2 },
  clearBtn: { padding: 4 },

  // Chat Area
  chatArea: { flex: 1 },
  chatContent: { padding: 20 },
  messageRow: { flexDirection: 'row', marginBottom: 16, maxWidth: '85%' },
  userRow: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  botRow: { alignSelf: 'flex-start' },

  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },

  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: C.accent,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.accent,
    borderBottomLeftRadius: 4,
  },

  messageText: { fontSize: 15, lineHeight: 22, color: C.textPrimary },
  userText: { color: '#000', fontWeight: '600' },
  botText: { color: C.textPrimary },

  timestamp: { fontSize: 10, marginTop: 4 },
  userTimestamp: { color: 'rgba(0,0,0,0.5)', textAlign: 'right' },
  botTimestamp: { color: C.textSecondary },

  loadingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  loadingText: { color: C.textSecondary, fontSize: 13, marginLeft: 10 },

  // Suggestions
  suggestions: { marginBottom: 12, paddingLeft: 20 },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.accent,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
  },
  quickChipIcon: { marginRight: 6, fontSize: 14 },
  quickChipText: { color: C.accent, fontSize: 12, fontWeight: '700' },

  // Footer
  footer: {
    paddingBottom: Platform.OS === 'ios' ? 0 : 12,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.accent,
    paddingTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: C.surface,
    marginHorizontal: 20,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.accent,
  },
  input: {
    flex: 1,
    color: C.textPrimary,
    fontSize: 15,
    paddingVertical: 10,
    maxHeight: 100,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    marginLeft: 8,
  },
  sendButtonDisabled: { opacity: 0.5 },
  disclaimer: {
    color: C.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
});

export default AssistantScreen;
