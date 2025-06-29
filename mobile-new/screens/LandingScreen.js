import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function LandingScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SSABiRoad</Text>
        <Text style={styles.subtitle}>Pic2Nav Mobile</Text>
        <Text style={styles.description}>
          Identify locations instantly using AI-powered image recognition
        </Text>
      </View>

      <View style={styles.features}>
        <View style={styles.feature}>
          <Text style={styles.featureTitle}>📸 Smart Recognition</Text>
          <Text style={styles.featureText}>
            Take photos and get instant location identification
          </Text>
        </View>

        <View style={styles.feature}>
          <Text style={styles.featureTitle}>📍 GPS Integration</Text>
          <Text style={styles.featureText}>
            Combine visual recognition with GPS for accuracy
          </Text>
        </View>

        <View style={styles.feature}>
          <Text style={styles.featureTitle}>📊 Analytics</Text>
          <Text style={styles.featureText}>
            Track your location discoveries and history
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Main')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 40,
    alignItems: 'center',
    marginTop: 60,
  },
  title: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#007AFF',
    fontSize: 20,
    marginBottom: 20,
  },
  description: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    padding: 20,
  },
  feature: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  featureText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    padding: 20,
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});