import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import PropTypes from 'prop-types';

export default function Onboarding3({ navigation }) {
  const permissions = [
    {
      icon: 'map-marker',
      title: 'Location Access',
      description: 'To provide weather-based safety alerts for your area',
    },
    {
      icon: 'bell',
      title: 'Notifications',
      description: 'To send you important safety alerts and updates',
    },
  ];

  return (
    <LinearGradient 
      colors={['#0066cc', '#00a3a3']} 
      start={{ x: 0, y: 0 }} 
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <IconButton 
              icon="map-marker-radius" 
              size={70} 
              iconColor="#fff"
              style={styles.icon}
            />
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Almost There!</Text>
          <Text style={styles.subtitle}>
            We need a few permissions to provide you with the best safety experience
          </Text>
        </View>

        {/* Permissions List */}
        <View style={styles.permissionsContainer}>
          {permissions.map((permission, index) => (
            <View key={index} style={styles.permissionCard}>
              <View style={styles.permissionIconContainer}>
                <IconButton 
                  icon={permission.icon} 
                  size={32} 
                  iconColor="#0066cc"
                  style={styles.permissionIcon}
                />
              </View>
              <View style={styles.permissionText}>
                <Text style={styles.permissionTitle}>{permission.title}</Text>
                <Text style={styles.permissionDescription}>{permission.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <Button 
            mode="contained" 
            onPress={() => navigation.replace('Home')}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            icon="check-circle"
          >
            Get Started
          </Button>
          
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
          </View>

          <Text style={styles.privacyText}>
            Your privacy is important to us. We only use location data for safety alerts.
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

Onboarding3.propTypes = { navigation: PropTypes.object };

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  icon: {
    margin: 0,
  },
  header: {
    alignItems: 'center',
    marginTop: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  permissionsContainer: {
    marginTop: 40,
    gap: 16,
  },
  permissionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  permissionIconContainer: {
    marginRight: 16,
  },
  permissionIcon: {
    margin: 0,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    borderRadius: 20,
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bottomSection: {
    width: '100%',
    marginTop: 32,
  },
  button: {
    borderRadius: 30,
    paddingVertical: 4,
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0066cc',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  progressDotActive: {
    width: 24,
    backgroundColor: '#fff',
  },
  privacyText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
