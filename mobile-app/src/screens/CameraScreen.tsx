import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { VisionService } from '../services/VisionService';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef<any>(null);

  if (!permission) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const captureAndAnalyze = async () => {
    if (!cameraRef.current || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Location permission required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const photo = await cameraRef.current.takePictureAsync();
      
      const result = await VisionService.analyzeBuilding(photo.uri, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      Alert.alert('Analysis Complete', `Building: ${result.buildingInfo.name}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze building');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef}>
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <Text style={styles.title}>Point at a building</Text>
          </View>
          <View style={styles.bottomBar}>
            <TouchableOpacity 
              style={[styles.captureButton, isAnalyzing && styles.captureButtonDisabled]} 
              onPress={captureAndAnalyze}
              disabled={isAnalyzing}
            >
              <Ionicons name="camera" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bottomBar: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  message: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});