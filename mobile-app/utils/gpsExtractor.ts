import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export interface GPSData {
  latitude: number;
  longitude: number;
  hasGPS: boolean;
}

export const extractGPSFromDocumentPicker = async (imageUri: string): Promise<GPSData> => {
  try {
    // Use ImagePicker to re-read the file with EXIF
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1.0,
      exif: true,
      allowsEditing: false,
      selectionLimit: 1,
    });
    
    // This is a workaround - we can't extract EXIF from DocumentPicker directly
    // So we return false and let user manually enter address
    console.log('DocumentPicker files need manual address entry');
    return { latitude: 0, longitude: 0, hasGPS: false };
  } catch (error) {
    console.error('Error extracting GPS from document:', error);
    return { latitude: 0, longitude: 0, hasGPS: false };
  }
};

export const checkImageHasGPS = (imagePickerResult: ImagePicker.ImagePickerAsset): GPSData => {
  console.log('EXIF Data:', JSON.stringify(imagePickerResult.exif, null, 2));
  
  if (imagePickerResult.exif) {
    const exif = imagePickerResult.exif;
    
    // Try different GPS coordinate formats
    let latitude = 0;
    let longitude = 0;
    
    // Format 1: Direct decimal coordinates
    if (exif.GPSLatitude && exif.GPSLongitude && typeof exif.GPSLatitude === 'number') {
      latitude = exif.GPSLatitude;
      longitude = exif.GPSLongitude;
      
      // Apply direction references
      if (exif.GPSLatitudeRef === 'S') latitude = -latitude;
      if (exif.GPSLongitudeRef === 'W') longitude = -longitude;
      
      console.log('GPS Format 1 - Decimal:', { latitude, longitude });
    }
    // Format 2: DMS array format
    else if (Array.isArray(exif.GPSLatitude) && Array.isArray(exif.GPSLongitude)) {
      latitude = convertDMSToDD(exif.GPSLatitude, exif.GPSLatitudeRef);
      longitude = convertDMSToDD(exif.GPSLongitude, exif.GPSLongitudeRef);
      
      console.log('GPS Format 2 - DMS:', { latitude, longitude });
    }
    // Format 3: Check for other common GPS fields
    else if (exif.GPS) {
      const gps = exif.GPS;
      if (gps.Latitude && gps.Longitude) {
        latitude = parseFloat(gps.Latitude);
        longitude = parseFloat(gps.Longitude);
        
        console.log('GPS Format 3 - GPS object:', { latitude, longitude });
      }
    }
    
    // Validate coordinates
    if (!isNaN(latitude) && !isNaN(longitude) && latitude !== 0 && longitude !== 0) {
      console.log('Valid GPS found:', { latitude, longitude });
      return { latitude, longitude, hasGPS: true };
    }
  }
  
  console.log('No valid GPS data found');
  return { latitude: 0, longitude: 0, hasGPS: false };
};

const convertDMSToDD = (dms: number[], ref?: string): number => {
  if (!dms || dms.length < 1) return 0;
  
  let dd = 0;
  
  // Handle different DMS formats
  if (dms.length >= 3) {
    // [degrees, minutes, seconds]
    dd = dms[0] + (dms[1] || 0) / 60 + (dms[2] || 0) / 3600;
  } else if (dms.length === 1) {
    // Already in decimal format
    dd = dms[0];
  }
  
  // Apply direction reference
  if (ref === 'S' || ref === 'W') {
    dd = dd * -1;
  }
  
  return dd;
};