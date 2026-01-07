import { Tabs } from 'expo-router';
import React from 'react';
import { Zap, Plus, Calculator, Activity, Users, Target } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1F2937',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: '#1F2937',
          borderTopColor: '#374151',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Zap color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="appliances"
        options={{
          title: 'Appliances',
          tabBarIcon: ({ color }) => <Plus color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="estimator"
        options={{
          title: 'Estimator',
          tabBarIcon: ({ color }) => <Calculator color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="nilm"
        options={{
          title: 'NILM',
          tabBarIcon: ({ color }) => <Activity color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="household"
        options={{
          title: 'Household',
          tabBarIcon: ({ color }) => <Users color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="tracker"
        options={{
          title: 'Tracker',
          tabBarIcon: ({ color }) => <Target color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}