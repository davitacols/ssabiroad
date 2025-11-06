import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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

  const handleJourneyPress = () => {
    addActivity('Journey Timeline', 'Viewed location journey', '/journey');
    router.push('/journey');
  };

  const handleDiscoverPress = () => {
    addActivity('Discover', 'Explored new locations', '/discover');
    router.push('/discover');
  };

  const handleComparePress = () => {
    addActivity('Compare Locations', 'Compared saved locations', '/compare-locations');
    router.push('/compare-locations');
  };





  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Black Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <TouchableOpacity style={styles.heroCard} onPress={handleScannerPress}>
            <Image source={require('../assets/location.jpg')} style={styles.heroImage} />
            <View style={styles.heroOverlay}>
              <Ionicons name="camera" size={32} color="#ffffff" />
              <Text style={styles.heroTitle}>Scan Location</Text>
              <Text style={styles.heroSubtitle}>Identify places from photos</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={handleAISearchPress}>
            <View style={styles.actionIcon}>
              <Ionicons name="sparkles" size={24} color="#000000" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>AI Search</Text>
              <Text style={styles.actionSubtitle}>Ask anything</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleNearbyPress}>
            <View style={styles.actionIcon}>
              <Ionicons name="location" size={24} color="#000000" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Nearby Places</Text>
              <Text style={styles.actionSubtitle}>Discover around you</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleComparePress}>
            <View style={styles.actionIcon}>
              <Ionicons name="git-compare" size={24} color="#000000" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Compare Locations</Text>
              <Text style={styles.actionSubtitle}>Side-by-side comparison</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        {/* Tools Section */}
        <View style={styles.toolsSection}>
          <Text style={styles.sectionTitle}>TOOLS</Text>
          
          <TouchableOpacity style={styles.toolCard} onPress={handleBatchPress}>
            <View style={styles.toolIcon}>
              <Ionicons name="images" size={24} color="#000000" />
            </View>
            <View style={styles.toolText}>
              <Text style={styles.toolTitle}>Batch Process</Text>
              <Text style={styles.toolDesc}>Process multiple photos at once</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolCard} onPress={() => router.push('/street-view')}>
            <View style={styles.toolIcon}>
              <Ionicons name="eye" size={24} color="#000000" />
            </View>
            <View style={styles.toolText}>
              <Text style={styles.toolTitle}>Street View</Text>
              <Text style={styles.toolDesc}>360° panoramic views</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolCard} onPress={handleCollectionsPress}>
            <View style={styles.toolIcon}>
              <Ionicons name="folder" size={24} color="#000000" />
            </View>
            <View style={styles.toolText}>
              <Text style={styles.toolTitle}>Collections</Text>
              <Text style={styles.toolDesc}>Organize and tag locations</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

        </View>
      </ScrollView>
      
      <MenuBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#000000',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  greeting: {
    fontSize: 32,
    fontFamily: 'LeagueSpartan_700Bold',
    color: '#ffffff',
    fontFamily: 'LeagueSpartan_700Bold',
  },
  scrollView: {
    flex: 1,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  heroCard: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: 'LeagueSpartan_700Bold',
    color: '#ffffff',
    marginTop: 12,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#ffffff',
    marginTop: 4,
    opacity: 0.9,
    fontFamily: 'LeagueSpartan_400Regular',
  },
  quickActions: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: 'LeagueSpartan_700Bold',
    color: '#000000',
    marginBottom: 2,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'LeagueSpartan_400Regular',
  },
  toolsSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'LeagueSpartan_700Bold',
    color: '#6b7280',
    marginBottom: 16,
    letterSpacing: 1.5,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  toolCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  toolText: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 16,
    fontFamily: 'LeagueSpartan_700Bold',
    color: '#000000',
    marginBottom: 2,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  toolDesc: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'LeagueSpartan_400Regular',
  },
});