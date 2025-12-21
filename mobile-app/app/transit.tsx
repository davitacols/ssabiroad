import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFonts, LeagueSpartan_400Regular, LeagueSpartan_700Bold } from '@expo-google-fonts/league-spartan';
import { useRouter } from 'expo-router';
import { useTheme, getColors } from '../contexts/ThemeContext';
import MenuBar from '../components/MenuBar';

const API_URL = 'https://ssabiroad.vercel.app/api';
const GOOGLE_API_KEY = 'AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho';

export default function Transit() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [fontsLoaded] = useFonts({ LeagueSpartan_400Regular, LeagueSpartan_700Bold });
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (origin.length > 2 && origin !== 'Current Location') {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`${API_URL}/places-autocomplete?input=${encodeURIComponent(origin)}`);
          const data = await res.json();
          setOriginSuggestions(data.predictions || []);
          setShowOriginSuggestions(true);
        } catch (err) {
          console.log('Autocomplete error:', err);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setOriginSuggestions([]);
      setShowOriginSuggestions(false);
    }
  }, [origin]);

  useEffect(() => {
    if (destination.length > 2) {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`${API_URL}/places-autocomplete?input=${encodeURIComponent(destination)}`);
          const data = await res.json();
          setDestSuggestions(data.predictions || []);
          setShowDestSuggestions(true);
        } catch (err) {
          console.log('Autocomplete error:', err);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setDestSuggestions([]);
      setShowDestSuggestions(false);
    }
  }, [destination]);

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);
      setOrigin('Current Location');
    }
  };

  const searchRoutes = async () => {
    if (!destination) return;
    
    setLoading(true);
    setError('');

    try {
      let originCoords = currentLocation;
      
      if (origin !== 'Current Location') {
        const geocodeRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(origin)}&key=${GOOGLE_API_KEY}`
        );
        const geocodeData = await geocodeRes.json();
        if (geocodeData.results[0]) {
          originCoords = geocodeData.results[0].geometry.location;
        }
      }

      const destRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination)}&key=${GOOGLE_API_KEY}`
      );
      const destData = await destRes.json();
      
      if (destData.results[0]) {
        const destCoords = destData.results[0].geometry.location;
        
        const res = await fetch(
          `${API_URL}/transit-directions?originLat=${originCoords.latitude || originCoords.lat}&originLng=${originCoords.longitude || originCoords.lng}&destLat=${destCoords.lat}&destLng=${destCoords.lng}`
        );
        const data = await res.json();
        
        if (data.routes) {
          setRoutes(data.routes);
        } else {
          setError('No transit routes found');
        }
      }
    } catch (err) {
      setError('Failed to find routes');
    }
    setLoading(false);
  };

  const swapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.card }]}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Transit Directions</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Plan your journey</Text>
        </View>
      </View>

      <View style={[styles.searchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View>
          <View style={styles.inputContainer}>
            <Ionicons name="location" size={20} color="#666" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={origin}
              onChangeText={setOrigin}
              placeholder="From"
              placeholderTextColor="#999"
              onFocus={() => originSuggestions.length > 0 && setShowOriginSuggestions(true)}
            />
          </View>
          {showOriginSuggestions && originSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {originSuggestions.map((suggestion: any) => (
                <TouchableOpacity
                  key={suggestion.place_id}
                  style={styles.suggestionItem}
                  onPress={() => {
                    setOrigin(suggestion.description);
                    setShowOriginSuggestions(false);
                  }}
                >
                  <Text style={styles.suggestionMain}>{suggestion.structured_formatting.main_text}</Text>
                  <Text style={styles.suggestionSecondary}>{suggestion.structured_formatting.secondary_text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity onPress={swapLocations} style={styles.swapButton}>
          <Ionicons name="swap-vertical" size={24} color="#3b82f6" />
        </TouchableOpacity>

        <View>
          <View style={styles.inputContainer}>
            <Ionicons name="navigate" size={20} color="#666" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={destination}
              onChangeText={setDestination}
              placeholder="To"
              placeholderTextColor="#999"
              onFocus={() => destSuggestions.length > 0 && setShowDestSuggestions(true)}
            />
          </View>
          {showDestSuggestions && destSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {destSuggestions.map((suggestion: any) => (
                <TouchableOpacity
                  key={suggestion.place_id}
                  style={styles.suggestionItem}
                  onPress={() => {
                    setDestination(suggestion.description);
                    setShowDestSuggestions(false);
                  }}
                >
                  <Text style={styles.suggestionMain}>{suggestion.structured_formatting.main_text}</Text>
                  <Text style={styles.suggestionSecondary}>{suggestion.structured_formatting.secondary_text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.searchButton, (!destination || !origin || loading) && styles.searchButtonDisabled]}
          onPress={searchRoutes}
          disabled={!destination || !origin || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Find Routes</Text>
          )}
        </TouchableOpacity>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      {routes.length > 0 && (
        <View style={styles.routesContainer}>
          <Text style={styles.routesTitle}>{routes.length} route{routes.length > 1 ? 's' : ''} found</Text>
          
          {routes.map((route, i) => (
            <View key={i} style={styles.routeCard}>
              <View style={styles.routeHeader}>
                <View>
                  <Text style={styles.routeDuration}>{route.duration}</Text>
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeInfoText}>{route.distance}</Text>
                    <Text style={styles.routeInfoText}> • </Text>
                    <Text style={styles.routeInfoText}>${route.fare}</Text>
                    <Text style={styles.routeInfoText}> • </Text>
                    <Ionicons name="leaf" size={12} color="#10b981" />
                    <Text style={styles.routeInfoText}> {route.carbonSaved}kg CO₂</Text>
                  </View>
                </View>
                {i === 0 && (
                  <View style={styles.fastestBadge}>
                    <Text style={styles.fastestBadgeText}>Fastest</Text>
                  </View>
                )}
              </View>

              <View style={styles.stepsContainer}>
                {route.steps.map((step: any, j: number) => (
                  <View key={j} style={styles.stepRow}>
                    <View style={styles.stepIconContainer}>
                      {step.transitDetails ? (
                        step.transitDetails.vehicle === 'BUS' ? (
                          <View style={styles.busIcon}>
                            <Ionicons name="bus" size={16} color="#f97316" />
                          </View>
                        ) : (
                          <View style={styles.trainIcon}>
                            <Ionicons name="train" size={16} color="#a855f7" />
                          </View>
                        )
                      ) : (
                        <View style={styles.walkIcon}>
                          <Ionicons name="walk" size={16} color="#666" />
                        </View>
                      )}
                      {j < route.steps.length - 1 && <View style={styles.stepLine} />}
                    </View>
                    
                    <View style={styles.stepContent}>
                      <Text style={styles.stepInstruction}>{step.instruction}</Text>
                      {step.transitDetails && (
                        <View style={styles.transitDetails}>
                          <Text style={styles.transitLine}>{step.transitDetails.line}</Text>
                          <Text style={styles.transitInfo}>
                            {step.transitDetails.departure} → {step.transitDetails.arrival}
                          </Text>
                          <Text style={styles.transitInfo}>
                            {step.transitDetails.numStops} stops • {step.duration}
                          </Text>
                        </View>
                      )}
                      {!step.transitDetails && (
                        <Text style={styles.stepDuration}>{step.duration} • {step.distance}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {routes.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bus" size={40} color="#3b82f6" />
          </View>
          <Text style={styles.emptyTitle}>Plan your journey</Text>
          <Text style={styles.emptyText}>Enter your destination to see available transit routes</Text>
        </View>
      )}
    </ScrollView>
    <MenuBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#000',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'LeagueSpartan_700Bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'LeagueSpartan_400Regular',
    color: '#999',
    marginTop: 4,
  },
  searchCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'LeagueSpartan_400Regular',
    color: '#111',
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionMain: {
    fontSize: 14,
    fontFamily: 'LeagueSpartan_700Bold',
    color: '#111',
    marginBottom: 2,
  },
  suggestionSecondary: {
    fontSize: 12,
    fontFamily: 'LeagueSpartan_400Regular',
    color: '#666',
  },
  swapButton: {
    alignSelf: 'center',
    padding: 8,
    marginVertical: 4,
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  searchButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontFamily: 'LeagueSpartan_400Regular',
  },
  routesContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  routesTitle: {
    fontSize: 18,
    fontFamily: 'LeagueSpartan_700Bold',
    marginBottom: 16,
    color: '#111',
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  routeDuration: {
    fontSize: 24,
    fontFamily: 'LeagueSpartan_700Bold',
    color: '#111',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  routeInfoText: {
    fontSize: 12,
    fontFamily: 'LeagueSpartan_400Regular',
    color: '#666',
  },
  fastestBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fastestBadgeText: {
    color: '#059669',
    fontSize: 12,
    fontFamily: 'LeagueSpartan_700Bold',
  },
  stepsContainer: {
    marginTop: 8,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepIconContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  busIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fed7aa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9d5ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e5e7eb',
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 14,
    fontFamily: 'LeagueSpartan_700Bold',
    color: '#111',
    marginBottom: 4,
  },
  transitDetails: {
    marginTop: 4,
  },
  transitLine: {
    fontSize: 12,
    fontFamily: 'LeagueSpartan_700Bold',
    color: '#111',
    marginBottom: 2,
  },
  transitInfo: {
    fontSize: 11,
    fontFamily: 'LeagueSpartan_400Regular',
    color: '#666',
    marginBottom: 2,
  },
  stepDuration: {
    fontSize: 11,
    fontFamily: 'LeagueSpartan_400Regular',
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'LeagueSpartan_700Bold',
    color: '#111',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'LeagueSpartan_400Regular',
    color: '#666',
    textAlign: 'center',
  },
});
