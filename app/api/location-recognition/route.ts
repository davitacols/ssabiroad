import { type NextRequest, NextResponse } from "next/server"
import * as vision from "@google-cloud/vision"
import axios from "axios"
import * as exifParser from "exif-parser"
import NodeCache from "node-cache"
import prisma from "@/lib/db" // Import your database client

// Cache configuration
const cache = new NodeCache({ stdTTL: 3600 }) // 1 hour cache

// Interfaces
interface Location {
  latitude: number
  longitude: number
}

interface LocationRecognitionResponse {
  success: boolean
  type: string
  name?: string
  address?: string
  location?: Location
  description?: string
  confidence?: number
  category?: string
  error?: string
  mapUrl?: string
  id?: string // Database ID for the location
  formattedAddress?: string // Add formatted address
  placeId?: string // Add place ID for Google Maps
  addressComponents?: any[] // Add address components
  pointsOfInterest?: string[] // Add nearby points of interest
  photos?: string[] // URLs to photos of the location
  rating?: number // Rating of the location if available
  openingHours?: any // Opening hours if available
}

// Known landmarks for quick recognition - expanded with more details
const KNOWN_LANDMARKS = {
  "Empire State Building": {
    name: "Empire State Building",
    address: "20 W 34th St, New York, NY 10118, USA",
    location: { latitude: 40.748817, longitude: -73.985428 },
    description: "Iconic Art Deco skyscraper in Midtown Manhattan",
    confidence: 0.9,
    category: "landmark",
    pointsOfInterest: ["Macy's Herald Square", "Madison Square Garden", "Bryant Park"],
  },
  "Eiffel Tower": {
    name: "Eiffel Tower",
    address: "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France",
    location: { latitude: 48.8584, longitude: 2.2945 },
    description: "Iconic iron lattice tower on the Champ de Mars in Paris",
    confidence: 0.95,
    category: "landmark",
    pointsOfInterest: ["Champ de Mars", "Trocadéro Gardens", "Seine River"],
  },
  "Great Sphinx of Giza": {
    name: "Great Sphinx of Giza",
    address: "Al Giza Desert, Giza Governorate, Egypt",
    location: { latitude: 29.9753, longitude: 31.1376 },
    description: "Ancient limestone statue with the head of a human and the body of a lion",
    confidence: 0.92,
    category: "landmark",
    pointsOfInterest: ["Great Pyramid of Giza", "Pyramid of Khafre", "Pyramid of Menkaure"],
  },
  "Taj Mahal": {
    name: "Taj Mahal",
    address: "Dharmapuri, Forest Colony, Tajganj, Agra, Uttar Pradesh 282001, India",
    location: { latitude: 27.1751, longitude: 78.0421 },
    description: "Ivory-white marble mausoleum on the south bank of the Yamuna river",
    confidence: 0.93,
    category: "landmark",
    pointsOfInterest: ["Agra Fort", "Mehtab Bagh", "Itimad-ud-Daulah"],
  },
  "Statue of Liberty": {
    name: "Statue of Liberty",
    address: "Liberty Island, New York, NY 10004, USA",
    location: { latitude: 40.6892, longitude: -74.0445 },
    description: "Colossal neoclassical sculpture on Liberty Island in New York Harbor",
    confidence: 0.91,
    category: "landmark",
    pointsOfInterest: ["Ellis Island", "Battery Park", "One World Trade Center"],
  },
  "National Theatre Nigeria": {
    name: "National Theatre Nigeria",
    address: "Iganmu, Lagos, Nigeria",
    location: { latitude: 6.4779, longitude: 3.3664 },
    description: "Cultural landmark and architectural masterpiece in Lagos",
    confidence: 0.85,
    category: "landmark",
    pointsOfInterest: ["National Museum Lagos", "Tafawa Balewa Square", "Freedom Park Lagos"],
  },
}

// Database operations for locations
class LocationDB {
  static async saveLocation(location: LocationRecognitionResponse): Promise<string> {
    try {
      // Check for required fields
      if (!location.name) {
        location.name = "Unknown Location"
      }

      if (!location.address) {
        location.address = "No Address"
      }

      // Prepare the record with only fields that exist in the Prisma schema
      const record = {
        name: location.name,
        address: location.address,
        latitude: location.location?.latitude,
        longitude: location.location?.longitude,
        confidence: location.confidence || null, // Add confidence field which is in the schema
        recognitionType: location.type || "unknown",
        createdAt: new Date(),
        // Remove category field as it's not in the schema
      }

      // Log the record we're about to save
      console.log("🔍 Prepared record before saving:", record)

      // Use the correct model name from your Prisma schema
      const result = await prisma.location.create({ data: record })

      return result.id
    } catch (error: any) {
      console.error("❌ Error saving location to database:", error.message || error)
      throw new Error(`Failed to save location: ${error.message || "Unknown error"}`)
    }
  }

  static async getLocationById(id: string): Promise<any | null> {
    try {
      const location = await prisma.location.findUnique({
        where: { id },
      })
      return location
    } catch (error) {
      console.error("Error retrieving location:", error)
      return null
    }
  }

