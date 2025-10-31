import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AISearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await fetch('https://pic2nav.com/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.places || []);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError('Failed to search. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Search</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="e.g., volleyball places in Lagos"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity 
          style={[styles.searchButton, loading && styles.searchButtonDisabled]} 
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={24} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {results.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>Found {results.length} places</Text>
            {results.map((place, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={styles.placeCard}
                onPress={() => {
                  if (place.location) {
                    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}`);
                  }
                }}
              >
                <View style={styles.placeHeader}>
                  <Ionicons name="location" size={20} color="#8b5cf6" />
                  <Text style={styles.placeName}>{place.name}</Text>
                </View>
                
                {place.address && (
                  <Text style={styles.placeAddress}>{place.address}</Text>
                )}
                
                <View style={styles.placeDetails}>
                  {place.rating && (
                    <View style={styles.placeRating}>
                      <Ionicons name="star" size={14} color="#f59e0b" />
                      <Text style={styles.ratingText}>{place.rating}</Text>
                    </View>
                  )}
                  {place.open_now !== undefined && (
                    <View style={[styles.statusBadge, place.open_now ? styles.openBadge : styles.closedBadge]}>
                      <Text style={styles.statusText}>{place.open_now ? 'Open' : 'Closed'}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity style={styles.navigateButton}>
                  <Ionicons name="navigate" size={16} color="#8b5cf6" />
                  <Text style={styles.navigateText}>Navigate</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!loading && !error && results.length === 0 && query && (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyText}>Try a different search query</Text>
          </View>
        )}

        {!query && (
          <View style={styles.examples}>
            <Text style={styles.examplesTitle}>Try asking:</Text>
            {[
              'volleyball courts in Lagos',
              'best restaurants in Paris',
              'gyms near Times Square',
              'coffee shops in Tokyo',
            ].map((example, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={styles.exampleChip}
                onPress={() => setQuery(example)}
              >
                <Text style={styles.exampleText}>{example}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: '#fff' },
  backButton: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000', flex: 1 },
  placeholder: { width: 28 },
  searchSection: { flexDirection: 'row', padding: 20, gap: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#000', paddingVertical: 14 },
  searchButton: { backgroundColor: '#8b5cf6', borderRadius: 12, padding: 14, alignItems: 'center', justifyContent: 'center', width: 50 },
  searchButtonDisabled: { opacity: 0.6 },
  content: { flex: 1 },
  errorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', margin: 20, padding: 16, borderRadius: 12, gap: 12, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { flex: 1, fontSize: 14, color: '#dc2626', fontWeight: '500' },
  resultsSection: { padding: 20 },
  resultsTitle: { fontSize: 16, fontWeight: '700', color: '#6b7280', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  placeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  placeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  placeName: { fontSize: 16, fontWeight: '600', color: '#000', flex: 1 },
  placeAddress: { fontSize: 13, color: '#6b7280', marginBottom: 12, lineHeight: 18 },
  placeDetails: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  placeRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, fontWeight: '600', color: '#000' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  openBadge: { backgroundColor: '#dcfce7' },
  closedBadge: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 11, fontWeight: '600', color: '#000', textTransform: 'uppercase' },
  navigateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f3ff', borderRadius: 10, padding: 12, gap: 6 },
  navigateText: { fontSize: 14, fontWeight: '600', color: '#8b5cf6' },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#9ca3af' },
  examples: { padding: 20 },
  examplesTitle: { fontSize: 14, fontWeight: '700', color: '#6b7280', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  exampleChip: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  exampleText: { fontSize: 14, color: '#000' },
});
