import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, SafeAreaView, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { analyzeLocation } from '../services/api';

export default function BatchProcessScreen() {
  const router = useRouter();
  const [photos, setPhotos] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const selectPhotos = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        setPhotos(result.assets);
        setResults([]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select photos');
    }
  };

  const processAll = async () => {
    if (photos.length === 0) return;
    
    setProcessing(true);
    const newResults = [];

    for (const photo of photos) {
      try {
        const data = await analyzeLocation(photo.uri, null);
        newResults.push({ 
          photo: photo.uri, 
          data, 
          success: !data.error && data.location,
          error: data.error || (!data.location ? 'No GPS data' : null)
        });
      } catch (error: any) {
        newResults.push({ 
          photo: photo.uri, 
          data: null, 
          success: false,
          error: error.message || 'Failed to process'
        });
      }
    }

    setResults(newResults);
    setProcessing(false);
    const successCount = newResults.filter(r => r.success).length;
    Alert.alert('Complete', `${successCount}/${photos.length} photos processed successfully`);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Batch Process</Text>
        {photos.length > 0 && (
          <TouchableOpacity onPress={() => { setPhotos([]); setResults([]); }}>
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {photos.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="images-outline" size={48} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>No photos selected</Text>
            <Text style={styles.emptyText}>Select multiple photos to process them all at once</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsCard}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{photos.length}</Text>
                <Text style={styles.statLabel}>Photos</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{results.filter(r => r.success).length}</Text>
                <Text style={styles.statLabel}>Processed</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{results.filter(r => !r.success).length}</Text>
                <Text style={styles.statLabel}>Failed</Text>
              </View>
            </View>

            <View style={styles.photosGrid}>
              {photos.map((photo, idx) => (
                <View key={idx} style={styles.photoCard}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                  <TouchableOpacity 
                    style={styles.removeBtn}
                    onPress={() => removePhoto(idx)}
                  >
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                  {results[idx] && (
                    <View style={[styles.statusBadge, results[idx].success ? styles.successBadge : styles.errorBadge]}>
                      <Ionicons 
                        name={results[idx].success ? "checkmark-circle" : "close-circle"} 
                        size={16} 
                        color="#fff" 
                      />
                    </View>
                  )}
                </View>
              ))}
            </View>

            {results.length > 0 && (
              <View style={styles.resultsSection}>
                <Text style={styles.sectionTitle}>Results</Text>
                {results.map((result, idx) => (
                  <View key={idx} style={[styles.resultCard, !result.success && styles.resultCardError]}>
                    {result.success && result.data ? (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" style={styles.resultIcon} />
                        <View style={styles.resultContent}>
                          <Text style={styles.resultName}>{result.data.name || 'Location'}</Text>
                          <Text style={styles.resultAddress} numberOfLines={1}>{result.data.address}</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <Ionicons name="close-circle" size={20} color="#ef4444" style={styles.resultIcon} />
                        <View style={styles.resultContent}>
                          <Text style={styles.resultErrorText}>Photo {idx + 1}</Text>
                          <Text style={styles.resultErrorDesc}>{result.error || 'Failed'}</Text>
                        </View>
                      </>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.selectBtn} onPress={selectPhotos}>
          <Ionicons name="add-circle-outline" size={20} color="#000" />
          <Text style={styles.selectText}>Select Photos</Text>
        </TouchableOpacity>
        
        {photos.length > 0 && (
          <TouchableOpacity 
            style={[styles.processBtn, processing && styles.processingBtn]} 
            onPress={processAll}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="flash" size={20} color="#fff" />
                <Text style={styles.processText}>Process All</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
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
  statsCard: { flexDirection: 'row', backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '700', color: '#000', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  photoCard: { width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  photoImage: { width: '100%', height: '100%', backgroundColor: '#f3f4f6' },
  removeBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12 },
  statusBadge: { position: 'absolute', bottom: 4, left: 4, borderRadius: 12, padding: 4 },
  successBadge: { backgroundColor: '#10b981' },
  errorBadge: { backgroundColor: '#ef4444' },
  resultsSection: { padding: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  resultCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, gap: 12 },
  resultCardError: { backgroundColor: '#fef2f2' },
  resultIcon: { flexShrink: 0 },
  resultContent: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 4 },
  resultAddress: { fontSize: 13, color: '#6b7280' },
  resultErrorText: { fontSize: 15, fontWeight: '600', color: '#ef4444', marginBottom: 4 },
  resultErrorDesc: { fontSize: 13, color: '#6b7280' },
  footer: { flexDirection: 'row', padding: 20, backgroundColor: '#fff', gap: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  selectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, padding: 16, gap: 8 },
  selectText: { fontSize: 15, fontWeight: '600', color: '#000' },
  processBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', borderRadius: 12, padding: 16, gap: 8 },
  processingBtn: { opacity: 0.7 },
  processText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

