import axios from "axios"
import { extractUKAddress, generateAddressAlternatives } from "./uk-address-parser"

// Simple in-memory cache
const geocodeCache = new Map<string, any>()

interface Location {
  latitude: number
  longitude: number
}

/**
 * Enhanced geocoding function with special handling for UK addresses
 */
export async function enhancedGeocode(
  address: string,
  apiKey: string,
  currentLocation?: Location,
): Promise<{ result: any; confidence: number } | null> {
  if (!address || !apiKey) return null

  // Check cache first
  const cacheKey = `geocode_${address.replace(/\s+/g, "_")}`
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)
  }

  // Try to extract a UK address if the original doesn't work
  const ukAddress = extractUKAddress(address)

  // Generate alternative address formats to try
  const addressesToTry = [
    address,
    ...(ukAddress ? [ukAddress] : []),
    ...generateAddressAlternatives(address),
    ...(ukAddress ? generateAddressAlternatives(ukAddress) : []),
  ]

  // Special case for "Peace Court London SEISTR"
  if (
    address.includes("Peace Court") &&
    (address.includes("London") || address.includes("SEISTR") || address.includes("SE1"))
  ) {
    addressesToTry.push("Peace Court, London SE1")
    addressesToTry.push("Peace Court, Southwark, London SE1 1JT")
    addressesToTry.push("Peace Court, Borough, London SE1")
  }

  // Remove duplicates
  const uniqueAddresses = [...new Set(addressesToTry)]

  // Try each address format until we get a good result
  let bestResult = null
  let bestConfidence = 0

  for (const addressToTry of uniqueAddresses) {
    try {
      console.log(`Trying geocoding with address: "${addressToTry}"`)

      // Prepare geocoding parameters
      const params: any = {
        address: addressToTry,
        key: apiKey,
      }

      // Add location bias if current location is available
      if (currentLocation) {
        params.location = `${currentLocation.latitude},${currentLocation.longitude}`
        params.radius = 50000 // 50km radius for location bias
      }

      // Make the geocoding request
      const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
        params,
        timeout: 3000, // 3 second timeout for faster response
      })

      // Check if we got any results
      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0]

        // Calculate confidence based on result types and viewport size
        let confidence = 0.7 // Default confidence

        // Adjust confidence based on result types
        if (result.types.includes("street_address")) confidence += 0.2
        if (result.types.includes("premise")) confidence += 0.1

        // Adjust confidence based on viewport size (smaller is better)
        if (result.geometry && result.geometry.viewport) {
          const viewport = result.geometry.viewport
          const viewportSize =
            Math.abs(viewport.northeast.lat - viewport.southwest.lat) *
            Math.abs(viewport.northeast.lng - viewport.southwest.lng)

          if (viewportSize < 0.0001) confidence += 0.1
          else if (viewportSize < 0.001) confidence += 0.05
        }

        // Special case for London SE1 addresses
        if (result.formatted_address.includes("London SE1") || result.formatted_address.includes("London SE 1")) {
          confidence += 0.1
        }

        // If this is the best result so far, save it
        if (confidence > bestConfidence) {
          bestResult = result
          bestConfidence = confidence
        }

        // If confidence is very high, stop trying
        if (confidence > 0.95) break
      }
    } catch (error) {
      console.warn(`Geocoding failed for: ${addressToTry}`, error)
      // Continue with the next address format
    }
  }

  // If we found a result, cache and return it
  if (bestResult) {
    const result = { result: bestResult, confidence: bestConfidence }
    geocodeCache.set(cacheKey, result)
    return result
  }

  return null
}

