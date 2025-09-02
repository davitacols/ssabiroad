import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Alert,
  Animated,
  ProgressBarAndroid,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ImageProcessor } from './ImageProcessor';
import { LocationCache } from './LocationCache';

export default function BatchProcessor({ theme, onComplete }) {
  const [selectedImages, setSelectedImages] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentImage, setCurrentImage] = useState(0);
  const [results, setResults] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const selectImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library access is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsMultipleSelection: true,
        quality: 1.0, // Maximum quality to preserve data
        exif: true, // Extract EXIF data
        allowsEditing: false, // Don't allow editing to preserve original
        selectionLimit: 10, // Limit to prevent memory issues
      });
      
      console.log('📸 Batch selection: Selected images with EXIF preservation');

      if (!result.canceled && result.assets) {
        setSelectedImages(result.assets);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select images: ' + error.message);
    }
  };

  const processImages = async () => {
    if (selectedImages.length === 0) return;

    setProcessing(true);
    setProgress(0);
    setCurrentImage(0);
    setResults([]);

    const processedResults = [];

    for (let i = 0; i < selectedImages.length; i++) {
      const image = selectedImages[i];
      setCurrentImage(i + 1);
      setProgress((i / selectedImages.length) * 100);

      try {
        // Use original image to preserve GPS/EXIF data
        console.log('📍 Batch processing: Using original image to preserve GPS/EXIF data');
        
        // Check cache first
        const imageHash = LocationCache.generateImageHash(image.uri);
        let result = await LocationCache.getCachedLocation(imageHash);

        if (!result) {
          // Process with API using original image
          result = await processImageWithAPI(image.uri, image.exif);
          
          if (result.success) {
            await LocationCache.cacheLocation(imageHash, result);
            await LocationCache.addToHistory(result);
          }
        }

        processedResults.push({
          ...result,
          originalImage: image.uri,
          index: i
        });

      } catch (error) {
        console.error(`Failed to process image ${i + 1}:`, error);
        processedResults.push({
          success: false,
          error: error.message,
          originalImage: image.uri,
          index: i
        });
      }

      // Small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setResults(processedResults);
    setProgress(100);
    setProcessing(false);
  };

  const processImageWithAPI = async (imageUri, exifData) => {
    const formData = new FormData();
    
    console.log('📤 Batch upload: Using original image to preserve GPS/EXIF');
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    });
    
    // Add flag to indicate we're preserving original image
    formData.append('preservedOriginal', 'true');

    // Add GPS data if available
    if (exifData) {
      const { extractGPSFromExif } = require('../utils/gpsUtils');
      const gpsData = extractGPSFromExif(exifData);
      
      if (gpsData) {
        formData.append('latitude', gpsData.latitude.toString());
        formData.append('longitude', gpsData.longitude.toString());
        formData.append('hasImageGPS', 'true');
        formData.append('exifGPSLatitude', gpsData.latitude.toString());
        formData.append('exifGPSLongitude', gpsData.longitude.toString());
        formData.append('hasExifGPS', 'true');
        console.log('📍 Batch: GPS data preserved and added to form:', gpsData);
      } else {
        formData.append('hasImageGPS', 'false');
        formData.append('hasExifGPS', 'false');
        console.log('📍 Batch: No GPS data found in image');
      }
    } else {
      formData.append('hasImageGPS', 'false');
      formData.append('hasExifGPS', 'false');
    }

    const response = await fetch('https://www.pic2nav.com/api/location-recognition-v2', {
      method: 'POST',
      body: formData,
      headers: {
        'User-Agent': 'Pic2Nav-Mobile-Batch/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
  };

  const exportResults = () => {
    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length === 0) {
      Alert.alert('No Results', 'No successful location detections to export');
      return;
    }

    // Create export data
    const exportData = {
      timestamp: new Date().toISOString(),
      totalImages: selectedImages.length,
      successfulDetections: successfulResults.length,
      results: successfulResults.map(r => ({
        name: r.name,
        address: r.address,
        location: r.location,
        confidence: r.confidence,
        category: r.category
      }))
    };

    // For now, just show the data (in a real app, you'd save to file or share)
    Alert.alert(
      'Export Ready',
      `${successfulResults.length} locations ready for export`,
      [
        { text: 'Cancel' },
        { text: 'Share', onPress: () => shareResults(exportData) }
      ]
    );
  };

  const shareResults = async (exportData) => {
    try {
      const { Share } = require('react-native');
      const message = `Pic2Nav Batch Results\n\nProcessed: ${exportData.totalImages} images\nFound: ${exportData.successfulDetections} locations\n\n${
        exportData.results.map((r, i) => `${i + 1}. ${r.name || 'Unknown'}\n   ${r.address}`).join('\n\n')
      }`;

      await Share.share({
        message,
        title: 'Pic2Nav Batch Results'
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.bg, opacity: fadeAnim }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => onComplete && onComplete()}>
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Batch Processor</Text>
        <TouchableOpacity onPress={exportResults} disabled={results.length === 0}>
          <Ionicons 
            name="download" 
            size={24} 
            color={results.length > 0 ? theme.text : theme.textSecondary} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Selection */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="images" size={24} color="#6366F1" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Select Images ({selectedImages.length}/10)
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.selectButton, { borderColor: theme.textSecondary }]}
            onPress={selectImages}
            disabled={processing}
          >
            <Ionicons name="add-circle-outline" size={32} color="#6366F1" />
            <Text style={[styles.selectButtonText, { color: theme.text }]}>
              Choose Photos from Gallery
            </Text>
            <Text style={[styles.selectButtonSubtext, { color: theme.textSecondary }]}>
              Select up to 10 images for batch processing
            </Text>
          </TouchableOpacity>

          {selectedImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreview}>
              {selectedImages.map((image, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: image.uri }} style={styles.previewImage} />
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeImage(index)}
                    disabled={processing}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Processing Controls */}
        {selectedImages.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <TouchableOpacity
              style={[
                styles.processButton,
                processing && styles.processingButton
              ]}
              onPress={processImages}
              disabled={processing || selectedImages.length === 0}
            >
              <Ionicons 
                name={processing ? "hourglass" : "play"} 
                size={24} 
                color="#FFFFFF" 
              />
              <Text style={styles.processButtonText}>
                {processing ? `Processing ${currentImage}/${selectedImages.length}` : 'Start Processing'}
              </Text>
            </TouchableOpacity>

            {processing && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                  {Math.round(progress)}% complete
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Results */}
        {results.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list" size={24} color="#10B981" />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Results ({results.filter(r => r.success).length}/{results.length})
              </Text>
            </View>

            {results.map((result, index) => (
              <View key={index} style={[styles.resultItem, { borderColor: theme.textSecondary }]}>
                <View style={styles.resultHeader}>
                  <Ionicons 
                    name={result.success ? "checkmark-circle" : "alert-circle"} 
                    size={20} 
                    color={result.success ? "#10B981" : "#EF4444"} 
                  />
                  <Text style={[styles.resultIndex, { color: theme.textSecondary }]}>
                    Image {index + 1}
                  </Text>
                  {result.confidence && (
                    <Text style={styles.confidenceText}>
                      {Math.round(result.confidence * 100)}%
                    </Text>
                  )}
                </View>

                {result.success ? (
                  <View style={styles.resultContent}>
                    <Text style={[styles.resultName, { color: theme.text }]}>
                      {result.name || 'Location Found'}
                    </Text>
                    <Text style={[styles.resultAddress, { color: theme.textSecondary }]}>
                      {result.address}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.errorText, { color: '#EF4444' }]}>
                    {result.error || 'Processing failed'}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { flex: 1 },
  section: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  selectButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  selectButtonText: { fontSize: 16, fontWeight: '600' },
  selectButtonSubtext: { fontSize: 12, textAlign: 'center' },
  imagePreview: { marginTop: 16 },
  imageContainer: { position: 'relative', marginRight: 12 },
  previewImage: { width: 80, height: 80, borderRadius: 8 },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  processButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  processingButton: { backgroundColor: '#9CA3AF' },
  processButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  progressContainer: { marginTop: 16 },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  progressText: { fontSize: 12, textAlign: 'center', marginTop: 8 },
  resultItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  resultIndex: { flex: 1, fontSize: 12, fontWeight: '500' },
  confidenceText: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  resultContent: { gap: 4 },
  resultName: { fontSize: 14, fontWeight: '600' },
  resultAddress: { fontSize: 12, lineHeight: 16 },
  errorText: { fontSize: 12, fontStyle: 'italic' },
});