import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function SimpleCard({ title, children, style }) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8
  },
  content: {
    // content container
  }
});
