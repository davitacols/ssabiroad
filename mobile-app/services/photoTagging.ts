import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://pic2nav.com/api/photo-tagging-simple';

export const PhotoTaggingService = {
  async processPhoto(photoUri: string, latitude?: number, longitude?: number) {
    try {
      const userId = await SecureStore.getItemAsync('userId') || 'anonymous';
      
      const formData = new FormData();
      formData.append('photo', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);
      formData.append('userId', userId);
      
      if (latitude) formData.append('latitude', latitude.toString());
      if (longitude) formData.append('longitude', longitude.toString());

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Photo tagging error:', error);
      throw error;
    }
  },

  async getPhotoTags(photoId: string) {
    try {
      const response = await fetch(`${API_URL}?photoId=${photoId}`);
      return await response.json();
    } catch (error) {
      console.error('Get photo tags error:', error);
      throw error;
    }
  },

  async getUserPhotos() {
    try {
      const userId = await SecureStore.getItemAsync('userId') || 'anonymous';
      const response = await fetch(`${API_URL}?userId=${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Get user photos error:', error);
      throw error;
    }
  },
};