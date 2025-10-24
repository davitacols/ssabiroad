import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { NearbyPoiService } from '../services/nearbyPoi';

export default function NearbyPoi() {
  const router = useRouter();
  const [location, setLocation] = useState<any>(null);
  const [selectedType, setSelectedType] = useState('restaurant');
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const placeTypes = NearbyPoiService.getPlaceTypes();

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is required');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      searchNearbyPlaces(currentLocation.coords.latitude, currentLocation.coords.longitude, selectedType);
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const searchNearbyPlaces = async (lat: number, lng: number, type: string) => {
    setLoading(true);
    try {
      const result = await NearbyPoiService.getNearbyPlaces(lat, lng, type);
      setPlaces(result.places || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to find nearby places');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    if (location) {
      searchNearbyPlaces(location.latitude, location.longitude, type);
    }
  };

  const getRatingStars = (rating: number) => {
    if (!rating) return 'No rating';
    const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
    return `${stars} (${rating})`;
  };

  const getPriceLevel = (level: number) => {
    if (!level) return '';
    return '$'.repeat(level);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafaf9" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nearby Places</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Place Type Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
          {placeTypes.map((type) => (
            <TouchableOpacity
              key={type.key}
              onPress={() => handleTypeChange(type.key)}
              style={[
                styles.typeButton,
                selectedType === type.key && styles.typeButtonActive
              ]}
            >
              <Text style={styles.typeIcon}>{type.icon}</Text>
              <Text style={[
                styles.typeText,
                selectedType === type.key && styles.typeTextActive
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Finding nearby places...</Text>
          </View>
        )}

        {/* Places List */}
        {!loading && places.length > 0 && (
          <View style={styles.placesContainer}>
            <Text style={styles.resultsTitle}>
              Found {places.length} places nearby
            </Text>
            
            {places.map((place, index) => (
              <View key={place.id} style={styles.placeCard}>
                <View style={styles.placeHeader}>
                  <Text style={styles.placeName}>{place.name}</Text>
                  <Text style={styles.placeDistance}>
                    {place.distance.toFixed(1)} km
                  </Text>
                </View>
                
                <Text style={styles.placeAddress}>{place.vicinity}</Text>
                
                <View style={styles.placeDetails}>
                  {place.rating && (
                    <Text style={styles.placeRating}>
                      {getRatingStars(place.rating)}
                    </Text>
                  )}
                  
                  {place.priceLevel && (
                    <Text style={styles.priceLevel}>
                      {getPriceLevel(place.priceLevel)}
                    </Text>
                  )}
                  
                  {place.openNow !== undefined && (
                    <Text style={[
                      styles.openStatus,
                      { color: place.openNow ? '#10B981' : '#EF4444' }
                    ]}>
                      {place.openNow ? 'Open now' : 'Closed'}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!loading && places.length === 0 && location && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No places found</Text>
            <Text style={styles.emptyText}>
              Try selecting a different category or check your location
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backButton: { padding: 8 },
  backIcon: { fontSize: 16, color: '#374151', fontWeight: '600' },
  title: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700', color: '#111827' },
  placeholder: { width: 40 },
  content: { flex: 1, padding: 20 },
  typeSelector: { marginBottom: 20 },
  typeButton: { paddingHorizontal: 16, paddingVertical: 12, marginRight: 12, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', minWidth: 80 },
  typeButtonActive: { backgroundColor: '#1c1917', borderColor: '#1c1917' },
  typeIcon: { fontSize: 20, marginBottom: 4 },
  typeText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  typeTextActive: { color: '#fff' },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontSize: 16, color: '#6b7280' },
  placesContainer: { marginBottom: 20 },
  resultsTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 },
  placeCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  placeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  placeName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111827', marginRight: 8 },
  placeDistance: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  placeAddress: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  placeDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  placeRating: { fontSize: 14, color: '#f59e0b' },
  priceLevel: { fontSize: 14, color: '#10b981', fontWeight: '600' },
  openStatus: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center', paddingHorizontal: 20 },
});