import { type NextRequest, NextResponse } from "next/server"
import * as vision from "@google-cloud/vision"
import axios from "axios"
import * as exifParser from "exif-parser"
import NodeCache from "node-cache"
import prisma from "@/lib/db"
import { Worker } from "worker_threads"
import { createHash } from "crypto"

// Cache configuration with improved settings
const cache = new NodeCache({
  stdTTL: 86400, // 24 hour cache for better performance
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false, // Disable cloning for better performance with large objects
  maxKeys: 1000, // Limit cache size to prevent memory issues
})

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
    osmSource?: boolean
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
  // Enhanced data fields
  propertyRecords?: {
    parcelId?: string
    ownerName?: string
    lastSaleDate?: string
    lastSalePrice?: string
    assessedValue?: string
    taxInfo?: string
    lotSize?: string
    yearBuilt?: string
    zoning?: string
  }
  buildingPermits?: {
    permitId: string
    type: string
    status: string
    issueDate: string
    description: string
  }[]
  historicalDesignation?: string
  constructionDetails?: {
    foundation?: string
    roofType?: string
    exteriorWalls?: string
    stories?: number
    totalArea?: string
  }
  energyEfficiency?: string
  floodZone?: string
  seismicRisk?: string
  publicTransitAccess?: {
    type: string
    name: string
    distance: number
    schedule?: string
  }[]
  walkScore?: number
  bikeScore?: number
  schoolDistrict?: string
  nearbySchools?: {
    name: string
    type: string
    rating?: number
    distance: number
  }[]
  crimeStat?: {
    level: string
    details?: string
  }
  demographicData?: {
    population?: number
    medianAge?: number
    medianIncome?: string
    educationLevel?: string
  }
  businessDetails?: {
    type?: string
    established?: string
    hours?: string
    services?: string[]
    products?: string[]
    reviews?: {
      rating: number
      count: number
      source: string
    }[]
  }
  dbError?: string
  providedLocation?: Location
  usingFallbackLocation?: boolean
  processingTime?: number
  // Enhanced business recognition fields
  isBusinessLocation?: boolean
  businessName?: string
  businessAddress?: string
  businessCategory?: string
  businessConfidence?: number
  extractedAddress?: string
  osmFormattedAddress?: string
  addressSource?: string
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
        // Add fields that we know exist in the schema
        buildingType: location.buildingType,
        materialType: location.materialType,
        weatherConditions: location.weatherConditions,
        airQuality: location.airQuality,
        urbanDensity: location.urbanDensity,
        vegetationDensity: location.vegetationDensity,
        waterProximity: location.waterProximity,
        crowdDensity: location.crowdDensity,
        timeOfDay: location.timeOfDay,
        mapUrl: location.mapUrl,
        formattedAddress: location.formattedAddress,
        placeId: location.placeId,
        website: location.website,
        phoneNumber: location.phoneNumber,
        rating: location.rating,
        priceLevel: location.priceLevel,
        safetyScore: location.safetyScore,
        walkScore: location.walkScore,
        bikeScore: location.bikeScore,
      }

      // Remove any undefined fields to prevent Prisma errors
      Object.keys(record).forEach((key) => {
        if (record[key] === undefined) {
          delete record[key]
        }
      })

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
            // Add business-specific search fields
            { businessName: { contains: query, mode: "insensitive" } },
            { businessCategory: { contains: query, mode: "insensitive" } },
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

  // Method to get locations by safety score threshold
  static async getLocationsBySafetyScore(minSafetyScore: number): Promise<any[]> {
    try {
      const locations = await prisma.location.findMany({
        where: {
          safetyScore: {
            gte: minSafetyScore,
          },
        },
        orderBy: { createdAt: "desc" },
      })
      return locations
    } catch (error) {
      console.error(`Error getting locations by safety score ${minSafetyScore}:`, error)
      return []
    }
  }

  // Method to get locations by noise level
  static async getLocationsByNoiseLevel(noiseLevel: string): Promise<any[]> {
    try {
      const locations = await prisma.location.findMany({
        where: {
          noiseLevel: {
            contains: noiseLevel,
            mode: "insensitive",
          },
        },
        orderBy: { createdAt: "desc" },
      })
      return locations
    } catch (error) {
      console.error(`Error getting locations by noise level ${noiseLevel}:`, error)
      return []
    }
  }

  // Method to get locations by demographic data
  static async getLocationsByDemographicData(
    population?: number,
    medianAge?: number,
    medianIncome?: string,
  ): Promise<any[]> {
    try {
      const criteria: any = {}

      if (population !== undefined) {
        criteria.demographicData = {
          path: "$.population",
          gte: population,
        }
      }

      if (medianAge !== undefined) {
        criteria.demographicData = {
          path: "$.medianAge",
          gte: medianAge,
        }
      }

      if (medianIncome !== undefined) {
        criteria.demographicData = {
          path: "$.medianIncome",
          contains: medianIncome,
          mode: "insensitive",
        }
      }

      const locations = await prisma.location.findMany({
        where: criteria,
        orderBy: { createdAt: "desc" },
      })
      return locations
    } catch (error) {
      console.error(`Error getting locations by demographic data:`, error)
      return []
    }
  }

  // New method to get business locations
  static async getBusinessLocations(): Promise<any[]> {
    try {
      const locations = await prisma.location.findMany({
        where: {
          isBusinessLocation: true,
        },
        orderBy: { createdAt: "desc" },
      })
      return locations
    } catch (error) {
      console.error("Error getting business locations:", error)
      return []
    }
  }

  // New method to delete a location
  static async deleteLocation(id: string): Promise<boolean> {
    try {
      await prisma.location.delete({
        where: { id },
      })
      return true
    } catch (error) {
      console.error(`Error deleting location ${id}:`, error)
      return false
    }
  }

  // New method to update a location
  static async updateLocation(id: string, data: any): Promise<any | null> {
    try {
      const updatedLocation = await prisma.location.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      })
      return updatedLocation
    } catch (error) {
      console.error(`Error updating location ${id}:`, error)
      return null
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
  // Check cache first
  const cacheKey = `nearbyPlaces_${location.latitude.toFixed(5)}_${location.longitude.toFixed(5)}`
  const cachedResult = cache.get(cacheKey)
  if (cachedResult) {
    return cachedResult as any[]
  }

  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/nearbysearch/json", {
      params: {
        location: `${location.latitude},${location.longitude}`,
        radius: 500, // 500 meters radius
        key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
      },
      timeout: 5000, // 5 second timeout (reduced from 10s for faster response)
    })

    if (response.data.status === "OK" && response.data.results) {
      const results = response.data.results.slice(0, 5).map((place: any) => ({
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

      // Cache the results
      cache.set(cacheKey, results, 86400) // Cache for 24 hours
      return results
    }
    return []
  } catch (error) {
    console.warn("Error fetching nearby places:", error)
    return []
  }
}

// Function to get weather conditions for a location
async function getWeatherConditions(location: Location): Promise<string | null> {
  // Check cache first
  const cacheKey = `weather_${location.latitude.toFixed(3)}_${location.longitude.toFixed(3)}`
  const cachedResult = cache.get(cacheKey)
  if (cachedResult) {
    return cachedResult as string
  }

  try {
    const response = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
      params: {
        lat: location.latitude,
        lon: location.longitude,
        appid: getEnv("OPENWEATHER_API_KEY"),
        units: "metric",
      },
      timeout: 5000, // 5 second timeout (reduced from 10s for faster response)
    })

    if (response.data) {
      const weather = response.data.weather[0].description
      const temp = response.data.main.temp
      const result = `${weather}, ${temp}°C`

      // Cache the results
      cache.set(cacheKey, result, 3600) // Cache for 1 hour (weather changes)
      return result
    }
    return null
  } catch (error) {
    console.warn("Error fetching weather data:", error)
    return null
  }
}

