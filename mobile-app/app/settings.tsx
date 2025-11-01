import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import { useState, useEffect } from 'react';
import { logScreenView, logClearCache } from '../utils/analytics';

export default function SettingsScreen() {
  const router = useRouter();
  const [savedCount, setSavedCount] = useState(0);
  const [cacheSize, setCacheSize] = useState('0 MB');

  useEffect(() => {
    logScreenView('settings');
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const saved = await SecureStore.getItemAsync('savedLocations');
      if (saved) {
        setSavedCount(JSON.parse(saved).length);
      }
      
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const info = await FileSystem.getInfoAsync(cacheDir);
        if (info.exists) {
          const size = (info.size || 0) / (1024 * 1024);
          setCacheSize(`${size.toFixed(2)} MB`);
        }
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const clearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will delete all cached images. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const cacheDir = FileSystem.cacheDirectory;
              if (cacheDir) {
                const files = await FileSystem.readDirectoryAsync(cacheDir);
                for (const file of files) {
                  await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
                }
                Alert.alert('Success', 'Cache cleared');
                logClearCache();
                loadStats();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          }
        }
      ]
    );
  };

  const clearSavedLocations = async () => {
    Alert.alert(
      'Clear Saved Locations',
      `Delete all ${savedCount} saved locations?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync('savedLocations');
              Alert.alert('Success', 'All saved locations deleted');
              logClearCache();
              loadStats();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete locations');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>
          
          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemTitle}>Saved Locations</Text>
              <Text style={styles.itemSubtitle}>{savedCount} locations saved</Text>
            </View>
            {savedCount > 0 && (
              <TouchableOpacity style={styles.dangerButton} onPress={clearSavedLocations}>
                <Text style={styles.dangerButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemTitle}>Cache</Text>
              <Text style={styles.itemSubtitle}>{cacheSize}</Text>
            </View>
            <TouchableOpacity style={styles.dangerButton} onPress={clearCache}>
              <Text style={styles.dangerButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          
          <TouchableOpacity style={styles.item} onPress={() => Linking.openURL('https://pic2nav.com/privacy')}>
            <Text style={styles.itemTitle}>Privacy Policy</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => Linking.openURL('https://pic2nav.com/terms')}>
            <Text style={styles.itemTitle}>Terms of Service</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.item}>
            <Text style={styles.itemTitle}>Version</Text>
            <Text style={styles.itemValue}>1.0.0</Text>
          </View>

          <TouchableOpacity style={styles.item} onPress={() => Linking.openURL('mailto:support@pic2nav.com')}>
            <Text style={styles.itemTitle}>Contact Support</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  backText: { fontSize: 16, color: '#3b82f6', fontFamily: 'LeagueSpartan_600SemiBold', marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '800', color: '#0f172a' },
  content: { flex: 1 },
  section: { marginTop: 24, backgroundColor: '#fff', paddingHorizontal: 20 },
  sectionTitle: { fontSize: 13, fontFamily: 'LeagueSpartan_700Bold', color: '#64748b', textTransform: 'uppercase', paddingVertical: 12 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemLeft: { flex: 1 },
  itemTitle: { fontSize: 16, fontFamily: 'LeagueSpartan_600SemiBold', color: '#0f172a', marginBottom: 4 },
  itemSubtitle: { fontSize: 13, color: '#64748b' },
  itemValue: { fontSize: 15, color: '#64748b' },
  arrow: { fontSize: 24, color: '#cbd5e1' },
  dangerButton: { backgroundColor: '#fee2e2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  dangerButtonText: { color: '#dc2626', fontSize: 14, fontFamily: 'LeagueSpartan_700Bold' },
});
