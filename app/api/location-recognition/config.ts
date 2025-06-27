/**
 * Configuration for Location Recognition API
 */

export const config = {
  // Performance settings
  performance: {
    // Enable fast mode by default
    fastModeEnabled: true,
    
    // Timeout settings (in milliseconds)
    timeouts: {
      geocoding: 3000,      // 3 seconds for geocoding
      visionAPI: 5000,      // 5 seconds for Vision API
      placesAPI: 3000,      // 3 seconds for Places API
      osmAPI: 2000,         // 2 seconds for OSM API
      weatherAPI: 2000      // 2 seconds for weather API
    },
    
    // Parallel processing settings
    maxParallelRequests: 3, // Maximum number of parallel API requests
    
    // Cache settings
    cacheTTL: {
      results: 86400,       // 24 hours for full results
      geocoding: 604800,    // 1 week for geocoding results
      places: 86400,        // 24 hours for places data
      weather: 3600         // 1 hour for weather data
    }
  },
  
  // Feature toggles
  features: {
    enableWeather: false,   // Disable weather lookup to save time
    enableAirQuality: false, // Disable air quality lookup to save time
    enableNearbyPlaces: false, // Disable nearby places to save time
    enableSceneAnalysis: false, // Disable scene analysis to save time
    enableTextDetection: true, // Keep text detection enabled
    enableBusinessSearch: true  // Keep business search enabled
  }
};

// Helper function to get config value with fallback
export function getConfig<T>(path: string, defaultValue: T): T {
  const parts = path.split('.');
  let current: any = config;
  
  for (const part of parts) {
    if (current[part] === undefined) {
      return defaultValue;
    }
    current = current[part];
  }
  
  return current as T;
}