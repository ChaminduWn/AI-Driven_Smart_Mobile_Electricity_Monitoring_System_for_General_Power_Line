import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import PropTypes from 'prop-types';

export default function Onboarding2({ navigation }) {
  const features = [
    {
      icon: 'weather-cloudy',
      title: 'Real-time Weather',
      description: 'Get instant weather updates and hazard analysis for your location',
      color: '#4A90E2',
    },
    {
      icon: 'bell-alert',
      title: 'Safety Alerts',
      description: 'Receive instant notifications about electrical safety risks',
      color: '#F5A623',
    },
    {
      icon: 'shield-alert',
      title: 'Emergency Protocols',
      description: 'Access step-by-step emergency procedures when you need them most',
      color: '#E94B3C',
    },
  ];

  return (
    <LinearGradient 
      colors={['#f6fbff', '#e6f2ff', '#d6e9ff']} 
      start={{ x: 0, y: 0 }} 
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>How It Works</Text>
          <Text style={styles.subtitle}>
            Everything you need to stay safe, all in one place
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={[styles.featureIconContainer, { backgroundColor: `${feature.color}15` }]}>
                <IconButton 
                  icon={feature.icon} 
                  size={40} 
                  iconColor={feature.color}
                  style={styles.featureIcon}
                />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('Onboarding3')}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            icon="arrow-right"
          >
            Continue
          </Button>
          
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressDot} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressDot} />
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

Onboarding2.propTypes = { navigation: PropTypes.object };

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#0066cc',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    flex: 1,
    gap: 24,
    marginBottom: 32,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    margin: 0,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSection: {
    width: '100%',
  },
  button: {
    borderRadius: 30,
    paddingVertical: 4,
    backgroundColor: '#0066cc',
    elevation: 4,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
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
    backgroundColor: '#ccc',
  },
  progressDotActive: {
    width: 24,
    backgroundColor: '#0066cc',
  },
});
