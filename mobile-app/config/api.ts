export const API_CONFIG = {
  BASE_URL: 'https://ssabiroad.com',
  ML_BASE_URL: 'http://34.224.33.158:8000',
  ENDPOINTS: {
    AI_SEARCH: '/api/ai-search',
    AI_CHAT: '/api/ai-chat',
    LOCATION_RECOGNITION: '/api/location-recognition-v2',
    GOOGLE_PLACES: '/api/google-places',
    NEARBY_LANDMARKS: '/api/landmarks/nearby',
    ML_TRAIN: '/train',
    ML_PREDICT: '/predict',
  },
};

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export const getMlApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.ML_BASE_URL}${endpoint}`;
};