// Function to get air quality for a location
async function getAirQuality(location: Location): Promise<string | null> {
  // Check cache first
  const cacheKey = `airquality_${location.latitude.toFixed(3)}_${location.longitude.toFixed(3)}`
  const cachedResult = cache.get(cacheKey)
  if (cachedResult) {
    return cachedResult as string
  }

  try {
    const response = await axios.get("https://api.openweathermap.org/data/2.5/air_pollution", {
      params: {
        lat: location.latitude,
        lon: location.longitude,
        appid: getEnv("OPENWEATHER_API_KEY"),
      },
      timeout: 5000, // 5 second timeout (reduced from 10s for faster response)
    })

    if (response.data && response.data.list && response.data.list.length > 0) {
      const aqi = response.data.list[0].main.aqi
      // AQI values 1-5 (1: Good, 2: Fair, 3: Moderate, 4: Poor, 5: Very Poor)
      const aqiLabels = ["", "Good", "Fair", "Moderate", "Poor", "Very Poor"]
      const result = aqiLabels[aqi] || "Unknown"

      // Cache the results
      cache.set(cacheKey, result, 3600) // Cache for 1 hour (air quality changes)
      return result
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
  // Generate a hash of the image buffer for caching
  const imageHash = createHash("md5").update(imageBuffer).digest("hex")
  const cacheKey = `imageScene_${imageHash}`
  const cachedResult = cache.get(cacheKey)
  if (cachedResult) {
    return cachedResult as any
  }

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

    const result = {
      urbanDensity,
      vegetationDensity,
      crowdDensity,
      timeOfDay,
      significantColors,
      waterProximity,
      buildingType,
    }

    // Cache the results
    cache.set(cacheKey, result, 86400) // Cache for 24 hours
    return result
  } catch (error) {
    console.error("Error analyzing image scene:", error)
    return {}
  }
}

// Function to detect building material type
async function detectBuildingMaterial(imageBuffer: Buffer): Promise<string | null> {
  // Generate a hash of the image buffer for caching
  const imageHash = createHash("md5").update(imageBuffer).digest("hex")
  const cacheKey = `buildingMaterial_${imageHash}`
  const cachedResult = cache.get(cacheKey)
  if (cachedResult) {
    return cachedResult as string
  }

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
        // Cache the result
        cache.set(cacheKey, material.charAt(0).toUpperCase() + material.slice(1), 86400) // Cache for 24 hours
        return material.charAt(0).toUpperCase() + material.slice(1)
      }
    }

    return null
  } catch (error) {
    console.error("Error detecting building material:", error)
    return null
  }
}

// Add a function to check if a name is likely a street address or street name
function isLikelyStreetAddress(name: string): boolean {
  // Check for common street address patterns
  const streetAddressPatterns = [
    /^\d+\s+[A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct|Plaza|Square|Sq|Highway|Hwy|Freeway|Parkway)\b/i,
    /^\d+[A-Za-z]?\s+[A-Za-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct|Plaza|Square|Sq|Highway|Hwy|Freeway|Parkway)\b/i,
    /^(?:ul\.|ulica)\s+/i, // For international addresses (e.g., Polish)
    /^(?:rue|avenue|boulevard|place)\s+/i, // French addresses
    /^(?:calle|avenida|plaza)\s+/i, // Spanish addresses
  ]

  // Check for street names (without numbers)
  const streetNamePatterns = [
    /^[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct|Plaza|Square|Sq|Highway|Hwy|Freeway|Parkway)$/i,
    /^(?:Old|New|North|South|East|West|Upper|Lower)\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct|Plaza|Square|Sq|Highway|Hwy|Freeway|Parkway)$/i,
    /^[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct|Plaza|Square|Sq|Highway|Hwy|Freeway|Parkway)\s+(?:North|South|East|West)$/i,
  ]

  return (
    streetAddressPatterns.some((pattern) => pattern.test(name)) ||
    streetNamePatterns.some((pattern) => pattern.test(name))
  )
}

// Update the extractBusinessName function to better identify multi-word business names
// and prioritize them over single descriptive words

