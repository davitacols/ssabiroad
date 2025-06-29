import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [photo, setPhoto] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, successful: 0 });
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('locationHistory') || '[]');
      setHistory(saved);
      setStats({
        total: saved.length,
        successful: saved.filter(item => item.result.success).length
      });
    } catch (error) {
      console.log('Failed to load history');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto(e.target.result);
        analyzeImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (file) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('latitude', '0');
      formData.append('longitude', '0');

      console.log('Sending request to API...');
      const response = await fetch('https://cors-anywhere.herokuapp.com/https://pic2nav.com/api/location-recognition-v2', {
        method: 'POST',
        body: formData,
        mode: 'cors',
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('API response:', data);
      setResult(data);
      
      // Save to history
      const historyItem = {
        id: Date.now(),
        filename: file.name,
        result: data,
        timestamp: new Date().toISOString(),
      };
      
      const newHistory = [historyItem, ...history].slice(0, 50);
      setHistory(newHistory);
      localStorage.setItem('locationHistory', JSON.stringify(newHistory));
      
      setStats({
        total: newHistory.length,
        successful: newHistory.filter(item => item.result.success).length
      });
    } catch (error) {
      setResult({ error: 'Failed to analyze location' });
    } finally {
      setLoading(false);
    }
  };

  const resetCamera = () => {
    setPhoto(null);
    setResult(null);
  };

  // Landing Screen
  if (currentScreen === 'landing') {
    return (
      <ScrollView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.title}>SSABiRoad</Text>
          <Text style={styles.subtitle}>Pic2Nav Mobile</Text>
          <Text style={styles.description}>
            Identify locations instantly using AI-powered image recognition
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureTitle}>📸 Smart Recognition</Text>
            <Text style={styles.featureText}>Take photos and get instant location identification</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureTitle}>📍 GPS Integration</Text>
            <Text style={styles.featureText}>Combine visual recognition with GPS for accuracy</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureTitle}>📊 Analytics</Text>
            <Text style={styles.featureText}>Track your location discoveries and history</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => setCurrentScreen('camera')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Camera Screen
  if (currentScreen === 'camera') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => setCurrentScreen('dashboard')}>
            <Text style={styles.navText}>📊 Dashboard</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>📸 Camera</Text>
          <TouchableOpacity onPress={() => setCurrentScreen('history')}>
            <Text style={styles.navText}>📋 History</Text>
          </TouchableOpacity>
        </View>
        
        {!photo ? (
          <View style={styles.uploadContainer}>
            <Text style={styles.text}>Upload a photo to identify location</Text>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => fileInputRef.current?.click()}
            >
              <Text style={styles.buttonText}>Choose Photo</Text>
            </TouchableOpacity>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </View>
        ) : (
          <ScrollView style={styles.preview}>
            <Image source={{ uri: photo }} style={styles.image} />
            
            {loading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>🔍 Analyzing location...</Text>
              </View>
            )}
            
            {result && !loading && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>📍 Location Result</Text>
                <Text style={styles.resultText}>
                  {result.success 
                    ? result.address || result.name || 'Location detected'
                    : result.error || 'Could not identify location'
                  }
                </Text>
              </View>
            )}
            
            <TouchableOpacity style={styles.button} onPress={resetCamera}>
              <Text style={styles.buttonText}>Take Another Photo</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    );
  }

  // Dashboard Screen
  if (currentScreen === 'dashboard') {
    return (
      <ScrollView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => setCurrentScreen('camera')}>
            <Text style={styles.navText}>📸 Camera</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>📊 Dashboard</Text>
          <TouchableOpacity onPress={() => setCurrentScreen('history')}>
            <Text style={styles.navText}>📋 History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statTitle}>Total Scans</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.successful}</Text>
            <Text style={styles.statTitle}>Successful</Text>
            <Text style={styles.statSubtitle}>
              {Math.round((stats.successful / Math.max(stats.total, 1)) * 100)}% success rate
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => setCurrentScreen('camera')}
          >
            <Text style={styles.actionTitle}>📸 Take Photo</Text>
            <Text style={styles.actionSubtitle}>Analyze a new location</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => setCurrentScreen('history')}
          >
            <Text style={styles.actionTitle}>📋 View History</Text>
            <Text style={styles.actionSubtitle}>See past detections</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // History Screen
  if (currentScreen === 'history') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => setCurrentScreen('camera')}>
            <Text style={styles.navText}>📸 Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentScreen('dashboard')}>
            <Text style={styles.navText}>📊 Dashboard</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>📋 History</Text>
        </View>

        {history.length > 0 ? (
          <ScrollView style={styles.historyList}>
            {history.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <Text style={styles.historyFilename}>{item.filename}</Text>
                <Text style={styles.historyDate}>
                  {new Date(item.timestamp).toLocaleDateString()}
                </Text>
                <Text style={[styles.historyResult, { color: item.result.success ? '#34C759' : '#FF6B6B' }]}>
                  {item.result.success ? '✅ ' : '❌ '}
                  {item.result.success 
                    ? item.result.address || item.result.name || 'Location detected'
                    : item.result.error || 'Failed to detect'
                  }
                </Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyTitle}>No History Yet</Text>
            <Text style={styles.emptyText}>Start analyzing photos to see your history here</Text>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 40, alignItems: 'center', marginTop: 60 },
  title: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { color: '#007AFF', fontSize: 20, marginBottom: 20 },
  description: { color: '#ccc', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  features: { padding: 20 },
  feature: { backgroundColor: '#1a1a1a', padding: 20, borderRadius: 15, marginBottom: 15 },
  featureTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  featureText: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  primaryButton: { backgroundColor: '#007AFF', padding: 18, borderRadius: 12, alignItems: 'center', margin: 20 },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  navbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, marginTop: 40 },
  navText: { color: '#007AFF', fontSize: 14 },
  navTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  text: { color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 30 },
  uploadContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  preview: { flex: 1, padding: 20 },
  image: { width: '100%', height: 250, borderRadius: 15, marginBottom: 20 },
  loadingContainer: { backgroundColor: '#1a1a1a', padding: 20, borderRadius: 15, marginBottom: 20, alignItems: 'center' },
  loadingText: { color: '#007AFF', fontSize: 16 },
  resultContainer: { backgroundColor: '#1a1a1a', padding: 20, borderRadius: 15, marginBottom: 20 },
  resultTitle: { color: '#007AFF', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  resultText: { color: '#fff', fontSize: 16, lineHeight: 22 },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  statsContainer: { flexDirection: 'row', padding: 20, gap: 15 },
  statCard: { flex: 1, backgroundColor: '#1a1a1a', padding: 20, borderRadius: 15 },
  statValue: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 5 },
  statTitle: { color: '#ccc', fontSize: 16, marginBottom: 5 },
  statSubtitle: { color: '#666', fontSize: 14 },
  section: { padding: 20 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  actionCard: { backgroundColor: '#1a1a1a', padding: 20, borderRadius: 15, marginBottom: 15 },
  actionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  actionSubtitle: { color: '#ccc', fontSize: 14 },
  historyList: { flex: 1, padding: 20 },
  historyItem: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 15, marginBottom: 15 },
  historyFilename: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  historyDate: { color: '#666', fontSize: 12, marginBottom: 10 },
  historyResult: { fontSize: 14, lineHeight: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 20 },
  emptyTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  emptyText: { color: '#ccc', fontSize: 16, textAlign: 'center', lineHeight: 24 },
});