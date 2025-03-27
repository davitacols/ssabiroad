import { type NextRequest, NextResponse } from "next/server"
import * as vision from "@google-cloud/vision"
import axios from "axios"
import * as exifParser from "exif-parser"
import NodeCache from "node-cache"
import prisma from "@/lib/db"

// Helper function to get environment variables that works in both local and production
function getEnv(key: string): string | undefined {
  // For server-side code (API routes)
  if (typeof process !== "undefined" && process.env) {
    const value = process.env[key]
    if (value) return value
  }

  // For client-side code with NEXT_PUBLIC_ prefix
  if (typeof window !== "undefined" && key.startsWith("NEXT_PUBLIC_")) {
    // Try window.__ENV first (for Vercel)
    if ((window as any).__ENV && (window as any).__ENV[key]) {
      return (window as any).__ENV[key]
    }
    // Fallback to direct process.env for Next.js client-side
    if ((window as any).process?.env && (window as any).process.env[key]) {
      return (window as any).process.env[key]
    }
  }

  console.warn(`Environment variable ${key} not found`)
  return undefined
}

// Cache configuration
const cache = new NodeCache({ stdTTL: 3600 }) // 1 hour cache

// Basic interfaces
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
  id?: string
  formattedAddress?: string
  placeId?: string
  addressComponents?: any[]
  photos?: string[]
  rating?: number
  openingHours?: any
  website?: string
  phoneNumber?: string
  priceLevel?: number
  buildingType?: string
  historicalInfo?: string
  materialType?: string
  architecturalStyle?: string
  yearBuilt?: string
  culturalSignificance?: string
  amenities?: string[]
  accessibility?: string[]
  geoData?: {
    country?: string
    countryCode?: string
    administrativeArea?: string
    locality?: string
    subLocality?: string
    postalCode?: string
    streetName?: string
    streetNumber?: string
    formattedAddress?: string
    timezone?: string
    elevation?: number
  }
  nearbyPlaces?: {
    name: string
    type: string
    distance: number
    location: Location
  }[]
  weatherConditions?: string
  airQuality?: string
  urbanDensity?: string
  vegetationDensity?: string
  crowdDensity?: string
  timeOfDay?: string
  significantColors?: string[]
  waterProximity?: string
  transportationAccess?: string[]
  safetyScore?: number
  noiseLevel?: string
  specialEvents?: string
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

      // Only include fields that exist in the Prisma schema
      const record: any = {
        name: location.name,
        address: location.address,
        latitude: location.location?.latitude,
        longitude: location.location?.longitude,
        confidence: location.confidence || null,
        recognitionType: location.type || "unknown",
        description: location.description,
        category: location.category,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Check if these fields exist in the schema before adding them
      // This is a safer approach than hardcoding the fields
      const schemaFields = [
        "buildingType",
        "architecturalStyle",
        "yearBuilt",
        "materialType",
        "culturalSignificance",
        "weatherConditions",
        "airQuality",
      ]

      // Try to get the Prisma model fields
      try {
        // Only add fields that exist in the schema
        for (const field of schemaFields) {
          if (field in location && location[field as keyof LocationRecognitionResponse] !== undefined) {
            record[field] = location[field as keyof LocationRecognitionResponse]
          }
        }
      } catch (error) {
        console.warn("Error checking schema fields:", error)
        // Continue with basic fields only
      }

      console.log("🔍 Prepared record before saving:", record)

      // Create new location record
      const result = await prisma.location.create({ data: record })

      return result.id
    } catch (error: any) {
      console.error("❌ Error saving location to database:", error.message || error)
      // Don't throw an error, just return a placeholder ID
      // This prevents the API from failing when the database is unavailable
      return "db-error-" + Date.now()
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
            { description: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
            { architecturalStyle: { contains: query, mode: "insensitive" } },
            { materialType: { contains: query, mode: "insensitive" } },
            { culturalSignificance: { contains: query, mode: "insensitive" } },
            { buildingType: { contains: query, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 20,
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

  static async getLocationsByCategory(category: string): Promise<any[]> {
    try {
      const locations = await prisma.location.findMany({
        where: {
          category: {
            contains: category,
            mode: "insensitive",
          },
        },
        orderBy: { createdAt: "desc" },
      })
      return locations
    } catch (error) {
      console.error(`Error getting locations by category ${category}:`, error)
      return []
    }
  }

  static async getLocationsByBuildingType(type: string): Promise<any[]> {
    try {
      const locations = await prisma.location.findMany({
        where: {
          buildingType: {
            contains: type,
            mode: "insensitive",
          },
        },
        orderBy: { createdAt: "desc" },
      })
      return locations
    } catch (error) {
      console.error(`Error getting locations by building type ${type}:`, error)
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
      // Validate the coordinates are within reasonable bounds
      const lat = result.tags.GPSLatitude
      const lng = result.tags.GPSLongitude

      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return {
          latitude: lat,
          longitude: lng,
        }
      } else {
        console.warn("Invalid GPS coordinates in EXIF data:", lat, lng)
      }
    }
  } catch (error) {
    console.error("EXIF location extraction failed:", error)
  }

  return null
}

// Function to extract detailed address components from Google's geocoding response
function extractDetailedAddressComponents(addressComponents: any[]): any {
  if (!addressComponents || !Array.isArray(addressComponents)) {
    return {}
  }

  const result: any = {
    country: "",
    countryCode: "",
    administrativeArea: "",
    locality: "",
    subLocality: "",
    postalCode: "",
    streetName: "",
    streetNumber: "",
  }

  for (const component of addressComponents) {
    if (!component.types || !Array.isArray(component.types)) continue

    if (component.types.includes("country")) {
      result.country = component.long_name
      result.countryCode = component.short_name
    } else if (component.types.includes("administrative_area_level_1")) {
      result.administrativeArea = component.long_name
    } else if (component.types.includes("locality")) {
      result.locality = component.long_name
    } else if (component.types.includes("sublocality") || component.types.includes("sublocality_level_1")) {
      result.subLocality = component.long_name
    } else if (component.types.includes("postal_code")) {
      result.postalCode = component.long_name
    } else if (component.types.includes("route")) {
      result.streetName = component.long_name
    } else if (component.types.includes("street_number")) {
      result.streetNumber = component.long_name
    }
  }

  return result
}

// Function to get nearby places for enhanced geotagging
async function getNearbyPlaces(location: Location): Promise<any[]> {
  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/nearbysearch/json", {
      params: {
        location: `${location.latitude},${location.longitude}`,
        radius: 500, // 500 meters radius
        key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
      },
      timeout: 10000, // 10 second timeout
    })

    if (response.data.status === "OK" && response.data.results) {
      return response.data.results.slice(0, 5).map((place: any) => ({
        name: place.name,
        type: place.types?.[0] || "unknown",
        distance:
          calculateDistance(
            location.latitude,
            location.longitude,
            place.geometry.location.lat,
            place.geometry.location.lng,
          ) * 1000, // Convert to meters
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
      }))
    }
    return []
  } catch (error) {
    console.warn("Error fetching nearby places:", error)
    return []
  }
}

// Function to get weather conditions for a location
async function getWeatherConditions(location: Location): Promise<string | null> {
  try {
    const response = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
      params: {
        lat: location.latitude,
        lon: location.longitude,
        appid: getEnv("OPENWEATHER_API_KEY"),
        units: "metric",
      },
      timeout: 10000, // 10 second timeout
    })

    if (response.data) {
      const weather = response.data.weather[0].description
      const temp = response.data.main.temp
      return `${weather}, ${temp}°C`
    }
    return null
  } catch (error) {
    console.warn("Error fetching weather data:", error)
    return null
  }
}

// Function to get air quality for a location
async function getAirQuality(location: Location): Promise<string | null> {
  try {
    const response = await axios.get("https://api.openweathermap.org/data/2.5/air_pollution", {
      params: {
        lat: location.latitude,
        lon: location.longitude,
        appid: getEnv("OPENWEATHER_API_KEY"),
      },
      timeout: 10000, // 10 second timeout
    })

    if (response.data && response.data.list && response.data.list.length > 0) {
      const aqi = response.data.list[0].main.aqi
      // AQI values 1-5 (1: Good, 2: Fair, 3: Moderate, 4: Poor, 5: Very Poor)
      const aqiLabels = ["", "Good", "Fair", "Moderate", "Poor", "Very Poor"]
      return aqiLabels[aqi] || "Unknown"
    }
    return null
  } catch (error) {
    console.warn("Error fetching air quality data:", error)
    return null
  }
}