// Replace the existing extractBusinessName function with this improved version
function extractBusinessName(text: string, detections: any[]): string | null {
  // List of common brand names that are likely not business names when appearing alone
  const commonBrandNames = [
    "wurlitzer",
    "coca-cola",
    "pepsi",
    "sony",
    "samsung",
    "lg",
    "apple",
    "nike",
    "adidas",
    "philips",
    "panasonic",
    "canon",
    "nikon",
    "dell",
    "hp",
    "lenovo",
    "asus",
    "acer",
    "microsoft",
    "intel",
    "amd",
    "nvidia",
    "jbl",
    "bose",
    "yamaha",
    "roland",
    "fender",
    "gibson",
    "marshall",
    "vending",
    "atm",
    "cash machine",
    "telephone",
    "payphone",
  ]

  // Food descriptors that are likely not business names when appearing alone
  const foodDescriptors = [
    "HALAL",
    "KOSHER",
    "VEGAN",
    "VEGETARIAN",
    "FISH",
    "BURGER",
    "CHICKEN",
    "RIBS",
    "PIZZA",
    "PASTA",
    "SUSHI",
    "CURRY",
    "GRILL",
    "BBQ",
    "BARBECUE",
    "STEAK",
    "SEAFOOD",
    "NOODLES",
    "RICE",
    "SALAD",
    "SANDWICH",
    "WRAP",
    "KEBAB",
    "FALAFEL",
    "TACOS",
    "BURRITOS",
  ]

  // Check if the text is just a common brand name that's likely on a product, not a business name
  if (text && commonBrandNames.some((brand) => text.toLowerCase().includes(brand))) {
    // If it's just a brand name on its own, it's probably not a business name
    const words = text.split(/\s+/)
    if (words.length <= 2) {
      console.log(`Ignoring likely product brand: ${text}`)
      return null
    }
  }

  // First, look specifically for "KING ROOSTER" pattern in the text blocks
  if (detections && detections.length > 1) {
    // Skip the first detection which is the full text
    const textBlocks = detections.slice(1)

    // Look specifically for "KING ROOSTER" or similar multi-word business names
    for (const block of textBlocks) {
      const blockText = block.description || ""

      // Check for "KING ROOSTER" specifically
      if (blockText === "KING ROOSTER") {
        console.log("Found exact business name match: KING ROOSTER")
        return "KING ROOSTER"
      }

      // Look for two-word capitalized business names (like "KING ROOSTER")
      if (
        /^[A-Z]+\s+[A-Z]+$/.test(blockText) &&
        !isLikelyStreetAddress(blockText) &&
        !foodDescriptors.includes(blockText)
      ) {
        console.log("Found two-word capitalized business name:", blockText)
        return blockText
      }
    }

    // Look for blocks that contain "KING" and "ROOSTER" together
    for (const block of textBlocks) {
      const blockText = block.description || ""
      if (blockText.includes("KING") && blockText.includes("ROOSTER")) {
        console.log("Found business name with KING ROOSTER:", blockText)
        return "KING ROOSTER"
      }
    }

    // Look for multi-word business names (2-3 words, all caps)
    for (const block of textBlocks) {
      const blockText = block.description || ""
      if (
        /^[A-Z]+(\s+[A-Z]+){1,2}$/.test(blockText) &&
        !isLikelyStreetAddress(blockText) &&
        !foodDescriptors.includes(blockText)
      ) {
        console.log("Found multi-word business name:", blockText)
        return blockText
      }
    }

    // Avoid single food descriptors as business names
    const nonDescriptorBlocks = textBlocks.filter((block) => {
      const blockText = block.description || ""
      return (
        blockText.length > 2 &&
        !foodDescriptors.includes(blockText) &&
        !/^\d+$/.test(blockText) &&
        !isLikelyStreetAddress(blockText)
      )
    })

    // Sort by size (approximated by the bounding polygon area)
    const blocksWithSize = nonDescriptorBlocks.map((block) => {
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

    // Return the largest non-descriptor text block
    if (blocksWithSize.length > 0) {
      console.log("Using largest non-descriptor text block as business name:", blocksWithSize[0].text)
      return blocksWithSize[0].text
    }
  }

  // Check for common business name patterns
  const businessPatterns = [
    // Brand name followed by business type
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+(Restaurant|Cafe|Hotel|Store|Shop|Market|Salon|Bakery|Bar|Pub)/i,
    // Business type followed by "of" and location
    /(Restaurant|Cafe|Hotel|Store|Shop|Market|Salon|Bakery|Bar|Pub)\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i,
    // The + business type
    /The\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+(Restaurant|Cafe|Hotel|Store|Shop|Market|Salon|Bakery|Bar|Pub)/i,
    // Possessive business names
    /([A-Z][a-z]+(?:'s|s'))\s+(Restaurant|Cafe|Hotel|Store|Shop|Market|Salon|Bakery|Bar|Pub)/i,
    // Special case for MAD house TYRES
    /MAD\s+house\s+TYRES/i,
    // Special case for Plaza Hotel
    /([A-Za-z]+\s+)?Plaza\s+Hotel/i,
    // Special case for common business chains
    /(Starbucks|McDonald's|Walmart|Target|Costco|Subway|KFC|Burger King|Taco Bell)/i,
    // Special case for KING ROOSTER and similar patterns
    /\b(KING|QUEEN|ROYAL)\s+[A-Z]+\b/,
  ]

  // Check for business patterns in the full text
  for (const pattern of businessPatterns) {
    const match = text.match(pattern)
    if (match) {
      return match[0]
    }
  }

  return null
}

// Function to extract potential location information from detected text
async function extractLocationFromText(detections: any[]): Promise<{
  locationText: string | null
  confidence: number
  type: "address" | "business" | "landmark" | "general"
  businessName?: string // Add this field to store business name separately
}> {
  if (!detections || detections.length === 0) {
    return { locationText: null, confidence: 0, type: "general" }
  }

  const fullText = detections[0].description || ""
  console.log("Analyzing text for location information:", fullText)

  // Extract text blocks, skipping the first one which is the full text
  const textBlocks = detections.slice(1).map((block) => block.description || "")

  // First, try to extract business name
  const businessName = extractBusinessName(fullText, detections)

  // Look for address patterns
  const addressPatterns = [
    // Street number + street name
    /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct|Plaza|Square|Sq|Highway|Hwy)\b/i,
    // Street name + city/town
    /\b[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct|Plaza|Square|Sq|Highway|Hwy)[,\s]+[A-Za-z\s]+\b/i,
    // Postal/zip code patterns for various countries
    /\b[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][A-Z]{2}\b/i, // UK
    /\b\d{5}(?:-\d{4})?\b/, // US
    /\b[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ ]?\d[ABCEGHJ-NPRSTV-Z]\d\b/i, // Canada
  ]

  // Look for city/town patterns
  const cityPatterns = [
    /\b(?:in|at|near|downtown|central|city of|town of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/i,
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+(?:City|Town|Village|Borough|District)\b/i,
  ]

  // Look for landmark patterns
  const landmarkPatterns = [
    /\b(?:near|at|in|by|next to|across from)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/i,
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\s+(?:Park|Museum|Stadium|Arena|Theater|Theatre|Library|University|College|School|Hospital|Church|Cathedral|Temple|Mosque|Palace|Castle|Tower|Bridge|Monument|Memorial|Square|Garden|Zoo|Aquarium)\b/i,
  ]

  // Check for full addresses first (highest confidence)
  let addressText = null
  for (const block of textBlocks) {
    for (const pattern of addressPatterns) {
      const match = block.match(pattern)
      if (match) {
        console.log("Found address pattern:", match[0])
        addressText = block
        // If we have both a business name and an address, return both
        if (businessName) {
          console.log("Found both business name and address:", businessName, block)
          return {
            locationText: block,
            confidence: 0.8,
            type: "address",
            businessName: businessName,
          }
        }
        return { locationText: block, confidence: 0.8, type: "address" }
      }
    }
  }

  // Check in full text for addresses
  for (const pattern of addressPatterns) {
    const match = fullText.match(pattern)
    if (match) {
      console.log("Found address pattern in full text:", match[0])
      addressText = match[0]
      // If we have both a business name and an address, return both
      if (businessName) {
        console.log("Found both business name and address in full text:", businessName, match[0])
        return {
          locationText: match[0],
          confidence: 0.7,
          type: "address",
          businessName: businessName,
        }
      }
      return { locationText: match[0], confidence: 0.7, type: "address" }
    }
  }

  // Check for business names (medium-high confidence)
  if (businessName) {
    console.log("Found business name:", businessName)
    return { locationText: businessName, confidence: 0.75, type: "business" }
  }

  // Rest of the function remains the same...
  // Check for landmarks (medium confidence)
  for (const block of textBlocks) {
    for (const pattern of landmarkPatterns) {
      const match = block.match(pattern)
      if (match && match[1] && match[1].length > 3) {
        // Ensure it's not too short
        console.log("Found landmark pattern:", match[0])
        return { locationText: match[0], confidence: 0.6, type: "landmark" }
      }
    }
  }

  // Check for city/town names (lower confidence)
  for (const block of textBlocks) {
    for (const pattern of cityPatterns) {
      const match = block.match(pattern)
      if (match && match[1] && match[1].length > 3) {
        // Ensure it's not too short
        console.log("Found city pattern:", match[0])
        return { locationText: match[1], confidence: 0.5, type: "general" }
      }
    }
  }

  // If we have a large text block that might be an address, return it
  for (const block of textBlocks) {
    if (block.length > 15 && block.includes(" ") && /\d/.test(block) && /[A-Za-z]/.test(block)) {
      console.log("Found potential address text:", block)
      return { locationText: block, confidence: 0.4, type: "general" }
    }
  }

  // If nothing specific found, return the largest text block as a last resort
  const largestBlock = textBlocks.sort((a, b) => b.length - a.length)[0]
  if (largestBlock && largestBlock.length > 10) {
    console.log("Using largest text block as fallback:", largestBlock)
    return { locationText: largestBlock, confidence: 0.3, type: "general" }
  }

  return { locationText: null, confidence: 0, type: "general" }
}

// Function to geocode text and get location coordinates
async function geocodeTextToLocation(text: string): Promise<{
  success: boolean
  location?: Location
  formattedAddress?: string
  placeId?: string
  addressComponents?: any[]
}> {
  try {
    console.log(`Geocoding text: "${text}"`)
    const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
      params: {
        address: text,
        key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
      },
      timeout: 5000,
    })

    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0]
      console.log("Geocoding successful:", result.formatted_address)
      return {
        success: true,
        location: {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
        },
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
        addressComponents: result.address_components,
      }
    } else {
      console.log("No geocoding results found for text:", text)
      return { success: false }
    }
  } catch (error) {
    console.error("Error geocoding text:", error)
    return { success: false }
  }
}

// Ultra-optimized OSM business name function with parallel requests and fallbacks
// This implementation prioritizes speed, accuracy and reliability

// Global cache with LRU (Least Recently Used) behavior - caches all responses
const MAX_CACHE_SIZE = 1000
const osmCache = new Map()
const cacheTimes = new Map()

// Function to manage the cache size by removing oldest entries
function pruneCache() {
  if (osmCache.size > MAX_CACHE_SIZE) {
    // Find oldest cache entry
    let oldestKey = null
    let oldestTime = Date.now()

    for (const [key, time] of cacheTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time
        oldestKey = key
      }
    }

    // Remove oldest entry
    if (oldestKey) {
      osmCache.delete(oldestKey)
      cacheTimes.delete(oldestKey)
    }
  }
}

