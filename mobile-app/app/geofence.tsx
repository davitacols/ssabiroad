import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { GeofenceService } from '../services/geofence';

export default function GeofenceScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [geofences, setGeofences] = useState<any[]>([]);
  const [monitoring, setMonitoring] = useState(false);
  const [notifyOnEnter, setNotifyOnEnter] = useState(true);
  const [notifyOnExit, setNotifyOnExit] = useState(true);
  const [selectedRadius, setSelectedRadius] = useState('500');

  const radiusOptions = ['100', '250', '500', '1000', '2000'];

  useEffect(() => {
    getCurrentLocation();
    loadGeofences();
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
      const result = await GeofenceService.checkLocation(
        currentLocation.latitude,
        currentLocation.longitude
      );

      if (result.success) {
        setGeofences(result.geofences || []);
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const toggleMonitoring = async () => {
    try {
      if (monitoring) {
        await GeofenceService.stopMonitoring();
        setMonitoring(false);
      } else {
        const { status } = await Location.requestBackgroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Background location access is needed for geofencing to work when the app is closed.'
          );
          return;
        }
        await GeofenceService.startMonitoring();
        setMonitoring(true);
      }
    } catch (error: any) {
      console.error('Create geofence error:', error);
      Alert.alert('Monitoring Error', 'Failed to start monitoring. Please check location permissions.');
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Location Geofencing</Text>
        <Text style={styles.subtitle}>Advanced proximity monitoring and alerts</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create New Geofence</Text>
          <Text style={styles.sectionDesc}>Set up location-based alerts for important places</Text>
          
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
            <View style={styles.radiusSelector}>
              {radiusOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.radiusOption,
                    selectedRadius === option && styles.radiusOptionSelected
                  ]}
                  onPress={() => setSelectedRadius(option)}
                >
                  <Text style={[
                    styles.radiusText,
                    selectedRadius === option && styles.radiusTextSelected
                  ]}>
                    {option}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
          >
            <Text style={styles.createButtonText}>Create Geofence</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.monitoringHeader}>
            <View>
              <Text style={styles.sectionTitle}>Background Monitoring</Text>
              <Text style={styles.sectionDesc}>
                {monitoring ? 'Active - Checking location in background' : 'Inactive - Enable to receive alerts'}
              </Text>
            </View>
            <Switch
              value={monitoring}
              onValueChange={toggleMonitoring}
              trackColor={{ false: '#e2e8f0', true: '#10b981' }}
              thumbColor={monitoring ? '#ffffff' : '#f1f5f9'}
              style={styles.monitoringSwitch}
            />
          </View>
        </View>

        {geofences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Geofences</Text>
            <Text style={styles.sectionDesc}>{geofences.length} location{geofences.length !== 1 ? 's' : ''} being monitored</Text>
            
            <View style={styles.geofenceList}>
              {geofences.map((fence, idx) => (
                <View key={idx} style={styles.geofenceCard}>
                  <View style={styles.geofenceHeader}>
                    <Text style={styles.geofenceName}>{fence.name}</Text>
                    <View style={[
                      styles.statusIndicator,
                      fence.status === 'inside' ? styles.statusInside : styles.statusOutside
                    ]}>
                      <Text style={styles.statusText}>{fence.status}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.geofenceDetails}>
                    <Text style={styles.distanceText}>Distance: {fence.distance}km</Text>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => deleteGeofence(fence.id, fence.name)}
                    >
                      <Text style={styles.deleteButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {geofences.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Geofences Created</Text>
            <Text style={styles.emptyDesc}>
              Create your first geofence to start receiving location-based notifications
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    backgroundColor: '#ffffff', 
    paddingTop: 60, 
    paddingHorizontal: 24, 
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  backButton: { marginBottom: 16 },
  backText: { fontSize: 16, color: '#3b82f6', fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#64748b', fontWeight: '500' },
  content: { flex: 1, padding: 24 },
  section: { 
    backgroundColor: '#ffffff', 
    borderRadius: 20, 
    padding: 24, 
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  sectionDesc: { fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { 
    backgroundColor: '#f8fafc', 
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 16, 
    borderRadius: 12, 
    fontSize: 16,
    color: '#0f172a'
  },
  radiusSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  radiusOption: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  radiusOptionSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6'
  },
  radiusText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  radiusTextSelected: { color: '#3b82f6' },
  settingsGroup: { marginBottom: 20 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12
  },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#374151' },
  locationInfo: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  locationLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 4 },
  coordinates: { fontSize: 15, fontWeight: '600', color: '#0f172a', fontFamily: 'monospace' },
  accuracy: { fontSize: 12, color: '#64748b', marginTop: 4 },
  createButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  createButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0
  },
  createButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  monitoringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  monitoringSwitch: { transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] },
  geofenceList: { gap: 12 },
  geofenceCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  geofenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  geofenceName: { fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusInside: { backgroundColor: '#dcfce7' },
  statusOutside: { backgroundColor: '#fef3c7' },
  statusText: { fontSize: 12, fontWeight: '700', color: '#0f172a' },
  geofenceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  distanceText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  deleteButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  deleteButtonText: { fontSize: 12, fontWeight: '600', color: '#dc2626' },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed'
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  emptyDesc: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20
  }
});