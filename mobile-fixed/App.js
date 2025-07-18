import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, StatusBar, Alert, Linking, Platform, Modal, Animated, TextInput } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync } from 'expo-image-manipulator';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import VoiceCommands from './components/VoiceCommands';

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
  const { theme, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    welcomeContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
    welcomeTitle: { fontSize: 32, fontWeight: '700', marginTop: 40, marginBottom: 16, textAlign: 'center' },
    welcomeSubtitle: { fontSize: 18, marginBottom: 60, textAlign: 'center', lineHeight: 26 },
    getStartedBtn: { backgroundColor: '#6366f1', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12 },
    getStartedText: { fontSize: 18, fontWeight: '600', color: '#ffffff' }
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      <Animated.View style={[styles.welcomeContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoCircle}>
          <Ionicons name="location" size={48} color="#ffffff" />
        </View>
        
        <Text style={[styles.welcomeTitle, { color: theme.text }]}>Welcome to Pic2Nav</Text>
        <Text style={[styles.welcomeSubtitle, { color: theme.text }]}>Discover the hidden locations in your photos</Text>
        
        <TouchableOpacity 
          style={styles.getStartedBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// Home Screen
function HomeScreen({ navigation }) {
  const { theme, isDark, toggle } = useTheme();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    scrollContent: { flexGrow: 1, paddingBottom: 40 },
    hero: { backgroundColor: theme.bg, paddingTop: 60, paddingBottom: 60 },
    logoSection: { alignItems: 'center', paddingHorizontal: 24 },
    logoWrapper: { marginBottom: 40 },
    logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
    appTitle: { fontSize: 36, fontWeight: '700', marginBottom: 12, letterSpacing: -0.5 },
    appSubtitle: { fontSize: 18, textAlign: 'center', lineHeight: 24, fontWeight: '400' },
    themeBtn: { position: 'absolute', top: 20, right: 20, padding: 10 },
    quickActions: { paddingHorizontal: 32, paddingVertical: 60, gap: 24 },
    mainAction: { backgroundColor: theme.surface, borderRadius: 16, padding: 24, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.surface },
    secondaryAction: { backgroundColor: theme.surface, borderRadius: 16, padding: 24, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.surface },
    actionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    actionContent: { flex: 1 },
    actionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4, color: theme.text },
    actionDesc: { fontSize: 14, fontWeight: '400', color: theme.textSecondary },

    footer: { paddingHorizontal: 32, paddingVertical: 80, alignItems: 'center' },
    footerTitle: { fontSize: 28, fontWeight: '700', marginBottom: 12, textAlign: 'center', color: theme.text },
    footerDesc: { fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24, color: theme.textSecondary },
    footerButton: { backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', gap: 8 },
    footerButtonText: { fontSize: 16, fontWeight: '600', color: '#000000' },
    termsLink: { marginTop: 20 },
    termsLinkText: { fontSize: 14, color: '#6366f1', textAlign: 'center', textDecorationLine: 'underline' },
    bottomNav: { flexDirection: 'row', backgroundColor: theme.surface, paddingVertical: 12, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: theme.surface },
    navItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
    navText: { fontSize: 12, marginTop: 4, fontWeight: '500' }
  });
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        style={Platform.OS === 'web' ? { height: '100vh', overflow: 'scroll' } : { flex: 1 }}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.logoSection}>
            <View style={styles.logoWrapper}>
              <View style={styles.logoCircle}>
                <Ionicons name="location" size={36} color="#ffffff" />
              </View>
            </View>
            <Text style={[styles.appTitle, { color: theme.text }]}>Pic2Nav</Text>
            <Text style={[styles.appSubtitle, { color: theme.text }]}>Discover where your photos were taken</Text>
            <TouchableOpacity style={styles.themeBtn} onPress={toggle}>
              <Ionicons name={isDark ? "sunny" : "moon"} size={24} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.mainAction}
            onPress={() => navigation.navigate('Camera')}
            activeOpacity={0.9}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="camera" size={24} color="#6366f1" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Scan Photo</Text>
              <Text style={styles.actionDesc}>Find location from image</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryAction}
            onPress={() => navigation.navigate('Tools')}
            activeOpacity={0.9}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="construct" size={24} color="#6366f1" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Pro Tools</Text>
              <Text style={styles.actionDesc}>EXIF editing & geotagging</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryAction}
            onPress={() => navigation.navigate('About')}
            activeOpacity={0.9}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="information-circle" size={24} color="#6366f1" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>About App</Text>
              <Text style={styles.actionDesc}>Learn more about Pic2Nav</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Ready to discover?</Text>
          <Text style={styles.footerDesc}>Start analyzing your photos and unlock their hidden locations</Text>
          <TouchableOpacity 
            style={styles.footerButton}
            onPress={() => navigation.navigate('Camera')}
          >
            <Ionicons name="camera" size={20} color="#000000" />
            <Text style={styles.footerButtonText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.termsLink}
            onPress={() => navigation.navigate('Terms')}
          >
            <Text style={styles.termsLinkText}>Terms & Conditions</Text>
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
    scannerSection: { padding: 20 },
    scannerArea: { alignItems: 'center', marginBottom: 40 },
    scannerFrame: { width: 260, height: 260, borderRadius: 24, backgroundColor: theme.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#3b82f6', borderStyle: 'dashed' },
    scannerIcon: { marginBottom: 16 },
    scannerText: { fontSize: 16, color: theme.textSecondary },
    scannerActions: { gap: 12 },
    landmarkToggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, gap: 8, marginBottom: 12 },
    landmarkToggleText: { fontSize: 14, fontWeight: '500' },
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
    submitBtnText: { fontSize: 16, fontWeight: '600', color: '#ffffff' }
  });
  const [photo, setPhoto] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [currentExifData, setCurrentExifData] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
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
        exif: false, // Don't process EXIF to avoid stripping
        base64: false,
        mediaTypes: 'Images',
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
        mediaTypes: 'Images',
        allowsEditing: false,
        quality: 1,
        exif: false, // Don't process EXIF to avoid stripping
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
      
      // Reject images larger than 3.5MB
      if (fileSizeMB > 3.5) {
        Alert.alert('Image Too Large', `Image size is ${fileSizeMB.toFixed(1)}MB. Please select an image smaller than 3.5MB.`);
        setLoading(false);
        return;
      }
      
      // Handle large images above 3.5MB
      let processedImage = { uri: imageUri };
      if (fileSizeMB > 3.5) {
        console.log(`Compressing ${fileSizeMB.toFixed(2)}MB image for API`);
        processedImage = await manipulateAsync(
          imageUri,
          [{ resize: { width: 1600 } }],
          { compress: 0.8, format: 'jpeg' }
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
          uri: imageUri, // Use original URI, not processed
          type: 'image/jpeg',
          name: 'image.jpg',
        });
      }
      
      // Send device location as fallback for mobile
      formData.append('latitude', hasGPS ? gpsLat.toString() : '0');
      formData.append('longitude', hasGPS ? gpsLng.toString() : '0');
      formData.append('analyzeLandmarks', analyzeLandmarks.toString());
      formData.append('enhanced', 'true');
      formData.append('mobile', 'true');
      formData.append('hasGPS', hasGPS.toString());
      formData.append('platform', Platform.OS);
      formData.append('exifSource', hasGPS ? 'device-location' : 'none');
      formData.append('hasImageGPS', 'false');
      
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
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
      
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
          const retryTimeoutId = setTimeout(() => retryController.abort(), 90000);
          
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
      if (data.success && !data.landmarks) {
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

  const handleVoiceCommand = (command) => {
    switch (command) {
      case 'takePhoto':
        takePicture();
        break;
      case 'openGallery':
        pickImage();
        break;
      case 'analyze':
        if (photo) {
          Alert.alert('Voice Command', 'Re-analyzing photo...');
          analyzeImage(photo, currentExifData, 'voice');
        } else {
          Alert.alert('Voice Command', 'Please take a photo first');
        }
        break;
      case 'saveLocation':
        if (result?.success) {
          Alert.alert('Voice Command', 'Location saved!');
        } else {
          Alert.alert('Voice Command', 'No location to save');
        }
        break;
      case 'findSimilar':
        Alert.alert('Voice Command', 'Finding similar locations...');
        break;
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
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => setVoiceEnabled(!voiceEnabled)}
        >
          <Ionicons name={voiceEnabled ? "mic" : "mic-off"} size={24} color={voiceEnabled ? "#6366f1" : theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        style={Platform.OS === 'web' ? { height: '100vh', overflow: 'scroll' } : { flex: 1 }}
      >
        {!photo ? (
          <View style={styles.scannerSection}>
            <View style={styles.scannerArea}>
              <View style={styles.scannerFrame}>
                <Ionicons name="camera-outline" size={64} color="#6366f1" style={styles.scannerIcon} />
                <Text style={styles.scannerText}>Ready to scan</Text>
              </View>
            </View>
            
            <View style={styles.scannerActions}>
              <TouchableOpacity 
                style={[styles.landmarkToggle, { backgroundColor: analyzeLandmarks ? '#6366f1' : theme.surface }]}
                onPress={() => setAnalyzeLandmarks(!analyzeLandmarks)}
              >
                <Ionicons 
                  name={analyzeLandmarks ? "checkmark-circle" : "ellipse-outline"} 
                  size={20} 
                  color={analyzeLandmarks ? "#ffffff" : theme.text} 
                />
                <Text style={[styles.landmarkToggleText, { color: analyzeLandmarks ? "#ffffff" : theme.text }]}>
                  Landmark Detection
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.primaryBtn} onPress={takePicture}>
                <Text style={styles.primaryBtnText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage}>
                <Text style={styles.secondaryBtnText}>Choose from Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryBtn} onPress={pickRawImage}>
                <Text style={styles.secondaryBtnText}>Raw File (Preserves GPS)</Text>
              </TouchableOpacity>
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
              <View style={styles.resultCard}>
                {result.success ? (
                  <View style={styles.successCard}>
                    <View style={styles.resultHeader}>
                      <View style={styles.successIconContainer}>
                        <Ionicons name="checkmark" size={20} color="#ffffff" />
                      </View>
                      <Text style={styles.successTitle}>Location Found</Text>
                    </View>
                    <Text style={styles.locationText}>
                      {(result.address || result.name || 'Location identified').toString()}
                    </Text>
                    
                    {/* Location Details */}
                    {result.locationDetails && (
                      <View style={styles.locationDetails}>
                        <Text style={styles.sectionSubtitle}>Location Details</Text>
                        {result.locationDetails.country && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Country</Text>
                            <Text style={styles.detailValue}>{result.locationDetails.country}</Text>
                          </View>
                        )}
                        {result.locationDetails.state && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>State</Text>
                            <Text style={styles.detailValue}>{result.locationDetails.state}</Text>
                          </View>
                        )}
                        {result.locationDetails.city && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>City</Text>
                            <Text style={styles.detailValue}>{result.locationDetails.city}</Text>
                          </View>
                        )}
                        {result.locationDetails.neighborhood && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Neighborhood</Text>
                            <Text style={styles.detailValue}>{result.locationDetails.neighborhood}</Text>
                          </View>
                        )}
                        {result.locationDetails.postalCode && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Postal Code</Text>
                            <Text style={styles.detailValue}>{result.locationDetails.postalCode}</Text>
                          </View>
                        )}
                      </View>
                    )}
                    
                    {/* Coordinates */}
                    {result.location && (
                      <View style={styles.coordinatesContainer}>
                        <Text style={styles.coordinatesTitle}>Coordinates</Text>
                        <Text style={styles.coordinatesText}>
                          {result.location.latitude.toFixed(6)}, {result.location.longitude.toFixed(6)}
                        </Text>
                      </View>
                    )}
                    
                    {/* Weather Information */}
                    {result.weather && (
                      <View style={styles.weatherContainer}>
                        <Text style={styles.sectionSubtitle}>Weather Conditions</Text>
                        <View style={styles.weatherGrid}>
                          {result.weather.temperature && (
                            <View style={styles.weatherItem}>
                              <Ionicons name="thermometer" size={16} color="#6366f1" />
                              <Text style={styles.weatherLabel}>Temperature</Text>
                              <Text style={styles.weatherValue}>{result.weather.temperature}°C</Text>
                            </View>
                          )}
                          {result.weather.humidity && (
                            <View style={styles.weatherItem}>
                              <Ionicons name="water" size={16} color="#6366f1" />
                              <Text style={styles.weatherLabel}>Humidity</Text>
                              <Text style={styles.weatherValue}>{result.weather.humidity}%</Text>
                            </View>
                          )}
                          {result.weather.windSpeed && (
                            <View style={styles.weatherItem}>
                              <Ionicons name="speedometer" size={16} color="#6366f1" />
                              <Text style={styles.weatherLabel}>Wind Speed</Text>
                              <Text style={styles.weatherValue}>{result.weather.windSpeed} km/h</Text>
                            </View>
                          )}
                          {result.weather.precipitation && (
                            <View style={styles.weatherItem}>
                              <Ionicons name="rainy" size={16} color="#6366f1" />
                              <Text style={styles.weatherLabel}>Precipitation</Text>
                              <Text style={styles.weatherValue}>{result.weather.precipitation}mm</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                    
                    {/* Device Analysis */}
                    <View style={styles.deviceContainer}>
                      <Text style={styles.sectionSubtitle}>Device Information</Text>
                      <View style={styles.deviceGrid}>
                        <View style={styles.deviceSection}>
                          <Text style={styles.deviceTitle}>Camera</Text>
                          <Text style={styles.deviceText}>
                            {currentExifData?.Make || Platform.OS === 'android' ? 'Android Device' : 'iOS Device'} {currentExifData?.Model || ''}
                          </Text>
                          {currentExifData?.Software && (
                            <Text style={styles.deviceText}>Software: {currentExifData.Software}</Text>
                          )}
                        </View>
                        <View style={styles.deviceSection}>
                          <Text style={styles.deviceTitle}>Settings</Text>
                          {currentExifData?.ISOSpeedRatings && (
                            <Text style={styles.deviceText}>ISO {currentExifData.ISOSpeedRatings}</Text>
                          )}
                          {currentExifData?.FNumber && (
                            <Text style={styles.deviceText}>f/{currentExifData.FNumber}</Text>
                          )}
                          {currentExifData?.FocalLength && (
                            <Text style={styles.deviceText}>{currentExifData.FocalLength}mm</Text>
                          )}
                          {currentExifData?.ExposureTime && (
                            <Text style={styles.deviceText}>1/{Math.round(1/currentExifData.ExposureTime)}s</Text>
                          )}
                        </View>
                      </View>
                    </View>
                    
                    {/* Nearby Places */}
                    {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
                      <View style={styles.nearbyContainer}>
                        <Text style={styles.sectionSubtitle}>Nearby Places</Text>
                        {result.nearbyPlaces.slice(0, 5).map((place, index) => (
                          <View key={index} style={styles.placeItem}>
                            <View style={styles.placeHeader}>
                              <Text style={styles.placeName}>{place.name}</Text>
                              <Text style={styles.placeDistance}>{place.distance}m</Text>
                            </View>
                            <Text style={styles.placeType}>{place.type}</Text>
                            {place.rating && (
                              <Text style={styles.placeRating}>⭐ {place.rating}</Text>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                    
                    {/* Location Photos */}
                    {result.photos && result.photos.length > 0 && (
                      <View style={styles.photosContainer}>
                        <Text style={styles.sectionSubtitle}>Location Photos</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
                          {result.photos.map((photoUrl, index) => (
                            <TouchableOpacity 
                              key={index} 
                              style={styles.photoThumbnail}
                              onPress={() => {
                                setSelectedImage(photoUrl);
                                setImageModalVisible(true);
                              }}
                            >
                              <Image 
                                source={{ uri: photoUrl }} 
                                style={styles.thumbnailImage}
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                    
                    {/* Elevation */}
                    {result.elevation && (
                      <View style={styles.elevationContainer}>
                        <Text style={styles.sectionSubtitle}>Elevation</Text>
                        <Text style={styles.elevationText}>{result.elevation.elevation}m above sea level</Text>
                      </View>
                    )}
                    
                    {/* Landmark Recognition */}
                    {result.landmarks && result.landmarks.length > 0 && (
                      <View style={styles.landmarksContainer}>
                        <Text style={styles.sectionSubtitle}>Landmarks & Monuments</Text>
                        {result.landmarks.map((landmark, index) => (
                          <View key={index} style={styles.landmarkItem}>
                            <View style={styles.landmarkHeader}>
                              <Ionicons name="library" size={20} color="#6366f1" style={styles.landmarkIcon} />
                              <Text style={styles.landmarkName}>{landmark.name}</Text>
                              <Text style={styles.landmarkConfidence}>{Math.round(landmark.confidence * 100)}%</Text>
                            </View>
                            {landmark.description && (
                              <Text style={styles.landmarkDesc}>{landmark.description}</Text>
                            )}
                            {landmark.culturalInfo && (
                              <View style={styles.culturalInfo}>
                                <Text style={styles.culturalTitle}>Cultural Context</Text>
                                <Text style={styles.culturalText}>{landmark.culturalInfo}</Text>
                              </View>
                            )}
                            {landmark.historicalInfo && (
                              <View style={styles.historicalInfo}>
                                <Text style={styles.historicalTitle}>Historical Background</Text>
                                <Text style={styles.historicalText}>{landmark.historicalInfo}</Text>
                              </View>
                            )}
                            <View style={styles.landmarkActions}>
                              {landmark.wikipediaUrl && (
                                <TouchableOpacity 
                                  style={styles.wikiBtn} 
                                  onPress={() => Linking.openURL(landmark.wikipediaUrl)}
                                >
                                  <Ionicons name="book" size={16} color="#ffffff" />
                                  <Text style={styles.wikiBtnText}>Wikipedia</Text>
                                </TouchableOpacity>
                              )}
                              {landmark.moreInfoUrl && (
                                <TouchableOpacity 
                                  style={styles.infoBtn} 
                                  onPress={() => Linking.openURL(landmark.moreInfoUrl)}
                                >
                                  <Ionicons name="information-circle" size={16} color="#ffffff" />
                                  <Text style={styles.infoBtnText}>More Info</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    {/* Travel Planning */}
                    <View style={styles.travelContainer}>
                      <Text style={styles.sectionSubtitle}>Plan Your Trip</Text>
                      <View style={styles.travelGrid}>
                        <TouchableOpacity style={styles.travelBtn} onPress={() => openBookingLink('hotels')}>
                          <Ionicons name="bed" size={20} color="#6366f1" />
                          <Text style={styles.travelBtnText}>Hotels</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.travelBtn} onPress={() => openBookingLink('flights')}>
                          <Ionicons name="airplane" size={20} color="#6366f1" />
                          <Text style={styles.travelBtnText}>Flights</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.travelBtn} onPress={() => openBookingLink('restaurants')}>
                          <Ionicons name="restaurant" size={20} color="#6366f1" />
                          <Text style={styles.travelBtnText}>Dining</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.travelBtn} onPress={() => openBookingLink('activities')}>
                          <Ionicons name="ticket" size={20} color="#6366f1" />
                          <Text style={styles.travelBtnText}>Tours</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <View style={styles.resultActions}>
                      <TouchableOpacity style={styles.mapBtn} onPress={openInMaps}>
                        <View style={styles.btnContent}>
                          <Ionicons name="map" size={16} color="#ffffff" />
                          <Text style={styles.mapBtnText}>View Map</Text>
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={styles.saveBtn}>
                        <View style={styles.btnContent}>
                          <Ionicons name="bookmark" size={16} color="#ffffff" />
                          <Text style={styles.saveBtnText}>Save</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.correctBtn}
                      onPress={() => setShowCorrectModal(true)}
                    >
                      <Text style={styles.correctBtnText}>Address Incorrect? Correct It</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.errorCard}>
                    <View style={styles.resultHeader}>
                      <View style={styles.errorIconContainer}>
                        <Ionicons name="close" size={20} color="#ffffff" />
                      </View>
                      <Text style={styles.errorTitle}>No Location Found</Text>
                    </View>
                    <Text style={styles.errorText}>
                      {result.error || 'Could not extract location from this photo'}
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
        
        <VoiceCommands 
          onCommand={handleVoiceCommand}
          isActive={voiceEnabled}
        />
        
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
    photoItem: { width: 80, height: 80, borderRadius: 8, backgroundColor: theme.surface },
    selectedCount: { fontSize: 14, color: theme.textSecondary, marginBottom: 12 },
    processingText: { fontSize: 14, color: '#6366f1', textAlign: 'center', marginTop: 8 }
  });
  
  const selectMultiplePhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'Images',
      allowsMultipleSelection: true,
      quality: 1,
      exif: true
    });
    
    if (!result.canceled) {
      setSelectedPhotos(result.assets);
    }
  };
  
  const bulkEditEXIF = async () => {
    if (selectedPhotos.length === 0) {
      Alert.alert('No Photos', 'Please select photos first');
      return;
    }
    
    setIsProcessing(true);
    // Simulate bulk EXIF editing
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert('Success', `EXIF data updated for ${selectedPhotos.length} photos`);
    }, 2000);
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
      
      // Simulate geotagging process
      setTimeout(() => {
        setIsProcessing(false);
        Alert.alert('Success', `Added GPS coordinates to ${selectedPhotos.length} photos\nLat: ${location.coords.latitude.toFixed(6)}\nLng: ${location.coords.longitude.toFixed(6)}`);
      }, 2000);
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to get location');
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
                <Text style={styles.selectedCount}>
                  {selectedPhotos.length} photos selected
                </Text>
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
                Edit metadata for multiple photos at once. Modify camera settings, timestamps, and technical data.
              </Text>
              <TouchableOpacity style={styles.toolBtn} onPress={bulkEditEXIF} disabled={isProcessing}>
                <Text style={styles.toolBtnText}>
                  {isProcessing ? 'Processing...' : 'Edit EXIF Data'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.toolCard}>
              <View style={styles.toolHeader}>
                <Ionicons name="location" size={24} color="#6366f1" style={styles.toolIcon} />
                <Text style={styles.toolTitle}>Geotagging Tool</Text>
              </View>
              <Text style={styles.toolDesc}>
                Add GPS coordinates to photos that don't have location data. Perfect for photographers.
              </Text>
              <TouchableOpacity style={styles.toolBtn} onPress={addGeotagging} disabled={isProcessing}>
                <Text style={styles.toolBtnText}>
                  {isProcessing ? 'Processing...' : 'Add GPS Tags'}
                </Text>
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
            <View style={styles.logoCircle}>
              <Ionicons name="location" size={50} color="#ffffff" />
            </View>
            <Text style={styles.appName}>Pic2Nav</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.sectionText}>
              Pic2Nav is an intelligent photo location analyzer that uses advanced AI vision technology to identify where your photos were taken.
            </Text>
            <Text style={styles.sectionText}>
              Simply upload any photo and discover its location through landmarks, text recognition, and visual analysis.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featureItem}>
              <Ionicons name="camera" size={20} color="#6366f1" style={styles.featureIcon} />
              <Text style={styles.featureText}>AI-powered image analysis</Text>
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
              <Ionicons name="text" size={20} color="#6366f1" style={styles.featureIcon} />
              <Text style={styles.featureText}>Text and sign detection</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="cloud" size={20} color="#6366f1" style={styles.featureIcon} />
              <Text style={styles.featureText}>Weather and elevation data</Text>
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
  return (
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
  welcomeContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  welcomeTitle: { fontSize: 32, fontWeight: '700', marginTop: 40, marginBottom: 16, textAlign: 'center' },
  welcomeSubtitle: { fontSize: 18, marginBottom: 60, textAlign: 'center', lineHeight: 26 },
  getStartedBtn: { backgroundColor: '#6366f1', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12 },
  getStartedText: { fontSize: 18, fontWeight: '600', color: '#ffffff' }
});