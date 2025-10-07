import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { analyzeImage, LocationResult } from '../services/api';
import { saveAnalysisResult } from '../services/storage';

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(CameraType.back);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<LocationResult | null>(null);
  const cameraRef = useRef<Camera>(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        await handleImageAnalysis(photo.uri);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      await handleImageAnalysis(result.assets[0].uri);
    }
  };

  const handleImageAnalysis = async (imageUri: string) => {
    setAnalyzing(true);
    try {
      const analysisResult = await analyzeImage(imageUri);
      setResult(analysisResult);
      await saveAnalysisResult(analysisResult);
    } catch (error) {
      Alert.alert('Analysis Failed', 'Could not analyze the image. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  if (result) {
    return (
      <View style={styles.container}>
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Analysis Result</Text>
          <Text style={styles.location}>{result.location}</Text>
          <Text style={styles.confidence}>Confidence: {(result.confidence * 100).toFixed(1)}%</Text>
          
          {result.coordinates && (
            <Text style={styles.coordinates}>
              Lat: {result.coordinates.lat.toFixed(6)}, Lng: {result.coordinates.lng.toFixed(6)}
            </Text>
          )}
          
          {result.details?.address && (
            <Text style={styles.address}>{result.details.address}</Text>
          )}
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => setResult(null)}
          >
            <Text style={styles.buttonText}>Analyze Another</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.flipButton} onPress={() => {
            setType(type === CameraType.back ? CameraType.front : CameraType.back);
          }}>
            <Ionicons name="camera-reverse" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Camera>
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
          <Ionicons name="images" size={24} color="#007AFF" />
          <Text style={styles.controlText}>Gallery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.captureButton, analyzing && styles.analyzing]} 
          onPress={takePicture}
          disabled={analyzing}
        >
          {analyzing ? (
            <Text style={styles.analyzingText}>Analyzing...</Text>
          ) : (
            <Ionicons name="camera" size={32} color="white" />
          )}
        </TouchableOpacity>
        
        <View style={styles.placeholder} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    margin: 20,
  },
  flipButton: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 25,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
  },
  galleryButton: {
    alignItems: 'center',
    padding: 10,
  },
  controlText: {
    marginTop: 5,
    fontSize: 12,
    color: '#007AFF',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzing: {
    backgroundColor: '#666',
  },
  analyzingText: {
    color: 'white',
    fontSize: 12,
  },
  placeholder: {
    width: 50,
  },
  resultContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  location: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  confidence: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  coordinates: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  address: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});