  static async searchLocations(query: string): Promise<any[]> {
    try {
      const locations = await prisma.location.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { address: { contains: query, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
      return locations
    } catch (error) {
      console.error("Error searching locations:", error)
      return []
    }
  }

  static async getNearbyLocations(lat: number, lng: number, radiusKm = 5): Promise<any[]> {
    try {
      // Get all locations and filter by distance
      // This is a simple approach - for production, use a spatial query
      const locations = await prisma.location.findMany()

      return locations.filter((loc) => {
        if (!loc.latitude || !loc.longitude) return false

        // Calculate distance using Haversine formula
        const distance = calculateDistance(lat, lng, loc.latitude, loc.longitude)

        return distance <= radiusKm
      })
    } catch (error) {
      console.error("Error getting nearby locations:", error)
      return []
    }
  }

  static async getAllLocations(): Promise<any[]> {
    try {
      const locations = await prisma.location.findMany({
        orderBy: { createdAt: "desc" },
      })
      return locations
    } catch (error) {
      console.error("Error getting all locations:", error)
      return []
    }
  }
}

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in km
  return distance
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Helper function to extract location from EXIF data
async function extractExifLocation(buffer: Buffer): Promise<Location | null> {
  try {
    const parser = exifParser.create(buffer)
    const result = parser.parse()

    if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
      return {
        latitude: result.tags.GPSLatitude,
        longitude: result.tags.GPSLongitude,
      }
    }
  } catch (error) {
    console.error("EXIF location extraction failed:", error)
  }

  return null
}

// Search for a place using Google Places API
async function searchPlaceWithGoogleMaps(
  query: string,
  currentLocation?: Location,
): Promise<LocationRecognitionResponse | null> {
  try {
    console.log(`Searching for place: "${query}" with Google Places API`)

    // Clean the query
    const cleanedQuery = query.replace(/\n+/g, " ").replace(/\s+/g, " ").trim()

    if (cleanedQuery.length < 3) {
      console.log("Query too short, skipping place search")
      return null
    }

    // Prepare search parameters
    const params: any = {
      query: cleanedQuery,
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      fields: "formatted_address,name,geometry,place_id,types,photos,rating,opening_hours",
    }

    // Add location bias if current location is available
    if (currentLocation) {
      params.locationbias = `circle:50000@${currentLocation.latitude},${currentLocation.longitude}`
    }

    // Make the Places API request
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/findplacefromtext/json", { params })

    console.log(`Places API response status: ${response.data.status}`)

    if (response.data.status !== "OK" || !response.data.candidates || response.data.candidates.length === 0) {
      console.log("No places found")
      return null
    }

    // Get the first (best) result
    const place = response.data.candidates[0]

    // Get place details for more information
    const detailsResponse = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
      params: {
        place_id: place.place_id,
        fields: "name,formatted_address,geometry,address_component,type,photo,vicinity,rating,opening_hours,url",
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    })

    const details = detailsResponse.data.result

    // Determine category based on types
    let category = "Unknown"
    if (details.types) {
      if (details.types.includes("lodging") || details.types.includes("hotel")) {
        category = "Hotel"
      } else if (details.types.includes("restaurant") || details.types.includes("food")) {
        category = "Restaurant"
      } else if (details.types.includes("store") || details.types.includes("shopping_mall")) {
        category = "Shopping"
      } else if (details.types.includes("point_of_interest") || details.types.includes("establishment")) {
        category = "Point of Interest"
      }
    }

    // Calculate confidence based on how well the query matches the result
    // This is a simple heuristic - in a real app, you might use more sophisticated methods
    let confidence = 0.8 // Default confidence for Places API results

    // If the query is contained in the name, increase confidence
    if (
      details.name.toLowerCase().includes(cleanedQuery.toLowerCase()) ||
      cleanedQuery.toLowerCase().includes(details.name.toLowerCase())
    ) {
      confidence = 0.9
    }

    // Create photo URLs if available
    const photoUrls: string[] = []
    if (details.photos && details.photos.length > 0) {
      details.photos.slice(0, 3).forEach((photo) => {
        photoUrls.push(
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
        )
      })
    }

    // Create map URL
    const mapUrl = `https://www.google.com/maps/place/?q=place_id:${details.place_id}`

    // Create the response object
    return {
      success: true,
      type: "place-search",
      name: details.name,
      address: details.formatted_address || details.vicinity,
      formattedAddress: details.formatted_address,
      location: {
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
      },
      description: `${category} located at ${details.vicinity || details.formatted_address}`,
      confidence,
      category,
      mapUrl,
      placeId: details.place_id,
      addressComponents: details.address_components,
      photos: photoUrls,
      rating: details.rating,
      openingHours: details.opening_hours,
    }
  } catch (error) {
    console.warn(`Place search failed for: ${query}`, error)
    return null
  }
}