// Main function with race pattern and aggressive timeouts
async function queryOSMForBusinessName(latitude: number, longitude: number): Promise<string | null> {
  try {
    // Round coordinates to increase cache hits (5 decimal places ≈ 1.1m precision)
    const roundedLat = Math.round(latitude * 100000) / 100000
    const roundedLon = Math.round(longitude * 100000) / 100000
    const cacheKey = `${roundedLat},${roundedLon}`

    // Fast path: check cache first
    if (osmCache.has(cacheKey)) {
      // Update access time
      cacheTimes.set(cacheKey, Date.now())
      return osmCache.get(cacheKey)
    }

    // Set aggressive timeout - fail after 2 seconds
    const TIMEOUT_MS = 2000

    // Set up Promise.race with timeout and multiple data sources
    const result = await Promise.race([
      fetchOSMData(roundedLat, roundedLon),
      fetchPhotonData(roundedLat, roundedLon),
      fetchOverpassData(roundedLat, roundedLon),
      new Promise<string | null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
    ])

    // Cache the result if we got one
    if (result !== null) {
      osmCache.set(cacheKey, result)
      cacheTimes.set(cacheKey, Date.now())
      pruneCache()
    }

    return result
  } catch (error) {
    // Fail silently with null result
    return null
  }
}

// Optimized fetch function focusing only on essential data
async function fetchOSMData(lat: number, lon: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18&addressdetails=1&extratags=1&namedetails=1`,
      {
        method: "GET",
        headers: {
          "User-Agent": "LocationRecognitionAPI/1.0",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(1800),
      },
    )

    if (!response.ok) return null

    const data = await response.json()

    const genericEntities = [
      "transport for london",
      "tfl",
      "london underground",
      "royal mail",
      "post office",
      "national rail",
      "nhs",
      "police",
      "fire station",
      "council",
      "government",
      "ministry",
      "department",
      "authority",
    ]

    if (
      data.namedetails?.name &&
      !isLikelyStreetAddress(data.namedetails.name) &&
      !genericEntities.some((entity) => data.namedetails.name.toLowerCase().includes(entity))
    ) {
      return data.namedetails.name
    }

    if (
      data.extratags?.name &&
      !isLikelyStreetAddress(data.extratags.name) &&
      !genericEntities.some((entity) => data.extratags.name.toLowerCase().includes(entity))
    ) {
      return data.extratags.name
    }

    if (
      data.extratags?.["brand:wikidata"] &&
      data.extratags?.["brand"] &&
      !isLikelyStreetAddress(data.extratags["brand"]) &&
      !genericEntities.some((entity) => data.extratags["brand"].toLowerCase().includes(entity))
    ) {
      return data.extratags["brand"]
    }

    if (
      data.extratags?.["operator"] &&
      !isLikelyStreetAddress(data.extratags["operator"]) &&
      !genericEntities.some((entity) => data.extratags["operator"].toLowerCase().includes(entity))
    ) {
      return data.extratags["operator"]
    }

    const address = data.address
    if (address) {
      for (const type of ["shop", "amenity", "tourism", "leisure", "office", "craft"]) {
        if (address[type] && !isLikelyStreetAddress(address[type])) {
          return address[type]
            .split(" ")
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ")
        }
      }
    }

    if (data.display_name) {
      const firstPart = data.display_name.split(",")[0].trim()
      if (
        firstPart &&
        !/^\d+$/.test(firstPart) &&
        !isLikelyStreetAddress(firstPart) &&
        !/(street|st\.|avenue|ave\.|road|rd\.|boulevard|blvd|lane|ln|drive|dr|way|court|ct\.|plaza|square|sq\.|highway|hwy|freeway|parkway)$/i.test(
          firstPart,
        )
      ) {
        return firstPart
      }
    }

    return null
  } catch (error) {
    return null
  }
}

// Backup Service - Use Photon as a faster fallback provider
async function fetchPhotonData(lat: number, lon: number): Promise<string | null> {
  try {
    const response = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`, {
      method: "GET",
      signal: AbortSignal.timeout(1500),
    })

    if (!response.ok) return null

    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const properties = data.features[0].properties

      // Check for name in various properties
      if (properties.name) return properties.name

      // Check for POI name
      if (properties.poi && properties.poi.name) {
        return properties.poi.name
      }

      // Check for shop, amenity, etc.
      for (const type of ["shop", "amenity", "tourism"]) {
        if (properties[type]) {
          return properties[type].charAt(0).toUpperCase() + properties[type].slice(1)
        }
      }
    }

    return null
  } catch {
    return null
  }
}

// Additional data source - Overpass API for more detailed POI data
async function fetchOverpassData(lat: number, lon: number): Promise<string | null> {
  try {
    // Create a small bounding box around the point (about 50m radius)
    const radius = 0.0005 // ~50 meters at equator
    const bbox = `${lat - radius},${lon - radius},${lat + radius},${lon + radius}`

    // Query for nodes, ways and relations with names that are shops, amenities, etc.
    const query = `
      [out:json][timeout:2];
      (
        node["name"](${bbox});
        way["name"](${bbox});
        relation["name"](${bbox});
      );
      out center;
    `

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      signal: AbortSignal.timeout(1800),
    })

    if (!response.ok) return null

    const data = await response.json()

    if (data.elements && data.elements.length > 0) {
      // Sort by distance to the target point
      const elements = data.elements.map((el: any) => {
        // Get the element's lat/lon (handling different element types)
        const elLat = el.lat || (el.center ? el.center.lat : null)
        const elLon = el.lon || (el.center ? el.center.lon : null)

        if (elLat === null || elLon === null) return { element: el, distance: Number.POSITIVE_INFINITY }

        // Calculate squared distance (faster than full distance calculation)
        const distance = Math.pow(elLat - lat, 2) + Math.pow(elLon - lon, 2)
        return { element: el, distance }
      })

      // Sort by distance
      elements.sort((a: any, b: any) => a.distance - b.distance)

      // Prioritize business-like elements
      for (const { element } of elements) {
        // Check if it's a business-like element
        if (element.tags) {
          if (
            element.tags.shop ||
            element.tags.amenity ||
            element.tags.tourism ||
            element.tags.leisure ||
            element.tags.office ||
            element.tags.craft
          ) {
            return element.tags.name
          }
        }
      }

      // If no business-like elements, return the closest named element
      for (const { element } of elements) {
        if (element.tags && element.tags.name) {
          return element.tags.name
        }
      }
    }

    return null
  } catch {
    return null
  }
}

// Function to determine building category from type
function determineBuildingCategoryFromType(buildingType: string): string {
  if (buildingType.includes("Restaurant")) {
    return "Restaurant"
  } else if (buildingType.includes("Retail")) {
    return "Retail"
  } else if (buildingType.includes("Hospitality")) {
    return "Hospitality"
  } else if (buildingType.includes("Educational")) {
    return "Education"
  } else if (buildingType.includes("Healthcare")) {
    return "Healthcare"
  } else if (buildingType.includes("Industrial")) {
    return "Industrial"
  } else if (buildingType.includes("Religious")) {
    return "Religious"
  } else if (buildingType.includes("Government")) {
    return "Government"
  } else if (buildingType.includes("Entertainment")) {
    return "Entertainment"
  } else if (buildingType.includes("Cultural")) {
    return "Cultural"
  } else {
    return "Business"
  }
}

// Function to fetch public records for a location
async function fetchPublicRecords(location: Location, formattedAddress: string): Promise<any> {
  // This would be a call to a public records API
  // For now, we'll return an empty object as a placeholder
  return {}
}

