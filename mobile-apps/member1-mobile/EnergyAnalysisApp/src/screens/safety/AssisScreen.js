import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { 
  ArrowLeft, 
  Bot, 
  User, 
  Send, 
  Trash2, 
  ShieldAlert, 
  Zap, 
  AlertTriangle, 
  Flame,
  Info
} from 'lucide-react-native';
import api from '../../services/safety/api';
import { COLORS, SPACING, RADIUS, FONTS, SHADOW } from '../../utils/theme';

const AssistantScreen = ({ navigation }) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Welcome to the Electricity Safety Assistant! I can help you with electrical hazards, safety procedures, and emergency response. How can I assist you today?',
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
      
      const botMessage = {
        type: 'bot',
        text: botResponse,
        hazard_type: data.hazard_type,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const botMessage = {
        type: 'bot',
        text: `⚠️ I encountered a connection issue. Please check your network and try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        type: 'bot',
        text: 'Chat cleared. I\'m ready for your next safety question.',
        timestamp: new Date(),
      },
    ]);
  };

  const QuickChip = ({ label, icon: IconComponent, color, q }) => (
    <TouchableOpacity
      style={[styles.quickChip, { borderColor: color + '40', backgroundColor: color + '10' }]}
      onPress={() => askQuestion(q)}
    >
      <IconComponent size={14} color={color} style={{ marginRight: 6 }} />
      <Text style={[styles.quickChipText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* Premium Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitleMain}>Safety AI</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>PUCSL Guidelines</Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
          <Trash2 size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, index) => (
            <View key={index} style={[styles.messageRow, msg.type === 'user' ? styles.userRow : styles.botRow]}>
              {msg.type === 'bot' && (
                <View style={styles.botAvatar}>
                  <Bot size={14} color={COLORS.bg1} />
                </View>
              )}
              <View style={[styles.bubble, msg.type === 'user' ? styles.userBubble : styles.botBubble]}>
                <Text style={[styles.messageText, msg.type === 'user' ? styles.userText : styles.botText]}>
                  {msg.text}
                </Text>
                <Text style={styles.timestamp}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Analysing safety data...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {!loading && messages.length < 5 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestions}>
              <QuickChip icon={ShieldAlert} color={COLORS.dangerLight} label="Electrocution" q="What to do if someone is electrocuted?" />
              <QuickChip icon={Zap} color={COLORS.warningLight} label="Power Lines" q="How do I stay safe around power lines?" />
              <QuickChip icon={AlertTriangle} color={COLORS.secondaryLight} label="Hazards" q="What are the main electrical hazards?" />
              <QuickChip icon={Flame} color={COLORS.heating} label="Fire Safety" q="How to handle an electrical fire?" />
            </ScrollView>
          )}

          <View style={styles.inputArea}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ask a safety question..."
                placeholderTextColor={COLORS.textMuted}
                value={question}
                onChangeText={setQuestion}
                multiline
                maxHeight={100}
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!question.trim() || loading) && styles.sendButtonDisabled]}
                onPress={() => askQuestion()}
                disabled={!question.trim() || loading}
              >
                <Send size={18} color={COLORS.bg1} />
              </TouchableOpacity>
            </View>
            <View style={styles.disclaimerRow}>
              <Info size={10} color={COLORS.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.disclaimer}>Consult a licensed electrician for technical repairs</Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg1 },
  flex: { flex: 1 },
  
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 20,
    backgroundColor: COLORS.bg2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleGroup: { flex: 1, alignItems: 'center' },
  headerTitleMain: { ...FONTS.bold, fontSize: 18, color: COLORS.textPrimary },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success, marginRight: 6 },
  statusText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  backBtn: { padding: 4 },
  clearBtn: { padding: 4 },

  chatArea: { flex: 1 },
  chatContent: { padding: 20, paddingBottom: 40 },
  messageRow: { flexDirection: 'row', marginBottom: 16, maxWidth: '85%' },
  userRow: { alignSelf: 'flex-end' },
  botRow: { alignSelf: 'flex-start' },

  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 4,
    ...SHADOW.sm,
  },

  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    ...SHADOW.sm,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },

  messageText: { fontSize: 15, lineHeight: 22, ...FONTS.regular },
  userText: { color: '#fff', fontWeight: '500' },
  botText: { color: COLORS.textPrimary },

  timestamp: { fontSize: 9, color: COLORS.textMuted, marginTop: 4, textAlign: 'right', opacity: 0.7 },

  loadingRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 40, marginBottom: 20 },
  loadingText: { color: COLORS.textSecondary, fontSize: 13, marginLeft: 10 },

  suggestions: { paddingLeft: 20, marginBottom: 12 },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
  },
  quickChipText: { fontSize: 12, fontWeight: '700' },

  footer: {
    backgroundColor: COLORS.bg1,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
  },
  inputArea: {
    paddingHorizontal: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.bg3,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.md,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    paddingVertical: 12,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    marginLeft: 8,
  },
  sendButtonDisabled: { opacity: 0.4 },
  disclaimerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  disclaimer: { color: COLORS.textMuted, fontSize: 10, fontWeight: '500' },
});

export default AssistantScreen;
