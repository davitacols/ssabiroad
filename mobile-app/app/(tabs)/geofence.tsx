import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Switch, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { GeofenceService } from '../../services/geofence';

export default function GeofenceScreen() {
  const [name, setName] = useState('');
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [geofences, setGeofences] = useState<any[]>([]);
  const [monitoring, setMonitoring] = useState(false);
  const [notifyOnEnter, setNotifyOnEnter] = useState(true);
  const [notifyOnExit, setNotifyOnExit] = useState(true);
  const [selectedRadius, setSelectedRadius] = useState('500');
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const radiusOptions = [
    { value: '100', label: '100m', icon: 'walk' },
    { value: '250', label: '250m', icon: 'bicycle' },
    { value: '500', label: '500m', icon: 'car' },
    { value: '1000', label: '1km', icon: 'car-sport' },
    { value: '2000', label: '2km', icon: 'airplane' },
  ];

  useEffect(() => {
    getCurrentLocation();
    loadGeofences();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location access is needed for geofencing functionality');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCurrentLocation(location.coords);
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', 'Unable to get current location');
    }
  };

  const createGeofence = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a location name');
      return;
    }

    if (!currentLocation) {
      Alert.alert('Location Error', 'Current location not available');
      return;
    }

    try {
      const result = await GeofenceService.createGeofence(
        name.trim(),
        currentLocation.latitude,
        currentLocation.longitude,
        parseFloat(selectedRadius)
      );

      if (result.success) {
        Alert.alert('Success', `Geofence "${name}" created successfully`);
        setName('');
        loadGeofences();
      }
    } catch (error: any) {
      Alert.alert('Creation Failed', error.message || 'Unable to create geofence');
    }
  };

  const loadGeofences = async () => {
    if (!currentLocation) return;

    try {
      setRefreshing(true);
      const result = await GeofenceService.checkLocation(
        currentLocation.latitude,
        currentLocation.longitude
      );

      if (result.success) {
        setGeofences(result.geofences || []);
      }
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleMonitoring = async () => {
    try {
      if (monitoring) {
        await GeofenceService.stopMonitoring();
        setMonitoring(false);
      } else {
        await GeofenceService.startMonitoring();
        setMonitoring(true);
      }
    } catch (error: any) {
      Alert.alert('Monitoring Error', error.message);
    }
  };

  const deleteGeofence = async (id: string, name: string) => {
    Alert.alert(
      'Delete Geofence',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await GeofenceService.deleteGeofence(id);
              loadGeofences();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete geofence');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#8b5cf6', '#6366f1']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Ionicons name="location" size={32} color="#fff" />
          <Text style={styles.headerTitle}>Geofencing</Text>
          <Text style={styles.headerSubtitle}>Smart location alerts</Text>
        </View>
      </LinearGradient>

      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="add-circle" size={24} color="#8b5cf6" />
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>Create Geofence</Text>
            <Text style={styles.sectionDesc}>Set up location-based alerts</Text>
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Home, Office, School"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Detection Radius</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.radiusScroll}>
            <View style={styles.radiusSelector}>
              {radiusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.radiusOption,
                    selectedRadius === option.value && styles.radiusOptionSelected
                  ]}
                  onPress={() => setSelectedRadius(option.value)}
                >
                  <Ionicons 
                    name={option.icon as any} 
                    size={20} 
                    color={selectedRadius === option.value ? '#8b5cf6' : '#64748b'} 
                  />
                  <Text style={[
                    styles.radiusText,
                    selectedRadius === option.value && styles.radiusTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.settingsGroup}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notify on Entry</Text>
            <Switch
              value={notifyOnEnter}
              onValueChange={setNotifyOnEnter}
              trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
              thumbColor={notifyOnEnter ? '#ffffff' : '#f1f5f9'}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notify on Exit</Text>
            <Switch
              value={notifyOnExit}
              onValueChange={setNotifyOnExit}
              trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
              thumbColor={notifyOnExit ? '#ffffff' : '#f1f5f9'}
            />
          </View>
        </View>

        {currentLocation && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Current Position</Text>
            <Text style={styles.coordinates}>
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
            <Text style={styles.accuracy}>
              Accuracy: ±{currentLocation.accuracy?.toFixed(0) || 'Unknown'}m
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.createButton, !name.trim() && styles.createButtonDisabled]} 
          onPress={createGeofence}
          disabled={!name.trim()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={name.trim() ? ['#8b5cf6', '#6366f1'] : ['#cbd5e1', '#94a3b8']}
            style={styles.createButtonGradient}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Create Geofence</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <View style={styles.monitoringCard}>
          <LinearGradient
            colors={monitoring ? ['#10b981', '#059669'] : ['#f1f5f9', '#e2e8f0']}
            style={styles.monitoringGradient}
          >
            <View style={styles.monitoringContent}>
              <View style={styles.monitoringIcon}>
                <Ionicons 
                  name={monitoring ? 'radio-button-on' : 'radio-button-off'} 
                  size={32} 
                  color={monitoring ? '#fff' : '#64748b'} 
                />
              </View>
              <View style={styles.monitoringText}>
                <Text style={[styles.monitoringTitle, monitoring && styles.monitoringTitleActive]}>
                  Background Monitoring
                </Text>
                <Text style={[styles.monitoringStatus, monitoring && styles.monitoringStatusActive]}>
                  {monitoring ? '✓ Active - Tracking your location' : 'Tap to enable'}
                </Text>
              </View>
              <Switch
                value={monitoring}
                onValueChange={toggleMonitoring}
                trackColor={{ false: '#cbd5e1', true: '#dcfce7' }}
                thumbColor={monitoring ? '#ffffff' : '#f1f5f9'}
              />
            </View>
          </LinearGradient>
        </View>
      </Animated.View>

      {geofences.length > 0 && (
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={24} color="#8b5cf6" />
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Active Geofences</Text>
              <Text style={styles.sectionDesc}>{geofences.length} location{geofences.length !== 1 ? 's' : ''}</Text>
            </View>
            <TouchableOpacity onPress={loadGeofences} disabled={refreshing}>
              <Ionicons name="refresh" size={20} color="#8b5cf6" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.geofenceList}>
            {geofences.map((fence, idx) => (
              <View key={idx} style={styles.geofenceCard}>
                <View style={styles.geofenceIconContainer}>
                  <LinearGradient
                    colors={fence.status === 'inside' ? ['#10b981', '#059669'] : ['#f59e0b', '#d97706']}
                    style={styles.geofenceIconGradient}
                  >
                    <Ionicons 
                      name={fence.status === 'inside' ? 'checkmark-circle' : 'location'} 
                      size={24} 
                      color="#fff" 
                    />
                  </LinearGradient>
                </View>
                
                <View style={styles.geofenceInfo}>
                  <View style={styles.geofenceHeader}>
                    <Text style={styles.geofenceName}>{fence.name}</Text>
                    <View style={[
                      styles.statusBadge,
                      fence.status === 'inside' ? styles.statusInside : styles.statusOutside
                    ]}>
                      <Text style={styles.statusText}>
                        {fence.status === 'inside' ? 'Inside' : 'Outside'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.geofenceDetails}>
                    <View style={styles.detailItem}>
                      <Ionicons name="navigate" size={14} color="#64748b" />
                      <Text style={styles.distanceText}>{fence.distance}km away</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => deleteGeofence(fence.id, fence.name)}
                >
                  <Ionicons name="trash-outline" size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {geofences.length === 0 && (
        <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="location-outline" size={64} color="#cbd5e1" />
          </View>
          <Text style={styles.emptyTitle}>No Geofences Yet</Text>
          <Text style={styles.emptyDesc}>
            Create your first geofence above to start receiving location-based alerts
          </Text>
        </Animated.View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerGradient: { paddingTop: 60, paddingBottom: 32, paddingHorizontal: 20 },
  headerContent: { alignItems: 'center' },
  headerTitle: { fontSize: 28, fontFamily: 'LeagueSpartan_700Bold', color: '#fff', marginTop: 12, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#e9d5ff' },
  section: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginHorizontal: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { fontSize: 18, fontFamily: 'LeagueSpartan_700Bold', color: '#0f172a', marginBottom: 2 },
  sectionDesc: { fontSize: 13, color: '#64748b' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontFamily: 'LeagueSpartan_600SemiBold', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', padding: 12, borderRadius: 8, fontSize: 16, color: '#0f172a' },
  radiusScroll: { marginHorizontal: -4 },
  radiusSelector: { flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
  radiusOption: { backgroundColor: '#f8fafc', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0', alignItems: 'center', gap: 4, minWidth: 80 },
  radiusOptionSelected: { backgroundColor: '#f5f3ff', borderColor: '#8b5cf6' },
  radiusText: { fontSize: 12, fontFamily: 'LeagueSpartan_600SemiBold', color: '#64748b' },
  radiusTextSelected: { color: '#8b5cf6' },
  settingsGroup: { marginBottom: 16 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  settingLabel: { fontSize: 14, fontFamily: 'LeagueSpartan_600SemiBold', color: '#374151' },
  locationInfo: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  locationLabel: { fontSize: 12, fontFamily: 'LeagueSpartan_600SemiBold', color: '#64748b', marginBottom: 4 },
  coordinates: { fontSize: 14, fontFamily: 'LeagueSpartan_600SemiBold', color: '#0f172a', fontFamily: 'monospace' },
  accuracy: { fontSize: 11, color: '#64748b', marginTop: 4 },
  createButton: { borderRadius: 12, overflow: 'hidden', shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  createButtonDisabled: { shadowOpacity: 0 },
  createButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
  createButtonText: { color: '#ffffff', fontSize: 16, fontFamily: 'LeagueSpartan_700Bold' },
  monitoringCard: { borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  monitoringGradient: { padding: 20 },
  monitoringContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  monitoringIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  monitoringText: { flex: 1 },
  monitoringTitle: { fontSize: 16, fontFamily: 'LeagueSpartan_700Bold', color: '#64748b', marginBottom: 4 },
  monitoringTitleActive: { color: '#fff' },
  monitoringStatus: { fontSize: 13, color: '#94a3b8' },
  monitoringStatusActive: { color: '#dcfce7' },
  geofenceList: { gap: 12 },
  geofenceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', gap: 12 },
  geofenceIconContainer: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  geofenceIconGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  geofenceInfo: { flex: 1 },
  geofenceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  geofenceName: { fontSize: 16, fontFamily: 'LeagueSpartan_700Bold', color: '#0f172a', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusInside: { backgroundColor: '#d1fae5' },
  statusOutside: { backgroundColor: '#fef3c7' },
  statusText: { fontSize: 10, fontFamily: 'LeagueSpartan_700Bold', color: '#0f172a', textTransform: 'uppercase' },
  geofenceDetails: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  distanceText: { fontSize: 12, color: '#64748b', fontFamily: 'LeagueSpartan_600SemiBold' },
  deleteButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  emptyState: { backgroundColor: '#ffffff', borderRadius: 20, padding: 48, marginHorizontal: 16, alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  emptyIconContainer: { marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: 'LeagueSpartan_700Bold', color: '#64748b', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
  bottomPadding: { height: 32 }
});
