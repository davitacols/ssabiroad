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

  const handleAISearchPress = () => {
    addActivity('AI Search', 'Searched for places', '/ai-search');
    router.push('/ai-search');
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
        </View>

        {/* Main Actions */}
        <View style={styles.mainActions}>
          <TouchableOpacity style={styles.cardWrapper} onPress={handleScannerPress}>
            <View style={styles.primaryCard}>
              <Image source={require('../assets/location.jpg')} style={styles.cardImage} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.primaryTitle}>Scan Location</Text>
              <Text style={styles.primarySubtitle}>Identify places from photos using AI</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cardWrapper} onPress={handleNearbyPress}>
            <View style={styles.secondaryCard}>
              <Image source={require('../assets/search.jpg')} style={styles.cardImage} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.secondaryTitle}>Nearby Places</Text>
              <Text style={styles.secondarySubtitle}>Discover locations around you</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cardWrapper} onPress={handleARPress}>
            <View style={styles.arCard}>
              <Image source={require('../assets/ar-view.jpg')} style={styles.cardImage} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.arTitle}>AR Location View</Text>
              <Text style={styles.arSubtitle}>See real-time info overlays through your camera</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cardWrapper} onPress={handleAISearchPress}>
            <View style={styles.aiSearchCard}>
              <Image source={require('../assets/ai-search.jpg')} style={styles.cardImage} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.aiSearchTitle}>AI Search</Text>
              <Text style={styles.aiSearchSubtitle}>Ask anything: "volleyball courts in Lagos"</Text>
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
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  mainActions: {
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 20,
  },
  cardWrapper: {
    marginBottom: 4,
  },
  primaryCard: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  secondaryCard: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardTextContainer: {
    paddingTop: 12,
  },
  primaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  primarySubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  secondaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  secondarySubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  arCard: {
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  arTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  arSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  aiSearchCard: {
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  aiSearchTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  aiSearchSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  featuresSection: {
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    marginBottom: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  featuresGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
});