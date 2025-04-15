import axios from "axios"
import { processAddress, generateAddressAlternatives } from "./address-parser"

// Cache for geocoding results
const geocodeCache = new Map<string, any>()

/**
 * Enhanced geocoding function that tries multiple address formats
 * and uses a more robust approach to finding the correct location
 */
export async function enhancedGeocode(
  rawAddress: string,
  apiKey: string,
  currentLocation?: { latitude: number; longitude: number },
): Promise<any> {
  console.log(`Geocoding address: "${rawAddress}"`)

  // Process the address to improve accuracy
  const processedAddress = processAddress(rawAddress)
  console.log(`Processed address: "${processedAddress}"`)

  // Generate alternative formats to try
  const addressAlternatives = generateAddressAlternatives(processedAddress)
  console.log(`Trying ${addressAlternatives.length} address alternatives`)

  // Try each alternative until we get a good result
  for (const address of addressAlternatives) {
    // Check cache first
    const cacheKey = `${address}_${currentLocation?.latitude || ""}_${currentLocation?.longitude || ""}`
    if (geocodeCache.has(cacheKey)) {
      console.log(`Using cached geocoding result for: "${address}"`)
      return geocodeCache.get(cacheKey)
    }

    try {
      console.log(`Geocoding address: "${address}"`)

      // Prepare geocoding parameters
      const params: any = {
        address: address,
        key: apiKey,
      }

      // Add location bias if current location is available
      if (currentLocation) {
        params.location = `${currentLocation.latitude},${currentLocation.longitude}`
        params.radius = 5000 // 5km radius for location bias
      }

      // Make the geocoding request
      const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
        params,
        timeout: 5000, // 5 second timeout
      })

      // Check if we got any results
      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0]

        // Calculate confidence based on result types and viewport size
        const confidence = calculateConfidence(result, address)

        // If confidence is high enough, use this result
        if (confidence >= 0.7) {
          console.log(`Found high confidence (${confidence.toFixed(2)}) result: ${result.formatted_address}`)

          // Cache the result
          geocodeCache.set(cacheKey, { result, confidence })
          return { result, confidence }
        } else {
          console.log(`Low confidence (${confidence.toFixed(2)}) result: ${result.formatted_address}`)
        }
      } else {
        console.log(`No geocoding results found for: "${address}"`)
      }
    } catch (error) {
      console.warn(`Geocoding failed for: "${address}"`, error)
    }
  }

  // If we get here, we couldn't find a good match
  return null
}

/**
 * Calculate confidence score for a geocoding result
 */
function calculateConfidence(result: any, originalAddress: string, currentLocation?: { latitude: number; longitude: number }): number {
  let confidence = 0.5; // Base confidence

  // Increase confidence based on result types
  if (result.types.includes("street_address")) confidence += 0.2;
  if (result.types.includes("premise")) confidence += 0.15;
  if (result.types.includes("route")) confidence += 0.1;
  
  // Check if result is near current location (if provided)
  if (currentLocation && result.geometry?.location) {
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      result.geometry.location.lat,
      result.geometry.location.lng
    );
    if (distance < 1) confidence += 0.2; // Within 1km
    else if (distance < 5) confidence += 0.1; // Within 5km
  }
  
  // Check address component matches
  const normalizedOriginal = originalAddress.toLowerCase().replace(/[^\w\s]/g, '');
  const normalizedFormatted = result.formatted_address.toLowerCase().replace(/[^\w\s]/g, '');
  if (normalizedFormatted.includes(normalizedOriginal)) confidence += 0.1;
  
  // Penalize results that look like road numbers (e.g., "A232")
  if (/^[A-Z]\d+$/.test(result.formatted_address)) confidence -= 0.3;
  
  return Math.min(1, Math.max(0, confidence)); // Ensure confidence is between 0 and 1
  let confidence = 0.7 // Default confidence

  // Adjust based on result types
  if (result.types) {
    if (result.types.includes("street_address")) {
      confidence += 0.2
    } else if (result.types.includes("premise")) {
      confidence += 0.15
    } else if (result.types.includes("route")) {
      confidence += 0.1
    } else if (result.types.includes("locality")) {
      confidence -= 0.1
    }
  }

  // Adjust based on viewport size (smaller is better)
  if (result.geometry && result.geometry.viewport) {
    const viewport = result.geometry.viewport
    const viewportSize =
      Math.abs(viewport.northeast.lat - viewport.southwest.lat) *
      Math.abs(viewport.northeast.lng - viewport.southwest.lng)

    if (viewportSize < 0.0001) confidence += 0.1
    else if (viewportSize < 0.001) confidence += 0.05
    else if (viewportSize > 0.1) confidence -= 0.1
  }

  // Check if the formatted address contains parts of the original address
  const formattedLower = result.formatted_address.toLowerCase()
  const originalLower = originalAddress.toLowerCase()

  // Extract numbers from both addresses
  const originalNumbers = originalLower.match(/\d+/g) || []
  const formattedNumbers = formattedLower.match(/\d+/g) || []

  // Check if the numbers match
  const numbersMatch = originalNumbers.some((num) => formattedNumbers.includes(num))
  if (numbersMatch) {
    confidence += 0.1
  } else if (originalNumbers.length > 0 && formattedNumbers.length > 0) {
    confidence -= 0.1
  }

  // Special case for London SE1 addresses
  if (
    originalLower.includes("peace court") &&
    originalLower.includes("london") &&
    (originalLower.includes("se1") || originalLower.includes("seistr"))
  ) {
    if (formattedLower.includes("peace court") && formattedLower.includes("london") && formattedLower.includes("se1")) {
      confidence += 0.2
    }
  }

  // Cap confidence between 0 and 1
  return Math.max(0, Math.min(1, confidence))
}

