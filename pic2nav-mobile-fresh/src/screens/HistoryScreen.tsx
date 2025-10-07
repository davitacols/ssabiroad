import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAnalysisHistory, clearAnalysisHistory, HistoryItem } from '../services/storage';

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const historyData = await getAnalysisHistory();
    setHistory(historyData);
  };

  const clearHistory = async () => {
    await clearAnalysisHistory();
    setHistory([]);
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <View style={styles.historyItem}>
      <View style={styles.itemHeader}>
        <Text style={styles.location}>{item.location}</Text>
        <Text style={styles.confidence}>{(item.confidence * 100).toFixed(1)}%</Text>
      </View>
      <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
      {item.coordinates && (
        <Text style={styles.coordinates}>
          {item.coordinates.lat.toFixed(4)}, {item.coordinates.lng.toFixed(4)}
        </Text>
      )}
    </View>
  );

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="time-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No Analysis History</Text>
        <Text style={styles.emptyText}>Your location analysis results will appear here</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analysis History</Text>
        <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
    </View>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearText: {
    marginLeft: 5,
    color: '#FF3B30',
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  location: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  confidence: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  coordinates: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});