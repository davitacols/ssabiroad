import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation }) {
  const menuItems = [
    {
      id: 1,
      title: 'Settings',
      icon: 'settings-outline',
      action: () => navigation.navigate('Settings'),
    },
    {
      id: 2,
      title: 'About SSABIRoad',
      icon: 'information-circle-outline',
      action: () => showAbout(),
    },
    {
      id: 3,
      title: 'Privacy Policy',
      icon: 'shield-outline',
      action: () => Linking.openURL('https://ssabiroad.vercel.app/privacy'),
    },
    {
      id: 4,
      title: 'Terms of Service',
      icon: 'document-text-outline',
      action: () => Linking.openURL('https://ssabiroad.vercel.app/terms'),
    },
    {
      id: 5,
      title: 'Contact Support',
      icon: 'mail-outline',
      action: () => Linking.openURL('mailto:support@ssabiroad.com'),
    },
    {
      id: 6,
      title: 'Rate App',
      icon: 'star-outline',
      action: () => showRating(),
    },
  ];

  const showAbout = () => {
    Alert.alert(
      'About SSABIRoad',
      'SSABIRoad (Smart Structural Analysis & Building Information Road) is a sophisticated platform that combines computer vision, geospatial data, and artificial intelligence to analyze buildings, locations, and urban environments.\n\nVersion: 1.0.0\nDeveloped by: SSABIRoad Team',
      [{ text: 'OK' }]
    );
  };

  const showRating = () => {
    Alert.alert(
      'Rate SSABIRoad',
      'Enjoying SSABIRoad? Please rate us on the App Store!',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Rate Now', onPress: () => console.log('Open app store') },
      ]
    );
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your analysis history and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Success', 'All data has been cleared');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#007AFF" />
          </View>
          <Text style={styles.userName}>SSABIRoad User</Text>
          <Text style={styles.userEmail}>Building Analysis Expert</Text>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Analyses</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Locations</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Buildings</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.action}>
              <Ionicons name={item.icon} size={24} color="#007AFF" />
              <Text style={styles.menuText}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.dangerButton} onPress={clearAllData}>
            <Ionicons name="trash-outline" size={24} color="#ff4444" />
            <Text style={styles.dangerText}>Clear All Data</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>SSABIRoad v1.0.0</Text>
          <Text style={styles.footerText}>© 2024 SSABIRoad Team</Text>
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
    padding: 20,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: 'white',
    alignItems: 'center',
    padding: 30,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginBottom: 20,
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  menuSection: {
    backgroundColor: 'white',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  dangerSection: {
    backgroundColor: 'white',
    marginBottom: 20,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  dangerText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#ff4444',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
});