import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image, ScrollView, Modal, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import MenuBar from '../components/MenuBar';
import { useTheme, getColors } from '../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const features = [
  {
    id: 1,
    title: 'Photo Scanner',
    subtitle: 'Identify locations from photos',
    image: require('../assets/location.jpg'),
    icon: 'camera',
    route: '/scanner',
    color: '#3b82f6'
  },
  {
    id: 2,
    title: 'AI Search',
    subtitle: 'Smart location intelligence',
    image: require('../assets/ai-search.jpg'),
    icon: 'sparkles',
    route: '/ai-search',
    color: '#8b5cf6'
  },
  {
    id: 3,
    title: 'Nearby Places',
    subtitle: 'Discover around you',
    image: require('../assets/search.jpg'),
    icon: 'location',
    route: '/nearby-poi',
    color: '#10b981'
  }
];

export default function HomeScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const colors = getColors(theme);
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkLocationDisclosure();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
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



  const handleSearchPress = () => {
    addActivity('Search', 'Searched for locations', '/nearby-poi');
    router.push('/nearby-poi');
  };

  const handleBatchPress = () => {
    addActivity('Batch Process', 'Processed multiple photos', '/batch-process');
    router.push('/batch-process');
  };

  const handleAISearchPress = () => {
    addActivity('NaviSense by Pic2Nav', 'Used AI location intelligence', '/ai-search');
    router.push('/ai-search');
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
    addActivity('Help Train AI', 'Contributed photos to improve AI', '/contribute');
    router.push('/contribute');
  };





  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      {/* Location Disclosure Modal */}
      <Modal visible={showDisclosure} transparent animationType="fade">
        <View style={styles.disclosureOverlay}>
          <View style={[styles.disclosureDialog, { backgroundColor: colors.card }]}>
            <View style={[styles.disclosureHeader, { borderBottomColor: colors.border }]}>
              <Ionicons name="location" size={48} color="#3b82f6" />
              <Text style={[styles.disclosureTitle, { color: colors.text }]}>Location Permission</Text>
            </View>
            <ScrollView style={styles.disclosureScrollView} showsVerticalScrollIndicator={true}>
              <View style={styles.disclosureContent}>
                <Text style={[styles.disclosureHeading, { color: colors.text }]}>Location Data Collection & Usage</Text>
                <Text style={[styles.disclosureDescription, { color: colors.textSecondary }]}>Pic2Nav collects and uses your location data for:</Text>
                <View style={styles.disclosureItem}>
                  <Ionicons name="navigate" size={20} color="#3b82f6" />
                  <Text style={[styles.disclosureItemText, { color: colors.textSecondary }]}>Identifying buildings and landmarks near your current location</Text>
                </View>
                <View style={styles.disclosureItem}>
                  <Ionicons name="map" size={20} color="#3b82f6" />
                  <Text style={[styles.disclosureItemText, { color: colors.textSecondary }]}>Displaying nearby places (restaurants, banks, hospitals, etc.)</Text>
                </View>
                <View style={styles.disclosureItem}>
                  <Ionicons name="camera" size={20} color="#3b82f6" />
                  <Text style={[styles.disclosureItemText, { color: colors.textSecondary }]}>Extracting GPS coordinates from your photos for location recognition and analysis</Text>
                </View>
                <View style={styles.disclosureItem}>
                  <Ionicons name="analytics" size={20} color="#3b82f6" />
                  <Text style={[styles.disclosureItemText, { color: colors.textSecondary }]}>Providing location-based search results and recommendations</Text>
                </View>
                <Text style={[styles.disclosurePrivacy, { color: colors.textTertiary }]}>
                  Your location data is collected only when you use the app and is used solely for the features described above. We do not share your location data with third parties for advertising or marketing purposes. Location access is required only while using the app (foreground only).
                </Text>
                <Text style={[styles.disclosurePrivacy, { color: colors.textTertiary, marginTop: 8 }]}>
                  You can revoke location permission at any time in your device settings.
                </Text>
              </View>
            </ScrollView>
            <View style={[styles.disclosureButtons, { borderTopColor: colors.border }]}>
              <TouchableOpacity style={[styles.declineButton, { borderColor: colors.border }]} onPress={handleDeclineDisclosure}>
                <Text style={[styles.declineText, { color: colors.textSecondary }]}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.acceptButton, { backgroundColor: theme === 'dark' ? '#fff' : '#000' }]} onPress={handleAcceptDisclosure}>
                <Text style={[styles.acceptText, { color: theme === 'dark' ? '#000' : '#fff' }]}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <Animated.ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 20 }}
      >
        {/* Hero Carousel */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>What would you like to do?</Text>
          
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / (width - 40));
              setCurrentFeature(index);
            }}
            scrollEventThrottle={16}
            style={styles.carousel}
            snapToInterval={width - 40}
            decelerationRate="fast"
          >
            {features.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                style={[styles.featureCard, { backgroundColor: colors.card }]}
                onPress={() => {
                  addActivity(feature.title, feature.subtitle, feature.route);
                  router.push(feature.route);
                }}
                activeOpacity={0.9}
              >
                <Image source={feature.image} style={styles.featureImage} />
                <View style={styles.featureOverlay}>
                  <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                    <Ionicons name={feature.icon as any} size={28} color="#fff" />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
            ))}
          </Animated.ScrollView>
          
          {/* Carousel Indicators */}
          <View style={styles.indicators}>
            {features.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  {
                    backgroundColor: index === currentFeature ? '#fff' : 'rgba(255,255,255,0.3)',
                    width: index === currentFeature ? 24 : 8
                  }
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Suggestions */}
        <View style={styles.suggestions}>
          <Text style={[styles.suggestionsTitle, { color: colors.textTertiary }]}>SUGGESTIONS</Text>
          <View style={styles.suggestionChips}>
            <TouchableOpacity style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleNearbyPress}>
              <Ionicons name="location" size={16} color="#3b82f6" />
              <Text style={[styles.chipText, { color: colors.text }]}>Nearby</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleAISearchPress}>
              <Ionicons name="sparkles" size={16} color="#3b82f6" />
              <Text style={[styles.chipText, { color: colors.text }]}>AI Search</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleCollectionsPress}>
              <Ionicons name="folder" size={16} color="#3b82f6" />
              <Text style={[styles.chipText, { color: colors.text }]}>Saved</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>QUICK ACCESS</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={[styles.gridCard, { backgroundColor: colors.card }]} onPress={handleBatchPress}>
              <View style={[styles.gridIcon, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
                <Ionicons name="images" size={20} color={colors.text} />
              </View>
              <Text style={[styles.gridTitle, { color: colors.text }]}>Batch Process</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.gridCard, { backgroundColor: colors.card }]} onPress={() => router.push('/street-view')}>
              <View style={[styles.gridIcon, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
                <Ionicons name="eye" size={20} color={colors.text} />
              </View>
              <Text style={[styles.gridTitle, { color: colors.text }]}>Street View</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.gridCard, { backgroundColor: colors.card }]} onPress={handleCollectionsPress}>
              <View style={[styles.gridIcon, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
                <Ionicons name="folder" size={20} color={colors.text} />
              </View>
              <Text style={[styles.gridTitle, { color: colors.text }]}>Collections</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.gridCard, { backgroundColor: colors.card }]} onPress={handleTransitPress}>
              <View style={[styles.gridIcon, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
                <Ionicons name="bus" size={20} color={colors.text} />
              </View>
              <Text style={[styles.gridTitle, { color: colors.text }]}>Transit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.gridCard, { backgroundColor: colors.card }]} onPress={handleComparePress}>
              <View style={[styles.gridIcon, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
                <Ionicons name="git-compare" size={20} color={colors.text} />
              </View>
              <Text style={[styles.gridTitle, { color: colors.text }]}>Compare</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.gridCard, { backgroundColor: colors.card }]} onPress={handleContributePress}>
              <View style={[styles.gridIcon, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
                <Ionicons name="school" size={20} color={colors.text} />
              </View>
              <Text style={[styles.gridTitle, { color: colors.text }]}>Train AI</Text>
            </TouchableOpacity>
          </View>
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

          <TouchableOpacity style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/help-desk')}>
            <View style={[styles.toolIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="help-circle" size={24} color="#8b5cf6" />
            </View>
            <View style={styles.toolText}>
              <Text style={[styles.toolTitle, { color: colors.text }]}>Help & Support</Text>
              <Text style={[styles.toolDesc, { color: colors.textSecondary }]}>Get help or contact us</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

        </View>
      </Animated.ScrollView>

      {/* Simple Header */}
      <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>{getGreeting()}</Text>
            <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>Ready to explore?</Text>
          </View>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
            <Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      
      <MenuBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  disclosureOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  disclosureDialog: { borderRadius: 16, width: '100%', maxWidth: 400, maxHeight: '80%' },
  disclosureHeader: { alignItems: 'center', padding: 24, borderBottomWidth: 1 },
  disclosureTitle: { fontSize: 24, fontFamily: 'LeagueSpartan_700Bold', marginTop: 12 },
  disclosureScrollView: { maxHeight: 400 },
  disclosureContent: { padding: 24 },
  disclosureHeading: { fontSize: 16, fontFamily: 'LeagueSpartan_700Bold', marginBottom: 8 },
  disclosureDescription: { fontSize: 14, fontFamily: 'LeagueSpartan_400Regular', marginBottom: 16, lineHeight: 20 },
  disclosureItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  disclosureItemText: { flex: 1, marginLeft: 12, fontSize: 14, fontFamily: 'LeagueSpartan_400Regular', lineHeight: 20 },
  disclosurePrivacy: { fontSize: 12, fontFamily: 'LeagueSpartan_400Regular', marginTop: 16, lineHeight: 18, fontStyle: 'italic' },
  disclosureButtons: { flexDirection: 'row', padding: 16, borderTopWidth: 1, gap: 12 },
  declineButton: { flex: 1, padding: 16, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  declineText: { fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold' },
  acceptButton: { flex: 1, padding: 16, borderRadius: 8, alignItems: 'center' },
  acceptText: { fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: 20, paddingBottom: 16 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: 24, fontFamily: 'LeagueSpartan_700Bold' },
  subGreeting: { fontSize: 14, fontFamily: 'LeagueSpartan_400Regular', marginTop: 2 },
  themeToggle: { padding: 8 },
  scrollView: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 24 },
  heroTitle: { fontSize: 18, fontFamily: 'LeagueSpartan_600SemiBold', marginBottom: 20 },
  carousel: { marginBottom: 16 },
  featureCard: { 
    width: width - 60, 
    height: 200, 
    marginRight: 20, 
    borderRadius: 20, 
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6
  },
  featureImage: { width: '100%', height: '100%', position: 'absolute' },
  featureOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    padding: 24, 
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center'
  },
  featureIcon: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  featureContent: { flex: 1, marginLeft: 16 },
  featureTitle: { fontSize: 22, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginBottom: 4 },
  featureSubtitle: { fontSize: 14, fontFamily: 'LeagueSpartan_400Regular', color: '#fff', opacity: 0.9 },
  indicators: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  indicator: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  suggestions: { paddingHorizontal: 20, paddingBottom: 16 },
  suggestionsTitle: { fontSize: 11, fontFamily: 'LeagueSpartan_700Bold', letterSpacing: 1, marginBottom: 12 },
  suggestionChips: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1 },
  chipText: { fontSize: 14, fontFamily: 'LeagueSpartan_600SemiBold' },
  quickActions: { paddingHorizontal: 20, paddingBottom: 24 },
  sectionTitle: { fontSize: 11, fontFamily: 'LeagueSpartan_700Bold', letterSpacing: 1, marginBottom: 16, textTransform: 'uppercase' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: { 
    width: (width - 56) / 2, 
    padding: 20, 
    borderRadius: 16, 
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  gridIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 12
  },
  gridTitle: { fontSize: 13, fontFamily: 'LeagueSpartan_600SemiBold', textAlign: 'center' },
  toolsSection: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
  sectionTitle: { fontSize: 13, fontFamily: 'LeagueSpartan_700Bold', color: '#737373', marginBottom: 16, letterSpacing: 2, textTransform: 'uppercase' },
  toolCard: { backgroundColor: '#0a0a0a', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#1a1a1a' },
  toolIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  toolText: { flex: 1 },
  toolTitle: { fontSize: 17, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginBottom: 4 },
  toolDesc: { fontSize: 14, color: '#a3a3a3' },
});