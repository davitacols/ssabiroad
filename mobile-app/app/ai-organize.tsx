import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, SafeAreaView, StatusBar, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { PhotoMetadata, searchPhotos, groupByCategory, groupByStyle, groupByRegion, findSimilarPhotos } from '../services/aiCategorization';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AIOrganizeScreen() {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<'category' | 'style' | 'region'>('category');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMetadata | null>(null);
  const [similarPhotos, setSimilarPhotos] = useState<PhotoMetadata[]>([]);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    const data = await AsyncStorage.getItem('@categorized_photos');
    if (data) {
      setPhotos(JSON.parse(data));
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return photos;
    return searchPhotos(photos, searchQuery);
  };

  const getGroupedPhotos = () => {
    const filtered = searchQuery ? handleSearch() : photos;
    
    switch (groupBy) {
      case 'category':
        return groupByCategory(filtered);
      case 'style':
        return groupByStyle(filtered);
      case 'region':
        return groupByRegion(filtered);
      default:
        return {};
    }
  };

  const viewSimilar = (photo: PhotoMetadata) => {
    setSelectedPhoto(photo);
    const similar = findSimilarPhotos(photo, photos);
    setSimilarPhotos(similar);
  };

  const grouped = getGroupedPhotos();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>AI Organize</Text>
          <Text style={styles.headerSubtitle}>{photos.length} photos</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Victorian buildings, downtown, landmarks..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Group by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(['category', 'style', 'region'] as const).map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.filterChip, groupBy === type && styles.filterChipActive]}
              onPress={() => setGroupBy(type)}
            >
              <Text style={[styles.filterChipText, groupBy === type && styles.filterChipTextActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {Object.entries(grouped).map(([group, groupPhotos]) => (
          <View key={group} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{group}</Text>
              <Text style={styles.sectionCount}>{groupPhotos.length}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {groupPhotos.map((photo, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.photoCard}
                  onPress={() => viewSimilar(photo)}
                >
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                  <View style={styles.photoTags}>
                    {photo.tags.slice(0, 2).map((tag, i) => (
                      <View key={i} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))}

        {selectedPhoto && similarPhotos.length > 0 && (
          <View style={styles.similarSection}>
            <Text style={styles.similarTitle}>Similar Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {similarPhotos.map((photo, idx) => (
                <View key={idx} style={styles.similarCard}>
                  <Image source={{ uri: photo.uri }} style={styles.similarImage} />
                  <Text style={styles.similarScore}>{Math.round((photo.similarity || 0) * 100)}%</Text>
                </View>
              ))}
            </ScrollView>
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
  filterContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
  filterLabel: { fontSize: 14, color: '#9ca3af', marginRight: 12 },
  filterScroll: { flex: 1 },
  filterChip: { backgroundColor: '#1a1a1a', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  filterChipActive: { backgroundColor: '#8b5cf6' },
  filterChipText: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  content: { flex: 1 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  sectionCount: { fontSize: 14, color: '#9ca3af', backgroundColor: '#1a1a1a', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  photoCard: { width: 160, marginLeft: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1a1a1a' },
  photoImage: { width: '100%', height: 160 },
  photoTags: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 4 },
  tag: { backgroundColor: '#8b5cf6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  similarSection: { padding: 16, backgroundColor: '#1a1a1a', marginHorizontal: 16, marginBottom: 16, borderRadius: 16 },
  similarTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  similarCard: { width: 120, marginRight: 12, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  similarImage: { width: '100%', height: 120 },
  similarScore: { position: 'absolute', top: 8, right: 8, backgroundColor: '#10b981', color: '#fff', fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
});
