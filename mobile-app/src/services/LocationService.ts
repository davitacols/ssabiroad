const API_BASE_URL = 'https://ssabiroad.vercel.app'; // Your deployed API
// For local testing, use: 'http://10.0.2.2:3000' (Android emulator) or 'http://localhost:3000' (iOS simulator)

export class LocationService {
  static async analyzePhoto(photo: any, location: any) {
    try {
      const formData = new FormData();
      
      // Convert photo to blob with proper MIME type
      const response = await fetch(photo.uri);
      const blob = await response.blob();
      
      formData.append('image', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);
      formData.append('analyzeLandmarks', 'true');
      
      // Don't send location data to force image analysis
      // if (location) {
      //   formData.append('latitude', location.coords.latitude.toString());
      //   formData.append('longitude', location.coords.longitude.toString());
      // }

      console.log('Making API request to:', `${API_BASE_URL}/api/location-recognition-v2`);
      
      const apiResponse = await fetch(`${API_BASE_URL}/api/location-recognition-v2`, {
        method: 'POST',
        body: formData,
        headers: {
          'User-Agent': 'Pic2Nav-Mobile/1.0',
        },
      });
      
      console.log('API Response status:', apiResponse.status);

      if (!apiResponse.ok) {
        throw new Error(`HTTP ${apiResponse.status}`);
      }

      const result = await apiResponse.json();
      console.log('API Response:', result);
      
      // Save to history
      if (result.success) {
        await this.saveToHistory(result);
      }
      
      return result;
    } catch (error) {
      console.error('Location analysis failed:', error);
      console.error('Error details:', error.message);
      
      // Return a user-friendly error
      return {
        success: false,
        error: 'Network connection failed. Please check your internet connection and try again.',
        method: 'network-error'
      };
    }
  }

  static async saveToHistory(result: any) {
    try {
      await fetch(`${API_BASE_URL}/api/save-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: result.name,
          address: result.address,
          latitude: result.location?.latitude,
          longitude: result.location?.longitude,
          confidence: result.confidence,
          method: result.method,
          description: result.description,
        }),
      });
    } catch (error) {
      console.error('Failed to save to history:', error);
    }
  }

  static async getHistory() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recent-locations?limit=50`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch history:', error);
      return { locations: [] };
    }
  }
}