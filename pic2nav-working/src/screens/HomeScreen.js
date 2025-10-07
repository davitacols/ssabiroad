import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }) {
  const quickActions = [
    { id: 1, title: 'Analyze Photo', icon: 'camera', action: () => navigation.navigate('Camera') },
    { id: 2, title: 'View History', icon: 'time', action: () => navigation.navigate('History') },
    { id: 3, title: 'Settings', icon: 'settings', action: () => navigation.navigate('Settings') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image 
            source={{ uri: 'https://ssabiroad.vercel.app/logo.png' }} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>SSABIRoad</Text>
          <Text style={styles.subtitle}>Smart Structural Analysis & Building Information</Text>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureGrid}>
            <View style={styles.featureCard}>
              <Ionicons name="business" size={32} color="#007AFF" />
              <Text style={styles.featureTitle}>Building Analysis</Text>
              <Text style={styles.featureDesc}>Architectural style detection</Text>
            </View>
            <View style={styles.featureCard}>
              <Ionicons name="location" size={32} color="#007AFF" />
              <Text style={styles.featureTitle}>Location Intelligence</Text>
              <Text style={styles.featureDesc}>Precise geolocation tracking</Text>
            </View>
            <View style={styles.featureCard}>
              <Ionicons name="eye" size={32} color="#007AFF" />
              <Text style={styles.featureTitle}>Smart Detection</Text>
              <Text style={styles.featureDesc}>Image-based recognition</Text>
            </View>
            <View style={styles.featureCard}>
              <Ionicons name="analytics" size={32} color="#007AFF" />
              <Text style={styles.featureTitle}>Professional Tools</Text>
              <Text style={styles.featureDesc}>EXIF data processing</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.id} style={styles.actionButton} onPress={action.action}>
              <Ionicons name={action.icon} size={24} color="#007AFF" />
              <Text style={styles.actionText}>{action.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  featuresSection: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  quickActions: {
    padding: 20,
    backgroundColor: 'white',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 10,
  },
  actionText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    fontWeight: '500',
  },
});