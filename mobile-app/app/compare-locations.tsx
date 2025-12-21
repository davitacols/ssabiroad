import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, getColors } from '../contexts/ThemeContext';

export default function CompareLocationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSavedLocations();
  }, []);

  const loadSavedLocations = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedLocations');
      if (saved) setSavedLocations(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const toggleLocation = (location: any) => {
    if (selectedLocations.find(l => l.latitude === location.latitude && l.longitude === location.longitude)) {
      setSelectedLocations(selectedLocations.filter(l => !(l.latitude === location.latitude && l.longitude === location.longitude)));
    } else if (selectedLocations.length < 3) {
      setSelectedLocations([...selectedLocations, location]);
    }
  };

  const compareLocations = async () => {
    if (selectedLocations.length < 2) return;
    
    setLoading(true);
    try {
      const data = await Promise.all(
        selectedLocations.map(async (loc) => {
          const weatherRes = await fetch(`https://ssabiroad.vercel.app/api/weather?lat=${loc.latitude}&lon=${loc.longitude}`);
          const weather = await weatherRes.json();
          
          return {
            name: loc.name,
            address: loc.address,
            latitude: loc.latitude,
            longitude: loc.longitude,
            weather: weather.current,
            image: loc.image,
          };
        })
      );
      setComparisonData(data);
    } catch (error) {
      console.error('Comparison error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (location: any) => {
    return selectedLocations.some(l => l.latitude === location.latitude && l.longitude === location.longitude);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Compare Locations</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{selectedLocations.length}/3</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {!comparisonData.length ? (
          <>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color="#6366f1" />
              <Text style={styles.infoText}>Select 2-3 locations to compare</Text>
            </View>

            <View style={styles.locationsSection}>
              <Text style={styles.sectionTitle}>YOUR SAVED LOCATIONS</Text>
              {savedLocations.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="bookmark-outline" size={48} color="#9ca3af" />
                  <Text style={styles.emptyText}>No saved locations</Text>
                  <Text style={styles.emptySubtext}>Save locations from scanner to compare them</Text>
                </View>
              ) : (
                savedLocations.map((location, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.locationCard, isSelected(location) && styles.locationCardSelected]}
                    onPress={() => toggleLocation(location)}
                  >
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationName}>{location.name || 'Location'}</Text>
                      <Text style={styles.locationAddress} numberOfLines={1}>{location.address}</Text>
                    </View>
                    {isSelected(location) && (
                      <Ionicons name="checkmark-circle" size={24} color="#6366f1" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>

            {selectedLocations.length >= 2 && (
              <TouchableOpacity style={styles.compareButton} onPress={compareLocations}>
                <Ionicons name="git-compare" size={20} color="#fff" />
                <Text style={styles.compareButtonText}>Compare {selectedLocations.length} Locations</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.resetButton} onPress={() => { setComparisonData([]); setSelectedLocations([]); }}>
              <Ionicons name="refresh" size={20} color="#6366f1" />
              <Text style={styles.resetButtonText}>New Comparison</Text>
            </TouchableOpacity>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.comparisonScroll}>
              {comparisonData.map((data, idx) => (
                <View key={idx} style={styles.comparisonCard}>
                  <Text style={styles.comparisonName}>{data.name}</Text>
                  <Text style={styles.comparisonAddress} numberOfLines={2}>{data.address}</Text>
                  
                  <View style={styles.comparisonSection}>
                    <Text style={styles.comparisonLabel}>Weather</Text>
                    <Text style={styles.comparisonValue}>{data.weather.temp}°C</Text>
                    <Text style={styles.comparisonDesc}>{data.weather.description}</Text>
                  </View>

                  <View style={styles.comparisonSection}>
                    <Text style={styles.comparisonLabel}>Feels Like</Text>
                    <Text style={styles.comparisonValue}>{data.weather.feelsLike}°C</Text>
                  </View>

                  <View style={styles.comparisonSection}>
                    <Text style={styles.comparisonLabel}>Humidity</Text>
                    <Text style={styles.comparisonValue}>{data.weather.humidity}%</Text>
                  </View>

                  <View style={styles.comparisonSection}>
                    <Text style={styles.comparisonLabel}>Wind Speed</Text>
                    <Text style={styles.comparisonValue}>{data.weather.windSpeed} km/h</Text>
                  </View>

                  <View style={styles.comparisonSection}>
                    <Text style={styles.comparisonLabel}>Coordinates</Text>
                    <Text style={styles.comparisonCoords}>
                      {data.latitude.toFixed(4)}, {data.longitude.toFixed(4)}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Quick Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Warmest:</Text>
                <Text style={styles.summaryValue}>
                  {comparisonData.reduce((max, d) => d.weather.temp > max.weather.temp ? d : max).name}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Coldest:</Text>
                <Text style={styles.summaryValue}>
                  {comparisonData.reduce((min, d) => d.weather.temp < min.weather.temp ? d : min).name}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Most Humid:</Text>
                <Text style={styles.summaryValue}>
                  {comparisonData.reduce((max, d) => d.weather.humidity > max.weather.humidity ? d : max).name}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Comparing locations...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: '#fff' },
  backButton: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'LeagueSpartan_700Bold', color: '#000', flex: 1, fontFamily: 'LeagueSpartan_700Bold' },
  badge: { backgroundColor: '#6366f1', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 12, fontFamily: 'LeagueSpartan_700Bold', fontFamily: 'LeagueSpartan_700Bold' },
  content: { flex: 1 },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', margin: 20, padding: 16, borderRadius: 12, gap: 12 },
  infoText: { fontSize: 14, color: '#4338ca', fontFamily: 'LeagueSpartan_600SemiBold', fontFamily: 'LeagueSpartan_600SemiBold' },
  locationsSection: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 12, fontFamily: 'LeagueSpartan_700Bold', color: '#6b7280', marginBottom: 16, letterSpacing: 1.5, fontFamily: 'LeagueSpartan_700Bold' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold', color: '#6b7280', marginTop: 16, fontFamily: 'LeagueSpartan_600SemiBold' },
  emptySubtext: { fontSize: 14, color: '#9ca3af', marginTop: 4, textAlign: 'center', fontFamily: 'LeagueSpartan_400Regular' },
  locationCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  locationCardSelected: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  locationInfo: { flex: 1 },
  locationName: { fontSize: 16, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginBottom: 4, fontFamily: 'LeagueSpartan_700Bold' },
  locationAddress: { fontSize: 13, color: '#6b7280', fontFamily: 'LeagueSpartan_400Regular' },
  compareButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6366f1', margin: 20, padding: 18, borderRadius: 12, gap: 8 },
  compareButtonText: { color: '#fff', fontSize: 16, fontFamily: 'LeagueSpartan_700Bold', fontFamily: 'LeagueSpartan_700Bold' },
  resetButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', margin: 20, padding: 16, borderRadius: 12, gap: 8, borderWidth: 2, borderColor: '#6366f1' },
  resetButtonText: { color: '#6366f1', fontSize: 15, fontFamily: 'LeagueSpartan_700Bold', fontFamily: 'LeagueSpartan_700Bold' },
  comparisonScroll: { paddingHorizontal: 20 },
  comparisonCard: { width: 280, backgroundColor: '#fff', borderRadius: 16, padding: 20, marginRight: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  comparisonName: { fontSize: 18, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginBottom: 4, fontFamily: 'LeagueSpartan_700Bold' },
  comparisonAddress: { fontSize: 13, color: '#6b7280', marginBottom: 20, fontFamily: 'LeagueSpartan_400Regular' },
  comparisonSection: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  comparisonLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4, fontFamily: 'LeagueSpartan_400Regular' },
  comparisonValue: { fontSize: 24, fontFamily: 'LeagueSpartan_700Bold', color: '#000', fontFamily: 'LeagueSpartan_700Bold' },
  comparisonDesc: { fontSize: 13, color: '#6b7280', textTransform: 'capitalize', fontFamily: 'LeagueSpartan_400Regular' },
  comparisonCoords: { fontSize: 12, color: '#000', fontFamily: 'LeagueSpartan_600SemiBold' },
  summaryCard: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 16, marginBottom: 100 },
  summaryTitle: { fontSize: 16, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginBottom: 16, fontFamily: 'LeagueSpartan_700Bold' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  summaryLabel: { fontSize: 14, color: '#6b7280', fontFamily: 'LeagueSpartan_400Regular' },
  summaryValue: { fontSize: 14, fontFamily: 'LeagueSpartan_600SemiBold', color: '#000', fontFamily: 'LeagueSpartan_600SemiBold' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold', marginTop: 12, fontFamily: 'LeagueSpartan_600SemiBold' },
});