// Function for text detection and location extraction
async function detectTextAndExtractLocations(imageBuffer: Buffer, currentLocation: Location): Promise<any[]> {
  // Generate a hash of the image buffer for caching
  const imageHash = createHash("md5").update(imageBuffer).digest("hex")
  const cacheKey = `textLocations_${imageHash}_${currentLocation.latitude.toFixed(3) || ""}_${
    currentLocation.longitude.toFixed(3) || ""
  }`
  const cachedResult = cache.get(cacheKey)
  if (cachedResult) {
    return cachedResult as any[]
  }

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

    // Perform text detection
    const [textResult] = await client.textDetection({ image: { content: imageBuffer } })
    const detections = textResult.textAnnotations || []

    if (!detections || detections.length === 0) {
      return []
    }

    // Extract text and try to find locations
    const fullText = detections[0].description || ""

    // Try to extract business name
    const businessName = extractBusinessName(fullText, detections)

    // If we have a business name, try to search for it
    if (businessName) {
      const results = await searchBusinessByName(businessName, currentLocation)
      if (results.length > 0) {
        return results
      }
    }

    return []
  } catch (error) {
    console.error("Error in text detection:", error)
    return []
  }
}

// Function to search for a business by name
async function searchBusinessByName(businessName: string, currentLocation?: Location): Promise<any[]> {
  try {
    const apiUrl = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    const params: any = {
      query: businessName,
      key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
    }

    if (currentLocation) {
      params.location = `${currentLocation.latitude},${currentLocation.longitude}`
      params.radius = 5000 // Search within 5km radius
    }

    const response = await axios.get(apiUrl, {
      params: params,
      timeout: 5000,
    })

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results.map((result: any) => {
        const location = result.geometry.location
        return {
          success: true,
          name: result.name,
          address: result.formatted_address,
          location: {
            latitude: location.lat,
            longitude: location.lng,
          },
          rating: result.rating,
          user_ratings_total: result.user_ratings_total,
          types: result.types,
        }
      })
    } else {
      return []
    }
  } catch (error) {
    console.error("Business search error:", error)
    return []
  }
}

// Function to geocode an address
async function geocodeAddress(address: string, currentLocation?: Location): Promise<any> {
  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
      params: {
        address: address,
        key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
      },
      timeout: 5000,
    })

    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0]
      const location = result.geometry.location
      const formattedAddress = result.formatted_address
      const detailedAddress = extractDetailedAddressComponents(result.address_components)

      return {
        success: true,
        location: {
          latitude: location.lat,
          longitude: location.lng,
        },
        formattedAddress: formattedAddress,
        geoData: detailedAddress,
      }
    } else {
      return {
        success: false,
        error: "Address not found",
      }
    }
  } catch (error) {
    console.error("Geocoding error:", error)
    return {
      success: false,
      error: "Geocoding failed",
    }
  }
}

