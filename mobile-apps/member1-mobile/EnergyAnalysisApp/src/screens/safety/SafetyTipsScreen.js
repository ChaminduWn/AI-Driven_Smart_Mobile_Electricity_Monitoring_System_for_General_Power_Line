import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Share, ImageBackground, TouchableOpacity, Alert } from 'react-native';
import { Text, ActivityIndicator, Button, IconButton } from 'react-native-paper';
import Header from '../../components/safety/Header';
import api from '../../services/safety/api';

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1505672678657-cc7037095e2c?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3&s=7ef6d2f7f6c3f7a3d9a2c2b8f1c9d2a8';

export default function SafetyTipsScreen({ navigation }) {
  const [tips, setTips] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filter, setFilter] = useState('all'); // 'all' | 'emergency' | 'seasonal'
  const [index, setIndex] = useState(0); // current card index

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.fetchSafetyTips();
        if (res.status !== 'success') throw new Error(res.message || 'Failed to fetch tips');
        setTips(res.data);
      } catch (err) {
        setError(err.message || 'Unexpected error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const daily = tips?.daily ?? [];
  const seasonal = tips?.seasonal ?? [];
  const emergency = tips?.emergency ?? [];

  // Build a simple cards array based on filter
  const buildCards = () => {
    let src = [];
    if (filter === 'emergency') src = emergency;
    else if (filter === 'seasonal') src = seasonal;
    else src = [...emergency, ...seasonal, ...daily];

    // Map to card objects with title, overview, miniTip
    return src.map((t, i) => ({
      id: `${filter}-${i}`,
      title: filter === 'emergency' ? 'Alert' : filter === 'seasonal' ? 'Seasonal Tip' : 'Safety Tip',
      location: 'Colombo District · 5km away',
      overview: t,
      miniTip: 'Unplug sensitive electronics during severe weather to avoid surge damage.'
    }));
  };

  const cards = buildCards();
  const current = cards[index] ?? null;

  const shareCard = async (card) => {
    if (!card) return;
    try {
      await Share.share({ message: `${card.title}\n\n${card.overview}` });
    } catch (err) {
      console.warn('Share error', err);
    }
  };

  const onUnderstand = () => {
    // advance card; if last, show confirmation then reset
    if (index < cards.length - 1) setIndex(index + 1);
    else {
      Alert.alert('Done', 'You have reviewed all tips.', [{ text: 'OK', onPress: () => setIndex(0) }]);
    }
  };

  const onSkip = () => {
    if (index < cards.length - 1) setIndex(index + 1);
    else setIndex(0);
  };

  return (
    <View style={{ flex: 1 }}>
      <Header
        title="Safety Briefing"
        leftAction={<IconButton icon="arrow-left" size={20} onPress={() => navigation.goBack()} />}
        rightAction={<IconButton icon="filter-variant" size={20} onPress={() => Alert.alert('Filter', 'Filter UI not implemented')} />}
      />

      <View style={styles.contextChips}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8 }}>
          <TouchableOpacity onPress={() => { setFilter('all'); setIndex(0); }} style={[styles.chip, filter === 'all' ? styles.chipActive : null]}>
            <Text style={[styles.chipText, filter === 'all' ? styles.chipTextActive : null]}>All Tips</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setFilter('emergency'); setIndex(0); }} style={[styles.chip, filter === 'emergency' ? styles.chipOutlinedActive : null]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.dot, { backgroundColor: '#EB4B4B' }]} />
              <Text style={[styles.chipText, filter === 'emergency' ? styles.chipTextActiveAlt : null]}>Emergency</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setFilter('seasonal'); setIndex(0); }} style={[styles.chip, filter === 'seasonal' ? styles.chipOutlinedActive : null]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.dot, { backgroundColor: '#F78F29' }]} />
              <Text style={[styles.chipText, filter === 'seasonal' ? styles.chipTextActiveAlt : null]}>Seasonal</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.mainArea}>
        {/* Background decorative blobs (subtle) */}
        <View style={styles.bgBlobPrimary} />
        <View style={styles.bgBlobAccent} />

        <View style={styles.stackContainer}>
          {/* back cards for depth (render 2 shadows if available) */}
          <View style={[styles.backCard, { transform: [{ translateY: 12 }, { scale: 0.85 }], opacity: 0.28 }]} />
          <View style={[styles.backCard, { transform: [{ translateY: 6 }, { scale: 0.92 }], opacity: 0.5 }]} />

          {/* Front active card */}
          {current ? (
            <TouchableOpacity activeOpacity={0.95} style={styles.frontCard} onPress={() => Alert.alert('Read Details', current.overview)}>
              <View style={styles.statusBar} />
              <ImageBackground source={{ uri: PLACEHOLDER_IMG }} style={styles.imageSection} imageStyle={{ resizeMode: 'cover' }}>
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentText}>Urgent</Text>
                </View>
              </ImageBackground>

              <View style={styles.cardContent}>
                <View>
                  <Text style={styles.cardTitle}>Thunderstorm Alert</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.cardMeta}>Colombo District · 5km away</Text>
                  </View>

                  <Text style={styles.cardOverview} numberOfLines={3}>{current.overview}</Text>

                  <View style={styles.miniTip}>
                    <Text style={{ marginRight: 8, color: '#2463eb' }}>💡</Text>
                    <Text style={styles.miniTipText}>{current.miniTip}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Button onPress={onSkip} compact>Skip</Button>
                  <Button textColor="#2463eb" onPress={() => Alert.alert('Read Details', current.overview)}>Read Details</Button>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.frontCard, { alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: '#666' }}>No tips for this filter</Text>
            </View>
          )}

          {/* Swipe hint */}
          <View style={styles.swipeHint}>
            <Text style={styles.swipeHintText}>Swipe to dismiss</Text>
          </View>
        </View>
      </View>

      {/* Fixed bottom action bar */}
      <View style={styles.bottomBar}>
        <Button mode="contained" buttonColor="#2463eb" textColor="#fff" onPress={onUnderstand} style={styles.primaryButton}>I Understand</Button>
        <IconButton icon="share-variant" size={24} onPress={() => shareCard(current)} style={styles.shareButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contextChips: { paddingVertical: 12, borderBottomWidth: 0 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, marginRight: 8, backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#111827' },
  chipOutlinedActive: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  chipTextActive: { color: '#fff' },
  chipTextActiveAlt: { color: '#374151', fontWeight: '700' },
  dot: { width: 10, height: 10, borderRadius: 10 },

  mainArea: { flex: 1, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 96, alignItems: 'center', justifyContent: 'center' },
  bgBlobPrimary: { position: 'absolute', top: '20%', left: -40, width: 220, height: 220, borderRadius: 110, backgroundColor: '#2463eb22', transform: [{ scale: 1.2 }], zIndex: 0 },
  bgBlobAccent: { position: 'absolute', bottom: '20%', right: -40, width: 220, height: 220, borderRadius: 110, backgroundColor: '#F78F2922', zIndex: 0 },

  stackContainer: { width: '100%', maxWidth: 360, aspectRatio: 3 / 4, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  backCard: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderRadius: 32, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 20, elevation: 6 },
  frontCard: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderRadius: 32, overflow: 'hidden', zIndex: 10 },

  statusBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: '#EB4B4B' },
  imageSection: { height: '45%', width: '100%', backgroundColor: '#f0f0f0' },
  urgentBadge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#FFCDD2' },
  urgentText: { color: '#EB4B4B', fontWeight: '700', fontSize: 11 },

  cardContent: { flex: 1, padding: 20, justifyContent: 'space-between' },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 6 },
  cardMeta: { fontSize: 12, color: '#6b7280' },
  cardOverview: { marginTop: 12, color: '#374151' },

  miniTip: { marginTop: 14, padding: 12, backgroundColor: '#f8fafc', borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  miniTipText: { color: '#6b7280', fontSize: 12, flex: 1 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },

  swipeHint: { position: 'absolute', bottom: -40, alignSelf: 'center', zIndex: 9 },
  swipeHintText: { fontSize: 10, color: '#9ca3af', fontWeight: '700', letterSpacing: 1.5 },

  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 18, paddingHorizontal: 24, flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { flex: 1, borderRadius: 28, paddingVertical: 12 },
  shareButton: { backgroundColor: '#fff', borderRadius: 20 }
});
