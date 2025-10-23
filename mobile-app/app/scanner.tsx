import { useState, useEffect } from 'react';
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
        // Remove from saved
        updated = savedLocations.filter(
          loc => !(loc.latitude === result.location.latitude && loc.longitude === result.location.longitude)
        );
        Alert.alert('Removed', 'Location removed from your collection');
      } else {
        // Add to saved
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
      const shareMessage = `📍 ${result.name || 'Location'}\n\n` +
        `📍 Address: ${result.address || 'N/A'}\n` +
        `🌍 Coordinates: ${result.location?.latitude.toFixed(6)}, ${result.location?.longitude.toFixed(6)}\n` +
        `${result.confidence ? `✅ Confidence: ${Math.round(result.confidence * 100)}%\n` : ''}` +
        `\n🗺️ View on Maps: https://www.google.com/maps?q=${result.location?.latitude},${result.location?.longitude}`;

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
      await requestPermission();
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
        
        // Check file size
        if (asset.size && asset.size > 5 * 1024 * 1024) {
          Alert.alert('Image Too Large', 'Please select an image smaller than 5MB.');
          return;
        }
        
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (asset.mimeType && !validTypes.includes(asset.mimeType)) {
          Alert.alert('Invalid Format', 'Please select a JPEG, PNG, or WebP image.');
          return;
        }
        
        const filename = asset.name || `image_${Date.now()}.jpg`;
        const destPath = `${FileSystem.cacheDirectory}${filename}`;
        
        console.log('Copying from:', asset.uri);
        console.log('Copying to:', destPath);
        
        await FileSystem.copyAsync({
          from: asset.uri,
          to: destPath,
        });
        
        console.log('File size:', asset.size, 'bytes');
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
      console.log('Processing image');
      
      // Extract GPS from EXIF if available
      let gpsLocation = null;
      if (exif?.GPSLatitude && exif?.GPSLongitude && 
          exif.GPSLatitude !== 0 && exif.GPSLongitude !== 0) {
        gpsLocation = {
          latitude: exif.GPSLatitude,
          longitude: exif.GPSLongitude,
        };
        console.log('✅ Sending EXIF GPS to server:', gpsLocation);
      } else {
        console.log('⚠️ No EXIF GPS - server will extract from image');
      }
      
      const data = await analyzeLocation(uri, gpsLocation, base64);
      console.log('API Response:', data);
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

  if (showCamera) {
    return (
      <CameraView style={styles.camera}>
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.captureButton} onPress={() => setShowCamera(false)}>
            <View style={styles.captureInner} />
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
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsButton}>
                <Text style={styles.settingsText}>⚙</Text>
              </TouchableOpacity>
              {savedLocations.length > 0 && (
                <TouchableOpacity onPress={() => Alert.alert('Saved Locations', `You have ${savedLocations.length} saved locations`)} style={styles.savedBadge}>
                  <Text style={styles.savedBadgeText}>{String(savedLocations.length)}</Text>
                </TouchableOpacity>
              )}
              {(image || result) && (
                <TouchableOpacity onPress={() => { setImage(null); setResult(null); setIsSaved(false); }} style={styles.clearButton}>
                  <Text style={styles.clearText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text style={styles.title}>Photo Scanner</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.primaryButton, { marginBottom: 12 }]} onPress={handleTakePhoto}>
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handlePickImage}>
            <Text style={styles.secondaryButtonText}>Choose Photo</Text>
          </TouchableOpacity>
        </View>

        {image && (
          <View style={styles.imageContainer}>
            <View style={styles.imageGlow} />
            <Image source={{ uri: image }} style={styles.image} />
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Analyzing location...</Text>
          </View>
        )}

        {result && (
          <ScrollView style={styles.resultScroll}>
            {result.error ? (
              <View style={styles.heroCard}>
                <View style={styles.heroHeader}>
                  <View style={styles.heroContent}>
                    <Text style={styles.errorTitle}>Error</Text>
                    <Text style={styles.errorText}>{result.error}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <>
                {/* Hero Card */}
                <View style={styles.heroCard}>
                  <View style={styles.heroHeader}>
                    <View style={styles.heroContent}>
                      <Text style={styles.heroTitle}>{result.name || 'Location Found'}</Text>
                      {result.address && <Text style={styles.heroSubtitle}>{result.address}</Text>}
                    </View>
                  </View>
                  
                  {result.confidence && (
                    <View style={styles.confidenceBadge}>
                      <View style={[styles.confidenceBar, { width: `${Math.round(result.confidence * 100)}%` }]} />
                      <Text style={styles.confidenceText}>{String(Math.round(result.confidence * 100))}% Match</Text>
                    </View>
                  )}

                  {/* Quick Actions */}
                  <View style={styles.quickActions}>
                    <TouchableOpacity 
                      style={[styles.quickActionBtn, isSaved && styles.quickActionBtnActive]} 
                      onPress={handleSave}
                    >
                      <Text style={[styles.quickActionText, isSaved && styles.quickActionTextActive]}>
                        {isSaved ? 'Saved' : 'Save'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionBtn} onPress={handleShare}>
                      <Text style={styles.quickActionText}>Share</Text>
                    </TouchableOpacity>
                    {result.location && (
                      <TouchableOpacity 
                        style={styles.quickActionBtn}
                        onPress={() => {
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${result.location.latitude},${result.location.longitude}`;
                          Linking.openURL(url);
                        }}
                      >
                        <Text style={styles.quickActionText}>Navigate</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Info Grid */}
                <View style={styles.infoGrid}>
                  {result.location && (
                    <View style={styles.infoCard}>
                      <Text style={styles.infoLabel}>Coordinates</Text>
                      <Text style={styles.infoValue}>{String(result.location.latitude.toFixed(4))}, {String(result.location.longitude.toFixed(4))}</Text>
                    </View>
                  )}
                  {result.elevation?.elevation != null && (
                    <View style={styles.infoCard}>
                      <Text style={styles.infoLabel}>Elevation</Text>
                      <Text style={styles.infoValue}>{String(result.elevation.elevation)}m</Text>
                    </View>
                  )}
                  {result.weather?.temperature != null && (
                    <View style={styles.infoCard}>
                      <Text style={styles.infoLabel}>Temperature</Text>
                      <Text style={styles.infoValue}>{String(result.weather.temperature)}°C</Text>
                    </View>
                  )}
                  {result.locationDetails?.country && (
                    <View style={styles.infoCard}>
                      <Text style={styles.infoLabel}>Country</Text>
                      <Text style={styles.infoValue}>{result.locationDetails.country}</Text>
                    </View>
                  )}
                </View>

                {/* Nearby Places */}
                {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Nearby Places</Text>
                      <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>{String(result.nearbyPlaces.length)}</Text>
                      </View>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                      {result.nearbyPlaces.slice(0, 8).map((place: any, idx: number) => (
                        <View key={idx} style={styles.placeCard}>
                          <View style={styles.placeCardHeader}>
                            {place.rating != null && place.rating > 0 && (
                              <View style={styles.ratingBadge}>
                                <Text style={styles.ratingText}>{String(place.rating.toFixed(1))}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.placeCardName} numberOfLines={2}>{String(place.name || 'Place')}</Text>
                          <Text style={styles.placeCardType}>{String(place.type || 'Location')}</Text>
                          {place.distance && (
                            <View style={styles.distanceBadge}>
                              <Text style={styles.distanceText}>{String(place.distance)}m</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Photos Gallery */}
                {result.photos && Array.isArray(result.photos) && result.photos.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Photo Gallery</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                      {result.photos.map((photo: string, idx: number) => (
                        <View key={idx} style={styles.photoCard}>
                          <Image source={{ uri: photo }} style={styles.photoImage} />
                          <View style={styles.photoOverlay}>
                            <Text style={styles.photoNumber}>{String(idx + 1)}</Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Transit */}
                {result.transit && Array.isArray(result.transit) && result.transit.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Transit Stations</Text>
                    </View>
                    {result.transit.slice(0, 3).map((station: any, idx: number) => (
                      <View key={idx} style={styles.transitCard}>
                        <View style={styles.transitInfo}>
                          <Text style={styles.transitName}>{String(station.name || 'Transit Station')}</Text>
                          <View style={styles.transitMeta}>
                            {station.distance != null && <Text style={styles.transitDistance}>{String(station.distance)}m</Text>}
                            {station.rating != null && station.rating > 0 && <Text style={styles.transitRating}>{String(station.rating.toFixed(1))}</Text>}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Historical Data */}
                {result.historicalData && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Historical Info</Text>
                    </View>
                    <View style={styles.historyCard}>
                      {result.historicalData.photoAge && (
                        <Text style={styles.historyText}>{String(result.historicalData.photoAge)}</Text>
                      )}
                      {result.historicalData.historicalContext && (
                        <Text style={styles.historyContext}>{String(result.historicalData.historicalContext)}</Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Weather Details */}
                {result.weather && result.weather.windSpeed && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Weather</Text>
                    </View>
                    <View style={styles.weatherCard}>
                      <Text style={styles.weatherText}>Wind: {String(result.weather.windSpeed)} km/h</Text>
                      {result.weather.humidity && <Text style={styles.weatherText}>Humidity: {String(result.weather.humidity)}%</Text>}
                    </View>
                  </View>
                )}

                {/* Saved Locations Preview */}
                {savedLocations.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Your Saved Locations</Text>
                      <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>{String(savedLocations.length)}</Text>
                      </View>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                      {savedLocations.slice(0, 5).map((loc: any, idx: number) => (
                        <TouchableOpacity 
                          key={idx} 
                          style={styles.savedLocationCard}
                          onPress={() => {
                            if (loc.latitude && loc.longitude) {
                              const url = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
                              Linking.openURL(url);
                            }
                          }}
                        >
                          <Text style={styles.savedLocationName} numberOfLines={2}>{loc.name || 'Saved Location'}</Text>
                          <Text style={styles.savedLocationDate}>{new Date(loc.savedAt).toLocaleDateString()}</Text>
                          <View style={styles.savedLocationFooter}>
                            <Text style={styles.savedLocationCoords}>{String(loc.latitude?.toFixed(2))}, {String(loc.longitude?.toFixed(2))}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Feedback Section */}
                <View style={styles.section}>
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
                        placeholderTextColor="#a8a29e"
                        value={suggestion}
                        onChangeText={setSuggestion}
                        multiline
                      />
                      <TouchableOpacity 
                        style={styles.submitButton}
                        onPress={() => {
                          if (suggestion.trim()) {
                            Alert.alert('Thank You!', 'Your feedback helps improve accuracy.');
                            console.log('Correction:', { original: result.name, suggested: suggestion });
                            setSuggestion('');
                            setShowSuggestion(false);
                          }
                        }}
                      >
                        <Text style={styles.submitButtonText}>Submit</Text>
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
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backButton: {},
  backText: { fontSize: 16, color: '#3b82f6', fontWeight: '600' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  settingsButton: { marginRight: 8 },
  settingsText: { fontSize: 24, color: '#64748b' },
  savedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dbeafe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginRight: 8 },
  savedBadgeText: { fontSize: 13, color: '#1e40af', fontWeight: '700' },
  clearButton: { backgroundColor: '#fee2e2', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  clearText: { fontSize: 16, color: '#dc2626', fontWeight: '700' },
  title: { fontSize: 32, fontWeight: '800', color: '#0f172a', letterSpacing: -1 },
  actions: { padding: 20, backgroundColor: '#fff' },
  primaryButton: { backgroundColor: '#3b82f6', padding: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  secondaryButton: { backgroundColor: '#f1f5f9', padding: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e2e8f0' },
  buttonIcon: { fontSize: 22, marginRight: 12 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  secondaryButtonText: { color: '#0f172a', fontSize: 17, fontWeight: '700' },
  imageContainer: { padding: 20, backgroundColor: '#fff' },
  imageGlow: { position: 'absolute', top: 16, left: 16, right: 16, bottom: 16, backgroundColor: '#3b82f6', opacity: 0.1, borderRadius: 20 },
  image: { width: '100%', height: 300, borderRadius: 16, borderWidth: 2, borderColor: '#e2e8f0' },
  loadingContainer: { padding: 40, alignItems: 'center', backgroundColor: '#fff', margin: 20, borderRadius: 20 },
  loadingText: { marginTop: 16, fontSize: 16, color: '#64748b', fontWeight: '600' },
  resultScroll: { flex: 1 },
  
  // Hero Card
  heroCard: { margin: 20, padding: 24, backgroundColor: '#fff', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  heroHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  heroIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  heroIconText: { fontSize: 28 },
  heroContent: { flex: 1 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 6, lineHeight: 28 },
  heroSubtitle: { fontSize: 14, color: '#64748b', lineHeight: 20 },
  confidenceBadge: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 12, marginBottom: 16, position: 'relative', overflow: 'hidden' },
  confidenceBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#dcfce7', borderRadius: 12 },
  confidenceText: { fontSize: 13, fontWeight: '700', color: '#166534', zIndex: 1 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around' },
  quickActionBtn: { alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#f8fafc', flex: 1, marginHorizontal: 4 },
  quickActionBtnActive: { backgroundColor: '#fee2e2' },
  quickActionText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  quickActionTextActive: { color: '#dc2626' },
  
  // Info Grid
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
  infoCard: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 16, margin: '1%', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  infoLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  
  // Sections
  section: { marginTop: 16, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', flex: 1 },
  sectionBadge: { backgroundColor: '#3b82f6', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  sectionBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  
  // Horizontal Scroll
  horizontalScroll: { marginLeft: -20 },
  
  // Place Cards
  placeCard: { width: 160, backgroundColor: '#fff', borderRadius: 16, padding: 16, marginLeft: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  placeCardHeader: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 12 },
  ratingBadge: { backgroundColor: '#fef3c7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  ratingText: { fontSize: 11, fontWeight: '700', color: '#92400e' },
  placeCardName: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 6, height: 40 },
  placeCardType: { fontSize: 11, color: '#64748b', textTransform: 'capitalize', marginBottom: 8 },
  distanceBadge: { backgroundColor: '#dbeafe', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  distanceText: { fontSize: 11, fontWeight: '600', color: '#1e40af' },
  
  // Saved Locations
  savedLocationCard: { width: 160, backgroundColor: '#fff', borderRadius: 16, padding: 16, marginLeft: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, borderWidth: 2, borderColor: '#dbeafe' },
  savedLocationName: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 8, height: 36 },
  savedLocationDate: { fontSize: 11, color: '#64748b', marginBottom: 8 },
  savedLocationFooter: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8 },
  savedLocationCoords: { fontSize: 10, color: '#3b82f6', fontWeight: '600' },
  
  // Photo Cards
  photoCard: { width: 140, height: 140, marginLeft: 20, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  photoImage: { width: '100%', height: '100%' },
  photoOverlay: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  photoNumber: { color: '#fff', fontSize: 12, fontWeight: '700' },
  
  // Transit Cards
  transitCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  transitIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  transitIconText: { fontSize: 24 },
  transitInfo: { flex: 1 },
  transitName: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  transitMeta: { flexDirection: 'row' },
  transitDistance: { fontSize: 12, color: '#64748b', marginRight: 12 },
  transitRating: { fontSize: 12, color: '#f59e0b', fontWeight: '600' },
  
  // History & Weather
  historyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  historyText: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  historyContext: { fontSize: 13, color: '#64748b', lineHeight: 20, fontStyle: 'italic' },
  weatherCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  weatherText: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  
  // Feedback
  feedbackButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  feedbackText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  suggestionBox: { marginTop: 12, padding: 16, backgroundColor: '#fffbeb', borderRadius: 16, borderWidth: 1, borderColor: '#fbbf24' },
  suggestionInput: { backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#fbbf24', fontSize: 14, color: '#0f172a', minHeight: 70, textAlignVertical: 'top', marginBottom: 12 },
  submitButton: { backgroundColor: '#3b82f6', padding: 14, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  
  // Error
  errorTitle: { fontSize: 24, fontWeight: '800', color: '#dc2626', marginBottom: 12 },
  errorText: { fontSize: 16, color: '#64748b', lineHeight: 24 },
  
  // Camera
  camera: { flex: 1 },
  cameraControls: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff', padding: 5 },
  captureInner: { flex: 1, borderRadius: 30, backgroundColor: '#3b82f6' },
});
