import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function DashboardScreen() {
  const [stats, setStats] = useState({
    totalDetections: 0,
    successfulDetections: 0,
    recentLocations: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load local history
      const history = JSON.parse(localStorage.getItem('locationHistory') || '[]');
      const successful = history.filter(item => item.result.success);
      
      // Get recent locations API data
      const response = await fetch('https://ssabiroad.vercel.app/api/recent-locations');
      const recentData = await response.json();

      setStats({
        totalDetections: history.length,
        successfulDetections: successful.length,
        recentLocations: recentData.locations || [],
      });
    } catch (error) {
      console.log('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, color = '#007AFF' }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const LocationCard = ({ location }) => (
    <View style={styles.locationCard}>
      <Text style={styles.locationName}>{location.name || location.address}</Text>
      <Text style={styles.locationDetails}>
        {location.detectionCount} detections • {location.lastDetected}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Dashboard</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      
      <View style={styles.statsContainer}>
        <StatCard 
          title="Total Scans"
          value={stats.totalDetections}
          subtitle="Photos analyzed"
          color="#007AFF"
        />
        
        <StatCard 
          title="Successful"
          value={stats.successfulDetections}
          subtitle={`${Math.round((stats.successfulDetections / Math.max(stats.totalDetections, 1)) * 100)}% success rate`}
          color="#34C759"
        />
        
        <StatCard 
          title="This Week"
          value={stats.totalDetections}
          subtitle="Recent activity"
          color="#FF9500"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Popular Locations</Text>
        {stats.recentLocations.length > 0 ? (
          stats.recentLocations.slice(0, 5).map((location, index) => (
            <LocationCard key={index} location={location} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No locations detected yet</Text>
            <Text style={styles.emptySubtext}>Start scanning photos to see your results here</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionTitle}>📊 View Analytics</Text>
          <Text style={styles.actionSubtitle}>Detailed insights and trends</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionTitle}>🗺️ Explore Map</Text>
          <Text style={styles.actionSubtitle}>See all detected locations</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionTitle}>⚙️ Settings</Text>
          <Text style={styles.actionSubtitle}>Customize your experience</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 60,
    marginBottom: 30,
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
  statsContainer: {
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statTitle: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 5,
  },
  statSubtitle: {
    color: '#666',
    fontSize: 14,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  locationCard: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  locationName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  locationDetails: {
    color: '#ccc',
    fontSize: 14,
  },
  emptyState: {
    backgroundColor: '#1a1a1a',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
  },
  emptyText: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 5,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  actionCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  actionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  actionSubtitle: {
    color: '#ccc',
    fontSize: 14,
  },
});