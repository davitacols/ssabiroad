import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
// import * as Location from 'expo-location'; // Disabled to force image analysis
import { LocationService } from '../services/LocationService';

export default function CameraScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const analyzePhoto = async (photo: any) => {
    setIsAnalyzing(true);
    
    try {
      // Don't get location - force image analysis only
      const result = await LocationService.analyzePhoto(photo, null);
      
      navigation.navigate('Result', { result, photo });
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Error', 'Failed to analyze photo. Please check your internet connection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || isAnalyzing) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      await analyzePhoto(photo);
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const pickFromGallery = async () => {
    if (isAnalyzing) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1.0,
      });

      if (!result.canceled && result.assets[0]) {
        await analyzePhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to pick photo from gallery.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} ref={cameraRef} />
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.galleryButton, isAnalyzing && styles.analyzing]}
            onPress={pickFromGallery}
            disabled={isAnalyzing}
          >
            <Text style={styles.buttonText}>Gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.captureButton, isAnalyzing && styles.analyzing]}
            onPress={takePicture}
            disabled={isAnalyzing}
          >
            <Text style={styles.captureText}>
              {isAnalyzing ? 'Analyzing...' : 'Capture'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 50,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
  captureButton: {
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 50,
    width: 80,
    height: 80,
  },
  galleryButton: {
    alignItems: 'center',
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 25,
    minWidth: 80,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  analyzing: {
    backgroundColor: '#666',
  },
  captureText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});