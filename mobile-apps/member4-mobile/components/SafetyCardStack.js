import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;

export default function SafetyCardStack({ items: initialItems = [], onComplete }) {
  const [items, setItems] = useState(initialItems);
  const translate = useRef(new Animated.Value(0)).current;
  const position = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 6,
      onPanResponderGrant: () => {
        position.setOffset({ x: position.x._value, y: 0 });
        position.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: position.x }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        position.flattenOffset();
        const dx = gesture.dx;
        if (dx > SWIPE_THRESHOLD) {
          // swiped right - save
          Animated.timing(position.x, { toValue: width, duration: 250, useNativeDriver: false }).start(() => removeTop('saved'));
        } else if (dx < -SWIPE_THRESHOLD) {
          // swiped left - dismiss
          Animated.timing(position.x, { toValue: -width, duration: 250, useNativeDriver: false }).start(() => removeTop('dismissed'));
        } else {
          Animated.spring(position.x, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const removeTop = (action) => {
    setItems(prev => {
      const [, ...rest] = prev;
      if (rest.length === 0 && onComplete) onComplete(action);
      return rest;
    });
    position.setValue({ x: 0, y: 0 });
  };

  if (!items.length) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: '#666' }}>No safety actions</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {items.slice(0, 4).map((it, idx) => {
        const isTop = idx === 0;
        const zIndex = items.length - idx;
        const scale = 1 - idx * 0.04;
        const opacity = 1 - idx * 0.12;
        const animatedStyle = isTop ? { transform: position.getTranslateTransform() } : { transform: [{ scale }], opacity };

        return (
          <Animated.View key={it.id} style={[styles.card, animatedStyle, { zIndex, left: 0, position: 'absolute' }]} {...(isTop ? panResponder.panHandlers : {})}>
            <Text style={styles.title}>{it.title}</Text>
            <Text style={styles.body}>{it.body}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => removeTop('done')}>
                <Text style={{ color: '#fff' }}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.ghost]} onPress={() => removeTop('remind')}>
                <Text>Remind Later</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.ghost]} onPress={() => removeTop('share')}>
                <Text>Share</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        );
      }).reverse()}
    </View>
  );
}

SafetyCardStack.propTypes = {
  items: PropTypes.array,
  onComplete: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { height: 160, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  card: { width: '92%', padding: 14, borderRadius: 12, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  body: { color: '#44525e' },
  actions: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { backgroundColor: '#10B981', padding: 8, borderRadius: 8, minWidth: 90, alignItems: 'center' },
  ghost: { backgroundColor: '#eef2f0' },
  empty: { padding: 12, alignItems: 'center' },
});
