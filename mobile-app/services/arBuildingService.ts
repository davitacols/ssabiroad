import axios from 'axios';
import * as Location from 'expo-location';

const API_BASE_URL = 'https://ssabiroad.vercel.app/api';

export interface BuildingAnalysis {
  id: string;
  name: string;
  address: string;
  architecturalStyle: string;
  yearBuilt: number;
  height: number;
  floors: number;
  materials: string[];
  historicalSignificance: string;
  propertyValue: number;
  energyRating: string;
  structuralCondition: string;
  latitude: number;
  longitude: number;
  photos: string[];
  communityNotes: CommunityNote[];
}

export interface CommunityNote {
  id: string;
  userId: string;
  userName: string;
  note: string;
  rating: number;
  timestamp: string;
  location: { x: number; y: number };
}

export interface ARMeasurement {
  id: string;
  buildingId: string;
  type: 'height' | 'width' | 'distance';
  value: number;
  unit: 'meters' | 'feet';
  timestamp: string;
}

class ARBuildingService {
  async analyzeBuilding(imageUri: string, location: Location.LocationObjectCoords): Promise<BuildingAnalysis> {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'building.jpg',
      } as any);
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());

      const response = await axios.post(`${API_BASE_URL}/ar-building-analysis`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return response.data;
    } catch (error) {
      console.error('Building analysis error:', error);
      throw error;
    }
  }

  async getNearbyBuildings(latitude: number, longitude: number, radius: number = 5): Promise<BuildingAnalysis[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/nearby-buildings`, {
        params: { latitude, longitude, radius },
      });
      return response.data.buildings;
    } catch (error) {
      console.error('Nearby buildings error:', error);
      return [];
    }
  }

  async getBuildingDetails(buildingId: string): Promise<BuildingAnalysis> {
    try {
      const response = await axios.get(`${API_BASE_URL}/building/${buildingId}`);
      return response.data;
    } catch (error) {
      console.error('Building details error:', error);
      throw error;
    }
  }

  async addCommunityNote(buildingId: string, note: string, rating: number, location: { x: number; y: number }): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/building/${buildingId}/notes`, {
        note,
        rating,
        location,
      });
    } catch (error) {
      console.error('Add note error:', error);
      throw error;
    }
  }

  async saveMeasurement(measurement: Omit<ARMeasurement, 'id' | 'timestamp'>): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/ar-measurements`, measurement);
    } catch (error) {
      console.error('Save measurement error:', error);
      throw error;
    }
  }

  async compareBuildings(buildingIds: string[]): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/building-comparison`, {
        buildingIds,
      });
      return response.data;
    } catch (error) {
      console.error('Building comparison error:', error);
      throw error;
    }
  }

  async generateReport(buildingId: string, includePhotos: boolean = true): Promise<string> {
    try {
      const response = await axios.post(`${API_BASE_URL}/building-report`, {
        buildingId,
        includePhotos,
      });
      return response.data.reportUrl;
    } catch (error) {
      console.error('Generate report error:', error);
      throw error;
    }
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }

  estimateBuildingHeight(imageHeight: number, distance: number, cameraAngle: number): number {
    const heightInMeters = (imageHeight * distance * Math.tan(cameraAngle * Math.PI / 180)) / 1000;
    return Math.round(heightInMeters * 10) / 10;
  }
}

export default new ARBuildingService();
