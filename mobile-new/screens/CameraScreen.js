import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function CameraScreen() {
  const [photo, setPhoto] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to use this feature.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
        analyzeImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to use this feature.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
        analyzeImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const analyzeImage = async (imageAsset) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageAsset.uri,
        type: 'image/jpeg',
        name: 'image.jpg',
      });
      formData.append('latitude', '0');
      formData.append('longitude', '0');

      const response = await fetch('https://ssabiroad.vercel.app/api/location-recognition-v2', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
      
      // Save to history
      await saveToHistory(data, 'image.jpg');
    } catch (error) {
      console.error('Upload error:', error);
      setResult({ error: 'Failed to analyze location' });
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = async (result, filename) => {
    try {
      const historyItem = {
        id: Date.now(),
        filename,
        result,
        timestamp: new Date().toISOString(),
      };
      
      // Note: localStorage doesn't exist in React Native
      // You might want to use AsyncStorage instead
      console.log('History item:', historyItem);
    } catch (error) {
      console.log('Failed to save to history');
    }
  };

  const resetApp = () => {
    setPhoto(null);
    setResult(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pic2Nav Camera</Text>
      
      {!photo ? (
        <View style={styles.uploadContainer}>
          <Text style={styles.text}>Upload a photo to identify location</Text>
          <TouchableOpacity 
            style={styles.button} 
            onPress={pickImage}
          >
            <Text style={styles.buttonText}>Choose from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, { marginTop: 15 }]} 
            onPress={takePhoto}
          >
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.preview}>
          <Image source={{ uri: photo }} style={styles.image} />
          
          {loading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>🔍 Analyzing location...</Text>
            </View>
          )}
          
          {result && !loading && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>📍 Location Result</Text>
              <Text style={styles.resultText}>
                {result.success 
                  ? result.address || result.name || 'Location detected'
                  : result.error || 'Could not identify location'
                }
              </Text>
              {result.confidence && (
                <Text style={styles.confidenceText}>
                  Confidence: {Math.round(result.confidence * 100)}%
                </Text>
              )}
            </View>
          )}
          
          <TouchableOpacity style={styles.button} onPress={resetApp}>
            <Text style={styles.buttonText}>Take Another Photo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  uploadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 15,
    marginBottom: 20,
  },
  loadingContainer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#007AFF',
    fontSize: 16,
  },
  resultContainer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  resultTitle: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 10,
  },
  confidenceText: {
    color: '#ccc',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});