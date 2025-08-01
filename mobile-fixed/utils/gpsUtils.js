import * as FileSystem from 'expo-file-system';
import ExifParser from 'exif-parser';
import { Buffer } from 'buffer';

/**
 * GPS Utilities for Image Processing
 * Helps extract and validate GPS data from images
 */

/**
 * Extract comprehensive EXIF data from image file
 * @param {string} imageUri - Image file URI
 * @returns {Object|null} Complete EXIF data or null if extraction fails
 */
export async function extractFullExifData(imageUri) {
  try {
    console.log('📸 Extracting full EXIF data from:', imageUri);
    
    // Read image file as base64
    const imageData = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Convert base64 to buffer
    const buffer = Buffer.from(imageData, 'base64');
    
    // Parse EXIF data
    const parser = ExifParser.create(buffer);
    const result = parser.parse();
    
    console.log('📊 Full EXIF data extracted:', {
      hasGPS: !!(result.tags?.GPSLatitude && result.tags?.GPSLongitude),
      gpsData: {
        GPSLatitude: result.tags?.GPSLatitude,
        GPSLongitude: result.tags?.GPSLongitude,
        GPSLatitudeRef: result.tags?.GPSLatitudeRef,
        GPSLongitudeRef: result.tags?.GPSLongitudeRef
      },
      imageSize: result.imageSize,
      tags: Object.keys(result.tags || {})
    });
    
    return result;
  } catch (error) {
    console.log('⚠️ EXIF extraction failed:', error.message);
    return null;
  }
}

/**
 * Extract GPS coordinates from EXIF data
 * @param {Object} exifData - EXIF data from image (from expo-image-picker or exif-parser)
 * @returns {Object|null} GPS coordinates or null if not found
 */
export function extractGPSFromExif(exifData) {
  if (!exifData) {
    return null;
  }

  console.log('🔍 Detailed EXIF GPS analysis:', {
    GPSLatitude: exifData.GPSLatitude,
    GPSLongitude: exifData.GPSLongitude,
    GPSLatitudeRef: exifData.GPSLatitudeRef,
    GPSLongitudeRef: exifData.GPSLongitudeRef,
    GPS: exifData.GPS,
    location: exifData.location,
    gps: exifData.gps,
    tags: exifData.tags,
    allKeys: Object.keys(exifData).filter(k => k.toLowerCase().includes('gps'))
  });

  let lat = null;
  let lng = null;

  // Try exif-parser format first (most comprehensive)
  if (exifData.tags && exifData.tags.GPSLatitude !== undefined && exifData.tags.GPSLongitude !== undefined) {
    lat = exifData.tags.GPSLatitude;
    lng = exifData.tags.GPSLongitude;
    
    console.log('📍 Found GPS coordinates in tags:', { lat, lng, latRef: exifData.tags.GPSLatitudeRef, lngRef: exifData.tags.GPSLongitudeRef });
    
    // Apply GPS reference directions if available
    if (exifData.tags.GPSLatitudeRef === 'S') {
      lat = -Math.abs(lat);
    }
    if (exifData.tags.GPSLongitudeRef === 'W') {
      lng = -Math.abs(lng);
    }
  }
  // Try expo-image-picker format
  else if (exifData.GPSLatitude !== undefined && exifData.GPSLongitude !== undefined) {
    lat = exifData.GPSLatitude;
    lng = exifData.GPSLongitude;
    
    console.log('📍 Found GPS coordinates in EXIF:', { lat, lng, latRef: exifData.GPSLatitudeRef, lngRef: exifData.GPSLongitudeRef });
    
    // Apply GPS reference directions if available
    if (exifData.GPSLatitudeRef === 'S') {
      lat = -Math.abs(lat);
    }
    if (exifData.GPSLongitudeRef === 'W') {
      lng = -Math.abs(lng);
    }
  }
  // Check for GPS info object
  else if (exifData.GPS && exifData.GPS.GPSLatitude !== undefined && exifData.GPS.GPSLongitude !== undefined) {
    lat = exifData.GPS.GPSLatitude;
    lng = exifData.GPS.GPSLongitude;
    
    console.log('📍 Found GPS coordinates in GPS object:', { lat, lng });
    
    // Apply GPS reference directions if available
    if (exifData.GPS.GPSLatitudeRef === 'S') {
      lat = -Math.abs(lat);
    }
    if (exifData.GPS.GPSLongitudeRef === 'W') {
      lng = -Math.abs(lng);
    }
  }
  // Check for location object (iOS format)
  else if (exifData.location && exifData.location.latitude !== undefined && exifData.location.longitude !== undefined) {
    lat = exifData.location.latitude;
    lng = exifData.location.longitude;
    console.log('📍 Found GPS coordinates in location object:', { lat, lng });
  }
  // Check for nested GPS data
  else if (exifData.gps && exifData.gps.latitude !== undefined && exifData.gps.longitude !== undefined) {
    lat = exifData.gps.latitude;
    lng = exifData.gps.longitude;
    console.log('📍 Found GPS coordinates in gps object:', { lat, lng });
  }

  console.log('🧮 Final coordinates before validation:', { lat, lng });

  // Validate coordinates - reject 0,0 and invalid ranges
  if (lat !== null && lng !== null && 
      typeof lat === 'number' && typeof lng === 'number' && 
      !isNaN(lat) && !isNaN(lng) &&
      !(lat === 0 && lng === 0) && // Reject 0,0 coordinates
      Math.abs(lat) > 0.001 && Math.abs(lng) > 0.001 && // Reject near-zero coordinates
      lat >= -90 && lat <= 90 && 
      lng >= -180 && lng <= 180) {
    console.log('✅ Valid GPS coordinates found:', { latitude: lat, longitude: lng });
    return { latitude: lat, longitude: lng };
  }

  console.log('❌ No valid GPS coordinates found');
  return null;
}