// Enhanced geocoding function with more detailed address information
async function geocodeAddress(
  address: string,
  currentLocation?: Location,
): Promise<LocationRecognitionResponse | null> {
  try {
    console.log(`Geocoding address: "${address}"`)

    // Clean the address string
    const cleanedAddress = address.replace(/\n+/g, " ").replace(/\s+/g, " ").trim()

    // If the address is too short, it's probably not a valid address
    if (cleanedAddress.length < 3) {
      console.log("Address too short, skipping geocoding")
      return null
    }

    // Prepare geocoding parameters
    const params: any = {
      address: cleanedAddress,
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    }

    // Add location bias if current location is available
    if (currentLocation) {
      params.location = `${currentLocation.latitude},${currentLocation.longitude}`
      params.radius = 50000 // 50km radius for location bias
    }

    // Make the geocoding request
    const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", { params })

    // Log the response status
    console.log(`Geocoding response status: ${response.data.status}`)

    // Check if we got any results
    if (!response.data.results || response.data.results.length === 0) {
      console.log("No geocoding results found")
      return null
    }

    const result = response.data.results[0]

    // Extract address components
    const addressComponents = result.address_components || []

    // Extract the name from the first part of the formatted address
    const nameParts = result.formatted_address.split(",")
    const name = nameParts[0].trim()

    // Determine the category based on types
    let category = "Unknown"
    if (result.types) {
      if (result.types.includes("point_of_interest") || result.types.includes("establishment")) {
        category = "Point of Interest"
      } else if (result.types.includes("street_address") || result.types.includes("route")) {
        category = "Street"
      } else if (result.types.includes("locality") || result.types.includes("administrative_area_level_1")) {
        category = "City/Region"
      } else if (result.types.includes("country")) {
        category = "Country"
      }
    }

    // Calculate confidence based on result types and viewport size
    // Smaller viewport = more precise location = higher confidence
    let confidence = 0.7 // Default confidence
    if (result.geometry && result.geometry.viewport) {
      const viewport = result.geometry.viewport
      const viewportSize =
        Math.abs(viewport.northeast.lat - viewport.southwest.lat) *
        Math.abs(viewport.northeast.lng - viewport.southwest.lng)

      // Adjust confidence based on viewport size (smaller is better)
      if (viewportSize < 0.0001) confidence = 0.95
      else if (viewportSize < 0.001) confidence = 0.9
      else if (viewportSize < 0.01) confidence = 0.85
      else if (viewportSize < 0.1) confidence = 0.8
      else if (viewportSize >= 0.1) confidence = 0.7
    }

    // Create map URL
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${result.geometry.location.lat},${result.geometry.location.lng}&query_place_id=${result.place_id}`

    // Create the response object with enhanced information
    return {
      success: true,
      type: "geocode",
      name: name,
      address: result.formatted_address,
      formattedAddress: result.formatted_address,
      location: {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
      },
      description: `Location in ${result.formatted_address}`,
      confidence: confidence,
      category: category,
      mapUrl: mapUrl,
      placeId: result.place_id,
      addressComponents: addressComponents,
    }
  } catch (error) {
    console.warn(`Geocoding failed for: ${address}`, error)
    return null
  }
}

// New function to extract and geocode locations from text
async function extractLocationsFromText(
  text: string,
  currentLocation?: Location,
): Promise<LocationRecognitionResponse[]> {
  console.log("Extracting locations from text:", text)

  // Clean up the text - replace newlines with spaces
  const cleanedText = text.replace(/\n+/g, " ").trim()

  // First, try to find the place directly using Google Places API
  const placeResult = await searchPlaceWithGoogleMaps(cleanedText, currentLocation)
  if (placeResult) {
    console.log("Found place via Google Places API:", placeResult.name)
    return [placeResult]
  }

  // If direct place search fails, try to extract potential location segments
  const potentialLocations = cleanedText
    .split(/[,.;!?]/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 3)

  // Also try the full text as one segment
  if (!potentialLocations.includes(cleanedText) && cleanedText.length > 3) {
    potentialLocations.push(cleanedText)
  }

  console.log("Potential location segments:", potentialLocations)

  // For business names like hotels, add some context if we have current location
  const enhancedLocations = [...potentialLocations]

  if (currentLocation) {
    // Get city and country information for the current location
    try {
      const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
        params: {
          latlng: `${currentLocation.latitude},${currentLocation.longitude}`,
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          result_type: "locality|administrative_area_level_1|country",
        },
      })

      if (response.data.results && response.data.results.length > 0) {
        const locationContext = response.data.results[0].formatted_address

        // Add context to business names
        const businessKeywords = ["hotel", "plaza", "suites", "inn", "resort", "apartments", "towers"]

        potentialLocations.forEach((loc) => {
          const locLower = loc.toLowerCase()
          if (businessKeywords.some((keyword) => locLower.includes(keyword))) {
            enhancedLocations.push(`${loc}, ${locationContext}`)
          }
        })
      }
    } catch (error) {
      console.warn("Error getting location context:", error)
    }
  }

  console.log("Enhanced location segments:", enhancedLocations)

  // Try to search for each potential location with Google Places API
  const placeSearchPromises = enhancedLocations.map((loc) => searchPlaceWithGoogleMaps(loc, currentLocation))
  const placeResults = await Promise.all(placeSearchPromises)
  const validPlaceResults = placeResults.filter((result) => result !== null) as LocationRecognitionResponse[]

  if (validPlaceResults.length > 0) {
    return validPlaceResults
  }

  // If place search fails, try geocoding
  const geocodePromises = enhancedLocations.map((loc) => geocodeAddress(loc, currentLocation))
  const geocodeResults = await Promise.all(geocodePromises)
  const validGeocodeResults = geocodeResults.filter((result) => result !== null) as LocationRecognitionResponse[]

  if (validGeocodeResults.length > 0) {
    return validGeocodeResults
  }

  // If all searches fail, create a fallback response for business names
  const results: LocationRecognitionResponse[] = []

  if (currentLocation) {
    // Check for hotel or business names
    const businessKeywords = ["hotel", "plaza", "suites", "inn", "resort", "apartments", "towers"]

    for (const loc of potentialLocations) {
      const locLower = loc.toLowerCase()
      if (businessKeywords.some((keyword) => locLower.includes(keyword.toLowerCase()))) {
        // Create a fallback response for the business
        results.push({
          success: true,
          type: "business-name",
          name: loc,
          location: currentLocation,
          confidence: 0.6,
          description: `Business identified from text: ${loc}`,
          category: "Business",
          mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}&ll=${currentLocation.latitude},${currentLocation.longitude}`,
        })
        break
      }
    }
  }

  return results
}

// Enhanced function to detect text in images and extract locations
async function detectTextAndExtractLocations(
  imageBuffer: Buffer,
  currentLocation?: Location,
): Promise<LocationRecognitionResponse[]> {
  try {
    // Initialize Vision client with credentials from the environment
    const base64Credentials = process.env.GCLOUD_CREDENTIALS
    if (!base64Credentials) {
      throw new Error("GCLOUD_CREDENTIALS environment variable is not set.")
    }

    const credentialsBuffer = Buffer.from(base64Credentials, "base64")
    const credentialsJson = credentialsBuffer.toString("utf8")
    const serviceAccount = JSON.parse(credentialsJson)

    const client = new vision.ImageAnnotatorClient({
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      },
      projectId: serviceAccount.project_id,
    })

    // Perform text detection
    const [textResult] = await client.textDetection({ image: { content: imageBuffer } })
    const detections = textResult.textAnnotations

    if (!detections || detections.length === 0) {
      console.log("No text detected in image")
      return []
    }

    // Get the full text from the first annotation
    const fullText = detections[0].description || ""
    console.log("Detected text:", fullText)

    // Extract locations from the detected text
    return await extractLocationsFromText(fullText, currentLocation)
  } catch (error) {
    console.error("Text detection failed:", error)
    return []
  }
}

