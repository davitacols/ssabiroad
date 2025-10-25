import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Switch } from 'react-native';
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Create New Geofence</Text>
        <Text style={styles.sectionDesc}>Set up location-based alerts</Text>
        
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
              {monitoring ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <Switch
            value={monitoring}
            onValueChange={toggleMonitoring}
            trackColor={{ false: '#e2e8f0', true: '#10b981' }}
            thumbColor={monitoring ? '#ffffff' : '#f1f5f9'}
          />
        </View>
      </View>

      {geofences.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Geofences</Text>
          <Text style={styles.sectionDesc}>{geofences.length} location{geofences.length !== 1 ? 's' : ''}</Text>
          
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
            Create your first geofence to start receiving alerts
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  section: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  sectionDesc: { fontSize: 14, color: '#64748b', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', padding: 12, borderRadius: 8, fontSize: 16, color: '#0f172a' },
  radiusSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  radiusOption: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  radiusOptionSelected: { backgroundColor: '#dbeafe', borderColor: '#3b82f6' },
  radiusText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  radiusTextSelected: { color: '#3b82f6' },
  settingsGroup: { marginBottom: 16 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  settingLabel: { fontSize: 14, fontWeight: '500', color: '#374151' },
  locationInfo: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  locationLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 },
  coordinates: { fontSize: 14, fontWeight: '600', color: '#0f172a', fontFamily: 'monospace' },
  accuracy: { fontSize: 11, color: '#64748b', marginTop: 4 },
  createButton: { backgroundColor: '#3b82f6', padding: 14, borderRadius: 8, alignItems: 'center' },
  createButtonDisabled: { backgroundColor: '#94a3b8' },
  createButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  monitoringHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  geofenceList: { gap: 12 },
  geofenceCard: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  geofenceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  geofenceName: { fontSize: 15, fontWeight: '600', color: '#0f172a', flex: 1 },
  statusIndicator: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusInside: { backgroundColor: '#dcfce7' },
  statusOutside: { backgroundColor: '#fef3c7' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#0f172a' },
  geofenceDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  distanceText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  deleteButton: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  deleteButtonText: { fontSize: 11, fontWeight: '600', color: '#dc2626' },
  emptyState: { backgroundColor: '#ffffff', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#94a3b8', textAlign: 'center' }
});
