import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as SecureStore from 'expo-secure-store';

const GEOFENCE_TASK = 'background-geofence-task';
const API_URL = 'https://pic2nav.com/api/geofence';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Background task for geofence monitoring
TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('Geofence task error:', error);
    return;
  }

  if (data.eventType === Location.GeofencingEventType.Enter) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Location Alert',
        body: `You entered ${data.region.identifier}`,
      },
      trigger: null,
    });
  } else if (data.eventType === Location.GeofencingEventType.Exit) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Location Alert',
        body: `You left ${data.region.identifier}`,
      },
      trigger: null,
    });
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
      const userId = await SecureStore.getItemAsync('userId') || 'anonymous';
      
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
      
      if (data.success) {
        // Start monitoring
        await Location.startGeofencingAsync(GEOFENCE_TASK, [{
          identifier: data.geofence.id,
          latitude,
          longitude,
          radius,
          notifyOnEnter: true,
          notifyOnExit: true,
        }]);
      }

      return data;
    } catch (error) {
      console.error('Create geofence error:', error);
      throw error;
    }
  },

  async checkLocation(latitude: number, longitude: number) {
    try {
      const userId = await SecureStore.getItemAsync('userId') || 'anonymous';
      
      const response = await fetch(
        `${API_URL}?latitude=${latitude}&longitude=${longitude}&userId=${userId}`
      );

      const data = await response.json();
      
      // Show notifications for alerts
      if (data.alerts && data.alerts.length > 0) {
        for (const alert of data.alerts) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: alert.type === 'enter' ? '📍 Entered Location' : '🚶 Left Location',
              body: alert.message,
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
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
    } catch (error) {
      console.error('Delete geofence error:', error);
      throw error;
    }
  },

  async startMonitoring() {
    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      throw new Error('Permissions not granted');
    }

    // Start location updates
    await Location.startLocationUpdatesAsync(GEOFENCE_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 60000, // Check every minute
      distanceInterval: 100, // Or every 100 meters
    });
  },

  async stopMonitoring() {
    await Location.stopLocationUpdatesAsync(GEOFENCE_TASK);
  },
};
