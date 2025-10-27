import * as FileSystem from 'expo-file-system';

const API_URL = 'https://pic2nav.com/api';

export const analyzeLocation = async (imageUri: string, location: { latitude: number; longitude: number } | null, base64?: string) => {
  console.log('🚀 Starting API request');
  console.log('Image URI:', imageUri);
  console.log('Location:', location);
  
  try {
    // Get file info to verify it exists and has size
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    console.log('File info:', fileInfo);
    
    if (!fileInfo.exists) {
      throw new Error('Image file does not exist');
    }
    
    console.log('Using FileSystem.uploadAsync...');
    console.log('File size:', fileInfo.size, 'bytes');
    
    const parameters: any = {
      analyzeLandmarks: 'true',
    };
    
    // Only add GPS if provided (for fallback)
    if (location) {
      parameters.clientGPSLatitude = location.latitude.toString();
      parameters.clientGPSLongitude = location.longitude.toString();
      console.log('📍 Sending GPS:', location.latitude, location.longitude);
    }
    
    // Always use FileSystem.uploadAsync - it's reliable
    // GPS coordinates are sent via parameters if available
    const response = await FileSystem.uploadAsync(
      `${API_URL}/location-recognition-v2`,
      imageUri,
      {
        fieldName: 'image',
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        parameters,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Pic2Nav-Mobile/1.0',
        },
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const data = JSON.parse(response.body);
    console.log('📦 Full API Response:', JSON.stringify(data, null, 2));
    console.log('✅ Method used:', data.method);
    console.log('✅ Success:', data.success);
    console.log('✅ Error:', data.error);
    console.log('✅ Address:', data.address);
    
    if (response.status !== 200 || !data.success) {
      console.log('⚠️ API returned error or unsuccessful response');
    }
    
    return data;
  } catch (error: any) {
    console.error('❌ API Request failed');
    console.error('Error message:', error.message);
    console.error('Error details:', error);
    throw error;
  }
};

export const getHistory = async () => {
  const response = await axios.get(`${API_URL}/detections`);
  return response.data;
};

export const saveLocation = async (data: any) => {
  const response = await axios.post(`${API_URL}/save-location`, data);
  return response.data;
};
