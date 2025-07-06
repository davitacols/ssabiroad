// Configuration for enhanced location recognition

export const AI_CONFIG = {
  // Vision API settings (optimized for speed and accuracy)
  vision: {
    timeout: 5000, // 5 seconds for comprehensive analysis
    maxResults: {
      labels: 10,
      landmarks: 5,
      logos: 5,
      texts: 20
    },
    features: [
      'TEXT_DETECTION',
      'LANDMARK_DETECTION', 
      'LABEL_DETECTION',
      'LOGO_DETECTION'
    ],
    // Confidence thresholds for different detection types
    confidenceThresholds: {
      landmark: 0.7,
      logo: 0.5,
      business: 0.6,
      address: 0.5
    }
  },
  
  // Claude AI settings (optimized)
  claude: {
    model: 'claude-3-haiku-20240307',
    maxTokens: 200,
    timeout: 8000 // 8 seconds
  },
  
  // Places API settings (optimized)
  places: {
    timeout: 3000, // 3 seconds
    fields: 'name,formatted_address,geometry,place_id'
  },
  
  // Confidence thresholds for different recognition methods
  confidence: {
    exifGPS: 0.95,
    exifBinary: 0.9,
    aiLandmark: 0.8,
    aiLogo: 0.75,
    aiTextBusiness: 0.7,
    aiTextAddress: 0.65,
    claudeAI: 0.6,
    deviceFallback: 0.4,
    minimum: 0.3
  },
  
  // Cache settings
  cache: {
    ttl: 300, // 5 minutes
    visionResults: 600, // 10 minutes for vision results
    placeDetails: 1800 // 30 minutes for place details
  }
};

// Helper function to get config values
export function getAIConfig(path: string, defaultValue?: any) {
  const keys = path.split('.');
  let value = AI_CONFIG;
  
  for (const key of keys) {
    value = value[key as keyof typeof value];
    if (value === undefined) {
      return defaultValue;
    }
  }
  
  return value;
}