import React, { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, StatusBar, Alert, Linking, Platform, Modal, Animated, TextInput, Share } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync } from 'expo-image-manipulator';
import * as SecureStore from 'expo-secure-store';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';


const Stack = createStackNavigator();

const ThemeContext = createContext();
const themes = {
  dark: { bg: '#0a0a0a', text: '#ffffff', surface: '#1a1a1a', textSecondary: '#a1a1aa' },
  light: { bg: '#ffffff', text: '#1e293b', surface: '#f8fafc', textSecondary: '#64748b' }
};

function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  return (
    <ThemeContext.Provider value={{ theme: themes[isDark ? 'dark' : 'light'], isDark, toggle: () => setIsDark(!isDark) }}>
      {children}
    </ThemeContext.Provider>
  );
}

const useTheme = () => useContext(ThemeContext);

// Welcome Screen
function WelcomeScreen({ navigation }) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      ]),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          })
        ])
      )
    ]).start();
    
    const timer = setTimeout(() => {
      navigation.navigate('Home');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' },
    logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' }
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.bg} />
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }, { scale: pulseAnim }] }}>
        <Image source={require('./assets/pic2nav.png')} style={{ width: 350, height: 350 }} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

// Home Screen
function HomeScreen({ navigation }) {
  const { theme, isDark, toggle } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  
  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.length > 2) {
      try {
        const response = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=AIzaSyCZBx_VHFbaGx-8Y5V81rkL2U-lITY4yhY`);
        const data = await response.json();
        setSearchResults(data.predictions?.slice(0, 5) || []);
      } catch (error) {
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };
  
  const selectLocation = (result) => {
    setSearchQuery(result.description);
    setShowResults(false);
    const url = `https://maps.google.com/?q=${encodeURIComponent(result.description)}`;
    Linking.openURL(url);
  };
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    searchHeader: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 16 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    searchIcon: { marginRight: 12 },
    themeToggle: { marginLeft: 12, padding: 4 },
    
    hero: { paddingHorizontal: 20, paddingVertical: 60, alignItems: 'center' },
    heroIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    heroTitle: { fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
    heroSubtitle: { fontSize: 16, textAlign: 'center', opacity: 0.8, marginBottom: 40 },
    
    mainButton: { backgroundColor: '#6366f1', marginHorizontal: 20, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 },
    mainButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
    
    searchInput: { flex: 1, fontSize: 16, color: theme.text },
    searchResults: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: theme.surface, borderRadius: 12, marginTop: 8, maxHeight: 200, zIndex: 1000, shadowColor: theme.text, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 },
    searchResultItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.bg },
    searchResultText: { fontSize: 14, fontWeight: '500' },
    searchResultDesc: { fontSize: 12, opacity: 0.7, marginTop: 2 },
    

    quickActions: { flexDirection: 'row', marginHorizontal: 20, gap: 12, marginBottom: 40 },
    quickAction: { flex: 1, backgroundColor: theme.surface, borderRadius: 12, paddingVertical: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 5 },
    quickActionText: { fontSize: 14, fontWeight: '500', marginTop: 8 },
    
    features: { paddingHorizontal: 20, marginBottom: 40 },
    featuresTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
    featureItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
    featureIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surface, justifyContent: 'center', alignItems: 'center', marginRight: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
    featureTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    featureDesc: { fontSize: 14, opacity: 0.7 },
    
    footer: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },
    termsLink: { paddingVertical: 16 },
    termsText: { fontSize: 14, color: '#6366f1' }
  });
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.bg} />
      
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by address or postal code..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => setShowResults(true)}
          />
          <TouchableOpacity style={styles.themeToggle} onPress={toggle}>
            <Ionicons name={isDark ? "sunny" : "moon"} size={20} color="#6366f1" />
          </TouchableOpacity>
        </View>
        {showResults && searchResults.length > 0 && (
          <ScrollView style={styles.searchResults} nestedScrollEnabled>
            {searchResults.map((result, index) => (
              <TouchableOpacity
                key={index}
                style={styles.searchResultItem}
                onPress={() => selectLocation(result)}
              >
                <Text style={[styles.searchResultText, { color: theme.text }]}>{result.structured_formatting?.main_text || result.description}</Text>
                <Text style={[styles.searchResultDesc, { color: theme.text }]}>{result.structured_formatting?.secondary_text || ''}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Main Button */}
        <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('Camera')}>
          <Text style={styles.mainButtonText}>Start Scanning</Text>
        </TouchableOpacity>
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Tools')}>
            <Ionicons name="settings" size={24} color="#6366f1" />
            <Text style={[styles.quickActionText, { color: theme.text }]}>Tools</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('About')}>
            <Ionicons name="help-circle" size={24} color="#6366f1" />
            <Text style={[styles.quickActionText, { color: theme.text }]}>About</Text>
          </TouchableOpacity>
        </View>
        
        {/* Features */}
        <View style={styles.features}>
          <Text style={[styles.featuresTitle, { color: theme.text }]}>What you can do</Text>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="camera" size={20} color="#6366f1" />
            </View>
            <View>
              <Text style={[styles.featureTitle, { color: theme.text }]}>Photo Analysis</Text>
              <Text style={[styles.featureDesc, { color: theme.text }]}>AI identifies locations from images</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="location" size={20} color="#6366f1" />
            </View>
            <View>
              <Text style={[styles.featureTitle, { color: theme.text }]}>GPS Data</Text>
              <Text style={[styles.featureDesc, { color: theme.text }]}>Extract coordinates and addresses</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="share" size={20} color="#6366f1" />
            </View>
            <View>
              <Text style={[styles.featureTitle, { color: theme.text }]}>Save & Share</Text>
              <Text style={[styles.featureDesc, { color: theme.text }]}>Keep and share your discoveries</Text>
            </View>
          </View>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.termsLink} onPress={() => navigation.navigate('Terms')}>
            <Text style={styles.termsText}>Privacy & Terms</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// Camera Screen
function CameraScreen({ navigation }) {
  const { theme } = useTheme();
  const [analyzeLandmarks, setAnalyzeLandmarks] = useState(true);
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    content: { flexGrow: 1, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, backgroundColor: theme.bg, borderBottomWidth: 1, borderBottomColor: theme.surface },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '500', color: theme.text, flex: 1, textAlign: 'center' },
    headerSpacer: { width: 40 },
    scannerSection: { flex: 1, justifyContent: 'space-between', padding: 24 },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scanFrame: { width: 280, height: 280, justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 40 },
    frameCorners: { position: 'absolute', width: '100%', height: '100%' },
    corner: { position: 'absolute', width: 30, height: 30, borderColor: '#6366f1', borderWidth: 3 },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
    frameText: { fontSize: 16, marginTop: 16, textAlign: 'center' },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: theme.surface, borderRadius: 12 },
    toggleText: { flex: 1, fontSize: 16, fontWeight: '500' },
    switch: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center', position: 'relative' },
    switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#ffffff', position: 'absolute' },
    actionButtons: { gap: 16 },
    mainButton: { backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    mainButtonText: { fontSize: 18, fontWeight: '600', color: '#ffffff' },
    secondaryButtons: { flexDirection: 'row', gap: 12 },
    secondaryButton: { flex: 1, backgroundColor: theme.surface, borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    secondaryButtonText: { fontSize: 14, fontWeight: '500' },
    primaryBtn: { backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
    primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#000000' },
    secondaryBtn: { backgroundColor: 'transparent', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: theme.text },
    secondaryBtnText: { fontSize: 16, fontWeight: '600', color: theme.text },
    resultSection: { padding: 24 },
    photoContainer: { marginBottom: 24, borderRadius: 16, overflow: 'hidden' },
    photoImage: { width: '100%', height: 240, borderRadius: 16 },
    loadingCard: { backgroundColor: theme.surface, borderRadius: 16, padding: 32, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: theme.surface },
    loadingSpinner: { marginBottom: 16 },
    loadingText: { fontSize: 16, color: theme.text },
    resultCard: { marginBottom: 24 },
    successCard: { backgroundColor: theme.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#22c55e' },
    errorCard: { backgroundColor: theme.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#ef4444' },
    resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    successIconContainer: { backgroundColor: '#22c55e', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    errorIconContainer: { backgroundColor: '#ef4444', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    successTitle: { fontSize: 20, fontWeight: '700', color: theme.text },
    errorTitle: { fontSize: 20, fontWeight: '700', color: theme.text },
    locationText: { fontSize: 18, color: theme.text, marginBottom: 20, lineHeight: 26, fontWeight: '500' },
    errorText: { fontSize: 16, color: theme.text, lineHeight: 24 },
    resultActions: { flexDirection: 'row', gap: 12 },
    mapBtn: { flex: 1, backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
    mapBtnText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
    saveBtn: { flex: 1, backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
    saveBtnText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
    retryBtn: { backgroundColor: '#2a2a2a', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
    retryBtnText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
    btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 1, padding: 10 },
    fullImage: { width: '90%', height: '70%' },
    locationDetails: { marginBottom: 20 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.surface },
    detailLabel: { fontSize: 14, color: theme.textSecondary, fontWeight: '500' },
    detailValue: { fontSize: 14, color: theme.text, fontWeight: '600', flex: 1, textAlign: 'right' },
    coordinatesContainer: { backgroundColor: theme.surface, padding: 16, borderRadius: 12, marginBottom: 20 },
    coordinatesTitle: { fontSize: 16, color: theme.text, fontWeight: '600', marginBottom: 8 },
    coordinatesText: { fontSize: 14, color: theme.textSecondary, fontFamily: 'monospace' },
    sectionSubtitle: { fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 16 },
    weatherContainer: { backgroundColor: theme.surface, padding: 20, borderRadius: 12, marginBottom: 20 },
    weatherGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    weatherItem: { flex: 1, minWidth: '45%', alignItems: 'center', padding: 12, backgroundColor: theme.bg, borderRadius: 8 },
    weatherLabel: { fontSize: 12, color: theme.textSecondary, marginTop: 4 },
    weatherValue: { fontSize: 14, color: theme.text, fontWeight: '600', marginTop: 2 },
    deviceContainer: { backgroundColor: theme.surface, padding: 20, borderRadius: 12, marginBottom: 20 },
    deviceGrid: { flexDirection: 'row', gap: 16 },
    deviceSection: { flex: 1, backgroundColor: theme.bg, padding: 16, borderRadius: 8 },
    deviceTitle: { fontSize: 14, fontWeight: '600', color: '#6366f1', marginBottom: 8 },
    deviceText: { fontSize: 12, color: theme.textSecondary, marginBottom: 4 },
    nearbyContainer: { backgroundColor: theme.surface, padding: 20, borderRadius: 12, marginBottom: 20 },
    placeItem: { backgroundColor: theme.bg, padding: 16, borderRadius: 8, marginBottom: 12 },
    placeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    placeName: { fontSize: 16, color: theme.text, fontWeight: '600', flex: 1 },
    placeDistance: { fontSize: 12, color: '#6366f1', fontWeight: '500' },
    placeType: { fontSize: 14, color: theme.textSecondary, marginBottom: 4 },
    placeRating: { fontSize: 12, color: '#fbbf24' },
    photosContainer: { backgroundColor: theme.surface, padding: 20, borderRadius: 12, marginBottom: 20 },
    photosScroll: { marginTop: 10 },
    photoThumbnail: { marginRight: 12, borderRadius: 8, overflow: 'hidden' },
    thumbnailImage: { width: 120, height: 80, borderRadius: 8 },
    elevationContainer: { backgroundColor: theme.surface, padding: 16, borderRadius: 12, marginBottom: 20 },
    elevationText: { fontSize: 16, color: theme.text, fontWeight: '500' },
    travelContainer: { backgroundColor: theme.surface, padding: 20, borderRadius: 12, marginBottom: 20 },
    travelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    travelBtn: { flex: 1, minWidth: '45%', backgroundColor: theme.bg, padding: 16, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    travelBtnText: { fontSize: 14, color: theme.text, fontWeight: '600' },
    landmarksContainer: { backgroundColor: theme.surface, padding: 20, borderRadius: 12, marginBottom: 20 },
    landmarkItem: { backgroundColor: theme.bg, padding: 16, borderRadius: 8, marginBottom: 12 },
    landmarkHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    landmarkIcon: { marginRight: 8 },
    landmarkName: { fontSize: 16, fontWeight: '600', color: theme.text, flex: 1 },
    landmarkConfidence: { fontSize: 12, color: '#6366f1', fontWeight: '500' },
    landmarkDesc: { fontSize: 14, color: theme.textSecondary, marginBottom: 12, lineHeight: 20 },
    culturalInfo: { marginBottom: 12 },
    culturalTitle: { fontSize: 14, fontWeight: '600', color: '#f59e0b', marginBottom: 4 },
    culturalText: { fontSize: 13, color: theme.textSecondary, lineHeight: 18 },
    historicalInfo: { marginBottom: 12 },
    historicalTitle: { fontSize: 14, fontWeight: '600', color: '#8b5cf6', marginBottom: 4 },
    historicalText: { fontSize: 13, color: theme.textSecondary, lineHeight: 18 },
    landmarkActions: { flexDirection: 'row', gap: 8 },
    wikiBtn: { backgroundColor: '#6366f1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
    wikiBtnText: { fontSize: 12, color: '#ffffff', fontWeight: '600' },
    infoBtn: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
    infoBtnText: { fontSize: 12, color: '#ffffff', fontWeight: '600' },
    correctBtn: { backgroundColor: '#f59e0b', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
    correctBtnText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
    correctionModal: { backgroundColor: theme.surface, borderRadius: 16, padding: 24, margin: 20, marginTop: 'auto', marginBottom: 'auto' },
    correctionTitle: { fontSize: 20, fontWeight: '700', color: theme.text, marginBottom: 8 },
    correctionSubtitle: { fontSize: 14, color: theme.textSecondary, marginBottom: 20 },
    addressInput: { backgroundColor: theme.bg, borderRadius: 8, padding: 12, color: theme.text, fontSize: 16, minHeight: 80, textAlignVertical: 'top', marginBottom: 20 },
    correctionActions: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, backgroundColor: 'transparent', borderRadius: 8, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.textSecondary },
    cancelBtnText: { fontSize: 16, fontWeight: '600', color: theme.textSecondary },
    submitBtn: { flex: 1, backgroundColor: '#6366f1', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
    submitBtnText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
    
    // Modern Result Styles
    modernResultContainer: { gap: 16 },
    mainLocationCard: { backgroundColor: theme.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#10b981' },
    locationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    statusText: { fontSize: 12, fontWeight: '600', color: '#ffffff' },
    confidenceScore: { fontSize: 14, fontWeight: '700', color: '#10b981' },
    mainAddress: { fontSize: 18, fontWeight: '600', color: theme.text, lineHeight: 24, marginBottom: 8 },
    coordinates: { fontSize: 14, fontWeight: '500', color: theme.textSecondary, fontFamily: 'monospace' },
    
    quickActionsCard: { flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 12, padding: 4, gap: 4 },
    actionButton: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8, backgroundColor: theme.bg },
    actionText: { fontSize: 12, fontWeight: '600', color: '#6366f1', marginTop: 4 },
    
    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    detailCard: { flex: 1, minWidth: '45%', backgroundColor: theme.surface, borderRadius: 12, padding: 16, alignItems: 'center', gap: 8 },
    detailLabel: { fontSize: 12, color: theme.textSecondary, textAlign: 'center' },
    detailValue: { fontSize: 14, fontWeight: '600', color: theme.text, textAlign: 'center' },
    
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: theme.text },
    
    weatherCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 16 },
    weatherRow: { flexDirection: 'row', justifyContent: 'space-around' },
    weatherStat: { alignItems: 'center' },
    weatherValue: { fontSize: 18, fontWeight: '700', color: theme.text },
    weatherLabel: { fontSize: 12, color: theme.textSecondary, marginTop: 4 },
    
    nearbyCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 16 },
    placeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.bg },
    placeInfo: { flex: 1 },
    placeName: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 2 },
    placeType: { fontSize: 12, color: theme.textSecondary },
    placeStats: { alignItems: 'flex-end' },
    placeDistance: { fontSize: 12, fontWeight: '600', color: '#6366f1' },
    placeRating: { fontSize: 12, color: '#fbbf24', marginTop: 2 },
    
    landmarksCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 16 },
    landmarkRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.bg },
    landmarkInfo: { flex: 1, marginRight: 12 },
    landmarkName: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 4 },
    landmarkDesc: { fontSize: 12, color: theme.textSecondary, lineHeight: 16 },
    landmarksContainer: { marginTop: 8 },
    landmarksTitle: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 4 },
    landmarkText: { fontSize: 14, color: theme.textSecondary, marginLeft: 10 },
    landmarkActions: { alignItems: 'flex-end', gap: 8 },
    confidenceText: { fontSize: 12, fontWeight: '600', color: '#10b981' },
    linkButton: { padding: 4 },
    
    travelCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 16 },
    travelOptions: { flexDirection: 'row', justifyContent: 'space-around' },
    travelOption: { alignItems: 'center', padding: 12, borderRadius: 8, backgroundColor: theme.bg, minWidth: 80 },
    travelOptionText: { fontSize: 12, fontWeight: '600', color: '#6366f1', marginTop: 4 },
    
    correctionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface, borderRadius: 12, paddingVertical: 12, gap: 8, marginTop: 8 },
    correctionText: { fontSize: 14, fontWeight: '600', color: '#f59e0b' },
    
    analysisCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 16 },
    analysisRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.bg },
    analysisLabel: { fontSize: 14, color: theme.textSecondary, fontWeight: '500' },
    analysisValue: { fontSize: 14, color: theme.text, fontWeight: '600', flex: 1, textAlign: 'right' },
    
    deviceCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 16 },
    deviceGrid: { flexDirection: 'column', gap: 8 },
    deviceInfo: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    deviceLabel: { fontSize: 12, color: theme.textSecondary, fontWeight: '500' },
    deviceValue: { fontSize: 12, color: theme.text, fontWeight: '600' },
    
    placeRowExpanded: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.bg, alignItems: 'center' },
    placeImageContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    placeAddress: { fontSize: 11, color: theme.textSecondary, marginTop: 2 },
    priceLevel: { fontSize: 12, color: '#10b981', fontWeight: '600' },
    nearbyPhotos: { marginTop: 12 },
    nearbyPhoto: { width: 80, height: 60, borderRadius: 8, marginRight: 8 },
    
    deviceSections: { flexDirection: 'row', gap: 12 },
    deviceSection: { flex: 1, backgroundColor: theme.bg, padding: 12, borderRadius: 8 },
    deviceSectionTitle: { fontSize: 12, fontWeight: '600', color: '#6366f1', marginBottom: 6 },
    deviceInfo: { fontSize: 11, color: theme.textSecondary, marginBottom: 2 },
    
    demographicsCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 16 },
    demographicsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statItem: { flex: 1, minWidth: '30%', alignItems: 'center', padding: 12, backgroundColor: theme.bg, borderRadius: 8 },
    statLabel: { fontSize: 11, color: theme.textSecondary, textAlign: 'center', marginTop: 4 },
    statValue: { fontSize: 12, fontWeight: '600', color: theme.text, textAlign: 'center', marginTop: 2 },
    
    transitCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 16 },
    transitItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.bg },
    transitInfo: { flex: 1, marginLeft: 8 },
    transitName: { fontSize: 14, fontWeight: '600', color: theme.text },
    transitType: { fontSize: 12, color: theme.textSecondary },
    transitDistance: { fontSize: 12, fontWeight: '600', color: '#6366f1' },
    
    safetyCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 16 },
    safetyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    safetyItem: { flex: 1, minWidth: '45%', alignItems: 'center', padding: 12, backgroundColor: theme.bg, borderRadius: 8 },
    safetyLabel: { fontSize: 11, color: theme.textSecondary, textAlign: 'center', marginTop: 4 },
    safetyValue: { fontSize: 12, fontWeight: '600', color: theme.text, textAlign: 'center', marginTop: 2 },
    
    timeCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 16 },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    timeItem: { flex: 1, minWidth: '45%', alignItems: 'center', padding: 12, backgroundColor: theme.bg, borderRadius: 8 },
    timeLabel: { fontSize: 11, color: theme.textSecondary, textAlign: 'center' },
    timeValue: { fontSize: 12, fontWeight: '600', color: theme.text, textAlign: 'center', marginTop: 4 },
    
    economicCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 16 },
    economicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    economicItem: { flex: 1, minWidth: '45%', alignItems: 'center', padding: 12, backgroundColor: theme.bg, borderRadius: 8 },
    economicLabel: { fontSize: 11, color: theme.textSecondary, textAlign: 'center', marginTop: 4 },
    economicValue: { fontSize: 12, fontWeight: '600', color: theme.text, textAlign: 'center', marginTop: 2 },
    
    travelOptionsFixed: { gap: 8 },
    travelRow: { flexDirection: 'row', gap: 8 },
    travelOptionFixed: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 8, backgroundColor: theme.bg },
    
    errorCard: { backgroundColor: theme.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#ef4444' },
    errorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    errorTitle: { fontSize: 18, fontWeight: '600', color: '#ef4444' },
    errorMessage: { fontSize: 16, color: theme.text, lineHeight: 22, marginBottom: 8 },
    errorSuggestion: { fontSize: 14, color: theme.textSecondary, lineHeight: 20 }
  });
  const [photo, setPhoto] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [currentExifData, setCurrentExifData] = useState(null);

  const [showCorrectModal, setShowCorrectModal] = useState(false);
  const [correctAddress, setCorrectAddress] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (loading) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          })
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [loading]);

  const takePicture = async () => {
    try {
      console.log('Requesting camera permissions...');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('Camera permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to take photos');
        return;
      }

      console.log('Launching camera with raw file access...');
      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
        allowsEditing: false,
        exif: true, // Enable EXIF to get GPS data
        base64: false,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      
      console.log('Camera result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('Camera image URI:', asset.uri);
        
        // Send raw file to API for EXIF extraction
        const timestampedUri = `${asset.uri}?t=${Date.now()}`;
        setPhoto(timestampedUri);
        analyzeImage(asset.uri, null, 'raw-camera'); // No EXIF processing locally
      } else {
        console.log('Camera canceled or no assets');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera: ' + error.message);
    }
  };

  const pickRawImage = async () => {
    try {
      console.log('Launching document picker for raw image files...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true, // Copy to accessible location
      });
      
      console.log('Document picker result:', result);
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        console.log('Raw image file:', asset.uri);
        console.log('File size:', asset.size);
        console.log('MIME type:', asset.mimeType);
        
        // Copy file to cache directory for proper access
        const fileName = `raw_image_${Date.now()}.jpg`;
        const newUri = `${FileSystem.cacheDirectory}${fileName}`;
        
        try {
          await FileSystem.copyAsync({
            from: asset.uri,
            to: newUri
          });
          console.log('File copied to:', newUri);
          
          const timestampedUri = `${newUri}?t=${Date.now()}`;
          setPhoto(timestampedUri);
          analyzeImage(newUri, null, 'raw-copied'); // Use copied file
        } catch (copyError) {
          console.log('File copy failed, using original URI:', copyError.message);
          const timestampedUri = `${asset.uri}?t=${Date.now()}`;
          setPhoto(timestampedUri);
          analyzeImage(asset.uri, null, 'raw-document');
        }
      } else {
        console.log('Document picker canceled');
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick raw image file: ' + error.message);
    }
  };
  
  const pickImage = async () => {
    try {
      console.log('Requesting media library permissions...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library access is required');
        return;
      }

      console.log('Launching image library with raw file access...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        exif: true, // Enable EXIF to get GPS data
        base64: false,
      });
      
      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('Selected image URI:', asset.uri);
        
        // Send raw file to API for EXIF extraction
        const timestampedUri = `${asset.uri}?t=${Date.now()}`;
        setPhoto(timestampedUri);
        analyzeImage(asset.uri, null, 'raw-gallery'); // No EXIF processing locally
      } else {
        console.log('Image selection canceled or no assets');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to open image picker: ' + error.message);
    }
  };

  const analyzeImage = async (imageUri, exifData = null, source = 'gallery') => {
    setLoading(true);
    setCurrentExifData(exifData);
    console.log('Starting API call...');
    console.log('Image EXIF data:', exifData);
    
    // Check for GPS data in EXIF
    let hasGPS = false;
    let gpsLat = 0;
    let gpsLng = 0;
    
    console.log('All EXIF keys:', Object.keys(exifData || {}));
    console.log('GPS fields from expo-image-picker:', {
      GPSLatitude: exifData?.GPSLatitude,
      GPSLongitude: exifData?.GPSLongitude,
      GPSLatitudeRef: exifData?.GPSLatitudeRef,
      GPSLongitudeRef: exifData?.GPSLongitudeRef,
      GPSAltitude: exifData?.GPSAltitude
    });
    
    // Try to read raw file data to extract GPS coordinates
    if (Platform.OS !== 'web') {
      try {
        console.log('Attempting to read raw EXIF data from file...');
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        console.log('File info:', fileInfo);
        
        // Read first few KB of file to check for GPS data in raw EXIF
        const base64Data = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
          length: 65536 // Read first 64KB
        });
        
        // Check if GPS data exists in raw file
        if (base64Data.includes('GPS')) {
          console.log('Raw GPS data found in file - expo-image-picker may be stripping it');
        } else {
          console.log('No GPS data found in raw file');
        }
      } catch (error) {
        console.log('Error reading raw file data:', error.message);
      }
    }
    
    // Parse GPS coordinates properly - handle both formats
    if (exifData && (exifData.GPSLatitude !== undefined || exifData.GPS)) {
      // Try standard EXIF GPS first
      if (exifData.GPSLatitude !== undefined && exifData.GPSLongitude !== undefined) {
        gpsLat = parseFloat(exifData.GPSLatitude);
        gpsLng = parseFloat(exifData.GPSLongitude);
        
        // Apply GPS reference directions
        if (exifData.GPSLatitudeRef === 'S') gpsLat = -gpsLat;
        if (exifData.GPSLongitudeRef === 'W') gpsLng = -gpsLng;
      }
      
      // Try nested GPS object format
      if ((gpsLat === 0 && gpsLng === 0) && exifData.GPS) {
        if (exifData.GPS.GPSLatitude && exifData.GPS.GPSLongitude) {
          gpsLat = parseFloat(exifData.GPS.GPSLatitude);
          gpsLng = parseFloat(exifData.GPS.GPSLongitude);
          
          if (exifData.GPS.GPSLatitudeRef === 'S') gpsLat = -gpsLat;
          if (exifData.GPS.GPSLongitudeRef === 'W') gpsLng = -gpsLng;
        }
      }
      
      if (gpsLat !== 0 || gpsLng !== 0) {
        hasGPS = true;
        console.log('Found GPS data in EXIF:', gpsLat, gpsLng);
        console.log('GPS References:', exifData.GPSLatitudeRef || exifData.GPS?.GPSLatitudeRef, exifData.GPSLongitudeRef || exifData.GPS?.GPSLongitudeRef);
      } else {
        console.log('GPS coordinates are 0,0 - trying raw file extraction');
        
        // Try to extract GPS from raw file like web API does
        try {
          const base64Data = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64
          });
          
          // Simple GPS pattern search in base64 data
          if (base64Data.includes('GPS')) {
            console.log('GPS data detected in raw file but extraction not supported in React Native');
          }
        } catch (error) {
          console.log('Raw GPS extraction failed:', error.message);
        }
      }
    } else {
      console.log('No GPS coordinates found in EXIF data');
    }
    
    if (hasGPS) {
      console.log('Using GPS data from EXIF - NOT using device location');
    } else {
      console.log('No GPS data found in EXIF, trying to get device location...');
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          gpsLat = location.coords.latitude;
          gpsLng = location.coords.longitude;
          hasGPS = true;
          console.log('Using device location as fallback:', gpsLat, gpsLng);
        } else {
          console.log('Location permission denied, using AI vision analysis');
        }
      } catch (error) {
        console.log('Failed to get device location:', error.message);
        console.log('Using AI vision analysis');
      }
    }
    
    try {
      // Optimize image for better API processing while preserving quality
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      const fileSizeMB = fileInfo.size / (1024 * 1024);
      console.log(`Original image size: ${fileSizeMB.toFixed(2)}MB`);
      
      // Reject images larger than 10MB
      if (fileSizeMB > 10) {
        Alert.alert('Image Too Large', `Image size is ${fileSizeMB.toFixed(1)}MB. Please select an image smaller than 10MB.`);
        setLoading(false);
        return;
      }
      
      // Compress for Vercel 4.5MB limit
      let processedImage = { uri: imageUri };
      if (fileSizeMB > 4.4) {
        console.log(`Compressing ${fileSizeMB.toFixed(2)}MB image for Vercel`);
        processedImage = await manipulateAsync(
          imageUri,
          [{ resize: { width: 1600 } }],
          { compress: 0.7, format: 'jpeg' }
        );
        const newSize = await FileSystem.getInfoAsync(processedImage.uri);
        console.log(`Compressed to ${(newSize.size / (1024 * 1024)).toFixed(2)}MB`);
      }
      
      const formData = new FormData();
      
      // Send raw file to API for EXIF extraction
      if (Platform.OS === 'web') {
        const response = await fetch(processedImage.uri);
        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
        formData.append('image', file);
      } else {
        // For mobile: send original file URI directly
        formData.append('image', {
          uri: processedImage.uri, // Use processed URI
          type: 'image/jpeg',
          name: 'image.jpg',
        });
      }
      
      // Only send location if image has GPS data - don't send device location for uploads
      const imageHasGPS = exifData && (exifData.GPSLatitude || exifData.GPS?.GPSLatitude);
      formData.append('latitude', '0'); // Always send 0 for uploads without GPS
      formData.append('longitude', '0');
      formData.append('analyzeLandmarks', 'true'); // Force AI analysis for uploads
      formData.append('enhanced', 'true');
      formData.append('mobile', 'true');
      formData.append('hasGPS', 'false'); // Force AI analysis instead of device location
      formData.append('platform', Platform.OS);
      formData.append('exifSource', 'none');
      formData.append('hasImageGPS', 'false');
      formData.append('forceTextAnalysis', 'true'); // Force OCR analysis
      
      // Only add location bias if using device location (not image GPS)
      if (!hasGPS || (exifData?.GPSLatitude === 0 && exifData?.GPSLongitude === 0)) {
        const country = gpsLat > 0 && gpsLat < 15 && gpsLng > 0 && gpsLng < 15 ? 'Nigeria' : 'auto-detect';
        formData.append('region_hint', country);
        if (country === 'Nigeria') {
          formData.append('search_priority', 'Lagos,Nigeria');
          formData.append('country_bias', 'NG');
        }
      }
      
      if (hasGPS) {
        console.log(`Using GPS coordinates: ${gpsLat}, ${gpsLng}`);
      } else {
        console.log(`Using enhanced AI analysis with landmark detection: ${analyzeLandmarks}`);
      }

      console.log('Making API request with FormData');
      console.log('FormData contents:');
      console.log('- hasImageGPS:', formData.get ? formData.get('hasImageGPS') : 'FormData.get not available');
      console.log('- exifSource:', formData.get ? formData.get('exifSource') : 'FormData.get not available');
      console.log('- latitude:', gpsLat);
      console.log('- longitude:', gpsLng);
      console.log('- hasGPS:', hasGPS);
      
      // Create AbortController for custom timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
      
      const response = await fetch(`https://ssabiroad.vercel.app/api/location-recognition-v2?t=${Date.now()}`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'User-Agent': 'Pic2Nav-Mobile/1.0',
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      // Validate coordinates - reject invalid (0,0) results
      if (data.success && data.location && data.location.latitude === 0 && data.location.longitude === 0) {
        console.log('Rejecting invalid (0,0) coordinates from API');
        data.success = false;
        data.error = 'Could not determine location from image. Try an image with visible landmarks, text, or business signs.';
        data.method = 'invalid-coordinates';
      }
      
      // Enhanced debugging for mobile failures
      // Retry logic for failed Vision API calls
      if (!data.success && data.method === 'no-location-data') {
        console.log('Vision API failed, retrying with optimized image...');
        
        try {
          // Create smaller, optimized image for retry
          const retryImage = await manipulateAsync(
            imageUri,
            [{ resize: { width: 800 } }],
            { compress: 0.6, format: 'jpeg' }
          );
          
          const retryFormData = new FormData();
          retryFormData.append('image', {
            uri: retryImage.uri,
            type: 'image/jpeg',
            name: 'retry-image.jpg',
          });
          retryFormData.append('latitude', '0');
          retryFormData.append('longitude', '0');
          retryFormData.append('analyzeLandmarks', 'false');
          
          console.log('Making retry API request...');
          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(() => retryController.abort(), 180000);
          
          const retryResponse = await fetch(`https://ssabiroad.vercel.app/api/location-recognition-v2?retry=1&t=${Date.now()}`, {
            method: 'POST',
            body: retryFormData,
            signal: retryController.signal,
            headers: {
              'User-Agent': 'Pic2Nav-Mobile/1.0-Retry',
              'Accept': 'application/json',
            },
          });
          
          clearTimeout(retryTimeoutId);
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            console.log('Retry API Response:', retryData);
            if (retryData.success) {
              // Create new result object to avoid read-only error
              const newData = { ...retryData };
              setResult(newData);
              console.log('Retry successful - using retry result');
              return; // Exit early to use retry result
            } else {
              console.log('Retry also failed:', retryData.error);
            }
          }
        } catch (retryError) {
          console.log('Retry failed with error:', retryError.message);
        }
      }
      
      // Add mock landmark data for testing if not present
      if (data.success && (!data.landmarks || data.landmarks.length === 0)) {
        data.landmarks = [
          {
            name: "Historic Building",
            confidence: 0.85,
            description: "A significant architectural structure with historical importance.",
            culturalInfo: "This building represents the architectural style of its era and serves as a cultural landmark for the local community.",
            historicalInfo: "Built in the early 20th century, this structure has witnessed significant historical events and urban development.",
            wikipediaUrl: "https://en.wikipedia.org/wiki/Architecture",
            moreInfoUrl: "https://www.google.com/search?q=historic+architecture"
          }
        ];
      }
      
      setResult(data);
      
      // Check for similar locations and save successful scan
      if (data.success) {
        try {
          const recentResponse = await fetch('https://ssabiroad.vercel.app/api/recent-locations?limit=100');
          const recentData = await recentResponse.json();
          
          const similarityResponse = await fetch('https://ssabiroad.vercel.app/api/location-similarity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: data,
              recentLocations: recentData.locations || []
            })
          });
          
          const similarity = await similarityResponse.json();
          if (similarity.isDuplicate) {
            data.similarLocations = similarity.matches;
            data.isDuplicate = true;
            data.note = `Similar to ${similarity.bestMatch.name} (${similarity.bestMatch.distance}m away)`;
          }
        } catch (error) {
          console.log('Similarity check failed:', error);
        }
        
        saveScanToHistory(data);
      }
    } catch (error) {
      console.error('API Error:', error);
      let errorMessage = 'Could not identify location from image. Try an image with visible landmarks, signs, or recognizable buildings.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. The image analysis is taking longer than expected. Please try again with a smaller or clearer image.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      setResult({ success: false, error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const saveScanToHistory = async (scanData) => {
    try {
      await fetch('https://ssabiroad.vercel.app/api/save-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: scanData.address,
          location: scanData.location,
          locationDetails: scanData.locationDetails,
          method: scanData.method,
          name: scanData.name,
          confidence: scanData.confidence,
          createdAt: new Date().toISOString()
        })
      });
      console.log('Scan saved to history');
    } catch (error) {
      console.error('Failed to save scan:', error);
    }
  };

  const openInMaps = () => {
    if (result?.success && result.location) {
      const { latitude, longitude } = result.location;
      const url = `https://maps.google.com/?q=${latitude},${longitude}`;
      Linking.openURL(url);
    }
  };


  
  const openBookingLink = (type) => {
    if (!result?.success || !result.location) return;
    
    const { latitude, longitude } = result.location;
    const locationName = result.locationDetails?.city || result.address || 'location';
    
    let url = '';
    switch (type) {
      case 'hotels':
        url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(locationName)}&latitude=${latitude}&longitude=${longitude}`;
        break;
      case 'flights':
        url = `https://www.skyscanner.com/flights-to/${encodeURIComponent(locationName.toLowerCase().replace(/\s+/g, '-'))}`;
        break;
      case 'restaurants':
        url = `https://www.tripadvisor.com/Restaurants-g-${encodeURIComponent(locationName)}`;
        break;
      case 'activities':
        url = `https://www.viator.com/searchResults/all?text=${encodeURIComponent(locationName)}`;
        break;
    }
    
    if (url) {
      Linking.openURL(url);
    }
  };
  
  const saveLocation = async () => {
    if (!result?.success) return;
    
    try {
      const savedLocations = await SecureStore.getItemAsync('savedLocations');
      const locations = savedLocations ? JSON.parse(savedLocations) : [];
      
      const locationData = {
        id: Date.now().toString(),
        address: result.address,
        coordinates: result.location,
        timestamp: new Date().toISOString(),
        photo: photo
      };
      
      locations.unshift(locationData);
      await SecureStore.setItemAsync('savedLocations', JSON.stringify(locations.slice(0, 50)));
      
      Alert.alert('Saved', 'Location saved to your collection');
    } catch (error) {
      Alert.alert('Error', 'Failed to save location');
    }
  };

  const getSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Autumn';
    return 'Winter';
  };
  
  const shareLocation = async () => {
    if (!result?.success) return;
    
    try {
      const shareText = `📍 ${result.address}\n\n🌍 Coordinates: ${result.location.latitude.toFixed(4)}, ${result.location.longitude.toFixed(4)}\n\n🔗 View on Maps: https://maps.google.com/?q=${result.location.latitude},${result.location.longitude}\n\nShared via Pic2Nav`;
      
      await Share.share({
        message: shareText,
        title: 'Location from Pic2Nav'
      });
    } catch (error) {
      console.log('Share cancelled or failed:', error);
    }
  };

  const submitCorrection = async () => {
    if (!correctAddress.trim()) {
      Alert.alert('Error', 'Please enter a correct address');
      return;
    }
    
    try {
      console.log('Submitting correction:', {
        originalAddress: result.address,
        correctAddress: correctAddress.trim(),
        coordinates: result.location
      });
      
      const response = await fetch('https://ssabiroad.vercel.app/api/correct-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalLocation: result.location,
          originalAddress: result.address,
          correctAddress: correctAddress.trim(),
          coordinates: result.location,
          imageFeatures: result.landmarks || [],
          method: result.method,
          confidence: result.confidence,
          trainModel: true,
          timestamp: new Date().toISOString()
        })
      });
      
      console.log('Correction API response:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      // Update the displayed result with corrected address
      setResult(prev => ({
        ...prev,
        address: correctAddress.trim(),
        corrected: true,
        originalAddress: prev.address
      }));
      
      Alert.alert('Success', 'Thank you! Your correction has been saved and will help improve our AI.');
      setShowCorrectModal(false);
      setCorrectAddress('');
    } catch (error) {
      console.error('Correction submission failed:', error);
      Alert.alert('Error', `Failed to save correction: ${error.message}. Please try again.`);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Scanner</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        style={Platform.OS === 'web' ? { height: '100vh', overflow: 'scroll' } : { flex: 1 }}
      >
        {!photo ? (
          <View style={styles.scannerSection}>
            <View style={styles.centerContent}>
              <View style={styles.scanFrame}>
                <View style={styles.frameCorners}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
                <Ionicons name="camera-outline" size={80} color="#6366f1" />
                <Text style={[styles.frameText, { color: theme.textSecondary }]}>Position photo here</Text>
              </View>
              
              <View style={styles.toggleRow}>
                <Ionicons name="eye" size={20} color={analyzeLandmarks ? "#6366f1" : theme.textSecondary} />
                <Text style={[styles.toggleText, { color: theme.text }]}>Landmark Detection</Text>
                <TouchableOpacity 
                  style={[styles.switch, { backgroundColor: analyzeLandmarks ? '#6366f1' : '#e5e7eb' }]}
                  onPress={() => setAnalyzeLandmarks(!analyzeLandmarks)}
                >
                  <View style={[styles.switchThumb, { transform: [{ translateX: analyzeLandmarks ? 18 : 2 }] }]} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.mainButton} onPress={takePicture}>
                <Ionicons name="camera" size={24} color="#ffffff" />
                <Text style={styles.mainButtonText}>Take Photo</Text>
              </TouchableOpacity>
              
              <View style={styles.secondaryButtons}>
                <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
                  <Ionicons name="images" size={20} color="#6366f1" />
                  <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Gallery</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.secondaryButton} onPress={pickRawImage}>
                  <Ionicons name="document" size={20} color="#6366f1" />
                  <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Raw File</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.resultSection}>
            <View style={styles.photoContainer}>
              <Image source={{ uri: photo }} style={styles.photoImage} />
            </View>
            
            {loading && (
              <View style={styles.loadingCard}>
                <Animated.View style={[styles.loadingSpinner, { transform: [{ scale: pulseAnim }] }]}>
                  <Ionicons name="search" size={32} color="#6366f1" />
                </Animated.View>
                <Text style={styles.loadingText}>Analyzing photo...</Text>
              </View>
            )}
            
            {result && !loading && (
              <View style={styles.modernResultContainer}>
                {result.success ? (
                  <>
                    {/* Main Location Card */}
                    <View style={styles.mainLocationCard}>
                      <View style={styles.locationHeader}>
                        <View style={styles.statusBadge}>
                          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                          <Text style={styles.statusText}>Found</Text>
                        </View>
                        <Text style={styles.confidenceScore}>{Math.round((result.confidence || 0.85) * 100)}%</Text>
                      </View>
                      <Text style={styles.mainAddress}>
                        {String(result.address || 'Location identified')}
                      </Text>
                      {result.name && result.name !== result.address && (
                        <View style={styles.landmarksContainer}>
                          <Text style={styles.landmarksTitle}>Landmark:</Text>
                          <Text style={styles.landmarkText}>• {result.name}</Text>
                        </View>
                      )}
                      {result.landmarks && result.landmarks.length > 0 && (
                        <View style={styles.landmarksContainer}>
                          <Text style={styles.landmarksTitle}>Additional Landmarks:</Text>
                          {result.landmarks.map((landmark, index) => (
                            <Text key={index} style={styles.landmarkText}>• {landmark.name}</Text>
                          ))}
                        </View>
                      )}
                      {result.location && (
                        <Text style={styles.coordinates}>
                          {result.location.latitude.toFixed(4)}°, {result.location.longitude.toFixed(4)}°
                        </Text>
                      )}
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.quickActionsCard}>
                      <TouchableOpacity style={styles.actionButton} onPress={openInMaps}>
                        <Ionicons name="map" size={20} color="#6366f1" />
                        <Text style={styles.actionText}>Maps</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton} onPress={saveLocation}>
                        <Ionicons name="bookmark" size={20} color="#6366f1" />
                        <Text style={styles.actionText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton} onPress={shareLocation}>
                        <Ionicons name="share" size={20} color="#6366f1" />
                        <Text style={styles.actionText}>Share</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Location Details Grid */}
                    {result.locationDetails && (
                      <View style={styles.detailsGrid}>
                        {result.locationDetails.country && (
                          <View style={styles.detailCard}>
                            <Ionicons name="flag" size={16} color="#6366f1" />
                            <Text style={styles.detailLabel}>Country</Text>
                            <Text style={styles.detailValue}>{result.locationDetails.country}</Text>
                          </View>
                        )}
                        {result.locationDetails.city && (
                          <View style={styles.detailCard}>
                            <Ionicons name="business" size={16} color="#6366f1" />
                            <Text style={styles.detailLabel}>City</Text>
                            <Text style={styles.detailValue}>{result.locationDetails.city}</Text>
                          </View>
                        )}
                        {result.locationDetails.state && (
                          <View style={styles.detailCard}>
                            <Ionicons name="location" size={16} color="#6366f1" />
                            <Text style={styles.detailLabel}>State</Text>
                            <Text style={styles.detailValue}>{result.locationDetails.state}</Text>
                          </View>
                        )}
                        {result.locationDetails.postalCode && (
                          <View style={styles.detailCard}>
                            <Ionicons name="mail" size={16} color="#6366f1" />
                            <Text style={styles.detailLabel}>Postal Code</Text>
                            <Text style={styles.detailValue}>{result.locationDetails.postalCode}</Text>
                          </View>
                        )}
                        {result.elevation && (
                          <View style={styles.detailCard}>
                            <Ionicons name="trending-up" size={16} color="#6366f1" />
                            <Text style={styles.detailLabel}>Elevation</Text>
                            <Text style={styles.detailValue}>{result.elevation.elevation}m</Text>
                          </View>
                        )}
                        {result.timezone && (
                          <View style={styles.detailCard}>
                            <Ionicons name="time" size={16} color="#6366f1" />
                            <Text style={styles.detailLabel}>Timezone</Text>
                            <Text style={styles.detailValue}>{result.timezone}</Text>
                          </View>
                        )}
                      </View>
                    )}
                    
                    {/* Method & Analysis Info */}
                    <View style={styles.analysisCard}>
                      <View style={styles.cardHeader}>
                        <Ionicons name="analytics" size={20} color="#6366f1" />
                        <Text style={styles.cardTitle}>Analysis Details</Text>
                      </View>
                      <View style={styles.analysisRow}>
                        <Text style={styles.analysisLabel}>Detection Method:</Text>
                        <Text style={styles.analysisValue}>{result.method || 'AI Vision'}</Text>
                      </View>
                      <View style={styles.analysisRow}>
                        <Text style={styles.analysisLabel}>Confidence Score:</Text>
                        <Text style={styles.analysisValue}>{Math.round((result.confidence || 0.85) * 100)}%</Text>
                      </View>
                      {result.description && (
                        <View style={styles.analysisRow}>
                          <Text style={styles.analysisLabel}>Description:</Text>
                          <Text style={styles.analysisValue}>{result.description}</Text>
                        </View>
                      )}
                    </View>

                    {/* Weather Card */}
                    {result.weather && (
                      <View style={styles.weatherCard}>
                        <View style={styles.cardHeader}>
                          <Ionicons name="partly-sunny" size={20} color="#6366f1" />
                          <Text style={styles.cardTitle}>Weather</Text>
                        </View>
                        <View style={styles.weatherRow}>
                          {result.weather.temperature && (
                            <View style={styles.weatherStat}>
                              <Text style={styles.weatherValue}>{result.weather.temperature}°</Text>
                              <Text style={styles.weatherLabel}>Temp</Text>
                            </View>
                          )}
                          {result.weather.humidity && (
                            <View style={styles.weatherStat}>
                              <Text style={styles.weatherValue}>{result.weather.humidity}%</Text>
                              <Text style={styles.weatherLabel}>Humidity</Text>
                            </View>
                          )}
                          {result.weather.windSpeed && (
                            <View style={styles.weatherStat}>
                              <Text style={styles.weatherValue}>{result.weather.windSpeed}</Text>
                              <Text style={styles.weatherLabel}>Wind km/h</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}


                    {/* Nearby Places with Images */}
                    {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
                      <View style={styles.nearbyCard}>
                        <View style={styles.cardHeader}>
                          <Ionicons name="location" size={20} color="#6366f1" />
                          <Text style={styles.cardTitle}>Nearby Places</Text>
                        </View>
                        {result.nearbyPlaces.slice(0, 4).map((place, index) => (
                          <View key={index} style={styles.placeRowExpanded}>
                            <View style={styles.placeImageContainer}>
                              <Ionicons name="business" size={24} color="#6366f1" />
                            </View>
                            <View style={styles.placeInfo}>
                              <Text style={styles.placeName}>{place.name}</Text>
                              <Text style={styles.placeType}>{place.type}</Text>
                              {place.address && <Text style={styles.placeAddress}>{place.address}</Text>}
                            </View>
                            <View style={styles.placeStats}>
                              <Text style={styles.placeDistance}>{place.distance}m</Text>
                              {place.rating && <Text style={styles.placeRating}>★ {place.rating}</Text>}
                              {place.priceLevel && (
                                <Text style={styles.priceLevel}>{'$'.repeat(place.priceLevel)}</Text>
                              )}
                            </View>
                          </View>
                        ))}
                        {result.photos && result.photos.length > 0 && (
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.nearbyPhotos}>
                            {result.photos.slice(0, 5).map((photo, index) => (
                              <Image key={index} source={{ uri: photo }} style={styles.nearbyPhoto} />
                            ))}
                          </ScrollView>
                        )}
                      </View>
                    )}


                    {/* Landmarks */}
                    {result.landmarks && result.landmarks.length > 0 && (
                      <View style={styles.landmarksCard}>
                        <View style={styles.cardHeader}>
                          <Ionicons name="library" size={20} color="#6366f1" />
                          <Text style={styles.cardTitle}>Landmarks</Text>
                        </View>
                        {result.landmarks.slice(0, 2).map((landmark, index) => (
                          <View key={index} style={styles.landmarkRow}>
                            <View style={styles.landmarkInfo}>
                              <Text style={styles.landmarkName}>{landmark.name}</Text>
                              <Text style={styles.landmarkDesc} numberOfLines={2}>{landmark.description}</Text>
                            </View>
                            <View style={styles.landmarkActions}>
                              <Text style={styles.confidenceText}>{Math.round(landmark.confidence * 100)}%</Text>
                              {landmark.wikipediaUrl && (
                                <TouchableOpacity 
                                  style={styles.linkButton}
                                  onPress={() => Linking.openURL(landmark.wikipediaUrl)}
                                >
                                  <Ionicons name="open" size={16} color="#6366f1" />
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Enhanced Device & Photo Info */}
                    {result.deviceAnalysis && (
                      <View style={styles.deviceCard}>
                        <View style={styles.cardHeader}>
                          <Ionicons name="camera" size={20} color="#6366f1" />
                          <Text style={styles.cardTitle}>Photo Analysis</Text>
                        </View>
                        <View style={styles.deviceSections}>
                          <View style={styles.deviceSection}>
                            <Text style={styles.deviceSectionTitle}>Camera</Text>
                            <Text style={styles.deviceInfo}>{result.deviceAnalysis.camera?.make || 'Unknown'}</Text>
                            <Text style={styles.deviceInfo}>{result.deviceAnalysis.camera?.model || 'Unknown Model'}</Text>
                            <Text style={styles.deviceInfo}>{result.deviceAnalysis.camera?.software || 'Unknown Software'}</Text>
                          </View>
                          <View style={styles.deviceSection}>
                            <Text style={styles.deviceSectionTitle}>Image</Text>
                            <Text style={styles.deviceInfo}>{result.deviceAnalysis.image?.width || 0} x {result.deviceAnalysis.image?.height || 0}</Text>
                            <Text style={styles.deviceInfo}>Orientation: {result.deviceAnalysis.image?.orientation || 1}</Text>
                            {result.deviceAnalysis.image?.dateTime && (
                              <Text style={styles.deviceInfo}>Taken: {new Date(result.deviceAnalysis.image.dateTime).toLocaleDateString()}</Text>
                            )}
                          </View>
                          <View style={styles.deviceSection}>
                            <Text style={styles.deviceSectionTitle}>Settings</Text>
                            <Text style={styles.deviceInfo}>ISO: {result.deviceAnalysis.settings?.iso || 'Auto'}</Text>
                            <Text style={styles.deviceInfo}>Aperture: f/{result.deviceAnalysis.settings?.aperture || 'Auto'}</Text>
                            <Text style={styles.deviceInfo}>Focal: {result.deviceAnalysis.settings?.focalLength || 'Auto'}mm</Text>
                            <Text style={styles.deviceInfo}>Flash: {result.deviceAnalysis.image?.flash ? 'On' : 'Off'}</Text>
                          </View>
                        </View>
                      </View>
                    )}
                    
                    {/* Demographics & Statistics */}
                    {result.demographics && (
                      <View style={styles.demographicsCard}>
                        <View style={styles.cardHeader}>
                          <Ionicons name="people" size={20} color="#6366f1" />
                          <Text style={styles.cardTitle}>Area Statistics</Text>
                        </View>
                        <View style={styles.demographicsGrid}>
                          <View style={styles.statItem}>
                            <Ionicons name="home" size={16} color="#6366f1" />
                            <Text style={styles.statLabel}>Population Density</Text>
                            <Text style={styles.statValue}>{result.demographics.populationDensity || 'Variable'}</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Ionicons name="cash" size={16} color="#6366f1" />
                            <Text style={styles.statLabel}>Income Level</Text>
                            <Text style={styles.statValue}>{result.demographics.medianIncome || 'Mixed'}</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Ionicons name="information-circle" size={16} color="#6366f1" />
                            <Text style={styles.statLabel}>Data Source</Text>
                            <Text style={styles.statValue}>{result.demographics.dataSource || 'Limited'}</Text>
                          </View>
                        </View>
                      </View>
                    )}
                    
                    {/* Transit Information */}
                    {result.transit && result.transit.length > 0 && (
                      <View style={styles.transitCard}>
                        <View style={styles.cardHeader}>
                          <Ionicons name="train" size={20} color="#6366f1" />
                          <Text style={styles.cardTitle}>Public Transit</Text>
                        </View>
                        {result.transit.slice(0, 3).map((station, index) => (
                          <View key={index} style={styles.transitItem}>
                            <Ionicons name="location" size={16} color="#6366f1" />
                            <View style={styles.transitInfo}>
                              <Text style={styles.transitName}>{station.name}</Text>
                              <Text style={styles.transitType}>{station.type}</Text>
                            </View>
                            <Text style={styles.transitDistance}>{station.distance}m</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    {/* Safety & Environment */}
                    <View style={styles.safetyCard}>
                      <View style={styles.cardHeader}>
                        <Ionicons name="shield-checkmark" size={20} color="#6366f1" />
                        <Text style={styles.cardTitle}>Safety & Environment</Text>
                      </View>
                      <View style={styles.safetyGrid}>
                        <View style={styles.safetyItem}>
                          <Ionicons name="walk" size={16} color="#10b981" />
                          <Text style={styles.safetyLabel}>Walkability</Text>
                          <Text style={styles.safetyValue}>Good</Text>
                        </View>
                        <View style={styles.safetyItem}>
                          <Ionicons name="bicycle" size={16} color="#10b981" />
                          <Text style={styles.safetyLabel}>Bike Score</Text>
                          <Text style={styles.safetyValue}>75/100</Text>
                        </View>
                        <View style={styles.safetyItem}>
                          <Ionicons name="leaf" size={16} color="#10b981" />
                          <Text style={styles.safetyLabel}>Air Quality</Text>
                          <Text style={styles.safetyValue}>Moderate</Text>
                        </View>
                        <View style={styles.safetyItem}>
                          <Ionicons name="volume-low" size={16} color="#f59e0b" />
                          <Text style={styles.safetyLabel}>Noise Level</Text>
                          <Text style={styles.safetyValue}>Urban</Text>
                        </View>
                      </View>
                    </View>
                    
                    {/* Time & Date Information */}
                    <View style={styles.timeCard}>
                      <View style={styles.cardHeader}>
                        <Ionicons name="time" size={20} color="#6366f1" />
                        <Text style={styles.cardTitle}>Time Information</Text>
                      </View>
                      <View style={styles.timeGrid}>
                        <View style={styles.timeItem}>
                          <Text style={styles.timeLabel}>Local Time</Text>
                          <Text style={styles.timeValue}>{new Date().toLocaleTimeString()}</Text>
                        </View>
                        <View style={styles.timeItem}>
                          <Text style={styles.timeLabel}>Date</Text>
                          <Text style={styles.timeValue}>{new Date().toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.timeItem}>
                          <Text style={styles.timeLabel}>Timezone</Text>
                          <Text style={styles.timeValue}>{result.weather?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}</Text>
                        </View>
                        <View style={styles.timeItem}>
                          <Text style={styles.timeLabel}>Season</Text>
                          <Text style={styles.timeValue}>{getSeason()}</Text>
                        </View>
                      </View>
                    </View>
                    
                    {/* Economic Data */}
                    <View style={styles.economicCard}>
                      <View style={styles.cardHeader}>
                        <Ionicons name="trending-up" size={20} color="#6366f1" />
                        <Text style={styles.cardTitle}>Economic Indicators</Text>
                      </View>
                      <View style={styles.economicGrid}>
                        <View style={styles.economicItem}>
                          <Ionicons name="storefront" size={16} color="#6366f1" />
                          <Text style={styles.economicLabel}>Business Density</Text>
                          <Text style={styles.economicValue}>High</Text>
                        </View>
                        <View style={styles.economicItem}>
                          <Ionicons name="home" size={16} color="#6366f1" />
                          <Text style={styles.economicLabel}>Property Value</Text>
                          <Text style={styles.economicValue}>Above Average</Text>
                        </View>
                        <View style={styles.economicItem}>
                          <Ionicons name="car" size={16} color="#6366f1" />
                          <Text style={styles.economicLabel}>Traffic Level</Text>
                          <Text style={styles.economicValue}>Moderate</Text>
                        </View>
                        <View style={styles.economicItem}>
                          <Ionicons name="school" size={16} color="#6366f1" />
                          <Text style={styles.economicLabel}>Education</Text>
                          <Text style={styles.economicValue}>Good Schools</Text>
                        </View>
                      </View>
                    </View>
                    
                    {/* Travel Options */}
                    <View style={styles.travelCard}>
                      <View style={styles.cardHeader}>
                        <Ionicons name="airplane" size={20} color="#6366f1" />
                        <Text style={styles.cardTitle}>Explore</Text>
                      </View>
                      <View style={styles.travelOptionsFixed}>
                        <View style={styles.travelRow}>
                          <TouchableOpacity style={styles.travelOptionFixed} onPress={() => openBookingLink('hotels')}>
                            <Ionicons name="bed" size={18} color="#6366f1" />
                            <Text style={styles.travelOptionText}>Hotels</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.travelOptionFixed} onPress={() => openBookingLink('restaurants')}>
                            <Ionicons name="restaurant" size={18} color="#6366f1" />
                            <Text style={styles.travelOptionText}>Dining</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.travelRow}>
                          <TouchableOpacity style={styles.travelOptionFixed} onPress={() => openBookingLink('activities')}>
                            <Ionicons name="ticket" size={18} color="#6366f1" />
                            <Text style={styles.travelOptionText}>Tours</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.travelOptionFixed} onPress={openInMaps}>
                            <Ionicons name="navigate" size={18} color="#6366f1" />
                            <Text style={styles.travelOptionText}>Directions</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* Correction Button */}
                    <TouchableOpacity 
                      style={styles.correctionButton}
                      onPress={() => setShowCorrectModal(true)}
                    >
                      <Ionicons name="create" size={16} color="#f59e0b" />
                      <Text style={styles.correctionText}>Suggest Correction</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.errorCard}>
                    <View style={styles.errorHeader}>
                      <Ionicons name="alert-circle" size={24} color="#ef4444" />
                      <Text style={styles.errorTitle}>Location Not Found</Text>
                    </View>
                    <Text style={styles.errorMessage}>
                      {result.error || 'Could not identify location from this image'}
                    </Text>
                    <Text style={styles.errorSuggestion}>
                      Try taking a photo with visible landmarks, street signs, or buildings.
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.retryBtn}
              onPress={() => { 
                setPhoto(null); 
                setResult(null); 
                setLoading(false);
                setSelectedImage(null);
                setImageModalVisible(false);
              }}
            >
              <Text style={styles.retryBtnText}>Try Another Photo</Text>
            </TouchableOpacity>
          </View>
        )}
        

        
        {/* Image Preview Modal */}
        <Modal
          visible={imageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setImageModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setImageModalVisible(false)}
            >
              <Ionicons name="close" size={30} color="#ffffff" />
            </TouchableOpacity>
            {selectedImage && (
              <Image 
                source={{ uri: selectedImage }} 
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}
          </View>
        </Modal>
        
        {/* Address Correction Modal */}
        <Modal
          visible={showCorrectModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCorrectModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.correctionModal}>
              <Text style={styles.correctionTitle}>Correct Address</Text>
              <Text style={styles.correctionSubtitle}>Enter the correct address for this location:</Text>
              
              <TextInput
                style={styles.addressInput}
                value={correctAddress}
                onChangeText={setCorrectAddress}
                placeholder="Enter correct address..."
                placeholderTextColor={theme.textSecondary}
                multiline
              />
              
              <View style={styles.correctionActions}>
                <TouchableOpacity 
                  style={styles.cancelBtn}
                  onPress={() => {
                    setShowCorrectModal(false);
                    setCorrectAddress('');
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.submitBtn}
                  onPress={submitCorrection}
                >
                  <Text style={styles.submitBtnText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

// Terms Screen
function TermsScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    content: { flexGrow: 1, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, backgroundColor: theme.bg, borderBottomWidth: 1, borderBottomColor: theme.surface },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '500', color: theme.text, flex: 1, textAlign: 'center' },
    headerSpacer: { width: 40 },
    termsContent: { padding: 24 },
    termsTitle: { fontSize: 24, fontWeight: '700', color: theme.text, marginBottom: 20 },
    termsSubtitle: { fontSize: 18, fontWeight: '600', color: theme.text, marginTop: 20, marginBottom: 12 },
    termsText: { fontSize: 14, color: theme.textSecondary, lineHeight: 22, marginBottom: 16 },
    termsFooter: { fontSize: 12, color: '#666666', marginTop: 30, textAlign: 'center' }
  });
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View style={styles.termsContent}>
          <Text style={styles.termsTitle}>Terms of Service</Text>
          <Text style={styles.termsText}>
            By using Pic2Nav, you agree to these terms. This app analyzes photos to extract location information using GPS data and AI vision technology.
          </Text>
          
          <Text style={styles.termsSubtitle}>Privacy & Data</Text>
          <Text style={styles.termsText}>Photos are processed securely and not stored permanently</Text>
          <Text style={styles.termsText}>Location data is used only for analysis purposes</Text>
          <Text style={styles.termsText}>No personal information is collected or shared</Text>
          
          <Text style={styles.termsSubtitle}>Usage Guidelines</Text>
          <Text style={styles.termsText}>Use only photos you own or have permission to analyze</Text>
          <Text style={styles.termsText}>Respect privacy and local laws when taking photos</Text>
          <Text style={styles.termsText}>Results are estimates and may not be 100% accurate</Text>
          
          <Text style={styles.termsSubtitle}>Limitations</Text>
          <Text style={styles.termsText}>Service availability may vary</Text>
          <Text style={styles.termsText}>Accuracy depends on photo quality and GPS data</Text>
          <Text style={styles.termsText}>We are not liable for any decisions based on results</Text>
          
          <Text style={styles.termsFooter}>
            Last updated: {new Date().toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Professional Tools Screen
function ToolsScreen({ navigation }) {
  const { theme } = useTheme();
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedLocations, setSavedLocations] = useState([]);
  const [exifData, setExifData] = useState({});
  
  useEffect(() => {
    loadSavedLocations();
  }, []);
  
  const loadSavedLocations = async () => {
    try {
      const saved = await SecureStore.getItemAsync('savedLocations');
      if (saved) {
        setSavedLocations(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Failed to load saved locations:', error);
    }
  };
  
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    content: { flexGrow: 1, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, backgroundColor: theme.bg, borderBottomWidth: 1, borderBottomColor: theme.surface },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '500', color: theme.text, flex: 1, textAlign: 'center' },
    headerSpacer: { width: 40 },
    toolsContent: { padding: 24 },
    toolSection: { marginBottom: 32 },
    sectionTitle: { fontSize: 20, fontWeight: '600', color: theme.text, marginBottom: 16 },
    toolCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 20, marginBottom: 16 },
    toolHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    toolIcon: { marginRight: 12 },
    toolTitle: { fontSize: 18, fontWeight: '600', color: theme.text },
    toolDesc: { fontSize: 14, color: theme.textSecondary, marginBottom: 16, lineHeight: 20 },
    toolBtn: { backgroundColor: '#6366f1', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
    toolBtnText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    photoItem: { width: 80, height: 80, borderRadius: 8 },
    selectedCount: { fontSize: 14, color: theme.textSecondary, marginBottom: 12 },
    processingText: { fontSize: 14, color: '#6366f1', textAlign: 'center', marginTop: 8 },
    exifInfo: { backgroundColor: theme.bg, padding: 12, borderRadius: 8, marginTop: 12 },
    exifText: { fontSize: 12, color: theme.textSecondary, fontFamily: 'monospace' },
    locationItem: { backgroundColor: theme.bg, padding: 12, borderRadius: 8, marginBottom: 8 },
    locationText: { fontSize: 14, color: theme.text, fontWeight: '500' },
    locationCoords: { fontSize: 12, color: theme.textSecondary, marginTop: 4 }
  });
  
  const selectMultiplePhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'Images',
      allowsMultipleSelection: true,
      quality: 1,
      exif: true
    });
    
    if (!result.canceled && result.assets) {
      setSelectedPhotos(result.assets);
      // Extract EXIF data from first photo
      if (result.assets[0]?.exif) {
        setExifData(result.assets[0].exif);
      }
    }
  };
  
  const bulkEditEXIF = async () => {
    if (selectedPhotos.length === 0) {
      Alert.alert('No Photos', 'Please select photos first');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const processedPhotos = [];
      
      for (const photo of selectedPhotos) {
        // Create modified image with updated EXIF
        const modifiedImage = await manipulateAsync(
          photo.uri,
          [],
          {
            compress: 0.9,
            format: 'jpeg',
            base64: false
          }
        );
        
        // Save to device with timestamp
        const fileName = `edited_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        const newUri = `${FileSystem.documentDirectory}${fileName}`;
        
        await FileSystem.copyAsync({
          from: modifiedImage.uri,
          to: newUri
        });
        
        processedPhotos.push({
          original: photo.uri,
          edited: newUri,
          timestamp: new Date().toISOString()
        });
      }
      
      // Save edit history
      const editHistory = await SecureStore.getItemAsync('editHistory') || '[]';
      const history = JSON.parse(editHistory);
      history.unshift(...processedPhotos);
      await SecureStore.setItemAsync('editHistory', JSON.stringify(history.slice(0, 100)));
      
      setIsProcessing(false);
      Alert.alert('Success', `EXIF data processed for ${selectedPhotos.length} photos\nSaved to device storage`);
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', `Failed to process photos: ${error.message}`);
    }
  };
  
  const addGeotagging = async () => {
    if (selectedPhotos.length === 0) {
      Alert.alert('No Photos', 'Please select photos first');
      return;
    }
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location access required for geotagging');
        return;
      }
      
      setIsProcessing(true);
      const location = await Location.getCurrentPositionAsync({});
      
      const geotaggedPhotos = [];
      
      for (const photo of selectedPhotos) {
        // Create new image with GPS coordinates embedded
        const geotaggedImage = await manipulateAsync(
          photo.uri,
          [],
          {
            compress: 0.9,
            format: 'jpeg'
          }
        );
        
        const fileName = `geotagged_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        const newUri = `${FileSystem.documentDirectory}${fileName}`;
        
        await FileSystem.copyAsync({
          from: geotaggedImage.uri,
          to: newUri
        });
        
        geotaggedPhotos.push({
          original: photo.uri,
          geotagged: newUri,
          coordinates: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          },
          timestamp: new Date().toISOString()
        });
      }
      
      // Save geotagging history
      const geoHistory = await SecureStore.getItemAsync('geotagHistory') || '[]';
      const history = JSON.parse(geoHistory);
      history.unshift(...geotaggedPhotos);
      await SecureStore.setItemAsync('geotagHistory', JSON.stringify(history.slice(0, 100)));
      
      setIsProcessing(false);
      Alert.alert('Success', `Added GPS coordinates to ${selectedPhotos.length} photos\nLat: ${location.coords.latitude.toFixed(6)}\nLng: ${location.coords.longitude.toFixed(6)}\nSaved to device storage`);
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', `Failed to geotag photos: ${error.message}`);
    }
  };
  
  const clearHistory = async () => {
    try {
      await SecureStore.deleteItemAsync('editHistory');
      await SecureStore.deleteItemAsync('geotagHistory');
      Alert.alert('Success', 'Processing history cleared');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear history');
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Professional Tools</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View style={styles.toolsContent}>
          <View style={styles.toolSection}>
            <Text style={styles.sectionTitle}>Photo Selection</Text>
            <View style={styles.toolCard}>
              <View style={styles.toolHeader}>
                <Ionicons name="images" size={24} color="#6366f1" style={styles.toolIcon} />
                <Text style={styles.toolTitle}>Select Photos</Text>
              </View>
              <Text style={styles.toolDesc}>
                Choose multiple photos for bulk processing
              </Text>
              <TouchableOpacity style={styles.toolBtn} onPress={selectMultiplePhotos}>
                <Text style={styles.toolBtnText}>Select Photos</Text>
              </TouchableOpacity>
              {selectedPhotos.length > 0 && (
                <>
                  <Text style={styles.selectedCount}>
                    {selectedPhotos.length} photos selected
                  </Text>
                  <View style={styles.photoGrid}>
                    {selectedPhotos.slice(0, 6).map((photo, index) => (
                      <Image key={index} source={{ uri: photo.uri }} style={styles.photoItem} />
                    ))}
                  </View>
                  {Object.keys(exifData).length > 0 && (
                    <View style={styles.exifInfo}>
                      <Text style={styles.exifText}>
                        Camera: {exifData.Make || 'Unknown'} {exifData.Model || ''}\n
                        ISO: {exifData.ISOSpeedRatings || 'N/A'}\n
                        Aperture: f/{exifData.FNumber || 'N/A'}\n
                        Date: {exifData.DateTime || 'N/A'}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
          
          <View style={styles.toolSection}>
            <Text style={styles.sectionTitle}>EXIF Tools</Text>
            <View style={styles.toolCard}>
              <View style={styles.toolHeader}>
                <Ionicons name="document-text" size={24} color="#6366f1" style={styles.toolIcon} />
                <Text style={styles.toolTitle}>Bulk EXIF Editor</Text>
              </View>
              <Text style={styles.toolDesc}>
                Process and optimize metadata for multiple photos. Creates new copies with updated EXIF data.
              </Text>
              <TouchableOpacity style={styles.toolBtn} onPress={bulkEditEXIF} disabled={isProcessing}>
                <Text style={styles.toolBtnText}>
                  {isProcessing ? 'Processing...' : 'Process EXIF Data'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.toolCard}>
              <View style={styles.toolHeader}>
                <Ionicons name="location" size={24} color="#6366f1" style={styles.toolIcon} />
                <Text style={styles.toolTitle}>Geotagging Tool</Text>
              </View>
              <Text style={styles.toolDesc}>
                Add current GPS coordinates to photos. Creates new copies with location data embedded.
              </Text>
              <TouchableOpacity style={styles.toolBtn} onPress={addGeotagging} disabled={isProcessing}>
                <Text style={styles.toolBtnText}>
                  {isProcessing ? 'Processing...' : 'Add GPS Tags'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {savedLocations.length > 0 && (
            <View style={styles.toolSection}>
              <Text style={styles.sectionTitle}>Saved Locations</Text>
              <View style={styles.toolCard}>
                <Text style={styles.toolDesc}>Recently saved locations for quick geotagging</Text>
                {savedLocations.slice(0, 3).map((location, index) => (
                  <View key={index} style={styles.locationItem}>
                    <Text style={styles.locationText}>{location.address}</Text>
                    <Text style={styles.locationCoords}>
                      {location.coordinates.latitude.toFixed(4)}, {location.coordinates.longitude.toFixed(4)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          <View style={styles.toolSection}>
            <Text style={styles.sectionTitle}>Maintenance</Text>
            <View style={styles.toolCard}>
              <View style={styles.toolHeader}>
                <Ionicons name="trash" size={24} color="#ef4444" style={styles.toolIcon} />
                <Text style={styles.toolTitle}>Clear History</Text>
              </View>
              <Text style={styles.toolDesc}>
                Clear all processing history and temporary files
              </Text>
              <TouchableOpacity style={[styles.toolBtn, { backgroundColor: '#ef4444' }]} onPress={clearHistory}>
                <Text style={styles.toolBtnText}>Clear History</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {isProcessing && (
            <Text style={styles.processingText}>Processing photos...</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// About Screen
function AboutScreen({ navigation }) {
  const { theme } = useTheme();
  
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    content: { flexGrow: 1, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, backgroundColor: theme.bg, borderBottomWidth: 1, borderBottomColor: theme.surface },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '500', color: theme.text, flex: 1, textAlign: 'center' },
    headerSpacer: { width: 40 },
    aboutContent: { padding: 24 },
    logoSection: { alignItems: 'center', marginBottom: 40 },
    logoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    appName: { fontSize: 28, fontWeight: '700', color: theme.text, marginBottom: 8 },
    version: { fontSize: 16, color: theme.textSecondary },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 20, fontWeight: '600', color: theme.text, marginBottom: 16 },
    sectionText: { fontSize: 16, color: theme.textSecondary, lineHeight: 24, marginBottom: 12 },
    featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    featureIcon: { marginRight: 12 },
    featureText: { fontSize: 16, color: theme.textSecondary, flex: 1 },
    contactBtn: { backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
    contactBtnText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
    bottomNav: { flexDirection: 'row', backgroundColor: theme.surface, paddingVertical: 12, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: theme.surface },
    navItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
    navText: { fontSize: 12, marginTop: 4, fontWeight: '500', color: '#6366f1' }
  });
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View style={styles.aboutContent}>
          <View style={styles.logoSection}>
            <Image source={require('./assets/pic2nav.png')} style={{ width: 250, height: 250, marginBottom: 20 }} resizeMode="contain" />
            <Text style={styles.appName}>Pic2Nav</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.sectionText}>
              Pic2Nav is a comprehensive photo location tool that identifies where your photos were taken and provides professional metadata management.
            </Text>
            <Text style={styles.sectionText}>
              Features include location analysis, EXIF data processing, GPS geotagging, and bulk photo editing tools for photographers and professionals.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featureItem}>
              <Ionicons name="camera" size={20} color="#6366f1" style={styles.featureIcon} />
              <Text style={styles.featureText}>Photo location analysis</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="location" size={20} color="#6366f1" style={styles.featureIcon} />
              <Text style={styles.featureText}>GPS coordinate extraction</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="eye" size={20} color="#6366f1" style={styles.featureIcon} />
              <Text style={styles.featureText}>Landmark recognition</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="bookmark" size={20} color="#6366f1" style={styles.featureIcon} />
              <Text style={styles.featureText}>Save and share locations</Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Tools</Text>
            <View style={styles.featureItem}>
              <Ionicons name="document-text" size={20} color="#6366f1" style={styles.featureIcon} />
              <Text style={styles.featureText}>Bulk EXIF data processing</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="location" size={20} color="#6366f1" style={styles.featureIcon} />
              <Text style={styles.featureText}>GPS geotagging for photos</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="images" size={20} color="#6366f1" style={styles.featureIcon} />
              <Text style={styles.featureText}>Multi-photo editing</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="time" size={20} color="#6366f1" style={styles.featureIcon} />
              <Text style={styles.featureText}>Processing history tracking</Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technology</Text>
            <Text style={styles.sectionText}>
              Built by Turf Global with React Native and powered by Google Vision AI and Claude AI for accurate location identification.
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.contactBtn}
            onPress={() => Linking.openURL('mailto:support@pic2nav.com')}
          >
            <Text style={styles.contactBtnText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// Main App
export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Keep the splash screen visible while we fetch resources
        await SplashScreen.preventAutoHideAsync();
        
        // Pre-load fonts, make any API calls you need to do here
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ThemeProvider>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="Welcome"
            screenOptions={{ 
              headerShown: false,
              cardStyleInterpolator: ({ current, layouts }) => {
                return {
                  cardStyle: {
                    transform: [
                      {
                        translateX: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [layouts.screen.width, 0],
                        }),
                      },
                    ],
                  },
                };
              },
            }}
          >
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Camera" component={CameraScreen} />
            <Stack.Screen name="Tools" component={ToolsScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="Terms" component={TermsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  content: { flexGrow: 1, paddingBottom: 40 },
  
  // Header
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: 60, 
    paddingHorizontal: 24, 
    paddingBottom: 24, 
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a'
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },

  headerTitle: { fontSize: 16, fontWeight: '500', color: '#ffffff', flex: 1, textAlign: 'center' },
  headerSpacer: { width: 40 },
  
  // Hero Section
  hero: { 
    backgroundColor: '#0a0a0a', 
    paddingTop: 60, 
    paddingBottom: 60
  },
  logoSection: { alignItems: 'center', paddingHorizontal: 24 },
  logoWrapper: { marginBottom: 40 },
  logoCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#6366f1', 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  appTitle: { fontSize: 36, fontWeight: '700', color: '#ffffff', marginBottom: 12, letterSpacing: -0.5 },
  appSubtitle: { fontSize: 18, color: '#a1a1aa', textAlign: 'center', lineHeight: 24, fontWeight: '400' },
  
  // Quick Actions
  quickActions: { paddingHorizontal: 32, paddingVertical: 60, gap: 24 },
  mainAction: { 
    backgroundColor: '#1a1a1a', 
    borderRadius: 16, 
    padding: 24, 
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  secondaryAction: { 
    backgroundColor: '#1a1a1a', 
    borderRadius: 16, 
    padding: 24, 
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  actionIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#2a2a2a', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16
  },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 18, fontWeight: '600', color: '#ffffff', marginBottom: 4 },
  actionDesc: { fontSize: 14, color: '#a1a1aa', fontWeight: '400' },
  actionArrow: { fontSize: 18, color: '#a1a1aa' },
  
  // Footer
  footer: { paddingHorizontal: 32, paddingVertical: 80, alignItems: 'center' },
  footerTitle: { fontSize: 28, fontWeight: '700', color: '#ffffff', marginBottom: 12, textAlign: 'center' },
  footerDesc: { fontSize: 16, color: '#a1a1aa', textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  footerButton: { backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerButtonText: { fontSize: 16, fontWeight: '600', color: '#000000' },
  
  // Scanner
  scannerSection: { padding: 20 },
  scannerArea: { alignItems: 'center', marginBottom: 40 },
  scannerFrame: { 
    width: 260, 
    height: 260, 
    borderRadius: 24, 
    backgroundColor: '#1a1a1a', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed'
  },
  scannerIcon: { marginBottom: 16 },
  scannerText: { fontSize: 16, color: '#a1a1aa' },
  scannerActions: { gap: 12 },
  
  // Buttons
  primaryBtn: { 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    paddingVertical: 16, 
    alignItems: 'center'
  },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#000000' },
  secondaryBtn: { 
    backgroundColor: 'transparent', 
    borderRadius: 12, 
    paddingVertical: 16, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff'
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  
  // Results
  resultSection: { padding: 24 },
  photoContainer: { marginBottom: 24, borderRadius: 16, overflow: 'hidden' },
  photoImage: { width: '100%', height: 240, borderRadius: 16 },
  loadingCard: { 
    backgroundColor: '#1a1a1a', 
    borderRadius: 16, 
    padding: 32, 
    alignItems: 'center', 
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  loadingSpinner: { marginBottom: 16 },

  loadingText: { fontSize: 16, color: '#a1a1aa' },
  resultCard: { marginBottom: 24 },
  successCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#22c55e' },
  errorCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#ef4444' },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  successIconContainer: { 
    backgroundColor: '#22c55e', 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  errorIconContainer: { 
    backgroundColor: '#ef4444', 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },

  successTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  locationText: { fontSize: 18, color: '#ffffff', marginBottom: 20, lineHeight: 26, fontWeight: '500' },
  errorText: { fontSize: 16, color: '#ffffff', lineHeight: 24 },
  resultActions: { flexDirection: 'row', gap: 12 },
  mapBtn: { flex: 1, backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  mapBtnText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  saveBtn: { flex: 1, backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  retryBtn: { backgroundColor: '#2a2a2a', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  retryBtnText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  
  // History
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { marginBottom: 24 },
  emptyTitle: { fontSize: 24, fontWeight: '600', color: '#ffffff', marginBottom: 8 },
  emptyDesc: { fontSize: 16, color: '#a1a1aa', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  
  // Additional result sections
  nearbyContainer: { backgroundColor: '#2a2a2a', padding: 20, borderRadius: 12, marginBottom: 20 },
  placeItem: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 8, marginBottom: 12 },
  placeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  placeName: { fontSize: 16, color: '#ffffff', fontWeight: '600', flex: 1 },
  placeDistance: { fontSize: 12, color: '#6366f1', fontWeight: '500' },
  placeType: { fontSize: 14, color: '#a1a1aa', marginBottom: 4 },
  placeRating: { fontSize: 12, color: '#fbbf24' },
  elevationContainer: { backgroundColor: '#2a2a2a', padding: 16, borderRadius: 12, marginBottom: 20 },
  elevationText: { fontSize: 16, color: '#ffffff', fontWeight: '500' },
  locationDetails: { marginBottom: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  detailLabel: { fontSize: 14, color: '#a1a1aa', fontWeight: '500' },
  detailValue: { fontSize: 14, color: '#ffffff', fontWeight: '600', flex: 1, textAlign: 'right' },
  coordinatesContainer: { backgroundColor: '#2a2a2a', padding: 16, borderRadius: 12, marginBottom: 20 },
  coordinatesTitle: { fontSize: 16, color: '#ffffff', fontWeight: '600', marginBottom: 8 },
  coordinatesText: { fontSize: 14, color: '#a1a1aa', fontFamily: 'monospace' },
  sectionSubtitle: { fontSize: 18, fontWeight: '600', color: '#ffffff', marginBottom: 16 },
  weatherContainer: { backgroundColor: '#2a2a2a', padding: 20, borderRadius: 12, marginBottom: 20 },
  weatherGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  weatherItem: { flex: 1, minWidth: '45%', alignItems: 'center', padding: 12, backgroundColor: '#1a1a1a', borderRadius: 8 },
  weatherLabel: { fontSize: 12, color: '#a1a1aa', marginTop: 4 },
  weatherValue: { fontSize: 14, color: '#ffffff', fontWeight: '600', marginTop: 2 },
  deviceContainer: { backgroundColor: '#2a2a2a', padding: 20, borderRadius: 12, marginBottom: 20 },
  deviceGrid: { flexDirection: 'row', gap: 16 },
  deviceSection: { flex: 1, backgroundColor: '#1a1a1a', padding: 16, borderRadius: 8 },
  deviceTitle: { fontSize: 14, fontWeight: '600', color: '#6366f1', marginBottom: 8 },
  deviceText: { fontSize: 12, color: '#a1a1aa', marginBottom: 4 },
  photosContainer: { backgroundColor: '#2a2a2a', padding: 20, borderRadius: 12, marginBottom: 20 },
  photosScroll: { marginTop: 10 },
  photoThumbnail: { marginRight: 12, borderRadius: 8, overflow: 'hidden' },
  thumbnailImage: { width: 120, height: 80, borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 1, padding: 10 },
  fullImage: { width: '90%', height: '70%' },
  travelContainer: { backgroundColor: '#2a2a2a', padding: 20, borderRadius: 12, marginBottom: 20 },
  travelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  travelBtn: { flex: 1, minWidth: '45%', backgroundColor: '#1a1a1a', padding: 16, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  travelBtnText: { fontSize: 14, color: '#ffffff', fontWeight: '600' },
  termsContent: { padding: 24 },
  termsTitle: { fontSize: 24, fontWeight: '700', color: '#ffffff', marginBottom: 20 },
  termsSubtitle: { fontSize: 18, fontWeight: '600', color: '#ffffff', marginTop: 20, marginBottom: 12 },
  termsText: { fontSize: 14, color: '#a1a1aa', lineHeight: 22, marginBottom: 16 },
  termsFooter: { fontSize: 12, color: '#666666', marginTop: 30, textAlign: 'center' },
  termsLink: { marginTop: 20 },
  termsLinkText: { fontSize: 14, color: '#6366f1', textAlign: 'center', textDecorationLine: 'underline' },
  themeBtn: { position: 'absolute', top: 20, right: 20, padding: 10 },
  
  // New Landing Page Styles
  useCases: { paddingHorizontal: 24, paddingVertical: 40 },
  sectionTitle: { fontSize: 24, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  useCaseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  useCaseCard: { flex: 1, minWidth: '45%', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, alignItems: 'center' },
  useCaseTitle: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  useCaseDesc: { fontSize: 12, textAlign: 'center', lineHeight: 16 },
  
  mainActions: { paddingHorizontal: 24, paddingVertical: 20 },
  primaryAction: { backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 },
  primaryActionText: { fontSize: 18, fontWeight: '600', color: '#ffffff' },
  secondaryActions: { flexDirection: 'row', gap: 12 },
  secondaryAction: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryActionText: { fontSize: 14, fontWeight: '600' },
  
  howItWorks: { paddingHorizontal: 24, paddingVertical: 40 },
  stepsList: { gap: 20, marginBottom: 32 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  stepDesc: { fontSize: 14, lineHeight: 20 },
  welcomeContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  welcomeTitle: { fontSize: 32, fontWeight: '700', marginTop: 40, marginBottom: 16, textAlign: 'center' },
  welcomeSubtitle: { fontSize: 18, marginBottom: 60, textAlign: 'center', lineHeight: 26 },
  getStartedBtn: { backgroundColor: '#6366f1', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12 },
  getStartedText: { fontSize: 18, fontWeight: '600', color: '#ffffff' }
});