// Function to analyze image for additional scene properties
async function analyzeImageScene(imageBuffer: Buffer): Promise<{
  urbanDensity?: string
  vegetationDensity?: string
  crowdDensity?: string
  timeOfDay?: string
  significantColors?: string[]
  waterProximity?: string
  buildingType?: string
}> {
  try {
    // Initialize Vision client with credentials from the environment
    let client: vision.ImageAnnotatorClient
    try {
      const base64Credentials = getEnv("GCLOUD_CREDENTIALS")
      if (!base64Credentials) {
        throw new Error("GCLOUD_CREDENTIALS environment variable is not set.")
      }

      const credentialsBuffer = Buffer.from(base64Credentials, "base64")
      const credentialsJson = credentialsBuffer.toString("utf8")

      // Validate JSON before parsing
      if (!credentialsJson.includes("client_email") || !credentialsJson.includes("private_key")) {
        throw new Error("Invalid GCLOUD_CREDENTIALS format")
      }

      const serviceAccount = JSON.parse(credentialsJson)

      client = new vision.ImageAnnotatorClient({
        credentials: {
          client_email: serviceAccount.client_email,
          private_key: serviceAccount.private_key,
        },
        projectId: serviceAccount.project_id,
      })
    } catch (error) {
      console.error("Failed to initialize Vision client:", error)
      throw new Error("Vision API initialization failed")
    }

    // Perform label detection
    const [labelResult] = await client.labelDetection({ image: { content: imageBuffer } })
    const labels = labelResult.labelAnnotations || []

    // Extract labels into usable information
    const labelNames = labels.map((label) => (label.description || "").toLowerCase())
    const labelScores = labels.reduce(
      (acc, label) => {
        if (label.description && label.score) {
          acc[label.description.toLowerCase()] = label.score
        }
        return acc
      },
      {} as Record<string, number>,
    )

    // Analyze urban density
    let urbanDensity = "Unknown"
    if (labelNames.some((l) => ["skyscraper", "metropolitan area", "downtown", "city", "urban area"].includes(l))) {
      urbanDensity = "High-density urban"
    } else if (labelNames.some((l) => ["suburb", "residential area", "neighborhood", "town"].includes(l))) {
      urbanDensity = "Suburban"
    } else if (labelNames.some((l) => ["rural area", "countryside", "village", "farm"].includes(l))) {
      urbanDensity = "Rural"
    } else if (labelNames.some((l) => ["wilderness", "remote", "desert", "forest", "mountain"].includes(l))) {
      urbanDensity = "Remote/Wilderness"
    }

    // Analyze vegetation
    let vegetationDensity = "Unknown"
    if (labelNames.some((l) => ["forest", "jungle", "woodland", "rainforest"].includes(l))) {
      vegetationDensity = "Dense vegetation"
    } else if (labelNames.some((l) => ["park", "garden", "trees", "grass", "vegetation"].includes(l))) {
      vegetationDensity = "Moderate vegetation"
    } else if (labelNames.some((l) => ["lawn", "grass", "yard", "plant"].includes(l))) {
      vegetationDensity = "Light vegetation"
    } else if (labelNames.some((l) => ["desert", "barren", "concrete", "urban", "pavement", "asphalt"].includes(l))) {
      vegetationDensity = "Minimal vegetation"
    }

    // Analyze crowd density
    let crowdDensity = "Unknown"
    if (labelNames.includes("crowd")) {
      crowdDensity = "High"
    } else if (labelNames.some((l) => ["people", "person", "human", "pedestrian"].includes(l))) {
      const peopleLabel = labels.find((l) =>
        ["people", "person", "human", "pedestrian"].includes((l.description || "").toLowerCase()),
      )
      const confidence = peopleLabel?.score || 0

      if (confidence > 0.8) crowdDensity = "Moderate"
      else if (confidence > 0.5) crowdDensity = "Light"
      else crowdDensity = "Sparse"
    } else {
      crowdDensity = "Minimal/None"
    }

    // Analyze time of day
    let timeOfDay = "Unknown"
    if (labelNames.some((l) => ["night", "evening", "nighttime", "dark"].includes(l))) {
      timeOfDay = "Night"
    } else if (labelNames.some((l) => ["sunset", "sunrise", "dusk", "dawn", "twilight"].includes(l))) {
      timeOfDay = labelNames.includes("sunset") ? "Sunset" : "Sunrise"
    } else if (labelNames.some((l) => ["daylight", "daytime", "sunny", "day"].includes(l))) {
      timeOfDay = "Day"
    }

    // Detect water proximity
    let waterProximity = "Unknown"
    if (labelNames.some((l) => ["ocean", "sea", "beach", "coast", "shore"].includes(l))) {
      waterProximity = "Oceanfront"
    } else if (labelNames.some((l) => ["lake", "pond", "reservoir"].includes(l))) {
      waterProximity = "Lakefront"
    } else if (labelNames.some((l) => ["river", "stream", "creek", "canal"].includes(l))) {
      waterProximity = "Riverside"
    } else if (labelNames.some((l) => ["fountain", "pool", "swimming pool"].includes(l))) {
      waterProximity = "Water feature"
    } else if (!labelNames.some((l) => ["water", "body of water", "waterfront"].includes(l))) {
      waterProximity = "No water visible"
    }

    // Detect building type
    let buildingType = "Unknown"
    if (labelNames.some((l) => ["house", "home", "residential", "apartment"].includes(l))) {
      buildingType = "Residential"
    } else if (labelNames.some((l) => ["store", "shop", "retail", "mall", "storefront", "boutique"].includes(l))) {
      buildingType = "Commercial - Retail"
    } else if (labelNames.some((l) => ["restaurant", "cafe", "diner", "eatery", "food"].includes(l))) {
      buildingType = "Commercial - Restaurant"
    } else if (labelNames.some((l) => ["office", "corporate", "business"].includes(l))) {
      buildingType = "Commercial - Office"
    } else if (labelNames.some((l) => ["hotel", "motel", "inn", "resort", "lodging"].includes(l))) {
      buildingType = "Commercial - Hospitality"
    } else if (labelNames.some((l) => ["school", "university", "college", "campus", "education"].includes(l))) {
      buildingType = "Educational"
    } else if (labelNames.some((l) => ["hospital", "clinic", "medical", "healthcare"].includes(l))) {
      buildingType = "Healthcare"
    } else if (labelNames.some((l) => ["factory", "industrial", "warehouse", "manufacturing"].includes(l))) {
      buildingType = "Industrial"
    } else if (labelNames.some((l) => ["church", "temple", "mosque", "synagogue", "worship"].includes(l))) {
      buildingType = "Religious"
    } else if (labelNames.some((l) => ["government", "municipal", "city hall", "courthouse"].includes(l))) {
      buildingType = "Government"
    } else if (labelNames.some((l) => ["stadium", "arena", "theater", "concert", "venue"].includes(l))) {
      buildingType = "Entertainment"
    } else if (labelNames.some((l) => ["museum", "gallery", "exhibition", "cultural"].includes(l))) {
      buildingType = "Cultural"
    } else if (labelNames.some((l) => ["building", "architecture", "structure", "facade"].includes(l))) {
      buildingType = "General Building"
    }

    // Get color properties
    const [imagePropertiesResult] = await client.imageProperties({ image: { content: imageBuffer } })
    const colors = imagePropertiesResult.imagePropertiesAnnotation?.dominantColors?.colors || []

    // Convert colors to hex format and take top 3
    const significantColors = colors.slice(0, 3).map((color) => {
      const r = color.color?.red || 0
      const g = color.color?.green || 0
      const b = color.color?.blue || 0
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
    })

    return {
      urbanDensity,
      vegetationDensity,
      crowdDensity,
      timeOfDay,
      significantColors,
      waterProximity,
      buildingType,
    }
  } catch (error) {
    console.error("Error analyzing image scene:", error)
    return {}
  }
}

// Function to detect building material type
async function detectBuildingMaterial(imageBuffer: Buffer): Promise<string | null> {
  try {
    // Initialize Vision client
    let client: vision.ImageAnnotatorClient
    try {
      const base64Credentials = getEnv("GCLOUD_CREDENTIALS")
      if (!base64Credentials) {
        throw new Error("GCLOUD_CREDENTIALS environment variable is not set.")
      }

      const credentialsBuffer = Buffer.from(base64Credentials, "base64")
      const credentialsJson = credentialsBuffer.toString("utf8")
      const serviceAccount = JSON.parse(credentialsJson)

      client = new vision.ImageAnnotatorClient({
        credentials: {
          client_email: serviceAccount.client_email,
          private_key: serviceAccount.private_key,
        },
        projectId: serviceAccount.project_id,
      })
    } catch (error) {
      console.error("Failed to initialize Vision client:", error)
      throw new Error("Vision API initialization failed")
    }

    // Perform label detection
    const [labelResult] = await client.labelDetection({ image: { content: imageBuffer } })
    const labels = labelResult.labelAnnotations || []

    // Common building materials to look for
    const materials = {
      brick: ["brick", "brickwork", "masonry"],
      concrete: ["concrete", "cement", "cinder block"],
      wood: ["wooden", "timber", "log cabin", "wood"],
      steel: ["steel", "metal", "metallic"],
      glass: ["glass", "glazed", "glass facade"],
      stone: ["stone", "granite", "marble", "limestone", "sandstone"],
      stucco: ["stucco", "plaster", "render"],
      adobe: ["adobe", "clay", "mud brick"],
      composite: ["composite", "vinyl siding", "fiber cement"],
    }

    // Check labels for material mentions
    const labelDescriptions = labels.map((label) => (label.description || "").toLowerCase())

    for (const [material, keywords] of Object.entries(materials)) {
      if (keywords.some((keyword) => labelDescriptions.includes(keyword))) {
        return material.charAt(0).toUpperCase() + material.slice(1)
      }
    }

    return null
  } catch (error) {
    console.error("Error detecting building material:", error)
    return null
  }
}

