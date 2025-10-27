import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Image, ActivityIndicator, Animated, PanResponder, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'grid' },
  { id: 'restaurant', name: 'Food', icon: 'restaurant' },
  { id: 'tourist_attraction', name: 'Attractions', icon: 'star' },
  { id: 'park', name: 'Nature', icon: 'leaf' },
  { id: 'museum', name: 'Culture', icon: 'business' },
  { id: 'cafe', name: 'Cafes', icon: 'cafe' },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<any>(null);
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const position = new Animated.ValueXY();
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });
  
  const likeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });
  
  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0, 0],
    extrapolate: 'clamp',
  });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > SWIPE_THRESHOLD) {
        swipeRight();
      } else if (gesture.dx < -SWIPE_THRESHOLD) {
        swipeLeft();
      } else {
        resetPosition();
      }
    },
  });

  useEffect(() => {
    initDiscover();
  }, []);

  useEffect(() => {
    if (location) {
      fetchRecommendations();
    }
  }, [selectedCategory, location]);

  const initDiscover = async () => {
    await getLocation();
    await loadSavedLocations();
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
    } catch (error) {
      console.log('Location error:', error);
    }
  };

  const loadSavedLocations = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedLocations');
      if (saved) setSavedLocations(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const fetchRecommendations = async () => {
    if (!location) return;
    
    setLoading(true);
    try {
      const type = selectedCategory === 'all' ? '' : `&type=${selectedCategory}`;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=5000${type}&key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho`
      );
      const data = await response.json();
      
      if (data.results) {
        const filtered = data.results
          .filter((place: any) => !isAlreadySaved(place))
          .slice(0, 20);
        setRecommendations(filtered);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      handleSave(recommendations[currentIndex]);
      nextCard();
    });
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      handleSkip(recommendations[currentIndex]);
      nextCard();
    });
  };

  const nextCard = () => {
    setCurrentIndex(prev => prev + 1);
    position.setValue({ x: 0, y: 0 });
  };

  const isAlreadySaved = (place: any) => {
    return savedLocations.some(
      loc => Math.abs(loc.latitude - place.geometry.location.lat) < 0.0001 &&
             Math.abs(loc.longitude - place.geometry.location.lng) < 0.0001
    );
  };

  const handleSave = async (place: any) => {
    try {
      const locationData = {
        name: place.name,
        address: place.vicinity,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        savedAt: new Date().toISOString(),
        rating: place.rating,
      };

      const updated = [locationData, ...savedLocations];
      setSavedLocations(updated);
      await AsyncStorage.setItem('savedLocations', JSON.stringify(updated));
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleSkip = (place: any) => {
    // Just skip, no action needed
  };

  const handleLikePress = () => {
    swipeRight();
  };

  const handleNopePress = () => {
    swipeLeft();
  };

  const currentPlace = recommendations[currentIndex];
  const nextPlace = recommendations[currentIndex + 1];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity onPress={() => { setCurrentIndex(0); fetchRecommendations(); }} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      {!loading && recommendations.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Ionicons name="location" size={16} color="#6366f1" />
            <Text style={styles.statText}>
              {recommendations.length - currentIndex} places to discover
            </Text>
          </View>
        </View>
      )}

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive
              ]}
              onPress={() => { setSelectedCategory(cat.id); setCurrentIndex(0); }}
            >
              <View style={[
                styles.categoryIconContainer,
                selectedCategory === cat.id && styles.categoryIconContainerActive
              ]}>
                <Ionicons 
                  name={cat.icon as any} 
                  size={20} 
                  color={selectedCategory === cat.id ? '#ffffff' : '#000000'} 
                />
              </View>
              <Text style={[
                styles.categoryText,
                selectedCategory === cat.id && styles.categoryTextActive
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Card Stack */}
      <View style={styles.cardContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Finding amazing places...</Text>
          </View>
        ) : currentIndex >= recommendations.length ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color="#10b981" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyText}>Try a different category</Text>
          </View>
        ) : (
          <>
            {nextPlace && (
              <View style={[styles.card, styles.nextCard]}>
                {nextPlace.photos && nextPlace.photos[0] && (
                  <Image
                    source={{
                      uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${nextPlace.photos[0].photo_reference}&key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho`
                    }}
                    style={styles.cardImage}
                  />
                )}
              </View>
            )}
            
            {currentPlace && (
              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  styles.card,
                  {
                    transform: [
                      { translateX: position.x },
                      { translateY: position.y },
                      { rotate },
                    ],
                  },
                ]}
              >
                {currentPlace.photos && currentPlace.photos[0] && (
                  <Image
                    source={{
                      uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${currentPlace.photos[0].photo_reference}&key=AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho`
                    }}
                    style={styles.cardImage}
                  />
                )}
                
                <Animated.View style={[styles.likeLabel, { opacity: likeOpacity }]}>
                  <Text style={styles.likeLabelText}>SAVE</Text>
                </Animated.View>
                
                <Animated.View style={[styles.nopeLabel, { opacity: nopeOpacity }]}>
                  <Text style={styles.nopeLabelText}>SKIP</Text>
                </Animated.View>

                <View style={styles.cardInfo}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardName}>{currentPlace.name}</Text>
                    {currentPlace.rating && (
                      <View style={styles.cardRating}>
                        <Ionicons name="star" size={16} color="#fbbf24" />
                        <Text style={styles.cardRatingText}>{currentPlace.rating}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardAddress} numberOfLines={2}>
                    {currentPlace.vicinity}
                  </Text>
                  {currentPlace.types && (
                    <View style={styles.cardTypes}>
                      {currentPlace.types.slice(0, 2).map((type: string, idx: number) => (
                        <View key={idx} style={styles.cardTypeChip}>
                          <Text style={styles.cardTypeText}>
                            {type.replace(/_/g, ' ')}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </Animated.View>
            )}
          </>
        )}
      </View>

      {/* Action Buttons */}
      {!loading && currentPlace && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.nopeButton} onPress={handleNopePress}>
            <Ionicons name="close" size={32} color="#ef4444" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.likeButton} onPress={handleLikePress}>
            <Ionicons name="heart" size={32} color="#10b981" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#000000',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'LeagueSpartan_700Bold',
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  statsBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'LeagueSpartan_600SemiBold',
  },
  categoriesContainer: {
    backgroundColor: '#f9fafb',
    paddingVertical: 20,
    zIndex: 10,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  categoryChip: {
    alignItems: 'center',
    gap: 8,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIconContainerActive: {
    backgroundColor: '#000000',
    shadowOpacity: 0.15,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: 'LeagueSpartan_600SemiBold',
  },
  categoryTextActive: {
    color: '#000000',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 16,
    fontFamily: 'LeagueSpartan_400Regular',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    fontFamily: 'LeagueSpartan_400Regular',
  },
  card: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.55,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  nextCard: {
    position: 'absolute',
    transform: [{ scale: 0.95 }],
    opacity: 0.5,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
  },
  likeLabel: {
    position: 'absolute',
    top: 50,
    right: 40,
    borderWidth: 4,
    borderColor: '#10b981',
    borderRadius: 8,
    padding: 8,
    transform: [{ rotate: '20deg' }],
  },
  likeLabelText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10b981',
    fontFamily: 'LeagueSpartan_700Bold',
  },
  nopeLabel: {
    position: 'absolute',
    top: 50,
    left: 40,
    borderWidth: 4,
    borderColor: '#ef4444',
    borderRadius: 8,
    padding: 8,
    transform: [{ rotate: '-20deg' }],
  },
  nopeLabelText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ef4444',
    fontFamily: 'LeagueSpartan_700Bold',
  },
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    marginRight: 12,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  cardRatingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'LeagueSpartan_700Bold',
  },
  cardAddress: {
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 12,
    opacity: 0.9,
    fontFamily: 'LeagueSpartan_400Regular',
  },
  cardTypes: {
    flexDirection: 'row',
    gap: 8,
  },
  cardTypeChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cardTypeText: {
    fontSize: 12,
    color: '#ffffff',
    textTransform: 'capitalize',
    fontFamily: 'LeagueSpartan_400Regular',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
    gap: 40,
    zIndex: 5,
  },
  nopeButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  likeButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#10b981',
  },
});
