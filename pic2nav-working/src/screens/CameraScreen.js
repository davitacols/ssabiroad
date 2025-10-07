import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CameraScreen({ navigation }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const analyzeImage = async (imageUri, exifData) => {
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      });

      // Mock response for testing
      const mockResult = {
        location: 'Sample Location',
        confidence: 0.85,
        coordinates: { lat: 40.7128, lng: -74.0060 },
        details: 'Mock analysis result for testing'
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = mockResult;


      
      // Save to history
      const historyItem = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        image: imageUri,
        result: result,
        exif: exifData,
      };
      
      const existingHistory = await AsyncStorage.getItem('analysisHistory');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      history.unshift(historyItem);
      await AsyncStorage.setItem('analysisHistory', JSON.stringify(history.slice(0, 50))); // Keep last 50

      navigation.navigate('Result', { result: historyItem });
    } catch (error) {
      console.log('Full error:', error);
      Alert.alert('API Error', `Server returned error 500. The API may be temporarily unavailable. Please try again later.\n\nError: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      exif: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      await analyzeImage(result.assets[0].uri, result.assets[0].exif);
    }
  };

  const selectPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      exif: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      await analyzeImage(result.assets[0].uri, result.assets[0].exif);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      Alert.alert('Current Location', 
        `Lat: ${location.coords.latitude.toFixed(6)}\nLng: ${location.coords.longitude.toFixed(6)}`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Photo Analysis</Text>
        <Text style={styles.subtitle}>Take or select a photo to analyze</Text>
      </View>

      <View style={styles.content}>
        {selectedImage && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]} 
            onPress={takePhoto}
            disabled={analyzing}
          >
            <Ionicons name="camera" size={24} color="white" />
            <Text style={styles.primaryButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]} 
            onPress={selectPhoto}
            disabled={analyzing}
          >
            <Ionicons name="images" size={24} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>Select from Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]} 
            onPress={getCurrentLocation}
          >
            <Ionicons name="location" size={24} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>Get Current Location</Text>
          </TouchableOpacity>
        </View>

        {analyzing && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Analyzing image...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  imagePreview: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  buttonContainer: {
    gap: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});