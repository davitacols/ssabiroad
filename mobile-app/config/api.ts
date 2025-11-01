export const API_CONFIG = {
  BASE_URL: 'https://ssabiroad.vercel.app',
  ENDPOINTS: {
    AI_SEARCH: '/api/ai-search',
    AI_CHAT: '/api/ai-chat',
    LOCATION_RECOGNITION: '/api/location-recognition-v2',
    GOOGLE_PLACES: '/api/google-places',
  },
};

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
