import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Switch, Animated, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { GeofenceService } from '../services/geofence';

export default function GeofenceScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [geofences, setGeofences] = useState<any[]>([]);
  const [monitoring, setMonitoring] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState('500');
  const [showCreate, setShowCreate] = useState(false);
  const slideAnim = useState(new Animated.Value(500))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnims = useRef<Animated.Value[]>([]).current;

  useEffect(() => {
    getCurrentLocation();
    loadGeofences();
    checkMonitoring();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    geofences.forEach((_, i) => {
      if (!scaleAnims[i]) scaleAnims[i] = new Animated.Value(0);
      Animated.spring(scaleAnims[i], { toValue: 1, tension: 50, friction: 7, useNativeDriver: true, delay: i * 100 }).start();
    });
  }, [geofences]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCurrentLocation(location.coords);
    } catch (error) {
      console.error(error);
    }
  };

  const checkMonitoring = async () => {
    const isActive = await GeofenceService.isMonitoring();
    setMonitoring(isActive);
  };

  const createGeofence = async () => {
    if (!name.trim() || !currentLocation) {
      Alert.alert('Error', 'Enter a name');
      return;
    }
    try {
      const result = await GeofenceService.createGeofence(name.trim(), currentLocation.latitude, currentLocation.longitude, parseFloat(selectedRadius));
      if (result.success) {
        setName('');
        toggleCreate();
        setTimeout(() => loadGeofences(), 300);
        Alert.alert('✓ Success', 'Geofence created');
      }
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
      console.error(error);
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
          Alert.alert('Permission Required', 'Enable background location');
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
      { text: 'Delete', style: 'destructive', onPress: async () => { await GeofenceService.deleteGeofence(id); loadGeofences(); } }
    ]);
  };

  const toggleCreate = () => {
    const toValue = showCreate ? 500 : 0;
    setShowCreate(!showCreate);
    Animated.spring(slideAnim, { toValue, useNativeDriver: true, tension: 50, friction: 8 }).start();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Geofences</Text>
          <Text style={styles.headerSub}>{geofences.length} active</Text>
        </View>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusLeft}>
          <View style={[styles.dot, monitoring && styles.dotActive]} />
          <View>
            <Text style={styles.statusTitle}>Monitoring</Text>
            <Text style={styles.statusText}>{monitoring ? 'Active' : 'Off'}</Text>
          </View>
        </View>
        <Switch value={monitoring} onValueChange={toggleMonitoring} trackColor={{ false: '#e5e7eb', true: '#10b981' }} thumbColor="#fff" />
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {geofences.map((f, i) => {
          if (!scaleAnims[i]) scaleAnims[i] = new Animated.Value(0);
          return (
            <Animated.View key={i} style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnims[i] }] }]}>
              <Animated.View style={[styles.icon, f.status === 'inside' && styles.iconActive]}>
                <Ionicons name="location" size={22} color={f.status === 'inside' ? '#10b981' : '#6b7280'} />
              </Animated.View>
              <View style={styles.cardContent}>
                <Text style={styles.cardName}>{f.name}</Text>
                <Text style={styles.cardDist}>{f.distance}km away</Text>
              </View>
              <View style={[styles.badge, f.status === 'inside' ? styles.badgeIn : styles.badgeOut]}>
                <Text style={styles.badgeText}>{f.status === 'inside' ? 'IN' : 'OUT'}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteGeofence(f.id, f.name)} style={styles.del}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
        {geofences.length === 0 && (
          <Animated.View style={[styles.empty, { opacity: fadeAnim }]}>
            <Ionicons name="location-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No geofences</Text>
            <Text style={styles.emptyText}>Tap + to create one</Text>
          </Animated.View>
        )}
      </ScrollView>

      {showCreate && (
        <Animated.View style={[styles.panel, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.handle} />
          <Text style={styles.panelTitle}>New Geofence</Text>
          <TextInput style={styles.input} placeholder="Location name" value={name} onChangeText={setName} placeholderTextColor="#9ca3af" />
          <Text style={styles.label}>Radius</Text>
          <View style={styles.radiusRow}>
            {['100', '500', '1000'].map(r => (
              <TouchableOpacity key={r} style={[styles.radiusBtn, selectedRadius === r && styles.radiusBtnActive]} onPress={() => setSelectedRadius(r)}>
                <Text style={[styles.radiusText, selectedRadius === r && styles.radiusTextActive]}>{r}m</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={createGeofence}>
            <Text style={styles.createText}>Create</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <Animated.View style={[styles.fab, { transform: [{ rotate: showCreate ? '45deg' : '0deg' }] }]}>
        <TouchableOpacity style={styles.fabBtn} onPress={toggleCreate}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#000', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 14, color: '#9ca3af', marginTop: 2 },
  statusCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#e5e7eb' },
  dotActive: { backgroundColor: '#10b981' },
  statusTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  statusText: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iconActive: { backgroundColor: '#d1fae5' },
  cardContent: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  cardDist: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  badgeIn: { backgroundColor: '#d1fae5' },
  badgeOut: { backgroundColor: '#fef3c7' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#111827' },
  del: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 64 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#9ca3af', marginTop: 8 },
  panel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
  handle: { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  panelTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', padding: 16, borderRadius: 12, fontSize: 16, color: '#111827', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 12 },
  radiusRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  radiusBtn: { flex: 1, backgroundColor: '#f9fafb', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#e5e7eb' },
  radiusBtnActive: { backgroundColor: '#000', borderColor: '#000' },
  radiusText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  radiusTextActive: { color: '#fff' },
  createBtn: { backgroundColor: '#000', padding: 16, borderRadius: 12, alignItems: 'center' },
  createText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  fab: { position: 'absolute', bottom: 32, right: 20, width: 60, height: 60, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabBtn: { width: '100%', height: '100%', borderRadius: 30, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
});
