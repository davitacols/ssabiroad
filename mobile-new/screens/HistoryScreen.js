import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const localHistory = JSON.parse(localStorage.getItem('locationHistory') || '[]');
      setHistory(localHistory);
    } catch (error) {
      console.log('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem('locationHistory');
    setHistory([]);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const HistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyFilename}>{item.filename}</Text>
        <Text style={styles.historyDate}>{formatDate(item.timestamp)}</Text>
      </View>
      
      <View style={styles.historyResult}>
        {item.result.success ? (
          <>
            <Text style={styles.successIcon}>✅</Text>
            <View style={styles.resultContent}>
              <Text style={styles.resultText}>
                {item.result.address || item.result.name || 'Location detected'}
              </Text>
              {item.result.confidence && (
                <Text style={styles.confidenceText}>
                  Confidence: {Math.round(item.result.confidence * 100)}%
                </Text>
              )}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.errorIcon}>❌</Text>
            <View style={styles.resultContent}>
              <Text style={styles.errorText}>
                {item.result.error || 'Could not identify location'}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>History</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length > 0 ? (
        <ScrollView style={styles.historyList}>
          {history.map((item) => (
            <HistoryItem key={item.id} item={item} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📷</Text>
          <Text style={styles.emptyTitle}>No History Yet</Text>
          <Text style={styles.emptyText}>
            Your photo analysis history will appear here once you start using the camera feature.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ccc',
    fontSize: 16,
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyFilename: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  historyDate: {
    color: '#666',
    fontSize: 12,
  },
  historyResult: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  successIcon: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 2,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 2,
  },
  resultContent: {
    flex: 1,
  },
  resultText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 5,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    lineHeight: 20,
  },
  confidenceText: {
    color: '#ccc',
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});