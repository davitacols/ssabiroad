import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuBar from '../components/MenuBar';

interface Activity {
  id: string;
  title: string;
  subtitle: string;
  timestamp: number;
  route: string;
}

export default function ActivityScreen() {
  const router = useRouter();
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  useEffect(() => {
    loadRecentActivities();
  }, []);

  const loadRecentActivities = async () => {
    try {
      const stored = await AsyncStorage.getItem('recentActivities');
      if (stored) {
        setRecentActivities(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading activities:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const clearAllActivities = async () => {
    try {
      await AsyncStorage.removeItem('recentActivities');
      setRecentActivities([]);
    } catch (error) {
      console.log('Error clearing activities:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity</Text>
        {recentActivities.length > 0 && (
          <TouchableOpacity onPress={clearAllActivities} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {recentActivities.length > 0 ? (
          <View style={styles.activityList}>
            {recentActivities.map((activity) => (
              <TouchableOpacity 
                key={activity.id} 
                style={styles.activityItem}
                onPress={() => router.push(activity.route as any)}
              >
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                  <Text style={styles.activityTime}>{formatTime(activity.timestamp)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No recent activity</Text>
            <Text style={styles.emptySubtitle}>Start exploring to see your activity here</Text>
          </View>
        )}
      </ScrollView>
      
      <MenuBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    marginRight: 16,
  },
  backText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  clearButton: {},
  clearText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  activityContent: {},
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});