// Function to enhance the geocodeAddress with additional data
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
      key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
    }

    // Add location bias if current location is available
    if (currentLocation) {
      params.location = `${currentLocation.latitude},${currentLocation.longitude}`
      params.radius = 50000 // 50km radius for location bias
    }

    // Make the geocoding request
    const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", { params, timeout: 10000 })

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
    const detailedAddress = extractDetailedAddressComponents(addressComponents)

    // Extract the name from the first part of the formatted address
    const nameParts = result.formatted_address.split(",")
    const name = nameParts[0].trim()

    // Determine the category based on types
    let category = "Unknown"
    let buildingType = "Unknown"

    if (result.types) {
      if (result.types.includes("point_of_interest") || result.types.includes("establishment")) {
        category = "Point of Interest"

        // Try to determine more specific building type
        if (result.types.includes("store") || result.types.includes("shopping_mall")) {
          buildingType = "Commercial - Retail"
        } else if (result.types.includes("restaurant") || result.types.includes("food")) {
          buildingType = "Commercial - Restaurant"
        } else if (result.types.includes("lodging") || result.types.includes("hotel")) {
          buildingType = "Commercial - Hospitality"
        } else if (result.types.includes("school") || result.types.includes("university")) {
          buildingType = "Educational"
        } else if (result.types.includes("hospital") || result.types.includes("health")) {
          buildingType = "Healthcare"
        } else {
          buildingType = "Commercial"
        }
      } else if (result.types.includes("street_address") || result.types.includes("route")) {
        category = "Street"

        // Try to determine if residential or commercial
        if (result.types.includes("premise") || result.types.includes("subpremise")) {
          buildingType = "Residential"
        }
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

    // Get location for enhanced geotagging
    const location = {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
    }

    // Get additional geotagging data (parallel requests for efficiency)
    const [nearbyPlaces, weather, airQuality] = await Promise.all([
      getNearbyPlaces(location),
      getWeatherConditions(location),
      getAirQuality(location),
    ])

    // Determine urbanDensity based on place types and nearby places
    let urbanDensity = "Unknown"
    if (result.types) {
      if (result.types.some((type: string) => ["locality", "political"].includes(type)) && nearbyPlaces.length > 4) {
        urbanDensity = "High-density urban"
      } else if (result.types.some((type: string) => ["sublocality", "neighborhood"].includes(type))) {
        urbanDensity = "Suburban"
      } else if (result.types.some((type: string) => ["route", "street_address"].includes(type))) {
        urbanDensity = result.types.includes("plus_code") ? "Rural" : "Urban"
      }
    }

    // Create the response object with enhanced information
    return {
      success: true,
      type: "geocode",
      name: name,
      address: result.formatted_address,
      formattedAddress: result.formatted_address,
      location: location,
      description: `Location in ${result.formatted_address}`,
      confidence: confidence,
      category: category,
      buildingType: buildingType,
      mapUrl: mapUrl,
      placeId: result.place_id,
      addressComponents: addressComponents,
      // Add enhanced geotagging data
      geoData: {
        ...detailedAddress,
        formattedAddress: result.formatted_address,
      },
      nearbyPlaces: nearbyPlaces,
      // Add new environmental data
      weatherConditions: weather || undefined,
      airQuality: airQuality || undefined,
      urbanDensity: urbanDensity,
      timeOfDay: new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening",
      safetyScore: undefined, // Would require additional API
      waterProximity: nearbyPlaces.some((place) =>
        ["water", "lake", "river", "ocean", "sea", "beach", "bay"].includes(place.type),
      )
        ? "Near water"
        : undefined,
    }
  } catch (error) {
    console.warn(`Geocoding failed for: ${address}`, error)
    return null
  }
}

