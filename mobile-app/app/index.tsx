import { View, Text, StyleSheet, TouchableOpacity, StatusBar, SafeAreaView, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuBar from '../components/MenuBar';

export default function HomeScreen() {
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const addActivity = async (title: string, subtitle: string, route: string) => {
    try {
      const stored = await AsyncStorage.getItem('recentActivities');
      const activities = stored ? JSON.parse(stored) : [];
      
      const newActivity = {
        id: Date.now().toString(),
        title,
        subtitle,
        timestamp: Date.now(),
        route
      };
      
      const updated = [newActivity, ...activities.slice(0, 4)];
      await AsyncStorage.setItem('recentActivities', JSON.stringify(updated));
    } catch (error) {
      console.log('Error saving activity:', error);
    }
  };

  const handleScannerPress = () => {
    addActivity('Photo Scanner', 'Scanned location from photo', '/scanner');
    router.push('/scanner');
  };

  const handleNearbyPress = () => {
    addActivity('Nearby Places', 'Discovered locations around you', '/nearby-poi');
    router.push('/nearby-poi');
  };

  const handleARPress = () => {
    addActivity('AR View', 'Explored locations with augmented reality', '/ar-view');
    router.push('/ar-view');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.subtitle}>Where would you like to explore?</Text>
        </View>

        {/* Main Actions */}
        <View style={styles.mainActions}>
          <TouchableOpacity style={styles.primaryCard} onPress={handleScannerPress}>
            <Image source={require('../assets/location.jpg')} style={styles.cardImage} />
            <View style={styles.cardOverlay}>
              <View style={styles.cardContent}>
                <Text style={styles.primaryTitle}>Scan Location</Text>
                <Text style={styles.primarySubtitle}>Identify places from photos using AI</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryCard} onPress={handleNearbyPress}>
            <Image source={require('../assets/search.jpg')} style={styles.cardImage} />
            <View style={styles.cardOverlay}>
              <View style={styles.cardContent}>
                <Text style={styles.secondaryTitle}>Nearby Places</Text>
                <Text style={styles.secondarySubtitle}>Discover locations around you</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.arCard} onPress={handleARPress}>
            <View style={styles.arCardContent}>
              <Text style={styles.arTitle}>AR Location View</Text>
              <Text style={styles.arSubtitle}>See real-time info overlays through your camera</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <MenuBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
  },
  logo: {
    width: 320,
    height: 70,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  mainActions: {
    paddingHorizontal: 24,
    marginBottom: 40,
    gap: 16,
  },
  primaryCard: {
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  secondaryCard: {
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  cardContent: {
    padding: 24,
  },
  primaryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  primarySubtitle: {
    fontSize: 16,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  secondaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  secondarySubtitle: {
    fontSize: 14,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  arCard: {
    height: 100,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#000000',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arCardContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  arTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  arSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});