import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Alert, TextInput, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useTheme, getColors } from '../contexts/ThemeContext';

export default function CollectionsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [collections, setCollections] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTag, setNewTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadCollections();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadCollections = async () => {
    try {
      const stored = await AsyncStorage.getItem('collections');
      if (stored) setCollections(JSON.parse(stored));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const createCollection = async () => {
    if (!newName.trim()) return;

    const collection = {
      id: Date.now().toString(),
      name: newName.trim(),
      tag: newTag.trim() || 'general',
      locations: [],
      createdAt: new Date().toISOString(),
    };

    const updated = [collection, ...collections];
    setCollections(updated);
    await AsyncStorage.setItem('collections', JSON.stringify(updated));
    
    setShowModal(false);
    setNewName('');
    setNewTag('');
  };

  const deleteCollection = async (id: string) => {
    Alert.alert('Delete Collection', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = collections.filter(c => c.id !== id);
          setCollections(updated);
          await AsyncStorage.setItem('collections', JSON.stringify(updated));
        },
      },
    ]);
  };

  const getTagColor = (tag: string) => {
    const colors: any = {
      work: '#3b82f6',
      travel: '#8b5cf6',
      food: '#f59e0b',
      nature: '#10b981',
      general: '#6b7280',
    };
    return colors[tag.toLowerCase()] || '#6b7280';
  };

  const exportCollection = async (collection: any) => {
    try {
      const data = JSON.stringify(collection, null, 2);
      const fileUri = `${FileSystem.documentDirectory}${collection.name.replace(/\s+/g, '_')}.json`;
      await FileSystem.writeAsStringAsync(fileUri, data);
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export collection');
    }
  };

  const filteredCollections = collections
    .filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = selectedFilter === 'all' || c.tag.toLowerCase() === selectedFilter.toLowerCase();
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return (b.locations?.length || 0) - (a.locations?.length || 0);
      return 0;
    });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <LinearGradient
        colors={theme === 'dark' ? ['#000000', '#1a1a1a'] : ['#ffffff', '#f9fafb']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Collections</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{collections.length} collection{collections.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowModal(true)} style={[styles.addButton, { backgroundColor: colors.card }]}>
            <Ionicons name="add" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search collections..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.filtersRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {['all', 'work', 'travel', 'food', 'nature', 'general'].map(filter => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => {
              const sorts: ('date' | 'name' | 'size')[] = ['date', 'name', 'size'];
              const currentIndex = sorts.indexOf(sortBy);
              setSortBy(sorts[(currentIndex + 1) % sorts.length]);
            }}
          >
            <Ionicons name="swap-vertical" size={20} color="#8b5cf6" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.savedLocationsCard}
          onPress={() => router.push('/saved-locations' as any)}
        >
          <View style={styles.savedLocationsIcon}>
            <Ionicons name="bookmark" size={24} color="#8b5cf6" />
          </View>
          <View style={styles.savedLocationsText}>
            <Text style={styles.savedLocationsTitle}>Saved Locations</Text>
            <Text style={styles.savedLocationsSubtitle}>View all your saved locations</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        {filteredCollections.length === 0 ? (
          <Animated.View style={[styles.empty, { opacity: fadeAnim }]}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={['#8b5cf6', '#6366f1']}
                style={styles.emptyIconGradient}
              >
                <Ionicons name="folder-outline" size={48} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>{searchQuery ? 'No results found' : 'No collections yet'}</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try a different search term' : 'Create collections to organize your locations'}
            </Text>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.grid, { opacity: fadeAnim }]}>
            {filteredCollections.map((collection) => (
              <TouchableOpacity 
                key={collection.id} 
                style={styles.collectionCard}
                onPress={() => router.push(`/collection-detail?id=${collection.id}` as any)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#ffffff', '#f9fafb']}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.tagBadge, { backgroundColor: getTagColor(collection.tag) }]}>
                      <Text style={styles.tagText}>{collection.tag}</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => exportCollection(collection)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="share-outline" size={18} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={[styles.cardIconContainer, { backgroundColor: getTagColor(collection.tag) + '20' }]}>
                    <Ionicons name="folder" size={32} color={getTagColor(collection.tag)} />
                  </View>
                  
                  <Text style={styles.collectionName} numberOfLines={2}>{collection.name}</Text>
                  
                  <View style={styles.cardFooter}>
                    <View style={styles.cardStat}>
                      <Ionicons name="location" size={14} color="#6b7280" />
                      <Text style={styles.cardStatText}>{collection.locations?.length || 0}</Text>
                    </View>
                    <Text style={styles.collectionDate}>
                      {new Date(collection.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deleteCollection(collection.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {collections.length > 0 && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name="folder" size={24} color="#8b5cf6" />
                <Text style={styles.statValue}>{collections.length}</Text>
                <Text style={styles.statLabel}>Collections</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="location" size={24} color="#10b981" />
                <Text style={styles.statValue}>{collections.reduce((sum, c) => sum + (c.locations?.length || 0), 0)}</Text>
                <Text style={styles.statLabel}>Locations</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="pricetag" size={24} color="#f59e0b" />
                <Text style={styles.statValue}>{new Set(collections.map(c => c.tag)).size}</Text>
                <Text style={styles.statLabel}>Tags</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Collection</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Collection Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Trip to Paris"
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tag (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., travel, work, food"
                value={newTag}
                onChangeText={setNewTag}
              />
            </View>

            <TouchableOpacity 
              style={[styles.createBtn, !newName.trim() && styles.createBtnDisabled]}
              onPress={createCollection}
              disabled={!newName.trim()}
            >
              <Text style={styles.createBtnText}>Create Collection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backButton: { marginRight: 16, padding: 4 },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 24, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginBottom: 2 },
  headerSubtitle: { fontSize: 13, fontFamily: 'LeagueSpartan_400Regular', color: '#9ca3af' },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'LeagueSpartan_400Regular', color: '#fff' },
  content: { flex: 1 },
  savedLocationsCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginTop: 16, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  savedLocationsIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  savedLocationsText: { flex: 1 },
  savedLocationsTitle: { fontSize: 16, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginBottom: 2 },
  savedLocationsSubtitle: { fontSize: 13, fontFamily: 'LeagueSpartan_400Regular', color: '#6b7280' },
  filtersRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingLeft: 20, gap: 12 },
  filtersScroll: { flex: 1 },
  filterChip: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  filterChipActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  filterText: { fontSize: 13, fontFamily: 'LeagueSpartan_600SemiBold', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  sortButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center', marginRight: 20 },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyIconContainer: { width: 96, height: 96, borderRadius: 48, overflow: 'hidden', marginBottom: 24, shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  emptyIconGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  collectionCard: { width: '47%', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  cardGradient: { padding: 16, position: 'relative' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 10, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fff', textTransform: 'uppercase' },
  countBadge: { fontSize: 14, fontFamily: 'LeagueSpartan_700Bold', color: '#6b7280' },
  cardIconContainer: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  collectionName: { fontSize: 16, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginBottom: 12, minHeight: 44 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardStatText: { fontSize: 13, fontFamily: 'LeagueSpartan_600SemiBold', color: '#6b7280' },
  collectionDate: { fontSize: 11, fontFamily: 'LeagueSpartan_400Regular', color: '#9ca3af' },
  deleteButton: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  statsCard: { backgroundColor: '#fff', margin: 20, padding: 24, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statsTitle: { fontSize: 16, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginBottom: 20 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 8 },
  statValue: { fontSize: 24, fontFamily: 'LeagueSpartan_700Bold', color: '#000' },
  statLabel: { fontSize: 11, fontFamily: 'LeagueSpartan_600SemiBold', color: '#6b7280', textTransform: 'uppercase' },
  bottomPadding: { height: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontFamily: 'LeagueSpartan_700Bold', color: '#000' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontFamily: 'LeagueSpartan_600SemiBold', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, fontSize: 16, color: '#000', borderWidth: 1, borderColor: '#e5e7eb' },
  createBtn: { backgroundColor: '#000', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  createBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  createBtnText: { fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fff' },
});