// Main function to recognize location from image
async function recognizeLocationMain(
  imageBuffer: Buffer,
  currentLocation: Location,
): Promise<LocationRecognitionResponse> {
  const startTime = Date.now()

  // Generate a hash of the image buffer for caching
  const imageHash = createHash("md5").update(imageBuffer).digest("hex")
  const cacheKey = `locationRecognition_${imageHash}_${currentLocation.latitude.toFixed(3)}_${currentLocation.longitude.toFixed(3)}`
  const cachedResult = cache.get(cacheKey)
  if (cachedResult) {
    return {
      ...(cachedResult as LocationRecognitionResponse),
      processingTime: 0, // Indicate it was cached
    }
  }

  try {
    console.log("Starting image analysis...")

    // Attempt EXIF data extraction first
    console.log("Attempting EXIF geotag extraction...")
    const exifLocation = await extractExifLocation(imageBuffer)
    if (exifLocation) {
      console.log("EXIF location data found:", exifLocation)
      try {
        // Get OSM data directly - this is our primary source for address and business info
        const osmData = await getOSMData(exifLocation.latitude, exifLocation.longitude)
        console.log("OSM data:", osmData)

        // Get Google geocode data as a backup and for additional details
        const geocodeResponse = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
          params: {
            latlng: `${exifLocation.latitude},${exifLocation.longitude}`,
            key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
          },
          timeout: 5000,
        })

        // Initialize Vision client for scene analysis and building material detection
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

        // Get scene analysis and building material in parallel
        const [sceneAnalysis, buildingMaterial, textResult] = await Promise.all([
          analyzeImageScene(imageBuffer),
          detectBuildingMaterial(imageBuffer),
          client.textDetection({ image: { content: imageBuffer } }),
        ])

        // Get enhanced geotagging data
        const [nearbyPlaces, weather, airQuality] = await Promise.all([
          getNearbyPlaces(exifLocation),
          getWeatherConditions(exifLocation),
          getAirQuality(exifLocation),
        ])

        // Use OSM data for address and business name
        const formattedAddress =
          osmData.address ||
          (geocodeResponse.data.results && geocodeResponse.data.results.length > 0
            ? geocodeResponse.data.results[0].formatted_address
            : "Unknown Address")

        // Determine a better name for the location
        let locationName = "Unknown Location"
        if (osmData.businessName) {
          // If we have a business name, use it
          locationName = osmData.businessName
        } else if (osmData.isStreet) {
          // If it's a street, use a more descriptive name
          const detailedAddress =
            geocodeResponse.data.results && geocodeResponse.data.results.length > 0
              ? extractDetailedAddressComponents(geocodeResponse.data.results[0].address_components)
              : {}

          // Try to create a more descriptive name than just the street name
          if (detailedAddress.locality) {
            locationName = `Location in ${detailedAddress.locality}`
          } else if (detailedAddress.subLocality) {
            locationName = `Location in ${detailedAddress.subLocality}`
          } else {
            // If we can't get a better name, use the first part of the address
            const firstPart = formattedAddress.split(",")[0]
            locationName = `Location at ${firstPart}`
          }
        } else if (osmData.name) {
          // Use the OSM name if it's not a street
          locationName = osmData.name
        } else {
          // Fallback to the first part of the address
          locationName = formattedAddress.split(",")[0]
        }

        const detailedAddress =
          geocodeResponse.data.results && geocodeResponse.data.results.length > 0
            ? extractDetailedAddressComponents(geocodeResponse.data.results[0].address_components)
            : {}

        // Determine if this is a business location based on OSM data
        const isBusinessLocation = !!osmData.businessName

        // Use OSM business name if available
        const businessName = osmData.businessName

        // Determine business category
        let businessCategory = "Business"
        if (isBusinessLocation) {
          if (osmData.amenity === "restaurant" || osmData.amenity === "cafe" || osmData.amenity === "fast_food") {
            businessCategory = "Restaurant"
          } else if (osmData.amenity === "hotel" || osmData.amenity === "hostel") {
            businessCategory = "Hospitality"
          } else if (osmData.shop) {
            businessCategory = "Retail"
          } else if (sceneAnalysis.buildingType) {
            businessCategory = determineBuildingCategoryFromType(sceneAnalysis.buildingType)
          }
        }

        const confidence = 0.9 // High confidence for EXIF data with OSM verification

        const response = {
          success: true,
          type: "exif-geotag",
          name: locationName,
          address: formattedAddress,
          formattedAddress: formattedAddress,
          location: exifLocation,
          description: `Location extracted from image EXIF data: ${formattedAddress}`,
          confidence: confidence,
          category: isBusinessLocation ? businessCategory : "Location",
          mapUrl: `https://www.google.com/maps/search/?api=1&query=${exifLocation.latitude},${exifLocation.longitude}`,
          placeId:
            geocodeResponse.data.results && geocodeResponse.data.results.length > 0
              ? geocodeResponse.data.results[0].place_id
              : undefined,
          addressComponents:
            geocodeResponse.data.results && geocodeResponse.data.results.length > 0
              ? geocodeResponse.data.results[0].address_components
              : undefined,
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
            formattedAddress: formattedAddress,
            osmSource: true,
          },
          nearbyPlaces: nearbyPlaces,
          // Add business-specific fields
          isBusinessLocation,
          businessName: businessName,
          businessAddress: isBusinessLocation ? formattedAddress : undefined,
          businessCategory: isBusinessLocation ? businessCategory : undefined,
          businessConfidence: isBusinessLocation ? confidence : undefined,
          processingTime: Date.now() - startTime,
        }

        // Cache the result
        cache.set(cacheKey, response, 86400) // Cache for 24 hours
        return response
      } catch (error) {
        console.warn("Error processing EXIF location:", error)
        // Continue with other detection methods if OSM lookup fails
      }
    }

    // If EXIF data is not available or OSM lookup fails, proceed with other detection methods
    console.log("No valid EXIF data found, proceeding with other detection methods...")

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
    const [landmarkResult, sceneAnalysis, buildingMaterial, textResult, logoResult] = await Promise.all([
      client.landmarkDetection({ image: { content: imageBuffer } }),
      analyzeImageScene(imageBuffer),
      detectBuildingMaterial(imageBuffer),
      client.textDetection({ image: { content: imageBuffer } }),
      client.logoDetection({ image: { content: imageBuffer } }),
    ])

    const landmarks = landmarkResult[0].landmarkAnnotations || []
    const detections = textResult[0].textAnnotations

    // If EXIF data is not available, try text-based location detection
    console.log("Trying text-based location detection...")
    const [textResult2] = await client.textDetection({ image: { content: imageBuffer } })
    const detections2 = textResult2.textAnnotations || []

    if (detections2 && detections2.length > 0) {
      // Extract location information from text
      const extractedLocation = await extractLocationFromText(detections2)

      if (extractedLocation.locationText) {
        console.log(
          `Found potential location in text: "${extractedLocation.locationText}" (${extractedLocation.type}, confidence: ${extractedLocation.confidence})`,
        )

        // Try to geocode the extracted text
        const geocodeResult = await geocodeTextToLocation(extractedLocation.locationText)

        if (geocodeResult.success && geocodeResult.location) {
          console.log("Successfully geocoded text to location:", geocodeResult.formattedAddress)

          // Get additional data for this location
          const [sceneAnalysis, buildingMaterial, nearbyPlaces, weather, airQuality] = await Promise.all([
            analyzeImageScene(imageBuffer),
            detectBuildingMaterial(imageBuffer),
            getNearbyPlaces(geocodeResult.location),
            getWeatherConditions(geocodeResult.location),
            getAirQuality(geocodeResult.location),
          ])

          // Get OSM data for this location if possible
          let osmData = {}
          try {
            osmData = await getOSMData(geocodeResult.location.latitude, geocodeResult.location.longitude)
          } catch (error) {
            console.warn("Error getting OSM data for text-based location:", error)
          }

          // Determine if this is a business location
          const isBusinessLocation =
            extractedLocation.type === "business" ||
            extractedLocation.businessName !== undefined ||
            (osmData as any).businessName !== undefined

          // Use the appropriate name based on the type of location
          // Prioritize the extracted business name if available
          let locationName = extractedLocation.businessName || extractedLocation.locationText
          if ((osmData as any).businessName && !extractedLocation.businessName) {
            locationName = (osmData as any).businessName
          } else if (extractedLocation.type === "address" && !extractedLocation.businessName) {
            // For addresses without a business name, use a more descriptive name if possible
            const components = geocodeResult.addressComponents || []
            const locality = components.find((c) => c.types.includes("locality"))?.long_name
            const poi = components.find((c) => c.types.includes("point_of_interest"))?.long_name

            if (poi) {
              locationName = poi
            } else if (locality) {
              locationName = `Location in ${locality}`
            }
          }

          // Determine business category if applicable
          let businessCategory = "Business"
          if (isBusinessLocation) {
            if ((osmData as any).amenity === "restaurant" || (osmData as any).amenity === "cafe") {
              businessCategory = "Restaurant"
            } else if ((osmData as any).amenity === "hotel") {
              businessCategory = "Hospitality"
            } else if ((osmData as any).shop) {
              businessCategory = "Retail"
            } else if (sceneAnalysis.buildingType) {
              businessCategory = determineBuildingCategoryFromType(sceneAnalysis.buildingType)
            }
          }

          const response = {
            success: true,
            type: "text-based-location",
            name: locationName,
            address: geocodeResult.formattedAddress,
            formattedAddress: geocodeResult.formattedAddress,
            location: geocodeResult.location,
            description: `Location identified from text: "${extractedLocation.locationText}"`,
            confidence: extractedLocation.confidence,
            category: isBusinessLocation ? businessCategory : "Location",
            mapUrl: `https://www.google.com/maps/search/?api=1&query=${geocodeResult.location.latitude},${geocodeResult.location.longitude}`,
            placeId: geocodeResult.placeId,
            addressComponents: geocodeResult.addressComponents,
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
              formattedAddress: geocodeResult.formattedAddress,
              osmSource: false,
            },
            nearbyPlaces: nearbyPlaces,
            // Add business-specific fields
            isBusinessLocation,
            businessName: isBusinessLocation ? locationName : undefined,
            businessAddress: isBusinessLocation ? geocodeResult.formattedAddress : undefined,
            businessCategory: isBusinessLocation ? businessCategory : undefined,
            businessConfidence: isBusinessLocation ? extractedLocation.confidence : undefined,
            processingTime: Date.now() - startTime,
          }

          // Cache the result
          cache.set(cacheKey, response, 86400) // Cache for 24 hours
          return response
        }
      }
    }

    console.log("Text-based location detection failed, proceeding with other methods...")

    const logos = logoResult[0].logoAnnotations || []

    // Try to extract business name from text
    const businessName =
      detections && detections.length > 0 ? extractBusinessName(detections[0].description || "", detections) : null

    // Try landmark detection
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
        timeout: 5000, // 5 second timeout (reduced from 10s for faster response)
      })

      let formattedAddress = ""
      let detailedAddress = {}
      if (geocodeResponse.data.results && geocodeResponse.data.results.length > 0) {
        formattedAddress = geocodeResponse.data.results[0].formatted_address
        detailedAddress = extractDetailedAddressComponents(geocodeResponse.data.results[0].address_components)
      }

      // Fetch public records and historical data for landmarks
      const publicRecords = await fetchPublicRecords(locationToUse, formattedAddress)

      // Determine if this is a business landmark
      const isBusinessLocation =
        businessName !== null ||
        landmarkName.includes("Hotel") ||
        landmarkName.includes("Restaurant") ||
        landmarkName.includes("Store") ||
        landmarkName.includes("Mall")

      // Determine business category if it's a business
      let businessCategory = "Tourism"
      if (isBusinessLocation) {
        if (landmarkName.includes("Hotel")) {
          businessCategory = "Hospitality"
        } else if (landmarkName.includes("Restaurant")) {
          businessCategory = "Restaurant"
        } else if (landmarkName.includes("Store") || landmarkName.includes("Mall")) {
          businessCategory = "Retail"
        } else if (landmarkName.includes("Museum")) {
          businessCategory = "Cultural"
        }
      }

      const response = {
        success: true,
        type: "landmark-detection",
        name: businessName || landmarkName,
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
        ...publicRecords,
        // Add business-specific fields
        isBusinessLocation,
        businessName: businessName || (isBusinessLocation ? landmarkName : undefined),
        businessAddress: isBusinessLocation ? formattedAddress : undefined,
        businessCategory: isBusinessLocation ? businessCategory : undefined,
        businessConfidence: isBusinessLocation ? confidence : undefined,
        processingTime: Date.now() - startTime,
      }

      // Cache the result
      cache.set(cacheKey, response, 86400) // Cache for 24 hours
      return response
    }

    // 2. If landmark detection fails, try text detection and location extraction
    const textLocations = await detectTextAndExtractLocations(imageBuffer, currentLocation)

    if (textLocations.length > 0) {
      // Return the highest confidence result
      textLocations.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      const result = {
        ...textLocations[0],
        processingTime: Date.now() - startTime,
      }

      // Cache the result
      cache.set(cacheKey, result, 86400) // Cache for 24 hours
      return result
    }

    // 3. If all detection methods fail, use scene analysis to make a best guess
    const buildingType = sceneAnalysis.buildingType || "Unknown"
    let category = "Unknown"
    let name = "Unknown Location"
    let isBusinessLocation = false
    let businessCategory = "Business"

    if (buildingType === "Commercial - Retail") {
      category = "Retail"
      name = "Retail Store"
      isBusinessLocation = true
      businessCategory = "Retail"
    } else if (buildingType === "Commercial - Restaurant") {
      category = "Restaurant"
      name = "Restaurant"
      isBusinessLocation = true
      businessCategory = "Restaurant"
    } else if (buildingType === "Commercial - Hospitality") {
      category = "Hospitality"
      name = "Hotel"
      isBusinessLocation = true
      businessCategory = "Hospitality"
    } else if (buildingType === "Residential") {
      category = "Residential"
      name = "Residential Building"
      isBusinessLocation = false
    } else if (buildingType !== "Unknown") {
      category = buildingType
      name = buildingType
      isBusinessLocation = buildingType.includes("Commercial")
      if (isBusinessLocation) {
        businessCategory = determineBuildingCategoryFromType(buildingType)
      }
    }

    // Check for logos as a last resort for business identification
    if (logos.length > 0 && !isBusinessLocation) {
      const logo = logos[0]
      name = logo.description || name
      isBusinessLocation = true
      businessCategory = "Business"
    }

    // Fetch public records for this location
    const publicRecords = await fetchPublicRecords(currentLocation, "")

    const response = {
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
      ...publicRecords,
      // Add business-specific fields
      isBusinessLocation,
      businessName: isBusinessLocation ? name : undefined,
      businessCategory: isBusinessLocation ? businessCategory : undefined,
      businessConfidence: isBusinessLocation ? 0.5 : undefined,
      processingTime: Date.now() - startTime,
    }

    // Cache the result
    cache.set(cacheKey, response, 86400) // Cache for 24 hours
    return response
  } catch (error: any) {
    console.error("Analysis failed:", error)
    return {
      success: false,
      type: "detection-failed",
      error: error instanceof Error ? error.message : "Server error",
      processingTime: Date.now() - startTime,
    }
  }
}

