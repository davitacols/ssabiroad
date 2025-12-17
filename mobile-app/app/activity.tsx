import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuBar from '../components/MenuBar';
import { useTheme, getColors } from '../contexts/ThemeContext';

interface Activity {
  id: string;
  title: string;
  subtitle: string;
  timestamp: number;
  route: string;
}

export default function ActivityScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = getColors(theme);
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Activity</Text>
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
                style={[styles.activityItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(activity.route as any)}
              >
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: colors.text }]}>{activity.title}</Text>
                  <Text style={[styles.activitySubtitle, { color: colors.textSecondary }]}>{activity.subtitle}</Text>
                  <Text style={[styles.activityTime, { color: colors.textTertiary }]}>{formatTime(activity.timestamp)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No recent activity</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Start exploring to see your activity here</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  backText: {
    fontSize: 16,
    fontFamily: 'LeagueSpartan_600SemiBold',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'LeagueSpartan_600SemiBold',
    flex: 1,
  },
  clearButton: {},
  clearText: {
    fontSize: 16,
    color: '#ef4444',
    fontFamily: 'LeagueSpartan_600SemiBold',
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
    borderRadius: 16,
    borderWidth: 1,
  },
  activityContent: {},
  activityTitle: {
    fontSize: 16,
    fontFamily: 'LeagueSpartan_600SemiBold',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'LeagueSpartan_600SemiBold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'LeagueSpartan_600SemiBold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});