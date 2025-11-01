import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Image, Modal, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CollectionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [collection, setCollection] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  useEffect(() => {
    loadCollection();
  }, []);

  const loadCollection = async () => {
    try {
      const stored = await AsyncStorage.getItem('collections');
      if (stored) {
        const collections = JSON.parse(stored);
        const found = collections.find((c: any) => c.id === id);
        setCollection(found);
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const getTagColor = (tag: string) => {
    const colors: any = {
      work: '#3b82f6',
      travel: '#8b5cf6',
      food: '#f59e0b',
      nature: '#10b981',
      general: '#6b7280',
    };
    return colors[tag?.toLowerCase()] || '#6b7280';
  };

  if (!collection) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{collection.name}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.collectionInfo}>
        <View style={[styles.tagBadge, { backgroundColor: getTagColor(collection.tag) }]}>
          <Text style={styles.tagText}>{collection.tag}</Text>
        </View>
        <Text style={styles.locationCount}>{collection.locations?.length || 0} locations</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {(!collection.locations || collection.locations.length === 0) ? (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No locations yet</Text>
            <Text style={styles.emptyText}>Add locations from scanner</Text>
          </View>
        ) : (
          <View style={styles.locationsList}>
            {collection.locations.map((location: any, idx: number) => (
              <TouchableOpacity key={idx} style={styles.locationCard} onPress={() => setSelectedLocation(location)}>
                {location.image && (
                  <Image source={{ uri: location.image }} style={styles.locationImage} />
                )}
                <View style={styles.locationContent}>
                  <Text style={styles.locationName}>{location.name || 'Location'}</Text>
                  <Text style={styles.locationAddress} numberOfLines={2}>{location.address}</Text>
                  {location.latitude && location.longitude && (
                    <Text style={styles.locationCoords}>
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </Text>
                  )}
                  <Text style={styles.locationDate}>
                    Added {new Date(location.savedAt).toLocaleDateString()}
                  </Text>
                  {location.notes && (
                    <View style={styles.hasNotesIndicator}>
                      <Ionicons name="document-text" size={14} color="#8b5cf6" />
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!selectedLocation} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedLocation(null)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedLocation?.image && (
                <Image source={{ uri: selectedLocation.image }} style={styles.modalImage} />
              )}

              <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedLocation?.name || 'Location'}</Text>
              <Text style={styles.modalAddress}>{selectedLocation?.address}</Text>
              
              {selectedLocation?.latitude && selectedLocation?.longitude && (
                <View style={styles.modalCoords}>
                  <Ionicons name="location" size={16} color="#6b7280" />
                  <Text style={styles.modalCoordsText}>
                    {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                  </Text>
                </View>
              )}

              {selectedLocation?.notes && (
                <View style={styles.modalNotes}>
                  <Text style={styles.modalNotesLabel}>Notes</Text>
                  <Text style={styles.modalNotesText}>{selectedLocation.notes}</Text>
                </View>
              )}

                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={() => {
                    if (selectedLocation?.latitude && selectedLocation?.longitude) {
                      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.latitude},${selectedLocation.longitude}`);
                    }
                  }}
                >
                  <Ionicons name="navigate" size={20} color="#fff" />
                  <Text style={styles.modalButtonText}>Navigate</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  headerTitle: { fontSize: 20, fontFamily: 'LeagueSpartan_700Bold', color: '#000', flex: 1 },
  placeholder: { width: 28 },
  collectionInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tagBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  tagText: { fontSize: 12, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fff', textTransform: 'uppercase' },
  locationCount: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', color: '#6b7280' },
  content: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 16, color: '#6b7280' },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontFamily: 'LeagueSpartan_600SemiBold', color: '#374151', marginTop: 16, marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#9ca3af' },
  locationsList: { padding: 20, gap: 12 },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  locationImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#f3f4f6' },
  locationContent: { flex: 1, marginLeft: 12 },
  locationName: { fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold', color: '#000', marginBottom: 4 },
  locationAddress: { fontSize: 13, color: '#6b7280', marginBottom: 6, lineHeight: 18 },
  locationCoords: { fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', marginBottom: 4 },
  locationDate: { fontSize: 11, color: '#9ca3af' },
  hasNotesIndicator: { flexDirection: 'row', gap: 6, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '90%', maxHeight: '80%', backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' },
  modalClose: { position: 'absolute', top: 16, right: 16, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
  modalImage: { width: '100%', height: 300, backgroundColor: '#f3f4f6' },
  modalContent: { padding: 24 },
  modalTitle: { fontSize: 22, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginBottom: 8 },
  modalAddress: { fontSize: 15, color: '#6b7280', marginBottom: 16, lineHeight: 22 },
  modalCoords: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  modalCoordsText: { fontSize: 13, color: '#6b7280', fontFamily: 'monospace' },
  modalNotes: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 16 },
  modalNotesLabel: { fontSize: 12, fontFamily: 'LeagueSpartan_600SemiBold', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalNotesText: { fontSize: 14, color: '#000', lineHeight: 20 },
  modalButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', borderRadius: 12, padding: 16, gap: 8 },
  modalButtonText: { fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fff' },
});


