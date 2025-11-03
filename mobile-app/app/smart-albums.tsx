import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, SafeAreaView, StatusBar, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { getSmartAlbums, createSmartAlbum, getDefaultAlbums, SmartAlbum } from '../services/smartAlbums';

export default function SmartAlbumsScreen() {
  const router = useRouter();
  const [albums, setAlbums] = useState<SmartAlbum[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    const data = await getSmartAlbums();
    setAlbums(data);
  };

  const initializeDefaultAlbums = async () => {
    const defaults = getDefaultAlbums();
    for (const album of defaults) {
      await createSmartAlbum(album.name, album.type, album.filter);
    }
    loadAlbums();
    Alert.alert('Success', 'Default albums created');
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'category': return 'grid-outline';
      case 'style': return 'color-palette-outline';
      case 'region': return 'location-outline';
      case 'period': return 'time-outline';
      default: return 'folder-outline';
    }
  };

  const filteredAlbums = albums.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Smart Albums</Text>
          <Text style={styles.headerSubtitle}>AI-organized collections</Text>
        </View>
        <TouchableOpacity onPress={initializeDefaultAlbums}>
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search albums..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredAlbums.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="albums-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Albums Yet</Text>
            <Text style={styles.emptyText}>Create smart albums to organize your photos</Text>
            <TouchableOpacity style={styles.createButton} onPress={initializeDefaultAlbums}>
              <Text style={styles.createButtonText}>Create Default Albums</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredAlbums.map(album => (
              <TouchableOpacity
                key={album.id}
                style={styles.albumCard}
                onPress={() => router.push(`/ai-organize`)}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#6366f1']}
                  style={styles.albumGradient}
                >
                  {album.coverPhoto ? (
                    <Image source={{ uri: album.coverPhoto }} style={styles.albumCover} />
                  ) : (
                    <View style={styles.albumPlaceholder}>
                      <Ionicons name={getCategoryIcon(album.type)} size={40} color="#fff" />
                    </View>
                  )}
                </LinearGradient>
                <View style={styles.albumInfo}>
                  <Text style={styles.albumName}>{album.name}</Text>
                  <Text style={styles.albumCount}>{album.photoCount} photos</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#000' },
  backButton: { padding: 8 },
  headerContent: { flex: 1, marginLeft: 8 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#9ca3af', marginTop: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: '#1a1a1a', borderRadius: 12, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 12 },
  content: { flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#9ca3af', marginTop: 8, textAlign: 'center' },
  createButton: { marginTop: 24, backgroundColor: '#8b5cf6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  albumCard: { width: '48%', margin: '1%', borderRadius: 16, overflow: 'hidden', backgroundColor: '#1a1a1a' },
  albumGradient: { width: '100%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  albumCover: { width: '100%', height: '100%' },
  albumPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  albumInfo: { padding: 12 },
  albumName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  albumCount: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
});
