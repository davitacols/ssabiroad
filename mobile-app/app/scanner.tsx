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
import LocationPermissionDisclosure from '../components/LocationPermissionDisclosure';
import { getMlApiUrl, API_CONFIG } from '../config/api';
import { useTheme, getColors } from '../contexts/ThemeContext';
import MenuBar from '../components/MenuBar';
import ShareHandler from '../components/ShareHandler';

export default function ScannerScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = getColors(theme);
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
  const [weather, setWeather] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [placeDetails, setPlaceDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [distance, setDistance] = useState<number | null>(null);
  const [elevation, setElevation] = useState<number | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [trainingModel, setTrainingModel] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctedAddress, setCorrectedAddress] = useState('');
  const cameraRef = useRef<any>(null);

  const [showDisclosure, setShowDisclosure] = useState(false);
  const [disclosureShown, setDisclosureShown] = useState(false);

  // Handle shared images
  useEffect(() => {
    let handled = false;
    const handleSharedImage = async () => {
      if (handled) return;
      handled = true;
      const url = await Linking.getInitialURL();
      if (url && url.startsWith('content://')) {
        setImage(url);
        await processImage(url);
      }
    };
    handleSharedImage();
  }, []);

  useEffect(() => {
    checkDisclosureStatus();
  }, []);

  const checkDisclosureStatus = async () => {
    try {
      await AsyncStorage.removeItem('locationDisclosureShown'); // Force show disclosure
      const shown = await AsyncStorage.getItem('locationDisclosureShown');
      setDisclosureShown(shown === 'true');
    } catch (error) {
      console.log('Check disclosure error:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      if (!disclosureShown) {
        setShowDisclosure(true);
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location.coords);
      }
    } catch (error) {
      console.log('Location error:', error);
    }
  };

  const handleAcceptDisclosure = async () => {
    try {
      await AsyncStorage.setItem('locationDisclosureShown', 'true');
      setDisclosureShown(true);
      setShowDisclosure(false);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location.coords);
      }
    } catch (error) {
      console.log('Accept disclosure error:', error);
    }
  };

  const handleDeclineDisclosure = () => {
    setShowDisclosure(false);
    Alert.alert('Location Required', 'Location permission is needed to analyze photos and identify locations.');
  };

  const trainModel = async () => {
    if (!result?.location || !image) return;
    
    setTrainingModel(true);
    try {
      console.log('Training model with:', { lat: result.location.latitude, lng: result.location.longitude, address: result.address || result.name });
      
      const formData = new FormData();
      formData.append('file', {
        uri: image,
        type: 'image/jpeg',
        name: 'location.jpg',
      } as any);
      formData.append('latitude', result.location.latitude.toString());
      formData.append('longitude', result.location.longitude.toString());
      formData.append('address', result.address || result.name || 'Unknown');
      formData.append('userId', 'mobile-app');

      console.log('Sending to feedback API...');
      const response = await fetch('https://ssabiroad.vercel.app/api/location-recognition-v2/feedback', {
        method: 'POST',
        body: formData,
      });

      console.log('Feedback response status:', response.status);
      const data = await response.json();
      console.log('Feedback response data:', data);
      
      if (response.ok && data.success) {
        Alert.alert(
          '✓ Success',
          'Thank you for helping improve our AI! Your contribution makes location recognition more accurate for everyone.',
          [{ text: 'Done', style: 'default' }]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to submit');
      }
    } catch (error: any) {
      console.error('Training error:', error);
      Alert.alert('Error', `Network error: ${error.message}`);
    } finally {
      setTrainingModel(false);
    }
  };

  const handleCorrection = async () => {
    if (!correctedAddress.trim() || !image) return;
    
    setTrainingModel(true);
    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(correctedAddress)}&key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho`;
      const geocodeRes = await fetch(geocodeUrl);
      const geocodeData = await geocodeRes.json();
      
      if (!geocodeData.results?.[0]) {
        Alert.alert('Invalid Address', 'Could not find coordinates for this address');
        setTrainingModel(false);
        return;
      }
      
      const location = geocodeData.results[0].geometry.location;
      
      const formData = new FormData();
      formData.append('file', {
        uri: image,
        type: 'image/jpeg',
        name: 'location.jpg',
      } as any);
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lng.toString());
      formData.append('address', correctedAddress);
      formData.append('userId', 'mobile-app');

      const response = await fetch('https://ssabiroad.vercel.app/api/location-recognition-v2/feedback', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.success) {
        Alert.alert(
          '✓ Success',
          'Thank you for the correction! Our AI will learn from this and become more accurate.',
          [{ text: 'Done', style: 'default' }]
        );
        setShowCorrectionModal(false);
        setCorrectedAddress('');
      } else {
        Alert.alert('Error', data.error || 'Failed to submit');
      }
    } catch (error: any) {
      console.error('Correction error:', error);
      Alert.alert('Error', `Network error: ${error.message}`);
    } finally {
      setTrainingModel(false);
    }
  };

  const saveToHistory = async (data: any, imageUri: string) => {
    try {
      const history = await AsyncStorage.getItem('locationHistory');
      const parsed = history ? JSON.parse(history) : [];
      
      const newEntry = {
        id: Date.now().toString(),
        name: data.name || 'Unknown Location',
        address: data.address || '',
        image: imageUri,
        timestamp: Date.now(),
        viewed: false,
        location: data.location,
      };
      
      const updated = [newEntry, ...parsed].slice(0, 50);
      await AsyncStorage.setItem('locationHistory', JSON.stringify(updated));
      
      // Stories are private by default - users must manually share
    } catch (error) {
      console.error('Save history error:', error);
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
      const saved = await AsyncStorage.getItem('savedLocations');
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

  const fetchWeather = async (lat: number, lon: number) => {
    setLoadingWeather(true);
    try {
      const response = await fetch(`https://ssabiroad.vercel.app/api/weather?lat=${lat}&lon=${lon}`);
      const data = await response.json();
      if (!data.error) {
        setWeather(data);
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
    } finally {
      setLoadingWeather(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchPlaceDetails = async (lat: number, lon: number, name: string) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=50&keyword=${encodeURIComponent(name)}&key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho`);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const placeId = data.results[0].place_id;
        const detailsResponse = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews,photos,opening_hours,formatted_phone_number,website,price_level,types&key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho`);
        const detailsData = await detailsResponse.json();
        if (detailsData.result) {
          setPlaceDetails(detailsData.result);
        }
      }

      // Calculate distance from current location
      if (currentLocation) {
        const dist = calculateDistance(currentLocation.latitude, currentLocation.longitude, lat, lon);
        setDistance(dist);
      }

      // Fetch elevation data
      const elevResponse = await fetch(`https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lon}&key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho`);
      const elevData = await elevResponse.json();
      if (elevData.results && elevData.results.length > 0) {
        setElevation(Math.round(elevData.results[0].elevation));
      }
    } catch (error) {
      console.error('Place details fetch error:', error);
    } finally {
      setLoadingDetails(false);
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
      await AsyncStorage.setItem('savedLocations', JSON.stringify(updated));
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
      // Use system file picker (no READ_MEDIA_IMAGES needed)
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImage(asset.uri);
        await addActivity('Image Selected', 'Chose image from files', '/scanner');
        await processImage(asset.uri);
      }
    } catch (error: any) {
      console.error('File picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const processImage = async (uri: string, exif?: any) => {
    setLoading(true);
    try {
      // Don't send device location - let API extract GPS from image EXIF first
      const data = await analyzeLocation(uri, null);
      
      // Check if API returned an error or no location data
      if (!data.success || data.error) {
        const errorMsg = typeof data.error === 'string' ? data.error : 
                        data.error?.message || 
                        'No GPS data found in image. Please use a photo with location data or take a new photo with location services enabled.';
        setResult({ error: errorMsg });
        return;
      }
      
      setResult(data);
      
      if (data && data.location) {
        const locationName = data.name || data.address || 'Unknown location';
        await addActivity('Location Analyzed', `Found: ${locationName}`, '/scanner');
        
        // Save to location history for stories
        await saveToHistory(data, uri);
        
        // Fetch weather and place details if location found
        fetchWeather(data.location.latitude, data.location.longitude);
        if (data.name) {
          fetchPlaceDetails(data.location.latitude, data.location.longitude, data.name);
        }
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
      } else if (error.message) {
        errorMsg = typeof error.message === 'string' ? error.message : 'Failed to analyze image';
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
      let location = currentLocation;
      if (!location) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          location = loc.coords;
          setCurrentLocation(location);
        }
      }

      const photo = await camera.takePictureAsync({
        quality: 0.5,
        base64: false,
        exif: true,
      });
      
      if (photo && photo.uri) {
        setShowCamera(false);
        setImage(photo.uri);
        await addActivity('Photo Captured', 'Took photo with location', '/scanner');
        
        if (location) {
          await processImageWithLocation(photo.uri, location);
        } else {
          await processImage(photo.uri, photo.exif);
        }
      } else {
        throw new Error('No photo captured');
      }
    } catch (error) {
      console.error('Take picture error:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      setShowCamera(false);
    }
  };

  const processImageWithLocation = async (uri: string, location: { latitude: number; longitude: number }) => {
    setLoading(true);
    try {
      const data = await analyzeLocation(uri, location);
      
      if (!data.success || data.error) {
        setResult({ 
          error: data.error || 'Failed to analyze location' 
        });
        return;
      }
      
      setResult(data);
      
      if (data && data.location) {
        const locationName = data.name || data.address || 'Unknown location';
        await addActivity('Location Analyzed', `Found: ${locationName}`, '/scanner');
        
        // Save to location history for stories
        await saveToHistory(data, uri);
        
        fetchWeather(data.location.latitude, data.location.longitude);
        if (data.name) {
          fetchPlaceDetails(data.location.latitude, data.location.longitude, data.name);
        }
      }
    } catch (error: any) {
      console.error('Processing error:', error);
      setResult({ error: 'Failed to analyze image' });
    } finally {
      setLoading(false);
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Photo Scanner</Text>
          {(image || result) && (
            <TouchableOpacity onPress={() => { setImage(null); setResult(null); setIsSaved(false); }} style={styles.clearButton}>
              <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          {!image && !result && <View style={{ width: 24 }} />}
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!image && !result && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="camera-outline" size={48} color="#6b7280" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Scan a location</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Take a photo or choose from gallery to identify any location</Text>
          </View>
        )}

        <View style={styles.actionSection}>
          <TouchableOpacity style={[styles.primaryAction, { backgroundColor: theme === 'dark' ? '#fff' : '#000' }]} onPress={handleTakePhoto}>
            <Ionicons name="camera" size={20} color={theme === 'dark' ? '#000' : '#fff'} style={styles.actionIconLeft} />
            <Text style={[styles.primaryActionText, { color: theme === 'dark' ? '#000' : '#fff' }]}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.secondaryAction, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handlePickImage}>
            <Ionicons name="images" size={20} color={colors.text} style={styles.actionIconLeft} />
            <Text style={[styles.secondaryActionText, { color: colors.text }]}>Choose from Gallery</Text>
          </TouchableOpacity>

          <View style={[styles.shareHint, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="share" size={16} color={colors.textSecondary} />
            <Text style={[styles.shareHintText, { color: colors.textSecondary }]}>Or share photos to Pic2Nav from Gallery app</Text>
          </View>
        </View>

        {image && (
          <View style={styles.imageSection}>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setShowImageModal(true)}
            >
              <Image source={{ uri: image }} style={[styles.selectedImage, { backgroundColor: colors.card }]} />
              {loading && (
                <View style={styles.imageOverlay}>
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingOverlayText}>Analyzing location...</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {loading && (
          <View style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator size="small" color={colors.text} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Analyzing...</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultSection}>
            {result.error ? (
              <View style={[styles.errorCard, { backgroundColor: colors.card }]}>
                <Ionicons name="alert-circle" size={48} color="#ef4444" style={styles.errorIcon} />
                <Text style={styles.errorTitle}>{result.error}</Text>
                {result.helpText ? (
                  <Text style={[styles.errorText, { color: colors.textSecondary }]}>{result.helpText}</Text>
                ) : (
                  <Text style={[styles.errorText, { color: colors.textSecondary }]}>{result.error}</Text>
                )}
                <View style={styles.errorTips}>
                  <Text style={styles.errorTipsTitle}>Quick Fix:</Text>
                  <Text style={styles.errorTip}>• Use camera instead of gallery</Text>
                  <Text style={styles.errorTip}>• Take photo with location services on</Text>
                  <Text style={styles.errorTip}>• Look for clear business signs or addresses</Text>
                </View>
              </View>
            ) : (
              <>
                {/* Main Location Card */}
                <View style={[styles.locationCard, { backgroundColor: colors.card }]}>
                  <View style={styles.locationHeader}>
                    <View style={[styles.locationIconContainer, { backgroundColor: theme === 'dark' ? '#fff' : '#000' }]}>
                      <Ionicons name="location" size={28} color={theme === 'dark' ? '#000' : '#fff'} />
                    </View>
                    <View style={styles.locationInfo}>
                      <Text style={[styles.locationName, { color: colors.text }]}>{result.name || 'Location Found'}</Text>
                      {result.address && (
                        <Text style={[styles.locationAddress, { color: colors.textSecondary }]} numberOfLines={2}>{result.address}</Text>
                      )}
                    </View>
                  </View>

                  {result.confidence && (
                    <View style={[styles.confidenceSection, { backgroundColor: colors.background }]}>
                      <View style={styles.confidenceHeader}>
                        <Text style={[styles.confidenceLabel, { color: colors.textSecondary }]}>Confidence</Text>
                        <Text style={[styles.confidenceValue, { color: colors.text }]}>{Math.round(result.confidence * 100)}%</Text>
                      </View>
                      <View style={[styles.confidenceBar, { backgroundColor: colors.border }]}>
                        <View style={[styles.confidenceFill, { width: `${result.confidence * 100}%`, backgroundColor: theme === 'dark' ? '#fff' : '#000' }]} />
                      </View>
                    </View>
                  )}
                </View>

                {/* Quick Actions */}
                <View style={[styles.quickActionsCard, { backgroundColor: colors.card }]}>
                  <View style={styles.quickActionsGrid}>
                    <TouchableOpacity 
                      style={[styles.quickActionButton, { backgroundColor: colors.background }]}
                      onPress={() => {
                        if (result.location) {
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${result.location.latitude},${result.location.longitude}`;
                          Linking.openURL(url);
                        }
                      }}
                    >
                      <Ionicons name="navigate" size={24} color={colors.text} />
                      <Text style={[styles.quickActionText, { color: colors.text }]}>Navigate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.quickActionButton, { backgroundColor: isSaved ? (theme === 'dark' ? '#fff' : '#000') : colors.background }]}
                      onPress={handleSave}
                    >
                      <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isSaved ? (theme === 'dark' ? '#000' : '#fff') : colors.text} />
                      <Text style={[styles.quickActionText, { color: isSaved ? (theme === 'dark' ? '#000' : '#fff') : colors.text }]}>{isSaved ? 'Saved' : 'Save'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.quickActionButton, { backgroundColor: colors.background }]}
                      onPress={() => {
                        if (result.location) {
                          router.push({
                            pathname: '/share-location',
                            params: { location: JSON.stringify({ ...result, image }) }
                          });
                        }
                      }}
                    >
                      <Ionicons name="share-social" size={24} color={colors.text} />
                      <Text style={[styles.quickActionText, { color: colors.text }]}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.quickActionButton, { backgroundColor: colors.background }]}
                      onPress={() => {
                        if (result.location) {
                          const url = `https://www.google.com/maps/@${result.location.latitude},${result.location.longitude},18z`;
                          Linking.openURL(url);
                        }
                      }}
                    >
                      <Ionicons name="map" size={24} color={colors.text} />
                      <Text style={[styles.quickActionText, { color: colors.text }]}>Map</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Location Details */}
                {result.location && (
                  <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.cardTitle, { color: colors.textTertiary }]}>LOCATION DETAILS</Text>
                    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                      <View style={styles.detailLeft}>
                        <Ionicons name="navigate-outline" size={18} color={colors.textSecondary} />
                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Coordinates</Text>
                      </View>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {result.location.latitude.toFixed(6)}, {result.location.longitude.toFixed(6)}
                      </Text>
                    </View>
                    {distance !== null && (
                      <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.detailLeft}>
                          <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Distance</Text>
                        </View>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                          {distance < 1 ? `${(distance * 1000).toFixed(0)} m` : `${distance.toFixed(2)} km`}
                        </Text>
                      </View>
                    )}
                    {elevation !== null && (
                      <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.detailLeft}>
                          <Ionicons name="trending-up-outline" size={18} color={colors.textSecondary} />
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Elevation</Text>
                        </View>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{elevation}m</Text>
                      </View>
                    )}
                    {result.method && (
                      <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.detailLeft}>
                          <Ionicons name="analytics-outline" size={18} color={colors.textSecondary} />
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Method</Text>
                        </View>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{result.method.replace(/-/g, ' ')}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* ML Training Card */}
                <View style={[styles.mlTrainingCard, { backgroundColor: colors.card }]}>
                  <View style={styles.mlTrainingHeader}>
                    <Ionicons name="school" size={24} color={colors.text} />
                    <Text style={[styles.mlTrainingTitle, { color: colors.text }]}>Help Improve AI</Text>
                  </View>
                  <Text style={[styles.mlTrainingDesc, { color: colors.textSecondary }]}>Your feedback helps train our AI to be more accurate</Text>
                  <View style={styles.mlTrainingButtons}>
                    <TouchableOpacity 
                      style={[styles.mlTrainingButton, { backgroundColor: colors.background }]}
                      onPress={() => setShowCorrectionModal(true)}
                    >
                      <Ionicons name="flag-outline" size={18} color="#ef4444" />
                      <Text style={[styles.mlTrainingButtonText, { color: colors.text }]}>Report</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.mlTrainingButton, { backgroundColor: theme === 'dark' ? '#fff' : '#000' }]}
                      onPress={trainModel}
                      disabled={trainingModel}
                    >
                      {trainingModel ? (
                        <ActivityIndicator size="small" color={theme === 'dark' ? '#000' : '#fff'} />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={18} color={theme === 'dark' ? '#000' : '#fff'} />
                          <Text style={[styles.mlTrainingButtonTextWhite, { color: theme === 'dark' ? '#000' : '#fff' }]}>Confirm</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

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
                        <TouchableOpacity 
                          key={idx} 
                          style={styles.nearbyCard} 
                          onPress={() => {
                            if (place.photoReference) {
                              setSelectedImageIndex(idx);
                              setShowImageModal(true);
                            } else if (place.location) {
                              Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}`);
                            }
                          }}
                        >
                          {place.photoReference && (
                            <View>
                              <Image 
                                source={{ uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference=${place.photoReference}&key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho` }}
                                style={styles.nearbyImage}
                              />
                              <View style={styles.nearbyPhotoAttribution}>
                                <Text style={styles.nearbyPhotoAttributionText}>Google</Text>
                              </View>
                            </View>
                          )}
                          <Text style={styles.nearbyName} numberOfLines={2}>{place.name || 'Place'}</Text>
                          <Text style={styles.nearbyType}>{place.type || 'Location'}</Text>
                          {place.distance !== undefined && place.distance !== null && (
                            <Text style={styles.nearbyDistance}>
                              {place.distance < 1000 ? `${place.distance}m` : `${(place.distance / 1000).toFixed(1)}km`} away
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TouchableOpacity onPress={() => Linking.openURL('https://www.google.com/intl/en/help/terms_maps/')} style={styles.termsLink}>
                      <Text style={styles.termsLinkText}>Google Maps Terms of Service</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {placeDetails && (
                  <View style={styles.placeDetailsCard}>
                    <View style={styles.googleAttribution}>
                      <Text style={styles.googleAttributionText}>Powered by Google</Text>
                    </View>
                    {placeDetails.rating && (
                      <View style={styles.ratingSection}>
                        <View style={styles.ratingHeader}>
                          <Ionicons name="star" size={24} color="#fbbf24" />
                          <Text style={styles.ratingValue}>{placeDetails.rating.toFixed(1)}</Text>
                          {placeDetails.reviews && (
                            <Text style={styles.ratingCount}>({placeDetails.reviews.length} reviews)</Text>
                          )}
                        </View>
                      </View>
                    )}

                    {placeDetails.opening_hours && (
                      <View style={styles.hoursSection}>
                        <View style={styles.hoursHeader}>
                          <Ionicons name="time-outline" size={20} color="#6b7280" />
                          <Text style={styles.hoursStatus}>
                            {placeDetails.opening_hours.open_now ? 'Open Now' : 'Closed'}
                          </Text>
                        </View>
                        {placeDetails.opening_hours.weekday_text && (
                          <View style={styles.hoursDetails}>
                            {placeDetails.opening_hours.weekday_text.slice(0, 3).map((day: string, idx: number) => (
                              <Text key={idx} style={styles.hoursText}>{day}</Text>
                            ))}
                          </View>
                        )}
                      </View>
                    )}

                    {placeDetails.formatted_phone_number && (
                      <TouchableOpacity 
                        style={styles.contactRow}
                        onPress={() => Linking.openURL(`tel:${placeDetails.formatted_phone_number}`)}
                      >
                        <Ionicons name="call-outline" size={20} color="#6b7280" />
                        <Text style={styles.contactText}>{placeDetails.formatted_phone_number}</Text>
                      </TouchableOpacity>
                    )}

                    {placeDetails.website && (
                      <TouchableOpacity 
                        style={styles.contactRow}
                        onPress={() => Linking.openURL(placeDetails.website)}
                      >
                        <Ionicons name="globe-outline" size={20} color="#6b7280" />
                        <Text style={styles.contactText} numberOfLines={1}>Visit Website</Text>
                      </TouchableOpacity>
                    )}

                    {placeDetails.photos && placeDetails.photos.length > 0 && (
                      <View style={styles.photosSection}>
                        <Text style={styles.cardTitle}>Photos</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {placeDetails.photos.slice(0, 5).map((photo: any, idx: number) => (
                            <TouchableOpacity 
                              key={idx}
                              onPress={() => {
                                setSelectedImageIndex(idx);
                                setShowImageModal(true);
                              }}
                            >
                              <View>
                                <Image 
                                  source={{ uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho` }}
                                  style={styles.placePhoto}
                                />
                                <View style={styles.photoAttribution}>
                                  <Text style={styles.photoAttributionText}>Google</Text>
                                </View>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {placeDetails.reviews && placeDetails.reviews.length > 0 && (
                      <View style={styles.reviewsSection}>
                        <Text style={styles.cardTitle}>Reviews</Text>
                        {placeDetails.reviews.slice(0, 3).map((review: any, idx: number) => (
                          <View key={idx} style={styles.reviewCard}>
                            <View style={styles.reviewHeader}>
                              <Text style={styles.reviewAuthor}>{review.author_name}</Text>
                              <View style={styles.reviewRating}>
                                <Ionicons name="star" size={14} color="#fbbf24" />
                                <Text style={styles.reviewRatingText}>{review.rating}</Text>
                              </View>
                            </View>
                            <Text style={styles.reviewText} numberOfLines={3}>{review.text}</Text>
                            <Text style={styles.reviewTime}>{review.relative_time_description}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Quick Insights Toggle */}
                <View style={styles.insightsToggleCard}>
                  <TouchableOpacity 
                    style={styles.insightsToggle}
                    onPress={() => setShowInsights(!showInsights)}
                  >
                    <View style={styles.insightsToggleLeft}>
                      <Ionicons name="analytics" size={20} color="#3b82f6" />
                      <Text style={styles.insightsToggleText}>Location Insights</Text>
                    </View>
                    <Ionicons name={showInsights ? "chevron-up" : "chevron-down"} size={20} color="#6b7280" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.insightsToggle}
                    onPress={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
                  >
                    <View style={styles.insightsToggleLeft}>
                      <Ionicons name="document-text" size={20} color="#8b5cf6" />
                      <Text style={styles.insightsToggleText}>Detailed Analysis</Text>
                    </View>
                    <Ionicons name={showDetailedAnalysis ? "chevron-up" : "chevron-down"} size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                {weather && (
                  <View style={styles.weatherCard}>
                    <Text style={styles.cardTitle}>Weather Forecast</Text>
                    <View style={styles.currentWeather}>
                      <Text style={styles.currentTemp}>{weather.current.temp}°C</Text>
                      <Text style={styles.currentDesc}>{weather.current.description}</Text>
                      <View style={styles.weatherDetails}>
                        <Text style={styles.weatherDetail}>Feels like {weather.current.feelsLike}°C</Text>
                        <Text style={styles.weatherDetail}>Humidity {weather.current.humidity}%</Text>
                        <Text style={styles.weatherDetail}>Wind {weather.current.windSpeed} km/h</Text>
                      </View>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
                      {weather.forecast.map((day: any, idx: number) => (
                        <View key={idx} style={styles.forecastDay}>
                          <Text style={styles.forecastDate}>{day.date}</Text>
                          <Text style={styles.forecastTemp}>{day.temp}°C</Text>
                          <Text style={styles.forecastDesc}>{day.description}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={[styles.actionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={styles.cardTitle}>Quick Actions</Text>
                  <View style={styles.actionsGrid}>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => {
                        if (result.location) {
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${result.location.latitude},${result.location.longitude}`;
                          Linking.openURL(url);
                        }
                      }}
                    >
                      <Ionicons name="navigate" size={18} color={colors.text} />
                      <Text style={[styles.actionText, { color: colors.text }]}>Navigate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: isSaved ? (theme === 'dark' ? '#fff' : '#000') : colors.background, borderColor: isSaved ? (theme === 'dark' ? '#fff' : '#000') : colors.border }]}
                      onPress={handleSave}
                    >
                      <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={18} color={isSaved ? (theme === 'dark' ? '#000' : '#fff') : colors.text} />
                      <Text style={[styles.actionText, { color: isSaved ? (theme === 'dark' ? '#000' : '#fff') : colors.text }]}>{isSaved ? 'Saved' : 'Save'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => {
                        if (result.location) {
                          router.push({
                            pathname: '/share-location',
                            params: { location: JSON.stringify({ ...result, image }) }
                          });
                        }
                      }}
                    >
                      <Ionicons name="share-social" size={18} color={colors.text} />
                      <Text style={[styles.actionText, { color: colors.text }]}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => {
                        if (result.location) {
                          const url = `https://www.google.com/maps/@${result.location.latitude},${result.location.longitude},18z`;
                          Linking.openURL(url);
                        }
                      }}
                    >
                      <Ionicons name="globe" size={18} color={colors.text} />
                      <Text style={[styles.actionText, { color: colors.text }]}>Satellite</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.shareOptionsGrid}>
                    <TouchableOpacity 
                      style={styles.shareOption}
                      onPress={async () => {
                        if (result.location) {
                          const message = `Check out this location: ${result.name || 'Location'}\nhttps://maps.google.com/?q=${result.location.latitude},${result.location.longitude}`;
                          Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
                        }
                      }}
                    >
                      <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                      <Text style={styles.shareOptionText}>WhatsApp</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.shareOption}
                      onPress={async () => {
                        if (result.location) {
                          const message = `Check out this location: ${result.name || 'Location'}\nhttps://maps.google.com/?q=${result.location.latitude},${result.location.longitude}`;
                          Linking.openURL(`sms:?body=${encodeURIComponent(message)}`);
                        }
                      }}
                    >
                      <Ionicons name="chatbubble" size={20} color="#000" />
                      <Text style={styles.shareOptionText}>Message</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.shareOption}
                      onPress={async () => {
                        if (result.location) {
                          const subject = encodeURIComponent(result.name || 'Location');
                          const body = encodeURIComponent(`${result.address || ''}\n\nhttps://maps.google.com/?q=${result.location.latitude},${result.location.longitude}`);
                          Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
                        }
                      }}
                    >
                      <Ionicons name="mail" size={20} color="#000" />
                      <Text style={styles.shareOptionText}>Email</Text>
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
                  <TouchableOpacity 
                    style={styles.trainButton}
                    onPress={() => router.push('/contribute')}
                  >
                    <Ionicons name="school-outline" size={20} color="#fff" />
                    <Text style={styles.trainButtonText}>Help Train AI</Text>
                  </TouchableOpacity>
                </View>

                {/* Analysis Summary Card */}
                {showInsights && (
                  <View style={styles.analysisSummaryCard}>
                    <Text style={styles.cardTitle}>Location Insights</Text>
                    {!result.enhancedAnalysis && (
                      <View style={styles.noDataCard}>
                        <Ionicons name="information-circle-outline" size={32} color="#9ca3af" />
                        <Text style={styles.noDataText}>Enhanced analysis not available for this location</Text>
                        <Text style={styles.noDataSubtext}>Basic location data is shown above</Text>
                      </View>
                    )}
                    {result.enhancedAnalysis && (
                    <View style={styles.summaryGrid}>
                      {result.enhancedAnalysis.safetyAnalysis && (
                        <View style={styles.summaryItem}>
                          <Text style={styles.summaryIcon}>🛡️</Text>
                          <Text style={styles.summaryLabel}>Safety</Text>
                          <Text style={[styles.summaryValue, { color: result.enhancedAnalysis.safetyAnalysis.crimeStatistics.overallSafety === 'very safe' ? '#10b981' : result.enhancedAnalysis.safetyAnalysis.crimeStatistics.overallSafety === 'safe' ? '#059669' : '#f59e0b' }]}>
                            {result.enhancedAnalysis.safetyAnalysis.crimeStatistics.overallSafety.charAt(0).toUpperCase() + result.enhancedAnalysis.safetyAnalysis.crimeStatistics.overallSafety.slice(1)}
                          </Text>
                        </View>
                      )}
                      {result.enhancedAnalysis.socialAnalysis && (
                        <View style={styles.summaryItem}>
                          <Text style={styles.summaryIcon}>🚶</Text>
                          <Text style={styles.summaryLabel}>Walkability</Text>
                          <Text style={[styles.summaryValue, { color: result.enhancedAnalysis.socialAnalysis.walkability.score > 70 ? '#10b981' : result.enhancedAnalysis.socialAnalysis.walkability.score > 50 ? '#f59e0b' : '#ef4444' }]}>
                            {result.enhancedAnalysis.socialAnalysis.walkability.score}/100
                          </Text>
                        </View>
                      )}
                      {result.enhancedAnalysis.environmentalAnalysis && (
                        <View style={styles.summaryItem}>
                          <Text style={styles.summaryIcon}>🌱</Text>
                          <Text style={styles.summaryLabel}>Air Quality</Text>
                          <Text style={[styles.summaryValue, { color: result.enhancedAnalysis.environmentalAnalysis.airQuality.index < 50 ? '#10b981' : result.enhancedAnalysis.environmentalAnalysis.airQuality.index < 100 ? '#f59e0b' : '#ef4444' }]}>
                            {result.enhancedAnalysis.environmentalAnalysis.airQuality.rating}
                          </Text>
                        </View>
                      )}
                      {result.enhancedAnalysis.accessibilityAnalysis && (
                        <View style={styles.summaryItem}>
                          <Text style={styles.summaryIcon}>♿</Text>
                          <Text style={styles.summaryLabel}>Accessible</Text>
                          <Text style={[styles.summaryValue, { color: result.enhancedAnalysis.accessibilityAnalysis.physicalAccess.wheelchairAccessible ? '#10b981' : '#ef4444' }]}>
                            {result.enhancedAnalysis.accessibilityAnalysis.physicalAccess.wheelchairAccessible ? 'Yes' : 'No'}
                          </Text>
                        </View>
                      )}
                    </View>
                    )}
                  </View>
                )}

                {/* Enhanced Analysis Section */}
                {showDetailedAnalysis && (
                  <View style={styles.enhancedAnalysisCard}>
                    <Text style={styles.cardTitle}>Detailed Analysis</Text>
                    
                    {!result.enhancedAnalysis && (
                      <View style={styles.noDataCard}>
                        <Ionicons name="document-text-outline" size={32} color="#9ca3af" />
                        <Text style={styles.noDataText}>Detailed analysis not available</Text>
                        <Text style={styles.noDataSubtext}>This feature requires enhanced location data from the API</Text>
                      </View>
                    )}
                    
                    {result.enhancedAnalysis && (
                    <>
                    {/* Architectural Analysis */}
                    {result.enhancedAnalysis.architecturalAnalysis && (
                      <View style={styles.analysisSection}>
                        <Text style={styles.analysisSectionTitle}>🏗️ Architecture</Text>
                        <View style={styles.analysisItem}>
                          <Text style={styles.analysisLabel}>Building Style:</Text>
                          <Text style={styles.analysisValue}>{result.enhancedAnalysis.architecturalAnalysis.buildingStyle}</Text>
                        </View>
                        <View style={styles.analysisItem}>
                          <Text style={styles.analysisLabel}>Construction Period:</Text>
                          <Text style={styles.analysisValue}>{result.enhancedAnalysis.architecturalAnalysis.constructionPeriod}</Text>
                        </View>
                        <View style={styles.analysisItem}>
                          <Text style={styles.analysisLabel}>Condition:</Text>
                          <Text style={[styles.analysisValue, { color: result.enhancedAnalysis.architecturalAnalysis.condition === 'excellent' ? '#10b981' : result.enhancedAnalysis.architecturalAnalysis.condition === 'good' ? '#059669' : '#f59e0b' }]}>
                            {result.enhancedAnalysis.architecturalAnalysis.condition.charAt(0).toUpperCase() + result.enhancedAnalysis.architecturalAnalysis.condition.slice(1)}
                          </Text>
                        </View>
                        {result.enhancedAnalysis.architecturalAnalysis.energyEfficiency && (
                          <View style={styles.analysisItem}>
                            <Text style={styles.analysisLabel}>Energy Rating:</Text>
                            <Text style={styles.analysisValue}>{result.enhancedAnalysis.architecturalAnalysis.energyEfficiency.rating}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Business Analysis */}
                    {result.enhancedAnalysis.businessAnalysis && (
                      <View style={styles.analysisSection}>
                        <Text style={styles.analysisSectionTitle}>🏢 Business</Text>
                        <View style={styles.analysisItem}>
                          <Text style={styles.analysisLabel}>Business Type:</Text>
                          <Text style={styles.analysisValue}>{result.enhancedAnalysis.businessAnalysis.businessType}</Text>
                        </View>
                        <View style={styles.analysisItem}>
                          <Text style={styles.analysisLabel}>Foot Traffic:</Text>
                          <Text style={[styles.analysisValue, { color: result.enhancedAnalysis.businessAnalysis.footTraffic === 'high' ? '#10b981' : result.enhancedAnalysis.businessAnalysis.footTraffic === 'medium' ? '#f59e0b' : '#ef4444' }]}>
                            {result.enhancedAnalysis.businessAnalysis.footTraffic.charAt(0).toUpperCase() + result.enhancedAnalysis.businessAnalysis.footTraffic.slice(1)}
                          </Text>
                        </View>
                        <View style={styles.analysisItem}>
                          <Text style={styles.analysisLabel}>Market Saturation:</Text>
                          <Text style={styles.analysisValue}>{result.enhancedAnalysis.businessAnalysis.competitorAnalysis?.marketSaturation || 'Unknown'}</Text>
                        </View>
                      </View>
                    )}

                    {/* Environmental Analysis */}
                    {result.enhancedAnalysis.environmentalAnalysis && (
                      <View style={styles.analysisSection}>
                        <Text style={styles.analysisSectionTitle}>🌱 Environment</Text>
                        <View style={styles.analysisItem}>
                          <Text style={styles.analysisLabel}>Air Quality:</Text>
                          <Text style={[styles.analysisValue, { color: result.enhancedAnalysis.environmentalAnalysis.airQuality.index < 50 ? '#10b981' : result.enhancedAnalysis.environmentalAnalysis.airQuality.index < 100 ? '#f59e0b' : '#ef4444' }]}>
                            {result.enhancedAnalysis.environmentalAnalysis.airQuality.rating} (AQI: {result.enhancedAnalysis.environmentalAnalysis.airQuality.index})
                          </Text>
                        </View>
                        <View style={styles.analysisItem}>
                          <Text style={styles.analysisLabel}>Noise Level:</Text>
                          <Text style={styles.analysisValue}>{result.enhancedAnalysis.environmentalAnalysis.noiseLevel.rating} ({result.enhancedAnalysis.environmentalAnalysis.noiseLevel.decibels}dB)</Text>
                        </View>
                        <View style={styles.analysisItem}>
                          <Text style={styles.analysisLabel}>Green Coverage:</Text>
                          <Text style={styles.analysisValue}>{result.enhancedAnalysis.environmentalAnalysis.greenSpaces.treeCanopyCoverage}% tree canopy</Text>
                        </View>
                      </View>
                    )}

                    {/* Safety Analysis */}
                    {result.enhancedAnalysis.safetyAnalysis && (
                      <View style={styles.analysisSection}>
                        <Text style={styles.analysisSectionTitle}>🛡️ Safety</Text>
                        <View style={styles.analysisItem}>
                          <Text style={styles.analysisLabel}>Overall Safety:</Text>
                          <Text style={[styles.analysisValue, { color: result.enhancedAnalysis.safetyAnalysis.crimeStatistics.overallSafety === 'very safe' ? '#10b981' : result.enhancedAnalysis.safetyAnalysis.crimeStatistics.overallSafety === 'safe' ? '#059669' : '#f59e0b' }]}>
                            {result.enhancedAnalysis.safetyAnalysis.crimeStatistics.overallSafety.charAt(0).toUpperCase() + result.enhancedAnalysis.safetyAnalysis.crimeStatistics.overallSafety.slice(1)}
                          </Text>
                        </View>
                        <View style={styles.analysisItem}>
                          <Text style={styles.analysisLabel}>Emergency Response:</Text>
                          <Text style={styles.analysisValue}>{result.enhancedAnalysis.safetyAnalysis.emergencyServices.responseTime}</Text>
                        </View>
                      </View>
                    )}

                    {/* Accessibility Analysis */}
                    {result.enhancedAnalysis.accessibilityAnalysis && (
                      <View style={styles.analysisSection}>
                        <Text style={styles.analysisSectionTitle}>♿ Accessibility</Text>
                        <View style={styles.analysisItem}>
                          <Text style={styles.analysisLabel}>Wheelchair Access:</Text>
                          <Text style={[styles.analysisValue, { color: result.enhancedAnalysis.accessibilityAnalysis.physicalAccess.wheelchairAccessible ? '#10b981' : '#ef4444' }]}>
                            {result.enhancedAnalysis.accessibilityAnalysis.physicalAccess.wheelchairAccessible ? 'Yes' : 'No'}
                          </Text>
                        </View>
                        <View style={styles.analysisItem}>
                          <Text style={styles.analysisLabel}>Public Transport:</Text>
                          <Text style={styles.analysisValue}>{result.enhancedAnalysis.accessibilityAnalysis.publicTransport.accessibility}</Text>
                        </View>
                      </View>
                    )}

                    {/* Economic Analysis */}
                    {result.enhancedAnalysis.economicAnalysis && (
                      <View style={styles.analysisSection}>
                        <Text style={styles.analysisSectionTitle}>💰 Economics</Text>
                        <View style={styles.analysisItem}>
                          <Text style={styles.analysisLabel}>Property Values:</Text>
                          <Text style={styles.analysisValue}>{result.enhancedAnalysis.economicAnalysis.propertyValues.priceRange}</Text>
                        </View>
                        <View style={styles.analysisItem}>
                          <Text style={styles.analysisLabel}>Market Trend:</Text>
                          <Text style={[styles.analysisValue, { color: result.enhancedAnalysis.economicAnalysis.propertyValues.trend === 'increasing' ? '#10b981' : result.enhancedAnalysis.economicAnalysis.propertyValues.trend === 'stable' ? '#f59e0b' : '#ef4444' }]}>
                            {result.enhancedAnalysis.economicAnalysis.propertyValues.trend.charAt(0).toUpperCase() + result.enhancedAnalysis.economicAnalysis.propertyValues.trend.slice(1)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Social Analysis */}
                    {result.enhancedAnalysis.socialAnalysis && (
                      <View style={styles.analysisSection}>
                        <Text style={styles.analysisSectionTitle}>👥 Community</Text>
                        <View style={styles.analysisItem}>
                          <Text style={styles.analysisLabel}>Walkability Score:</Text>
                          <Text style={[styles.analysisValue, { color: result.enhancedAnalysis.socialAnalysis.walkability.score > 70 ? '#10b981' : result.enhancedAnalysis.socialAnalysis.walkability.score > 50 ? '#f59e0b' : '#ef4444' }]}>
                            {result.enhancedAnalysis.socialAnalysis.walkability.score}/100
                          </Text>
                        </View>
                        <View style={styles.analysisItem}>
                          <Text style={styles.analysisLabel}>Community Features:</Text>
                          <Text style={styles.analysisValue}>{result.enhancedAnalysis.socialAnalysis.communityFeatures.slice(0, 2).join(', ')}</Text>
                        </View>
                      </View>
                    )}
                    </>
                    )}
                  </View>
                )}
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

      <Modal visible={showImageModal} transparent animationType="fade">
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity 
            style={styles.imageModalClose}
            onPress={() => setShowImageModal(false)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          {result?.nearbyPlaces?.[selectedImageIndex]?.photoReference ? (
            <Image 
              source={{ uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${result.nearbyPlaces[selectedImageIndex].photoReference}&key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho` }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          ) : placeDetails?.photos?.[selectedImageIndex] ? (
            <Image 
              source={{ uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${placeDetails.photos[selectedImageIndex]?.photo_reference}&key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho` }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          ) : null}
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

      <Modal visible={showCorrectionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Incorrect Location</Text>
              <TouchableOpacity onPress={() => { setShowCorrectionModal(false); setCorrectedAddress(''); }}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.notesInputGroup}>
              <Text style={styles.notesLabel}>Correct Address</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Enter the correct address..."
                value={correctedAddress}
                onChangeText={setCorrectedAddress}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Text style={styles.correctionHint}>This will help train our AI to be more accurate</Text>
            </View>

            <TouchableOpacity 
              style={[styles.saveNotesButton, { opacity: !correctedAddress.trim() || trainingModel ? 0.5 : 1 }]}
              onPress={handleCorrection}
              disabled={!correctedAddress.trim() || trainingModel}
            >
              {trainingModel ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.saveNotesButtonText}>Submit Correction</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <LocationPermissionDisclosure
        visible={showDisclosure}
        onAccept={handleAcceptDisclosure}
        onDecline={handleDeclineDisclosure}
      />
      <ShareHandler />
      <MenuBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 32 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 24, fontFamily: 'LeagueSpartan_700Bold', flex: 1, marginLeft: 8 },
  clearButton: { padding: 8 },
  content: { flex: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1 },
  emptyTitle: { fontSize: 24, fontFamily: 'LeagueSpartan_700Bold', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  actionSection: { padding: 20, gap: 12 },
  primaryAction: { borderRadius: 12, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryActionText: { fontSize: 16, fontFamily: 'LeagueSpartan_700Bold' },
  secondaryAction: { borderRadius: 12, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  secondaryActionText: { fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold' },
  actionIconLeft: { marginRight: 8 },
  imageSection: { margin: 20, borderRadius: 20, overflow: 'hidden', position: 'relative', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  selectedImage: { width: '100%', height: 320, borderRadius: 20 },
  imageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  loadingContainer: { alignItems: 'center', gap: 16 },
  loadingOverlayText: { color: '#fff', fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold' },
  loadingCard: { flexDirection: 'row', alignItems: 'center', margin: 20, padding: 16, borderRadius: 12, gap: 12, borderWidth: 1 },
  loadingText: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold' },
  resultSection: { padding: 20 },
  errorCard: { borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#7f1d1d', alignItems: 'center' },
  errorIcon: { marginBottom: 16 },
  errorTitle: { fontSize: 20, fontFamily: 'LeagueSpartan_700Bold', color: '#ef4444', marginBottom: 12, textAlign: 'center' },
  errorText: { fontSize: 15, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  errorTips: { backgroundColor: '#450a0a', borderRadius: 12, padding: 16, width: '100%', borderWidth: 1, borderColor: '#7f1d1d' },
  errorTipsTitle: { fontSize: 14, fontFamily: 'LeagueSpartan_700Bold', color: '#ef4444', marginBottom: 12 },
  errorTip: { fontSize: 13, color: '#d1d5db', marginBottom: 6, lineHeight: 20 },
  locationCard: { borderRadius: 20, padding: 24, marginBottom: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  locationHeader: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  locationIconContainer: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  locationInfo: { flex: 1 },
  locationName: { fontSize: 22, fontFamily: 'LeagueSpartan_700Bold', marginBottom: 8 },
  locationAddress: { fontSize: 15, lineHeight: 22 },
  confidenceSection: { borderRadius: 12, padding: 16, marginTop: 16 },
  confidenceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  confidenceLabel: { fontSize: 13, fontFamily: 'LeagueSpartan_600SemiBold' },
  confidenceValue: { fontSize: 16, fontFamily: 'LeagueSpartan_700Bold' },
  confidenceBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  confidenceFill: { height: '100%', borderRadius: 3 },
  detailsCard: { borderRadius: 20, padding: 20, marginBottom: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 13, fontFamily: 'LeagueSpartan_700Bold', color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  quickActionsCard: { borderRadius: 20, padding: 20, marginBottom: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  quickActionsGrid: { flexDirection: 'row', gap: 12 },
  quickActionButton: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8 },
  quickActionText: { fontSize: 12, fontFamily: 'LeagueSpartan_600SemiBold' },
  detailsCard: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1 },
  cardTitle: { fontSize: 11, fontFamily: 'LeagueSpartan_700Bold', marginBottom: 16, letterSpacing: 1 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 14, fontFamily: 'LeagueSpartan_400Regular' },
  detailValue: { fontSize: 14, fontFamily: 'LeagueSpartan_600SemiBold', flex: 1, textAlign: 'right' },
  mlTrainingCard: { borderRadius: 20, padding: 20, marginBottom: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  mlTrainingHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  mlTrainingTitle: { fontSize: 18, fontFamily: 'LeagueSpartan_700Bold' },
  mlTrainingDesc: { fontSize: 14, fontFamily: 'LeagueSpartan_400Regular', marginBottom: 16, lineHeight: 20 },
  mlTrainingButtons: { flexDirection: 'row', gap: 12 },
  mlTrainingButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12 },
  mlTrainingButtonText: { fontSize: 14, fontFamily: 'LeagueSpartan_600SemiBold' },
  mlTrainingButtonTextWhite: { fontSize: 14, fontFamily: 'LeagueSpartan_600SemiBold' },
  nearbySection: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  nearbyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  nearbyBadge: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  nearbyBadgeText: { color: '#000', fontSize: 12, fontFamily: 'LeagueSpartan_600SemiBold' },
  nearbyScroll: { },
  nearbyCard: { width: 140, backgroundColor: '#000', borderRadius: 12, padding: 12, marginRight: 12, borderWidth: 1, borderColor: '#333' },
  nearbyImage: { width: '100%', height: 80, borderRadius: 8, marginBottom: 8, backgroundColor: '#e5e7eb' },
  nearbyName: { fontSize: 14, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fff', marginBottom: 4, height: 36 },
  nearbyType: { fontSize: 12, color: '#9ca3af', marginBottom: 8, textTransform: 'capitalize' },
  nearbyDistance: { fontSize: 12, color: '#fff', fontFamily: 'LeagueSpartan_600SemiBold' },
  googleAttribution: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, alignSelf: 'flex-start', marginBottom: 16 },
  googleAttributionText: { fontSize: 11, fontFamily: 'LeagueSpartan_600SemiBold', color: '#a3a3a3' },
  photoAttribution: { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  photoAttributionText: { fontSize: 9, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fff' },
  nearbyPhotoAttribution: { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 3 },
  nearbyPhotoAttributionText: { fontSize: 8, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fff' },
  termsLink: { marginTop: 12, paddingVertical: 8 },
  termsLinkText: { fontSize: 11, fontFamily: 'LeagueSpartan_400Regular', color: '#6b7280', textDecorationLine: 'underline' },
  insightsToggleCard: { backgroundColor: '#0a0a0a', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  insightsToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  insightsToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  insightsToggleText: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fff' },
  placeDetailsCard: { backgroundColor: '#0a0a0a', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  ratingSection: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  ratingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingValue: { fontSize: 24, fontFamily: 'LeagueSpartan_700Bold', color: '#fff' },
  ratingCount: { fontSize: 14, color: '#a3a3a3', fontFamily: 'LeagueSpartan_400Regular' },
  hoursSection: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  hoursHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  hoursStatus: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', color: '#10b981' },
  hoursDetails: { marginLeft: 28, gap: 4 },
  hoursText: { fontSize: 13, color: '#a3a3a3', fontFamily: 'LeagueSpartan_400Regular' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  contactText: { fontSize: 14, color: '#fff', flex: 1, fontFamily: 'LeagueSpartan_400Regular' },
  photosSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  placePhoto: { width: 120, height: 120, borderRadius: 12, marginRight: 12, backgroundColor: '#1a1a1a' },
  reviewsSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  reviewCard: { backgroundColor: '#000', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1a1a1a' },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewAuthor: { fontSize: 14, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fff' },
  reviewRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewRatingText: { fontSize: 13, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fff' },
  reviewText: { fontSize: 13, color: '#a3a3a3', lineHeight: 20, marginBottom: 8, fontFamily: 'LeagueSpartan_400Regular' },
  reviewTime: { fontSize: 11, color: '#737373', fontFamily: 'LeagueSpartan_400Regular' },
  imageModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  imageModalClose: { position: 'absolute', top: 60, right: 20, zIndex: 10, padding: 8 },
  fullImage: { width: '100%', height: '80%' },
  weatherCard: { backgroundColor: '#0a0a0a', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  currentWeather: { marginBottom: 16, alignItems: 'center' },
  currentTemp: { fontSize: 48, fontFamily: 'LeagueSpartan_700Bold', color: '#fff' },
  currentDesc: { fontSize: 16, color: '#a3a3a3', textTransform: 'capitalize', marginBottom: 12, fontFamily: 'LeagueSpartan_400Regular' },
  weatherDetails: { flexDirection: 'row', gap: 16 },
  weatherDetail: { fontSize: 12, color: '#737373', fontFamily: 'LeagueSpartan_400Regular' },
  forecastScroll: { marginTop: 8 },
  forecastDay: { width: 100, backgroundColor: '#000', borderRadius: 12, padding: 12, marginRight: 8, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  forecastDate: { fontSize: 11, fontFamily: 'LeagueSpartan_600SemiBold', color: '#a3a3a3', marginBottom: 8 },
  forecastTemp: { fontSize: 18, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginBottom: 4 },
  forecastDesc: { fontSize: 10, color: '#737373', textAlign: 'center', textTransform: 'capitalize', fontFamily: 'LeagueSpartan_400Regular' },
  actionsCard: { borderRadius: 16, padding: 20, marginBottom: 80, borderWidth: 1 },
  actionsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionButton: { flex: 1, borderRadius: 10, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1 },
  actionButtonActive: { },
  actionText: { fontSize: 12, fontFamily: 'LeagueSpartan_600SemiBold' },
  actionTextActive: { },
  shareOptionsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  shareOption: { flex: 1, backgroundColor: '#000', borderRadius: 10, padding: 12, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#333' },
  shareOptionText: { fontSize: 11, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fff' },
  notesButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#8b5cf6', borderRadius: 12, padding: 16, gap: 8, marginTop: 4 },
  notesButtonText: { color: '#ffffff', fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold' },
  addCollectionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6b7280', borderRadius: 12, padding: 16, gap: 8, marginTop: 8 },
  addCollectionText: { color: '#ffffff', fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold' },
  streetViewButton: { backgroundColor: '#000', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8 },
  streetViewText: { color: '#ffffff', fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold' },
  trainButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#8b5cf6', borderRadius: 12, padding: 18, gap: 8, marginTop: 8 },
  trainButtonText: { color: '#ffffff', fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold' },
  reportButtonInline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#450a0a', borderRadius: 8, marginTop: 16, borderWidth: 1, borderColor: '#7f1d1d' },
  reportButtonInlineText: { color: '#ef4444', fontSize: 13, fontFamily: 'LeagueSpartan_600SemiBold' },
  correctionHint: { fontSize: 12, color: '#737373', marginTop: 8, fontFamily: 'LeagueSpartan_400Regular' },
  // Enhanced Analysis Styles
  enhancedAnalysisCard: { backgroundColor: '#0a0a0a', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  analysisSection: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  analysisSectionTitle: { fontSize: 16, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginBottom: 12 },
  analysisItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  analysisLabel: { fontSize: 13, color: '#a3a3a3', fontFamily: 'LeagueSpartan_400Regular', flex: 1 },
  analysisValue: { fontSize: 13, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fff', flex: 1, textAlign: 'right' },
  // Analysis Summary Styles
  analysisSummaryCard: { backgroundColor: '#0a0a0a', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  summaryItem: { width: '48%', backgroundColor: '#000', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  summaryIcon: { fontSize: 24, marginBottom: 8 },
  summaryLabel: { fontSize: 12, color: '#a3a3a3', fontFamily: 'LeagueSpartan_400Regular', marginBottom: 4, textAlign: 'center' },
  summaryValue: { fontSize: 14, fontFamily: 'LeagueSpartan_600SemiBold', textAlign: 'center' },
  noDataCard: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
  noDataText: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', color: '#a3a3a3', marginTop: 12, textAlign: 'center' },
  noDataSubtext: { fontSize: 13, fontFamily: 'LeagueSpartan_400Regular', color: '#737373', marginTop: 4, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#0a0a0a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%', borderWidth: 1, borderColor: '#1a1a1a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: 'LeagueSpartan_700Bold', color: '#fff' },
  modalEmpty: { paddingVertical: 40, alignItems: 'center' },
  modalEmptyText: { fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold', color: '#a3a3a3', marginBottom: 4 },
  modalEmptySubtext: { fontSize: 14, color: '#737373', fontFamily: 'LeagueSpartan_400Regular' },
  collectionList: { maxHeight: 400 },
  collectionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#000', borderRadius: 12, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: '#1a1a1a' },
  collectionItemContent: { flex: 1 },
  collectionItemName: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fff', marginBottom: 2 },
  collectionItemCount: { fontSize: 13, color: '#a3a3a3', fontFamily: 'LeagueSpartan_400Regular' },
  notesInputGroup: { marginBottom: 20 },
  notesLabel: { fontSize: 13, fontFamily: 'LeagueSpartan_600SemiBold', color: '#a3a3a3', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  notesInput: { backgroundColor: '#000', borderRadius: 12, padding: 16, fontSize: 15, color: '#fff', borderWidth: 1, borderColor: '#1a1a1a', minHeight: 120, fontFamily: 'LeagueSpartan_400Regular' },
  saveNotesButton: { backgroundColor: '#fff', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8 },
  saveNotesButtonText: { color: '#000', fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold' },
  camera: { flex: 1 },
  cameraContainer: { flex: 1 },
  cameraHeader: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  cameraClose: { alignSelf: 'flex-start' },
  cameraCloseText: { color: '#ffffff', fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold' },
  cameraControls: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 60 },
  captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffffff', padding: 6 },
  captureInner: { flex: 1, borderRadius: 34, backgroundColor: '#000000' },
  shareHint: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8, borderWidth: 1 },
  shareHintText: { fontSize: 13, fontFamily: 'LeagueSpartan_400Regular', flex: 1 },
});
