/**
 * GPS Utilities for Image Processing
 * Helps extract and validate GPS data from images
 */

/**
 * Extract GPS coordinates from EXIF data
 * @param {Object} exifData - EXIF data from image
 * @returns {Object|null} GPS coordinates or null if not found
 */
export function extractGPSFromExif(exifData) {
  if (!exifData) {
    return null;
  }

  let lat = null;
  let lng = null;

  // Try different GPS coordinate formats
  if (exifData.GPSLatitude && exifData.GPSLongitude) {
    lat = exifData.GPSLatitude;
    lng = exifData.GPSLongitude;
  }
  // Check for GPS info object
  else if (exifData.GPS) {
    lat = exifData.GPS.GPSLatitude;
    lng = exifData.GPS.GPSLongitude;
  }
  // Check for location object (iOS format)
  else if (exifData.location) {
    lat = exifData.location.latitude;
    lng = exifData.location.longitude;
  }

  // Validate coordinates
  if (lat && lng && 
      typeof lat === 'number' && typeof lng === 'number' && 
      lat !== 0 && lng !== 0 && 
      lat >= -90 && lat <= 90 && 
      lng >= -180 && lng <= 180) {
    return { latitude: lat, longitude: lng };
  }

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
 * Format GPS coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} Formatted coordinates
 */
export function formatCoordinates(lat, lng) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Get GPS data summary for debugging
 * @param {Object} exifData - EXIF data from image
 * @returns {Object} GPS data summary
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
      GPS: exifData.GPS
    }
  };
}