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

  const handleCollectionsPress = () => {
    addActivity('Collections', 'Organized saved locations', '/collections');
    router.push('/collections');
  };

  const handleBatchPress = () => {
    addActivity('Batch Process', 'Processed multiple photos', '/batch-process');
    router.push('/batch-process');
  };



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.stickyHeader}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
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

        {/* New Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>NEW FEATURES</Text>
          <View style={styles.featuresGrid}>
            <TouchableOpacity style={styles.featureCard} onPress={handleBatchPress}>
              <Text style={styles.featureTitle}>Batch Process</Text>
              <Text style={styles.featureDesc}>Multiple photos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard} onPress={handleCollectionsPress}>
              <Text style={styles.featureTitle}>Collections</Text>
              <Text style={styles.featureDesc}>Organize & tag</Text>
            </TouchableOpacity>
          </View>
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
  stickyHeader: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  logo: {
    width: '90%',
    height: 50,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center',
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
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 16,
    letterSpacing: 1,
  },
  featuresGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
});