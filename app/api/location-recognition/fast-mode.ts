/**
 * Fast Mode for Location Recognition
 * 
 * This module provides optimized image analysis for faster location recognition
 * by using simplified detection methods and caching.
 */

import axios from 'axios';
import { createHash } from 'crypto';
import NodeCache from 'node-cache';
import { extractBusinessNameFromText } from './business-search';

// Fast cache with shorter TTL for quick responses
const fastCache = new NodeCache({
  stdTTL: 3600, // 1 hour cache
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false,
  maxKeys: 500,
});

/**
 * Performs a fast analysis of the image text to identify location
 * @param text The extracted text from the image
 * @param apiKey Google Maps API key
 */
export async function fastLocationLookup(text: string, apiKey: string) {
  if (!text) return null;
  
  // Generate a hash of the text for caching
  const textHash = createHash('md5').update(text).digest('hex');
  const cacheKey = `fastLookup_${textHash}`;
  
  // Check cache first
  const cachedResult = fastCache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  // Extract business name - this is optimized to be fast
  const businessName = extractBusinessNameFromText(text);
  if (!businessName) return null;
  
  try {
    // Use Places API directly with minimal fields
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/findplacefromtext/json", {
      params: {
        input: businessName,
        inputtype: "textquery",
        fields: "formatted_address,geometry,name",
        key: apiKey,
      },
      timeout: 3000, // Short timeout for fast response
    });

    if (response.data.candidates && response.data.candidates.length > 0) {
      const place = response.data.candidates[0];
      const result = {
        success: true,
        name: place.name,
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        formattedAddress: place.formatted_address,
      };
      
      // Cache the result
      fastCache.set(cacheKey, result);
      return result;
    }
    
    return null;
  } catch (error) {
    console.error("Error in fast location lookup:", error);
    return null;
  }
}

/**
 * Determines if an image should use fast mode based on size and complexity
 */
export function shouldUseFastMode(imageSize: number, textLength: number): boolean {
  // Use fast mode for larger images or those with lots of text
  return imageSize > 500000 || textLength > 1000;
}