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
  const [weather, setWeather] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [placeDetails, setPlaceDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [distance, setDistance] = useState<number | null>(null);
  const [elevation, setElevation] = useState<number | null>(null);
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
      
      // Check if API returned an error or no location data
      if (!data.success || data.error) {
        setResult({ 
          error: data.error || 'No GPS data found in image. Please use a photo with location data or take a new photo with location services enabled.' 
        });
        return;
      }
      
      setResult(data);
      
      if (data && data.location) {
        const locationName = data.name || data.address || 'Unknown location';
        await addActivity('Location Analyzed', `Found: ${locationName}`, '/scanner');
        
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
        quality: 0.8,
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
                <Ionicons name="alert-circle" size={48} color="#ef4444" style={styles.errorIcon} />
                <Text style={styles.errorTitle}>No Location Data</Text>
                <Text style={styles.errorText}>{result.error}</Text>
                <View style={styles.errorTips}>
                  <Text style={styles.errorTipsTitle}>Tips:</Text>
                  <Text style={styles.errorTip}>• Enable location services on your device</Text>
                  <Text style={styles.errorTip}>• Take a new photo with GPS enabled</Text>
                  <Text style={styles.errorTip}>• Use a photo that was taken with location data</Text>
                </View>
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
                    <Text style={styles.cardTitle}>Location Data</Text>
                    <View style={styles.coordinatesBox}>
                      <View style={styles.dataRow}>
                        <Ionicons name="navigate-outline" size={16} color="#6b7280" />
                        <Text style={styles.dataLabel}>Coordinates</Text>
                      </View>
                      <Text style={styles.coordinatesText}>
                        {result.location.latitude.toFixed(6)}, {result.location.longitude.toFixed(6)}
                      </Text>
                    </View>
                    {distance !== null && (
                      <View style={styles.coordinatesBox}>
                        <View style={styles.dataRow}>
                          <Ionicons name="location-outline" size={16} color="#6b7280" />
                          <Text style={styles.dataLabel}>Distance from you</Text>
                        </View>
                        <Text style={styles.dataValue}>
                          {distance < 1 ? `${(distance * 1000).toFixed(0)} m` : `${distance.toFixed(2)} km`}
                        </Text>
                      </View>
                    )}
                    {elevation !== null && (
                      <View style={styles.coordinatesBox}>
                        <View style={styles.dataRow}>
                          <Ionicons name="trending-up-outline" size={16} color="#6b7280" />
                          <Text style={styles.dataLabel}>Elevation</Text>
                        </View>
                        <Text style={styles.dataValue}>{elevation} meters</Text>
                      </View>
                    )}
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
                          {place.distance !== undefined && place.distance !== null && (
                            <Text style={styles.nearbyDistance}>{place.distance}m away</Text>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {placeDetails && (
                  <View style={styles.placeDetailsCard}>
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
                              <Image 
                                source={{ uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho` }}
                                style={styles.placePhoto}
                              />
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
                      <Ionicons name="navigate" size={18} color="#000" />
                      <Text style={styles.actionText}>Navigate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, isSaved && styles.actionButtonActive]}
                      onPress={handleSave}
                    >
                      <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={18} color={isSaved ? "#fff" : "#000"} />
                      <Text style={[styles.actionText, isSaved && styles.actionTextActive]}>{isSaved ? 'Saved' : 'Save'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => {
                        if (result.location) {
                          router.push({
                            pathname: '/share-location',
                            params: { location: JSON.stringify({ ...result, image }) }
                          });
                        }
                      }}
                    >
                      <Ionicons name="share-social" size={18} color="#000" />
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
                      <Ionicons name="globe" size={18} color="#000" />
                      <Text style={styles.actionText}>Satellite</Text>
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

      <Modal visible={showImageModal} transparent animationType="fade">
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity 
            style={styles.imageModalClose}
            onPress={() => setShowImageModal(false)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          {placeDetails?.photos && (
            <Image 
              source={{ uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${placeDetails.photos[selectedImageIndex]?.photo_reference}&key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho` }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
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
  headerTitle: { fontSize: 20, fontFamily: 'LeagueSpartan_700Bold', color: '#000', flex: 1 },
  clearButton: { padding: 4 },
  content: { flex: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, fontFamily: 'LeagueSpartan_400Regular' },
  actionSection: { padding: 20, gap: 12 },
  primaryAction: { backgroundColor: '#000', borderRadius: 12, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  primaryActionText: { color: '#fff', fontSize: 16, fontFamily: 'LeagueSpartan_700Bold' },
  secondaryAction: { backgroundColor: '#fff', borderRadius: 12, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  secondaryActionText: { color: '#000', fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold' },
  actionIconLeft: { marginRight: 8 },
  imageSection: { margin: 20, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  selectedImage: { width: '100%', height: 280, backgroundColor: '#f3f4f6' },
  imageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  loadingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 20, padding: 16, borderRadius: 12, gap: 12 },
  loadingText: { fontSize: 15, color: '#000', fontFamily: 'LeagueSpartan_600SemiBold' },
  resultSection: { padding: 20 },
  errorCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#fecaca', alignItems: 'center' },
  errorIcon: { marginBottom: 16 },
  errorTitle: { fontSize: 20, fontFamily: 'LeagueSpartan_700Bold', color: '#dc2626', marginBottom: 12, textAlign: 'center' },
  errorText: { fontSize: 15, color: '#6b7280', fontFamily: 'LeagueSpartan_400Regular', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  errorTips: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 16, width: '100%' },
  errorTipsTitle: { fontSize: 14, fontFamily: 'LeagueSpartan_700Bold', color: '#dc2626', marginBottom: 12 },
  errorTip: { fontSize: 13, color: '#6b7280', marginBottom: 6, fontFamily: 'LeagueSpartan_400Regular', lineHeight: 20 },
  locationCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  locationHeader: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  locationInfo: { flex: 1 },
  locationName: { fontSize: 20, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginBottom: 6 },
  locationAddress: { fontSize: 15, color: '#6b7280', lineHeight: 22, fontFamily: 'LeagueSpartan_400Regular' },
  confidenceSection: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, marginTop: 16 },
  confidenceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  confidenceLabel: { fontSize: 13, fontFamily: 'LeagueSpartan_600SemiBold', color: '#6b7280' },
  confidenceValue: { fontSize: 16, fontFamily: 'LeagueSpartan_700Bold', color: '#000000' },
  confidenceBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  confidenceFill: { height: '100%', backgroundColor: '#000000', borderRadius: 3 },
  detailsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 14, fontFamily: 'LeagueSpartan_700Bold', color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  coordinatesBox: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 8 },
  dataRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dataLabel: { fontSize: 12, color: '#6b7280', fontFamily: 'LeagueSpartan_400Regular' },
  coordinatesText: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', color: '#000000' },
  dataValue: { fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold', color: '#000000' },
  infoBox: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 8 },
  infoLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4, fontFamily: 'LeagueSpartan_400Regular' },
  infoValue: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', color: '#000000' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  detailLabel: { fontSize: 14, color: '#6b7280', fontFamily: 'LeagueSpartan_400Regular' },
  detailValue: { fontSize: 14, fontFamily: 'LeagueSpartan_600SemiBold', color: '#000000', flex: 1, textAlign: 'right' },
  nearbySection: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 },
  nearbyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  nearbyBadge: { backgroundColor: '#000000', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  nearbyBadgeText: { color: '#ffffff', fontSize: 12, fontFamily: 'LeagueSpartan_600SemiBold' },
  nearbyScroll: { },
  nearbyCard: { width: 140, backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, marginRight: 12 },
  nearbyName: { fontSize: 14, fontFamily: 'LeagueSpartan_600SemiBold', color: '#000000', marginBottom: 4, height: 36 },
  nearbyType: { fontSize: 12, color: '#6b7280', marginBottom: 8, textTransform: 'capitalize', fontFamily: 'LeagueSpartan_400Regular' },
  nearbyDistance: { fontSize: 12, color: '#000000', fontFamily: 'LeagueSpartan_600SemiBold' },
  placeDetailsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 },
  ratingSection: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  ratingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingValue: { fontSize: 24, fontFamily: 'LeagueSpartan_700Bold', color: '#000' },
  ratingCount: { fontSize: 14, color: '#6b7280', fontFamily: 'LeagueSpartan_400Regular' },
  hoursSection: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  hoursHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  hoursStatus: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', color: '#10b981' },
  hoursDetails: { marginLeft: 28, gap: 4 },
  hoursText: { fontSize: 13, color: '#6b7280', fontFamily: 'LeagueSpartan_400Regular' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  contactText: { fontSize: 14, color: '#000', flex: 1, fontFamily: 'LeagueSpartan_400Regular' },
  photosSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  placePhoto: { width: 120, height: 120, borderRadius: 12, marginRight: 12, backgroundColor: '#f3f4f6' },
  reviewsSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  reviewCard: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewAuthor: { fontSize: 14, fontFamily: 'LeagueSpartan_600SemiBold', color: '#000' },
  reviewRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewRatingText: { fontSize: 13, fontFamily: 'LeagueSpartan_600SemiBold', color: '#000' },
  reviewText: { fontSize: 13, color: '#6b7280', lineHeight: 20, marginBottom: 8, fontFamily: 'LeagueSpartan_400Regular' },
  reviewTime: { fontSize: 11, color: '#9ca3af', fontFamily: 'LeagueSpartan_400Regular' },
  imageModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  imageModalClose: { position: 'absolute', top: 60, right: 20, zIndex: 10, padding: 8 },
  fullImage: { width: '100%', height: '80%' },
  weatherCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 },
  currentWeather: { marginBottom: 16, alignItems: 'center' },
  currentTemp: { fontSize: 48, fontFamily: 'LeagueSpartan_700Bold', color: '#000' },
  currentDesc: { fontSize: 16, color: '#6b7280', textTransform: 'capitalize', marginBottom: 12, fontFamily: 'LeagueSpartan_400Regular' },
  weatherDetails: { flexDirection: 'row', gap: 16 },
  weatherDetail: { fontSize: 12, color: '#9ca3af', fontFamily: 'LeagueSpartan_400Regular' },
  forecastScroll: { marginTop: 8 },
  forecastDay: { width: 100, backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, marginRight: 8, alignItems: 'center' },
  forecastDate: { fontSize: 11, fontFamily: 'LeagueSpartan_600SemiBold', color: '#6b7280', marginBottom: 8 },
  forecastTemp: { fontSize: 18, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginBottom: 4 },
  forecastDesc: { fontSize: 10, color: '#9ca3af', textAlign: 'center', textTransform: 'capitalize', fontFamily: 'LeagueSpartan_400Regular' },
  actionsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 80 },
  actionsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionButton: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 10, padding: 14, alignItems: 'center', gap: 4 },
  actionButtonActive: { backgroundColor: '#000' },
  actionText: { fontSize: 12, fontFamily: 'LeagueSpartan_600SemiBold', color: '#000000' },
  actionTextActive: { color: '#fff' },
  shareOptionsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  shareOption: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, alignItems: 'center', gap: 6 },
  shareOptionText: { fontSize: 11, fontFamily: 'LeagueSpartan_600SemiBold', color: '#000' },
  notesButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#8b5cf6', borderRadius: 12, padding: 16, gap: 8, marginTop: 4 },
  notesButtonText: { color: '#ffffff', fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold' },
  addCollectionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6b7280', borderRadius: 12, padding: 16, gap: 8, marginTop: 8 },
  addCollectionText: { color: '#ffffff', fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold' },
  streetViewButton: { backgroundColor: '#000', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8 },
  streetViewText: { color: '#ffffff', fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: 'LeagueSpartan_700Bold', color: '#000' },
  modalEmpty: { paddingVertical: 40, alignItems: 'center' },
  modalEmptyText: { fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold', color: '#6b7280', marginBottom: 4 },
  modalEmptySubtext: { fontSize: 14, color: '#9ca3af', fontFamily: 'LeagueSpartan_400Regular' },
  collectionList: { maxHeight: 400 },
  collectionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 12, marginBottom: 8, gap: 12 },
  collectionItemContent: { flex: 1 },
  collectionItemName: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', color: '#000', marginBottom: 2 },
  collectionItemCount: { fontSize: 13, color: '#6b7280', fontFamily: 'LeagueSpartan_400Regular' },
  notesInputGroup: { marginBottom: 20 },
  notesLabel: { fontSize: 13, fontFamily: 'LeagueSpartan_600SemiBold', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  notesInput: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, fontSize: 15, color: '#000', borderWidth: 1, borderColor: '#e5e7eb', minHeight: 120, fontFamily: 'LeagueSpartan_400Regular' },
  saveNotesButton: { backgroundColor: '#000', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8 },
  saveNotesButtonText: { color: '#fff', fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold' },
  camera: { flex: 1 },
  cameraContainer: { flex: 1 },
  cameraHeader: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  cameraClose: { alignSelf: 'flex-start' },
  cameraCloseText: { color: '#ffffff', fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold' },
  cameraControls: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 60 },
  captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffffff', padding: 6 },
  captureInner: { flex: 1, borderRadius: 34, backgroundColor: '#000000' },
});