// Main location recognition function
async function recognizeLocation(imageBuffer: Buffer, currentLocation: Location): Promise<LocationRecognitionResponse> {
  try {
    console.log("Starting image analysis...")

    // Initialize Vision client with credentials from the environment
    const base64Credentials = process.env.GCLOUD_CREDENTIALS
    if (!base64Credentials) {
      throw new Error("GCLOUD_CREDENTIALS environment variable is not set.")
    }

    const credentialsBuffer = Buffer.from(base64Credentials, "base64")
    const credentialsJson = credentialsBuffer.toString("utf8")
    const serviceAccount = JSON.parse(credentialsJson)

    const client = new vision.ImageAnnotatorClient({
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      },
      projectId: serviceAccount.project_id,
    })

    // Perform landmark detection
    const [result] = await client.landmarkDetection({ image: { content: imageBuffer } })
    const landmarks = result.landmarkAnnotations || []

    if (landmarks.length > 0) {
      const landmark = landmarks[0]
      const confidence = landmark.score || 0

      // Extract location from landmark
      const location = landmark.locations?.[0]?.latLng
      const detectedLocation = location
        ? {
            latitude: location.latitude || 0,
            longitude: location.longitude || 0,
          }
        : undefined

      // Search for known landmark information
      const knownLandmarkName = Object.keys(KNOWN_LANDMARKS).find((name) =>
        landmark.description?.toLowerCase().includes(name.toLowerCase()),
      )

      if (knownLandmarkName) {
        console.log(`Matched known landmark: ${knownLandmarkName}`)
        const knownInfo = KNOWN_LANDMARKS[knownLandmarkName]

        return {
          success: true,
          type: "landmark-detection",
          name: landmark.description || knownLandmarkName,
          location: detectedLocation || knownInfo.location,
          confidence,
          address: knownInfo.address,
          description: knownInfo.description,
          category: knownInfo.category,
          mapUrl: `https://www.google.com/maps/search/?api=1&query=${knownInfo.location.latitude},${knownInfo.location.longitude}`,
          pointsOfInterest: knownInfo.pointsOfInterest,
        }
      }

      // If not a known location, try to get more information via geocoding
      if (detectedLocation) {
        try {
          const geocodeResponse = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
            params: {
              latlng: `${detectedLocation.latitude},${detectedLocation.longitude}`,
              key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
            },
          })

          if (geocodeResponse.data.results && geocodeResponse.data.results.length > 0) {
            const addressResult = geocodeResponse.data.results[0]

            return {
              success: true,
              type: "landmark-detection",
              name: landmark.description || "Unknown Landmark",
              location: detectedLocation,
              confidence,
              address: addressResult.formatted_address,
              formattedAddress: addressResult.formatted_address,
              category: "Landmark",
              mapUrl: `https://www.google.com/maps/search/?api=1&query=${detectedLocation.latitude},${detectedLocation.longitude}`,
              placeId: addressResult.place_id,
              addressComponents: addressResult.address_components,
            }
          }
        } catch (error) {
          console.warn("Reverse geocoding failed:", error)
        }
      }

      // Return basic landmark information if geocoding fails
      return {
        success: true,
        type: "landmark-detection",
        name: landmark.description || "Unknown Landmark",
        location: detectedLocation,
        confidence,
        category: "Landmark",
        mapUrl: detectedLocation
          ? `https://www.google.com/maps/search/?api=1&query=${detectedLocation.latitude},${detectedLocation.longitude}`
          : undefined,
      }
    }

    // If landmark detection fails, try text detection and location extraction
    const textLocations = await detectTextAndExtractLocations(imageBuffer, currentLocation)

    if (textLocations.length > 0) {
      // Return the highest confidence result
      textLocations.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      return textLocations[0]
    }

    // If text detection found text but couldn't geocode it, create a fallback response
    const [textResult] = await client.textDetection({ image: { content: imageBuffer } })
    const detections = textResult.textAnnotations

    if (detections && detections.length > 0) {
      const fullText = detections[0].description || ""
      console.log("Creating fallback response for detected text:", fullText)

      // Clean up the text
      const cleanedText = fullText.replace(/\n+/g, " ").trim()

      // Check for business keywords
      const businessKeywords = [
        "hotel",
        "plaza",
        "suites",
        "inn",
        "resort",
        "apartments",
        "towers",
        "restaurant",
        "cafe",
        "shop",
        "store",
        "mall",
      ]
      const isBusinessName = businessKeywords.some((keyword) =>
        cleanedText.toLowerCase().includes(keyword.toLowerCase()),
      )

      if (isBusinessName || cleanedText.toUpperCase() === cleanedText) {
        // All caps is likely a business name
        return {
          success: true,
          type: "text-business-detection",
          name: cleanedText,
          location: currentLocation,
          confidence: 0.7,
          description: `Business detected from image: ${cleanedText}`,
          category: "Business",
          mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanedText)}&ll=${currentLocation.latitude},${currentLocation.longitude}`,
        }
      }

      return {
        success: true,
        type: "text-detection",
        name: cleanedText,
        location: currentLocation,
        confidence: 0.6,
        description: `Text detected: ${cleanedText}`,
        category: "Unknown",
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${currentLocation.latitude},${currentLocation.longitude}`,
      }
    }

    // If all detection methods fail
    return {
      success: false,
      type: "detection-failed",
      error: "Location not identified in image",
    }
  } catch (error) {
    console.error("Analysis failed:", error)
    return {
      success: false,
      type: "detection-failed",
      error: error instanceof Error ? error.message : "Server error",
    }
  }
}

