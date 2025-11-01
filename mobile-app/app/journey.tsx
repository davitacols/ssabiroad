import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';


export default function JourneyScreen() {
  const router = useRouter();
  const [locations, setLocations] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, distance: 0, countries: 0, cities: 0 });
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const saved = await SecureStore.getItemAsync('savedLocations');
      if (saved) {
        const locs = JSON.parse(saved);
        setLocations(locs);
        calculateStats(locs);
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const clearJourney = async () => {
    try {
      await SecureStore.deleteItemAsync('savedLocations');
      setLocations([]);
      setStats({ total: 0, distance: 0, countries: 0, cities: 0 });
      setShowClearModal(false);
    } catch (error) {
      console.error('Clear error:', error);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateStats = (locs: any[]) => {
    let totalDistance = 0;
    const countries = new Set();
    const cities = new Set();

    for (let i = 1; i < locs.length; i++) {
      const prev = locs[i - 1];
      const curr = locs[i];
      if (prev.latitude && curr.latitude) {
        totalDistance += calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
      }
    }

    locs.forEach(loc => {
      if (loc.address) {
        const parts = loc.address.split(',');
        if (parts.length > 0) cities.add(parts[0].trim());
        if (parts.length > 1) countries.add(parts[parts.length - 1].trim());
      }
    });

    setStats({
      total: locs.length,
      distance: Math.round(totalDistance),
      countries: countries.size,
      cities: cities.size
    });
  };



  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journey</Text>
        {locations.length > 0 && (
          <TouchableOpacity onPress={() => setShowClearModal(true)} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Your Journey</Text>
        <Text style={styles.heroSubtitle}>{stats.total} locations • {stats.distance} km</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statText}>Locations</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.distance}</Text>
            <Text style={styles.statText}>Kilometers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.countries}</Text>
            <Text style={styles.statText}>Countries</Text>
          </View>
        </View>

        {locations.length > 0 && (
          <View style={styles.locationsSection}>
            <Text style={styles.sectionHeader}>RECENT LOCATIONS</Text>
            {locations.map((loc, idx) => (
              <TouchableOpacity key={idx} style={styles.locationCard}>
                {loc.image && (
                  <Image source={{ uri: loc.image }} style={styles.locationImage} />
                )}
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{loc.name || 'Location'}</Text>
                  <Text style={styles.locationAddress} numberOfLines={1}>{loc.address}</Text>
                  <Text style={styles.locationDate}>{new Date(loc.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {locations.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Journey Yet</Text>
            <Text style={styles.emptyText}>Start scanning locations to build your journey timeline</Text>
          </View>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {showClearModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Clear Journey?</Text>
            <Text style={styles.modalText}>This will delete all saved locations and cannot be undone.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowClearModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={clearJourney}>
                <Text style={styles.deleteText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#000' },
  backButton: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 28, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', flex: 1, fontFamily: 'LeagueSpartan_700Bold' },
  clearButton: { padding: 4 },
  heroSection: { paddingHorizontal: 20, paddingBottom: 24, backgroundColor: '#000' },
  heroTitle: { fontSize: 32, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginBottom: 8, fontFamily: 'LeagueSpartan_700Bold' },
  heroSubtitle: { fontSize: 16, color: '#9ca3af', fontFamily: 'LeagueSpartan_400Regular' },
  content: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  statsRow: { flexDirection: 'row', paddingVertical: 24, paddingHorizontal: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 28, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginBottom: 4, fontFamily: 'LeagueSpartan_700Bold' },
  statText: { fontSize: 12, color: '#6b7280', fontFamily: 'LeagueSpartan_400Regular' },
  statDivider: { width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 12 },
  locationsSection: { paddingHorizontal: 20, paddingTop: 8 },
  sectionHeader: { fontSize: 13, fontFamily: 'LeagueSpartan_700Bold', color: '#6b7280', marginBottom: 16, letterSpacing: 1, fontFamily: 'LeagueSpartan_700Bold' },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#f3f4f6' },
  locationImage: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#f3f4f6', marginRight: 16 },
  locationInfo: { flex: 1 },
  locationName: { fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold', color: '#000', marginBottom: 4, fontFamily: 'LeagueSpartan_600SemiBold' },
  locationAddress: { fontSize: 14, color: '#6b7280', marginBottom: 4, fontFamily: 'LeagueSpartan_400Regular' },
  locationDate: { fontSize: 12, color: '#9ca3af', fontFamily: 'LeagueSpartan_400Regular' },
  bottomPadding: { height: 100 },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40, backgroundColor: '#fff' },
  emptyTitle: { fontSize: 20, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginTop: 16, marginBottom: 8, fontFamily: 'LeagueSpartan_700Bold' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', fontFamily: 'LeagueSpartan_400Regular' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginBottom: 12, fontFamily: 'LeagueSpartan_700Bold' },
  modalText: { fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 20, fontFamily: 'LeagueSpartan_400Regular' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12, padding: 16, alignItems: 'center' },
  cancelText: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', color: '#000', fontFamily: 'LeagueSpartan_600SemiBold' },
  deleteButton: { flex: 1, backgroundColor: '#ef4444', borderRadius: 12, padding: 16, alignItems: 'center' },
  deleteText: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fff', fontFamily: 'LeagueSpartan_600SemiBold' },
});