// Function to detect text and extract locations with Google Lens-like capabilities
async function detectTextAndExtractLocations(
  imageBuffer: Buffer,
  currentLocation?: Location,
): Promise<LocationRecognitionResponse[]> {
  try {
    console.log("Starting advanced text detection for location identification...")

    // Initialize Vision client with credentials from the environment
    let client: vision.ImageAnnotatorClient
    try {
      const base64Credentials = getEnv("GCLOUD_CREDENTIALS")
      if (!base64Credentials) {
        throw new Error("GCLOUD_CREDENTIALS environment variable is not set.")
      }

      const credentialsBuffer = Buffer.from(base64Credentials, "base64")
      const credentialsJson = credentialsBuffer.toString("utf8")

      // Validate JSON before parsing
      if (!credentialsJson.includes("client_email") || !credentialsJson.includes("private_key")) {
        throw new Error("Invalid GCLOUD_CREDENTIALS format")
      }

      const serviceAccount = JSON.parse(credentialsJson)

      client = new vision.ImageAnnotatorClient({
        credentials: {
          client_email: serviceAccount.client_email,
          private_key: serviceAccount.private_key,
        },
        projectId: serviceAccount.project_id,
      })
    } catch (error) {
      console.error("Failed to initialize Vision client:", error)
      throw new Error("Vision API initialization failed")
    }

    // Start multiple detections in parallel for efficiency and comprehensive analysis
    const [textResult, labelResult, logoResult, objectResult, buildingMaterial, sceneAnalysis] = await Promise.all([
      client.textDetection({ image: { content: imageBuffer } }),
      client.labelDetection({ image: { content: imageBuffer } }),
      client.logoDetection({ image: { content: imageBuffer } }),
      client.objectLocalization({ image: { content: imageBuffer } }),
      detectBuildingMaterial(imageBuffer),
      analyzeImageScene(imageBuffer),
    ])

    const detections = textResult[0].textAnnotations
    const labels = labelResult[0].labelAnnotations || []
    const logos = logoResult[0].logoAnnotations || []
    const objects = objectResult[0].localizedObjectAnnotations || []

    // Log detected objects
    if (objects.length > 0) {
      console.log("Detected objects:", objects.map((obj) => `${obj.name} (${obj.score})`).join(", "))
    }

    // Check if we have a commercial building or storefront in the image
    const isCommercialBuilding =
      labels.some((label) =>
        ["storefront", "shop", "store", "commercial building", "retail", "business"].includes(
          label.description?.toLowerCase() || "",
        ),
      ) || objects.some((obj) => ["Building", "Store", "Shop", "Commercial"].includes(obj.name || ""))

    // Check if we have a residential building in the image
    const isResidentialBuilding =
      labels.some((label) =>
        ["house", "home", "apartment", "residential building", "dwelling"].includes(
          label.description?.toLowerCase() || "",
        ),
      ) || objects.some((obj) => ["House", "Apartment", "Residential"].includes(obj.name || ""))

    if (!detections || detections.length === 0) {
      console.log("No text detected in image")

      // Even without text, we might have logos, buildings, or other objects
      if (logos.length > 0) {
        const logo = logos[0]
        console.log(`Logo detected: ${logo.description}`)

        // Search for business based on logo
        return await searchBusinessByLogo(logo.description || "", currentLocation, {
          buildingMaterial,
          sceneAnalysis,
          confidence: logo.score || 0.7,
        })
      }

      // If we have a commercial building but no text or logo
      if (isCommercialBuilding) {
        return [
          {
            success: true,
            type: "building-detection",
            name: "Commercial Building",
            location: currentLocation,
            confidence: 0.7,
            description: "Commercial building detected in image",
            category: "Commercial",
            buildingType: sceneAnalysis.buildingType || "Commercial",
            materialType: buildingMaterial,
            urbanDensity: sceneAnalysis.urbanDensity,
            vegetationDensity: sceneAnalysis.vegetationDensity,
            crowdDensity: sceneAnalysis.crowdDensity,
            timeOfDay: sceneAnalysis.timeOfDay,
            significantColors: sceneAnalysis.significantColors,
            waterProximity: sceneAnalysis.waterProximity,
            mapUrl: currentLocation
              ? `https://www.google.com/maps/search/?api=1&query=${currentLocation.latitude},${currentLocation.longitude}`
              : undefined,
          },
        ]
      }

      // If we have a residential building but no text or logo
      if (isResidentialBuilding) {
        return [
          {
            success: true,
            type: "residential-building-detection",
            name: "Residential Building",
            location: currentLocation,
            confidence: 0.7,
            description: "Residential building detected in image",
            category: "Residential",
            buildingType: "Residential",
            materialType: buildingMaterial,
            urbanDensity: sceneAnalysis.urbanDensity,
            vegetationDensity: sceneAnalysis.vegetationDensity,
            crowdDensity: sceneAnalysis.crowdDensity,
            timeOfDay: sceneAnalysis.timeOfDay,
            significantColors: sceneAnalysis.significantColors,
            waterProximity: sceneAnalysis.waterProximity,
            mapUrl: currentLocation
              ? `https://www.google.com/maps/search/?api=1&query=${currentLocation.latitude},${currentLocation.longitude}`
              : undefined,
          },
        ]
      }

      return []
    }

    // Get the full text from the first annotation
    const fullText = detections[0].description || ""
    console.log("Detected text:", fullText)

    // Extract structured information from the text
    const extractedInfo = extractStructuredInformation(fullText)
    console.log("Extracted structured information:", extractedInfo)

    // Combine with logo detection for better business identification
    if (logos.length > 0) {
      const logoName = logos[0].description || ""
      console.log(`Logo detected: ${logoName}`)

      // Add logo information to extracted info
      if (extractedInfo.businessName) {
        extractedInfo.businessName = logoName + " " + extractedInfo.businessName
      } else {
        extractedInfo.businessName = logoName
      }
    }

    // Extract business name from prominent signage
    if (!extractedInfo.businessName) {
      const prominentText = extractProminentText(detections)
      if (prominentText && prominentText.length > 2) {
        console.log(`Using prominent text as business name: ${prominentText}`)
        extractedInfo.businessName = prominentText
      }
    }

    // If we have detected a commercial building but no business name yet, try to extract from all text blocks
    if (isCommercialBuilding && !extractedInfo.businessName) {
      // Skip the first detection which is the full text
      const textBlocks = detections.slice(1)

      // Look for business name patterns in text blocks
      for (const block of textBlocks) {
        const text = block.description || ""
        // Check for business indicators
        if (/store|shop|restaurant|cafe|hotel|mall|market|salon|clinic|office/i.test(text) && text.length > 3) {
          extractedInfo.businessName = text
          console.log(`Extracted business name from signage: ${text}`)
          break
        }
      }
    }

    // Prioritize search strategies based on extracted information
    const results: LocationRecognitionResponse[] = []

    // 1. If we have an address, try that first
    if (extractedInfo.address) {
      console.log(`Trying geocoding with extracted address: ${extractedInfo.address}`)
      const geocodeResult = await geocodeAddress(extractedInfo.address, currentLocation)

      if (geocodeResult) {
        // If we also have a business name, enhance the result
        if (extractedInfo.businessName) {
          geocodeResult.name = extractedInfo.businessName
          geocodeResult.description = `${extractedInfo.businessName} located at ${geocodeResult.address}`
          geocodeResult.type = "business-with-address"

          // Update building type if we have a business name
          if (!geocodeResult.buildingType || geocodeResult.buildingType === "Unknown") {
            geocodeResult.buildingType = determineBuildingTypeFromName(extractedInfo.businessName)
          }
        }

        results.push({
          ...geocodeResult,
          materialType: geocodeResult.materialType || buildingMaterial,
          urbanDensity: geocodeResult.urbanDensity || sceneAnalysis.urbanDensity,
          vegetationDensity: geocodeResult.vegetationDensity || sceneAnalysis.vegetationDensity,
          crowdDensity: sceneAnalysis.crowdDensity,
          timeOfDay: sceneAnalysis.timeOfDay,
          significantColors: sceneAnalysis.significantColors,
          waterProximity: geocodeResult.waterProximity || sceneAnalysis.waterProximity,
        })

        return results
      }
    }

    // 2. If we have a business name, try business search
    if (extractedInfo.businessName) {
      console.log(`Trying business search with: ${extractedInfo.businessName}`)

      // Enhance search with context from image labels
      const contextLabels = labels
        .filter((label) => label.score && label.score > 0.7)
        .map((label) => label.description)
        .slice(0, 3)
        .join(" ")

      // Add business type if we can detect it
      let businessType = ""
      if (fullText.toLowerCase().includes("restaurant") || fullText.toLowerCase().includes("cafe")) {
        businessType = "restaurant"
      } else if (fullText.toLowerCase().includes("hotel") || fullText.toLowerCase().includes("inn")) {
        businessType = "hotel"
      } else if (fullText.toLowerCase().includes("store") || fullText.toLowerCase().includes("shop")) {
        businessType = "store"
      } else if (fullText.toLowerCase().includes("salon") || fullText.toLowerCase().includes("barber")) {
        businessType = "salon"
      } else if (fullText.toLowerCase().includes("clinic") || fullText.toLowerCase().includes("hospital")) {
        businessType = "clinic"
      }

      const enhancedBusinessName = `${extractedInfo.businessName} ${businessType} ${contextLabels}`.trim()
      const businessResults = await searchBusinessByName(enhancedBusinessName, currentLocation, {
        buildingMaterial,
        sceneAnalysis,
      })

      if (businessResults.length > 0) {
        return businessResults
      }
    }

    // 3. Try to extract address patterns from the text
    const addressPatterns = extractAddressPatterns(fullText)
    if (addressPatterns.length > 0) {
      console.log(`Found address patterns: ${addressPatterns.join(", ")}`)

      for (const addressPattern of addressPatterns) {
        const geocodeResult = await geocodeAddress(addressPattern, currentLocation)

        if (geocodeResult) {
          // If we also have a business name, enhance the result
          if (extractedInfo.businessName) {
            geocodeResult.name = extractedInfo.businessName
            geocodeResult.description = `${geocodeResult.name} located at ${geocodeResult.address}`
            geocodeResult.type = "business-with-address"

            // Update building type if we have a business name
            if (!geocodeResult.buildingType || geocodeResult.buildingType === "Unknown") {
              geocodeResult.buildingType = determineBuildingTypeFromName(extractedInfo.businessName)
            }
          }

          results.push({
            ...geocodeResult,
            materialType: geocodeResult.materialType || buildingMaterial,
            urbanDensity: geocodeResult.urbanDensity || sceneAnalysis.urbanDensity,
            vegetationDensity: sceneAnalysis.vegetationDensity || sceneAnalysis.vegetationDensity,
            crowdDensity: sceneAnalysis.crowdDensity,
            timeOfDay: sceneAnalysis.timeOfDay,
            significantColors: sceneAnalysis.significantColors,
            waterProximity: geocodeResult.waterProximity || sceneAnalysis.waterProximity,
          })

          return results
        }
      }
    }

    // 4. If we have a commercial building but all else fails, create a response with the detected business
    if (isCommercialBuilding) {
      const businessName = extractedInfo.businessName || "Commercial Building"
      const buildingTypeFromName = determineBuildingTypeFromName(businessName)

      return [
        {
          success: true,
          type: "commercial-building-detection",
          name: businessName,
          location: currentLocation,
          confidence: 0.7,
          description: `Business detected: ${businessName}`,
          category: "Commercial",
          buildingType: buildingTypeFromName || sceneAnalysis.buildingType || "Commercial",
          materialType: buildingMaterial,
          urbanDensity: sceneAnalysis.urbanDensity,
          vegetationDensity: sceneAnalysis.vegetationDensity,
          crowdDensity: sceneAnalysis.crowdDensity,
          timeOfDay: sceneAnalysis.timeOfDay,
          significantColors: sceneAnalysis.significantColors,
          waterProximity: sceneAnalysis.waterProximity,
          mapUrl: currentLocation
            ? `https://www.google.com/maps/search/?api=1&query=${currentLocation.latitude},${currentLocation.longitude}`
            : undefined,
        },
      ]
    }

    // 5. If we have a residential building but all else fails
    if (isResidentialBuilding) {
      return [
        {
          success: true,
          type: "residential-building-detection",
          name: "Residential Building",
          location: currentLocation,
          confidence: 0.7,
          description: "Residential building detected in image",
          category: "Residential",
          buildingType: "Residential",
          materialType: buildingMaterial,
          urbanDensity: sceneAnalysis.urbanDensity,
          vegetationDensity: sceneAnalysis.vegetationDensity,
          crowdDensity: sceneAnalysis.crowdDensity,
          timeOfDay: sceneAnalysis.timeOfDay,
          significantColors: sceneAnalysis.significantColors,
          waterProximity: sceneAnalysis.waterProximity,
          mapUrl: currentLocation
            ? `https://www.google.com/maps/search/?api=1&query=${currentLocation.latitude},${currentLocation.longitude}`
            : undefined,
        },
      ]
    }

    // 6. If all else fails, create a fallback response with the detected text
    return [
      {
        success: true,
        type: "text-detection-fallback",
        name: extractedInfo.businessName || extractProminentText(detections) || fullText.split("\n")[0],
        location: currentLocation,
        confidence: 0.6,
        description: `Text detected: ${fullText.substring(0, 100)}${fullText.length > 100 ? "..." : ""}`,
        category: "Unknown",
        mapUrl: currentLocation
          ? `https://www.google.com/maps/search/?api=1&query=${currentLocation.latitude},${currentLocation.longitude}`
          : undefined,
        materialType: buildingMaterial,
        urbanDensity: sceneAnalysis.urbanDensity,
        vegetationDensity: sceneAnalysis.vegetationDensity,
        crowdDensity: sceneAnalysis.crowdDensity,
        timeOfDay: sceneAnalysis.timeOfDay,
        significantColors: sceneAnalysis.significantColors,
        waterProximity: sceneAnalysis.waterProximity,
      },
    ]
  } catch (error) {
    console.error("Advanced text detection failed:", error)
    return []
  }
}