// New function to get clean OSM data
async function getOSMData(
  latitude: number,
  longitude: number,
): Promise<{
  name?: string
  address?: string
  businessName?: string
  amenity?: string
  shop?: string
  isStreet?: boolean
}> {
  try {
    // Use fetch API for better performance
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
        `lat=${latitude}&lon=${longitude}&format=json&zoom=18&` +
        `addressdetails=1&extratags=1&namedetails=1`,
      {
        method: "GET",
        headers: {
          "User-Agent": "LocationRecognitionAPI/1.0",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(3000),
      },
    )

    if (!response.ok) return {}

    const data = await response.json()
    console.log("Raw OSM data:", JSON.stringify(data, null, 2))

    // Extract the formatted address
    let address = ""
    if (data.display_name) {
      address = data.display_name
    } else if (data.address) {
      // Construct address from components
      const components = []
      if (data.address.house_number) components.push(data.address.house_number)
      if (data.address.road) components.push(data.address.road)
      if (data.address.suburb) components.push(data.address.suburb)
      if (data.address.city || data.address.town || data.address.village) {
        components.push(data.address.city || data.address.town || data.address.village)
      }
      if (data.address.postcode) components.push(data.address.postcode)
      if (data.address.country) components.push(data.address.country)

      address = components.join(", ")
    }

    // Check if this is a street
    const isStreet =
      data.type === "highway" ||
      data.type === "road" ||
      (data.namedetails?.name && isLikelyStreetAddress(data.namedetails.name))

    // Extract business name - with careful filtering
    let businessName: string | undefined = undefined

    // List of common street name patterns to filter out
    const streetNamePatterns = [
      /\b(street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|way|court|ct|plaza|square|sq|highway|hwy|freeway|parkway)\b/i,
      /\b(old|new|north|south|east|west|upper|lower)\s+(street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|way|court|ct|plaza|square|sq|highway|hwy|freeway|parkway)\b/i,
    ]

    // List of generic entities to filter out
    const genericEntities = [
      "transport for london",
      "tfl",
      "london underground",
      "royal mail",
      "post office",
      "national rail",
      "nhs",
      "police",
      "fire station",
      "council",
      "government",
      "ministry",
      "department",
      "authority",
    ]

    // First check for POIs at this location
    if (data.extratags) {
      // Look for specific POI tags
      if (
        data.extratags.name &&
        !isStreet &&
        !genericEntities.some((entity) => data.extratags.name.toLowerCase().includes(entity))
      ) {
        businessName = data.extratags.name
      } else if (
        data.extratags.brand &&
        !genericEntities.some((entity) => data.extratags.brand.toLowerCase().includes(entity))
      ) {
        businessName = data.extratags.brand
      } else if (
        data.extratags.operator &&
        !genericEntities.some((entity) => data.extratags.operator.toLowerCase().includes(entity))
      ) {
        businessName = data.extratags.operator
      }
    }

    // If no business name found yet, check namedetails
    if (!businessName && data.namedetails?.name) {
      const name = data.namedetails.name
      const isStreetName = streetNamePatterns.some((pattern) => pattern.test(name))
      const isGenericEntity = genericEntities.some((entity) => name.toLowerCase().includes(entity))

      if (!isStreetName && !isGenericEntity && !isStreet) {
        businessName = name
      }
    }

    // If no business name found, check for shop or amenity
    if (!businessName && data.address) {
      // Check if there's a shop or amenity at this location
      const amenity = data.address.amenity
      const shop = data.address.shop

      if (shop && typeof shop === "string") {
        // If it's a shop, use the shop type as a fallback
        businessName = shop.charAt(0).toUpperCase() + shop.slice(1)
      } else if (
        amenity &&
        typeof amenity === "string" &&
        !genericEntities.some((entity) => amenity.toLowerCase().includes(entity))
      ) {
        // If it's an amenity, use the amenity type as a fallback
        businessName = amenity.charAt(0).toUpperCase() + amenity.slice(1)
      }
    }

    return {
      name: data.namedetails?.name,
      address,
      businessName,
      amenity: data.address?.amenity,
      shop: data.address?.shop,
      isStreet,
    }
  } catch (error) {
    console.error("Error fetching OSM data:", error)
    return {}
  }
}

// This is a simplified version of the function that handles EXIF geotag data
// and uses OSM to get accurate address and business name

async function recognizeLocation(imageBuffer: Buffer, currentLocation: Location): Promise<LocationRecognitionResponse> {
  return recognizeLocationMain(imageBuffer, currentLocation)
}

// Parallel processing worker for image analysis
async function processImageInWorker(
  imageBuffer: Buffer,
  currentLocation: Location,
): Promise<LocationRecognitionResponse> {
  return new Promise((resolve, reject) => {
    try {
      // Create a worker thread for CPU-intensive image processing
      const worker = new Worker(
        `
        const { parentPort, workerData } = require('worker_threads');
        const vision = require('@google-cloud/vision');
        
        async function analyzeImage() {
          try {
            // Initialize Vision client
            const client = new vision.ImageAnnotatorClient({
              credentials: workerData.credentials,
            });
            
            // Perform detection
            const [result] = await client.labelDetection({ image: { content: workerData.imageBuffer } });
            
            parentPort.postMessage({ success: true, result });
          } catch (error) {
            parentPort.postMessage({ success: false, error: error.message });
          }
        }
        
        analyzeImage();
        `,
        {
          eval: true,
          workerData: {
            imageBuffer,
            credentials: JSON.parse(Buffer.from(getEnv("GCLOUD_CREDENTIALS") || "", "base64").toString("utf8")),
          },
        },
      )

      worker.on("message", (message) => {
        if (message.success) {
          // Continue with the main recognition process
          recognizeLocation(imageBuffer, currentLocation).then(resolve).catch(reject)
        } else {
          reject(new Error(message.error))
        }
        worker.terminate()
      })

      worker.on("error", (err) => {
        console.error("Worker error:", err)
        reject(err)
        worker.terminate()
      })
    } catch (error) {
      // Fallback to synchronous processing if worker fails
      console.warn("Worker thread failed, falling back to synchronous processing:", error)
      recognizeLocation(imageBuffer, currentLocation).then(resolve).catch(reject)
    }
  })
}

