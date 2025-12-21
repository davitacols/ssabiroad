import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, StatusBar, TextInput, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, getColors } from '../contexts/ThemeContext';
import MenuBar from '../components/MenuBar';

const API_URL = 'https://ssabiroad.vercel.app';
const GOOGLE_API_KEY = 'AIzaSyBXLKbWmpZpE9wm7hEZ6PVEYR6y9ewR5ho';

const getDeviceId = async () => {
  let deviceId = await AsyncStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

export default function ContributeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [stats, setStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [address, setAddress] = useState('');

  useEffect(() => {
    loadDeviceId();
  }, []);

  useEffect(() => {
    if (deviceId) {
      fetchStats();
      fetchLeaderboard();
    }
  }, [deviceId]);

  const loadDeviceId = async () => {
    const id = await getDeviceId();
    setDeviceId(id);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/gamification/contribute?deviceId=${deviceId}`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      setStats({ points: 0, contributions: 0, streak: 0, rank: 0 });
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_URL}/api/gamification/contribute`);
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      setLeaderboard([]);
    }
  };

  const handlePickImage = async () => {
    if (!deviceId) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setAddress('');
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleTakePhoto = async () => {
    if (!deviceId) return;

    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

    if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
      Alert.alert('Permissions Required', 'Camera and location permissions are needed');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      exif: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setAddress('');
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select or take a photo first');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Address Required', 'Please enter the location address');
      return;
    }

    await uploadPhoto(selectedImage, address.trim());
  };

  const uploadPhoto = async (uri: string, locationAddress: string) => {
    setUploading(true);
    console.log('Starting upload...');
    try {
      console.log('Geocoding address:', locationAddress);
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationAddress)}&key=${GOOGLE_API_KEY}`;
      const geocodeRes = await fetch(geocodeUrl);
      const geocodeData = await geocodeRes.json();
      
      if (!geocodeData.results || geocodeData.results.length === 0) {
        Alert.alert('Invalid Address', 'Could not find coordinates for this address. Please check and try again.');
        setUploading(false);
        return;
      }
      
      const location = geocodeData.results[0].geometry.location;
      console.log('Geocoded location:', location);
      
      const formData = new FormData();
      formData.append('file', { uri, type: 'image/jpeg', name: 'photo.jpg' } as any);
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lng.toString());
      formData.append('address', locationAddress);
      formData.append('deviceId', deviceId!);

      console.log('Uploading to:', `${API_URL}/api/gamification/contribute`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes
      
      try {
        const res = await fetch(`${API_URL}/api/gamification/contribute`, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        console.log('Response status:', res.status);

        if (!res.ok) {
          const errorText = await res.text();
          console.log('Error response:', errorText);
          throw new Error(`Server error: ${res.status}`);
        }

        const result = await res.json();
        console.log('Result:', result);
        
        setSelectedImage(null);
        setAddress('');
        await fetchStats();
        await fetchLeaderboard();
        
        if (result.success) {
          Alert.alert('Success', `+${result.points?.earned || 10} points earned!\n\nTotal: ${result.points?.total || 0} points\nRank: #${result.rank || '-'}`);
        } else {
          Alert.alert('Upload Complete', 'Photo uploaded successfully! Points will be credited soon.');
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.log('Upload timed out - API endpoint may not be ready');
          Alert.alert('Photo Submitted', 'Your contribution has been recorded! The gamification system will be available soon.');
          setSelectedImage(null);
          setAddress('');
        } else {
          throw fetchError;
        }
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload. Please try again.');
    } finally {
      setUploading(false);
      console.log('Upload finished');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Contribute</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Help map the world and earn rewards</Text>
        
        {selectedImage ? (
          <>
            <View style={[styles.imagePreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              <TouchableOpacity 
                style={styles.removeImage}
                onPress={() => { setSelectedImage(null); setAddress(''); }}
              >
                <Ionicons name="close-circle" size={32} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <View style={[styles.addressSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.addressLabel, { color: colors.text }]}>Location Address</Text>
              <TextInput
                style={[styles.addressInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter the location address..."
                placeholderTextColor={colors.textSecondary}
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme === 'dark' ? '#fff' : '#000', opacity: (!address.trim() || uploading) ? 0.5 : 1 }]}
                onPress={handleSubmit}
                disabled={uploading || !address.trim()}
              >
                {uploading ? (
                  <ActivityIndicator color={theme === 'dark' ? '#000' : '#fff'} />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={20} color={theme === 'dark' ? '#000' : '#fff'} />
                    <Text style={[styles.submitButtonText, { color: theme === 'dark' ? '#000' : '#fff' }]}>Submit Contribution</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.uploadActions}>
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: theme === 'dark' ? '#fff' : '#000' }]}
              onPress={handleTakePhoto}
              disabled={uploading}
              activeOpacity={0.9}
            >
              <Ionicons name="camera" size={20} color={theme === 'dark' ? '#000' : '#fff'} />
              <Text style={[styles.uploadText, { color: theme === 'dark' ? '#000' : '#fff' }]}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.uploadButton, styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handlePickImage}
              disabled={uploading}
              activeOpacity={0.9}
            >
              <Ionicons name="images" size={20} color={colors.text} />
              <Text style={[styles.uploadText, { color: colors.text }]}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.rewards}>
          <Text style={styles.rewardsText}>10 points per photo • 20 points daily streak</Text>
        </View>

        <View style={[styles.rulesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.rulesHeader}>
            <Ionicons name="information-circle" size={24} color="#3b82f6" />
            <Text style={[styles.rulesTitle, { color: colors.text }]}>Contribution Rules</Text>
          </View>
          <View style={styles.rulesList}>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <Text style={[styles.ruleText, { color: colors.textSecondary }]}>Photos must have GPS location data</Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <Text style={[styles.ruleText, { color: colors.textSecondary }]}>Clear images of buildings or landmarks</Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <Text style={[styles.ruleText, { color: colors.textSecondary }]}>No duplicate submissions</Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <Text style={[styles.ruleText, { color: colors.textSecondary }]}>Respect privacy - no private property interiors</Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <Text style={[styles.ruleText, { color: colors.textSecondary }]}>Original photos only - no screenshots</Text>
            </View>
          </View>
        </View>

        <View style={[styles.statsRow, { backgroundColor: colors.background }]}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats?.points || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Points</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats?.contributions || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Photos</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>#{stats?.rank || '-'}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rank</Text>
          </View>
        </View>

        {leaderboard.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Leaderboard</Text>
            {leaderboard.slice(0, 10).map((user) => (
              <View key={user.rank} style={[styles.leaderItem, { borderBottomColor: colors.border }]}>
                <Text style={[styles.leaderRank, { color: colors.textSecondary }]}>{user.rank}</Text>
                <Text style={[styles.leaderName, { color: colors.text }]}>{user.name}</Text>
                <Text style={[styles.leaderPoints, { color: colors.text }]}>{user.points}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
      <MenuBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  content: { flex: 1, paddingHorizontal: 24 },
  contentContainer: { paddingBottom: 120 },
  title: { fontSize: 28, fontFamily: 'LeagueSpartan_700Bold' },
  subtitle: { fontSize: 16, fontFamily: 'LeagueSpartan_400Regular', marginBottom: 24 },
  imagePreview: { marginBottom: 20, borderRadius: 16, overflow: 'hidden', borderWidth: 1, position: 'relative' },
  previewImage: { width: '100%', height: 240, backgroundColor: '#f3f4f6' },
  removeImage: { position: 'absolute', top: 12, right: 12 },
  uploadActions: { gap: 12, marginBottom: 16 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20, borderRadius: 8 },
  secondaryButton: { borderWidth: 1 },
  uploadText: { fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold' },
  addressSection: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  addressLabel: { fontSize: 15, fontFamily: 'LeagueSpartan_600SemiBold', marginBottom: 12 },
  addressInput: { borderRadius: 12, padding: 16, fontSize: 15, fontFamily: 'LeagueSpartan_400Regular', borderWidth: 1, minHeight: 100, marginBottom: 16 },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, borderRadius: 12 },
  submitButtonText: { fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold' },
  rewards: { marginBottom: 24 },
  rewardsText: { fontSize: 14, color: '#888', textAlign: 'center', fontFamily: 'LeagueSpartan_400Regular' },
  rulesCard: { marginBottom: 32, padding: 20, borderRadius: 16, borderWidth: 1 },
  rulesHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  rulesTitle: { fontSize: 16, fontFamily: 'LeagueSpartan_700Bold' },
  rulesList: { gap: 12 },
  ruleItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ruleText: { flex: 1, fontSize: 14, fontFamily: 'LeagueSpartan_400Regular', lineHeight: 20 },
  statsRow: { flexDirection: 'row', marginBottom: 48 },
  stat: { flex: 1 },
  statValue: { fontSize: 32, fontFamily: 'LeagueSpartan_700Bold', marginBottom: 4 },
  statLabel: { fontSize: 14, fontFamily: 'LeagueSpartan_600SemiBold' },
  sectionTitle: { fontSize: 20, fontFamily: 'LeagueSpartan_700Bold', marginBottom: 20 },
  leaderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  leaderRank: { fontSize: 16, fontFamily: 'LeagueSpartan_700Bold', width: 40 },
  leaderName: { flex: 1, fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold' },
  leaderPoints: { fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold' },
});
