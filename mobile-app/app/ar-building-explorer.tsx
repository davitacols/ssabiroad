import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, Dimensions, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface BuildingData {
  id: string;
  name: string;
  address: string;
  architecturalStyle: string;
  yearBuilt: number;
  height: number;
  floors: number;
  materials: string[];
  historicalSignificance: string;
  propertyValue: number;
  energyRating: string;
  structuralCondition: string;
  latitude: number;
  longitude: number;
  distance: number;
  bearing: number;
}

export default function ARBuildingExplorer() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState<any>(null);
  const [heading, setHeading] = useState(0);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [measureMode, setMeasureMode] = useState(false);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [showInfo, setShowInfo] = useState(true);
  const [arMode, setArMode] = useState<'overlay' | 'measure' | 'compare'>('overlay');
  const [analyzing, setAnalyzing] = useState(false);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    initAR();
  }, []);

  useEffect(() => {
    if (location) {
      loadBuildingData();
    }
  }, [location]);

  const initAR = async () => {
    const { status: camStatus } = await requestPermission();
    if (camStatus !== 'granted') {
      Alert.alert('Permission Required', 'Camera access needed for AR Building Explorer');
      return;
    }

    const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
    if (locStatus !== 'granted') {
      Alert.alert('Permission Required', 'Location access needed for AR Building Explorer');
      return;
    }

    startLocationTracking();
    loadBuildingData();
  };

  const startLocationTracking = async () => {
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setLocation(loc.coords);

    Location.watchHeadingAsync((headingData) => {
      setHeading(headingData.trueHeading);
    });

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      (newLoc) => {
        setLocation(newLoc.coords);
        updateBuildingDistances(newLoc.coords);
      }
    );
  };

  const loadBuildingData = async () => {
    if (!location) return;
    
    try {
      const response = await fetch(
        `https://ssabiroad.vercel.app/api/nearby-buildings?latitude=${location.latitude}&longitude=${location.longitude}&radius=2`
      );
      
      if (!response.ok) {
        console.log('API returned error status:', response.status);
        return;
      }
      
      const data = await response.json();
      
      if (data.buildings && data.buildings.length > 0) {
        const buildingsWithBearing = data.buildings.map((b: any) => ({
          ...b,
          id: b.id || `building_${Date.now()}`,
          name: b.name || 'Building',
          address: b.address || 'Unknown address',
          architecturalStyle: 'Contemporary',
          yearBuilt: 2000,
          height: 30,
          floors: 5,
          materials: ['Concrete', 'Glass'],
          historicalSignificance: 'Local Building',
          propertyValue: 0,
          energyRating: 'C',
          structuralCondition: 'Good',
          bearing: calculateBearing(location.latitude, location.longitude, b.latitude, b.longitude),
        }));
        setBuildings(buildingsWithBearing);
      }
    } catch (error) {
      console.log('No buildings loaded - tap screen to analyze');
    }
  };

  const updateBuildingDistances = (currentLoc: any) => {
    const updated = buildings.map(building => ({
      ...building,
      distance: calculateDistance(
        currentLoc.latitude,
        currentLoc.longitude,
        building.latitude,
        building.longitude
      ),
      bearing: calculateBearing(
        currentLoc.latitude,
        currentLoc.longitude,
        building.latitude,
        building.longitude
      ),
    }));
    setBuildings(updated);
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

  const getARPosition = (bearing: number, distance: number) => {
    const relativeBearing = (bearing - heading + 360) % 360;
    const screenX = width / 2 + (relativeBearing - 180) * 2;
    const screenY = height * 0.5 - (1 / distance) * 100;
    const isVisible = relativeBearing > 90 && relativeBearing < 270;
    return { left: screenX, top: screenY, isVisible };
  };

  const analyzeBuilding = async () => {
    if (analyzing) return;
    
    setAnalyzing(true);
    try {
      if (!cameraRef.current || !location) {
        Alert.alert('Error', 'Camera or location not ready');
        setAnalyzing(false);
        return;
      }

      console.log('📸 Taking picture for analysis...');
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      console.log('📸 Photo captured:', photo.uri);
      
      const formData = new FormData();
      formData.append('image', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'building.jpg',
      } as any);
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());

      console.log('🚀 Sending to API...');
      const response = await fetch('https://ssabiroad.vercel.app/api/ar-building-analysis', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('📦 Response status:', response.status);
      
      let analysis;
      if (response.ok) {
        analysis = await response.json();
        console.log('📦 Analysis result:', analysis);
      } else {
        console.log('⚠️ API failed, using mock data');
        // Fallback to mock data if API fails
        analysis = {
          id: `building_${Date.now()}`,
          name: 'Detected Building',
          address: 'Address not available',
          architecturalStyle: 'Contemporary',
          yearBuilt: 2020,
          height: 30,
          floors: 5,
          materials: ['Concrete', 'Glass'],
          historicalSignificance: 'Local Building',
          propertyValue: 0,
          energyRating: 'C',
          structuralCondition: 'Good',
          latitude: location.latitude,
          longitude: location.longitude,
        };
      }
      
      const newBuilding: BuildingData = {
        id: analysis.id || `building_${Date.now()}`,
        name: analysis.name || 'Detected Building',
        address: analysis.address || 'Unknown address',
        architecturalStyle: analysis.architecturalStyle || 'Contemporary',
        yearBuilt: analysis.yearBuilt || 2000,
        height: analysis.height || 30,
        floors: analysis.floors || 5,
        materials: analysis.materials || ['Concrete', 'Glass'],
        historicalSignificance: analysis.historicalSignificance || 'Local Building',
        propertyValue: analysis.propertyValue || 0,
        energyRating: analysis.energyRating || 'C',
        structuralCondition: analysis.structuralCondition || 'Good',
        latitude: analysis.latitude || location.latitude,
        longitude: analysis.longitude || location.longitude,
        distance: 0.1,
        bearing: heading,
      };
      setBuildings([newBuilding, ...buildings]);
      setSelectedBuilding(newBuilding);
      Alert.alert('Building Detected', newBuilding.name);
    } catch (error: any) {
      console.error('❌ Analysis error:', error);
      console.error('Error message:', error.message);
      Alert.alert('Error', error.message || 'Failed to analyze building');
    } finally {
      setAnalyzing(false);
    }
  };

  const captureARView = async () => {
    try {
      const uri = await captureRef(cameraRef, {
        format: 'png',
        quality: 1,
      });
      Alert.alert('Success', 'AR view captured!');
      await AsyncStorage.setItem(`ar_capture_${Date.now()}`, uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to capture AR view');
    }
  };

  const toggleMeasureMode = () => {
    setMeasureMode(!measureMode);
    setArMode(measureMode ? 'overlay' : 'measure');
  };

  const addMeasurement = (point: { x: number; y: number }) => {
    setMeasurements([...measurements, point]);
    if (measurements.length >= 1) {
      const distance = Math.sqrt(
        Math.pow(point.x - measurements[0].x, 2) + 
        Math.pow(point.y - measurements[0].y, 2)
      );
      Alert.alert('Measurement', `Distance: ${(distance * 0.1).toFixed(2)}m`);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.permissionContainer}>
          <Ionicons name="cube-outline" size={64} color="#6b7280" />
          <Text style={styles.permissionText}>Camera permission required for AR Building Explorer</Text>
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
      
      <CameraView style={styles.camera} ref={cameraRef}>
        {/* Tap to Analyze Overlay */}
        <TouchableOpacity 
          style={styles.tapOverlay} 
          onPress={analyzeBuilding}
          activeOpacity={1}
        >
          {analyzing && (
            <View style={styles.analyzingIndicator}>
              <Text style={styles.analyzingText}>Analyzing...</Text>
            </View>
          )}
        </TouchableOpacity>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AR Building Explorer</Text>
          <TouchableOpacity onPress={captureARView} style={styles.captureButton}>
            <Ionicons name="camera" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity 
            style={[styles.modeButton, arMode === 'overlay' && styles.modeButtonActive]}
            onPress={() => setArMode('overlay')}
          >
            <Ionicons name="eye" size={20} color={arMode === 'overlay' ? '#ffffff' : '#9ca3af'} />
            <Text style={[styles.modeText, arMode === 'overlay' && styles.modeTextActive]}>Overlay</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeButton, arMode === 'measure' && styles.modeButtonActive]}
            onPress={toggleMeasureMode}
          >
            <Ionicons name="resize" size={20} color={arMode === 'measure' ? '#ffffff' : '#9ca3af'} />
            <Text style={[styles.modeText, arMode === 'measure' && styles.modeTextActive]}>Measure</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeButton, arMode === 'compare' && styles.modeButtonActive]}
            onPress={() => setArMode('compare')}
          >
            <Ionicons name="git-compare" size={20} color={arMode === 'compare' ? '#ffffff' : '#9ca3af'} />
            <Text style={[styles.modeText, arMode === 'compare' && styles.modeTextActive]}>Compare</Text>
          </TouchableOpacity>
        </View>

        {/* Compass */}
        <View style={styles.compass}>
          <Ionicons name="compass" size={20} color="#ffffff" />
          <Text style={styles.compassText}>{Math.round(heading)}°</Text>
        </View>

        {/* AR Building Overlays */}
        {arMode === 'overlay' && (
          <View style={styles.arContainer}>
            {buildings.map((building) => {
              const position = getARPosition(building.bearing, building.distance);
              if (!position.isVisible) return null;

              return (
                <TouchableOpacity
                  key={building.id}
                  style={[styles.buildingMarker, { left: position.left, top: position.top }]}
                  onPress={() => setSelectedBuilding(building)}
                >
                  <View style={styles.markerIcon}>
                    <Ionicons name="business" size={24} color="#ffffff" />
                  </View>
                  <View style={styles.markerInfo}>
                    <Text style={styles.markerName} numberOfLines={1}>{building.name}</Text>
                    <Text style={styles.markerDetail}>{building.architecturalStyle}</Text>
                    <Text style={styles.markerDistance}>
                      {building.distance < 1 
                        ? `${Math.round(building.distance * 1000)}m` 
                        : `${building.distance.toFixed(1)}km`}
                    </Text>
                  </View>
                  <View style={styles.markerLine} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Measurement Overlay */}
        {arMode === 'measure' && (
          <View style={styles.measureOverlay}>
            <View style={styles.crosshair}>
              <View style={styles.crosshairH} />
              <View style={styles.crosshairV} />
            </View>
            <Text style={styles.measureHint}>Tap to measure building dimensions</Text>
          </View>
        )}

        {/* Info Panel */}
        {showInfo && (
          <View style={styles.infoPanel}>
            <View style={styles.infoPanelHeader}>
              <Ionicons name="information-circle" size={20} color="#6366f1" />
              <Text style={styles.infoPanelTitle}>Tap to Analyze</Text>
              <TouchableOpacity onPress={() => setShowInfo(false)}>
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.infoPanelText}>
              Point camera at a building and tap anywhere to analyze it
            </Text>
          </View>
        )}

        {/* Buildings Found Panel */}
        {buildings.length > 0 && (
          <View style={styles.buildingsPanel}>
            <Ionicons name="business" size={16} color="#6366f1" />
            <Text style={styles.buildingsPanelText}>
              {buildings.length} building{buildings.length > 1 ? 's' : ''} detected
            </Text>
          </View>
        )}

        {/* Bottom Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={analyzeBuilding}>
            <Ionicons name="scan" size={24} color="#ffffff" />
            <Text style={styles.controlText}>Analyze</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={() => loadBuildingData()}>
            <Ionicons name="refresh" size={24} color="#ffffff" />
            <Text style={styles.controlText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={captureARView}>
            <Ionicons name="share-social" size={24} color="#ffffff" />
            <Text style={styles.controlText}>Share</Text>
          </TouchableOpacity>
        </View>
      </CameraView>

      {/* Building Details Modal */}
      <Modal
        visible={selectedBuilding !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedBuilding(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedBuilding?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedBuilding(null)}>
                <Ionicons name="close" size={28} color="#000000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>{selectedBuilding?.address}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Architectural Style</Text>
                <Text style={styles.detailValue}>{selectedBuilding?.architecturalStyle}</Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Year Built</Text>
                  <Text style={styles.detailValue}>{selectedBuilding?.yearBuilt}</Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Floors</Text>
                  <Text style={styles.detailValue}>{selectedBuilding?.floors}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Materials</Text>
                <View style={styles.materialTags}>
                  {selectedBuilding?.materials.map((material, index) => (
                    <View key={index} style={styles.materialTag}>
                      <Text style={styles.materialText}>{material}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Historical Significance</Text>
                <Text style={styles.detailValue}>{selectedBuilding?.historicalSignificance}</Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Energy Rating</Text>
                  <Text style={styles.detailValue}>{selectedBuilding?.energyRating}</Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Condition</Text>
                  <Text style={styles.detailValue}>{selectedBuilding?.structuralCondition}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="bookmark-outline" size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>Save Building</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]}>
                <Ionicons name="document-text-outline" size={20} color="#6366f1" />
                <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Generate Report</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  captureButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  modeSelector: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: '#6366f1',
  },
  modeText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#ffffff',
  },
  compass: {
    position: 'absolute',
    top: 180,
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
  },
  arContainer: {
    flex: 1,
    position: 'relative',
  },
  buildingMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  markerInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    minWidth: 140,
    alignItems: 'center',
  },
  markerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  markerDetail: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
  },
  markerDistance: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  markerLine: {
    width: 2,
    height: 40,
    backgroundColor: '#6366f1',
    marginTop: 8,
  },
  measureOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshair: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairH: {
    width: 60,
    height: 2,
    backgroundColor: '#6366f1',
  },
  crosshairV: {
    width: 2,
    height: 60,
    backgroundColor: '#6366f1',
    position: 'absolute',
  },
  measureHint: {
    marginTop: 20,
    fontSize: 14,
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 140,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
  },
  infoPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoPanelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginLeft: 8,
    flex: 1,
  },
  infoPanelText: {
    fontSize: 13,
    color: '#6b7280',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    padding: 16,
  },
  controlButton: {
    alignItems: 'center',
    gap: 6,
  },
  controlText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.8,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  modalScroll: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
  },
  materialTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  materialTag: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  materialText: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 8,
  },
  actionButtonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionButtonTextSecondary: {
    color: '#6366f1',
  },
  tapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  analyzingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -30 }],
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    borderRadius: 16,
    padding: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  analyzingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  buildingsPanel: {
    position: 'absolute',
    top: 180,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  buildingsPanelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },
});
