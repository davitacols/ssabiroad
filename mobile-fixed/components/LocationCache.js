import * as SecureStore from 'expo-secure-store';

export class LocationCache {
  static CACHE_KEY = 'location_cache';
  static HISTORY_KEY = 'location_history';
  static MAX_CACHE_SIZE = 100;
  static CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  static async getCachedLocation(imageHash) {
    try {
      const cacheData = await SecureStore.getItemAsync(this.CACHE_KEY);
      if (!cacheData) return null;

      const cache = JSON.parse(cacheData);
      const cached = cache[imageHash];
      
      if (!cached) return null;
      
      // Check if cache is expired
      if (Date.now() - cached.timestamp > this.CACHE_EXPIRY) {
        delete cache[imageHash];
        await SecureStore.setItemAsync(this.CACHE_KEY, JSON.stringify(cache));
        return null;
      }
      
      return cached.data;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  static async cacheLocation(imageHash, locationData) {
    try {
      const cacheData = await SecureStore.getItemAsync(this.CACHE_KEY);
      let cache = cacheData ? JSON.parse(cacheData) : {};
      
      // Add new entry
      cache[imageHash] = {
        data: locationData,
        timestamp: Date.now()
      };
      
      // Limit cache size
      const entries = Object.entries(cache);
      if (entries.length > this.MAX_CACHE_SIZE) {
        // Remove oldest entries
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toKeep = entries.slice(-this.MAX_CACHE_SIZE);
        cache = Object.fromEntries(toKeep);
      }
      
      await SecureStore.setItemAsync(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  static async addToHistory(locationData) {
    try {
      const historyData = await SecureStore.getItemAsync(this.HISTORY_KEY);
      let history = historyData ? JSON.parse(historyData) : [];
      
      // Add timestamp and unique ID
      const entry = {
        ...locationData,
        id: Date.now().toString(),
        timestamp: Date.now(),
        date: new Date().toISOString()
      };
      
      // Add to beginning of array
      history.unshift(entry);
      
      // Limit history size
      if (history.length > 50) {
        history = history.slice(0, 50);
      }
      
      await SecureStore.setItemAsync(this.HISTORY_KEY, JSON.stringify(history));
      return entry;
    } catch (error) {
      console.error('History write error:', error);
      return null;
    }
  }

  static async getHistory() {
    try {
      const historyData = await SecureStore.getItemAsync(this.HISTORY_KEY);
      return historyData ? JSON.parse(historyData) : [];
    } catch (error) {
      console.error('History read error:', error);
      return [];
    }
  }

  static async clearHistory() {
    try {
      await SecureStore.deleteItemAsync(this.HISTORY_KEY);
    } catch (error) {
      console.error('History clear error:', error);
    }
  }

  static async clearCache() {
    try {
      await SecureStore.deleteItemAsync(this.CACHE_KEY);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  static generateImageHash(uri) {
    // Simple hash based on URI and timestamp
    return btoa(uri + Date.now()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }
}