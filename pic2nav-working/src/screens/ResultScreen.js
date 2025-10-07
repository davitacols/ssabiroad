import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResultScreen({ route, navigation }) {
  const { result } = route.params;

  const shareResult = async () => {
    try {
      const message = `SSABIRoad Analysis Result:\n\nLocation: ${result.result?.location || 'Unknown'}\nConfidence: ${((result.result?.confidence || 0) * 100).toFixed(1)}%\nAnalyzed: ${new Date(result.timestamp).toLocaleString()}`;
      
      await Share.share({
        message: message,
        title: 'SSABIRoad Analysis Result',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatCoordinate = (coord) => {
    return coord ? coord.toFixed(6) : 'N/A';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Analysis Result</Text>
        <TouchableOpacity onPress={shareResult}>
          <Ionicons name="share-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: result.image }} style={styles.resultImage} />
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.cardTitle}>Location Analysis</Text>
          <View style={styles.resultRow}>
            <Ionicons name="location" size={20} color="#007AFF" />
            <View style={styles.resultText}>
              <Text style={styles.resultLabel}>Detected Location</Text>
              <Text style={styles.resultValue}>{result.result?.location || 'Unknown'}</Text>
            </View>
          </View>
          <View style={styles.resultRow}>
            <Ionicons name="analytics" size={20} color="#007AFF" />
            <View style={styles.resultText}>
              <Text style={styles.resultLabel}>Confidence Score</Text>
              <Text style={styles.resultValue}>
                {((result.result?.confidence || 0) * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {result.exif && (
          <View style={styles.resultCard}>
            <Text style={styles.cardTitle}>EXIF Data</Text>
            {result.exif.GPSLatitude && (
              <View style={styles.resultRow}>
                <Ionicons name="navigate" size={20} color="#007AFF" />
                <View style={styles.resultText}>
                  <Text style={styles.resultLabel}>GPS Coordinates</Text>
                  <Text style={styles.resultValue}>
                    {formatCoordinate(result.exif.GPSLatitude)}, {formatCoordinate(result.exif.GPSLongitude)}
                  </Text>
                </View>
              </View>
            )}
            {result.exif.DateTime && (
              <View style={styles.resultRow}>
                <Ionicons name="time" size={20} color="#007AFF" />
                <View style={styles.resultText}>
                  <Text style={styles.resultLabel}>Photo Taken</Text>
                  <Text style={styles.resultValue}>{result.exif.DateTime}</Text>
                </View>
              </View>
            )}
            {result.exif.Make && (
              <View style={styles.resultRow}>
                <Ionicons name="camera" size={20} color="#007AFF" />
                <View style={styles.resultText}>
                  <Text style={styles.resultLabel}>Camera</Text>
                  <Text style={styles.resultValue}>{result.exif.Make} {result.exif.Model}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.resultCard}>
          <Text style={styles.cardTitle}>Analysis Details</Text>
          <View style={styles.resultRow}>
            <Ionicons name="calendar" size={20} color="#007AFF" />
            <View style={styles.resultText}>
              <Text style={styles.resultLabel}>Analyzed On</Text>
              <Text style={styles.resultValue}>
                {new Date(result.timestamp).toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.resultRow}>
            <Ionicons name="server" size={20} color="#007AFF" />
            <View style={styles.resultText}>
              <Text style={styles.resultLabel}>API Endpoint</Text>
              <Text style={styles.resultValue}>SSABIRoad v2</Text>
            </View>
          </View>
        </View>

        {result.result?.details && (
          <View style={styles.resultCard}>
            <Text style={styles.cardTitle}>Additional Information</Text>
            <Text style={styles.detailsText}>
              {JSON.stringify(result.result.details, null, 2)}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  resultImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
  },
  resultCard: {
    backgroundColor: 'white',
    margin: 10,
    padding: 20,
    borderRadius: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  resultText: {
    flex: 1,
    marginLeft: 15,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  detailsText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 5,
  },
});