// Add this new function to better handle business names
async function searchBusinessLocation(
  text: string,
  currentLocation?: Location,
): Promise<LocationRecognitionResponse | null> {
  try {
    console.log(`Searching for business: "${text}"`)

    // Clean and normalize the text
    const cleanedText = text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim()

    // Extract potential business names
    const businessTypes = [
      "Bank",
      "Hotel",
      "Plaza",
      "Restaurant",
      "Cafe",
      "Store",
      "Mall",
      "Hospital",
      "School",
      "University",
      "Church",
      "Temple",
      "Mosque",
      "Office",
      "Center",
      "Centre",
      "Building",
      "Tower",
      "Apartments",
      "Suites",
      "Inn",
      "Resort",
    ]

    // Look for business names in the text
    let businessName = ""

    // First, check if there's a known business type in the text
    for (const type of businessTypes) {
      const regex = new RegExp(`\\b([A-Za-z0-9\\s&'-]+)\\s*${type}\\b`, "i")
      const match = cleanedText.match(regex)
      if (match) {
        businessName = match[0].trim()
        break
      }

      // Also check for business type at the beginning
      const regexStart = new RegExp(`\\b${type}\\s+([A-Za-z0-9\\s&'-]+)\\b`, "i")
      const matchStart = cleanedText.match(regexStart)
      if (matchStart) {
        businessName = matchStart[0].trim()
        break
      }
    }

    // If no business name with type was found, look for capitalized words that might be a business name
    if (!businessName) {
      // Look for words that are all caps or start with capital letters
      const words = cleanedText.split(/\s+/)
      const potentialNames = []

      for (let i = 0; i < words.length; i++) {
        const word = words[i]
        // Check if word is all caps or starts with capital letter
        if (word === word.toUpperCase() || (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase())) {
          let name = word

          // Try to include adjacent capitalized words
          let j = i + 1
          while (
            j < words.length &&
            (words[j] === words[j].toUpperCase() ||
              (words[j][0] === words[j][0].toUpperCase() && words[j][0] !== words[j][0].toLowerCase()))
          ) {
            name += " " + words[j]
            j++
          }

          potentialNames.push(name)
          i = j - 1 // Skip the words we've included
        }
      }

      // Use the longest potential name as it's likely to be the most complete
      if (potentialNames.length > 0) {
        businessName = potentialNames.reduce((a, b) => (a.length > b.length ? a : b))
      }
    }

    // If we still don't have a business name, use the whole text
    if (!businessName) {
      businessName = cleanedText
    }

    console.log(`Extracted business name: "${businessName}"`)

    // Try to identify if this is a bank
    const isBankLikely = /bank|credit union|financial|finance|capital/i.test(businessName)

    // Remove any trailing numbers that might be addresses
    let searchQuery = businessName.replace(/\s+\d+$/, "").trim()

    // Prepare search query - add "bank" if it seems like a bank but doesn't have "bank" in the name
    if (isBankLikely && !/bank/i.test(searchQuery)) {
      searchQuery = `${searchQuery} Bank`
    }

    console.log(`Using search query: "${searchQuery}"`)

    // Try multiple search approaches
    const searchQueries = [
      searchQuery,
      // Add variations without numbers
      searchQuery
        .replace(/\d+/g, "")
        .trim(),
      // Add variation with just the main words (first 3-4 words)
      searchQuery
        .split(/\s+/)
        .slice(0, 3)
        .join(" "),
    ]

    // Remove duplicates
    const uniqueQueries = [...new Set(searchQueries)].filter((q) => q.length > 2)
    console.log("Trying search queries:", uniqueQueries)

    // Try each query
    for (const query of uniqueQueries) {
      // Search for the business using Google Places API
      const params: any = {
        input: query,
        inputtype: "textquery",
        fields: "formatted_address,name,geometry,place_id,types,photos,rating,opening_hours",
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      }

      // Add location bias if current location is available
      if (currentLocation) {
        params.locationbias = `circle:50000@${currentLocation.latitude},${currentLocation.longitude}`
      }

      // Make the Places API request
      const response = await axios.get("https://maps.googleapis.com/maps/api/place/findplacefromtext/json", { params })

      console.log(`Places API response status for query "${query}": ${response.data.status}`)

      if (response.data.status === "OK" && response.data.candidates && response.data.candidates.length > 0) {
        // Get the first (best) result
        const place = response.data.candidates[0]

        // Get place details for more information
        const detailsResponse = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
          params: {
            place_id: place.place_id,
            fields: "name,formatted_address,geometry,address_component,type,photo,vicinity,rating,opening_hours,url",
            key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          },
        })

        const details = detailsResponse.data.result

        // Determine category based on types
        let category = "Business"
        if (details.types) {
          if (details.types.includes("bank") || details.types.includes("finance")) {
            category = "Bank"
          } else if (details.types.includes("lodging") || details.types.includes("hotel")) {
            category = "Hotel"
          } else if (details.types.includes("restaurant") || details.types.includes("food")) {
            category = "Restaurant"
          } else if (details.types.includes("store") || details.types.includes("shopping_mall")) {
            category = "Shopping"
          }
        }

        // Create photo URLs if available
        const photoUrls: string[] = []
        if (details.photos && details.photos.length > 0) {
          details.photos.slice(0, 3).forEach((photo) => {
            photoUrls.push(
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
            )
          })
        }

        // Create map URL
        const mapUrl = `https://www.google.com/maps/place/?q=place_id:${details.place_id}`

        return {
          success: true,
          type: "business-search",
          name: details.name,
          address: details.formatted_address || details.vicinity,
          formattedAddress: details.formatted_address,
          location: {
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng,
          },
          description: `${category} located at ${details.vicinity || details.formatted_address}`,
          confidence: 0.9, // High confidence for successful business search
          category,
          mapUrl,
          placeId: details.place_id,
          addressComponents: details.address_components,
          photos: photoUrls,
          rating: details.rating,
          openingHours: details.opening_hours,
        }
      }
    }

    // If all direct searches fail, try a more general approach with the Google Places API Text Search
    try {
      const textSearchParams = {
        query: searchQuery,
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      }

      if (currentLocation) {
        textSearchParams.location = `${currentLocation.latitude},${currentLocation.longitude}`
        textSearchParams.radius = "50000" // 50km radius
      }

      const textSearchResponse = await axios.get("https://maps.googleapis.com/maps/api/place/textsearch/json", {
        params: textSearchParams,
      })

      console.log(`Places Text Search API response status: ${textSearchResponse.data.status}`)

      if (
        textSearchResponse.data.status === "OK" &&
        textSearchResponse.data.results &&
        textSearchResponse.data.results.length > 0
      ) {
        const place = textSearchResponse.data.results[0]

        // Determine category based on types
        let category = "Business"
        if (place.types) {
          if (place.types.includes("bank") || place.types.includes("finance")) {
            category = "Bank"
          } else if (place.types.includes("lodging") || place.types.includes("hotel")) {
            category = "Hotel"
          } else if (place.types.includes("restaurant") || place.types.includes("food")) {
            category = "Restaurant"
          } else if (place.types.includes("store") || place.types.includes("shopping_mall")) {
            category = "Shopping"
          }
        }

        // Create photo URLs if available
        const photoUrls: string[] = []
        if (place.photos && place.photos.length > 0) {
          place.photos.slice(0, 3).forEach((photo) => {
            photoUrls.push(
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
            )
          })
        }

        // Create map URL
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${place.geometry.location.lat},${place.geometry.location.lng}`

        return {
          success: true,
          type: "business-search",
          name: place.name,
          address: place.formatted_address,
          formattedAddress: place.formatted_address,
          location: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          },
          description: `${category} located at ${place.formatted_address}`,
          confidence: 0.85,
          category,
          mapUrl,
          photos: photoUrls,
          rating: place.rating,
        }
      }
    } catch (error) {
      console.warn("Text search failed:", error)
    }

    // If we still haven't found anything, create a custom bank search for common banks
    if (isBankLikely) {
      // List of common banks to try
      const commonBanks = [
        "Pacific National Bank",
        "First National Bank",
        "Bank of America",
        "Wells Fargo",
        "Chase Bank",
        "Citibank",
        "TD Bank",
        "PNC Bank",
        "Capital One",
        "US Bank",
        "Regions Bank",
        "SunTrust Bank",
        "BB&T",
        "Fifth Third Bank",
        "KeyBank",
        "Citizens Bank",
        "Santander Bank",
        "HSBC Bank",
        "Union Bank",
        "BMO Harris Bank",
      ]

      // Find the closest match to our business name
      const bankMatches = commonBanks.filter(
        (bank) =>
          searchQuery.toLowerCase().includes(bank.toLowerCase().replace(" bank", "")) ||
          bank.toLowerCase().includes(searchQuery.toLowerCase().replace(" bank", "")),
      )

      if (bankMatches.length > 0) {
        // Try to search for the best matching bank near the current location
        const bestMatch = bankMatches[0]

        if (currentLocation) {
          const nearbySearchParams = {
            location: `${currentLocation.latitude},${currentLocation.longitude}`,
            radius: "10000", // 10km radius
            keyword: bestMatch,
            key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          }

          const nearbySearchResponse = await axios.get("https://maps.googleapis.com/maps/api/place/nearbysearch/json", {
            params: nearbySearchParams,
          })

          if (
            nearbySearchResponse.data.status === "OK" &&
            nearbySearchResponse.data.results &&
            nearbySearchResponse.data.results.length > 0
          ) {
            const place = nearbySearchResponse.data.results[0]

            return {
              success: true,
              type: "bank-search",
              name: place.name,
              address: place.vicinity,
              location: {
                latitude: place.geometry.location.lat,
                longitude: place.geometry.location.lng,
              },
              description: `Bank located at ${place.vicinity}`,
              confidence: 0.8,
              category: "Bank",
              mapUrl: `https://www.google.com/maps/search/?api=1&query=${place.geometry.location.lat},${place.geometry.location.lng}&query_place_id=${place.place_id}`,
              rating: place.rating,
            }
          }
        }
      }
    }

    // If all searches fail, create a fallback response
    if (currentLocation) {
      return {
        success: true,
        type: "business-name-fallback",
        name: businessName,
        location: currentLocation,
        confidence: 0.6,
        description: `Business identified from text: ${businessName}`,
        category: isBankLikely ? "Bank" : "Business",
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName)}&ll=${currentLocation.latitude},${currentLocation.longitude}`,
        address: "Location approximate - search for more details",
      }
    }

    return null
  } catch (error) {
    console.warn(`Business search failed for: ${text}`, error)
    return null
  }
}

// Update the detectTextAndExtractLocations function to better handle business text
async function detectTextAndExtractLocationsUpdated(
  imageBuffer: Buffer,
  currentLocation?: Location,
): Promise<LocationRecognitionResponse[]> {
  try {
    // Initialize Vision client with credentials from the environment
    const base64Credentials = process.env.GCLOUD_CREDENTIALS
    if (!base64Credentials) {
      throw new Error("GCLOUD_CREDENTIALS environment variable is not set.")
    }

    const credentialsBuffer = Buffer.from(base64Credentials, "base64")
    const credentialsJson = credentialsBuffer.toString("utf8")
    const serviceAccount = JSON.parse(credentialsJson)

    const client = new vision.ImageAnnotatorClient({
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      },
      projectId: serviceAccount.project_id,
    })

    // Perform text detection
    const [textResult] = await client.textDetection({ image: { content: imageBuffer } })
    const detections = textResult.textAnnotations

    if (!detections || detections.length === 0) {
      console.log("No text detected in image")
      return []
    }

    // Get the full text from the first annotation
    const fullText = detections[0].description || ""
    console.log("Detected text:", fullText)

    // First, try to identify if this is a business sign
    // Look for common business indicators in the text
    const businessIndicators = [
      "bank",
      "hotel",
      "restaurant",
      "cafe",
      "store",
      "shop",
      "mall",
      "plaza",
      "center",
      "centre",
      "building",
      "tower",
      "office",
      "inc",
      "llc",
      "ltd",
      "corporation",
      "corp",
      "enterprises",
      "financial",
      "services",
      "credit union",
    ]

    const isLikelyBusiness = businessIndicators.some((indicator) =>
      fullText.toLowerCase().includes(indicator.toLowerCase()),
    )

    // For banks specifically, try to extract just the bank name without numbers
    if (isLikelyBusiness && fullText.toLowerCase().includes("bank")) {
      // Try to extract just the bank name
      const lines = fullText.split("\n").filter((line) => line.trim().length > 0)

      // Look for the line that contains "bank"
      const bankLine = lines.find((line) => line.toLowerCase().includes("bank"))

      if (bankLine) {
        // Try specialized business search first with just the bank name
        const businessResult = await searchBusinessLocation(bankLine, currentLocation)
        if (businessResult) {
          return [businessResult]
        }
      }
    }

    // If bank-specific search fails, try with the full text
    if (isLikelyBusiness) {
      // Try specialized business search first
      const businessResult = await searchBusinessLocation(fullText, currentLocation)
      if (businessResult) {
        return [businessResult]
      }
    }

    // If business search fails, try general location extraction
    return await extractLocationsFromText(fullText, currentLocation)
  } catch (error) {
    console.error("Text detection failed:", error)
    return []
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("Received POST request to location recognition API")

    // Check if required environment variables are set
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.error("Missing environment variable: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error: Missing Google Maps API key",
        },
        { status: 500 },
      )
    }

    if (!process.env.GCLOUD_CREDENTIALS) {
      console.error("Missing environment variable: GCLOUD_CREDENTIALS")
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error: Missing Google Cloud credentials",
        },
        { status: 500 },
      )
    }

    // Parse the form data
    let formData
    try {
      formData = await request.formData()
      console.log("Form data keys:", [...formData.keys()])
    } catch (error) {
      console.error("Error parsing form data:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse form data",
        },
        { status: 400 },
      )
    }

    // Check for database operations
    const operation = formData.get("operation")

    // Handle database operations
    if (operation) {
      switch (operation) {
        case "getById": {
          const id = formData.get("id")
          if (!id) {
            return NextResponse.json({ success: false, error: "Missing location ID" }, { status: 400 })
          }

          const location = await LocationDB.getLocationById(id.toString())
          if (!location) {
            return NextResponse.json({ success: false, error: "Location not found" }, { status: 404 })
          }

          return NextResponse.json(
            {
              success: true,
              ...location,
              mapUrl: `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`,
            },
            { status: 200 },
          )
        }

        case "search": {
          const query = formData.get("query")
          if (!query) {
            return NextResponse.json({ success: false, error: "Missing search query" }, { status: 400 })
          }

          const locations = await LocationDB.searchLocations(query.toString())
          return NextResponse.json({ success: true, locations }, { status: 200 })
        }

        case "nearby": {
          const lat = formData.get("lat")
          const lng = formData.get("lng")
          const radius = formData.get("radius")

          if (!lat || !lng) {
            return NextResponse.json({ success: false, error: "Missing coordinates" }, { status: 400 })
          }

          const locations = await LocationDB.getNearbyLocations(
            Number.parseFloat(lat.toString()),
            Number.parseFloat(lng.toString()),
            radius ? Number.parseFloat(radius.toString()) : undefined,
          )

          return NextResponse.json({ success: true, locations }, { status: 200 })
        }

        case "all": {
          const locations = await LocationDB.getAllLocations()
          return NextResponse.json({ success: true, locations }, { status: 200 })
        }
      }
    }

    // Check for text-based location recognition
    const text = formData.get("text")
    if (text && typeof text === "string") {
      console.log("Processing text-based location recognition:", text)

      // Get current location if available
      let currentLocation: Location | undefined
      const lat = formData.get("lat")
      const lng = formData.get("lng")

      if (lat && lng) {
        currentLocation = {
          latitude: Number.parseFloat(lat.toString()),
          longitude: Number.parseFloat(lng.toString()),
        }
      }

      // Extract locations from text
      const locations = await extractLocationsFromText(text, currentLocation)

      if (locations.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "No locations found in text",
          },
          { status: 404 },
        )
      }

      // Return the highest confidence result
      locations.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      const bestMatch = locations[0]

      // Save the location to the database if requested
      const saveToDb = formData.get("saveToDb") !== "false" // Default to true
      let locationId = null

      if (saveToDb) {
        try {
          locationId = await LocationDB.saveLocation(bestMatch)
          bestMatch.id = locationId
        } catch (error) {
          console.error("Error saving recognized location:", error)
          // Continue without saving to DB
        }
      }

      return NextResponse.json(bestMatch, { status: 200 })
    }

    // Check for address input
    const address = formData.get("address")
    if (address && typeof address === "string") {
      console.log("Processing address-based lookup:", address)

      // Get current location if available for better geocoding
      let currentLocation: Location | undefined
      const lat = formData.get("lat")
      const lng = formData.get("lng")

      if (lat && lng) {
        currentLocation = {
          latitude: Number.parseFloat(lat.toString()),
          longitude: Number.parseFloat(lng.toString()),
        }
      }

      const geocodeResult = await geocodeAddress(address, currentLocation)

      if (!geocodeResult) {
        return NextResponse.json(
          {
            success: false,
            error: "Address not found",
          },
          { status: 404 },
        )
      }

      // Save the location to the database if requested
      const saveToDb = formData.get("saveToDb") !== "false" // Default to true
      let locationId = null

      if (saveToDb) {
        try {
          locationId = await LocationDB.saveLocation(geocodeResult)
          geocodeResult.id = locationId
        } catch (error) {
          console.error("Error saving recognized location:", error)
          // Continue without saving to DB
        }
      }

      return NextResponse.json(geocodeResult, { status: 200 })
    }

    // Handle image upload
    const image = formData.get("image") as File | null
    const lat = formData.get("lat")
    const lng = formData.get("lng")
    const saveToDb = formData.get("saveToDb") !== "false" // Default to true

    if (!image) {
      console.error("Invalid request: No image provided")
      return NextResponse.json(
        {
          success: false,
          error: "Must provide an image, text, or address",
        },
        { status: 400 },
      )
    }

    // Process the image
    let imageBuffer: Buffer
    try {
      const arrayBuffer = await image.arrayBuffer()
      imageBuffer = Buffer.from(arrayBuffer)
      console.log("Image buffer created successfully, size:", imageBuffer.length)
    } catch (error) {
      console.error("Error processing image:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to process image",
        },
        { status: 400 },
      )
    }

    // Get location from coordinates or EXIF data
    let location: Location | null = null
    if (lat && lng) {
      location = {
        latitude: Number.parseFloat(lat.toString()),
        longitude: Number.parseFloat(lng.toString()),
      }
      console.log("Using provided location:", location)
    } else {
      try {
        location = await extractExifLocation(imageBuffer)
        console.log("Extracted EXIF location:", location)
      } catch (error) {
        console.error("Error extracting EXIF location:", error)
      }
    }

    if (!location) {
      console.log("No location provided or extracted, using default location")
      // Use a default location if no location is provided
      location = {
        latitude: 40.7128,
        longitude: -74.006,
      }
    }

    // Recognize location from image
    console.log("Calling recognizeLocation with location:", location)
    const result = await recognizeLocation(imageBuffer, location)
    console.log("Recognition result success:", result.success)

    // Save the location to the database if requested and recognition was successful
    if (saveToDb && result.success) {
      try {
        // Check for required fields
        if (!result.name || !result.address) {
          console.warn("⚠️ Warning: Location name or address is missing.")
        }

        const locationId = await LocationDB.saveLocation(result)
        result.id = locationId
      } catch (error) {
        console.error("Error saving recognized location:", error)
        // Continue without saving to DB
      }
    }

    return NextResponse.json(result, { status: result.success ? 200 : 404 })
  } catch (error) {
    console.error("Request failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const operation = searchParams.get("operation")

    if (!operation) {
      return NextResponse.json({ success: false, error: "Missing operation parameter" }, { status: 400 })
    }

    switch (operation) {
      case "getById": {
        const id = searchParams.get("id")
        if (!id) {
          return NextResponse.json({ success: false, error: "Missing location ID" }, { status: 400 })
        }

        const location = await LocationDB.getLocationById(id)
        if (!location) {
          return NextResponse.json({ success: false, error: "Location not found" }, { status: 404 })
        }

        return NextResponse.json(
          {
            success: true,
            ...location,
            mapUrl: `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`,
          },
          { status: 200 },
        )
      }

      case "search": {
        const query = searchParams.get("query")
        if (!query) {
          return NextResponse.json({ success: false, error: "Missing search query" }, { status: 400 })
        }

        const locations = await LocationDB.searchLocations(query)
        return NextResponse.json({ success: true, locations }, { status: 200 })
      }

      case "nearby": {
        const lat = searchParams.get("lat")
        const lng = searchParams.get("lng")
        const radius = searchParams.get("radius")

        if (!lat || !lng) {
          return NextResponse.json({ success: false, error: "Missing coordinates" }, { status: 400 })
        }

        const locations = await LocationDB.getNearbyLocations(
          Number.parseFloat(lat),
          Number.parseFloat(lng),
          radius ? Number.parseFloat(radius) : undefined,
        )

        return NextResponse.json({ success: true, locations }, { status: 200 })
      }

      case "all": {
        const locations = await LocationDB.getAllLocations()
        return NextResponse.json({ success: true, locations }, { status: 200 })
      }

      case "textRecognition": {
        const text = searchParams.get("text")
        if (!text) {
          return NextResponse.json({ success: false, error: "Missing text parameter" }, { status: 400 })
        }

        const lat = searchParams.get("lat")
        const lng = searchParams.get("lng")
        let currentLocation: Location | undefined

        if (lat && lng) {
          currentLocation = {
            latitude: Number.parseFloat(lat),
            longitude: Number.parseFloat(lng),
          }
        }

        const locations = await extractLocationsFromText(text, currentLocation)
        return NextResponse.json({ success: true, locations }, { status: 200 })
      }

      default:
        return NextResponse.json({ success: false, error: "Invalid operation" }, { status: 400 })
    }
  } catch (error) {
    console.error("GET request failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 },
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}