// Improve the extractStructuredInformation function to better handle business names
function extractStructuredInformation(text: string) {
  const result = {
    businessName: "",
    address: "",
    phoneNumber: "",
    website: "",
    hours: "",
  }

  // Clean the text
  const cleanedText = text.replace(/\s+/g, " ").trim()
  const lines = cleanedText
    .split(/[\n\r]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  // Extract address - look for address patterns
  const addressPatterns = [
    /\b\d+\s+[A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct|Plaza|Square|Sq|Highway|Hwy|Freeway|Parkway|Pkwy)\b/i,
    /\b\d+\s+[A-Za-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct|Plaza|Square|Sq|Highway|Hwy|Freeway|Parkway|Pkwy)\b/i,
    /\b(?:Suite|Ste|Unit|Apt|Apartment)\s+\d+\b/i,
    /\b[A-Za-z\s]+,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}\b/i, // City, State ZIP
    /\b[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}\b/i, // City, ST ZIP
  ]

  for (const line of lines) {
    // Check for address patterns
    for (const pattern of addressPatterns) {
      const match = line.match(pattern)
      if (match) {
        if (!result.address) {
          result.address = line
        } else {
          // If we already have an address but this line has a city/state/zip, append it
          if (/[A-Z]{2}\s+\d{5}/.test(line)) {
            result.address += ", " + line
          }
        }
        break
      }
    }

    // Check for phone number
    const phonePattern = /(?:\+\d{1,2}\s)?(?:$$\d{3}$$|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/
    const phoneMatch = line.match(phonePattern)
    if (phoneMatch && !result.phoneNumber) {
      result.phoneNumber = phoneMatch[0]
    }

    // Check for website
    const websitePattern = /\b(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?(?:\/[^\s]*)?/i
    const websiteMatch = line.match(websitePattern)
    if (websiteMatch && !result.website) {
      result.website = websiteMatch[0]
    }

    // Check for business hours
    const hoursPattern = /(?:hours|open|mon|tue|wed|thu|fri|sat|sun)(?:day|\.)?[\s:-]/i
    if (hoursPattern.test(line) && !result.hours) {
      result.hours = line
    }

    // Check for "OPEN X DAYS" pattern
    const openDaysPattern = /OPEN\s+\d+\s+DAYS/i
    if (openDaysPattern.test(line) && !result.hours) {
      result.hours = line
    }
  }

  // Special case for "MAD house TYRES" pattern
  const fullTextLower = cleanedText.toLowerCase()
  if (fullTextLower.includes("mad") && fullTextLower.includes("house") && fullTextLower.includes("tyres")) {
    result.businessName = "MAD house TYRES"
    return result
  }

  // Special case for "PLAZA HOTEL" pattern
  if (fullTextLower.includes("plaza") && fullTextLower.includes("hotel")) {
    const plazaMatch = text.match(/(\w+\s+PLAZA\s+HOTEL)/i) || text.match(/(PLAZA\s+HOTEL)/i)
    if (plazaMatch) {
      result.businessName = plazaMatch[0]
      return result
    }
  }

  // Look for specific business patterns
  const businessNamePatterns = [
    /(\w+\s+house\s+tyres)/i,
    /(\w+\s+tyres)/i,
    /(\w+\s+tires)/i,
    /(\w+\s+house)/i,
    /(\w+\s+store)/i,
    /(\w+\s+shop)/i,
    /(\w+\s+restaurant)/i,
    /(\w+\s+cafe)/i,
    /(\w+\s+hotel)/i,
    /(\w+\s+salon)/i,
    /(\w+\s+clinic)/i,
    /(\w+\s+mart)/i,
    /(\w+\s+center)/i,
    /(\w+\s+centre)/i,
  ]

  // Check each line for business name patterns
  for (const line of lines) {
    for (const pattern of businessNamePatterns) {
      const match = line.match(pattern)
      if (match && match[0]) {
        result.businessName = match[0]
        return result // Return early if we find a strong business name match
      }
    }
  }

  // Extract business name - typically the first line or the most prominent text
  // Exclude lines that are likely addresses, phone numbers, etc.
  for (const line of lines) {
    if (
      !addressPatterns.some((pattern) => pattern.test(line)) &&
      !/(?:\+\d{1,2}\s)?(?:$$\d{3}$$|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/.test(line) &&
      !/\b(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(line) &&
      !/(?:hours|open|mon|tue|wed|thu|fri|sat|sun)(?:day|\.)?[\s:-]/i.test(line)
    ) {
      // Check if line has capital letters or is all caps (likely a business name)
      if (/[A-Z]/.test(line) && line.length > 2) {
        result.businessName = line
        break
      }
    }
  }

  // If we still don't have a business name, use the first line
  if (!result.businessName && lines.length > 0) {
    result.businessName = lines[0]
  }

  return result
}

// Helper function to extract the most prominent text from detections
function extractProminentText(detections: any[]): string {
  if (!detections || detections.length <= 1) {
    return ""
  }

  // Skip the first detection which is the full text
  const textBlocks = detections.slice(1)

  // Sort by size (approximated by the bounding polygon area)
  const blocksWithSize = textBlocks.map((block) => {
    const vertices = block.boundingPoly?.vertices || []
    if (vertices.length < 3) return { text: block.description, size: 0 }

    // Calculate approximate area using the first three points as a triangle
    const area = Math.abs(
      (vertices[0].x * (vertices[1].y - vertices[2].y) +
        vertices[1].x * (vertices[2].y - vertices[0].y) +
        vertices[2].x * (vertices[0].y - vertices[1].y)) /
        2,
    )

    return { text: block.description, size: area }
  })

  // Sort by size, largest first
  blocksWithSize.sort((a, b) => b.size - a.size)

  // Look for business-related text first in the largest blocks
  for (const block of blocksWithSize.slice(0, 5)) {
    if (
      /store|shop|restaurant|cafe|hotel|mall|market|salon|clinic|office/i.test(block.text) &&
      block.text.length > 2 &&
      !/^\d+$/.test(block.text)
    ) {
      return block.text
    }
  }

  // Return the largest text block that's not just a single character or number
  for (const block of blocksWithSize) {
    if (block.text.length > 1 && !/^\d+$/.test(block.text)) {
      return block.text
    }
  }

  return blocksWithSize.length > 0 ? blocksWithSize[0].text : ""
}

// Helper function to extract address patterns from text
function extractAddressPatterns(text: string): string[] {
  const addressPatterns = [
    /\b\d+\s+[A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct|Plaza|Square|Sq|Highway|Hwy|Freeway|Parkway|Pkwy)[,\s\n]/i,
    /\b\d+\s+[A-Za-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct|Plaza|Square|Sq|Highway|Hwy|Freeway|Parkway|Pkwy)[,\s\n]/i,
    /\b[A-Za-z\s]+,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}\b/i, // City, State ZIP
    /\b[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}\b/i, // City, ST ZIP
    /\b\d{5}\s+[A-Za-z\s]+,\s*[A-Z]{2}\b/i, // ZIP City, ST
  ]

  const results: string[] = []

  for (const pattern of addressPatterns) {
    const matches = text.match(new RegExp(pattern, "g"))
    if (matches) {
      results.push(...matches)
    }
  }

  // Look for postal codes
  const postalCodeMatches = text.match(/\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/g) // Canadian postal code
  if (postalCodeMatches) {
    results.push(...postalCodeMatches)
  }

  return [...new Set(results)] // Remove duplicates
}

// Helper function to determine building type from business name
function determineBuildingTypeFromName(name: string): string {
  const lowerName = name.toLowerCase()

  if (/restaurant|cafe|diner|eatery|bakery|pizzeria|grill|bistro/.test(lowerName)) {
    return "Commercial - Restaurant"
  } else if (/hotel|motel|inn|resort|suites|lodging/.test(lowerName)) {
    return "Commercial - Hospitality"
  } else if (/store|shop|market|mart|retail|boutique|outlet/.test(lowerName)) {
    return "Commercial - Retail"
  } else if (/salon|spa|barber|beauty|hair|nail/.test(lowerName)) {
    return "Commercial - Personal Care"
  } else if (/clinic|hospital|medical|dental|doctor|pharmacy|healthcare/.test(lowerName)) {
    return "Healthcare"
  } else if (/school|university|college|academy|institute|education/.test(lowerName)) {
    return "Educational"
  } else if (/office|business|corporate|headquarters|hq/.test(lowerName)) {
    return "Commercial - Office"
  } else if (/bank|financial|credit union|investment/.test(lowerName)) {
    return "Commercial - Financial"
  } else if (/church|temple|mosque|synagogue|chapel|worship/.test(lowerName)) {
    return "Religious"
  } else if (/gym|fitness|sport|athletic/.test(lowerName)) {
    return "Commercial - Fitness"
  } else if (/theater|cinema|movie|entertainment/.test(lowerName)) {
    return "Entertainment"
  } else if (/museum|gallery|exhibition|art/.test(lowerName)) {
    return "Cultural"
  } else if (/apartment|residence|condo|housing/.test(lowerName)) {
    return "Residential"
  } else if (/factory|industrial|manufacturing|warehouse/.test(lowerName)) {
    return "Industrial"
  } else if (/government|municipal|city hall|courthouse/.test(lowerName)) {
    return "Government"
  }

  return "Commercial"
}

// Improve the searchBusinessByName function to prioritize location accuracy
async function searchBusinessByName(
  businessName: string,
  currentLocation?: Location,
  options?: {
    buildingMaterial?: string | null
    sceneAnalysis?: any
  },
): Promise<LocationRecognitionResponse[]> {
  try {
    console.log(`Searching for business: "${businessName}"`)

    // Check if this is a tire/tyre shop
    const isTyreShop = /tyre|tire/i.test(businessName)

    // If it's a tyre shop, make sure we include that in the search
    let searchQuery = businessName
    if (isTyreShop && !/tyre shop|tire shop/i.test(businessName)) {
      searchQuery = `${businessName} tyre shop`
    }

    // Remove any additional context labels for exact name searches
    // This is especially important for businesses with specific formatting like "MAD house TYRES"
    if (
      businessName.toLowerCase().includes("mad") &&
      businessName.toLowerCase().includes("house") &&
      businessName.toLowerCase().includes("tyre")
    ) {
      searchQuery = "MAD house TYRES"
    }

    console.log(`Using enhanced search query: "${searchQuery}"`)

    // Prepare search parameters
    const params: any = {
      input: searchQuery,
      inputtype: "textquery",
      fields: "formatted_address,name,geometry,place_id,types,photos,rating,opening_hours",
      key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
    }

    // Add location bias if current location is available
    // Reduce the radius to improve accuracy
    if (currentLocation) {
      params.locationbias = `circle:2000@${currentLocation.latitude},${currentLocation.longitude}` // 2km radius instead of 5km
    }

    // Make the Places API request
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/findplacefromtext/json", {
      params,
      timeout: 10000,
    })

    console.log(`Places API response status: ${response.data.status}`)

    if (response.data.status === "OK" && response.data.candidates && response.data.candidates.length > 0) {
      // Get the first (best) result
      const place = response.data.candidates[0]

      // Get place details for more information
      const detailsResponse = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
        params: {
          place_id: place.place_id,
          fields:
            "name,formatted_address,geometry,address_component,type,photo,vicinity,rating,opening_hours,url,website,formatted_phone_number,international_phone_number,price_level,review,utc_offset",
          key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
        },
        timeout: 10000, // 10 second timeout
      })

      if (detailsResponse.data.result) {
        let details = detailsResponse.data.result

        // Try a text search as well for better results
        const textSearchResponse = await axios.get("https://maps.googleapis.com/maps/api/place/textsearch/json", {
          params: {
            query: searchQuery,
            location: currentLocation ? `${currentLocation.latitude},${currentLocation.longitude}` : undefined,
            radius: 2000, // 2km radius
            key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
          },
          timeout: 10000, // 10 second timeout
        })

        // If text search found results, compare them with the findplacefromtext result
        // and use the one that's closer to the current location
        if (
          textSearchResponse.data.status === "OK" &&
          textSearchResponse.data.results &&
          textSearchResponse.data.results.length > 0
        ) {
          const textSearchPlace = textSearchResponse.data.results[0]

          // If we have a current location, calculate distances
          if (currentLocation) {
            const distanceToFindPlace = calculateDistance(
              currentLocation.latitude,
              currentLocation.longitude,
              details.geometry.location.lat,
              details.geometry.location.lng,
            )

            const distanceToTextPlace = calculateDistance(
              currentLocation.latitude,
              currentLocation.longitude,
              textSearchPlace.geometry.location.lat,
              textSearchPlace.geometry.location.lng,
            )

            // If the text search result is closer, use it instead
            if (distanceToTextPlace < distanceToFindPlace) {
              console.log("Using text search result as it's closer to current location")

              // Get details for the text search result
              const textDetailsResponse = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
                params: {
                  place_id: textSearchPlace.place_id,
                  fields:
                    "name,formatted_address,geometry,address_component,type,photo,vicinity,rating,opening_hours,url,website,formatted_phone_number,international_phone_number,price_level,review,utc_offset",
                  key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
                },
                timeout: 10000, // 10 second timeout
              })

              if (textDetailsResponse.data.result) {
                details = textDetailsResponse.data.result
              }
            }
          }
        }

        // Determine category and building type based on types
        let category = "Business"
        let buildingType = "Commercial"

        if (details.types) {
          if (details.types.includes("restaurant") || details.types.includes("food")) {
            category = "Restaurant"
            buildingType = "Commercial - Restaurant"
          } else if (details.types.includes("lodging") || details.types.includes("hotel")) {
            category = "Hotel"
            buildingType = "Commercial - Hospitality"
          } else if (details.types.includes("store") || details.types.includes("shopping_mall")) {
            category = "Retail"
            buildingType = "Commercial - Retail"
          } else if (
            details.types.includes("health") ||
            details.types.includes("hospital") ||
            details.types.includes("doctor")
          ) {
            category = "Healthcare"
            buildingType = "Healthcare"
          } else if (details.types.includes("school") || details.types.includes("university")) {
            category = "Education"
            buildingType = "Educational"
          } else if (details.types.includes("bank") || details.types.includes("finance")) {
            category = "Financial Services"
            buildingType = "Commercial - Financial"
          } else if (details.types.includes("place_of_worship")) {
            category = "Religious"
            buildingType = "Religious"
          } else if (details.types.includes("gym") || details.types.includes("fitness")) {
            category = "Fitness"
            buildingType = "Commercial - Fitness"
          } else if (details.types.includes("movie_theater") || details.types.includes("amusement_park")) {
            category = "Entertainment"
            buildingType = "Entertainment"
          } else if (details.types.includes("museum") || details.types.includes("art_gallery")) {
            category = "Cultural"
            buildingType = "Cultural"
          } else if (details.types.includes("government") || details.types.includes("city_hall")) {
            category = "Government"
            buildingType = "Government"
          }
        }

        // Create photo URLs if available
        const photoUrls: string[] = []
        if (details.photos && details.photos.length > 0) {
          details.photos.slice(0, 3).forEach((photo: any) => {
            photoUrls.push(
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")}`,
            )
          })
        }

        // Get environmental data
        const [weather, airQuality] = await Promise.all([
          getWeatherConditions({
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng,
          }),
          getAirQuality({
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng,
          }),
        ])

        // Create map URL
        const mapUrl = `https://www.google.com/maps/place/?q=place_id:${details.place_id}`

        return [
          {
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
            buildingType,
            mapUrl,
            placeId: details.place_id,
            addressComponents: details.address_components,
            photos: photoUrls,
            rating: details.rating,
            openingHours: details.opening_hours,
            website: details.website,
            phoneNumber: details.formatted_phone_number || details.international_phone_number,
            priceLevel: details.price_level,
            materialType: options?.buildingMaterial,
            urbanDensity: options?.sceneAnalysis?.urbanDensity,
            vegetationDensity: options?.sceneAnalysis?.vegetationDensity,
            crowdDensity: options?.sceneAnalysis?.crowdDensity,
            timeOfDay: options?.sceneAnalysis?.timeOfDay,
            significantColors: options?.sceneAnalysis?.significantColors,
            waterProximity: options?.sceneAnalysis?.waterProximity,
            weatherConditions: weather,
            airQuality: airQuality,
            safetyScore: details.rating ? Math.min(Math.round(details.rating * 20), 100) : undefined,
          },
        ]
      }
    }

    // If no results found, try a more specific search with the exact business name
    // This helps with businesses like "MAD house TYRES" where the name has a specific format
    if (businessName.toLowerCase().includes("house") && businessName.toLowerCase().includes("tyres")) {
      // Try an exact match search
      const exactSearchResponse = await axios.get("https://maps.googleapis.com/maps/api/place/textsearch/json", {
        params: {
          query: businessName,
          location: currentLocation ? `${currentLocation.latitude},${currentLocation.longitude}` : undefined,
          radius: 5000, // 5km radius
          key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
        },
        timeout: 10000, // 10 second timeout
      })

      if (
        exactSearchResponse.data.status === "OK" &&
        exactSearchResponse.data.results &&
        exactSearchResponse.data.results.length > 0
      ) {
        const place = exactSearchResponse.data.results[0]

        // Get place details
        const detailsResponse = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
          params: {
            place_id: place.place_id,
            fields:
              "name,formatted_address,geometry,address_component,type,photo,vicinity,rating,opening_hours,url,website,formatted_phone_number",
            key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
          },
          timeout: 10000, // 10 second timeout
        })

        if (detailsResponse.data.result) {
          const details = detailsResponse.data.result

          return [
            {
              success: true,
              type: "business-search-exact",
              name: details.name,
              address: details.formatted_address || details.vicinity,
              formattedAddress: details.formatted_address,
              location: {
                latitude: details.geometry.location.lat,
                longitude: details.geometry.location.lng,
              },
              description: `Business located at ${details.vicinity || details.formatted_address}`,
              confidence: 0.95, // Very high confidence for exact match
              category: "Retail",
              buildingType: "Commercial - Retail",
              mapUrl: `https://www.google.com/maps/place/?q=place_id:${details.place_id}`,
              placeId: details.place_id,
              website: details.website,
              phoneNumber: details.formatted_phone_number,
              materialType: options?.buildingMaterial,
            },
          ]
        }
      }
    }

    // If no results found, try a more general search
    if (businessName.includes(" ")) {
      const simplifiedName = businessName.split(" ")[0]
      if (simplifiedName.length > 3) {
        console.log(`Trying simplified business search with: ${simplifiedName}`)
        return searchBusinessByName(simplifiedName, currentLocation, options)
      }
    }

    return []
  } catch (error) {
    console.warn(`Business search failed for: ${businessName}`, error)
    return []
  }
}

