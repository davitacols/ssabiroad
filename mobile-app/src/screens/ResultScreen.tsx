import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';

export default function ResultScreen({ route, navigation }: any) {
  const { result, photo } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: photo.uri }} style={styles.photo} />
      
      <View style={styles.content}>
        {result.success ? (
          <>
            <Text style={styles.title}>{result.name || 'Location Found'}</Text>
            <Text style={styles.address}>{result.address}</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Confidence:</Text>
              <Text style={styles.value}>{Math.round(result.confidence * 100)}%</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Method:</Text>
              <Text style={styles.value}>{result.method}</Text>
            </View>
            
            {result.location && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Coordinates:</Text>
                <Text style={styles.value}>
                  {result.location.latitude.toFixed(6)}, {result.location.longitude.toFixed(6)}
                </Text>
              </View>
            )}
            
            {result.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{result.description}</Text>
              </View>
            )}
            
            {result.nearbyPlaces && result.nearbyPlaces.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nearby Places</Text>
                {result.nearbyPlaces.slice(0, 5).map((place: any, index: number) => (
                  <Text key={index} style={styles.nearbyPlace}>
                    • {place.name} ({place.distance}m)
                  </Text>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Analysis Failed</Text>
            <Text style={styles.errorMessage}>
              {result.error || 'Unable to determine location from this image'}
            </Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Take Another Photo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  photo: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  address: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  value: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  nearbyPlace: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});