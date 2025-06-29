import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as ImageManipulator from 'expo-image-manipulator';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [result, setResult] = useState(null);
  const cameraRef = useRef(null);

  if (!permission) {
    return <Text>Loading...</Text>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need camera permission</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.text}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      
      // Take photo with GPS data preserved
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        exif: true,
        base64: false
      });

      // Add GPS to EXIF data
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false
        }
      );

      setPhoto(manipulatedImage.uri);
      
      // Send to API with GPS data
      await analyzeImage(manipulatedImage.uri, location.coords);
    }
  };

  const analyzeImage = async (imageUri, coords) => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg'
    });
    formData.append('latitude', coords.latitude.toString());
    formData.append('longitude', coords.longitude.toString());

    try {
      const response = await fetch('https://ssabiroad.vercel.app/api/location-recognition-v2', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze image');
    }
  };



  return (
    <View style={styles.container}>
      <Text style={styles.title}>SSABiRoad Mobile</Text>
      
      {!photo ? (
        <CameraView style={styles.camera} ref={cameraRef} facing="back">
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={takePicture}>
              <Text style={styles.text}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      ) : (
        <View style={styles.preview}>
          <Image source={{ uri: photo }} style={styles.image} />
          {result && (
            <View style={styles.result}>
              <Text style={styles.resultText}>
                {result.success ? result.address || result.name : result.error}
              </Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => { setPhoto(null); setResult(null); }}
          >
            <Text style={styles.text}>Take Another</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 24, textAlign: 'center', marginTop: 50 },
  camera: { flex: 1, margin: 20 },
  buttonContainer: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', marginBottom: 50 },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10 },
  text: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  preview: { flex: 1, padding: 20 },
  image: { width: '100%', height: 300, borderRadius: 10 },
  result: { backgroundColor: '#333', padding: 15, borderRadius: 10, marginTop: 10 },
  resultText: { color: '#fff', fontSize: 16 }
});