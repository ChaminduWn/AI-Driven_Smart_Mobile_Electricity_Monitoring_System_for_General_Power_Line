import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import storage from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, RADIUS, FONTS } from '../utils/theme';

const DebugStorageScreen = () => {
  const { user, isAuthenticated } = useAuth();
  const [storageContents, setStorageContents] = useState(null);
  const [loading, setLoading] = useState(false);

  const dumpStorage = async () => {
    setLoading(true);
    try {
      console.log('🔍 Dumping storage contents...');
      const result = {
        accessToken: await storage.getItem('accessToken'),
        refreshToken: await storage.getItem('refreshToken'),
        user: await storage.getItem('user'),
        timestamp: new Date().toLocaleTimeString(),
      };
      
      setStorageContents(result);
      console.log('✓ Storage dump:', result);
      Alert.alert('Storage Dumped', 'Check console for details');
    } catch (err) {
      console.error('❌ Error dumping storage:', err);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearStorage = async () => {
    Alert.alert('Clear Storage?', 'This will remove all tokens', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await storage.clear();
            setStorageContents(null);
            Alert.alert('Cleared', 'Storage cleared - you will need to log in again');
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>🔍 Debug Storage</Text>
        
        {/* Auth Status */}
        <View style={styles.card}>
          <Text style={styles.label}>Auth Status</Text>
          <Text style={styles.value}>Is Authenticated: {isAuthenticated ? '✓ YES' : '✗ NO'}</Text>
          <Text style={styles.value}>Has User: {user ? '✓ YES' : '✗ NO'}</Text>
          {user && <Text style={styles.value}>User Email: {user.email}</Text>}
        </View>

        {/* Storage Contents */}
        {storageContents && (
          <View style={styles.card}>
            <Text style={styles.label}>Storage Contents</Text>
            <Text style={[styles.value, { fontSize: 10 }]}>Last Updated: {storageContents.timestamp}</Text>
            
            <Text style={styles.subLabel}>Access Token:</Text>
            {storageContents.accessToken ? (
              <Text style={[styles.value, { fontSize: 10 }]}>
                {storageContents.accessToken.slice(0, 50)}...
                {'\n'}Length: {storageContents.accessToken.length} characters
              </Text>
            ) : (
              <Text style={[styles.value, { color: COLORS.error }]}>❌ NOT FOUND</Text>
            )}

            <Text style={styles.subLabel}>Refresh Token:</Text>
            {storageContents.refreshToken ? (
              <Text style={[styles.value, { fontSize: 10 }]}>
                {storageContents.refreshToken.slice(0, 50)}...
                {'\n'}Length: {storageContents.refreshToken.length} characters
              </Text>
            ) : (
              <Text style={[styles.value, { color: COLORS.error }]}>❌ NOT FOUND</Text>
            )}

            <Text style={styles.subLabel}>User Data:</Text>
            {storageContents.user ? (
              <Text style={[styles.value, { fontSize: 10 }]}>
                {storageContents.user.slice(0, 100)}...
              </Text>
            ) : (
              <Text style={[styles.value, { color: COLORS.error }]}>❌ NOT FOUND</Text>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.cardButton}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: COLORS.primary }]}
            onPress={dumpStorage}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Loading...' : '📥 Dump Storage'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: COLORS.error }]}
            onPress={clearStorage}
          >
            <Text style={styles.buttonText}>🗑️ Clear Storage</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.card}>
          <Text style={styles.label}>What This Does</Text>
          <Text style={styles.info}>
1. Shows your current authentication status{'\n'}
2. Dumps all stored tokens and user data{'\n'}
3. Lets you clear storage if needed{'\n'}
{'\n'}
If you DON'T see tokens after logging in:
• Click "Dump Storage" button
• Check browser console for errors
• Look for red ❌ marks above
• Try clearing storage and logging in again
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
  },
  section: {
    marginTop: SPACING.lg,
  },
  title: {
    ...FONTS.title,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  label: {
    ...FONTS.subheading,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  subLabel: {
    ...FONTS.body,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  value: {
    ...FONTS.body,
    color: COLORS.text,
    marginVertical: SPACING.xs,
    fontFamily: 'monospace',
  },
  info: {
    ...FONTS.body,
    color: COLORS.text,
    lineHeight: 20,
  },
  cardButton: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  button: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  buttonText: {
    ...FONTS.button,
    color: COLORS.surface,
  },
});

export default DebugStorageScreen;
