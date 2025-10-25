import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export default function CollectionsScreen() {
  const router = useRouter();
  const [collections, setCollections] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadCollections();
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Collections</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Ionicons name="add-circle" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {collections.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="folder-outline" size={48} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>No collections yet</Text>
            <Text style={styles.emptyText}>Create collections to organize your locations</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {collections.map((collection) => (
              <TouchableOpacity 
                key={collection.id} 
                style={styles.collectionCard}
                onPress={() => router.push(`/collection-detail?id=${collection.id}` as any)}
                onLongPress={() => deleteCollection(collection.id)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.tagBadge, { backgroundColor: getTagColor(collection.tag) }]}>
                    <Text style={styles.tagText}>{collection.tag}</Text>
                  </View>
                  <Text style={styles.countBadge}>{collection.locations?.length || 0}</Text>
                </View>
                
                <View style={styles.cardIcon}>
                  <Ionicons name="folder" size={32} color={getTagColor(collection.tag)} />
                </View>
                
                <Text style={styles.collectionName} numberOfLines={2}>{collection.name}</Text>
                <Text style={styles.collectionDate}>
                  {new Date(collection.createdAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.tagsSection}>
          <Text style={styles.sectionTitle}>Popular Tags</Text>
          <View style={styles.tagsGrid}>
            {['Work', 'Travel', 'Food', 'Nature', 'General'].map(tag => (
              <View key={tag} style={[styles.tagChip, { borderColor: getTagColor(tag) }]}>
                <View style={[styles.tagDot, { backgroundColor: getTagColor(tag) }]} />
                <Text style={styles.tagChipText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: '#fff' },
  backButton: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000', flex: 1 },
  content: { flex: 1 },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  collectionCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: '600', color: '#fff', textTransform: 'uppercase' },
  countBadge: { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  cardIcon: { marginBottom: 12 },
  collectionName: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 4, height: 40 },
  collectionDate: { fontSize: 11, color: '#9ca3af' },
  tagsSection: { padding: 20, marginTop: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#6b7280', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, gap: 6 },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  tagChipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#000' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, fontSize: 16, color: '#000', borderWidth: 1, borderColor: '#e5e7eb' },
  createBtn: { backgroundColor: '#000', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8 },
  createBtnDisabled: { opacity: 0.5 },
  createBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
