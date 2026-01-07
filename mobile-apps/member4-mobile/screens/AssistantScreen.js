import React, { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, IconButton, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import api from '../services/api';

export default function AssistantScreen({ navigation }) {
  const [messages, setMessages] = useState([
    { id: 'm0', from: 'assistant', text: 'Hello! 👋 I am your Electrical Safety Assistant. Ask me about wiring, appliances, safety tips, or emergency procedures and I will help you stay safe.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatRef = useRef(null);

  const send = async () => {
    const text = (input || '').trim();
    if (!text) return;
    const mid = `u-${Date.now()}`;
    setMessages(prev => [...prev, { id: mid, from: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.fetchAssistant(text);
      const reply = res?.data?.reply ?? res?.message ?? 'No reply from assistant.';
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, from: 'assistant', text: String(reply) }]);
    } catch (err) {
      const errMsg = err?.message ?? 'Assistant request failed';
      setMessages(prev => [...prev, { id: `e-${Date.now()}`, from: 'assistant', text: `Sorry, I encountered an error: ${errMsg}. Please try again.` }]);
    } finally {
      setLoading(false);
      // scroll to bottom
      setTimeout(() => flatRef.current?.scrollToEnd?.({ animated: true }), 100);
    }
  };

  const renderItem = ({ item }) => {
    const isUser = item.from === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgUser : styles.msgAssistant]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          {!isUser && (
            <View style={styles.assistantIcon}>
              <IconButton icon="robot" size={20} iconColor="#0066cc" style={{ margin: 0 }} />
            </View>
          )}
          <Text style={isUser ? styles.msgUserText : styles.msgAssistantText}>{item.text}</Text>
          {isUser && (
            <View style={styles.userIcon}>
              <IconButton icon="account" size={20} iconColor="#fff" style={{ margin: 0 }} />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#f6fbff', '#e6f2ff', '#d6e9ff']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Header 
        title="Safety Assistant" 
        leftAction={<IconButton icon="arrow-left" size={20} onPress={() => navigation.goBack()} />} 
      />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList 
          ref={flatRef} 
          data={messages} 
          keyExtractor={m => m.id} 
          renderItem={renderItem} 
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput 
              mode="outlined" 
              placeholder="Ask about wiring, safety, or appliances..." 
              value={input} 
              onChangeText={setInput}
              style={styles.input}
              outlineColor="#0066cc"
              activeOutlineColor="#0066cc"
              right={
                <TextInput.Icon 
                  icon="send" 
                  onPress={send}
                  iconColor={input.trim() ? '#0066cc' : '#ccc'}
                />
              }
              onSubmitEditing={send}
              returnKeyType="send"
            />
            <Button 
              mode="contained" 
              onPress={send} 
              loading={loading}
              disabled={!input.trim() || loading}
              style={styles.sendButton}
              contentStyle={styles.sendButtonContent}
              labelStyle={styles.sendButtonLabel}
              icon="send"
            >
              Send
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: { 
    padding: 16, 
    paddingBottom: 20,
  },
  msgRow: { 
    marginBottom: 16,
    flexDirection: 'row',
  },
  msgUser: { 
    justifyContent: 'flex-end',
  },
  msgAssistant: { 
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  userBubble: {
    backgroundColor: '#0066cc',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  assistantIcon: {
    marginTop: -2,
  },
  userIcon: {
    marginTop: -2,
  },
  msgUserText: { 
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
  },
  msgAssistantText: { 
    color: '#1a1a1a',
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
  },
  inputContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100, // Extra padding to clear bottom navigation (16 bottom + ~60 nav height + 16 spacing)
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
  },
  input: { 
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    borderRadius: 25,
    backgroundColor: '#0066cc',
    elevation: 2,
  },
  sendButtonContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});