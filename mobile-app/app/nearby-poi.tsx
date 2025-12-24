import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar, Alert, Modal, Linking, TextInput, Image, ActivityIndicator, SafeAreaView, Animated, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NearbyPoiService } from '../services/nearbyPoi';
import LocationPermissionDisclosure from '../components/LocationPermissionDisclosure';
import MenuBar from '../components/MenuBar';
import { useTheme, getColors } from '../contexts/ThemeContext';

export default function NearbyPoi() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const colors = getColors(theme);
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
  const [showImageModal, setShowImageModal] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [radius, setRadius] = useState(2000);
  const [showFilters, setShowFilters] = useState(false);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [savedPlaces, setSavedPlaces] = useState<string[]>([]);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [disclosureShown, setDisclosureShown] = useState(false);

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
    checkDisclosureStatus();
    if (params.query && typeof params.query === 'string') {
      setSearchQuery(params.query);
      setTimeout(() => searchPlaces(params.query as string), 500);
    }
  }, []);

  const checkDisclosureStatus = async () => {
    try {
      const shown = await AsyncStorage.getItem('locationDisclosureShown');
      if (shown === 'true') {
        setDisclosureShown(true);
        getCurrentLocation();
      } else {
        setShowDisclosure(true);
      }
    } catch (error) {
      console.log('Check disclosure error:', error);
    }
  };

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

  const handleAcceptDisclosure = async () => {
    try {
      await AsyncStorage.setItem('locationDisclosureShown', 'true');
      setDisclosureShown(true);
      setShowDisclosure(false);
      getCurrentLocation();
    } catch (error) {
      console.log('Accept disclosure error:', error);
    }
  };

  const handleDeclineDisclosure = () => {
    setShowDisclosure(false);
    Alert.alert('Location Required', 'Location permission is needed to find nearby places.');
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
      console.log('Place details:', details);
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

  const toggleSavePlace = async (placeId: string) => {
    const isSaved = savedPlaces.includes(placeId);
    const updated = isSaved 
      ? savedPlaces.filter(id => id !== placeId)
      : [...savedPlaces, placeId];
    setSavedPlaces(updated);
    await AsyncStorage.setItem('savedPlaces', JSON.stringify(updated));
    Alert.alert(isSaved ? 'Removed' : 'Saved', isSaved ? 'Place removed from saved' : 'Place saved successfully');
  };

  const copyAddress = async (address: string) => {
    await Clipboard.setStringAsync(address);
    Alert.alert('Copied', 'Address copied to clipboard');
  };

  const sharePlace = async (place: any) => {
    const message = `${place.name}\n${place.vicinity || place.address}\nhttps://www.google.com/maps/search/?api=1&query=${place.location?.lat},${place.location?.lng}`;
    await Clipboard.setStringAsync(message);
    Alert.alert('Copied', 'Place details copied to clipboard');
  };

  const filteredPlaces = places.filter(place => {
    if (openNowOnly && !place.openNow) return false;
    if (minRating > 0 && (!place.rating || place.rating < minRating)) return false;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      {initialLoading && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={[styles.loadingText, { color: colors.text }]}>Finding places near you</Text>
        </View>
      )}

      <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Nearby Places</Text>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterButton}>
            <Ionicons name="options-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color="#3b82f6" />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search places, addresses..."
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                fetchAutocomplete(text);
              }}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              placeholderTextColor={colors.textSecondary}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={clearSearch} style={styles.clearIcon}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {showFilters && (
          <View style={[styles.filtersPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.filterHeader}>
              <Text style={[styles.filterTitle, { color: colors.text }]}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.filterItem}>
              <View style={styles.filterLeft}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>Open Now</Text>
                <Text style={[styles.filterHint, { color: colors.textSecondary }]}>Show only open places</Text>
              </View>
              <Switch value={openNowOnly} onValueChange={setOpenNowOnly} trackColor={{ true: colors.text, false: colors.border }} thumbColor="#fff" />
            </View>
            <View style={[styles.filterDivider, { backgroundColor: colors.border }]} />
            <View style={styles.filterItem}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Minimum Rating</Text>
              <View style={styles.filterOptions}>
                {[0, 3, 4, 4.5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[styles.optionChip, { backgroundColor: colors.background, borderColor: colors.border }, minRating === rating && { backgroundColor: colors.text, borderColor: colors.text }]}
                    onPress={() => setMinRating(rating)}
                  >
                    <Text style={[styles.optionText, { color: colors.text }, minRating === rating && { color: colors.background }]}>{rating === 0 ? 'Any' : `${rating}★`}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={[styles.filterDivider, { backgroundColor: colors.border }]} />
            <View style={styles.filterItem}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Search Radius</Text>
              <View style={styles.filterOptions}>
                {[1000, 2000, 5000].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.optionChip, { backgroundColor: colors.background, borderColor: colors.border }, radius === r && { backgroundColor: colors.text, borderColor: colors.text }]}
                    onPress={() => {
                      setRadius(r);
                      if (location) searchNearbyPlaces(location.latitude, location.longitude, selectedType);
                    }}
                  >
                    <Text style={[styles.optionText, { color: colors.text }, radius === r && { color: colors.background }]}>{r / 1000} km</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {showAutocomplete && autocompleteSuggestions.length > 0 && (
          <View style={[styles.autocompleteDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {autocompleteSuggestions.slice(0, 5).map((suggestion, index) => (
              <TouchableOpacity
                key={suggestion.place_id || index}
                style={[styles.suggestionItem, index < autocompleteSuggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                onPress={() => {
                  setSearchQuery(suggestion.description);
                  setShowAutocomplete(false);
                  searchPlaces(suggestion.description);
                }}
              >
                <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.suggestionText, { color: colors.text }]} numberOfLines={2}>{suggestion.description}</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {searchResults.length > 0 && (
          <View style={styles.resultsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Search Results</Text>
              <Text style={[styles.resultCount, { color: colors.textSecondary }]}>{searchResults.length} found</Text>
            </View>
            {searchResults.map((place, index) => (
              <TouchableOpacity key={place.id || index} style={[styles.placeCard, { backgroundColor: colors.card }]} onPress={() => handlePlacePress(place)}>
                <View style={styles.placeInfo}>
                  <View style={styles.placeHeader}>
                    <Text style={[styles.placeName, { color: colors.text }]} numberOfLines={1}>{place.name}</Text>
                    {place.rating && (
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={14} color="#fbbf24" />
                        <Text style={styles.ratingValue}>{place.rating}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.placeAddress, { color: colors.textSecondary }]} numberOfLines={2}>{place.vicinity || place.address}</Text>
                  <View style={styles.placeFooter}>
                    {place.distance && (
                      <View style={styles.distanceTag}>
                        <Ionicons name="navigate" size={14} color="#3b82f6" />
                        <Text style={[styles.distanceText, { color: colors.text }]}>{place.distance.toFixed(1)} km</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {searchResults.length === 0 && (
          <>
            <View style={styles.categoriesSection}>
              <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>CATEGORIES</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
                {placeTypes.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    onPress={() => handleTypeChange(type.key)}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      selectedType === type.key && styles.categoryChipActive
                    ]}
                  >
                    <Text style={[
                      styles.categoryText,
                      { color: colors.textSecondary },
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
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>Finding places...</Text>
              </View>
            )}

            {!loading && filteredPlaces.length > 0 && (
              <View style={styles.placesSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby</Text>
                  <Text style={[styles.resultCount, { color: colors.textSecondary }]}>{filteredPlaces.length} places</Text>
                </View>
                {filteredPlaces.map((place, index) => (
                  <TouchableOpacity key={place.id} style={[styles.placeCard, { backgroundColor: colors.card }]} onPress={() => handlePlacePress(place)}>
                    <View style={styles.placeInfo}>
                      <View style={styles.placeHeader}>
                        <Text style={[styles.placeName, { color: colors.text }]} numberOfLines={1}>{place.name}</Text>
                        {place.openNow !== undefined && (
                          <View style={[styles.openBadge, { backgroundColor: place.openNow ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                            <View style={[styles.openDot, { backgroundColor: place.openNow ? '#22c55e' : '#ef4444' }]} />
                            <Text style={[styles.openText, { color: place.openNow ? '#22c55e' : '#ef4444' }]}>
                              {place.openNow ? 'Open' : 'Closed'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.placeAddress, { color: colors.textSecondary }]} numberOfLines={2}>{place.vicinity}</Text>
                      <View style={styles.placeFooter}>
                        <View style={styles.distanceTag}>
                          <Ionicons name="navigate" size={14} color="#3b82f6" />
                          <Text style={[styles.distanceText, { color: colors.text }]}>{place.distance.toFixed(1)} km</Text>
                        </View>
                        {place.rating && (
                          <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={14} color="#fbbf24" />
                            <Text style={styles.ratingValue}>{place.rating}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={!!selectedPlace} animationType="slide" onRequestClose={closeModal}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedPlace?.name}</Text>
            <TouchableOpacity onPress={closeModal} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>

          {detailsLoading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              <View style={styles.placeHero}>
                <Text style={styles.heroTitle}>{selectedPlace?.name}</Text>
                <Text style={styles.heroSubtitle}>{placeDetails?.address || selectedPlace?.vicinity}</Text>
                {selectedPlace?.rating && (
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingText}>★ {selectedPlace.rating}</Text>
                    <Text style={styles.ratingLabel}>Rating</Text>
                  </View>
                )}
              </View>

              <View style={styles.quickActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
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
                  <Text style={styles.actionButtonText}>Get Directions</Text>
                </TouchableOpacity>
                {placeDetails?.phoneNumber && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.secondaryAction]}
                    onPress={() => Linking.openURL(`tel:${placeDetails.phoneNumber}`)}
                  >
                    <Text style={[styles.actionButtonText, styles.secondaryActionText]}>Call</Text>
                  </TouchableOpacity>
                )}
              </View>

              {placeDetails?.openingHours !== undefined && (
                <View style={styles.infoCard}>
                  <Text style={styles.infoTitle}>Current Status</Text>
                  <Text style={[styles.statusIndicator, { color: placeDetails.openingHours ? '#16a34a' : '#dc2626' }]}>
                    {placeDetails.openingHours ? '● Open Now' : '● Closed'}
                  </Text>
                </View>
              )}

              {placeDetails?.weekdayText && placeDetails.weekdayText.length > 0 && (
                <View style={styles.infoCard}>
                  <Text style={styles.infoTitle}>Opening Hours</Text>
                  {placeDetails.weekdayText.map((hours: string, index: number) => (
                    <Text key={index} style={styles.hoursText}>{hours}</Text>
                  ))}
                </View>
              )}

              {placeDetails?.photos && placeDetails.photos.length > 0 && (
                <View style={styles.infoCard}>
                  <Text style={styles.infoTitle}>Photos</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
                    {placeDetails.photos.slice(0, 10).map((photo: any, idx: number) => (
                      <TouchableOpacity key={idx} onPress={() => {
                        setPreviewImage(`https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho`);
                        setShowImageModal(true);
                      }}>
                        <Image 
                          source={{ uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho` }}
                          style={styles.photoThumbnail}
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Text style={styles.googleCredit}>Photos from Google</Text>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      <Modal visible={showImageModal} transparent animationType="fade" onRequestClose={() => setShowImageModal(false)}>
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity style={styles.imageModalClose} onPress={() => setShowImageModal(false)}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          {previewImage && (
            <Image source={{ uri: previewImage }} style={styles.fullImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      <LocationPermissionDisclosure
        visible={showDisclosure}
        onAccept={handleAcceptDisclosure}
        onDecline={handleDeclineDisclosure}
      />
      <MenuBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  loadingText: { marginTop: 16, fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold' },
  loadingSubtext: { fontSize: 14, fontFamily: 'LeagueSpartan_400Regular', marginLeft: 8 },
  header: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 32 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 24, fontFamily: 'LeagueSpartan_700Bold', flex: 1, marginLeft: 8 },
  filterButton: { padding: 8 },
  searchContainer: { },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'LeagueSpartan_400Regular', marginLeft: 12 },
  clearIcon: { padding: 4 },
  content: { flex: 1 },
  autocompleteDropdown: { marginHorizontal: 20, marginTop: 8, borderRadius: 12, borderWidth: 1, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  suggestionText: { flex: 1, fontSize: 14, fontFamily: 'LeagueSpartan_400Regular' },
  resultsSection: { paddingHorizontal: 20, paddingTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontFamily: 'LeagueSpartan_700Bold' },
  sectionLabel: { fontSize: 11, fontFamily: 'LeagueSpartan_700Bold', letterSpacing: 1, marginBottom: 12 },
  resultCount: { fontSize: 14, fontFamily: 'LeagueSpartan_600SemiBold' },
  categoriesSection: { paddingHorizontal: 20, paddingTop: 20 },
  categoriesScroll: { paddingRight: 20 },
  categoryChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 12, borderWidth: 1 },
  categoryChipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  categoryText: { fontSize: 14, fontFamily: 'LeagueSpartan_600SemiBold' },
  categoryTextActive: { color: '#fff' },
  loadingSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  placesSection: { paddingHorizontal: 20, paddingTop: 20 },
  placeCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  placeInfo: { flex: 1 },
  placeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  placeName: { fontSize: 16, fontFamily: 'LeagueSpartan_700Bold', flex: 1, marginRight: 8 },
  placeAddress: { fontSize: 14, fontFamily: 'LeagueSpartan_400Regular', marginBottom: 10, lineHeight: 20 },
  placeFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  distanceTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  distanceText: { fontSize: 13, fontFamily: 'LeagueSpartan_600SemiBold' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251, 191, 36, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingValue: { fontSize: 13, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fbbf24' },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  openText: { fontSize: 11, fontFamily: 'LeagueSpartan_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  filtersPanel: { marginHorizontal: 20, marginTop: 12, padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  filterTitle: { fontSize: 18, fontFamily: 'LeagueSpartan_700Bold' },
  filterItem: { marginBottom: 20 },
  filterLeft: { marginBottom: 12 },
  filterLabel: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', marginBottom: 4 },
  filterHint: { fontSize: 13, fontFamily: 'LeagueSpartan_400Regular' },
  filterOptions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  optionChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  optionText: { fontSize: 14, fontFamily: 'LeagueSpartan_600SemiBold' },
  filterDivider: { height: 1, marginBottom: 20 },
  placeHero: { padding: 24, backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' },
  heroTitle: { fontSize: 24, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginBottom: 8 },
  heroSubtitle: { fontSize: 16, color: '#a3a3a3', marginBottom: 16, lineHeight: 24 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingText: { fontSize: 18, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fbbf24' },
  ratingLabel: { fontSize: 14, color: '#a3a3a3' },
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionButton: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' },
  secondaryAction: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#1a1a1a' },
  actionButtonText: { color: '#000', fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold' },
  secondaryActionText: { color: '#fff' },
  infoCard: { backgroundColor: '#0a0a0a', borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  infoTitle: { fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fff', marginBottom: 12 },
  statusIndicator: { fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold' },
  hoursText: { fontSize: 14, color: '#a3a3a3', marginBottom: 4, lineHeight: 20 },
  photosScroll: { marginBottom: 12 },
  photoThumbnail: { width: 120, height: 120, borderRadius: 12, marginRight: 12, backgroundColor: '#1a1a1a' },
  googleCredit: { fontSize: 11, color: '#6b7280', fontFamily: 'LeagueSpartan_400Regular', marginTop: 4 },
  imageModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  imageModalClose: { position: 'absolute', top: 60, right: 20, zIndex: 10, padding: 8 },
  fullImage: { width: '100%', height: '80%' },
  modalContainer: { flex: 1, backgroundColor: '#000' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  modalTitle: { fontSize: 20, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fff', flex: 1 },
  modalClose: { },
  modalCloseText: { fontSize: 16, color: '#fff', fontFamily: 'LeagueSpartan_600SemiBold' },
  modalLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  modalContent: { flex: 1, padding: 24 },
  detailSection: { marginBottom: 24 },
  detailLabel: { fontSize: 14, fontFamily: 'LeagueSpartan_600SemiBold', color: '#737373', marginBottom: 4, textTransform: 'uppercase' },
  detailValue: { fontSize: 16, color: '#fff', lineHeight: 24 },
  linkText: { color: '#fff', textDecorationLine: 'underline' },
  actionSection: { marginTop: 16, gap: 12 },
  primaryButton: { backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  primaryButtonText: { color: '#000', fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold' },
  secondaryButton: { backgroundColor: '#0a0a0a', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  secondaryButtonText: { color: '#fff', fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold' },
});