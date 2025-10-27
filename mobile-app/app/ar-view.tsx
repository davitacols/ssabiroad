import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function ARViewScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState<any>(null);
  const [heading, setHeading] = useState(0);
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [nearbyLocations, setNearbyLocations] = useState<any[]>([]);

  useEffect(() => {
    initAR();
  }, []);

  const initAR = async () => {
    const { status: camStatus } = await requestPermission();
    if (camStatus !== 'granted') {
      Alert.alert('Permission Required', 'Camera access needed for AR view');
      return;
    }

    const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
    if (locStatus !== 'granted') {
      Alert.alert('Permission Required', 'Location access needed for AR view');
      return;
    }

    loadSavedLocations();
    startLocationTracking();
  };

  const loadSavedLocations = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedLocations');
      if (saved) {
        setSavedLocations(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const startLocationTracking = async () => {
    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);
    findNearbyLocations(loc.coords);

    Location.watchHeadingAsync((headingData) => {
      setHeading(headingData.trueHeading);
    });

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 10 },
      (newLoc) => {
        setLocation(newLoc.coords);
        findNearbyLocations(newLoc.coords);
      }
    );
  };

  const findNearbyLocations = (currentLoc: any) => {
    const nearby = savedLocations
      .map(loc => ({
        ...loc,
        distance: calculateDistance(
          currentLoc.latitude,
          currentLoc.longitude,
          loc.latitude,
          loc.longitude
        ),
        bearing: calculateBearing(
          currentLoc.latitude,
          currentLoc.longitude,
          loc.latitude,
          loc.longitude
        ),
      }))
      .filter(loc => loc.distance < 5)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);

    setNearbyLocations(nearby);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

  const getARPosition = (bearing: number) => {
    const relativeBearing = (bearing - heading + 360) % 360;
    const screenPosition = (relativeBearing / 90) * (width / 2);
    const isVisible = relativeBearing > 270 || relativeBearing < 90;
    return { left: screenPosition, isVisible };
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#6b7280" />
          <Text style={styles.permissionText}>Camera permission required</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <CameraView style={styles.camera}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AR View</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Compass */}
        <View style={styles.compass}>
          <Ionicons name="compass" size={20} color="#ffffff" />
          <Text style={styles.compassText}>{Math.round(heading)}°</Text>
        </View>

        {/* AR Overlays */}
        <View style={styles.arContainer}>
          {nearbyLocations.map((loc, index) => {
            const position = getARPosition(loc.bearing);
            if (!position.isVisible) return null;

            return (
              <View
                key={index}
                style={[
                  styles.arMarker,
                  {
                    left: position.left,
                    top: height * 0.4 - (loc.distance * 20),
                  },
                ]}
              >
                <View style={styles.markerIcon}>
                  <Ionicons name="location" size={24} color="#ffffff" />
                </View>
                <View style={styles.markerInfo}>
                  <Text style={styles.markerName} numberOfLines={1}>
                    {loc.name || 'Location'}
                  </Text>
                  <Text style={styles.markerDistance}>
                    {loc.distance < 1 
                      ? `${Math.round(loc.distance * 1000)}m` 
                      : `${loc.distance.toFixed(1)}km`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Info Panel */}
        <View style={styles.infoPanel}>
          <View style={styles.infoHeader}>
            <Ionicons name="location" size={20} color="#6366f1" />
            <Text style={styles.infoTitle}>Nearby Locations</Text>
          </View>
          <Text style={styles.infoText}>
            {nearbyLocations.length > 0 
              ? `${nearbyLocations.length} location${nearbyLocations.length > 1 ? 's' : ''} within 5km`
              : 'No saved locations nearby'}
          </Text>
          {nearbyLocations.length === 0 && (
            <Text style={styles.infoHint}>
              Save locations to see them in AR view
            </Text>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <View style={styles.instructionItem}>
            <Ionicons name="phone-portrait" size={16} color="#ffffff" />
            <Text style={styles.instructionText}>Move your phone around</Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="eye" size={16} color="#ffffff" />
            <Text style={styles.instructionText}>Look for location markers</Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'LeagueSpartan_700Bold',
  },
  placeholder: {
    width: 40,
  },
  compass: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compassText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'LeagueSpartan_700Bold',
  },
  arContainer: {
    flex: 1,
    position: 'relative',
  },
  arMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  markerName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  markerDistance: {
    fontSize: 11,
    color: '#9ca3af',
    fontFamily: 'LeagueSpartan_400Regular',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginLeft: 8,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'LeagueSpartan_400Regular',
  },
  infoHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    fontFamily: 'LeagueSpartan_400Regular',
  },
  instructions: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#ffffff',
    fontFamily: 'LeagueSpartan_400Regular',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'LeagueSpartan_400Regular',
  },
  permissionButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  permissionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'LeagueSpartan_700Bold',
  },
});
