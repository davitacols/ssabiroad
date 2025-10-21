import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://ssabiroad.vercel.app/api';

export class LocationService {
  private static async getAuthToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('authToken');
  }

  private static async makeRequest(endpoint: string, options: any = {}) {
    const token = await this.getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    return axios({
      url: `${API_BASE_URL}${endpoint}`,
      headers,
      ...options,
    });
  }

  static async analyzeLocation(imageUri: string, coordinates: { latitude: number; longitude: number }) {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'building.jpg',
    } as any);
    formData.append('latitude', coordinates.latitude.toString());
    formData.append('longitude', coordinates.longitude.toString());

    const response = await this.makeRequest('/location-recognition-v2', {
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  static async saveDetection(analysisData: any) {
    const response = await this.makeRequest('/save-detection', {
      method: 'POST',
      data: analysisData,
    });

    return response.data;
  }

  static async getRecentLocations() {
    const response = await this.makeRequest('/recent-locations');
    return response.data.locations || [];
  }

  static async getSavedLocations() {
    const response = await this.makeRequest('/saved-locations');
    return response.data.locations || [];
  }

  static async getUserStats() {
    const response = await this.makeRequest('/usage-stats');
    return response.data.stats || {
      totalDetections: 0,
      savedLocations: 0,
      buildingsAnalyzed: 0,
      accuracyScore: 0,
    };
  }

  static async searchNearbyPlaces(latitude: number, longitude: number, radius: number = 1000) {
    const response = await this.makeRequest('/nearby-places', {
      method: 'POST',
      data: { latitude, longitude, radius },
    });

    return response.data.places || [];
  }

  static async getLocationDetails(locationId: string) {
    const response = await this.makeRequest(`/locations/${locationId}`);
    return response.data;
  }
}