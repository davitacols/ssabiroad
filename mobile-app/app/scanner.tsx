import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, StatusBar, Linking, TextInput, Alert, Share } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { initAnalytics, logScreenView, logScan, logSaveLocation, logShareLocation, logError } from '../utils/analytics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { analyzeLocation } from '../services/api';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const cameraRef = useState<any>({ current: null })[0];

  useEffect(() => {
    initAnalytics();
    logScreenView('scanner');
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
        Alert.alert('Removed', 'Location removed from your collection');
      } else {
        updated = [locationData, ...savedLocations];
        Alert.alert('Saved!', 'Location added to your collection');
      }

      setSavedLocations(updated);
      setIsSaved(!isSaved);
      await SecureStore.setItemAsync('savedLocations', JSON.stringify(updated));
      if (!isSaved) logSaveLocation();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save location');
    }
  };

  const handleShare = async () => {
    if (!result) return;

    try {
      const shareMessage = `Location: ${result.name || 'Unknown'}\\n\\n` +
        `Address: ${result.address || 'N/A'}\\n` +
        `Coordinates: ${result.location?.latitude.toFixed(6)}, ${result.location?.longitude.toFixed(6)}\\n` +
        `${result.confidence ? `Confidence: ${Math.round(result.confidence * 100)}%\\n` : ''}` +
        `\\nView on Maps: https://www.google.com/maps?q=${result.location?.latitude},${result.location?.longitude}`;

      await Share.share({
        message: shareMessage,
        title: `Location: ${result.name}`,
      });
      logShareLocation();
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleTakePhoto = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos');
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
          Alert.alert('Image Too Large', 'Please select an image smaller than 5MB.');
          return;
        }
        
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (asset.mimeType && !validTypes.includes(asset.mimeType)) {
          Alert.alert('Invalid Format', 'Please select a JPEG, PNG, or WebP image.');
          return;
        }
        
        const filename = asset.name || `image_${Date.now()}.jpg`;
        const destPath = `${FileSystem.cacheDirectory}${filename}`;
        
        await FileSystem.copyAsync({
          from: asset.uri,
          to: destPath,
        });
        
        setImage(destPath);
        await processImage(destPath, undefined, undefined);
      }
    } catch (error: any) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const processImage = async (uri: string, exif?: any, base64?: string) => {
    setLoading(true);
    try {
      let gpsLocation = null;
      if (exif?.GPSLatitude && exif?.GPSLongitude && 
          exif.GPSLatitude !== 0 && exif.GPSLongitude !== 0) {
        gpsLocation = {
          latitude: exif.GPSLatitude,
          longitude: exif.GPSLongitude,
        };
      }
      
      const data = await analyzeLocation(uri, gpsLocation, base64);
      setResult(data);
      logScan(true, data.method);
    } catch (error: any) {
      console.error('Full error:', error);
      let errorMsg = 'Failed to process image';
      
      if (!error.response) {
        errorMsg = 'No internet connection. Please check your network and try again.';
      } else if (error.response?.status === 413) {
        errorMsg = 'Image is too large. Please select a smaller image (under 5MB).';
      } else if (error.response?.status === 429) {
        errorMsg = 'Too many requests. Please wait a moment and try again.';
      } else if (error.response?.status >= 500) {
        errorMsg = 'Server error. Please try again later.';
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message?.includes('timeout')) {
        errorMsg = 'Request timed out. Please check your connection and try again.';
      }
      
      logError(errorMsg, 'image_processing');
      logScan(false);
      setResult({ error: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const takePicture = async (camera: any) => {
    try {
      const photo = await camera.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: true,
      });
      
      setShowCamera(false);
      setImage(photo.uri);
      await processImage(photo.uri, photo.exif, undefined);
    } catch (error) {
      console.error('Take picture error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  if (showCamera) {
    return (
      <CameraView style={styles.camera} ref={(ref) => ref && (cameraRef.current = ref)}>
        <View style={styles.cameraControls}>
          <TouchableOpacity 
            style={styles.captureButton} 
            onPress={() => cameraRef.current && takePicture(cameraRef.current)}
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => setShowCamera(false)}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafaf9" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => router.push('/geofence')} style={styles.actionButton}>
                <Text style={styles.actionText}>Geofencing</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/settings')} style={styles.actionButton}>
                <Text style={styles.actionText}>Settings</Text>
              </TouchableOpacity>
              {savedLocations.length > 0 && (
                <TouchableOpacity onPress={() => Alert.alert('Saved Locations', `You have ${savedLocations.length} saved locations`)} style={styles.savedBadge}>
                  <Text style={styles.savedBadgeText}>{String(savedLocations.length)}</Text>
                </TouchableOpacity>
              )}
              {(image || result) && (
                <TouchableOpacity onPress={() => { setImage(null); setResult(null); setIsSaved(false); }} style={styles.clearButton}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text style={styles.title}>Photo Location Scanner</Text>
          <Text style={styles.subtitle}>Identify locations from photos using AI and GPS data</Text>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleTakePhoto}>
            <Text style={styles.primaryButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handlePickImage}>
            <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>

        {image && (
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Selected Image</Text>
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.image} />
            </View>
          </View>
        )}

        {loading && (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Analyzing location...</Text>
            <Text style={styles.loadingSubtext}>This may take a few moments</Text>
          </View>
        )}

        {result && (
          <ScrollView style={styles.resultSection}>
            {result.error ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>Analysis Failed</Text>
                <Text style={styles.errorText}>{result.error}</Text>
              </View>
            ) : (
              <>
                <View style={styles.mainCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.locationName}>{result.name || 'Location Found'}</Text>
                    {result.confidence && (
                      <View style={styles.confidenceBadge}>
                        <Text style={styles.confidenceText}>{Math.round(result.confidence * 100)}% Match</Text>
                      </View>
                    )}
                  </View>
                  
                  {result.address && (
                    <Text style={styles.locationAddress}>{result.address}</Text>
                  )}

                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, isSaved && styles.actionBtnSaved]} 
                      onPress={handleSave}
                    >
                      <Text style={[styles.actionBtnText, isSaved && styles.actionBtnTextSaved]}>
                        {isSaved ? 'Saved' : 'Save Location'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                      <Text style={styles.actionBtnText}>Share</Text>
                    </TouchableOpacity>
                    {result.location && (
                      <TouchableOpacity 
                        style={styles.actionBtn}
                        onPress={() => {
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${result.location.latitude},${result.location.longitude}`;
                          Linking.openURL(url);
                        }}
                      >
                        <Text style={styles.actionBtnText}>Navigate</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  {result.location && (
                    <View style={styles.detailCard}>
                      <Text style={styles.detailLabel}>Coordinates</Text>
                      <Text style={styles.detailValue}>{result.location.latitude.toFixed(6)}, {result.location.longitude.toFixed(6)}</Text>
                    </View>
                  )}
                  {result.elevation?.elevation != null && (
                    <View style={styles.detailCard}>
                      <Text style={styles.detailLabel}>Elevation</Text>
                      <Text style={styles.detailValue}>{result.elevation.elevation}m</Text>
                    </View>
                  )}
                  {result.weather?.temperature != null && (
                    <View style={styles.detailCard}>
                      <Text style={styles.detailLabel}>Temperature</Text>
                      <Text style={styles.detailValue}>{result.weather.temperature}°C</Text>
                    </View>
                  )}
                  {result.locationDetails?.country && (
                    <View style={styles.detailCard}>
                      <Text style={styles.detailLabel}>Country</Text>
                      <Text style={styles.detailValue}>{result.locationDetails.country}</Text>
                    </View>
                  )}
                </View>

                {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Nearby Places</Text>
                      <View style={styles.countBadge}>
                        <Text style={styles.countText}>{result.nearbyPlaces.length}</Text>
                      </View>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
                      {result.nearbyPlaces.slice(0, 8).map((place: any, idx: number) => (
                        <View key={idx} style={styles.placeCard}>
                          <Text style={styles.placeName} numberOfLines={2}>{place.name || 'Place'}</Text>
                          <Text style={styles.placeType}>{place.type || 'Location'}</Text>
                          <View style={styles.placeFooter}>
                            {place.distance && (
                              <Text style={styles.placeDistance}>{place.distance}m</Text>
                            )}
                            {place.rating != null && place.rating > 0 && (
                              <Text style={styles.placeRating}>{place.rating.toFixed(1)}</Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {savedLocations.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Your Saved Locations</Text>
                      <View style={styles.countBadge}>
                        <Text style={styles.countText}>{savedLocations.length}</Text>
                      </View>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
                      {savedLocations.slice(0, 5).map((loc: any, idx: number) => (
                        <TouchableOpacity 
                          key={idx} 
                          style={styles.savedCard}
                          onPress={() => {
                            if (loc.latitude && loc.longitude) {
                              const url = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
                              Linking.openURL(url);
                            }
                          }}
                        >
                          <Text style={styles.savedName} numberOfLines={2}>{loc.name || 'Saved Location'}</Text>
                          <Text style={styles.savedDate}>{new Date(loc.savedAt).toLocaleDateString()}</Text>
                          <Text style={styles.savedCoords}>{loc.latitude?.toFixed(2)}, {loc.longitude?.toFixed(2)}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.feedbackSection}>
                  <TouchableOpacity 
                    style={styles.feedbackButton}
                    onPress={() => setShowSuggestion(!showSuggestion)}
                  >
                    <Text style={styles.feedbackText}>Wrong location? Help us improve</Text>
                  </TouchableOpacity>

                  {showSuggestion && (
                    <View style={styles.suggestionBox}>
                      <TextInput
                        style={styles.suggestionInput}
                        placeholder="Enter correct location name..."
                        placeholderTextColor="#94a3b8"
                        value={suggestion}
                        onChangeText={setSuggestion}
                        multiline
                      />
                      <TouchableOpacity 
                        style={styles.submitButton}
                        onPress={() => {
                          if (suggestion.trim()) {
                            Alert.alert('Thank You!', 'Your feedback helps improve accuracy.');
                            setSuggestion('');
                            setShowSuggestion(false);
                          }
                        }}
                      >
                        <Text style={styles.submitButtonText}>Submit Feedback</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { 
    backgroundColor: '#ffffff', 
    paddingTop: 60, 
    paddingHorizontal: 24, 
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backButton: {},
  backText: { fontSize: 16, color: '#3b82f6', fontWeight: '600' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionButton: { 
    backgroundColor: '#f1f5f9', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8 
  },
  actionText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  savedBadge: { 
    backgroundColor: '#dbeafe', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 12 
  },
  savedBadgeText: { fontSize: 12, color: '#1e40af', fontWeight: '700' },
  clearButton: { 
    backgroundColor: '#fee2e2', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8 
  },
  clearText: { fontSize: 12, color: '#dc2626', fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#64748b', fontWeight: '500' },
  
  actionSection: { 
    backgroundColor: '#ffffff', 
    padding: 24, 
    gap: 12 
  },
  primaryButton: { 
    backgroundColor: '#3b82f6', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { 
    backgroundColor: '#f8fafc', 
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  secondaryButtonText: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
  
  imageSection: { 
    backgroundColor: '#ffffff', 
    margin: 24, 
    borderRadius: 20, 
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4
  },
  imageContainer: { marginTop: 12 },
  image: { width: '100%', height: 300, borderRadius: 12 },
  
  loadingSection: { 
    backgroundColor: '#ffffff', 
    margin: 24, 
    borderRadius: 20, 
    padding: 40, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4
  },
  loadingText: { marginTop: 16, fontSize: 16, color: '#0f172a', fontWeight: '600' },
  loadingSubtext: { marginTop: 4, fontSize: 14, color: '#64748b' },
  
  resultSection: { flex: 1 },
  
  errorCard: { 
    backgroundColor: '#ffffff', 
    margin: 24, 
    borderRadius: 20, 
    padding: 24,
    borderWidth: 2,
    borderColor: '#fecaca'
  },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#dc2626', marginBottom: 8 },
  errorText: { fontSize: 15, color: '#64748b', lineHeight: 22 },
  
  mainCard: { 
    backgroundColor: '#ffffff', 
    margin: 24, 
    borderRadius: 20, 
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  locationName: { fontSize: 22, fontWeight: '800', color: '#0f172a', flex: 1, marginRight: 12 },
  confidenceBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  confidenceText: { fontSize: 12, fontWeight: '700', color: '#166534' },
  locationAddress: { fontSize: 15, color: '#64748b', marginBottom: 20, lineHeight: 22 },
  
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { 
    flex: 1, 
    backgroundColor: '#f8fafc', 
    padding: 12, 
    borderRadius: 10, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  actionBtnSaved: { backgroundColor: '#fee2e2', borderColor: '#fecaca' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  actionBtnTextSaved: { color: '#dc2626' },
  
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  detailCard: { 
    width: '48%', 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  detailLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginBottom: 4 },
  detailValue: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  
  section: { marginTop: 16, paddingHorizontal: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', flex: 1 },
  countBadge: { backgroundColor: '#3b82f6', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  countText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  
  horizontalList: { marginLeft: -24 },
  
  placeCard: { 
    width: 160, 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    padding: 16, 
    marginLeft: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  placeName: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 6, height: 40 },
  placeType: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  placeFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  placeDistance: { fontSize: 11, color: '#3b82f6', fontWeight: '600' },
  placeRating: { fontSize: 11, color: '#f59e0b', fontWeight: '600' },
  
  savedCard: { 
    width: 160, 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    padding: 16, 
    marginLeft: 24,
    borderWidth: 2,
    borderColor: '#dbeafe'
  },
  savedName: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 8, height: 36 },
  savedDate: { fontSize: 11, color: '#64748b', marginBottom: 8 },
  savedCoords: { fontSize: 10, color: '#3b82f6', fontWeight: '600' },
  
  feedbackSection: { margin: 24 },
  feedbackButton: { 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    padding: 16, 
    borderWidth: 2, 
    borderColor: '#e2e8f0', 
    borderStyle: 'dashed',
    alignItems: 'center'
  },
  feedbackText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  suggestionBox: { 
    marginTop: 12, 
    padding: 16, 
    backgroundColor: '#fffbeb', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#fbbf24' 
  },
  suggestionInput: { 
    backgroundColor: '#ffffff', 
    padding: 14, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#fbbf24', 
    fontSize: 14, 
    color: '#0f172a', 
    minHeight: 70, 
    textAlignVertical: 'top', 
    marginBottom: 12 
  },
  submitButton: { 
    backgroundColor: '#3b82f6', 
    padding: 14, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  submitButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  
  camera: { flex: 1 },
  cameraControls: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
    paddingBottom: 40 
  },
  captureButton: { 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    backgroundColor: '#ffffff', 
    padding: 5, 
    marginBottom: 20 
  },
  captureInner: { flex: 1, borderRadius: 30, backgroundColor: '#3b82f6' },
  cancelButton: { 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 20 
  },
  cancelText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});