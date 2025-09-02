import { Alert } from 'react-native';
import { LocationCache } from './LocationCache';

export class OfflineManager {
  static isOnline = true;
  static listeners = new Set();
  static pendingUploads = [];

  static init() {
    // Simple online detection - can be enhanced later
    this.isOnline = true;
    this.notifyListeners(this.isOnline);
  }

  static addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  static notifyListeners(isOnline) {
    this.listeners.forEach(callback => callback(isOnline));
  }

  static async handleOfflineRequest(imageUri, imageData) {
    // Store request for later processing
    const request = {
      id: Date.now().toString(),
      imageUri,
      imageData,
      timestamp: Date.now(),
      status: 'pending'
    };

    this.pendingUploads.push(request);
    
    // Try to extract GPS from EXIF if available
    if (imageData?.exif) {
      const { extractGPSFromExif } = require('../utils/gpsUtils');
      const gpsData = extractGPSFromExif(imageData.exif);
      
      if (gpsData) {
        // We have GPS data, can provide immediate result
        const offlineResult = {
          success: true,
          name: 'Location (Offline)',
          address: `${gpsData.latitude.toFixed(6)}, ${gpsData.longitude.toFixed(6)}`,
          location: gpsData,
          confidence: 0.9,
          isOffline: true,
          category: 'GPS Location'
        };

        // Cache the result
        const imageHash = LocationCache.generateImageHash(imageUri);
        await LocationCache.cacheLocation(imageHash, offlineResult);
        await LocationCache.addToHistory(offlineResult);

        return offlineResult;
      }
    }

    // No GPS data available
    return {
      success: false,
      error: 'No internet connection. GPS data not found in image.',
      isOffline: true,
      canRetryOnline: true
    };
  }

  static async processPendingUploads() {
    if (!this.isOnline || this.pendingUploads.length === 0) {
      return;
    }

    console.log(`Processing ${this.pendingUploads.length} pending uploads...`);

    const toProcess = [...this.pendingUploads];
    this.pendingUploads = [];

    for (const request of toProcess) {
      try {
        // Attempt to process the request
        const result = await this.retryRequest(request);
        
        if (result.success) {
          // Update cache and history with online result
          const imageHash = LocationCache.generateImageHash(request.imageUri);
          await LocationCache.cacheLocation(imageHash, result);
          
          // Update history entry if it exists
          const history = await LocationCache.getHistory();
          const existingIndex = history.findIndex(item => 
            item.isOffline && Math.abs(item.timestamp - request.timestamp) < 5000
          );
          
          if (existingIndex >= 0) {
            history[existingIndex] = { ...result, timestamp: request.timestamp };
            await LocationCache.clearHistory();
            for (const item of history) {
              await LocationCache.addToHistory(item);
            }
          }
        } else {
          // Re-queue failed requests
          this.pendingUploads.push({ ...request, retryCount: (request.retryCount || 0) + 1 });
        }
      } catch (error) {
        console.error('Failed to process pending upload:', error);
        // Re-queue with retry count
        if ((request.retryCount || 0) < 3) {
          this.pendingUploads.push({ ...request, retryCount: (request.retryCount || 0) + 1 });
        }
      }
    }

    if (this.pendingUploads.length > 0) {
      console.log(`${this.pendingUploads.length} uploads still pending`);
    }
  }

  static async retryRequest(request) {
    // Simulate the original API request
    const formData = new FormData();
    formData.append('image', {
      uri: request.imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    });

    if (request.imageData?.exif) {
      const { extractGPSFromExif } = require('../utils/gpsUtils');
      const gpsData = extractGPSFromExif(request.imageData.exif);
      
      if (gpsData) {
        formData.append('latitude', gpsData.latitude.toString());
        formData.append('longitude', gpsData.longitude.toString());
        formData.append('hasImageGPS', 'true');
      }
    }

    const response = await fetch('https://www.pic2nav.com/api/location-recognition-v2', {
      method: 'POST',
      body: formData,
      headers: {
        'User-Agent': 'Pic2Nav-Mobile/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  static showOfflineAlert() {
    Alert.alert(
      'No Internet Connection',
      'You are currently offline. Some features may be limited. The app will automatically sync when connection is restored.',
      [{ text: 'OK' }]
    );
  }

  static getPendingCount() {
    return this.pendingUploads.length;
  }

  static clearPendingUploads() {
    this.pendingUploads = [];
  }
}