import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const cameraRef = useRef<CameraView>(null);

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      
      if (photo) {
        setSelectedImage(photo.uri);
        analyzeImage(photo.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1.0,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  const analyzeImage = async (imageUri: string) => {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);

      const response = await axios.post('https://ssabiroad.vercel.app/api/location-recognition-v2', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      const result = response.data;
      
      console.log('API Response:', result);
      
      if (!result.success) {
        console.log('Analysis failed, showing error with fallback data');
        // Show error but still display what we can extract
        const fallbackData = {
          location: {
            name: 'Location Analysis Failed',
            address: result.error || 'Unable to analyze image',
            coordinates: { lat: 0, lng: 0 },
            confidence: 0,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            gpsData: result.gps_data || 'Checking...',
            camera: result.camera_info || 'Unknown',
            resolution: result.image_resolution || 'Unknown',
          },
          suggestions: [],
        };
        setAnalysisData(fallbackData);
        setShowAnalysis(true);
        return;
      }
      
      const analysisData = {
        location: {
          name: result.location?.name || result.name || 'Unknown Location',
          address: result.location?.address || result.address || 'Address not found',
          coordinates: result.location?.coordinates || result.coordinates || { lat: 0, lng: 0 },
          confidence: result.confidence || 0,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          gpsData: result.gps_data || 'Not available',
          camera: result.camera_info || 'Unknown',
          resolution: result.image_resolution || 'Unknown',
        },
        suggestions: result.nearby_places || result.suggestions || [],
      };

      setAnalysisData(analysisData);
      setShowAnalysis(true);
    } catch (error) {
      console.error('API Error:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        Alert.alert('API Error', `Status: ${error.response.status}\n${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        Alert.alert('Network Error', 'No response from server');
      } else {
        console.error('Request setup error:', error.message);
        Alert.alert('Error', error.message);
      }
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera" size={64} color="#9ca3af" />
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionText}>
            Pic2Nav needs camera access to analyze photos and identify locations
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.overlay}>
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              Point camera at a location or upload an existing photo
            </Text>
          </View>

          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Ionicons name="images" size={28} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <Ionicons name="camera" size={32} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.placeholder} />
          </View>
        </View>
      </CameraView>

      <Modal visible={showAnalysis} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAnalysis(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Location Analysis</Text>
            <TouchableOpacity>
              <Ionicons name="share" size={24} color="#2563eb" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.analysisImage} />
            )}

            {analysisData && (
              <>
                <View style={styles.resultSection}>
                  <Text style={styles.sectionTitle}>Identified Location</Text>
                  <View style={styles.locationCard}>
                    <Ionicons name="location" size={24} color="#2563eb" />
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationName}>{analysisData.location.name}</Text>
                      <Text style={styles.locationAddress}>{analysisData.location.address}</Text>
                      <Text style={styles.confidence}>
                        Confidence: {Math.round(analysisData.location.confidence * 100)}%
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.resultSection}>
                  <Text style={styles.sectionTitle}>Photo Metadata</Text>
                  <View style={styles.metadataCard}>
                    <View style={styles.metadataRow}>
                      <Text style={styles.metadataLabel}>GPS Data:</Text>
                      <Text style={styles.metadataValue}>{analysisData.metadata.gpsData}</Text>
                    </View>
                    <View style={styles.metadataRow}>
                      <Text style={styles.metadataLabel}>Camera:</Text>
                      <Text style={styles.metadataValue}>{analysisData.metadata.camera}</Text>
                    </View>
                    <View style={styles.metadataRow}>
                      <Text style={styles.metadataLabel}>Resolution:</Text>
                      <Text style={styles.metadataValue}>{analysisData.metadata.resolution}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.resultSection}>
                  <Text style={styles.sectionTitle}>Nearby Locations</Text>
                  {analysisData.suggestions.map((suggestion: string, index: number) => (
                    <View key={index} style={styles.suggestionItem}>
                      <Ionicons name="navigate" size={16} color="#6b7280" />
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.saveButton}>
                    <Ionicons name="bookmark" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Save Location</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editButton}>
                    <Ionicons name="create" size={20} color="#2563eb" />
                    <Text style={styles.editButtonText}>Edit EXIF</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 20,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    paddingTop: 60,
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 20,
  },
  instructions: {
    position: 'absolute',
    top: '40%',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 8,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  uploadButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#2563eb',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 60,
    height: 60,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  modalContent: {
    flex: 1,
  },
  analysisImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  resultSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  confidence: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  metadataCard: {
    gap: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metadataLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  metadataValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
    gap: 8,
  },
  editButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
});