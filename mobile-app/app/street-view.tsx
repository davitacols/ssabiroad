import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

export default function StreetViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<any>(null);
  const [timestamp, setTimestamp] = useState<string>('');

  useEffect(() => {
    if (params.lat && params.lng) {
      setLocation({ latitude: parseFloat(params.lat as string), longitude: parseFloat(params.lng as string) });
    } else {
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch (error) {
      Alert.alert('Error', 'Could not get location');
    }
  };

  const streetViewHTML = location ? `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
          #map { height: 100%; width: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho"></script>
        <script>
          function initialize() {
            const location = { lat: ${location.latitude}, lng: ${location.longitude} };
            const sv = new google.maps.StreetViewService();
            sv.getPanorama({ location, radius: 50 }, (data, status) => {
              if (status === 'OK' && data) {
                const date = data.imageDate;
                window.ReactNativeWebView.postMessage(JSON.stringify({ date }));
                const panorama = new google.maps.StreetViewPanorama(
                  document.getElementById('map'),
                  {
                    position: location,
                    pov: { heading: 0, pitch: 0 },
                    zoom: 1,
                    addressControl: false,
                    fullscreenControl: false,
                    motionTracking: true,
                    motionTrackingControl: true
                  }
                );
              }
            });
          }
          initialize();
        </script>
      </body>
    </html>
  ` : '';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Street View</Text>
          <Text style={styles.headerSubtitle}>360° panoramic view</Text>
        </View>
        <TouchableOpacity onPress={getCurrentLocation} style={styles.refreshButton}>
          <Ionicons name="locate" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {location ? (
        <>
          <WebView
            source={{ html: streetViewHTML }}
            style={styles.webview}
            onLoadEnd={() => setLoading(false)}
            onMessage={(event) => {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.date) setTimestamp(data.date);
            }}
            javaScriptEnabled
            domStorageEnabled
          />
          {timestamp && (
            <View style={styles.timestampContainer}>
              <Ionicons name="calendar-outline" size={14} color="#fff" />
              <Text style={styles.timestampText}>{timestamp}</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading location...</Text>
        </View>
      )}

      {loading && location && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  backButton: { marginRight: 16, padding: 4 },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 24, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginBottom: 2 },
  headerSubtitle: { fontSize: 13, fontFamily: 'LeagueSpartan_400Regular', color: '#9ca3af' },
  refreshButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  webview: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  loadingText: { fontSize: 15, color: '#6b7280', marginTop: 16 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  timestampContainer: { position: 'absolute', bottom: 20, left: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  timestampText: { fontSize: 13, fontFamily: 'LeagueSpartan_500Medium', color: '#fff' },
});
