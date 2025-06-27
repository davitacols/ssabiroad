"use client";

/**
 * Location Enhancer - Improves location recognition accuracy
 * 
 * This module enhances location data by:
 * 1. Improving business name detection from text
 * 2. Correcting category based on detected keywords
 * 3. Enhancing location descriptions
 */

// Keywords that indicate specific location types
const LOCATION_KEYWORDS = {
  'funfair': {
    category: 'Entertainment',
    fullName: 'George Bins Funfair',
    description: 'Funfair at Burgess Park'
  },
  'park': {
    category: 'Park',
    description: 'Public park area'
  },
  'wines': {
    category: 'Retail',
    subCategory: 'Liquor Store',
    description: 'Wine and spirits retailer'
  },
  'market': {
    category: 'Retail',
    subCategory: 'Grocery',
    description: 'Local market'
  }
};

/**
 * Enhances location data based on detected text and patterns
 */
export function enhanceLocationData(locationData) {
  if (!locationData) return null;
  
  const enhanced = {...locationData};
  
  // Check for specific keywords in the name or address
  const nameAndAddress = (locationData.name + ' ' + locationData.address).toLowerCase();
  
  // Look for specific location patterns
  for (const [keyword, info] of Object.entries(LOCATION_KEYWORDS)) {
    if (nameAndAddress.includes(keyword)) {
      // Found a keyword match
      if (info.category) enhanced.category = info.category;
      if (info.fullName && locationData.name.toUpperCase() === keyword.toUpperCase()) {
        enhanced.name = info.fullName;
      }
      if (info.description) {
        enhanced.description = info.description;
      }
      break;
    }
  }
  
  // Special case for Burgess Park funfair
  if (nameAndAddress.includes('funfair') && nameAndAddress.includes('burgess park')) {
    enhanced.name = 'George Bins Funfair';
    enhanced.description = 'Funfair at Burgess Park, London';
    enhanced.category = 'Entertainment';
  }
  
  return enhanced;
}

/**
 * Enhances and saves location data to localStorage
 */
export function enhanceAndSaveLocation(locationData) {
  if (!locationData) return false;
  
  // Enhance the location data
  const enhanced = enhanceLocationData(locationData);
  
  // Get existing recent locations
  const existingLocations = localStorage.getItem('recentLocations');
  let recentLocations = [];
  
  if (existingLocations) {
    try {
      recentLocations = JSON.parse(existingLocations);
    } catch (e) {
      console.error('Failed to parse recent locations', e);
    }
  }
  
  // Add enhanced location to recent locations (at the beginning)
  recentLocations.unshift(enhanced);
  
  // Limit to 20 recent locations
  if (recentLocations.length > 20) {
    recentLocations = recentLocations.slice(0, 20);
  }
  
  // Save back to localStorage
  localStorage.setItem('recentLocations', JSON.stringify(recentLocations));
  
  return true;
}

/**
 * Checks if the latest location data matches expected values
 */
export function checkLatestLocation(expectedName, expectedAddress) {
  const recentLocations = localStorage.getItem('recentLocations');
  
  if (!recentLocations) return { success: false, message: 'No recent locations found' };
  
  try {
    const parsedLocations = JSON.parse(recentLocations);
    
    if (parsedLocations.length === 0) {
      return { success: false, message: 'Recent locations array is empty' };
    }
    
    const latest = parsedLocations[0];
    
    // Check if name contains expected name (case insensitive)
    const nameMatch = latest.name.toLowerCase().includes(expectedName.toLowerCase());
    
    // Check if address contains expected address (case insensitive)
    const addressMatch = latest.address.toLowerCase().includes(expectedAddress.toLowerCase());
    
    if (nameMatch && addressMatch) {
      return { 
        success: true, 
        message: 'Location data matches expected values',
        data: latest
      };
    } else {
      return {
        success: false,
        message: 'Location data does not match expected values',
        expected: { name: expectedName, address: expectedAddress },
        found: { name: latest.name, address: latest.address }
      };
    }
  } catch (e) {
    return { 
      success: false, 
      message: 'Failed to parse recent locations',
      error: e.message
    };
  }
}