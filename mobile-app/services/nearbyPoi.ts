const API_URL = 'https://pic2nav.com/api/nearby-poi';

export const NearbyPoiService = {
  async getNearbyPlaces(latitude: number, longitude: number, type: string = 'restaurant', radius: number = 1000) {
    try {
      const response = await fetch(
        `${API_URL}?latitude=${latitude}&longitude=${longitude}&type=${type}&radius=${radius}`
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Nearby POI error:', error);
      throw error;
    }
  },

  getPlaceTypes() {
    return [
      { key: 'restaurant', label: 'Restaurants', icon: '🍽️' },
      { key: 'gas_station', label: 'Gas Stations', icon: '⛽' },
      { key: 'hospital', label: 'Hospitals', icon: '🏥' },
      { key: 'bank', label: 'Banks', icon: '🏦' },
      { key: 'pharmacy', label: 'Pharmacies', icon: '💊' },
      { key: 'shopping_mall', label: 'Shopping', icon: '🛍️' },
      { key: 'tourist_attraction', label: 'Attractions', icon: '🎯' },
      { key: 'lodging', label: 'Hotels', icon: '🏨' },
    ];
  },
};