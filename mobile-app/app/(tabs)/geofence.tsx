import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Switch, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { GeofenceService } from '../../services/geofence';

const { width } = Dimensions.get('window');

export default function GeofenceScreen() {
  const [name, setName] = useState('');
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [geofences, setGeofences] = useState<any[]>([]);
  const [monitoring, setMonitoring] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState('500');
  const [showCreate, setShowCreate] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0];

  const radiusOptions = [
    { value: '100', label: '100m', icon: 'walk' },
    { value: '500', label: '500m', icon: 'car' },
    { value: '1000', label: '1km', icon: 'car-sport' },
  ];

  useEffect(() => {
    getCurrentLocation();
    loadGeofences();
    checkMonitoring();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCurrentLocation(location.coords);
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const checkMonitoring = async () => {
    const isActive = await GeofenceService.isMonitoring();
    setMonitoring(isActive);
  };

  const createGeofence = async () => {
    if (!name.trim() || !currentLocation) {
      Alert.alert('Error', 'Please enter a name and ensure location is available');
      return;
    }

    try {
      await GeofenceService.createGeofence(
        name.trim(),
        currentLocation.latitude,
        currentLocation.longitude,
        parseFloat(selectedRadius)
      );
      Alert.alert('Success', 'Geofence created');
      setName('');
      setShowCreate(false);
      loadGeofences();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const loadGeofences = async () => {
    if (!currentLocation) return;
    try {
      const result = await GeofenceService.checkLocation(currentLocation.latitude, currentLocation.longitude);
      if (result.success) setGeofences(result.geofences || []);
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
        const hasPermission = await GeofenceService.requestPermissions();
        if (!hasPermission) {
          Alert.alert('Permission Required', 'Background location permission is needed');
          return;
        }
        await GeofenceService.startMonitoring();
        setMonitoring(true);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const deleteGeofence = async (id: string, name: string) => {
    Alert.alert('Delete', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await GeofenceService.deleteGeofence(id);
          loadGeofences();
        }
      }
    ]);
  };

  const toggleCreate = () => {
    setShowCreate(!showCreate);
    Animated.spring(slideAnim, {
      toValue: showCreate ? 0 : 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000', '#1a1a1a']} style={styles.header}>
        <Text style={styles.headerTitle}>Geofences</Text>
        <Text style={styles.headerSubtitle}>{geofences.length} active locations</Text>
      </LinearGradient>

      <View style={styles.monitoringCard}>
        <View style={styles.monitoringLeft}>
          <View style={[styles.statusDot, monitoring && styles.statusDotActive]} />
          <View>
            <Text style={styles.monitoringTitle}>Background Monitoring</Text>
            <Text style={styles.monitoringStatus}>{monitoring ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
        <Switch
          value={monitoring}
          onValueChange={toggleMonitoring}
          trackColor={{ false: '#e5e7eb', true: '#10b981' }}
          thumbColor="#fff"
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {geofences.map((fence, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={[styles.iconCircle, fence.status === 'inside' && styles.iconCircleActive]}>
                <Ionicons name="location" size={20} color={fence.status === 'inside' ? '#10b981' : '#6b7280'} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{fence.name}</Text>
                <Text style={styles.cardDistance}>{fence.distance}km away</Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <View style={[styles.badge, fence.status === 'inside' ? styles.badgeInside : styles.badgeOutside]}>
                <Text style={styles.badgeText}>{fence.status === 'inside' ? 'Inside' : 'Outside'}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteGeofence(fence.id, fence.name)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {geofences.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No geofences yet</Text>
            <Text style={styles.emptyText}>Create your first location alert below</Text>
          </View>
        )}
      </ScrollView>

      {showCreate && (
        <Animated.View style={[styles.createPanel, { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }] }]}>
          <View style={styles.panelHandle} />
          <Text style={styles.panelTitle}>New Geofence</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Location name"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Radius</Text>
          <View style={styles.radiusRow}>
            {radiusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.radiusBtn, selectedRadius === option.value && styles.radiusBtnActive]}
                onPress={() => setSelectedRadius(option.value)}
              >
                <Ionicons name={option.icon as any} size={18} color={selectedRadius === option.value ? '#fff' : '#6b7280'} />
                <Text style={[styles.radiusLabel, selectedRadius === option.value && styles.radiusLabelActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.createBtn} onPress={createGeofence}>
            <Text style={styles.createBtnText}>Create Geofence</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <TouchableOpacity style={styles.fab} onPress={toggleCreate}>
        <LinearGradient colors={['#000', '#1a1a1a']} style={styles.fabGradient}>
          <Ionicons name={showCreate ? 'close' : 'add'} size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  headerTitle: { fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#9ca3af' },
  monitoringCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  monitoringLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#e5e7eb' },
  statusDotActive: { backgroundColor: '#10b981' },
  monitoringTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 },
  monitoringStatus: { fontSize: 13, color: '#6b7280' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  iconCircleActive: { backgroundColor: '#d1fae5' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 },
  cardDistance: { fontSize: 13, color: '#6b7280' },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeInside: { backgroundColor: '#d1fae5' },
  badgeOutside: { backgroundColor: '#fef3c7' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#111827', textTransform: 'uppercase' },
  deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 64 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9ca3af' },
  createPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
  panelHandle: { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  panelTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', padding: 16, borderRadius: 12, fontSize: 16, color: '#111827', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 12 },
  radiusRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  radiusBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#f9fafb', padding: 12, borderRadius: 12, borderWidth: 2, borderColor: '#e5e7eb' },
  radiusBtnActive: { backgroundColor: '#000', borderColor: '#000' },
  radiusLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  radiusLabelActive: { color: '#fff' },
  createBtn: { backgroundColor: '#000', padding: 16, borderRadius: 12, alignItems: 'center' },
  createBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  fab: { position: 'absolute', bottom: 32, right: 20, width: 60, height: 60, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabGradient: { width: '100%', height: '100%', borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
});
