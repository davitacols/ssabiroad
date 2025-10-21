import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Pic2Nav</Text>
        <Text style={styles.subtitle}>Photo Location Analysis & Professional Tools</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="camera" size={32} color="#2563eb" />
          <Text style={styles.actionText}>Photo Scanner</Text>
          <Text style={styles.actionSubtext}>Identify locations</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="folder" size={32} color="#2563eb" />
          <Text style={styles.actionText}>Pro Tools</Text>
          <Text style={styles.actionSubtext}>EXIF & GPS editing</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Activity</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="analytics" size={24} color="#2563eb" />
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Detections</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="bookmark" size={24} color="#10b981" />
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="business" size={24} color="#f59e0b" />
            <Text style={styles.statValue}>15</Text>
            <Text style={styles.statLabel}>Buildings</Text>
          </View>
        </View>
      </View>

      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.featureItem}>
          <Ionicons name="camera" size={24} color="#2563eb" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Photo Scanner</Text>
            <Text style={styles.featureDesc}>Identify locations from images using GPS and visual analysis</Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="construct" size={24} color="#2563eb" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Professional Tools</Text>
            <Text style={styles.featureDesc}>Bulk EXIF editor, GPS geotagging, and metadata management</Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="location" size={24} color="#2563eb" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Location Management</Text>
            <Text style={styles.featureDesc}>Save, share, and organize discovered locations</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    backgroundColor: '#2563eb',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e2e8f0',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  actionSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  featuresSection: {
    padding: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureText: {
    flex: 1,
    marginLeft: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
});