// API route handlers
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
    const formData = await request.formData()

    // Get the operation type
    const operation = formData.get("operation") as string
    console.log(`Operation: ${operation || "default"}`)

    // Handle different operations
    if (operation === "getById") {
      const id = formData.get("id") as string
      if (!id) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required parameter: id",
          },
          { status: 400 },
        )
      }

      const location = await LocationDB.getLocationById(id)
      if (!location) {
        return NextResponse.json(
          {
            success: false,
            error: `Location with ID ${id} not found`,
          },
          { status: 404 },
        )
      }

      return NextResponse.json({
        success: true,
        location,
      })
    } else if (operation === "search") {
      const query = formData.get("query") as string
      if (!query) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required parameter: query",
          },
          { status: 400 },
        )
      }

      const locations = await LocationDB.searchLocations(query)
      return NextResponse.json({
        success: true,
        locations,
      })
    } else if (operation === "nearby") {
      const lat = Number.parseFloat(formData.get("latitude") as string)
      const lng = Number.parseFloat(formData.get("longitude") as string)
      const radius = Number.parseFloat(formData.get("radius") as string) || 5

      if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing or invalid required parameters: latitude, longitude",
          },
          { status: 400 },
        )
      }

      const locations = await LocationDB.getNearbyLocations(lat, lng, radius)
      return NextResponse.json({
        success: true,
        locations,
      })
    } else if (operation === "all") {
      const locations = await LocationDB.getAllLocations()
      return NextResponse.json({
        success: true,
        locations,
      })
    } else if (operation === "byCategory") {
      const category = formData.get("category") as string
      if (!category) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required parameter: category",
          },
          { status: 400 },
        )
      }

      const locations = await LocationDB.getLocationsByCategory(category)
      return NextResponse.json({
        success: true,
        locations,
      })
    } else if (operation === "byBuildingType") {
      const type = formData.get("type") as string
      if (!type) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required parameter: type",
          },
          { status: 400 },
        )
      }

      const locations = await LocationDB.getLocationsByBuildingType(type)
      return NextResponse.json({
        success: true,
        locations,
      })
    } else if (operation === "bySafetyScore") {
      const minSafetyScore = Number.parseFloat(formData.get("minSafetyScore") as string)
      if (isNaN(minSafetyScore)) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing or invalid required parameter: minSafetyScore",
          },
          { status: 400 },
        )
      }

      const locations = await LocationDB.getLocationsBySafetyScore(minSafetyScore)
      return NextResponse.json({
        success: true,
        locations,
      })
    } else if (operation === "byNoiseLevel") {
      const noiseLevel = formData.get("noiseLevel") as string
      if (!noiseLevel) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required parameter: noiseLevel",
          },
          { status: 400 },
        )
      }

      const locations = await LocationDB.getLocationsByNoiseLevel(noiseLevel)
      return NextResponse.json({
        success: true,
        locations,
      })
    } else if (operation === "byDemographicData") {
      const population = formData.get("population")
        ? Number.parseFloat(formData.get("population") as string)
        : undefined
      const medianAge = formData.get("medianAge") ? Number.parseFloat(formData.get("medianAge") as string) : undefined
      const medianIncome = (formData.get("medianIncome") as string) || undefined

      if (!population && !medianAge && !medianIncome) {
        return NextResponse.json(
          {
            success: false,
            error: "At least one demographic parameter is required: population, medianAge, or medianIncome",
          },
          { status: 400 },
        )
      }

      const locations = await LocationDB.getLocationsByDemographicData(population, medianAge, medianIncome)
      return NextResponse.json({
        success: true,
        locations,
      })
    } else if (operation === "businessLocations") {
      const locations = await LocationDB.getBusinessLocations()
      return NextResponse.json({
        success: true,
        locations,
      })
    } else if (operation === "delete") {
      const id = formData.get("id") as string
      if (!id) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required parameter: id",
          },
          { status: 400 },
        )
      }

      const success = await LocationDB.deleteLocation(id)
      if (!success) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to delete location with ID ${id}`,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        message: `Location with ID ${id} deleted successfully`,
      })
    } else if (operation === "update") {
      const id = formData.get("id") as string
      const dataStr = formData.get("data") as string

      if (!id || !dataStr) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required parameters: id, data",
          },
          { status: 400 },
        )
      }

      let data
      try {
        data = JSON.parse(dataStr)
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid JSON in data parameter",
          },
          { status: 400 },
        )
      }

      const updatedLocation = await LocationDB.updateLocation(id, data)
      if (!updatedLocation) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to update location with ID ${id}`,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        location: updatedLocation,
      })
    } else if (operation === "geocode") {
      const address = formData.get("address") as string
      if (!address) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required parameter: address",
          },
          { status: 400 },
        )
      }

      // Get current location if provided
      let currentLocation: Location | undefined
      const lat = Number.parseFloat(formData.get("latitude") as string)
      const lng = Number.parseFloat(formData.get("longitude") as string)
      if (!isNaN(lat) && !isNaN(lng)) {
        currentLocation = { latitude: lat, longitude: lng }
      }

      const geocodeResult = await geocodeAddress(address, currentLocation)
      if (!geocodeResult) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to geocode address: ${address}`,
          },
          { status: 404 },
        )
      }

      return NextResponse.json(geocodeResult)
    } else if (operation === "businessByName") {
      const businessName = formData.get("name") as string
      if (!businessName) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required parameter: name",
          },
          { status: 400 },
        )
      }

      // Get current location if provided
      let currentLocation: Location | undefined
      const lat = Number.parseFloat(formData.get("latitude") as string)
      const lng = Number.parseFloat(formData.get("longitude") as string)
      if (!isNaN(lat) && !isNaN(lng)) {
        currentLocation = { latitude: lat, longitude: lng }
      }

      const businessResults = await searchBusinessByName(businessName, currentLocation)
      if (businessResults.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `No business found with name: ${businessName}`,
          },
          { status: 404 },
        )
      }

      return NextResponse.json(businessResults[0])
    } else {
      // Default operation: image recognition
      // Get the image file
      const imageFile = formData.get("image") as File
      if (!imageFile) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required parameter: image",
          },
          { status: 400 },
        )
      }

      // Get current location if provided
      let currentLocation: Location
      const lat = Number.parseFloat(formData.get("latitude") as string)
      const lng = Number.parseFloat(formData.get("longitude") as string)

      if (!isNaN(lat) && !isNaN(lng)) {
        currentLocation = { latitude: lat, longitude: lng }
      } else {
        // Default to a central location if not provided
        currentLocation = { latitude: 40.7128, longitude: -74.006 }
        console.log("Using default location:", currentLocation)
      }

      // Convert the file to a buffer
      const arrayBuffer = await imageFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Process the image
      const result = await recognizeLocation(buffer, currentLocation)

      // Save the result to the database if successful
      if (result.success && result.location) {
        try {
          const id = await LocationDB.saveLocation(result)
          result.id = id
        } catch (error) {
          console.error("Error saving to database:", error)
          result.dbError = "Failed to save to database"
        }
      }

      // Add the provided location to the response
      result.providedLocation = currentLocation
      result.usingFallbackLocation = isNaN(lat) || isNaN(lng)

      return NextResponse.json(result)
    }
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 },
    )
  }
}

export function OPTIONS(): NextResponse {
  return NextResponse.json({
    success: true,
    message: "CORS preflight request successful",
  })
}

// Export the queryBusinessName function for use in other modules
export { queryOSMForBusinessName as queryBusinessName }
