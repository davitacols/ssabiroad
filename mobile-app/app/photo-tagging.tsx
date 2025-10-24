import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { PhotoTaggingService } from '../services/photoTagging';

export default function PhotoTagging() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [tags, setTags] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setTags([]);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setTags([]);
    }
  };

  const processPhoto = async () => {
    if (!selectedImage) return;

    setProcessing(true);
    try {
      const location = await Location.getCurrentPositionAsync({});
      
      const result = await PhotoTaggingService.processPhoto(
        selectedImage,
        location.coords.latitude,
        location.coords.longitude
      );

      if (result.success) {
        setTags(result.tags || []);
        Alert.alert('✨ Analysis Complete', `Discovered ${result.tags.length} intelligent tags!`);
      }
    } catch (error) {
      Alert.alert('❌ Error', 'Failed to analyze photo');
    } finally {
      setProcessing(false);
    }
  };

  const getTagInfo = (tagType: string) => {
    switch (tagType) {
      case 'label': return { color: '#1c1917', icon: '🏗️', name: 'Features' };
      case 'landmark': return { color: '#374151', icon: '🏛️', name: 'Landmarks' };
      case 'text': return { color: '#4B5563', icon: '📝', name: 'Text' };
      case 'object': return { color: '#6B7280', icon: '🔍', name: 'Objects' };
      default: return { color: '#9CA3AF', icon: '🏷️', name: 'Other' };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafaf9" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Smart Photo Tagging</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity onPress={takePhoto} style={[styles.actionButton, styles.cameraButton]}>
            <Text style={styles.actionText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={pickImage} style={[styles.actionButton, styles.galleryButton]}>
            <Text style={styles.actionText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Image */}
        {selectedImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            
            <TouchableOpacity
              onPress={processPhoto}
              disabled={processing}
              style={[styles.analyzeButton, processing && styles.analyzeButtonDisabled]}
            >
              <Text style={styles.analyzeText}>
                {processing ? 'Analyzing...' : 'Analyze Photo'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results */}
        {tags.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Analysis Results</Text>
            
            {['label', 'landmark', 'text', 'object'].map(type => {
              const typeTags = tags.filter(tag => tag.tagType === type);
              if (typeTags.length === 0) return null;
              
              const tagInfo = getTagInfo(type);
              
              return (
                <View key={type} style={styles.tagSection}>
                  <View style={styles.tagHeader}>
                    <Text style={styles.tagTitle}>{tagInfo.name}</Text>
                    <View style={[styles.tagCount, { backgroundColor: tagInfo.color }]}>
                      <Text style={styles.tagCountText}>{typeTags.length}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.tagList}>
                    {typeTags.map((tag, index) => (
                      <View key={index} style={[styles.tag, { borderColor: tagInfo.color }]}>
                        <Text style={[styles.tagText, { color: tagInfo.color }]}>
                          {tag.tagValue}
                        </Text>
                        {tag.confidence && (
                          <Text style={styles.confidence}>
                            {Math.round(tag.confidence * 100)}%
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {!selectedImage && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Discover Architecture</Text>
            <Text style={styles.emptyText}>
              Upload a photo to identify buildings, landmarks, and architectural features using AI
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backButton: { padding: 8 },
  backIcon: { fontSize: 16, color: '#374151', fontWeight: '600' },
  title: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700', color: '#111827' },
  placeholder: { width: 40 },
  content: { flex: 1, padding: 20 },
  actionContainer: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  actionButton: { flex: 1, padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  cameraButton: { backgroundColor: '#1c1917' },
  galleryButton: { backgroundColor: '#374151' },

  actionText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  imageContainer: { marginBottom: 24 },
  selectedImage: { width: '100%', height: 280, borderRadius: 16, marginBottom: 16 },
  analyzeButton: { backgroundColor: '#1c1917', padding: 18, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  analyzeButtonDisabled: { backgroundColor: '#9CA3AF' },

  analyzeText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resultsContainer: { marginBottom: 24 },
  resultsTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 20 },
  tagSection: { marginBottom: 24, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tagHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },

  tagTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: '#374151' },
  tagCount: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  tagCountText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagText: { fontSize: 14, fontWeight: '500' },
  confidence: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },

  emptyTitle: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptyText: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
});