import React, { useState, useEffect, createContext, useContext } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, StatusBar, Alert, Linking, Platform, Modal } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync } from 'expo-image-manipulator';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

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
      <View style={styles.welcomeContent}>
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
      </View>
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
    actionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
    actionDesc: { fontSize: 14, fontWeight: '400', color: theme.textSecondary },
    actionArrow: { fontSize: 18, color: '#a1a1aa' },
    footer: { paddingHorizontal: 32, paddingVertical: 80, alignItems: 'center' },
    footerTitle: { fontSize: 28, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
    footerDesc: { fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24, color: theme.textSecondary },
    footerButton: { backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', gap: 8 },
    footerButtonText: { fontSize: 16, fontWeight: '600', color: '#000000' },
    termsLink: { marginTop: 20 },
    termsLinkText: { fontSize: 14, color: '#6366f1', textAlign: 'center', textDecorationLine: 'underline' }
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
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryAction}
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.9}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="time" size={24} color="#6366f1" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View History</Text>
              <Text style={styles.actionDesc}>See past scans</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
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
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    content: { flexGrow: 1, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, backgroundColor: theme.bg, borderBottomWidth: 1, borderBottomColor: theme.surface },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    backText: { fontSize: 18, color: theme.text },
    headerTitle: { fontSize: 16, fontWeight: '500', color: theme.text, flex: 1, textAlign: 'center' },
    headerSpacer: { width: 40 },
    scannerSection: { padding: 20 },
    scannerArea: { alignItems: 'center', marginBottom: 40 },
    scannerFrame: { width: 260, height: 260, borderRadius: 24, backgroundColor: theme.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#3b82f6', borderStyle: 'dashed' },
    scannerIcon: { marginBottom: 16 },
    scannerText: { fontSize: 16, color: theme.textSecondary },
    scannerActions: { gap: 12 },
    primaryBtn: { backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
    primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#000000' },
    secondaryBtn: { backgroundColor: 'transparent', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#ffffff' },
    secondaryBtnText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
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
    elevationText: { fontSize: 16, color: theme.text, fontWeight: '500' }
  });
  const [photo, setPhoto] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const takePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      allowsEditing: false,
      exif: true,
      base64: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      ...(Platform.OS !== 'web' && {
        preserveExif: true,
      }),
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setPhoto(asset.uri);
      analyzeImage(asset.uri, asset.exif, 'camera');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      exif: true,
      base64: false,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      console.log('Selected image EXIF:', asset.exif);
      
      // Try to get original file with EXIF preserved
      try {
        // Read file as base64 to preserve EXIF
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Create a new file with preserved EXIF
        const fileUri = FileSystem.documentDirectory + 'temp_image.jpg';
        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        setPhoto(fileUri);
        analyzeImage(fileUri, asset.exif, 'gallery');
      } catch (error) {
        console.log('EXIF preservation failed, using original:', error);
        setPhoto(asset.uri);
        analyzeImage(asset.uri, asset.exif, 'gallery');
      }
    }
  };

  const analyzeImage = async (imageUri, exifData = null, source = 'gallery') => {
    setLoading(true);
    console.log('Starting API call...');
    console.log('Image EXIF data:', exifData);
    
    // Always use AI vision analysis - don't rely on GPS
    console.log('Using AI vision analysis to identify location from image content');
    
    try {
      // Compress image to reduce size
      const compressedImage = await manipulateAsync(
        imageUri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: 'jpeg' }
      );
      
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        // For web: create proper File object
        const response = await fetch(compressedImage.uri);
        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
        formData.append('image', file);
      } else {
        // For mobile: use compressed URI
        formData.append('image', {
          uri: compressedImage.uri,
          type: 'image/jpeg',
          name: 'image.jpg',
        });
      }
      
      // Send 0,0 to force AI vision analysis of image content
      formData.append('latitude', '0');
      formData.append('longitude', '0');
      console.log('Forcing AI vision analysis of image landmarks and text');

      console.log('Making API request with FormData');
      const response = await fetch('https://ssabiroad.vercel.app/api/location-recognition-v2', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      setResult(data);
    } catch (error) {
      console.error('API Error:', error);
      setResult({ success: false, error: 'Could not identify location from image. Try an image with visible landmarks, signs, or recognizable buildings.' });
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = () => {
    if (result?.success && result.location) {
      const { latitude, longitude } = result.location;
      const url = `https://maps.google.com/?q=${latitude},${longitude}`;
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
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
            <View style={styles.scannerArea}>
              <View style={styles.scannerFrame}>
                <Ionicons name="camera-outline" size={64} color="#6366f1" style={styles.scannerIcon} />
                <Text style={styles.scannerText}>Ready to scan</Text>
              </View>
            </View>
            
            <View style={styles.scannerActions}>
              <TouchableOpacity style={styles.primaryBtn} onPress={takePicture}>
                <Text style={styles.primaryBtnText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage}>
                <Text style={styles.secondaryBtnText}>Choose from Gallery</Text>
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
                <View style={styles.loadingSpinner}>
                  <Ionicons name="search" size={32} color="#6366f1" />
                </View>
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
                      {result.address || result.name || 'Location identified'}
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
                    {result.deviceAnalysis && (
                      <View style={styles.deviceContainer}>
                        <Text style={styles.sectionSubtitle}>Device Information</Text>
                        <View style={styles.deviceGrid}>
                          {result.deviceAnalysis.camera && (
                            <View style={styles.deviceSection}>
                              <Text style={styles.deviceTitle}>Camera</Text>
                              <Text style={styles.deviceText}>{result.deviceAnalysis.camera.make} {result.deviceAnalysis.camera.model}</Text>
                              {result.deviceAnalysis.camera.software && (
                                <Text style={styles.deviceText}>Software: {result.deviceAnalysis.camera.software}</Text>
                              )}
                            </View>
                          )}
                          {result.deviceAnalysis.settings && (
                            <View style={styles.deviceSection}>
                              <Text style={styles.deviceTitle}>Settings</Text>
                              {result.deviceAnalysis.settings.iso && (
                                <Text style={styles.deviceText}>ISO {result.deviceAnalysis.settings.iso}</Text>
                              )}
                              {result.deviceAnalysis.settings.aperture && (
                                <Text style={styles.deviceText}>f/{result.deviceAnalysis.settings.aperture}</Text>
                              )}
                              {result.deviceAnalysis.settings.focalLength && (
                                <Text style={styles.deviceText}>{result.deviceAnalysis.settings.focalLength}mm</Text>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                    
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
              onPress={() => { setPhoto(null); setResult(null); }}
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
    backText: { fontSize: 18, color: theme.text },
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
          <Text style={styles.backText}>←</Text>
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

// History Screen
function HistoryScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    content: { flexGrow: 1, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, backgroundColor: theme.bg, borderBottomWidth: 1, borderBottomColor: theme.surface },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    backText: { fontSize: 18, color: theme.text },
    headerTitle: { fontSize: 16, fontWeight: '500', color: theme.text, flex: 1, textAlign: 'center' },
    headerSpacer: { width: 40 },
    emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center' },
    emptyIcon: { marginBottom: 24 },
    emptyTitle: { fontSize: 24, fontWeight: '600', color: theme.text, marginBottom: 8 },
    emptyDesc: { fontSize: 16, color: theme.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
    primaryBtn: { backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
    primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#000000' }
  });
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan History</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        style={Platform.OS === 'web' ? { height: '100vh', overflow: 'scroll' } : { flex: 1 }}
      >
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#6366f1" style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptyDesc}>Start scanning photos to see your history here</Text>
          
          <TouchableOpacity 
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Camera')}
          >
            <Text style={styles.primaryBtnText}>Start Scanning</Text>
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
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Camera" component={CameraScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
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
  backText: { fontSize: 18, color: '#ffffff' },
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