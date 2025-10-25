import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, StatusBar, Linking, Alert, SafeAreaView, Share, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [collections, setCollections] = useState<any[]>([]);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
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
    loadCollections();
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

  const loadCollections = async () => {
    try {
      const stored = await AsyncStorage.getItem('collections');
      if (stored) setCollections(JSON.parse(stored));
    } catch (error) {
      console.error('Load collections error:', error);
    }
  };

  const addToCollection = async (collectionId: string) => {
    if (!result?.location) return;

    try {
      const locationData = {
        name: result.name,
        address: result.address,
        latitude: result.location.latitude,
        longitude: result.location.longitude,
        savedAt: new Date().toISOString(),
        image: image,
        notes: notes || undefined,
      };

      const updated = collections.map(col => {
        if (col.id === collectionId) {
          return { ...col, locations: [...(col.locations || []), locationData] };
        }
        return col;
      });

      setCollections(updated);
      await AsyncStorage.setItem('collections', JSON.stringify(updated));
      setShowCollectionModal(false);
      Alert.alert('Added', 'Location added to collection');
    } catch (error) {
      console.error('Add to collection error:', error);
      Alert.alert('Error', 'Failed to add to collection');
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
        notes: notes || undefined,
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
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner</Text>
        {(image || result) && (
          <TouchableOpacity onPress={() => { setImage(null); setResult(null); setIsSaved(false); }} style={styles.clearButton}>
            <Ionicons name="close-circle" size={24} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!image && !result && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="camera-outline" size={48} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>Scan a location</Text>
            <Text style={styles.emptySubtitle}>Take a photo or choose from gallery to identify any location</Text>
          </View>
        )}

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.primaryAction} onPress={handleTakePhoto}>
            <Ionicons name="camera" size={20} color="#fff" style={styles.actionIconLeft} />
            <Text style={styles.primaryActionText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryAction} onPress={handlePickImage}>
            <Ionicons name="images" size={20} color="#000" style={styles.actionIconLeft} />
            <Text style={styles.secondaryActionText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>

        {image && (
          <View style={styles.imageSection}>
            <Image source={{ uri: image }} style={styles.selectedImage} />
            {!loading && !result && (
              <View style={styles.imageOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </View>
        )}

        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#000" />
            <Text style={styles.loadingText}>Analyzing...</Text>
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
                <View style={styles.locationCard}>
                  <View style={styles.locationHeader}>
                    <Ionicons name="location" size={24} color="#000" />
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationName}>{result.name || 'Location Found'}</Text>
                      {result.address && (
                        <Text style={styles.locationAddress}>{result.address}</Text>
                      )}
                    </View>
                  </View>

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
                  <View style={styles.actionsGrid}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => {
                        if (result.location) {
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${result.location.latitude},${result.location.longitude}`;
                          Linking.openURL(url);
                        }
                      }}
                    >
                      <Text style={styles.actionText}>Navigate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={handleSave}
                    >
                      <Text style={styles.actionText}>{isSaved ? 'Saved' : 'Save'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={async () => {
                        if (result.location) {
                          try {
                            await Share.share({
                              message: `${result.name || 'Location'}\n${result.address || ''}\nhttps://maps.google.com/?q=${result.location.latitude},${result.location.longitude}`
                            });
                          } catch (error) {
                            console.log('Share error:', error);
                          }
                        }
                      }}
                    >
                      <Text style={styles.actionText}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => {
                        if (result.location) {
                          const url = `https://www.google.com/maps/@${result.location.latitude},${result.location.longitude},18z`;
                          Linking.openURL(url);
                        }
                      }}
                    >
                      <Text style={styles.actionText}>Satellite</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity 
                    style={styles.notesButton}
                    onPress={() => setShowNotesModal(true)}
                  >
                    <Ionicons name="document-text-outline" size={20} color="#fff" />
                    <Text style={styles.notesButtonText}>Add Notes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.addCollectionButton}
                    onPress={() => setShowCollectionModal(true)}
                  >
                    <Ionicons name="folder-outline" size={20} color="#fff" />
                    <Text style={styles.addCollectionText}>Add to Collection</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.streetViewButton}
                    onPress={() => {
                      if (result.location) {
                        const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${result.location.latitude},${result.location.longitude}`;
                        Linking.openURL(url);
                      }
                    }}
                  >
                    <Text style={styles.streetViewText}>View Street View</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={showCollectionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add to Collection</Text>
              <TouchableOpacity onPress={() => setShowCollectionModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {collections.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={styles.modalEmptyText}>No collections yet</Text>
                <Text style={styles.modalEmptySubtext}>Create a collection first</Text>
              </View>
            ) : (
              <ScrollView style={styles.collectionList}>
                {collections.map((collection) => (
                  <TouchableOpacity
                    key={collection.id}
                    style={styles.collectionItem}
                    onPress={() => addToCollection(collection.id)}
                  >
                    <Ionicons name="folder" size={24} color="#6b7280" />
                    <View style={styles.collectionItemContent}>
                      <Text style={styles.collectionItemName}>{collection.name}</Text>
                      <Text style={styles.collectionItemCount}>{collection.locations?.length || 0} locations</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showNotesModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Notes</Text>
              <TouchableOpacity onPress={() => setShowNotesModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.notesInputGroup}>
              <Text style={styles.notesLabel}>Text Notes</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add notes about this location..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity 
              style={styles.saveNotesButton}
              onPress={() => {
                setShowNotesModal(false);
                if (notes.trim()) {
                  Alert.alert('Saved', 'Notes will be saved with location');
                }
              }}
            >
              <Text style={styles.saveNotesButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: '#fff' },
  backButton: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000', flex: 1 },
  clearButton: { padding: 4 },
  content: { flex: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#000', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
  actionSection: { padding: 20, gap: 12 },
  primaryAction: { backgroundColor: '#000', borderRadius: 12, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  primaryActionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryAction: { backgroundColor: '#fff', borderRadius: 12, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  secondaryActionText: { color: '#000', fontSize: 16, fontWeight: '600' },
  actionIconLeft: { marginRight: 8 },
  imageSection: { margin: 20, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  selectedImage: { width: '100%', height: 280, backgroundColor: '#f3f4f6' },
  imageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  loadingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 20, padding: 16, borderRadius: 12, gap: 12 },
  loadingText: { fontSize: 15, color: '#000', fontWeight: '600' },
  resultSection: { padding: 20 },
  errorCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#fecaca' },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#dc2626', marginBottom: 8 },
  errorText: { fontSize: 16, color: '#6b7280' },
  locationCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  locationHeader: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  locationInfo: { flex: 1 },
  locationName: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 6 },
  locationAddress: { fontSize: 15, color: '#6b7280', lineHeight: 22 },
  confidenceSection: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, marginTop: 16 },
  confidenceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  confidenceLabel: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  confidenceValue: { fontSize: 16, fontWeight: '700', color: '#000000' },
  confidenceBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  confidenceFill: { height: '100%', backgroundColor: '#000000', borderRadius: 3 },
  detailsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  coordinatesBox: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  coordinatesText: { fontSize: 15, fontWeight: '600', color: '#000000', fontFamily: 'monospace' },
  infoBox: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 8 },
  infoLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#000000' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  detailLabel: { fontSize: 14, color: '#6b7280' },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#000000', flex: 1, textAlign: 'right' },
  nearbySection: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 },
  nearbyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  nearbyBadge: { backgroundColor: '#000000', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  nearbyBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  nearbyScroll: { },
  nearbyCard: { width: 140, backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, marginRight: 12 },
  nearbyName: { fontSize: 14, fontWeight: '600', color: '#000000', marginBottom: 4, height: 36 },
  nearbyType: { fontSize: 12, color: '#6b7280', marginBottom: 8, textTransform: 'capitalize' },
  nearbyDistance: { fontSize: 12, color: '#000000', fontWeight: '500' },
  environmentCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 },
  environmentGrid: { flexDirection: 'row', gap: 12 },
  environmentBox: { flex: 1, backgroundColor: '#f0f9ff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#bfdbfe' },
  environmentLabel: { fontSize: 12, fontWeight: '600', color: '#1e40af', marginBottom: 8 },
  environmentValue: { fontSize: 20, fontWeight: '700', color: '#1e3a8a', marginBottom: 4 },
  environmentSubtext: { fontSize: 11, color: '#3b82f6' },
  actionsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 80 },
  actionsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  actionButton: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 10, padding: 14, alignItems: 'center' },
  actionText: { fontSize: 13, fontWeight: '600', color: '#000000' },
  notesButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#8b5cf6', borderRadius: 12, padding: 16, gap: 8, marginTop: 4 },
  notesButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  addCollectionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6b7280', borderRadius: 12, padding: 16, gap: 8, marginTop: 8 },
  addCollectionText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  streetViewButton: { backgroundColor: '#000', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8 },
  streetViewText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  modalEmpty: { paddingVertical: 40, alignItems: 'center' },
  modalEmptyText: { fontSize: 16, fontWeight: '600', color: '#6b7280', marginBottom: 4 },
  modalEmptySubtext: { fontSize: 14, color: '#9ca3af' },
  collectionList: { maxHeight: 400 },
  collectionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 12, marginBottom: 8, gap: 12 },
  collectionItemContent: { flex: 1 },
  collectionItemName: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 2 },
  collectionItemCount: { fontSize: 13, color: '#6b7280' },
  notesInputGroup: { marginBottom: 20 },
  notesLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  notesInput: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, fontSize: 15, color: '#000', borderWidth: 1, borderColor: '#e5e7eb', minHeight: 120 },
  saveNotesButton: { backgroundColor: '#000', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8 },
  saveNotesButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  camera: { flex: 1 },
  cameraContainer: { flex: 1 },
  cameraHeader: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  cameraClose: { alignSelf: 'flex-start' },
  cameraCloseText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  cameraControls: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 60 },
  captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffffff', padding: 6 },
  captureInner: { flex: 1, borderRadius: 34, backgroundColor: '#000000' },
});
