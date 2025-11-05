import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Animated, StatusBar, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

interface Story {
  id: string;
  location: string;
  address: string;
  image: string;
  timestamp: number;
  viewed: boolean;
}

export default function StoriesScreen() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [progress, setProgress] = useState(0);
  const progressAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadStories();
  }, []);

  useEffect(() => {
    if (selectedStory) {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) closeStory();
      });
    }
  }, [selectedStory]);

  const loadStories = async () => {
    try {
      // Load local stories
      const history = await AsyncStorage.getItem('locationHistory');
      const localStories = history ? JSON.parse(history) : [];
      const last24h = Date.now() - 24 * 60 * 60 * 1000;
      const recentLocal = localStories
        .filter((item: any) => item.timestamp > last24h && item.image)
        .map((item: any) => ({
          id: item.id || `${item.timestamp}`,
          location: item.name || 'Unknown Location',
          address: item.address || '',
          image: item.image,
          timestamp: item.timestamp,
          viewed: item.viewed || false,
          isOwn: true,
        }));

      // Load public stories from server
      const userId = await SecureStore.getItemAsync('deviceUserId');
      const response = await fetch(`https://ssabiroad.vercel.app/api/stories?userId=${userId}`);
      const data = await response.json();
      
      const publicStories = data.success ? data.stories.map((s: any) => ({
        id: s.id,
        location: s.location,
        address: s.address,
        image: s.image,
        timestamp: new Date(s.createdAt).getTime(),
        viewed: false,
        isOwn: false,
        userId: s.userId,
      })) : [];

      // Combine and sort
      const allStories = [...recentLocal, ...publicStories]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20);
      
      setStories(allStories);
    } catch (error) {
      console.error('Load stories error:', error);
    }
  };

  const openStory = (story: Story) => {
    setSelectedStory(story);
    markAsViewed(story.id);
  };

  const closeStory = () => {
    setSelectedStory(null);
    progressAnim.setValue(0);
  };

  const markAsViewed = async (id: string) => {
    try {
      const history = await AsyncStorage.getItem('locationHistory');
      if (history) {
        const parsed = JSON.parse(history);
        const updated = parsed.map((item: any) => 
          (item.id || `${item.timestamp}`) === id ? { ...item, viewed: true } : item
        );
        await AsyncStorage.setItem('locationHistory', JSON.stringify(updated));
        setStories(stories.map(s => s.id === id ? { ...s, viewed: true } : s));
      }
    } catch (error) {
      console.error('Mark viewed error:', error);
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1h ago';
    return `${hours}h ago`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location Stories</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesScroll}>
        {stories.map((story) => (
          <TouchableOpacity key={story.id} style={styles.storyContainer} onPress={() => openStory(story)}>
            <View style={[styles.storyRing, !story.viewed && styles.storyRingUnviewed]}>
              <Image source={{ uri: story.image }} style={styles.storyImage} />
            </View>
            <Text style={styles.storyLocation} numberOfLines={1}>{story.location}</Text>
            <Text style={styles.storyTime}>{getTimeAgo(story.timestamp)}</Text>
            {!story.isOwn && <View style={styles.publicBadge}><Ionicons name="globe" size={10} color="#10b981" /></View>}
          </TouchableOpacity>
        ))}
        {stories.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={48} color="#6b7280" />
            <Text style={styles.emptyText}>No stories yet</Text>
            <Text style={styles.emptySubtext}>Visit locations to create stories</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.grid}>
        <Text style={styles.gridTitle}>All Locations</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {stories.map((story) => (
            <TouchableOpacity key={story.id} style={styles.gridItem} onPress={() => openStory(story)}>
              <Image source={{ uri: story.image }} style={styles.gridImage} />
              <View style={styles.gridContent}>
                <Text style={styles.gridLocation}>{story.location}</Text>
                <Text style={styles.gridAddress} numberOfLines={1}>{story.address}</Text>
                <Text style={styles.gridTime}>{getTimeAgo(story.timestamp)}</Text>
              </View>
              {!story.viewed && <View style={styles.unviewedDot} />}
              {!story.isOwn && <View style={styles.publicTag}><Text style={styles.publicTagText}>Public</Text></View>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Modal visible={!!selectedStory} transparent animationType="fade" onRequestClose={closeStory}>
        {selectedStory && (
          <View style={styles.modal}>
            <TouchableOpacity style={styles.modalOverlay} onPress={closeStory} activeOpacity={1} />
            
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }
                ]} 
              />
            </View>

            <View style={styles.storyHeader}>
              <View style={styles.storyHeaderLeft}>
                <Image source={{ uri: selectedStory.image }} style={styles.storyAvatar} />
                <View>
                  <Text style={styles.storyHeaderLocation}>{selectedStory.location}</Text>
                  <Text style={styles.storyHeaderTime}>{getTimeAgo(selectedStory.timestamp)}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeStory} style={styles.closeBtn}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <Image source={{ uri: selectedStory.image }} style={styles.storyFullImage} resizeMode="contain" />

            <View style={styles.storyFooter}>
              <Text style={styles.storyAddress}>{selectedStory.address}</Text>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  placeholder: { width: 40 },
  storiesScroll: { maxHeight: 120, paddingHorizontal: 16, marginBottom: 20 },
  storyContainer: { alignItems: 'center', marginRight: 16, width: 80 },
  storyRing: { width: 72, height: 72, borderRadius: 36, padding: 3, backgroundColor: '#374151', marginBottom: 8 },
  storyRingUnviewed: { backgroundColor: '#10b981' },
  storyImage: { width: '100%', height: '100%', borderRadius: 33, backgroundColor: '#1f2937' },
  storyLocation: { fontSize: 12, color: '#fff', fontWeight: '600', width: 80, textAlign: 'center' },
  storyTime: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  empty: { width: width - 32, alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#6b7280', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#4b5563', marginTop: 4 },
  grid: { flex: 1, backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 16 },
  gridTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 },
  gridItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1f2937', padding: 12, borderRadius: 12, marginBottom: 12 },
  gridImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#374151', marginRight: 12 },
  gridContent: { flex: 1 },
  gridLocation: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 4 },
  gridAddress: { fontSize: 13, color: '#9ca3af', marginBottom: 4 },
  gridTime: { fontSize: 11, color: '#6b7280' },
  unviewedDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981' },
  publicBadge: { position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center' },
  publicTag: { backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  publicTagText: { fontSize: 10, fontWeight: '700', color: '#10b981' },
  modal: { flex: 1, backgroundColor: '#000' },
  modalOverlay: { ...StyleSheet.absoluteFillObject },
  progressBar: { position: 'absolute', top: 50, left: 16, right: 16, height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, zIndex: 10 },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  storyHeader: { position: 'absolute', top: 70, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 },
  storyHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  storyAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#374151' },
  storyHeaderLocation: { fontSize: 15, fontWeight: '700', color: '#fff' },
  storyHeaderTime: { fontSize: 12, color: '#d1d5db', marginTop: 2 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  storyFullImage: { width: width, height: height, backgroundColor: '#000' },
  storyFooter: { position: 'absolute', bottom: 40, left: 16, right: 16, zIndex: 10 },
  storyAddress: { fontSize: 14, color: '#fff', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 12 },
});
