import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Avatar, Button } from 'react-native-paper';
import PropTypes from 'prop-types';
import Header from '../components/Header';

const demo = [
  { id: '1', name: 'Washing Machine', status: 'flood', note: 'Ground floor flooding detected in your area.' },
  { id: '2', name: 'Refrigerator', status: 'unstable', note: 'Voltage fluctuations detected.' },
  { id: '3', name: 'Smart TV', status: 'protected', note: 'Protected with surge protector.' }
];

function ApplianceCard({ a }) {
  let color = '#eefaf1';
  if (a.status === 'flood') color = '#ffeef0';
  else if (a.status === 'unstable') color = '#fff6e8';
  return (
    <TouchableOpacity style={[styles.appliance, { backgroundColor: color }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar.Icon icon="washing-machine" size={48} />
        <View style={{ marginLeft: 12 }}>
          <Text style={{ fontWeight: '700' }}>{a.name}</Text>
          <Text style={{ color: '#666', marginTop: 4 }}>{a.note}</Text>
        </View>
      </View>
      <View style={{ marginTop: 12 }}>
        <Button mode="contained">Mark as Secured</Button>
      </View>
    </TouchableOpacity>
  );
}

ApplianceCard.propTypes = { a: PropTypes.object.isRequired };

export default function AppliancesScreen({ navigation }) {
  const [items] = useState(demo);

  useEffect(() => {}, []);

  return (
    <View style={{ flex: 1 }}>
      <Header title="My Appliances" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.grid}>
          {items.map((i, idx) => <ApplianceCard key={i.id} a={i} />)}
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

AppliancesScreen.propTypes = { navigation: PropTypes.object };
const styles = StyleSheet.create({ container: { padding: 16 }, grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }, appliance: { padding: 12, borderRadius: 12, marginBottom: 12, width: '48%' } });