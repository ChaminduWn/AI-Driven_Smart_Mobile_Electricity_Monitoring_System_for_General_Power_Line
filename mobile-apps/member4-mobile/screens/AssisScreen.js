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
} from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AssistantScreen = () => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: '⚡ Welcome to the Electricity Safety Assistant!\n\nPUCSL Electricity Guidelines\n\nI can help you with:\n• Electrical hazards\n• Safety procedures\n• Emergency response',
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef();

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const askQuestion = async () => {
    if (!question.trim()) return;

    // Add user message to chat
    const userMessage = {
      type: 'user',
      text: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await fetch('http://172.20.10.2:8000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Format bot response
      let botResponse = `${data.answer}`;
      if (data.hazard_type && data.hazard_type !== 'Unknown') {
        botResponse += `\n\n🚨 Hazard Type: ${data.hazard_type}`;
      }
      if (data.source && data.source !== 'Unknown' && data.source !== 'N/A') {
        botResponse += `\n📚 Source: ${data.source}`;
      }
      if (data.confidence) {
        botResponse += `\n✅ Confidence: ${(data.confidence * 100).toFixed(0)}%`;
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
        text: `⚠️ Connection Error\n\n${error.message}\n\nMake sure the API is running:\n\ncd d:\\AI-Driven_Smart_Mobile_Electricity_Monitoring_System_for_General_Power_Line\\backend\\member4-safety-assistant\\safety_model\n\npython -m uvicorn app:app --reload --port 8000`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (quickQ) => {
    setQuestion(quickQ);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Icon name="lightning-bolt" size={28} color="#FFD700" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Safety Assistant</Text>
            <Text style={styles.headerSubtitle}>PUCSL Electricity Guidelines</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.clearButton}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              msg.type === 'user' ? styles.userBubble : styles.botBubble,
            ]}
          >
            {msg.type === 'bot' && (
              <Icon
                name="lightning-bolt"
                size={20}
                color="#FFD700"
                style={styles.botIcon}
              />
            )}
            <View
              style={[
                styles.bubble,
                msg.type === 'user' ? styles.userMessageStyle : styles.botMessageStyle,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  msg.type === 'user' ? styles.userText : styles.botText,
                ]}
              >
                {msg.text}
              </Text>
              <Text
                style={[
                  styles.timestamp,
                  msg.type === 'user' ? styles.userTimestamp : styles.botTimestamp,
                ]}
              >
                {msg.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Analyzing your question...</Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Questions */}
      {messages.length <= 1 && !loading && (
        <ScrollView
          horizontal
          style={styles.quickQuestionsContainer}
          showsHorizontalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => handleQuickQuestion('What to do if someone is electrocuted?')}
          >
            <Text style={styles.quickButtonText}>⚡ Electrocution</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() =>
              handleQuickQuestion('How do I stay safe around power lines?')
            }
          >
            <Text style={styles.quickButtonText}>🔌 Power Lines</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() =>
              handleQuickQuestion('What are the main electrical hazards?')
            }
          >
            <Text style={styles.quickButtonText}>⚠️ Hazards</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Ask a safety question..."
            placeholderTextColor="#999"
            value={question}
            onChangeText={setQuestion}
            multiline
            maxHeight={100}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={askQuestion}
            disabled={loading || !question.trim()}
          >
            <Icon name="send" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.disclaimer}>
          💡 For guidance, consult a licensed electrician
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#FFD700',
    paddingTop: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFD700',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },
  clearButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  clearText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 12,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#1a1a2e',
  },
  messageBubble: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-end',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  botBubble: {
    justifyContent: 'flex-start',
  },
  botIcon: {
    marginRight: 8,
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  userMessageStyle: {
    backgroundColor: '#FFD700',
    borderBottomRightRadius: 4,
  },
  botMessageStyle: {
    backgroundColor: '#2a2a4e',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#000',
    fontWeight: '500',
  },
  botText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
  },
  userTimestamp: {
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'right',
  },
  botTimestamp: {
    color: '#999',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#aaa',
    fontSize: 14,
  },
  quickQuestionsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#16213e',
    borderTopWidth: 1,
    borderTopColor: '#FFD700',
  },
  quickButton: {
    backgroundColor: '#2a2a4e',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  quickButtonText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '600',
  },
  inputContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#16213e',
    borderTopWidth: 1,
    borderTopColor: '#FFD700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#2a2a4e',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#fff',
  },
  sendButton: {
    backgroundColor: '#FFD700',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default AssistantScreen;