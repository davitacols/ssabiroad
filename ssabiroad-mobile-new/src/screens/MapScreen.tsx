import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MapScreen() {
  const locations = [
    { 
      id: 1, 
      name: 'Empire State Building', 
      type: 'Art Deco Skyscraper',
      walkScore: 95,
      bikeScore: 78
    },
    { 
      id: 2, 
      name: 'Chrysler Building', 
      type: 'Art Deco Architecture',
      walkScore: 92,
      bikeScore: 75
    },
    { 
      id: 3, 
      name: 'One World Trade Center', 
      type: 'Modern Skyscraper',
      walkScore: 88,
      bikeScore: 82
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map" size={80} color="#2563eb" />
        <Text style={styles.placeholderText}>Interactive Map</Text>
        <Text style={styles.instructionText}>
          Explore analyzed buildings and location intelligence data
        </Text>
      </View>

      <TouchableOpacity style={styles.locationButton}>
        <Ionicons name="locate" size={24} color="#2563eb" />
      </TouchableOpacity>

      <View style={styles.bottomSheet}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>Analyzed Locations</Text>
        
        <ScrollView style={styles.locationsList}>
          {locations.map((location) => (
            <View key={location.id} style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <Ionicons name="business" size={24} color="#2563eb" />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationType}>{location.type}</Text>
                </View>
              </View>
              
              <View style={styles.scoresContainer}>
                <View style={styles.scoreItem}>
                  <Ionicons name="walk" size={16} color="#10b981" />
                  <Text style={styles.scoreText}>Walk: {location.walkScore}</Text>
                </View>
                <View style={styles.scoreItem}>
                  <Ionicons name="bicycle" size={16} color="#3b82f6" />
                  <Text style={styles.scoreText}>Bike: {location.bikeScore}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#e5e7eb',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 20,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  locationButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  locationsList: {
    flex: 1,
  },
  locationCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  locationType: {
    fontSize: 14,
    color: '#6b7280',
  },
  scoresContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});