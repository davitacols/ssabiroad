import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar, Alert, Modal, Linking, TextInput, Image, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NearbyPoiService } from '../services/nearbyPoi';

export default function NearbyPoi() {
  const router = useRouter();
  const [location, setLocation] = useState<any>(null);
  const [selectedType, setSelectedType] = useState('restaurant');
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [placeDetails, setPlaceDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<any[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const placeTypes = NearbyPoiService.getPlaceTypes();

  const addActivity = async (title: string, subtitle: string, route: string) => {
    try {
      const stored = await AsyncStorage.getItem('recentActivities');
      const activities = stored ? JSON.parse(stored) : [];
      
      const newActivity = {
        id: Date.now().toString(),
        title,
        subtitle,
        timestamp: Date.now(),
        route
      };
      
      const updated = [newActivity, ...activities.slice(0, 4)];
      await AsyncStorage.setItem('recentActivities', JSON.stringify(updated));
    } catch (error) {
      console.log('Error saving activity:', error);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
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
      
      const typeLabel = placeTypes.find(t => t.key === type)?.label || type;
      await addActivity('Places Found', `Found ${result.places?.length || 0} ${typeLabel.toLowerCase()}`, '/nearby-poi');
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

  const fetchAutocomplete = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
      return;
    }

    try {
      const response = await fetch(
        `https://pic2nav.com/api/places-autocomplete?input=${encodeURIComponent(query)}&location=${location?.latitude},${location?.longitude}`
      );
      const data = await response.json();
      setAutocompleteSuggestions(data.predictions || []);
      setShowAutocomplete(true);
    } catch (error) {
      console.log('Autocomplete error:', error);
    }
  };

  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setShowAutocomplete(false);
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://pic2nav.com/api/places-search?query=${encodeURIComponent(query)}&location=${location?.latitude},${location?.longitude}`
      );
      const data = await response.json();
      setSearchResults(data.places || []);
      
      if (data.places?.length > 0) {
        await addActivity('Places Searched', `Searched for "${query}"`, '/nearby-poi');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search places');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    searchPlaces(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setAutocompleteSuggestions([]);
    setShowAutocomplete(false);
  };

  const handlePlacePress = async (place: any) => {
    setSelectedPlace(place);
    setDetailsLoading(true);
    await addActivity('Place Viewed', `Viewed details for ${place.name}`, '/nearby-poi');
    try {
      const response = await fetch(`https://pic2nav.com/api/place-details?placeId=${place.placeId}`);
      const details = await response.json();
      setPlaceDetails(details);
    } catch (error) {
      Alert.alert('Error', 'Failed to get details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedPlace(null);
    setPlaceDetails(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {initialLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Finding places near you</Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <View style={styles.searchDot} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search addresses, places..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  fetchAutocomplete(text);
                }}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                placeholderTextColor="#9ca3af"
              />
            </View>
            {searchQuery ? (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {showAutocomplete && autocompleteSuggestions.length > 0 && (
          <View style={styles.autocompleteSection}>
            {autocompleteSuggestions.slice(0, 5).map((suggestion, index) => (
              <TouchableOpacity
                key={suggestion.place_id || index}
                style={styles.autocompleteItem}
                onPress={() => {
                  setSearchQuery(suggestion.description);
                  setShowAutocomplete(false);
                  searchPlaces(suggestion.description);
                }}
              >
                <Text style={styles.autocompleteText}>{suggestion.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {searchResults.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {searchResults.map((place, index) => (
              <TouchableOpacity key={place.id || index} style={styles.placeCard} onPress={() => handlePlacePress(place)}>
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName}>{place.name}</Text>
                  <Text style={styles.placeAddress}>{place.vicinity || place.address}</Text>
                  {place.distance && (
                    <Text style={styles.placeDistance}>{place.distance.toFixed(1)} km away</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {searchResults.length === 0 && (
          <>
            <View style={styles.categoriesSection}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                {placeTypes.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    onPress={() => handleTypeChange(type.key)}
                    style={[
                      styles.categoryChip,
                      selectedType === type.key && styles.categoryChipActive
                    ]}
                  >
                    <Text style={[
                      styles.categoryText,
                      selectedType === type.key && styles.categoryTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {loading && (
              <View style={styles.loadingSection}>
                <ActivityIndicator size="small" color="#000000" />
                <Text style={styles.loadingText}>Loading places...</Text>
              </View>
            )}

            {!loading && places.length > 0 && (
              <View style={styles.placesSection}>
                <Text style={styles.sectionTitle}>{places.length} places nearby</Text>
                {places.map((place, index) => (
                  <TouchableOpacity key={place.id} style={styles.placeCard} onPress={() => handlePlacePress(place)}>
                    <View style={styles.placeInfo}>
                      <Text style={styles.placeName}>{place.name}</Text>
                      <Text style={styles.placeAddress}>{place.vicinity}</Text>
                      <View style={styles.placeMetrics}>
                        <Text style={styles.placeDistance}>{place.distance.toFixed(1)} km</Text>
                        {place.rating && (
                          <Text style={styles.placeRating}>★ {place.rating}</Text>
                        )}
                        {place.openNow !== undefined && (
                          <Text style={[styles.placeStatus, { color: place.openNow ? '#000000' : '#9ca3af' }]}>
                            {place.openNow ? 'Open' : 'Closed'}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={!!selectedPlace} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedPlace?.name}</Text>
            <TouchableOpacity onPress={closeModal} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>

          {detailsLoading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#000000" />
            </View>
          ) : (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {placeDetails?.address && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text style={styles.detailValue}>{placeDetails.address}</Text>
                </View>
              )}

              {placeDetails?.phoneNumber && (
                <TouchableOpacity style={styles.detailSection} onPress={() => Linking.openURL(`tel:${placeDetails.phoneNumber}`)}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={[styles.detailValue, styles.linkText]}>{placeDetails.phoneNumber}</Text>
                </TouchableOpacity>
              )}

              {placeDetails?.openingHours !== undefined && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[styles.detailValue, { color: placeDetails.openingHours ? '#10b981' : '#ef4444', fontWeight: '600' }]}>
                    {placeDetails.openingHours ? 'Open Now' : 'Closed'}
                  </Text>
                </View>
              )}

              <View style={styles.actionSection}>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={() => {
                    if (placeDetails?.location || selectedPlace?.location) {
                      const loc = placeDetails?.location || selectedPlace?.location;
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`;
                      Linking.openURL(url);
                    } else if (placeDetails?.address || selectedPlace?.vicinity) {
                      const address = encodeURIComponent(placeDetails?.address || selectedPlace?.vicinity);
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${address}`;
                      Linking.openURL(url);
                    }
                  }}
                >
                  <Text style={styles.primaryButtonText}>Directions</Text>
                </TouchableOpacity>
              </View>

              {placeDetails?.weekdayText && placeDetails.weekdayText.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Opening Hours</Text>
                  {placeDetails.weekdayText.map((hours: string, index: number) => (
                    <Text key={index} style={[styles.detailValue, { marginBottom: 4 }]}>{hours}</Text>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  loadingText: { marginTop: 16, fontSize: 16, color: '#000000', fontWeight: '500' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backButton: { marginRight: 16 },
  backText: { fontSize: 16, color: '#000000', fontWeight: '500' },
  headerTitle: { fontSize: 24, fontWeight: '600', color: '#000000' },
  content: { flex: 1 },
  searchSection: { padding: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  searchDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#000000', marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: '#000000' },
  clearButton: { paddingHorizontal: 16, paddingVertical: 12 },
  clearText: { fontSize: 16, color: '#6b7280', fontWeight: '500' },
  autocompleteSection: { paddingHorizontal: 24, paddingBottom: 12 },
  autocompleteItem: { backgroundColor: '#ffffff', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  autocompleteText: { fontSize: 14, color: '#000000' },
  resultsSection: { padding: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#000000', marginBottom: 16 },
  categoriesSection: { padding: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  categoriesScroll: { marginTop: 16 },
  categoryChip: { backgroundColor: '#f3f4f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 12 },
  categoryChipActive: { backgroundColor: '#000000' },
  categoryText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  categoryTextActive: { color: '#ffffff' },
  loadingSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 24 },
  placesSection: { padding: 24 },
  placeCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  placeInfo: { },
  placeName: { fontSize: 16, fontWeight: '600', color: '#000000', marginBottom: 4 },
  placeAddress: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  placeMetrics: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  placeDistance: { fontSize: 14, color: '#374151', fontWeight: '500' },
  placeRating: { fontSize: 14, color: '#000000', fontWeight: '500' },
  placeStatus: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  modalContainer: { flex: 1, backgroundColor: '#ffffff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#000000', flex: 1 },
  modalClose: { },
  modalCloseText: { fontSize: 16, color: '#000000', fontWeight: '500' },
  modalLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { padding: 24, paddingBottom: 40 },
  detailSection: { marginBottom: 24 },
  detailLabel: { fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' },
  detailValue: { fontSize: 16, color: '#000000', lineHeight: 24 },
  linkText: { color: '#000000', textDecorationLine: 'underline' },
  actionSection: { marginTop: 16, gap: 12 },
  primaryButton: { backgroundColor: '#000000', borderRadius: 12, padding: 14, alignItems: 'center' },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  secondaryButton: { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#000000', fontSize: 16, fontWeight: '600' },
});