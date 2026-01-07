import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useNavigation, useNavigationState } from '@react-navigation/native';

export default function BottomNav() {
  const navigation = useNavigation();
  
  // Get current route name using navigation state
  const routeName = useNavigationState(state => {
    if (!state || !state.routes || state.index === undefined) {
      return null;
    }
    const route = state.routes[state.index];
    return route?.name || null;
  });
  
  // Hide bottom navigation on onboarding screens
  const onboardingScreens = ['Onboarding1', 'Onboarding2', 'Onboarding3'];
  
  // Check if current route is an onboarding screen or if route name starts with "Onboarding"
  if (routeName && (onboardingScreens.includes(routeName) || routeName.startsWith('Onboarding'))) {
    return null;
  }
  
  // Also hide if routeName is not available yet (initial load)
  if (!routeName || routeName === undefined) {
    return null;
  }
  
  const isActive = (routeNameToCheck) => routeName === routeNameToCheck;
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.navItem, isActive('Home') && styles.navItemActive]} 
        onPress={() => navigation.navigate('Home')}
        activeOpacity={0.7}
      >
        <IconButton 
          icon="home" 
          size={24} 
          iconColor={isActive('Home') ? '#0066cc' : '#666'} 
          style={styles.iconButton}
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.navItem, isActive('Appliances') && styles.navItemActive]} 
        onPress={() => navigation.navigate('Appliances')}
        activeOpacity={0.7}
      >
        <IconButton 
          icon="apps" 
          size={24} 
          iconColor={isActive('Appliances') ? '#0066cc' : '#666'} 
          style={styles.iconButton}
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.navItem, isActive('Weather') && styles.navItemActive]} 
        onPress={() => navigation.navigate('Weather')}
        activeOpacity={0.7}
      >
        <IconButton 
          icon="weather-cloudy" 
          size={24} 
          iconColor={isActive('Weather') ? '#0066cc' : '#666'} 
          style={styles.iconButton}
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.navItem, isActive('Assistant') && styles.navItemActive]} 
        onPress={() => navigation.navigate('Assistant')}
        activeOpacity={0.7}
      >
        <IconButton 
          icon="account-circle" 
          size={24} 
          iconColor={isActive('Assistant') ? '#0066cc' : '#666'} 
          style={styles.iconButton}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    position: 'absolute', 
    left: 16, 
    right: 16, 
    bottom: 16, 
    backgroundColor: '#fff', 
    borderRadius: 40, 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 12, 
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 4,
  },
  navItemActive: {
    backgroundColor: '#e6f2ff',
  },
  iconButton: {
    margin: 0,
  }
});