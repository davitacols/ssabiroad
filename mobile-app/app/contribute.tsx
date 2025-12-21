import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const API_URL = 'https://ssabiroad.com';

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
  const [stats, setStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);

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
      await uploadPhoto(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri: string) => {
    setUploading(true);
    try {
      const location = await Location.getCurrentPositionAsync({});
      
      const formData = new FormData();
      formData.append('file', { uri, type: 'image/jpeg', name: 'photo.jpg' } as any);
      formData.append('latitude', location.coords.latitude.toString());
      formData.append('longitude', location.coords.longitude.toString());
      formData.append('address', 'Nigeria');
      formData.append('deviceId', deviceId!);

      const res = await fetch(`${API_URL}/api/gamification/contribute`, {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        Alert.alert('Success', `+${result.points.earned} points earned`);
        fetchStats();
        fetchLeaderboard();
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Contribute</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Help map Nigeria and earn rewards</Text>
        
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleTakePhoto}
          disabled={uploading}
          activeOpacity={0.9}
        >
          {uploading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.uploadText}>Take Photo</Text>
          )}
        </TouchableOpacity>

        <View style={styles.rewards}>
          <Text style={styles.rewardsText}>10 points per photo • 20 points daily streak</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats?.points || 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats?.contributions || 0}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>#{stats?.rank || '-'}</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
        </View>

        {leaderboard.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Leaderboard</Text>
            {leaderboard.slice(0, 10).map((user) => (
              <View key={user.rank} style={styles.leaderItem}>
                <Text style={styles.leaderRank}>{user.rank}</Text>
                <Text style={styles.leaderName}>{user.name}</Text>
                <Text style={styles.leaderPoints}>{user.points}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  content: { flex: 1, paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 40 },
  uploadButton: { backgroundColor: '#fff', paddingVertical: 20, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  uploadText: { fontSize: 16, fontWeight: '600', color: '#000' },
  rewards: { marginBottom: 48 },
  rewardsText: { fontSize: 14, color: '#888', textAlign: 'center' },
  statsRow: { flexDirection: 'row', marginBottom: 48 },
  stat: { flex: 1 },
  statValue: { fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 4 },
  statLabel: { fontSize: 14, color: '#888', fontWeight: '500' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 20 },
  leaderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  leaderRank: { fontSize: 16, fontWeight: '700', color: '#888', width: 40 },
  leaderName: { flex: 1, fontSize: 16, color: '#fff', fontWeight: '500' },
  leaderPoints: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
