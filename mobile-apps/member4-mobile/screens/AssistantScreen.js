import React, { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, IconButton, Button, Card } from 'react-native-paper';
import Header from '../components/Header';
import api from '../services/api';

export default function AssistantScreen({ navigation }) {
  const [messages, setMessages] = useState([
    { id: 'm0', from: 'assistant', text: 'Hello — I am your Electrical Safety Assistant. Ask me about wiring, appliances, or safety and I will help.' }
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
      setMessages(prev => [...prev, { id: `e-${Date.now()}`, from: 'assistant', text: `Error: ${errMsg}` }]);
    } finally {
      setLoading(false);
      // scroll to bottom
      setTimeout(() => flatRef.current?.scrollToEnd?.({ animated: true }), 100);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.msgRow, item.from === 'user' ? styles.msgUser : styles.msgAssistant]}>
      <Card style={styles.msgCard}>
        <Card.Content>
          <Text style={item.from === 'user' ? styles.msgUserText : styles.msgAssistantText}>{item.text}</Text>
        </Card.Content>
      </Card>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Header title="Electrical Safety Assistant" leftAction={<IconButton icon="arrow-left" size={20} onPress={() => navigation.goBack()} />} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList ref={flatRef} data={messages} keyExtractor={m => m.id} renderItem={renderItem} contentContainerStyle={styles.list} />

        <View style={styles.inputRow}>
          <TextInput mode="outlined" placeholder="Ask about wiring, safety, or appliances..." value={input} onChangeText={setInput} style={styles.input} right={<TextInput.Icon icon="send" onPress={send} />} />
          <Button mode="contained" onPress={send} loading={loading} style={styles.sendButton}>Send</Button>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 12 },
  msgRow: { marginBottom: 10 },
  msgUser: { alignItems: 'flex-end' },
  msgAssistant: { alignItems: 'flex-start' },
  msgCard: { maxWidth: '85%' },
  msgUserText: { color: '#fff' },
  msgAssistantText: { color: '#111' },
  inputRow: { flexDirection: 'row', padding: 12, alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#eee' },
  input: { flex: 1 },
  sendButton: { marginLeft: 8 }
});