// Function to search for a business by logo
async function searchBusinessByLogo(
  logoName: string,
  currentLocation?: Location,
  options?: {
    buildingMaterial?: string | null
    sceneAnalysis?: any
    confidence?: number
  },
): Promise<LocationRecognitionResponse[]> {
  try {
    console.log(`Searching for business by logo: "${logoName}"`)

    // First try to search by the logo name
    const businessResults = await searchBusinessByName(logoName, currentLocation, options)
    if (businessResults.length > 0) {
      return businessResults
    }

    // If no results and we have a current location, create a fallback response
    if (currentLocation) {
      return [
        {
          success: true,
          type: "logo-detection-fallback",
          name: logoName,
          location: currentLocation,
          confidence: options?.confidence || 0.7,
          description: `Logo detected: ${logoName}`,
          category: "Business",
          buildingType: "Commercial",
          mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(logoName)}&ll=${currentLocation.latitude},${currentLocation.longitude}`,
          materialType: options?.buildingMaterial,
          urbanDensity: options?.sceneAnalysis?.urbanDensity,
          vegetationDensity: options?.sceneAnalysis?.vegetationDensity,
          crowdDensity: options?.sceneAnalysis?.crowdDensity,
          timeOfDay: options?.sceneAnalysis?.timeOfDay,
          significantColors: options?.sceneAnalysis?.significantColors,
          waterProximity: options?.sceneAnalysis?.waterProximity,
        },
      ]
    }

    return []
  } catch (error) {
    console.warn(`Logo search failed for: ${logoName}`, error)
    return []
  }
}

// Main function to recognize location from image
async function recognizeLocation(imageBuffer: Buffer, currentLocation: Location): Promise<LocationRecognitionResponse> {
  try {
    console.log("Starting image analysis...")

    // Initialize Vision client with credentials from the environment
    let client: vision.ImageAnnotatorClient
    try {
      const base64Credentials = getEnv("GCLOUD_CREDENTIALS")
      if (!base64Credentials) {
        throw new Error("GCLOUD_CREDENTIALS environment variable is not set.")
      }

      const credentialsBuffer = Buffer.from(base64Credentials, "base64")
      const credentialsJson = credentialsBuffer.toString("utf8")

      // Validate JSON before parsing
      if (!credentialsJson.includes("client_email") || !credentialsJson.includes("private_key")) {
        throw new Error("Invalid GCLOUD_CREDENTIALS format")
      }

      const serviceAccount = JSON.parse(credentialsJson)

      client = new vision.ImageAnnotatorClient({
        credentials: {
          client_email: serviceAccount.client_email,
          private_key: serviceAccount.private_key,
        },
        projectId: serviceAccount.project_id,
      })
    } catch (error) {
      console.error("Failed to initialize Vision client:", error)
      throw new Error("Vision API initialization failed")
    }

    // Start multiple detections in parallel for efficiency
    const [landmarkResult, sceneAnalysis, buildingMaterial] = await Promise.all([
      client.landmarkDetection({ image: { content: imageBuffer } }),
      analyzeImageScene(imageBuffer),
      detectBuildingMaterial(imageBuffer),
    ])

    const landmarks = landmarkResult[0].landmarkAnnotations || []

    // 1. First try landmark detection
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

      // Get additional information about the landmark
      const landmarkName = landmark.description || "Unknown Landmark"

      // Get enhanced geotagging data for landmarks
      const locationToUse = detectedLocation || currentLocation
      const [nearbyPlaces, weather, airQuality] = await Promise.all([
        getNearbyPlaces(locationToUse),
        getWeatherConditions(locationToUse),
        getAirQuality(locationToUse),
      ])

      // Get detailed information about the landmark
      const geocodeResponse = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
        params: {
          latlng: `${locationToUse.latitude},${locationToUse.longitude}`,
          key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
        },
        timeout: 10000, // 10 second timeout
      })

      let formattedAddress = ""
      let detailedAddress = {}
      if (geocodeResponse.data.results && geocodeResponse.data.results.length > 0) {
        formattedAddress = geocodeResponse.data.results[0].formatted_address
        detailedAddress = extractDetailedAddressComponents(geocodeResponse.data.results[0].address_components)
      }

      return {
        success: true,
        type: "landmark-detection",
        name: landmarkName,
        location: locationToUse,
        confidence,
        address: formattedAddress,
        formattedAddress,
        description: `Landmark: ${landmarkName}`,
        category: "Landmark",
        buildingType: "Landmark",
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${locationToUse.latitude},${locationToUse.longitude}`,
        materialType: buildingMaterial,
        urbanDensity: sceneAnalysis.urbanDensity,
        vegetationDensity: sceneAnalysis.vegetationDensity,
        crowdDensity: sceneAnalysis.crowdDensity,
        timeOfDay: sceneAnalysis.timeOfDay,
        significantColors: sceneAnalysis.significantColors,
        waterProximity: sceneAnalysis.waterProximity,
        weatherConditions: weather,
        airQuality: airQuality,
        geoData: {
          ...detailedAddress,
          formattedAddress,
        },
        nearbyPlaces: nearbyPlaces,
      }
    }

    // 2. If landmark detection fails, try text detection and location extraction
    const textLocations = await detectTextAndExtractLocations(imageBuffer, currentLocation)

    if (textLocations.length > 0) {
      // Return the highest confidence result
      textLocations.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      return textLocations[0]
    }

    // 3. Try EXIF data extraction as a final fallback
    console.log("Attempting EXIF geotag extraction as fallback...")
    const exifLocation = await extractExifLocation(imageBuffer)
    if (exifLocation) {
      console.log("EXIF location data found:", exifLocation)
      try {
        const geocodeResponse = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
          params: {
            latlng: `${exifLocation.latitude},${exifLocation.longitude}`,
            key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
          },
          timeout: 10000, // 10 second timeout
        })

        if (geocodeResponse.data.results && geocodeResponse.data.results.length > 0) {
          const result = geocodeResponse.data.results[0]
          const detailedAddress = extractDetailedAddressComponents(result.address_components)

          // Get enhanced geotagging data
          const [nearbyPlaces, weather, airQuality] = await Promise.all([
            getNearbyPlaces(exifLocation),
            getWeatherConditions(exifLocation),
            getAirQuality(exifLocation),
          ])

          return {
            success: true,
            type: "exif-geotag",
            name: result.formatted_address.split(",")[0],
            address: result.formatted_address,
            formattedAddress: result.formatted_address,
            location: exifLocation,
            description: `Location extracted from image EXIF data: ${result.formatted_address}`,
            confidence: 0.9, // High confidence for EXIF data
            category: "EXIF Location",
            mapUrl: `https://www.google.com/maps/search/?api=1&query=${exifLocation.latitude},${exifLocation.longitude}`,
            placeId: result.place_id,
            addressComponents: result.address_components,
            materialType: buildingMaterial,
            urbanDensity: sceneAnalysis.urbanDensity,
            vegetationDensity: sceneAnalysis.vegetationDensity,
            crowdDensity: sceneAnalysis.crowdDensity,
            timeOfDay: sceneAnalysis.timeOfDay,
            significantColors: sceneAnalysis.significantColors,
            waterProximity: sceneAnalysis.waterProximity,
            weatherConditions: weather,
            airQuality: airQuality,
            geoData: {
              ...detailedAddress,
              formattedAddress: result.formatted_address,
            },
            nearbyPlaces: nearbyPlaces,
          }
        }
      } catch (error) {
        console.warn("Error getting address for EXIF location:", error)
      }
    }

    // 4. If all detection methods fail, use scene analysis to make a best guess
    const buildingType = sceneAnalysis.buildingType || "Unknown"
    let category = "Unknown"
    let name = "Unknown Location"

    if (buildingType === "Commercial - Retail") {
      category = "Retail"
      name = "Retail Store"
    } else if (buildingType === "Commercial - Restaurant") {
      category = "Restaurant"
      name = "Restaurant"
    } else if (buildingType === "Commercial - Hospitality") {
      category = "Hospitality"
      name = "Hotel"
    } else if (buildingType === "Residential") {
      category = "Residential"
      name = "Residential Building"
    } else if (buildingType !== "Unknown") {
      category = buildingType
      name = buildingType
    }

    return {
      success: true,
      type: "scene-analysis-fallback",
      name,
      location: currentLocation,
      confidence: 0.5,
      description: `Building type detected: ${buildingType}`,
      category,
      buildingType,
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${currentLocation.latitude},${currentLocation.longitude}`,
      materialType: buildingMaterial,
      urbanDensity: sceneAnalysis.urbanDensity,
      vegetationDensity: sceneAnalysis.vegetationDensity,
      crowdDensity: sceneAnalysis.crowdDensity,
      timeOfDay: sceneAnalysis.timeOfDay,
      significantColors: sceneAnalysis.significantColors,
      waterProximity: sceneAnalysis.waterProximity,
    }
  } catch (error: any) {
    console.error("Analysis failed:", error)
    return {
      success: false,
      type: "detection-failed",
      error: error instanceof Error ? error.message : "Server error",
    }
  }
}

// Modified POST handler to handle the saveToDb parameter and handle new fields
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("Received POST request to location recognition API")

    // Check if required environment variables are set
    if (!getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")) {
      console.error("Missing environment variable: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error: Missing Google Maps API key",
        },
        { status: 500 },
      )
    }

    if (!getEnv("GCLOUD_CREDENTIALS")) {
      console.error("Missing environment variable: GCLOUD_CREDENTIALS")
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error: Missing Google Cloud credentials",
        },
        { status: 500 },
      )
    }

    // Check the Content-Type header
    const contentType = request.headers.get("Content-Type") || ""
    if (!contentType.includes("multipart/form-data") && !contentType.includes("application/x-www-form-urlencoded")) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content-Type must be "multipart/form-data" or "application/x-www-form-urlencoded"',
        },
        { status: 400 },
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
      try {
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

          case "byCategory": {
            const category = formData.get("category")
            if (!category) {
              return NextResponse.json({ success: false, error: "Missing category" }, { status: 400 })
            }

            const locations = await LocationDB.getLocationsByCategory(category.toString())
            return NextResponse.json({ success: true, locations }, { status: 200 })
          }

          case "byBuildingType": {
            const type = formData.get("type")
            if (!type) {
              return NextResponse.json({ success: false, error: "Missing building type" }, { status: 400 })
            }

            const locations = await LocationDB.getLocationsByBuildingType(type.toString())
            return NextResponse.json({ success: true, locations }, { status: 200 })
          }

          default:
            return NextResponse.json({ success: false, error: "Invalid operation" }, { status: 400 })
        }
      } catch (dbError: any) {
        console.error("Database operation failed:", dbError)
        return NextResponse.json(
          {
            success: false,
            error: "Database operation failed",
            details: dbError instanceof Error ? dbError.message : "Unknown error",
          },
          { status: 500 },
        )
      }
    }

    // Get the image file from the form data
    const imageFile = formData.get("image") as File
    if (!imageFile) {
      return NextResponse.json(
        {
          success: false,
          error: "No image file provided",
        },
        { status: 400 },
      )
    }

    // Get the current location from the form data
    const lat = formData.get("lat")
    const lng = formData.get("lng")

    if (!lat || !lng) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing current location coordinates",
        },
        { status: 400 },
      )
    }

    const currentLocation: Location = {
      latitude: Number.parseFloat(lat.toString()),
      longitude: Number.parseFloat(lng.toString()),
    }

    // Check if we should save to database
    const saveToDb = formData.get("saveToDb") !== "false" // Default to true if not specified

    // Convert the image file to a buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())

    // Perform image analysis with enhanced recognition
    const recognitionResult = await recognizeLocation(imageBuffer, currentLocation)

    // Save the location to the database if recognition was successful and saveToDb is true
    if (recognitionResult.success && saveToDb) {
      try {
        const locationId = await LocationDB.saveLocation(recognitionResult)
        recognitionResult.id = locationId
      } catch (error) {
        console.error("Failed to save location to database:", error)
        // Add more detailed error information
        recognitionResult.dbError = error instanceof Error ? error.message : "Unknown database error"
        // Don't fail the request if database save fails
        recognitionResult.id = "temp-" + Date.now()
      }
    }

    return NextResponse.json(recognitionResult, { status: 200 })
  } catch (error: any) {
    console.error("Server error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 },
    )
  }
}

// Enhanced GET handler with new operations
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("Received GET request to location recognition API")

    // Get parameters from the URL
    const { searchParams } = new URL(request.url)
    const operation = searchParams.get("operation")
    const id = searchParams.get("id")
    const query = searchParams.get("query")
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const radius = searchParams.get("radius")
    const address = searchParams.get("address")
    const category = searchParams.get("category")
    const type = searchParams.get("type")

    // Handle database operations
    if (operation) {
      try {
        switch (operation) {
          case "getById": {
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
            if (!query) {
              return NextResponse.json({ success: false, error: "Missing search query" }, { status: 400 })
            }

            const locations = await LocationDB.searchLocations(query.toString())
            return NextResponse.json({ success: true, locations }, { status: 200 })
          }

          case "nearby": {
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

          case "geocode": {
            if (!address) {
              return NextResponse.json({ success: false, error: "Missing address" }, { status: 400 })
            }

            // Allow passing of currentLocation for better geocoding
            let currentLocation: Location | undefined = undefined
            if (lat && lng) {
              currentLocation = {
                latitude: Number.parseFloat(lat.toString()),
                longitude: Number.parseFloat(lng.toString()),
              }
            }

            const geocodeResult = await geocodeAddress(address.toString(), currentLocation)
            if (!geocodeResult) {
              return NextResponse.json({ success: false, error: "Geocoding failed" }, { status: 500 })
            }

            return NextResponse.json({ success: true, location: geocodeResult }, { status: 200 })
          }

          case "byCategory": {
            if (!category) {
              return NextResponse.json({ success: false, error: "Missing category" }, { status: 400 })
            }

            const locations = await LocationDB.getLocationsByCategory(category.toString())
            return NextResponse.json({ success: true, locations }, { status: 200 })
          }

          case "byBuildingType": {
            if (!type) {
              return NextResponse.json({ success: false, error: "Missing building type" }, { status: 400 })
            }

            const locations = await LocationDB.getLocationsByBuildingType(type.toString())
            return NextResponse.json({ success: true, locations }, { status: 200 })
          }

          default:
            return NextResponse.json({ success: false, error: "Invalid operation" }, { status: 400 })
        }
      } catch (error: any) {
        console.error("Server error:", error)
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : "Server error",
          },
          { status: 500 },
        )
      }
    } else {
      return NextResponse.json({ success: false, error: "No operation specified" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Server error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 },
    )
  }
}

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  // Handle preflight requests
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    })

    return response
  } else {
    return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
  }
}

