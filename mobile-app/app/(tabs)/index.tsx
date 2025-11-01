import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, StatusBar } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { analyzeLocation } from '../../services/api';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const handleTakePhoto = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    setShowCamera(true);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      exif: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      await processImage(result.assets[0].uri, result.assets[0].exif);
    }
  };

  const processImage = async (uri: string, exif?: any) => {
    setLoading(true);
    try {
      // Get device location
      let location = null;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        location = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        console.log('Device location:', location);
      }
      
      console.log('Processing image:', uri);
      const data = await analyzeLocation(uri, location);
      console.log('API Response:', data);
      setResult(data);
    } catch (error: any) {
      console.error('Full error:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to process image';
      setResult({ error: errorMsg, details: error.response?.data });
    } finally {
      setLoading(false);
    }
  };

  if (showCamera) {
    return (
      <CameraView style={styles.camera}>
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={async () => {
              // Capture photo logic
              setShowCamera(false);
            }}
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </View>
      </CameraView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafaf9" />
      
      {/* Gradient blobs background */}
      <View style={styles.blobContainer}>
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
        <View style={[styles.blob, styles.blob3]} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.heroTitle}>
            <Text style={styles.heroText}>Turn photos into{"\n"}</Text>
            <Text style={styles.heroGradient}>locations{"\n"}</Text>
            <Text style={styles.heroText}>instantly</Text>
          </Text>
          <Text style={styles.subtitle}>Upload any image and discover where it was taken</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleTakePhoto}>
            <Text style={styles.buttonIcon}>📷</Text>
            <Text style={styles.buttonText}>Start Scanning</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handlePickImage}>
            <Text style={styles.buttonIcon}>🖼️</Text>
            <Text style={styles.secondaryButtonText}>Choose Photo</Text>
          </TouchableOpacity>
        </View>

        {image && (
          <View style={styles.imageContainer}>
            <View style={styles.imageGlow} />
            <Image source={{ uri: image }} style={styles.image} />
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Analyzing location...</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultCard}>
            {result.error ? (
              <>
                <Text style={styles.errorTitle}>⚠️ Error</Text>
                <Text style={styles.errorText}>{result.error}</Text>
              </>
            ) : (
              <>
                <Text style={styles.resultTitle}>📍 Location Found</Text>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>ADDRESS</Text>
                  <Text style={styles.resultValue}>{result.address || 'N/A'}</Text>
                </View>
                {result.location && (
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>COORDINATES</Text>
                    <Text style={styles.resultValue}>{result.location.latitude.toFixed(6)}, {result.location.longitude.toFixed(6)}</Text>
                  </View>
                )}
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{Math.round(result.confidence * 100)}% Accuracy</Text>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  blobContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 9999, opacity: 0.15 },
  blob1: { top: -100, right: -100, width: 400, height: 400, backgroundColor: '#60a5fa' },
  blob2: { bottom: -150, left: -100, width: 350, height: 350, backgroundColor: '#a78bfa' },
  blob3: { top: '40%', left: '30%', width: 300, height: 300, backgroundColor: '#f472b6' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { padding: 24, paddingTop: 60, alignItems: 'center' },
  logo: { width: 120, height: 120, marginBottom: 24 },
  heroTitle: { textAlign: 'center', marginBottom: 16 },
  heroText: { fontSize: 36, fontWeight: '800', color: '#1c1917', letterSpacing: -1 },
  heroGradient: { fontSize: 36, fontWeight: '800', color: '#3b82f6', letterSpacing: -1 },
  subtitle: { fontSize: 17, color: '#78716c', marginTop: 8, textAlign: 'center', paddingHorizontal: 20, lineHeight: 26 },
  actions: { padding: 20, gap: 12 },
  primaryButton: { backgroundColor: '#1c1917', padding: 20, borderRadius: 9999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  secondaryButton: { backgroundColor: '#f5f5f4', padding: 20, borderRadius: 9999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 1, borderColor: '#e7e5e4' },
  buttonIcon: { fontSize: 22 },
  buttonText: { color: '#fff', fontSize: 17, fontFamily: 'LeagueSpartan_700Bold' },
  secondaryButtonText: { color: '#1c1917', fontSize: 17, fontFamily: 'LeagueSpartan_700Bold' },
  imageContainer: { padding: 20, position: 'relative' },
  imageGlow: { position: 'absolute', top: 16, left: 16, right: 16, bottom: 16, backgroundColor: '#3b82f6', opacity: 0.2, borderRadius: 24, transform: [{ scale: 1.05 }] },
  image: { width: '100%', height: 300, borderRadius: 20, borderWidth: 1, borderColor: '#e7e5e4' },
  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#78716c', fontFamily: 'LeagueSpartan_600SemiBold' },
  resultCard: { margin: 20, padding: 24, backgroundColor: '#fff', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 6, borderWidth: 1, borderColor: '#f5f5f4' },
  resultTitle: { fontSize: 24, fontWeight: '800', color: '#1c1917', marginBottom: 24 },
  resultItem: { marginBottom: 20 },
  resultLabel: { fontSize: 11, color: '#78716c', fontFamily: 'LeagueSpartan_700Bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  resultValue: { fontSize: 16, color: '#1c1917', lineHeight: 24, fontFamily: 'LeagueSpartan_600SemiBold' },
  badge: { marginTop: 20, backgroundColor: '#dcfce7', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 9999, alignSelf: 'flex-start' },
  badgeText: { color: '#166534', fontSize: 14, fontFamily: 'LeagueSpartan_700Bold' },
  errorTitle: { fontSize: 24, fontWeight: '800', color: '#dc2626', marginBottom: 12 },
  errorText: { fontSize: 16, color: '#78716c', lineHeight: 24 },
  camera: { flex: 1 },
  cameraControls: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff', padding: 5 },
  captureInner: { flex: 1, borderRadius: 30, backgroundColor: '#1c1917' },
});