/**
 * Check if image has valid GPS data
 * @param {Object} exifData - EXIF data from image
 * @returns {boolean} True if GPS data is available
 */
export function hasGPSData(exifData) {
  return extractGPSFromExif(exifData) !== null;
}

/**
 * Check if image has any EXIF data (not just GPS)
 * @param {Object} exifData - EXIF data from image
 * @returns {boolean} True if any EXIF data is available
 */
export function hasExifData(exifData) {
  if (!exifData) return false;
  
  // Check for any meaningful EXIF data
  const keys = Object.keys(exifData);
  if (keys.length === 0) return false;
  
  // Check for common EXIF fields
  const commonFields = ['Make', 'Model', 'DateTime', 'ImageWidth', 'ImageHeight', 'Orientation'];
  const hasCommonField = commonFields.some(field => 
    exifData[field] !== undefined || 
    (exifData.tags && exifData.tags[field] !== undefined)
  );
  
  return hasCommonField || keys.length > 2; // More than just uri and basic props
}

/**
 * Format GPS coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} Formatted coordinates
 */
export function formatCoordinates(lat, lng) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Convert DMS (Degrees, Minutes, Seconds) to decimal degrees
 * @param {Array} dms - Array of [degrees, minutes, seconds]
 * @param {string} ref - Reference direction (N, S, E, W)
 * @returns {number} Decimal degrees
 */
export function dmsToDecimal(dms, ref) {
  if (!Array.isArray(dms) || dms.length !== 3) {
    return null;
  }
  
  const [degrees, minutes, seconds] = dms;
  let decimal = degrees + (minutes / 60) + (seconds / 3600);
  
  if (ref === 'S' || ref === 'W') {
    decimal = -decimal;
  }
  
  return decimal;
}

/**
 * Get comprehensive EXIF data summary for debugging
 * @param {Object} exifData - EXIF data from image
 * @returns {Object} Complete EXIF data summary
 */
export function getGPSDataSummary(exifData) {
  if (!exifData) {
    return { hasGPS: false, reason: 'No EXIF data' };
  }

  const gps = extractGPSFromExif(exifData);
  
  if (gps) {
    return {
      hasGPS: true,
      coordinates: gps,
      formatted: formatCoordinates(gps.latitude, gps.longitude)
    };
  }

  return {
    hasGPS: false,
    reason: 'No valid GPS coordinates found',
    availableKeys: Object.keys(exifData),
    gpsRelated: {
      GPSLatitude: exifData.GPSLatitude,
      GPSLongitude: exifData.GPSLongitude,
      location: exifData.location,
      GPS: exifData.GPS,
      tags: exifData.tags
    }
  };
}

/**
 * Estimate location based on EXIF metadata when GPS is unavailable
 * @param {Object} exifData - EXIF data from image
 * @returns {Object|null} Estimated location or null
 */
export function estimateLocationFromExif(exifData) {
  if (!exifData) return null;
  
  const tags = exifData.tags || exifData;
  const make = (tags.Make || tags.make || '').toLowerCase();
  const model = (tags.Model || tags.model || '').toLowerCase();
  const software = (tags.Software || tags.software || '').toLowerCase();
  const datetime = tags.DateTime || tags.dateTime || tags.DateTimeOriginal || tags.dateTimeOriginal;
  
  // Samsung Galaxy S9 (SM-G960U) - US model
  if (model.includes('sm-g960u')) {
    console.log('📱 Detected Samsung Galaxy S9 US model - estimating US location');
    return {
      estimatedLocation: {
        latitude: 39.8283, // Center of US
        longitude: -98.5795
      },
      confidence: 0.3,
      method: 'device-model-estimation',
      reason: 'Samsung Galaxy S9 US model suggests US location'
    };
  }
  
  // General Samsung devices with US software
  if (make.includes('samsung') && (software.includes('g960usqu') || model.includes('u'))) {
    console.log('📱 Detected Samsung US device - estimating US location');
    return {
      estimatedLocation: {
        latitude: 39.8283,
        longitude: -98.5795
      },
      confidence: 0.25,
      method: 'device-region-estimation',
      reason: 'Samsung US device model suggests US location'
    };
  }
  
  return null;
}

/**
 * Get comprehensive EXIF metadata summary
 * @param {Object} exifData - EXIF data from image
 * @returns {Object} Complete metadata summary
 */
export function getExifSummary(exifData) {
  if (!exifData) {
    return { hasExif: false, reason: 'No EXIF data' };
  }

  const summary = {
    hasExif: true,
    gps: getGPSDataSummary(exifData),
    camera: {},
    image: {},
    datetime: null,
    locationEstimate: estimateLocationFromExif(exifData)
  };

  // Extract camera information
  const tags = exifData.tags || exifData;
  if (tags) {
    summary.camera = {
      make: tags.Make || tags.make,
      model: tags.Model || tags.model,
      software: tags.Software || tags.software,
      lens: tags.LensModel || tags.lensModel
    };
    
    summary.image = {
      width: tags.ImageWidth || tags.imageWidth || tags.PixelXDimension,
      height: tags.ImageHeight || tags.imageHeight || tags.PixelYDimension,
      orientation: tags.Orientation || tags.orientation,
      colorSpace: tags.ColorSpace || tags.colorSpace
    };
    
    summary.datetime = tags.DateTime || tags.dateTime || tags.DateTimeOriginal || tags.dateTimeOriginal;
  }

  return summary;
}