import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import MenuBar from '../../components/MenuBar';

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [view, setView] = useState<'timeline' | 'map'>('timeline');
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const saved = await SecureStore.getItemAsync('savedLocations');
      if (saved) {
        const locations = JSON.parse(saved);
        setHistory(locations.sort((a: any, b: any) => 
          new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const filterHistory = () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    return history.filter(item => {
      const time = new Date(item.savedAt).getTime();
      if (filter === 'today') return now - time < day;
      if (filter === 'week') return now - time < 7 * day;
      if (filter === 'month') return now - time < 30 * day;
      return true;
    });
  };

  const groupByDate = (items: any[]) => {
    const groups: { [key: string]: any[] } = {};
    items.forEach(item => {
      const date = new Date(item.savedAt).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  };

  const filtered = filterHistory();
  const grouped = groupByDate(filtered);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity 
            style={[styles.toggleBtn, view === 'timeline' && styles.toggleActive]}
            onPress={() => setView('timeline')}
          >
            <Ionicons name="list" size={18} color={view === 'timeline' ? '#fff' : '#6b7280'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, view === 'map' && styles.toggleActive]}
            onPress={() => setView('map')}
          >
            <Ionicons name="map" size={18} color={view === 'map' ? '#fff' : '#6b7280'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        {['all', 'today', 'week', 'month'].map(f => (
          <TouchableOpacity 
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f as any)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {view === 'timeline' ? (
          Object.keys(grouped).length > 0 ? (
            Object.entries(grouped).map(([date, items]) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>{date}</Text>
                {items.map((item, idx) => (
                  <TouchableOpacity key={idx} style={styles.historyCard}>
                    {item.image && <Image source={{ uri: item.image }} style={styles.thumbnail} />}
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.name || 'Location'}</Text>
                      <Text style={styles.cardAddress} numberOfLines={2}>{item.address}</Text>
                      <Text style={styles.cardTime}>{new Date(item.savedAt).toLocaleTimeString()}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                ))}
              </View>
            ))
          ) : (
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No history</Text>
              <Text style={styles.emptyText}>Scanned locations will appear here</Text>
            </View>
          )
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={64} color="#d1d5db" />
            <Text style={styles.mapText}>Map view with {filtered.length} locations</Text>
            <Text style={styles.mapSubtext}>Coming soon</Text>
          </View>
        )}
      </ScrollView>

      <MenuBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: '#fff' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#000' },
  viewToggle: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 8, padding: 2 },
  toggleBtn: { padding: 8, borderRadius: 6 },
  toggleActive: { backgroundColor: '#000' },
  filters: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, maxHeight: 60 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
  filterActive: { backgroundColor: '#000' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  content: { flex: 1, paddingHorizontal: 20 },
  dateGroup: { marginTop: 20 },
  dateHeader: { fontSize: 13, fontWeight: '700', color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  thumbnail: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#f3f4f6' },
  cardContent: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 2 },
  cardAddress: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  cardTime: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#9ca3af' },
  mapPlaceholder: { alignItems: 'center', paddingVertical: 100 },
  mapText: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 20 },
  mapSubtext: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
});
