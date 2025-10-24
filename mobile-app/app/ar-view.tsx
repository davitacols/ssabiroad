import { View, Text, StyleSheet, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import MenuBar from '../components/MenuBar';

interface ARPlace {
  id: string;
  name: string;
  type: string;
  distance: number;
  x: number;
  y: number;
  rating?: number;
  openNow?: boolean;
}

export default function ARViewScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState<any>(null);
  const [places, setPlaces] = useState<ARPlace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAR();
  }, []);

  const initializeAR = async () => {
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission required for AR');
        setLoading(false);
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);

      // Load nearby places
      await loadNearbyPlaces(currentLocation.coords);
      setLoading(false);
    } catch (error) {
      console.error('AR initialization error:', error);
      setLoading(false);
    }
  };

  const loadNearbyPlaces = async (coords: any) => {
    try {
      const response = await fetch(
        `https://pic2nav.com/api/nearby-poi?lat=${coords.latitude}&lng=${coords.longitude}&type=restaurant`
      );
      const data = await response.json();
      
      if (data.places && data.places.length > 0) {
        const arPlaces = data.places.slice(0, 5).map((place: any, index: number) => {
          // Distribute places across screen
          const screenWidth = 350; // Approximate screen width
          const x = (index * (screenWidth / 5)) + 50;
          const y = 200 + (Math.random() * 200); // Random Y position
          
          return {
            id: place.place_id || `place_${index}`,
            name: place.name,
            type: place.types?.[0]?.replace('_', ' ') || 'place',
            distance: place.distance || 0.5,
            x,
            y,
            rating: place.rating,
            openNow: place.opening_hours?.open_now,
          };
        });
        setPlaces(arPlaces);
      }
    } catch (error) {
      console.error('Error loading places:', error);
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera access needed for AR</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
        <MenuBar />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <CameraView style={styles.camera}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AR View</Text>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Loading AR data...</Text>
          </View>
        )}

        {/* Real Location Overlays */}
        {places.map((place) => (
          <TouchableOpacity
            key={place.id}
            style={[styles.placeOverlay, { left: place.x, top: place.y }]}
            onPress={() => console.log('Tapped:', place.name)}
          >
            <View style={styles.placeContent}>
              <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
              <Text style={styles.placeType}>{place.type}</Text>
              <View style={styles.placeInfo}>
                <Text style={styles.placeDistance}>{place.distance.toFixed(1)}km</Text>
                {place.rating && (
                  <Text style={styles.placeRating}>★ {place.rating.toFixed(1)}</Text>
                )}
              </View>
              {place.openNow !== undefined && (
                <Text style={[styles.placeStatus, { color: place.openNow ? '#10b981' : '#ef4444' }]}>
                  {place.openNow ? 'Open' : 'Closed'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {places.length > 0 
              ? `Showing ${places.length} nearby places in AR view`
              : 'Point camera around to discover nearby places'
            }
          </Text>
        </View>
      </CameraView>
      
      <MenuBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  permissionText: {
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButton: {
    marginRight: 16,
  },
  backText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  placeOverlay: {
    position: 'absolute',
    alignItems: 'center',
  },
  placeContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 100,
    maxWidth: 140,
  },
  placeName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  placeType: {
    color: '#d1d5db',
    fontSize: 10,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  placeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  placeDistance: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500',
  },
  placeRating: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '600',
  },
  placeStatus: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  instructions: {
    position: 'absolute',
    bottom: 120,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  instructionText: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
});