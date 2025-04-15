/**
 * Contains validation utilities for location recognition
 */

/**
 * Validates if a string looks like a road number (e.g., "A232")
 */
export function isRoadNumber(text: string): boolean {
  if (!text) return false;
  return /^[A-Z]\d+$/.test(text.trim());
}

/**
 * Validates venue name to ensure it's not a road/highway identifier
 */
export function isValidVenueName(name: string): boolean {
  if (!name) return false;
  
  // Check for common road/highway patterns
  if (isRoadNumber(name)) return false;
  
  // Check for common road/highway prefixes
  const roadPrefixes = ['A', 'B', 'M', 'E'];
  if (roadPrefixes.some(prefix => 
    name.startsWith(prefix) && /^\d+/.test(name.substring(1))
  )) {
    return false;
  }

  return true;
}

/**
 * Calculate venue confidence score based on available data
 */
export function calculateVenueConfidence(venueData: any): number {
  let confidence = 0.5; // Base confidence
  
  // Check for essential venue properties
  if (venueData.name && isValidVenueName(venueData.name)) confidence += 0.1;
  if (venueData.category) confidence += 0.1;
  if (venueData.type) confidence += 0.1;
  if (venueData.addressdetails) confidence += 0.1;
  if (venueData.extratags) confidence += 0.1;
  
  // Penalize if it looks like a road
  if (isRoadNumber(venueData.name)) confidence -= 0.3;
  
  return Math.min(1, Math.max(0, confidence));
}