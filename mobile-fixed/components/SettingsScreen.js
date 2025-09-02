import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Switch,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { LocationCache } from './LocationCache';
import { OfflineManager } from './OfflineManager';

export default function SettingsScreen({ navigation, theme }) {
  const [settings, setSettings] = useState({
    autoCompress: true,
    cacheEnabled: true,
    offlineMode: true,
    hapticFeedback: true,
    debugMode: false
  });
  const [cacheSize, setCacheSize] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [pendingUploads, setPendingUploads] = useState(0);

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await SecureStore.getItemAsync('app_settings');
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await SecureStore.setItemAsync('app_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const loadStats = async () => {
    try {
      const history = await LocationCache.getHistory();
      setHistoryCount(history.length);
      setPendingUploads(OfflineManager.getPendingCount());
      
      // Estimate cache size (simplified)
      setCacheSize(history.length * 2); // Rough estimate in KB
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const toggleSetting = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const clearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will delete all cached location data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await LocationCache.clearCache();
            setCacheSize(0);
            Alert.alert('Success', 'Cache cleared successfully');
          }
        }
      ]
    );
  };

  const clearHistory = () => {
    Alert.alert(
      'Clear History',
      'This will delete all location history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await LocationCache.clearHistory();
            setHistoryCount(0);
            Alert.alert('Success', 'History cleared successfully');
          }
        }
      ]
    );
  };

  const clearPendingUploads = () => {
    Alert.alert(
      'Clear Pending Uploads',
      'This will cancel all queued uploads. They will not be processed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            OfflineManager.clearPendingUploads();
            setPendingUploads(0);
            Alert.alert('Success', 'Pending uploads cleared');
          }
        }
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, value, onToggle, type = 'switch' }) => (
    <View style={[styles.settingItem, { backgroundColor: theme.surface }]}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color="#6366F1" />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        )}
      </View>
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: theme.textSecondary, true: '#6366F1' }}
          thumbColor={value ? '#FFFFFF' : '#F3F4F6'}
        />
      )}
      {type === 'button' && (
        <TouchableOpacity onPress={onToggle}>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );

  const StatItem = ({ label, value, color = theme.text }) => (
    <View style={styles.statItem}>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>App Settings</Text>
          
          <SettingItem
            icon="image"
            title="Auto Compress Images"
            subtitle="Automatically optimize images before upload"
            value={settings.autoCompress}
            onToggle={() => toggleSetting('autoCompress')}
          />
          
          <SettingItem
            icon="archive"
            title="Enable Caching"
            subtitle="Store results locally for faster access"
            value={settings.cacheEnabled}
            onToggle={() => toggleSetting('cacheEnabled')}
          />
          
          <SettingItem
            icon="cloud-offline"
            title="Offline Mode"
            subtitle="Enable GPS-based location detection when offline"
            value={settings.offlineMode}
            onToggle={() => toggleSetting('offlineMode')}
          />
          
          <SettingItem
            icon="phone-portrait"
            title="Haptic Feedback"
            subtitle="Vibration feedback for interactions"
            value={settings.hapticFeedback}
            onToggle={() => toggleSetting('hapticFeedback')}
          />
        </View>

        {/* Storage & Data */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Storage & Data</Text>
          
          <View style={[styles.statsContainer, { backgroundColor: theme.surface }]}>
            <StatItem label="Cache Size" value={`${cacheSize} KB`} />
            <StatItem label="History Items" value={historyCount} />
            <StatItem label="Pending Uploads" value={pendingUploads} color="#F59E0B" />
          </View>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.surface }]}
            onPress={clearCache}
          >
            <Ionicons name="trash" size={20} color="#EF4444" />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>Clear Cache</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.surface }]}
            onPress={clearHistory}
          >
            <Ionicons name="time" size={20} color="#EF4444" />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>Clear History</Text>
          </TouchableOpacity>
          
          {pendingUploads > 0 && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.surface }]}
              onPress={clearPendingUploads}
            >
              <Ionicons name="cloud-upload" size={20} color="#F59E0B" />
              <Text style={[styles.actionButtonText, { color: theme.text }]}>Clear Pending Uploads</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Debug Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Debug</Text>
          
          <SettingItem
            icon="bug"
            title="Debug Mode"
            subtitle="Enable detailed logging (affects performance)"
            value={settings.debugMode}
            onToggle={() => toggleSetting('debugMode')}
          />
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.surface }]}
            onPress={() => {
              Alert.alert('Debug Info', `
Cache Size: ${cacheSize} KB
History: ${historyCount} items
Pending: ${pendingUploads} uploads
Version: 2.0.0
Build: ${new Date().toISOString().split('T')[0]}
              `);
            }}
          >
            <Ionicons name="information-circle" size={20} color="#6366F1" />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>Show Debug Info</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
          
          <View style={[styles.aboutContainer, { backgroundColor: theme.surface }]}>
            <View style={styles.appIcon}>
              <Ionicons name="camera" size={32} color="#6366F1" />
            </View>
            <View style={styles.appInfo}>
              <Text style={[styles.appName, { color: theme.text }]}>Pic2Nav</Text>
              <Text style={[styles.appVersion, { color: theme.textSecondary }]}>Version 2.0.0</Text>
              <Text style={[styles.appDescription, { color: theme.textSecondary }]}>
                AI-powered photo location detection
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
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
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { flex: 1 },
  section: { margin: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99,102,241,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  settingSubtitle: { fontSize: 12, lineHeight: 16 },
  statsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: { fontSize: 14 },
  statValue: { fontSize: 14, fontWeight: '600' },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  actionButtonText: { fontSize: 16, fontWeight: '500' },
  aboutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(99,102,241,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  appInfo: { flex: 1 },
  appName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  appVersion: { fontSize: 14, marginBottom: 8 },
  appDescription: { fontSize: 14, lineHeight: 20 },
});