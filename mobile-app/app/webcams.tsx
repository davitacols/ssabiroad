import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

export default function WebcamsScreen() {
  const router = useRouter();
  const [webcams, setWebcams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<any>(null);

  useEffect(() => {
    loadWebcams();
  }, []);

  const loadWebcams = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
        await fetchNearbyWebcams(loc.coords.latitude, loc.coords.longitude);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyWebcams = async (lat: number, lng: number) => {
    try {
      // Using Windy Webcams API (free tier)
      const response = await fetch(
        `https://api.windy.com/api/webcams/v2/list/nearby=${lat},${lng},50?show=webcams:image,location&key=YOUR_WINDY_API_KEY`
      );
      const data = await response.json();
      if (data.result?.webcams) {
        setWebcams(data.result.webcams);
      }
    } catch (error) {
      console.error('Webcam fetch error:', error);
      // Fallback to mock data for demo
      setWebcams([
        {
          id: '1',
          title: 'City Center View',
          location: { city: 'Local Area', country: 'Country' },
          image: { current: { preview: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400' } },
          url: 'https://example.com'
        }
      ]);
    }
  };

  const openWebcam = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Live Webcams</Text>
          <Text style={styles.headerSubtitle}>Real-time camera feeds nearby</Text>
        </View>
        <TouchableOpacity onPress={loadWebcams} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Finding webcams...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {webcams.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="videocam-off-outline" size={48} color="#9ca3af" />
              </View>
              <Text style={styles.emptyTitle}>No webcams found</Text>
              <Text style={styles.emptyText}>No live cameras available in this area</Text>
            </View>
          ) : (
            webcams.map((webcam) => (
              <TouchableOpacity
                key={webcam.id}
                style={styles.webcamCard}
                onPress={() => openWebcam(webcam.url)}
              >
                <Image
                  source={{ uri: webcam.image?.current?.preview || 'https://via.placeholder.com/400' }}
                  style={styles.webcamImage}
                />
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
                <View style={styles.webcamInfo}>
                  <Text style={styles.webcamTitle}>{webcam.title}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={14} color="#6b7280" />
                    <Text style={styles.webcamLocation}>
                      {webcam.location?.city}, {webcam.location?.country}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  backButton: { marginRight: 16, padding: 4 },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 24, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginBottom: 2 },
  headerSubtitle: { fontSize: 13, fontFamily: 'LeagueSpartan_400Regular', color: '#9ca3af' },
  refreshButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 15, color: '#6b7280', marginTop: 16 },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#6b7280', textAlign: 'center' },
  webcamCard: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 16, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  webcamImage: { width: '100%', height: 200, backgroundColor: '#f3f4f6' },
  liveIndicator: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { fontSize: 11, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', letterSpacing: 1 },
  webcamInfo: { padding: 16 },
  webcamTitle: { fontSize: 16, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  webcamLocation: { fontSize: 13, fontFamily: 'LeagueSpartan_400Regular', color: '#6b7280' },
});
