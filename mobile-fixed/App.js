import React, { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, StatusBar, Alert, Linking, Platform, Modal, Animated, TextInput, Share, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync } from 'expo-image-manipulator';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { extractGPSFromExif, hasGPSData, getGPSDataSummary } from './utils/gpsUtils';

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

// Helper function to determine region from coordinates
function getRegionFromCoordinates(lat, lng) {
  // UK coordinates: roughly 49-61°N, -8-2°E
  if (lat >= 49 && lat <= 61 && lng >= -8 && lng <= 2) {
    return 'UK';
  }
  // USA coordinates: roughly 25-49°N, -125--66°W
  if (lat >= 25 && lat <= 49 && lng >= -125 && lng <= -66) {
    return 'USA';
  }
  // Add more regions as needed
  return null;
}

// Welcome Screen
function WelcomeScreen({ navigation }) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
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
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
    
    const timer = setTimeout(() => {
      navigation.navigate('Navigate');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <View style={styles.welcomeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
      <View style={styles.welcomeBackground}>
        <View style={styles.gradientOverlay} />
        <View style={styles.floatingShapes}>
          <View style={[styles.shape, styles.shape1]} />
          <View style={[styles.shape, styles.shape2]} />
          <View style={[styles.shape, styles.shape3]} />
        </View>
      </View>
      
      <Animated.View style={[
        styles.welcomeContent, 
        { 
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim }
          ]
        }
      ]}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="camera" size={40} color="#FFFFFF" />
          </View>
        </View>
        
        <Text style={styles.welcomeTitle}>Pic2Nav</Text>
        <Text style={styles.welcomeSubtitle}>
          AI-powered photo location detection
        </Text>
        
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Ionicons name="location" size={16} color="#10B981" />
            <Text style={styles.featureText}>Smart Location Detection</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="map" size={16} color="#3B82F6" />
            <Text style={styles.featureText}>Interactive Maps</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="search" size={16} color="#8B5CF6" />
            <Text style={styles.featureText}>Place Discovery</Text>
          </View>
        </View>
        
        <View style={styles.loadingIndicator}>
          <View style={styles.loadingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// Navigate Screen
function NavigateScreen({ navigation }) {
  const { theme } = useTheme();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [placePhotos, setPlacePhotos] = useState([]);
  const [showPlaceDetails, setShowPlaceDetails] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');
  const mapRef = useRef(null);
  
  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.length > 2) {
      try {
        const apiKey = Constants.expoConfig?.extra?.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
        if (!apiKey) {
          console.warn('Google Places API key not found');
          return;
        }
        
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${apiKey}`
        );
        const data = await response.json();
        
        if (data.predictions) {
          setSearchResults(data.predictions.slice(0, 5));
          setShowResults(true);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };
  
  const selectLocation = async (result) => {
    setSearchQuery(result.structured_formatting?.main_text || result.description);
    setShowResults(false);
    
    try {
      const apiKey = Constants.expoConfig?.extra?.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        console.warn('Google Places API key not found');
        return;
      }
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${result.place_id}&fields=name,formatted_address,geometry,photos,rating,user_ratings_total,formatted_phone_number,website,opening_hours,price_level,types&key=${apiKey}`
      );
      const data = await response.json();
      
      if (data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        const newRegion = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        
        setSelectedPlace({ latitude: lat, longitude: lng });
        setPlaceDetails(data.result);
        
        // Get place photos
        if (data.result.photos) {
          const photos = data.result.photos.slice(0, 5).map(photo => 
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
          );
          setPlacePhotos(photos);
        }
        
        // Get nearby places
        const nearbyResponse = await fetch(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=500&key=${apiKey}`
        );
        const nearbyData = await nearbyResponse.json();
        if (nearbyData.results) {
          setNearbyPlaces(nearbyData.results.slice(0, 5));
        }
        
        mapRef.current?.animateToRegion(newRegion, 1000);
        setShowPlaceDetails(true);
      }
    } catch (error) {
      console.error('Place details error:', error);
    }
  };
  
  const getCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location access required');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);
      
      // Get address from coordinates
      const apiKey = Constants.expoConfig?.extra?.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
      if (apiKey) {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=${apiKey}`
          );
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            setCurrentAddress(data.results[0].formatted_address);
          }
        } catch (error) {
          console.error('Geocoding error:', error);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get location');
    } finally {
      setIsLocating(false);
    }
  };
  
  useEffect(() => {
    getCurrentLocation();
  }, []);
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsTraffic={false}
        showsBuildings={true}
        showsIndoors={true}
        mapType="standard"
        region={currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : {
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPress={() => { setShowResults(false); setShowPlaceDetails(false); }}
      >
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Current Location"
            description="You are here"
          />
        )}
        {selectedPlace && (
          <Marker
            coordinate={selectedPlace}
            title={placeDetails?.name}
            description={placeDetails?.formatted_address}
            pinColor="red"
          />
        )}
      </MapView>
      
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchHeaderRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#5F6368" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for places"
              placeholderTextColor="#5F6368"
              value={searchQuery}
              onChangeText={handleSearch}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              returnKeyType="search"
            />
          </View>
          
          <TouchableOpacity 
            style={styles.cameraButton}
            onPress={() => navigation.navigate('Camera')}
          >
            <Ionicons name="camera" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        
        {showResults && searchResults.length > 0 && (
          <View style={styles.searchResults}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Search Results</Text>
              <TouchableOpacity onPress={() => setShowResults(false)}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {searchResults.map((result, index) => (
              <TouchableOpacity
                key={result.place_id || index}
                style={[styles.searchResultItem, index === searchResults.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => selectLocation(result)}
                activeOpacity={0.7}
              >
                <View style={styles.resultIconContainer}>
                  <View style={styles.iconGradient}>
                    <Ionicons name="location" size={18} color="#FFFFFF" />
                  </View>
                </View>
                <View style={styles.resultTextContainer}>
                  <Text style={styles.searchResultText} numberOfLines={1}>
                    {result.structured_formatting?.main_text || result.description}
                  </Text>
                  {result.structured_formatting?.secondary_text && (
                    <Text style={styles.searchResultDesc} numberOfLines={1}>
                      {result.structured_formatting.secondary_text}
                    </Text>
                  )}
                  <View style={styles.resultMeta}>
                    <View style={styles.distanceBadge}>
                      <Ionicons name="navigate" size={10} color="#10B981" />
                      <Text style={styles.distanceText}>Nearby</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.resultArrow}>
                  <Ionicons name="arrow-forward" size={16} color="#6366F1" />
                </View>
              </TouchableOpacity>
            ))}
            <View style={styles.resultsFooter}>
              <Text style={styles.footerText}>Powered by Google Places</Text>
            </View>
          </View>
        )}
      </View>
      
      {/* Floating Controls */}
      <View style={styles.floatingControls}>
        <TouchableOpacity 
          style={styles.zoomBtn}
          onPress={() => {
            mapRef.current?.getCamera().then((camera) => {
              mapRef.current?.animateCamera({
                ...camera,
                zoom: camera.zoom + 1
              }, { duration: 300 });
            });
          }}
        >
          <Ionicons name="add" size={18} color="#374151" />
        </TouchableOpacity>
        <View style={styles.controlDivider} />
        <TouchableOpacity 
          style={styles.zoomBtn}
          onPress={() => {
            mapRef.current?.getCamera().then((camera) => {
              mapRef.current?.animateCamera({
                ...camera,
                zoom: Math.max(camera.zoom - 1, 1)
              }, { duration: 300 });
            });
          }}
        >
          <Ionicons name="remove" size={18} color="#374151" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={[styles.myLocationBtn, isLocating && styles.locatingBtn]} 
        onPress={() => {
          getCurrentLocation();
          if (currentLocation && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000);
          }
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="locate" size={22} color={isLocating ? "#9CA3AF" : "#4285F4"} />
      </TouchableOpacity>
      
      {currentLocation && (
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Ionicons name="location-outline" size={16} color="#10B981" />
            <Text style={styles.locationStatus}>Current Location</Text>
          </View>
          {currentAddress ? (
            <Text style={styles.locationAddress} numberOfLines={2}>
              {currentAddress}
            </Text>
          ) : (
            <Text style={styles.coordinates}>
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
          )}
        </View>
      )}
      
      {showPlaceDetails && placeDetails ? (
        <View style={styles.placeDetailsSheet}>
          <View style={styles.detailsHandle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.detailsHeader}>
              <View style={styles.headerTop}>
                <View style={styles.placeIcon}>
                  <Ionicons name="location" size={24} color="#FFFFFF" />
                </View>
                <TouchableOpacity onPress={() => setShowPlaceDetails(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
              <Text style={styles.placeName}>{placeDetails.name}</Text>
              <Text style={styles.placeAddress}>{placeDetails.formatted_address}</Text>
              {placeDetails.rating && (
                <View style={styles.ratingContainer}>
                  <View style={styles.starContainer}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons key={i} name="star" size={14} color={i < Math.floor(placeDetails.rating) ? "#FFD700" : "#E2E8F0"} />
                    ))}
                  </View>
                  <Text style={styles.ratingText}>{placeDetails.rating}</Text>
                  <Text style={styles.reviewCount}>({placeDetails.user_ratings_total} reviews)</Text>
                </View>
              )}
            </View>
            
            {placePhotos.length > 0 && (
              <View style={styles.photosSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="images" size={20} color="#6366F1" />
                  <Text style={styles.sectionTitle}>Photos</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
                  {placePhotos.map((photo, index) => (
                    <View key={index} style={styles.photoContainer}>
                      <Image source={{ uri: photo }} style={styles.placePhoto} />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            
            <View style={styles.actionsSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="call" size={20} color="#10B981" />
                <Text style={styles.sectionTitle}>Contact</Text>
              </View>
              <View style={styles.actionButtons}>
                {placeDetails.formatted_phone_number && (
                  <TouchableOpacity style={styles.actionButton} onPress={() => Linking.openURL(`tel:${placeDetails.formatted_phone_number}`)}>
                    <View style={styles.actionIcon}>
                      <Ionicons name="call" size={18} color="#10B981" />
                    </View>
                    <Text style={styles.actionText}>Call</Text>
                    <Text style={styles.actionSubtext}>{placeDetails.formatted_phone_number}</Text>
                  </TouchableOpacity>
                )}
                {placeDetails.website && (
                  <TouchableOpacity style={styles.actionButton} onPress={() => Linking.openURL(placeDetails.website)}>
                    <View style={styles.actionIcon}>
                      <Ionicons name="globe" size={18} color="#3B82F6" />
                    </View>
                    <Text style={styles.actionText}>Website</Text>
                    <Text style={styles.actionSubtext}>Visit online</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            {nearbyPlaces.length > 0 && (
              <View style={styles.nearbySection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="compass" size={20} color="#F59E0B" />
                  <Text style={styles.sectionTitle}>Nearby Places</Text>
                </View>
                {nearbyPlaces.map((place, index) => (
                  <View key={index} style={styles.nearbyCard}>
                    <View style={styles.nearbyIcon}>
                      <Ionicons name="business" size={16} color="#6366F1" />
                    </View>
                    <View style={styles.nearbyContent}>
                      <Text style={styles.nearbyName}>{place.name}</Text>
                      <Text style={styles.nearbyType}>{place.types?.[0]?.replace(/_/g, ' ')}</Text>
                      {place.rating && (
                        <View style={styles.nearbyRating}>
                          <Ionicons name="star" size={12} color="#FFD700" />
                          <Text style={styles.nearbyRatingText}>{place.rating}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

// Camera Screen
function CameraScreen({ navigation }) {
  const { theme } = useTheme();
  const [photo, setPhoto] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [confidence, setConfidence] = useState(0);
  
  const takePicture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 1.0,
        allowsEditing: false,
        exif: true,
        base64: false,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('📷 Camera asset:', {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          hasExif: !!asset.exif,
          exifKeys: asset.exif ? Object.keys(asset.exif) : [],
          gpsData: asset.exif ? {
            GPSLatitude: asset.exif.GPSLatitude,
            GPSLongitude: asset.exif.GPSLongitude,
            GPSLatitudeRef: asset.exif.GPSLatitudeRef,
            GPSLongitudeRef: asset.exif.GPSLongitudeRef,
            location: asset.exif.location,
            GPS: asset.exif.GPS
          } : null
        });
        
        // Compress images to prevent payload errors
        let processedUri = asset.uri;
        console.log('📐 Compressing image for upload...');
        try {
          const compressed = await manipulateAsync(
            asset.uri,
            [{ resize: { width: 800 } }],
            { compress: 0.6, format: 'jpeg' }
          );
          processedUri = compressed.uri;
          console.log('✅ Image compressed successfully');
        } catch (error) {
          console.log('⚠️ Image compression failed, using original:', error.message);
        }
        
        setPhoto(processedUri);
        analyzeImage(processedUri, asset.exif);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open camera: ' + error.message);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library access is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsEditing: false,
        quality: 1.0,
        exif: true,
        base64: false,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('🖼️ Gallery asset:', {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          hasExif: !!asset.exif,
          exifKeys: asset.exif ? Object.keys(asset.exif) : [],
          gpsData: asset.exif ? {
            GPSLatitude: asset.exif.GPSLatitude,
            GPSLongitude: asset.exif.GPSLongitude,
            GPSLatitudeRef: asset.exif.GPSLatitudeRef,
            GPSLongitudeRef: asset.exif.GPSLongitudeRef,
            location: asset.exif.location,
            GPS: asset.exif.GPS
          } : null
        });
        
        // Compress images to prevent payload errors
        let processedUri = asset.uri;
        console.log('📐 Compressing image for upload...');
        try {
          const compressed = await manipulateAsync(
            asset.uri,
            [{ resize: { width: 800 } }],
            { compress: 0.6, format: 'jpeg' }
          );
          processedUri = compressed.uri;
          console.log('✅ Image compressed successfully');
        } catch (error) {
          console.log('⚠️ Image compression failed, using original:', error.message);
        }
        
        setPhoto(processedUri);
        analyzeImage(processedUri, asset.exif);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open image picker: ' + error.message);
    }
  };

  const analyzeImage = async (imageUri, exifData) => {
    setLoading(true);
    setConfidence(0);
    
    try {
      console.log('🚀 Starting image analysis for:', imageUri);
      console.log('📊 EXIF data received:', exifData);
      setProcessingStep('Preparing image...');
      setConfidence(10);
      
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      });
      
      // Add GPS data from EXIF if available
      let gpsAdded = false;
      if (exifData) {
        const gpsSummary = getGPSDataSummary(exifData);
        console.log('🗺️ GPS Data Summary:', gpsSummary);
        
        const gpsCoords = extractGPSFromExif(exifData);
        if (gpsCoords) {
          formData.append('latitude', gpsCoords.latitude.toString());
          formData.append('longitude', gpsCoords.longitude.toString());
          gpsAdded = true;
          console.log('📍 Added GPS from EXIF:', gpsCoords);
        } else {
          console.log('⚠️ No valid GPS coordinates found in EXIF');
        }
      }
      
      // Don't send fallback location to avoid biasing results
      if (!gpsAdded) {
        console.log('⚠️ No GPS data in image - letting server handle location detection');
      }
      
      // Add dynamic region hint based on current location
      if (currentLocation?.coords) {
        const region = getRegionFromCoordinates(currentLocation.coords.latitude, currentLocation.coords.longitude);
        if (region) {
          formData.append('region_hint', region);
        }
      }
      formData.append('user_agent', 'Pic2Nav-Mobile');
      
      console.log('📤 FormData prepared, uploading to server...');
      setProcessingStep('Uploading to server...');
      setConfidence(30);
      
      setProcessingStep('Analyzing image content...');
      setConfidence(60);
      
      const apiUrl = 'https://www.pic2nav.com/api/location-recognition-v2';
      console.log('🌐 Making request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'User-Agent': 'Pic2Nav-Mobile/1.0'
        }
      });
      
      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      setProcessingStep('Processing results...');
      setConfidence(90);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ API Response data:', data);
      setConfidence(100);
      
      if (data.success) {
        console.log('🎉 Success! Location found:', data.name || data.address);
        setResult({
          success: true,
          name: data.name || 'Location Found',
          address: data.address || 'Address not available',
          location: data.location,
          confidence: data.confidence || 0.8,
          category: data.category || 'Location',
          rating: data.rating,
          description: data.description
        });
      } else {
        console.log('⚠️ API returned failure:', data.error);
        setResult({
          success: false,
          error: data.error || 'Could not identify location from image'
        });
      }
    } catch (error) {
      console.error('🔥 API Error Details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setResult({ 
        success: false, 
        error: error.message || 'Network error - please check your connection' 
      });
    } finally {
      setLoading(false);
      setProcessingStep('');
      console.log('🏁 Analysis complete');
    }
  };

  const openInMaps = () => {
    if (result?.success && result.location) {
      const { latitude, longitude } = result.location;
      const url = `https://maps.google.com/?q=${latitude},${longitude}`;
      Linking.openURL(url);
    }
  };

  const shareLocation = async () => {
    if (result?.success) {
      try {
        await Share.share({
          message: `Found location: ${result.name || result.address}\n${result.location ? `https://maps.google.com/?q=${result.location.latitude},${result.location.longitude}` : ''}`,
          title: 'Location Found'
        });
      } catch (error) {
        console.log('Share error:', error);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      <View style={[styles.header, { backgroundColor: theme.bg, borderBottomColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Photo Scanner</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!photo ? (
          <View style={styles.scannerSection}>
            <View style={styles.heroSection}>
              <View style={styles.scannerIcon}>
                <View style={styles.iconGradient}>
                  <Ionicons name="scan" size={40} color="#FFFFFF" />
                </View>
              </View>
              <Text style={[styles.heroTitle, { color: theme.text }]}>AI Photo Scanner</Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                Instantly identify locations from photos using advanced AI recognition
              </Text>
            </View>
            
            <View style={styles.featuresGrid}>
              <View style={[styles.featureCard, { backgroundColor: theme.surface }]}>
                <View style={styles.featureIcon}>
                  <Ionicons name="location" size={20} color="#10B981" />
                </View>
                <Text style={[styles.featureTitle, { color: theme.text }]}>GPS Detection</Text>
                <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>Extract location from photo metadata</Text>
              </View>
              
              <View style={[styles.featureCard, { backgroundColor: theme.surface }]}>
                <View style={styles.featureIcon}>
                  <Ionicons name="eye" size={20} color="#6366F1" />
                </View>
                <Text style={[styles.featureTitle, { color: theme.text }]}>Visual Analysis</Text>
                <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>Identify landmarks and buildings</Text>
              </View>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.primaryButton} onPress={takePicture}>
                <View style={styles.buttonIconContainer}>
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.primaryButtonText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: theme.surface, borderColor: theme.surface }]} onPress={pickImage}>
                <Ionicons name="images" size={20} color="#6366F1" />
                <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.resultSection}>
            <View style={styles.photoPreview}>
              <Image source={{ uri: photo }} style={styles.photoImage} />
              <TouchableOpacity 
                style={styles.photoOverlay}
                onPress={() => { setPhoto(null); setResult(null); setLoading(false); }}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {loading && (
              <View style={[styles.processingCard, { backgroundColor: theme.surface }]}>
                <View style={styles.processingHeader}>
                  <View style={styles.processingIcon}>
                    <Ionicons name="analytics" size={24} color="#6366F1" />
                  </View>
                  <Text style={[styles.processingTitle, { color: theme.text }]}>Analyzing Photo</Text>
                </View>
                
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${confidence}%` }]} />
                  </View>
                  <Text style={[styles.progressText, { color: theme.textSecondary }]}>{confidence}%</Text>
                </View>
                
                <Text style={[styles.processingStep, { color: theme.textSecondary }]}>
                  {processingStep}
                </Text>
              </View>
            )}
            
            {result && !loading && (
              <View style={styles.resultCard}>
                {result.success ? (
                  <View style={[styles.successCard, { backgroundColor: theme.surface }]}>
                    <View style={styles.resultHeader}>
                      <View style={styles.successIcon}>
                        <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                      </View>
                      <View style={styles.resultInfo}>
                        <Text style={[styles.resultTitle, { color: theme.text }]}>Location Found!</Text>
                        {result.confidence && (
                          <Text style={[styles.confidenceText, { color: theme.textSecondary }]}>
                            {Math.round(result.confidence * 100)}% confidence
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.locationDetails}>
                      <Text style={[styles.locationName, { color: theme.text }]}>
                        {result.name || 'Unknown Location'}
                      </Text>
                      <Text style={[styles.locationAddress, { color: theme.textSecondary }]}>
                        {result.address}
                      </Text>
                      
                      {result.category && (
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>{result.category}</Text>
                        </View>
                      )}
                      
                      {result.rating && (
                        <View style={styles.ratingContainer}>
                          <Ionicons name="star" size={16} color="#FFD700" />
                          <Text style={[styles.ratingText, { color: theme.text }]}>{result.rating}</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.mapButton} onPress={openInMaps}>
                        <Ionicons name="map" size={18} color="#FFFFFF" />
                        <Text style={styles.mapButtonText}>Open in Maps</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={[styles.shareButton, { backgroundColor: theme.surface, borderColor: '#6366F1' }]} onPress={shareLocation}>
                        <Ionicons name="share" size={18} color="#6366F1" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.errorCard, { backgroundColor: theme.surface }]}>
                    <View style={styles.resultHeader}>
                      <View style={styles.errorIcon}>
                        <Ionicons name="alert-circle" size={32} color="#EF4444" />
                      </View>
                      <View style={styles.resultInfo}>
                        <Text style={[styles.resultTitle, { color: theme.text }]}>No Location Found</Text>
                        <Text style={[styles.errorSubtitle, { color: theme.textSecondary }]}>Try a different photo</Text>
                      </View>
                    </View>
                    
                    <Text style={[styles.errorMessage, { color: theme.textSecondary }]}>
                      {result.error || 'Could not identify location from this image. Make sure the photo contains GPS data or recognizable landmarks.'}
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.surface }]}
              onPress={() => { 
                setPhoto(null); 
                setResult(null); 
                setLoading(false);
                setConfidence(0);
              }}
            >
              <Ionicons name="refresh" size={20} color="#6366F1" />
              <Text style={[styles.retryButtonText, { color: theme.text }]}>Scan Another Photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Main App
export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.preventAutoHideAsync();
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
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
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Navigate" component={NavigateScreen} />
            <Stack.Screen name="Camera" component={CameraScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: 40 },
  
  // Welcome Screen
  welcomeContainer: { flex: 1, backgroundColor: '#6366F1' },
  welcomeBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
  },
  floatingShapes: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  shape: { position: 'absolute', borderRadius: 50 },
  shape1: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: 100,
    right: 50,
  },
  shape2: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: 300,
    left: 30,
  },
  shape3: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: 200,
    right: 80,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    zIndex: 1,
  },
  logoContainer: { marginBottom: 30 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  featuresList: { marginBottom: 50 },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 12,
    fontWeight: '500',
  },
  loadingIndicator: { alignItems: 'center' },
  loadingDots: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  dot1: { opacity: 1 },
  dot2: { opacity: 0.7 },
  dot3: { opacity: 0.4 },
  
  // Header
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: 60, 
    paddingHorizontal: 24, 
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a'
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '500', flex: 1, textAlign: 'center' },
  headerSpacer: { width: 40 },
  
  // Map
  map: { flex: 1 },
  
  // Search Header
  searchHeader: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  cameraButton: {
    width: 48,
    height: 48,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    gap: 12,
  },
  searchHeaderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchResults: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 12,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  resultIconContainer: {
    marginRight: 16,
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  resultTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  searchResultText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  searchResultDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 6,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  resultArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsFooter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  searchInput: {
    flex: 1,
    color: '#202124',
    fontSize: 16,
  },
  
  // Floating Controls
  floatingControls: {
    position: 'absolute',
    right: 16,
    top: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  myLocationBtn: {
    position: 'absolute',
    right: 16,
    bottom: 200,
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  locatingBtn: { backgroundColor: '#F3F4F6' },
  locationCard: {
    position: 'absolute',
    bottom: 280,
    left: 16,
    maxWidth: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  locationHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  locationStatus: { color: '#10B981', fontSize: 12, fontWeight: '600' },
  coordinates: { color: '#6B7280', fontSize: 11, fontFamily: 'monospace' },
  locationAddress: { color: '#374151', fontSize: 12, lineHeight: 16 },
  
  // Bottom Sheet
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonIcon: {
    width: 52,
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  buttonContent: { flex: 1 },
  buttonTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '700', marginBottom: 3 },
  buttonSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '500' },
  buttonArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Place Details
  placeDetailsSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  detailsHandle: {
    width: 48,
    height: 5,
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  detailsHeader: { padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  placeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeName: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  placeAddress: { fontSize: 16, color: '#64748B', marginBottom: 12, lineHeight: 22 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  starContainer: { flexDirection: 'row', gap: 2 },
  ratingText: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  reviewCount: { fontSize: 14, color: '#64748B' },
  
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  
  photosSection: { padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  photosScroll: { marginHorizontal: -24 },
  photoContainer: { marginLeft: 24 },
  placePhoto: { width: 140, height: 100, borderRadius: 12 },
  
  actionsSection: { padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  actionButtons: { flexDirection: 'row', gap: 12 },
  actionButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  actionSubtext: { fontSize: 12, color: '#64748B', textAlign: 'center' },
  
  nearbySection: { padding: 24 },
  nearbyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  nearbyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nearbyContent: { flex: 1 },
  nearbyName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  nearbyType: { fontSize: 13, color: '#64748B', textTransform: 'capitalize', marginBottom: 6 },
  nearbyRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nearbyRatingText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  
  // Scanner
  scannerSection: { flex: 1, padding: 24 },
  heroSection: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  scannerIcon: { marginBottom: 24 },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: { fontSize: 28, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  heroSubtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
  
  featuresGrid: { flexDirection: 'row', gap: 16, marginBottom: 40 },
  featureCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  featureDesc: { fontSize: 12, textAlign: 'center', lineHeight: 16 },
  
  actionButtons: { gap: 16 },
  primaryButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  primaryButtonText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '600' },
  
  // Results
  resultSection: { padding: 24 },
  photoPreview: { position: 'relative', marginBottom: 24, borderRadius: 20, overflow: 'hidden' },
  photoImage: { width: '100%', height: 240, borderRadius: 20 },
  photoOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  processingCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  processingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  processingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  processingTitle: { fontSize: 20, fontWeight: '700' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  progressText: { fontSize: 14, fontWeight: '600', minWidth: 40 },
  processingStep: { fontSize: 14, fontStyle: 'italic' },
  
  resultCard: { marginBottom: 24 },
  successCard: { borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
  errorCard: { borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  successIcon: { marginRight: 16 },
  errorIcon: { marginRight: 16 },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  confidenceText: { fontSize: 14, fontWeight: '500' },
  errorSubtitle: { fontSize: 14 },
  
  locationDetails: { marginBottom: 20 },
  locationName: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  locationAddress: { fontSize: 16, lineHeight: 22, marginBottom: 12 },
  categoryBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: { fontSize: 12, fontWeight: '700', color: '#6366F1' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingText: { fontSize: 16, fontWeight: '600' },
  
  actionRow: { flexDirection: 'row', gap: 12 },
  mapButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  shareButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  
  errorMessage: { fontSize: 16, lineHeight: 24 },
  
  retryButton: {
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  retryButtonText: { fontSize: 16, fontWeight: '600' },
});