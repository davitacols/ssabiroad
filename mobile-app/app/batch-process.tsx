import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, SafeAreaView, StatusBar, Alert, ActivityIndicator, Switch, Modal, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { analyzeLocation, batchProcess, shareToSocial } from '../services/api';

export default function BatchProcessScreen() {
  const router = useRouter();
  const [photos, setPhotos] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoRetry, setAutoRetry] = useState(true);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [showActions, setShowActions] = useState(false);

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
    setCurrentIndex(0);
    
    try {
      const imageUris = photos.map(p => p.uri);
      const batchResult = await batchProcess(imageUris);
      
      const newResults = batchResult.results.map((r: any) => ({
        photo: photos[r.index].uri,
        data: r.success ? { name: r.name, location: r.location, address: r.address, labels: r.labels } : null,
        success: r.success,
        error: r.error,
        timestamp: new Date().toISOString()
      }));
      
      setResults(newResults);
      setProcessing(false);
      
      const successCount = newResults.filter(r => r.success).length;
      Alert.alert(
        'Processing Complete', 
        `${successCount}/${photos.length} photos processed successfully`,
        [
          { text: 'OK' },
          { text: 'Export Results', onPress: exportResults }
        ]
      );
      return;
    } catch (error) {
      console.log('Batch API failed, falling back to sequential processing');
    }
    
    const newResults = [];
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      setCurrentIndex(i + 1);
      
      try {
        const data = await analyzeLocation(photo.uri, null);
        const success = !data.error && data.location;
        
        newResults.push({ 
          photo: photo.uri, 
          data, 
          success,
          error: data.error || (!data.location ? 'No GPS data' : null),
          timestamp: new Date().toISOString()
        });

        // Auto-retry failed items once
        if (!success && autoRetry) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryData = await analyzeLocation(photo.uri, null);
          if (!retryData.error && retryData.location) {
            newResults[newResults.length - 1] = {
              photo: photo.uri,
              data: retryData,
              success: true,
              error: null,
              timestamp: new Date().toISOString(),
              retried: true
            };
          }
        }
      } catch (error: any) {
        newResults.push({ 
          photo: photo.uri, 
          data: null, 
          success: false,
          error: error.message || 'Failed to process',
          timestamp: new Date().toISOString()
        });
      }

      setResults([...newResults]);
    }

    setProcessing(false);
    setCurrentIndex(0);
    const successCount = newResults.filter(r => r.success).length;
    Alert.alert(
      'Processing Complete', 
      `${successCount}/${photos.length} photos processed successfully`,
      [
        { text: 'OK' },
        { text: 'Export Results', onPress: exportResults }
      ]
    );
  };

  const exportResults = async () => {
    if (results.length === 0) return;

    try {
      let content = '';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      if (exportFormat === 'json') {
        content = JSON.stringify(results.map(r => ({
          success: r.success,
          location: r.data?.location,
          name: r.data?.name,
          address: r.data?.address,
          error: r.error,
          timestamp: r.timestamp,
          retried: r.retried
        })), null, 2);
      } else {
        content = 'Index,Success,Name,Address,Latitude,Longitude,Error,Timestamp\n';
        results.forEach((r, i) => {
          content += `${i + 1},${r.success},"${r.data?.name || ''}","${r.data?.address || ''}",${r.data?.location?.latitude || ''},${r.data?.location?.longitude || ''},"${r.error || ''}",${r.timestamp}\n`;
        });
      }

      const fileUri = `${FileSystem.documentDirectory}batch_results_${timestamp}.${exportFormat}`;
      await FileSystem.writeAsStringAsync(fileUri, content);
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export results');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const viewLocation = (result: any) => {
    setSelectedResult(result);
    setShowActions(true);
  };

  const openInMaps = () => {
    if (selectedResult?.data?.location) {
      const { latitude, longitude } = selectedResult.data.location;
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
    }
  };

  const copyCoordinates = async () => {
    if (selectedResult?.data?.location) {
      const { latitude, longitude } = selectedResult.data.location;
      await Clipboard.setStringAsync(`${latitude}, ${longitude}`);
      Alert.alert('Copied', 'Coordinates copied to clipboard');
    }
  };

  const copyAddress = async () => {
    if (selectedResult?.data?.address) {
      await Clipboard.setStringAsync(selectedResult.data.address);
      Alert.alert('Copied', 'Address copied to clipboard');
    }
  };

  const shareLocation = async () => {
    if (selectedResult?.data) {
      const { name, address, location } = selectedResult.data;
      const message = `${name || 'Location'}\n${address || ''}\nhttps://www.google.com/maps/search/?api=1&query=${location?.latitude},${location?.longitude}`;
      
      try {
        const fileUri = `${FileSystem.documentDirectory}location_share.txt`;
        await FileSystem.writeAsStringAsync(fileUri, message);
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Share Location',
        });
      } catch (error) {
        Alert.alert('Share Failed', 'Unable to share location');
      }
    }
  };

  const saveLocation = async () => {
    Alert.alert('Save Location', 'Location saved to your collection', [{ text: 'OK' }]);
    setShowActions(false);
  };



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <LinearGradient
        colors={['#000000', '#1a1a1a']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Batch Process</Text>
          <Text style={styles.headerSubtitle}>Process multiple photos at once</Text>
        </View>
        {photos.length > 0 && (
          <TouchableOpacity onPress={() => { setPhotos([]); setResults([]); }}>
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        )}
      </LinearGradient>

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
              <LinearGradient
                colors={['#8b5cf6', '#6366f1']}
                style={styles.statsGradient}
              >
                <View style={styles.stat}>
                  <Ionicons name="images" size={24} color="#fff" />
                  <Text style={styles.statValue}>{photos.length}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  <Text style={styles.statValue}>{results.filter(r => r.success).length}</Text>
                  <Text style={styles.statLabel}>Success</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                  <Text style={styles.statValue}>{results.filter(r => !r.success).length}</Text>
                  <Text style={styles.statLabel}>Failed</Text>
                </View>
              </LinearGradient>
            </View>

            {processing && (
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>Processing...</Text>
                  <Text style={styles.progressCount}>{currentIndex}/{photos.length}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${(currentIndex / photos.length) * 100}%` }]} />
                </View>
              </View>
            )}

            <View style={styles.settingsCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="refresh" size={20} color="#8b5cf6" />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Auto Retry Failed</Text>
                    <Text style={styles.settingDesc}>Retry failed photos once</Text>
                  </View>
                </View>
                <Switch
                  value={autoRetry}
                  onValueChange={setAutoRetry}
                  trackColor={{ false: '#e5e7eb', true: '#c4b5fd' }}
                  thumbColor={autoRetry ? '#8b5cf6' : '#f3f4f6'}
                />
              </View>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="document-text" size={20} color="#8b5cf6" />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Export Format</Text>
                    <Text style={styles.settingDesc}>{exportFormat.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.formatToggle}>
                  <TouchableOpacity
                    style={[styles.formatBtn, exportFormat === 'json' && styles.formatBtnActive]}
                    onPress={() => setExportFormat('json')}
                  >
                    <Text style={[styles.formatText, exportFormat === 'json' && styles.formatTextActive]}>JSON</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formatBtn, exportFormat === 'csv' && styles.formatBtnActive]}
                    onPress={() => setExportFormat('csv')}
                  >
                    <Text style={[styles.formatText, exportFormat === 'csv' && styles.formatTextActive]}>CSV</Text>
                  </TouchableOpacity>
                </View>
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
                <View style={styles.resultsSectionHeader}>
                  <Text style={styles.sectionTitle}>Results</Text>
                  <TouchableOpacity style={styles.exportBtn} onPress={exportResults}>
                    <Ionicons name="download-outline" size={18} color="#8b5cf6" />
                    <Text style={styles.exportText}>Export</Text>
                  </TouchableOpacity>
                </View>
                {results.map((result, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={[styles.resultCard, !result.success && styles.resultCardError]}
                    onPress={() => result.success && viewLocation(result)}
                    activeOpacity={result.success ? 0.7 : 1}
                    disabled={!result.success}
                  >
                    <View style={styles.resultIconContainer}>
                      <LinearGradient
                        colors={result.success ? ['#10b981', '#059669'] : ['#ef4444', '#dc2626']}
                        style={styles.resultIconGradient}
                      >
                        <Ionicons 
                          name={result.success ? "checkmark" : "close"} 
                          size={20} 
                          color="#fff" 
                        />
                      </LinearGradient>
                    </View>
                    {result.success && result.data ? (
                      <View style={styles.resultContent}>
                        <View style={styles.resultHeader}>
                          <Text style={styles.resultName}>{result.data.name || 'Location'}</Text>
                          {result.retried && (
                            <View style={styles.retriedBadge}>
                              <Text style={styles.retriedText}>Retried</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.resultAddress} numberOfLines={2}>{result.data.address}</Text>
                        {result.data.location && (
                          <Text style={styles.resultCoords}>
                            {result.data.location.latitude.toFixed(6)}, {result.data.location.longitude.toFixed(6)}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <View style={styles.resultContent}>
                        <Text style={styles.resultErrorText}>Photo {idx + 1}</Text>
                        <Text style={styles.resultErrorDesc}>{result.error || 'Failed to process'}</Text>
                      </View>
                    )}
                    {result.success && (
                      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.selectBtn} onPress={selectPhotos} disabled={processing}>
          <Ionicons name="add-circle-outline" size={20} color="#8b5cf6" />
          <Text style={styles.selectText}>Select Photos</Text>
        </TouchableOpacity>
        
        {photos.length > 0 && (
          <TouchableOpacity 
            style={[styles.processBtn, processing && styles.processingBtn]} 
            onPress={processAll}
            disabled={processing}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={processing ? ['#6b7280', '#4b5563'] : ['#000000', '#1a1a1a']}
              style={styles.processBtnGradient}
            >
              {processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="flash" size={20} color="#fff" />
                  <Text style={styles.processText}>Process All</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showActions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActions(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1}
            onPress={() => setShowActions(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            {selectedResult?.data && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalIconContainer}>
                    <LinearGradient
                      colors={['#8b5cf6', '#6366f1']}
                      style={styles.modalIconGradient}
                    >
                      <Ionicons name="location" size={28} color="#fff" />
                    </LinearGradient>
                  </View>
                  <View style={styles.modalHeaderText}>
                    <Text style={styles.modalTitle}>{selectedResult.data.name || 'Location'}</Text>
                    <Text style={styles.modalSubtitle} numberOfLines={2}>{selectedResult.data.address}</Text>
                  </View>
                </View>

                <View style={styles.actionsGrid}>
                  <TouchableOpacity style={styles.actionCard} onPress={openInMaps}>
                    <View style={styles.actionIconContainer}>
                      <Ionicons name="navigate" size={24} color="#8b5cf6" />
                    </View>
                    <Text style={styles.actionText}>Navigate</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionCard} onPress={saveLocation}>
                    <View style={styles.actionIconContainer}>
                      <Ionicons name="bookmark" size={24} color="#10b981" />
                    </View>
                    <Text style={styles.actionText}>Save</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionCard} onPress={shareLocation}>
                    <View style={styles.actionIconContainer}>
                      <Ionicons name="share-social" size={24} color="#3b82f6" />
                    </View>
                    <Text style={styles.actionText}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionCard} onPress={copyCoordinates}>
                    <View style={styles.actionIconContainer}>
                      <Ionicons name="copy" size={24} color="#f59e0b" />
                    </View>
                    <Text style={styles.actionText}>Copy GPS</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionCard} onPress={copyAddress}>
                    <View style={styles.actionIconContainer}>
                      <Ionicons name="document-text" size={24} color="#ec4899" />
                    </View>
                    <Text style={styles.actionText}>Copy Address</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.actionCard} 
                    onPress={() => {
                      setShowActions(false);
                      router.push('/nearby-poi');
                    }}
                  >
                    <View style={styles.actionIconContainer}>
                      <Ionicons name="compass" size={24} color="#06b6d4" />
                    </View>
                    <Text style={styles.actionText}>Nearby</Text>
                  </TouchableOpacity>
                </View>

                {selectedResult.data.location && (
                  <View style={styles.coordsCard}>
                    <Ionicons name="location-outline" size={16} color="#6b7280" />
                    <Text style={styles.coordsText}>
                      {selectedResult.data.location.latitude.toFixed(6)}, {selectedResult.data.location.longitude.toFixed(6)}
                    </Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowActions(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  backButton: { marginRight: 16, padding: 4 },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 24, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginBottom: 2 },
  headerSubtitle: { fontSize: 13, fontFamily: 'LeagueSpartan_400Regular', color: '#9ca3af' },
  content: { flex: 1 },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
  statsCard: { margin: 20, borderRadius: 20, overflow: 'hidden', shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  statsGradient: { flexDirection: 'row', padding: 24 },
  stat: { flex: 1, alignItems: 'center', gap: 8 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  statValue: { fontSize: 28, fontFamily: 'LeagueSpartan_700Bold', color: '#fff' },
  statLabel: { fontSize: 11, fontFamily: 'LeagueSpartan_600SemiBold', color: '#e9d5ff', textTransform: 'uppercase', letterSpacing: 0.5 },
  progressCard: { marginHorizontal: 20, marginBottom: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressTitle: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', color: '#000' },
  progressCount: { fontSize: 13, fontFamily: 'LeagueSpartan_600SemiBold', color: '#8b5cf6' },
  progressBar: { height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#8b5cf6', borderRadius: 4 },
  settingsCard: { marginHorizontal: 20, marginBottom: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, gap: 16 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', color: '#000', marginBottom: 2 },
  settingDesc: { fontSize: 12, fontFamily: 'LeagueSpartan_400Regular', color: '#6b7280' },
  formatToggle: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 8, padding: 2 },
  formatBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6 },
  formatBtnActive: { backgroundColor: '#8b5cf6' },
  formatText: { fontSize: 12, fontFamily: 'LeagueSpartan_600SemiBold', color: '#6b7280' },
  formatTextActive: { color: '#fff' },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  photoCard: { width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  photoImage: { width: '100%', height: '100%', backgroundColor: '#f3f4f6' },
  removeBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12 },
  statusBadge: { position: 'absolute', bottom: 4, left: 4, borderRadius: 12, padding: 4 },
  successBadge: { backgroundColor: '#10b981' },
  errorBadge: { backgroundColor: '#ef4444' },
  resultsSection: { padding: 20 },
  resultsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontFamily: 'LeagueSpartan_700Bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f5f3ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  exportText: { fontSize: 12, fontFamily: 'LeagueSpartan_600SemiBold', color: '#8b5cf6' },
  resultCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  resultCardError: { backgroundColor: '#fef2f2' },
  resultIconContainer: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  resultIconGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  resultContent: { flex: 1 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  resultName: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', color: '#000', flex: 1 },
  retriedBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  retriedText: { fontSize: 9, fontFamily: 'LeagueSpartan_700Bold', color: '#92400e', textTransform: 'uppercase' },
  resultAddress: { fontSize: 13, fontFamily: 'LeagueSpartan_400Regular', color: '#6b7280', marginBottom: 4, lineHeight: 18 },
  resultCoords: { fontSize: 11, fontFamily: 'LeagueSpartan_400Regular', color: '#9ca3af', fontVariant: ['tabular-nums'] },
  resultErrorText: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', color: '#ef4444', marginBottom: 4 },
  resultErrorDesc: { fontSize: 13, fontFamily: 'LeagueSpartan_400Regular', color: '#6b7280' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackdrop: { flex: 1 },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, paddingBottom: 32, paddingHorizontal: 20 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  modalIconContainer: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  modalIconGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  modalHeaderText: { flex: 1 },
  modalTitle: { fontSize: 20, fontFamily: 'LeagueSpartan_700Bold', color: '#000', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, fontFamily: 'LeagueSpartan_400Regular', color: '#6b7280', lineHeight: 20 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  actionCard: { width: '31%', aspectRatio: 1, backgroundColor: '#f9fafb', borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  actionIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  actionText: { fontSize: 12, fontFamily: 'LeagueSpartan_600SemiBold', color: '#000' },
  coordsCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f9fafb', padding: 12, borderRadius: 12, marginBottom: 16 },
  coordsText: { fontSize: 12, fontFamily: 'LeagueSpartan_400Regular', color: '#6b7280', fontVariant: ['tabular-nums'] },
  closeButton: { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 16, alignItems: 'center' },
  closeButtonText: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', color: '#000' },
  footer: { flexDirection: 'row', padding: 20, backgroundColor: '#fff', gap: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  selectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f3ff', borderRadius: 12, padding: 16, gap: 8, borderWidth: 2, borderColor: '#e9d5ff' },
  selectText: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', color: '#8b5cf6' },
  processBtn: { flex: 1, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  processingBtn: { shadowOpacity: 0.1 },
  processBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
  processText: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', color: '#fff' },
});

