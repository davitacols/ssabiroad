import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import MenuBar from '../components/MenuBar';
import { useTheme, getColors } from '../contexts/ThemeContext';

export default function HomeScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const colors = getColors(theme);
  const [showDisclosure, setShowDisclosure] = useState(false);

  useEffect(() => {
    checkLocationDisclosure();
  }, []);

  const checkLocationDisclosure = async () => {
    const shown = await AsyncStorage.getItem('locationDisclosureShown');
    if (!shown) {
      setShowDisclosure(true);
    }
  };

  const handleAcceptDisclosure = async () => {
    await AsyncStorage.setItem('locationDisclosureShown', 'true');
    setShowDisclosure(false);
    const { status } = await Location.requestForegroundPermissionsAsync();
  };

  const handleDeclineDisclosure = async () => {
    await AsyncStorage.setItem('locationDisclosureShown', 'true');
    setShowDisclosure(false);
  };

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

  const handleTransitPress = () => {
    addActivity('Transit Directions', 'Planned journey route', '/transit');
    router.push('/transit');
  };

  const handleContributePress = () => {
    addActivity('Contribute', 'Earned points by contributing', '/contribute');
    router.push('/contribute');
  };





  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Location Disclosure Modal */}
      <Modal visible={showDisclosure} transparent animationType="fade">
        <View style={styles.disclosureOverlay}>
          <View style={styles.disclosureDialog}>
            <View style={styles.disclosureHeader}>
              <Ionicons name="location" size={48} color="#3b82f6" />
              <Text style={styles.disclosureTitle}>Location Permission</Text>
            </View>
            <View style={styles.disclosureContent}>
              <Text style={styles.disclosureHeading}>Why we need your location:</Text>
              <View style={styles.disclosureItem}>
                <Ionicons name="navigate" size={20} color="#3b82f6" />
                <Text style={styles.disclosureItemText}>Identify buildings and landmarks near you</Text>
              </View>
              <View style={styles.disclosureItem}>
                <Ionicons name="map" size={20} color="#3b82f6" />
                <Text style={styles.disclosureItemText}>Show nearby places (restaurants, banks, hospitals)</Text>
              </View>
              <View style={styles.disclosureItem}>
                <Ionicons name="camera" size={20} color="#3b82f6" />
                <Text style={styles.disclosureItemText}>Extract GPS data from photos for location recognition</Text>
              </View>
              <Text style={styles.disclosurePrivacy}>
                Your location data is used only for these features and is not shared with third parties.
              </Text>
            </View>
            <View style={styles.disclosureButtons}>
              <TouchableOpacity style={styles.declineButton} onPress={handleDeclineDisclosure}>
                <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptDisclosure}>
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Black Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.greeting, { color: colors.text }]}>{getGreeting()}</Text>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
            <Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <TouchableOpacity style={[styles.heroCard, { backgroundColor: colors.card }]} onPress={handleScannerPress}>
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
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleAISearchPress}>
            <View style={[styles.actionIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="sparkles" size={24} color={colors.text} />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>AI Search</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>Ask anything</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleNearbyPress}>
            <View style={[styles.actionIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="location" size={24} color={colors.text} />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Nearby Places</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>Discover around you</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleComparePress}>
            <View style={[styles.actionIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="git-compare" size={24} color={colors.text} />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Compare Locations</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>Side-by-side comparison</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleTransitPress}>
            <View style={[styles.actionIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="bus" size={24} color={colors.text} />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Transit Directions</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>Plan your journey</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleContributePress}>
            <View style={[styles.actionIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="trophy" size={24} color="#f59e0b" />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Contribute & Earn</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>Get rewards for photos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        {/* Tools Section */}
        <View style={styles.toolsSection}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>TOOLS</Text>
          
          <TouchableOpacity style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleBatchPress}>
            <View style={[styles.toolIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="images" size={24} color={colors.text} />
            </View>
            <View style={styles.toolText}>
              <Text style={[styles.toolTitle, { color: colors.text }]}>Batch Process</Text>
              <Text style={[styles.toolDesc, { color: colors.textSecondary }]}>Process multiple photos at once</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/street-view')}>
            <View style={[styles.toolIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="eye" size={24} color={colors.text} />
            </View>
            <View style={styles.toolText}>
              <Text style={[styles.toolTitle, { color: colors.text }]}>Street View</Text>
              <Text style={[styles.toolDesc, { color: colors.textSecondary }]}>360° panoramic views</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleCollectionsPress}>
            <View style={[styles.toolIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="folder" size={24} color={colors.text} />
            </View>
            <View style={styles.toolText}>
              <Text style={[styles.toolTitle, { color: colors.text }]}>Collections</Text>
              <Text style={[styles.toolDesc, { color: colors.textSecondary }]}>Organize and tag locations</Text>
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
  container: { flex: 1, backgroundColor: '#000' },
  disclosureOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  disclosureDialog: { backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 400 },
  disclosureHeader: { alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  disclosureTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 12, color: '#1f2937' },
  disclosureContent: { padding: 24 },
  disclosureHeading: { fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#1f2937' },
  disclosureItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  disclosureItemText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#4b5563', lineHeight: 20 },
  disclosurePrivacy: { fontSize: 12, color: '#6b7280', marginTop: 16, lineHeight: 18, fontStyle: 'italic' },
  disclosureButtons: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 12 },
  declineButton: { flex: 1, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center' },
  declineText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
  acceptButton: { flex: 1, padding: 16, borderRadius: 8, backgroundColor: '#3b82f6', alignItems: 'center' },
  acceptText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  header: { backgroundColor: '#000', paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  themeToggle: { padding: 8 },
  greeting: { fontSize: 36, fontFamily: 'LeagueSpartan_700Bold', color: '#fff' },
  scrollView: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  heroCard: { height: 240, borderRadius: 24, overflow: 'hidden', position: 'relative', backgroundColor: '#0a0a0a' },
  heroImage: { width: '100%', height: '100%', opacity: 0.6 },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  heroTitle: { fontSize: 32, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginTop: 12 },
  heroSubtitle: { fontSize: 16, color: '#a3a3a3', marginTop: 8, textAlign: 'center' },
  quickActions: { paddingHorizontal: 20, paddingVertical: 8 },
  actionCard: { backgroundColor: '#0a0a0a', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#1a1a1a' },
  actionIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 17, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginBottom: 4 },
  actionSubtitle: { fontSize: 14, color: '#a3a3a3' },
  toolsSection: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100 },
  sectionTitle: { fontSize: 13, fontFamily: 'LeagueSpartan_700Bold', color: '#737373', marginBottom: 16, letterSpacing: 2, textTransform: 'uppercase' },
  toolCard: { backgroundColor: '#0a0a0a', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#1a1a1a' },
  toolIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  toolText: { flex: 1 },
  toolTitle: { fontSize: 17, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginBottom: 4 },
  toolDesc: { fontSize: 14, color: '#a3a3a3' },
});