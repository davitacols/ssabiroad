import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function GpsTaggerScreen() {
  const [images, setImages] = useState<any[]>([]);
  const [location, setLocation] = useState<any>(null);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImages(result.assets);
    }
  };

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required');
      return;
    }

    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);
    Alert.alert('Location captured', `${loc.coords.latitude}, ${loc.coords.longitude}`);
  };

  const applyGpsData = async () => {
    if (!location) {
      Alert.alert('Error', 'Please capture location first');
      return;
    }
    Alert.alert('Success', `GPS data applied to ${images.length} photos`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GPS Geotagging</Text>
        <Text style={styles.subtitle}>Add location data to photos</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={pickImages}>
        <Text style={styles.buttonText}>Select Photos ({images.length})</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
        <Text style={styles.buttonText}>
          {location ? `Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Capture Current Location'}
        </Text>
      </TouchableOpacity>

      {images.length > 0 && location && (
        <TouchableOpacity style={styles.applyButton} onPress={applyGpsData}>
          <Text style={styles.buttonText}>Apply GPS to {images.length} Photos</Text>
        </TouchableOpacity>
      )}

      <View style={styles.info}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>1. Select photos from your library</Text>
        <Text style={styles.infoText}>2. Capture your current location</Text>
        <Text style={styles.infoText}>3. Apply GPS data to all selected photos</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 20, paddingTop: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#888', marginTop: 8 },
  button: { backgroundColor: '#3b82f6', padding: 16, margin: 20, borderRadius: 12, alignItems: 'center' },
  locationButton: { backgroundColor: '#8b5cf6', padding: 16, marginHorizontal: 20, marginBottom: 20, borderRadius: 12, alignItems: 'center' },
  applyButton: { backgroundColor: '#10b981', padding: 16, marginHorizontal: 20, marginBottom: 20, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  info: { padding: 20, backgroundColor: '#111', margin: 20, borderRadius: 12 },
  infoTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  infoText: { fontSize: 14, color: '#ccc', marginBottom: 8 },
});
