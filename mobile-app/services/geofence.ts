import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';

const LOCATION_TASK = 'background-location-task';
const API_URL = 'https://ssabiroad.vercel.app/api/geofence';

const getUserId = async () => {
  let userId = await SecureStore.getItemAsync('deviceUserId');
  if (!userId) {
    userId = Application.androidId || `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await SecureStore.setItemAsync('deviceUserId', userId);
  }
  return userId;
};

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Background task for location monitoring
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('Location task error:', error);
    return;
  }

  if (data.locations) {
    const location = data.locations[0];
    try {
      const userId = await getUserId();
      const response = await fetch(
        `${API_URL}?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}&userId=${userId}`
      );
      const result = await response.json();
      
      if (result.alerts && result.alerts.length > 0) {
        for (const alert of result.alerts) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: alert.type === 'enter' ? '🎯 Arrived' : '👋 Departed',
              body: alert.message,
              sound: true,
              badge: 1,
            },
            trigger: null,
          });
        }
      }
    } catch (err) {
      console.error('Background location check error:', err);
    }
  }
});

export const GeofenceService = {
  async requestPermissions() {
    const { status: notifStatus } = await Notifications.requestPermissionsAsync();
    const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    
    return notifStatus === 'granted' && locStatus === 'granted' && bgStatus === 'granted';
  },

  async createGeofence(name: string, latitude: number, longitude: number, radius: number) {
    try {
      const userId = await getUserId();
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          latitude,
          longitude,
          radius,
          userId,
          notifyOnEnter: true,
          notifyOnExit: true,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('API Error:', response.status, text);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Create geofence error:', error);
      throw error;
    }
  },

  async checkLocation(latitude: number, longitude: number) {
    try {
      const userId = await getUserId();
      
      const response = await fetch(
        `${API_URL}?latitude=${latitude}&longitude=${longitude}&userId=${userId}`
      );

      const data = await response.json();
      
      if (data.alerts && data.alerts.length > 0) {
        for (const alert of data.alerts) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: alert.type === 'enter' ? '🎯 Arrived' : '👋 Departed',
              body: alert.message,
              sound: true,
              badge: 1,
            },
            trigger: null,
          });
        }
      }

      return data;
    } catch (error) {
      console.error('Check location error:', error);
      throw error;
    }
  },

  async deleteGeofence(id: string) {
    try {
      await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Delete geofence error:', error);
      throw error;
    }
  },

  async startMonitoring() {
    const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
    if (bgStatus !== 'granted') {
      throw new Error('Background location permission required');
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 60000,
      distanceInterval: 100,
      foregroundService: {
        notificationTitle: 'Location Monitoring',
        notificationBody: 'Tracking your location for geofence alerts',
      },
    });
  },

  async stopMonitoring() {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    }
  },

  async isMonitoring() {
    return await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
  },
};
