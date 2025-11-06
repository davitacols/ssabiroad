import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

export default function SavedLocationsScreen() {
  const router = useRouter();
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const stored = await AsyncStorage.getItem('savedLocations');
      if (stored) setLocations(JSON.parse(stored));
    } catch (error) {
      console.error(error);
    }
  };

  const deleteLocation = async (id: string) => {
    Alert.alert('Delete Location', 'Remove this location?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = locations.filter(l => l.id !== id);
          setLocations(updated);
          await AsyncStorage.setItem('savedLocations', JSON.stringify(updated));
        },
      },
    ]);
  };

  const openInMaps = (location: any) => {
    const { latitude, longitude } = location.location;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
  };

  const copyCoordinates = async (location: any) => {
    const { latitude, longitude } = location.location;
    await Clipboard.setStringAsync(`${latitude}, ${longitude}`);
    Alert.alert('Copied', 'Coordinates copied to clipboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Saved Locations</Text>
          <Text style={styles.headerSubtitle}>{locations.length} location{locations.length !== 1 ? 's' : ''}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {locations.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="bookmark-outline" size={48} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>No saved locations</Text>
            <Text style={styles.emptyText}>Locations you save will appear here</Text>
          </View>
        ) : (
          locations.map((location) => (
            <View key={location.id} style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <View style={styles.locationIcon}>
                  <Ionicons name="location" size={24} color="#8b5cf6" />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationAddress} numberOfLines={2}>{location.address}</Text>
                  {location.location && (
                    <Text style={styles.locationCoords}>
                      {location.location.latitude.toFixed(6)}, {location.location.longitude.toFixed(6)}
                    </Text>
                  )}
                </View>
              </View>

              {location.labels && location.labels.length > 0 && (
                <View style={styles.labelsRow}>
                  {location.labels.slice(0, 3).map((label: string, i: number) => (
                    <View key={i} style={styles.labelBadge}>
                      <Text style={styles.labelText}>{label}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/location-card?location=${encodeURIComponent(JSON.stringify(location))}` as any)}>
                  <Ionicons name="information-circle" size={18} color="#3b82f6" />
                  <Text style={styles.actionText}>View Info</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openInMaps(location)}>
                  <Ionicons name="navigate" size={18} color="#8b5cf6" />
                  <Text style={styles.actionText}>Navigate</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => copyCoordinates(location)}>
                  <Ionicons name="copy" size={18} color="#10b981" />
                  <Text style={styles.actionText}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => deleteLocation(location.id)}>
                  <Ionicons name="trash" size={18} color="#ef4444" />
                  <Text style={styles.actionText}>Delete</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.savedDate}>
                Saved {new Date(location.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
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
  content: { flex: 1 },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#6b7280', textAlign: 'center' },
  locationCard: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 16, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  locationHeader: { flexDirection: 'row', marginBottom: 12 },
  locationIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  locationInfo: { flex: 1 },
  locationName: { fontSize: 16, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginBottom: 4 },
  locationAddress: { fontSize: 13, fontFamily: 'LeagueSpartan_400Regular', color: '#6b7280', marginBottom: 4, lineHeight: 18 },
  locationCoords: { fontSize: 11, fontFamily: 'LeagueSpartan_400Regular', color: '#9ca3af' },
  labelsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  labelBadge: { backgroundColor: '#f5f3ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  labelText: { fontSize: 10, fontFamily: 'LeagueSpartan_600SemiBold', color: '#8b5cf6' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, gap: 6 },
  actionText: { fontSize: 12, fontFamily: 'LeagueSpartan_600SemiBold', color: '#000' },
  savedDate: { fontSize: 11, fontFamily: 'LeagueSpartan_400Regular', color: '#9ca3af', textAlign: 'center' },
});
