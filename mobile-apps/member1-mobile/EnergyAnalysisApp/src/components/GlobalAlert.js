import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { setAlertListener } from '../utils/alerts';

export const GlobalAlert = () => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({ title: '', message: '', buttons: [] });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setAlertListener((title, message, buttons) => {
      setConfig({ title, message, buttons: buttons || [] });
      setVisible(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });

    return () => { setAlertListener(null); };
  }, [fadeAnim]);

  const close = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setVisible(false);
    });
  };

  const handleButtonPress = (btn) => {
    close();
    if (btn.onPress) {
      setTimeout(() => btn.onPress(), 160);
    }
  };

  if (!visible) return null;

  const activeButtons = config.buttons.length > 0 
    ? config.buttons 
    : [{ text: 'OK', onPress: () => {} }];

  return (
    <Modal transparent visible={visible} onRequestClose={close} animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[
          styles.alertBox, 
          { 
            opacity: fadeAnim, 
            transform: [{ 
              scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) 
            }] 
          }
        ]}>
          <Text style={styles.title}>{config.title}</Text>
          {!!config.message && <Text style={styles.message}>{config.message}</Text>}
          
          <View style={styles.buttonRow}>
            {activeButtons.map((btn, idx) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              return (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.button, isDestructive && styles.btnDestructive, isCancel && styles.btnCancel]} 
                  onPress={() => handleButtonPress(btn)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.buttonText, isDestructive && styles.txtDestructive, isCancel && styles.txtCancel]}>
                    {btn.text || 'OK'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 13, 24, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0D1422',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
  },
  title: {
    color: '#F1F5F9',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: '#94A3B8',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#38BDF8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: '#1E293B',
  },
  btnDestructive: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#060D18',
    fontSize: 15,
    fontWeight: '800',
  },
  txtCancel: {
    color: '#F1F5F9',
  },
  txtDestructive: {
    color: '#FFFFFF',
  },
});
