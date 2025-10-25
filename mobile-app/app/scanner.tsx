import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, StatusBar, Linking, Alert, SafeAreaView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { analyzeLocation } from '../services/api';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location.coords);
      }
    } catch (error) {
      console.log('Location error:', error);
    }
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

  useEffect(() => {
    loadSavedLocations();
  }, []);

  useEffect(() => {
    if (result?.location) {
      checkIfSaved();
    }
  }, [result]);

  const loadSavedLocations = async () => {
    try {
      const saved = await SecureStore.getItemAsync('savedLocations');
      if (saved) setSavedLocations(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const checkIfSaved = () => {
    const saved = savedLocations.some(
      loc => loc.latitude === result.location.latitude && loc.longitude === result.location.longitude
    );
    setIsSaved(saved);
  };

  const handleSave = async () => {
    if (!result?.location) return;

    try {
      const locationData = {
        name: result.name,
        address: result.address,
        latitude: result.location.latitude,
        longitude: result.location.longitude,
        savedAt: new Date().toISOString(),
        image: image,
        confidence: result.confidence,
      };

      let updated;
      if (isSaved) {
        updated = savedLocations.filter(
          loc => !(loc.latitude === result.location.latitude && loc.longitude === result.location.longitude)
        );
        await addActivity('Location Removed', `Removed: ${result.name || 'Location'}`, '/scanner');
        Alert.alert('Removed', 'Location removed from collection');
      } else {
        updated = [locationData, ...savedLocations];
        await addActivity('Location Saved', `Saved: ${result.name || 'Location'}`, '/scanner');
        Alert.alert('Saved', 'Location added to collection');
      }

      setSavedLocations(updated);
      setIsSaved(!isSaved);
      await SecureStore.setItemAsync('savedLocations', JSON.stringify(updated));
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save location');
    }
  };

  const handleTakePhoto = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera access needed');
        return;
      }
    }
    setShowCamera(true);
  };

  const handlePickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        if (asset.size && asset.size > 5 * 1024 * 1024) {
          Alert.alert('Image Too Large', 'Please select smaller image');
          return;
        }
        
        const filename = asset.name || `image_${Date.now()}.jpg`;
        const destPath = `${FileSystem.cacheDirectory}${filename}`;
        
        await FileSystem.copyAsync({
          from: asset.uri,
          to: destPath,
        });
        
        setImage(destPath);
        await addActivity('Image Selected', 'Chose image from gallery', '/scanner');
        await processImage(destPath);
      }
    } catch (error: any) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const processImage = async (uri: string, exif?: any) => {
    setLoading(true);
    try {
      // Don't send device location - let API extract GPS from image EXIF first
      const data = await analyzeLocation(uri, null);
      setResult(data);
      
      if (data && !data.error) {
        const locationName = data.name || data.address || 'Unknown location';
        await addActivity('Location Analyzed', `Found: ${locationName}`, '/scanner');
      }
    } catch (error: any) {
      console.error('Processing error:', error);
      let errorMsg = 'Failed to analyze image';
      
      if (!error.response) {
        errorMsg = 'No internet connection';
      } else if (error.response?.status === 413) {
        errorMsg = 'Image too large';
      } else if (error.response?.status === 429) {
        errorMsg = 'Too many requests';
      }
      
      setResult({ error: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const takePicture = async (camera: any) => {
    if (!camera) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    try {
      const photo = await camera.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: true,
      });
      
      if (photo && photo.uri) {
        setShowCamera(false);
        setImage(photo.uri);
        await addActivity('Photo Captured', 'Took photo for location analysis', '/scanner');
        await processImage(photo.uri, photo.exif);
      } else {
        throw new Error('No photo captured');
      }
    } catch (error) {
      console.error('Take picture error:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      setShowCamera(false);
    }
  };

  if (showCamera) {
    return (
      <CameraView style={styles.camera} ref={cameraRef}>
        <SafeAreaView style={styles.cameraContainer}>
          <View style={styles.cameraHeader}>
            <TouchableOpacity onPress={() => setShowCamera(false)} style={styles.cameraClose}>
              <Text style={styles.cameraCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.cameraControls}>
            <TouchableOpacity 
              style={styles.captureButton} 
              onPress={() => {
                if (cameraRef.current) {
                  takePicture(cameraRef.current);
                } else {
                  Alert.alert('Error', 'Camera not ready');
                }
              }}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner</Text>
        {(image || result) && (
          <TouchableOpacity onPress={() => { setImage(null); setResult(null); setIsSaved(false); }} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Photo Location Scanner</Text>
          <Text style={styles.introSubtitle}>Identify locations from photos using AI and GPS data</Text>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.primaryAction} onPress={handleTakePhoto}>
            <Text style={styles.primaryActionText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryAction} onPress={handlePickImage}>
            <Text style={styles.secondaryActionText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>

        {image && (
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Selected Image</Text>
            <Image source={{ uri: image }} style={styles.selectedImage} />
          </View>
        )}

        {loading && (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Analyzing location...</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultSection}>
            {result.error ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>Analysis Failed</Text>
                <Text style={styles.errorText}>{result.error}</Text>
              </View>
            ) : (
              <>
                <View style={styles.successBanner}>
                  <Text style={styles.successText}>✓ Location identified</Text>
                  <Text style={styles.successSubtext}>Analysis completed successfully</Text>
                </View>

                <View style={styles.locationCard}>
                  <Text style={styles.cardTitle}>Location Details</Text>
                  
                  <View style={styles.locationHeader}>
                    <Text style={styles.locationName}>{result.name || 'Location Found'}</Text>
                  </View>
                  
                  {result.address && (
                    <Text style={styles.locationAddress}>{result.address}</Text>
                  )}

                  {result.confidence && (
                    <View style={styles.confidenceSection}>
                      <View style={styles.confidenceHeader}>
                        <Text style={styles.confidenceLabel}>Confidence Score</Text>
                        <Text style={styles.confidenceValue}>{Math.round(result.confidence * 100)}%</Text>
                      </View>
                      <View style={styles.confidenceBar}>
                        <View style={[styles.confidenceFill, { width: `${result.confidence * 100}%` }]} />
                      </View>
                    </View>
                  )}
                </View>

                {result.location && (
                  <View style={styles.detailsCard}>
                    <Text style={styles.cardTitle}>GPS Coordinates</Text>
                    <View style={styles.coordinatesBox}>
                      <Text style={styles.coordinatesText}>
                        {result.location.latitude.toFixed(6)}, {result.location.longitude.toFixed(6)}
                      </Text>
                    </View>
                  </View>
                )}

                {(result.locationDetails?.country || result.locationDetails?.state) && (
                  <View style={styles.detailsCard}>
                    <Text style={styles.cardTitle}>Location Info</Text>
                    {result.locationDetails.country && (
                      <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>Country</Text>
                        <Text style={styles.infoValue}>{result.locationDetails.country}</Text>
                      </View>
                    )}
                    {result.locationDetails.state && (
                      <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>State</Text>
                        <Text style={styles.infoValue}>{result.locationDetails.state}</Text>
                      </View>
                    )}
                  </View>
                )}

                {(result.method || result.deviceAnalysis?.camera?.model) && (
                  <View style={styles.detailsCard}>
                    <Text style={styles.cardTitle}>Technical Details</Text>
                    {result.method && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Method</Text>
                        <Text style={styles.detailValue}>{result.method.replace(/-/g, ' ')}</Text>
                      </View>
                    )}
                    {result.deviceAnalysis?.camera?.model && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Device</Text>
                        <Text style={styles.detailValue}>
                          {result.deviceAnalysis.camera.make} {result.deviceAnalysis.camera.model}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
                  <View style={styles.nearbySection}>
                    <View style={styles.nearbyHeader}>
                      <Text style={styles.cardTitle}>Nearby Places</Text>
                      <View style={styles.nearbyBadge}>
                        <Text style={styles.nearbyBadgeText}>{result.nearbyPlaces.length}</Text>
                      </View>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.nearbyScroll}>
                      {result.nearbyPlaces.slice(0, 5).map((place: any, idx: number) => (
                        <View key={idx} style={styles.nearbyCard}>
                          <Text style={styles.nearbyName} numberOfLines={2}>{place.name || 'Place'}</Text>
                          <Text style={styles.nearbyType}>{place.type || 'Location'}</Text>
                          {place.distance && (
                            <Text style={styles.nearbyDistance}>{place.distance}m away</Text>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {(result.weather || result.elevation) && (
                  <View style={styles.environmentCard}>
                    <Text style={styles.cardTitle}>Environment</Text>
                    <View style={styles.environmentGrid}>
                      {result.weather && (
                        <View style={styles.environmentBox}>
                          <Text style={styles.environmentLabel}>Weather</Text>
                          <Text style={styles.environmentValue}>{result.weather.temperature}°C</Text>
                          <Text style={styles.environmentSubtext}>Wind {result.weather.windSpeed} km/h</Text>
                        </View>
                      )}
                      {result.elevation && (
                        <View style={styles.environmentBox}>
                          <Text style={styles.environmentLabel}>Elevation</Text>
                          <Text style={styles.environmentValue}>{result.elevation.elevation}m</Text>
                          <Text style={styles.environmentSubtext}>Above sea level</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                <View style={styles.actionsCard}>
                  <Text style={styles.cardTitle}>Quick Actions</Text>
                  <TouchableOpacity 
                    style={styles.primaryActionButton}
                    onPress={() => {
                      if (result.location) {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${result.location.latitude},${result.location.longitude}`;
                        Linking.openURL(url);
                      }
                    }}
                  >
                    <Text style={styles.primaryActionButtonText}>Open in Maps</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.secondaryActionButton, isSaved && styles.secondaryActionButtonSaved]}
                    onPress={handleSave}
                  >
                    <Text style={[styles.secondaryActionButtonText, isSaved && styles.secondaryActionButtonTextSaved]}>
                      {isSaved ? '✓ Saved to Collection' : 'Save to Collection'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backButton: { marginRight: 16 },
  backText: { fontSize: 16, color: '#000000', fontWeight: '500' },
  headerTitle: { fontSize: 24, fontWeight: '600', color: '#000000', flex: 1 },
  clearButton: { },
  clearText: { fontSize: 16, color: '#6b7280', fontWeight: '500' },
  content: { flex: 1 },
  introSection: { padding: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  introTitle: { fontSize: 28, fontWeight: '700', color: '#000000', marginBottom: 8 },
  introSubtitle: { fontSize: 16, color: '#6b7280', lineHeight: 24 },
  actionSection: { padding: 24, gap: 12 },
  primaryAction: { backgroundColor: '#000000', borderRadius: 12, padding: 16, alignItems: 'center' },
  primaryActionText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  secondaryAction: { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 16, alignItems: 'center' },
  secondaryActionText: { color: '#000000', fontSize: 16, fontWeight: '600' },
  imageSection: { padding: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#000000', marginBottom: 16 },
  selectedImage: { width: '100%', height: 240, borderRadius: 12 },
  loadingSection: { alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 16, fontSize: 16, color: '#000000', fontWeight: '500' },
  resultSection: { padding: 24 },
  errorCard: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#fecaca' },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#dc2626', marginBottom: 8 },
  errorText: { fontSize: 16, color: '#6b7280' },
  successBanner: { backgroundColor: '#dcfce7', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#86efac' },
  successText: { fontSize: 16, fontWeight: '600', color: '#166534', marginBottom: 4 },
  successSubtext: { fontSize: 14, color: '#15803d' },
  locationCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#000000', marginBottom: 16 },
  locationHeader: { marginBottom: 12 },
  locationName: { fontSize: 20, fontWeight: '700', color: '#000000' },
  locationAddress: { fontSize: 15, color: '#6b7280', marginBottom: 16, lineHeight: 22 },
  confidenceSection: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginTop: 8 },
  confidenceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  confidenceLabel: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  confidenceValue: { fontSize: 16, fontWeight: '700', color: '#000000' },
  confidenceBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  confidenceFill: { height: '100%', backgroundColor: '#000000', borderRadius: 3 },
  detailsCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  coordinatesBox: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  coordinatesText: { fontSize: 15, fontWeight: '600', color: '#000000', fontFamily: 'monospace' },
  infoBox: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 8 },
  infoLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#000000' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  detailLabel: { fontSize: 14, color: '#6b7280' },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#000000', flex: 1, textAlign: 'right' },
  nearbySection: { marginBottom: 16 },
  nearbyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  nearbyBadge: { backgroundColor: '#000000', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  nearbyBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  nearbyScroll: { },
  nearbyCard: { width: 140, backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginRight: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  nearbyName: { fontSize: 14, fontWeight: '600', color: '#000000', marginBottom: 4, height: 36 },
  nearbyType: { fontSize: 12, color: '#6b7280', marginBottom: 8, textTransform: 'capitalize' },
  nearbyDistance: { fontSize: 12, color: '#000000', fontWeight: '500' },
  environmentCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  environmentGrid: { flexDirection: 'row', gap: 12 },
  environmentBox: { flex: 1, backgroundColor: '#f0f9ff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#bfdbfe' },
  environmentLabel: { fontSize: 12, fontWeight: '600', color: '#1e40af', marginBottom: 8 },
  environmentValue: { fontSize: 20, fontWeight: '700', color: '#1e3a8a', marginBottom: 4 },
  environmentSubtext: { fontSize: 11, color: '#3b82f6' },
  actionsCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  primaryActionButton: { backgroundColor: '#000000', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  primaryActionButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  secondaryActionButton: { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  secondaryActionButtonSaved: { backgroundColor: '#000000', borderColor: '#000000' },
  secondaryActionButtonText: { color: '#000000', fontSize: 16, fontWeight: '600' },
  secondaryActionButtonTextSaved: { color: '#ffffff' },
  camera: { flex: 1 },
  cameraContainer: { flex: 1 },
  cameraHeader: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  cameraClose: { alignSelf: 'flex-start' },
  cameraCloseText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  cameraControls: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 60 },
  captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffffff', padding: 6 },
  captureInner: { flex: 1, borderRadius: 34, backgroundColor: '#000000' },
});