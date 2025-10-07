const API_BASE_URL = 'https://pic2nav.com/api';

export interface LocationResult {
  location: string;
  confidence: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  details?: {
    address?: string;
    type?: string;
    description?: string;
  };
}

export const analyzeImage = async (imageUri: string): Promise<LocationResult> => {
  try {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);

    const response = await fetch(`${API_BASE_URL}/location-recognition-v2`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};