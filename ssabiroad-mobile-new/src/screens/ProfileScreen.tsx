import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const handleMenuPress = (item: string) => {
    Alert.alert(item, `${item} functionality will be implemented`);
  };

  const menuItems = [
    { icon: 'bookmark', title: 'Saved Locations', color: '#10b981' },
    { icon: 'analytics', title: 'Detection History', color: '#3b82f6' },
    { icon: 'camera', title: 'Photo Gallery', color: '#8b5cf6' },
    { icon: 'settings', title: 'Settings', color: '#6b7280' },
    { icon: 'help-circle', title: 'Help & Support', color: '#f59e0b' },
    { icon: 'information-circle', title: 'About Pic2Nav', color: '#2563eb' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#2563eb" />
        </View>
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.email}>john.doe@example.com</Text>
        <Text style={styles.memberSince}>Member since January 2024</Text>
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Statistics</Text>
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
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={24} color="#ef4444" />
            <Text style={styles.statValue}>92%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>
      </View>

      <View style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementItem}>
          <Ionicons name="camera" size={24} color="#f59e0b" />
          <View style={styles.achievementText}>
            <Text style={styles.achievementTitle}>Photo Detective</Text>
            <Text style={styles.achievementDesc}>Successfully identified 10+ locations from photos</Text>
          </View>
        </View>
        <View style={styles.achievementItem}>
          <Ionicons name="construct" size={24} color="#10b981" />
          <View style={styles.achievementText}>
            <Text style={styles.achievementTitle}>EXIF Expert</Text>
            <Text style={styles.achievementDesc}>Processed 50+ photos with professional tools</Text>
          </View>
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Menu</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => handleMenuPress(item.title)}
          >
            <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <Text style={styles.menuText}>{item.title}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.signOutButton}>
        <Ionicons name="log-out" size={20} color="#ef4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: '#9ca3af',
  },
  statsSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  achievementsSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  achievementText: {
    flex: 1,
    marginLeft: 16,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  menuSection: {
    backgroundColor: '#fff',
    marginTop: 8,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  signOutText: {
    fontSize: 16,
    color: '#ef4444',
    marginLeft: 8,
    fontWeight: '600',
  },
});