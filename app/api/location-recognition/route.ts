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

// Enhanced LocationRecognitionResponse interface
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
  website?: string // Website URL
  phoneNumber?: string // Phone number
  priceLevel?: number // Price level (1-4)
  reviews?: any[] // User reviews
  buildingType?: string // Type of building (commercial, residential, etc.)
  yearBuilt?: string // Year the building was constructed
  architecturalStyle?: string // Architectural style of the building
  historicalInfo?: string // Historical information about the building
  amenities?: string[] // Available amenities
  accessibility?: string[] // Accessibility features
  // Add new fields for enhanced geotagging
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
  // New fields for enhanced detection
  materialType?: string // Building material (concrete, wood, brick, etc.)
  estimatedAge?: string // Estimated age of the building/landmark
  culturalSignificance?: string // Cultural importance
  naturalFeatures?: string[] // Natural elements in the area
  weatherConditions?: string // Weather conditions at the time of capture
  crowdDensity?: string // Estimated crowd/traffic level
  urbanDensity?: string // Urban, suburban, rural classification
  vegetationDensity?: string // Assessment of greenery/vegetation
  waterProximity?: string // Proximity to water bodies
  transportationAccess?: string[] // Nearby transportation options
  significantColors?: string[] // Dominant colors in the scene
  timeOfDay?: string // Estimated time of day from image
  safetyScore?: number // Safety rating of the area (0-100)
  noiseLevel?: string // Estimated noise level
  airQuality?: string // Air quality assessment
  specialEvents?: string // Detected events happening
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
    architecturalStyle: "Art Deco",
    yearBuilt: "1931",
    materialType: "Limestone, steel frame",
    culturalSignificance: "One of the most iconic buildings in the New York City skyline and American culture",
    transportationAccess: ["Subway", "Bus", "Taxi"],
    urbanDensity: "High-density urban",
  },
  "Eiffel Tower": {
    name: "Eiffel Tower",
    address: "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France",
    location: { latitude: 48.8584, longitude: 2.2945 },
    description: "Iconic iron lattice tower on the Champ de Mars in Paris",
    confidence: 0.95,
    category: "landmark",
    pointsOfInterest: ["Champ de Mars", "Trocadéro Gardens", "Seine River"],
    architecturalStyle: "Structural expressionism",
    yearBuilt: "1889",
    materialType: "Wrought iron lattice",
    culturalSignificance:
      "Symbol of Paris and French culture, originally built as the entrance arch for the 1889 World's Fair",
    naturalFeatures: ["Seine River", "Champ de Mars park"],
    transportationAccess: ["Metro", "Bus", "River boat"],
    urbanDensity: "High-density urban",
  },
  "Great Sphinx of Giza": {
    name: "Great Sphinx of Giza",
    address: "Al Giza Desert, Giza Governorate, Egypt",
    location: { latitude: 29.9753, longitude: 31.1376 },
    description: "Ancient limestone statue with the head of a human and the body of a lion",
    confidence: 0.92,
    category: "landmark",
    pointsOfInterest: ["Great Pyramid of Giza", "Pyramid of Khafre", "Pyramid of Menkaure"],
    architecturalStyle: "Ancient Egyptian",
    yearBuilt: "2500 BCE (approximate)",
    materialType: "Limestone",
    culturalSignificance: "One of the oldest and most iconic monuments of ancient Egyptian civilization",
    naturalFeatures: ["Desert"],
    weatherConditions: "Hot, dry desert climate",
    urbanDensity: "Tourist area, near urban development",
  },
  "Taj Mahal": {
    name: "Taj Mahal",
    address: "Dharmapuri, Forest Colony, Tajganj, Agra, Uttar Pradesh 282001, India",
    location: { latitude: 27.1751, longitude: 78.0421 },
    description: "Ivory-white marble mausoleum on the south bank of the Yamuna river",
    confidence: 0.93,
    category: "landmark",
    pointsOfInterest: ["Agra Fort", "Mehtab Bagh", "Itimad-ud-Daulah"],
    architecturalStyle: "Mughal architecture",
    yearBuilt: "1653",
    materialType: "White marble, precious stones",
    culturalSignificance: "UNESCO World Heritage Site, considered the jewel of Muslim art in India",
    naturalFeatures: ["Yamuna River", "Gardens"],
    waterProximity: "Adjacent to Yamuna River",
    urbanDensity: "Tourist area, near urban development",
  },
  "Statue of Liberty": {
    name: "Statue of Liberty",
    address: "Liberty Island, New York, NY 10004, USA",
    location: { latitude: 40.6892, longitude: -74.0445 },
    description: "Colossal neoclassical sculpture on Liberty Island in New York Harbor",
    confidence: 0.91,
    category: "landmark",
    pointsOfInterest: ["Ellis Island", "Battery Park", "One World Trade Center"],
    architecturalStyle: "Neoclassical",
    yearBuilt: "1886",
    materialType: "Copper sheet over steel framework",
    culturalSignificance: "Symbol of freedom and democracy, UNESCO World Heritage Site",
    naturalFeatures: ["Harbor", "Island"],
    waterProximity: "Surrounded by New York Harbor",
    transportationAccess: ["Ferry"],
    urbanDensity: "Island landmark, near high-density urban area",
  },
  "National Theatre Nigeria": {
    name: "National Theatre Nigeria",
    address: "Iganmu, Lagos, Nigeria",
    location: { latitude: 6.4779, longitude: 3.3664 },
    description: "Cultural landmark and architectural masterpiece in Lagos",
    confidence: 0.85,
    category: "landmark",
    pointsOfInterest: ["National Museum Lagos", "Tafawa Balewa Square", "Freedom Park Lagos"],
    architecturalStyle: "Modernist",
    yearBuilt: "1976",
    materialType: "Concrete and steel",
    culturalSignificance: "Major cultural center for performing arts in Nigeria",
    urbanDensity: "Urban",
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
        // Additional fields that might be in your schema
        description: location.description,
        category: location.category,
        architecturalStyle: location.architecturalStyle,
        yearBuilt: location.yearBuilt,
        materialType: location.materialType,
        culturalSignificance: location.culturalSignificance,
        // Add any other fields that exist in your schema
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
            { description: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
            { architecturalStyle: { contains: query, mode: "insensitive" } },
            { materialType: { contains: query, mode: "insensitive" } },
            { culturalSignificance: { contains: query, mode: "insensitive" } },
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

  // New method to get locations by category
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

  // New method to get locations by architectural style
  static async getLocationsByArchitecturalStyle(style: string): Promise<any[]> {
    try {
      const locations = await prisma.location.findMany({
        where: {
          architecturalStyle: {
            contains: style,
            mode: "insensitive",
          },
        },
        orderBy: { createdAt: "desc" },
      })
      return locations
    } catch (error) {
      console.error(`Error getting locations by architectural style ${style}:`, error)
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
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
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

// Function to get elevation data
async function getElevationData(location: Location): Promise<number | null> {
  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/elevation/json", {
      params: {
        locations: `${location.latitude},${location.longitude}`,
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    })

    if (response.data.status === "OK" && response.data.results && response.data.results.length > 0) {
      return response.data.results[0].elevation
    }
    return null
  } catch (error) {
    console.warn("Error fetching elevation data:", error)
    return null
  }
}

// Function to get timezone data
async function getTimezoneData(location: Location): Promise<string | null> {
  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const response = await axios.get("https://maps.googleapis.com/maps/api/timezone/json", {
      params: {
        location: `${location.latitude},${location.longitude}`,
        timestamp: timestamp,
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    })

    if (response.data.status === "OK") {
      return response.data.timeZoneId
    }
    return null
  } catch (error) {
    console.warn("Error fetching timezone data:", error)
    return null
  }
}

// New function to get weather conditions for a location
async function getWeatherConditions(location: Location): Promise<string | null> {
  try {
    // Replace with your preferred weather API
    const response = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
      params: {
        lat: location.latitude,
        lon: location.longitude,
        appid: process.env.OPENWEATHER_API_KEY,
        units: "metric",
      },
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

// New function to get air quality for a location
async function getAirQuality(location: Location): Promise<string | null> {
  try {
    // Replace with your preferred air quality API
    const response = await axios.get("https://api.openweathermap.org/data/2.5/air_pollution", {
      params: {
        lat: location.latitude,
        lon: location.longitude,
        appid: process.env.OPENWEATHER_API_KEY,
      },
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

// New function to analyze image for additional scene properties
async function analyzeImageScene(imageBuffer: Buffer): Promise<{
  urbanDensity?: string
  vegetationDensity?: string
  crowdDensity?: string
  timeOfDay?: string
  significantColors?: string[]
  waterProximity?: string
}> {
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

    // Perform label detection
    const [labelResult] = await client.labelDetection({ image: { content: imageBuffer } })
    const labels = labelResult.labelAnnotations || []

    // Extract labels into usable information
    const labelNames = labels.map((label) => (label.description || "").toLowerCase())

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
    }
  } catch (error) {
    console.error("Error analyzing image scene:", error)
    return {}
  }
}

// New function to extract building material type
async function detectBuildingMaterial(imageBuffer: Buffer): Promise<string | null> {
  try {
    // Initialize Vision client
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
    const detailedAddress = extractDetailedAddressComponents(addressComponents)

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

    // Get location for enhanced geotagging
    const location = {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
    }

    // Get additional geotagging data (parallel requests for efficiency)
    const [nearbyPlaces, elevation, timezone, weather, airQuality] = await Promise.all([
      getNearbyPlaces(location),
      getElevationData(location),
      getTimezoneData(location),
      getWeatherConditions(location),
      getAirQuality(location),
    ])

    // Determine urbanDensity based on place types and nearby places
    let urbanDensity = "Unknown"
    if (result.types) {
      if (result.types.some((type) => ["locality", "political"].includes(type)) && nearbyPlaces.length > 4) {
        urbanDensity = "High-density urban"
      } else if (result.types.some((type) => ["sublocality", "neighborhood"].includes(type))) {
        urbanDensity = "Suburban"
      } else if (result.types.some((type) => ["route", "street_address"].includes(type))) {
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
      mapUrl: mapUrl,
      placeId: result.place_id,
      addressComponents: addressComponents,
      // Add enhanced geotagging data
      geoData: {
        ...detailedAddress,
        formattedAddress: result.formatted_address,
        timezone: timezone || undefined,
        elevation: elevation || undefined,
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

// Enhanced function to extract and geocode locations from text
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

// Enhanced function to recognize location with additional detection capabilities
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

    // Start multiple detections in parallel for efficiency
    const [landmarkResult, sceneAnalysis, buildingMaterial] = await Promise.all([
      client.landmarkDetection({ image: { content: imageBuffer } }),
      analyzeImageScene(imageBuffer),
      detectBuildingMaterial(imageBuffer),
    ])

    const landmarks = landmarkResult[0].landmarkAnnotations || []

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

        // Get enhanced geotagging data for known landmarks
        const locationToUse = detectedLocation || knownInfo.location
        const [nearbyPlaces, elevation, timezone, weather, airQuality] = await Promise.all([
          getNearbyPlaces(locationToUse),
          getElevationData(locationToUse),
          getTimezoneData(locationToUse),
          getWeatherConditions(locationToUse),
          getAirQuality(locationToUse),
        ])

        // Get detailed address components
        const geocodeResponse = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
          params: {
            latlng: `${locationToUse.latitude},${locationToUse.longitude}`,
            key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          },
        })

        let detailedAddress = {}
        if (geocodeResponse.data.results && geocodeResponse.data.results.length > 0) {
          detailedAddress = extractDetailedAddressComponents(geocodeResponse.data.results[0].address_components)
        }

        // Look for historical information if not already available
        let historicalInfo = knownInfo.culturalSignificance || ""
        if (!historicalInfo) {
          try {
            const wikiResponse = await axios.get(
              "https://en.wikipedia.org/api/rest_v1/page/summary/" +
                encodeURIComponent(landmark.description || knownLandmarkName),
            )
            if (wikiResponse.data && wikiResponse.data.extract) {
              historicalInfo = wikiResponse.data.extract
            }
          } catch (error) {
            console.log("No Wikipedia information found for this landmark")
          }
        }

        return {
          success: true,
          type: "landmark-detection",
          name: landmark.description || knownLandmarkName,
          location: locationToUse,
          confidence,
          address: knownInfo.address,
          description: knownInfo.description,
          category: knownInfo.category,
          mapUrl: `https://www.google.com/maps/search/?api=1&query=${locationToUse.latitude},${locationToUse.longitude}`,
          pointsOfInterest: knownInfo.pointsOfInterest,
          // Enhanced building data
          architecturalStyle: knownInfo.architecturalStyle,
          yearBuilt: knownInfo.yearBuilt,
          materialType: knownInfo.materialType || buildingMaterial || "Unknown",
          culturalSignificance: historicalInfo,
          // Add enhanced environmental data
          weatherConditions: weather,
          airQuality: airQuality,
          urbanDensity: knownInfo.urbanDensity || sceneAnalysis.urbanDensity,
          vegetationDensity: sceneAnalysis.vegetationDensity,
          crowdDensity: sceneAnalysis.crowdDensity,
          timeOfDay: sceneAnalysis.timeOfDay,
          significantColors: sceneAnalysis.significantColors,
          waterProximity: knownInfo.waterProximity || sceneAnalysis.waterProximity,
          transportationAccess: knownInfo.transportationAccess,
          // Add enhanced geotagging data
          geoData: {
            ...detailedAddress,
            formattedAddress: knownInfo.address,
            timezone: timezone || undefined,
            elevation: elevation || undefined,
          },
          nearbyPlaces: nearbyPlaces,
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
            const detailedAddress = extractDetailedAddressComponents(addressResult.address_components)

            // Get enhanced geotagging data
            const [nearbyPlaces, elevation, timezone, weather, airQuality] = await Promise.all([
              getNearbyPlaces(detectedLocation),
              getElevationData(detectedLocation),
              getTimezoneData(detectedLocation),
              getWeatherConditions(detectedLocation),
              getAirQuality(detectedLocation),
            ])

            // Get historical information if available
            let historicalInfo = ""
            try {
              const wikiResponse = await axios.get(
                "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(landmark.description || ""),
              )
              if (wikiResponse.data && wikiResponse.data.extract) {
                historicalInfo = wikiResponse.data.extract
              }
            } catch (error) {
              console.log("No Wikipedia information found for this landmark")
            }

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
              // Enhanced building and scene data
              materialType: buildingMaterial,
              culturalSignificance: historicalInfo,
              urbanDensity: sceneAnalysis.urbanDensity,
              vegetationDensity: sceneAnalysis.vegetationDensity,
              crowdDensity: sceneAnalysis.crowdDensity,
              timeOfDay: sceneAnalysis.timeOfDay,
              significantColors: sceneAnalysis.significantColors,
              waterProximity: sceneAnalysis.waterProximity,
              weatherConditions: weather,
              airQuality: airQuality,
              // Add enhanced geotagging data
              geoData: {
                ...detailedAddress,
                formattedAddress: addressResult.formatted_address,
                timezone: timezone || undefined,
                elevation: elevation || undefined,
              },
              nearbyPlaces: nearbyPlaces,
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
        materialType: buildingMaterial,
        urbanDensity: sceneAnalysis.urbanDensity,
        vegetationDensity: sceneAnalysis.vegetationDensity,
        crowdDensity: sceneAnalysis.crowdDensity,
        timeOfDay: sceneAnalysis.timeOfDay,
        significantColors: sceneAnalysis.significantColors,
        waterProximity: sceneAnalysis.waterProximity,
      }
    }

    // If landmark detection fails, try text detection and location extraction
    const textLocations = await detectTextAndExtractLocationsUpdated(imageBuffer, currentLocation)

    if (textLocations.length > 0) {
      // Return the highest confidence result
      textLocations.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))

      // Enhance the result with scene analysis
      const enhancedResult = {
        ...textLocations[0],
        materialType: textLocations[0].materialType || buildingMaterial,
        urbanDensity: textLocations[0].urbanDensity || sceneAnalysis.urbanDensity,
        vegetationDensity: textLocations[0].vegetationDensity || sceneAnalysis.vegetationDensity,
        crowdDensity: textLocations[0].crowdDensity || sceneAnalysis.crowdDensity,
        timeOfDay: textLocations[0].timeOfDay || sceneAnalysis.timeOfDay,
        significantColors: textLocations[0].significantColors || sceneAnalysis.significantColors,
        waterProximity: textLocations[0].waterProximity || sceneAnalysis.waterProximity,
      }

      return enhancedResult
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

      // Get enhanced geotagging data for current location
      const [nearbyPlaces, elevation, timezone, weather, airQuality] = await Promise.all([
        getNearbyPlaces(currentLocation),
        getElevationData(currentLocation),
        getTimezoneData(currentLocation),
        getWeatherConditions(currentLocation),
        getAirQuality(currentLocation),
      ])

      // Get detailed address for current location
      const geocodeResponse = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
        params: {
          latlng: `${currentLocation.latitude},${currentLocation.longitude}`,
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      })

      let detailedAddress = {}
      let formattedAddress = ""
      if (geocodeResponse.data.results && geocodeResponse.data.results.length > 0) {
        detailedAddress = extractDetailedAddressComponents(geocodeResponse.data.results[0].address_components)
        formattedAddress = geocodeResponse.data.results[0].formatted_address
      }

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
          address: formattedAddress,
          materialType: buildingMaterial,
          urbanDensity: sceneAnalysis.urbanDensity,
          vegetationDensity: sceneAnalysis.vegetationDensity,
          crowdDensity: sceneAnalysis.crowdDensity,
          timeOfDay: sceneAnalysis.timeOfDay,
          significantColors: sceneAnalysis.significantColors,
          waterProximity: sceneAnalysis.waterProximity,
          weatherConditions: weather,
          airQuality: airQuality,
          // Add enhanced geotagging data
          geoData: {
            ...detailedAddress,
            formattedAddress: formattedAddress,
            timezone: timezone || undefined,
            elevation: elevation || undefined,
          },
          nearbyPlaces: nearbyPlaces,
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
        address: formattedAddress,
        materialType: buildingMaterial,
        urbanDensity: sceneAnalysis.urbanDensity,
        vegetationDensity: sceneAnalysis.vegetationDensity,
        crowdDensity: sceneAnalysis.crowdDensity,
        timeOfDay: sceneAnalysis.timeOfDay,
        significantColors: sceneAnalysis.significantColors,
        waterProximity: sceneAnalysis.waterProximity,
        weatherConditions: weather,
        airQuality: airQuality,
        // Add enhanced geotagging data
        geoData: {
          ...detailedAddress,
          formattedAddress: formattedAddress,
          timezone: timezone || undefined,
          elevation: elevation || undefined,
        },
        nearbyPlaces: nearbyPlaces,
      }
    }

    // Try EXIF data extraction as a final fallback
    console.log("Attempting EXIF geotag extraction as fallback...")
    const exifLocation = await extractExifLocation(imageBuffer)
    if (exifLocation) {
      console.log("EXIF location data found:", exifLocation)
      try {
        const geocodeResponse = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
          params: {
            latlng: `${exifLocation.latitude},${exifLocation.longitude}`,
            key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          },
        })

        if (geocodeResponse.data.results && geocodeResponse.data.results.length > 0) {
          const result = geocodeResponse.data.results[0]
          const detailedAddress = extractDetailedAddressComponents(result.address_components)

          // Get enhanced geotagging data
          const [nearbyPlaces, elevation, timezone, weather, airQuality] = await Promise.all([
            getNearbyPlaces(exifLocation),
            getElevationData(exifLocation),
            getTimezoneData(exifLocation),
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
            // Add enhanced geotagging data
            geoData: {
              ...detailedAddress,
              formattedAddress: result.formatted_address,
              timezone: timezone || undefined,
              elevation: elevation || undefined,
            },
            nearbyPlaces: nearbyPlaces,
          }
        }
      } catch (error) {
        console.warn("Error getting address for EXIF location:", error)
      }
    }

    // If all detection methods fail including EXIF
    return {
      success: false,
      type: "detection-failed",
      error: "Location not identified in image via landmark, text, or geotagging",
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

// Enhanced search function for business locations
async function searchBusinessLocation(
  text: string,
  currentLocation?: Location,
): Promise<LocationRecognitionResponse | null> {
  let businessName = ""
  let cleanedText = ""

  try {
    console.log(`Searching for business: "${text}"`)

    // Clean and normalize the text
    cleanedText = text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim()

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
      "Library",
      "Museum",
      "Theater",
      "Cinema",
      "Stadium",
      "Arena",
      "Gallery",
      "Market",
      "Supermarket",
      "Pharmacy",
      "Clinic",
      "Factory",
      "Warehouse",
    ]

    // Look for business names in the text

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
  } catch (error) {
    console.warn(`Error extracting business name: ${error}`)
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
          fields:
            "name,formatted_address,geometry,address_component,type,photo,vicinity,rating,opening_hours,url,website,formatted_phone_number,international_phone_number,price_level,review,utc_offset",
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      })

      const details = detailsResponse.data.result

      // Determine category based on types
      let category = "Business"
      let buildingType = "Commercial"

      if (details.types) {
        if (details.types.includes("bank") || details.types.includes("finance")) {
          category = "Bank"
        } else if (details.types.includes("lodging") || details.types.includes("hotel")) {
          category = "Hotel"
        } else if (details.types.includes("restaurant") || details.types.includes("food")) {
          category = "Restaurant"
        } else if (details.types.includes("store") || details.types.includes("shopping_mall")) {
          category = "Shopping"
        } else if (details.types.includes("school") || details.types.includes("university")) {
          category = "Education"
          buildingType = "Educational"
        } else if (details.types.includes("hospital") || details.types.includes("health")) {
          category = "Healthcare"
        } else if (details.types.includes("government") || details.types.includes("city_hall")) {
          category = "Government"
          buildingType = "Government"
        } else if (details.types.includes("place_of_worship")) {
          category = "Religious"
          buildingType = "Religious"
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

      // Try to get additional building information from Wikipedia
      let historicalInfo = ""
      try {
        const wikiResponse = await axios.get(
          "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(details.name),
        )
        if (wikiResponse.data && wikiResponse.data.extract) {
          historicalInfo = wikiResponse.data.extract
        }
      } catch (error) {
        console.log("No Wikipedia information found for this building")
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
        website: details.website,
        phoneNumber: details.formatted_phone_number || details.international_phone_number,
        priceLevel: details.price_level,
        reviews: details.reviews,
        buildingType: buildingType,
        historicalInfo: historicalInfo,
        weatherConditions: weather,
        airQuality: airQuality,
        // Add safety score based on ratings if available
        safetyScore: details.rating ? Math.min(Math.round(details.rating * 20), 100) : undefined,
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

      // Get more details about the place
      const detailsResponse = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
        params: {
          place_id: place.place_id,
          fields:
            "name,formatted_address,geometry,address_component,type,photo,vicinity,rating,opening_hours,url,website,formatted_phone_number,international_phone_number,price_level,review,utc_offset",
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      })

      const details = detailsResponse.data.result || place

      // Determine category based on types
      let category = "Business"
      let buildingType = "Commercial"

      if (place.types) {
        if (place.types.includes("bank") || place.types.includes("finance")) {
          category = "Bank"
        } else if (place.types.includes("lodging") || place.types.includes("hotel")) {
          category = "Hotel"
        } else if (place.types.includes("restaurant") || place.types.includes("food")) {
          category = "Restaurant"
        } else if (place.types.includes("store") || place.types.includes("shopping_mall")) {
          category = "Shopping"
        } else if (place.types.includes("school") || place.types.includes("university")) {
          category = "Education"
          buildingType = "Educational"
        } else if (place.types.includes("hospital") || place.types.includes("health")) {
          category = "Healthcare"
        } else if (place.types.includes("government") || place.types.includes("city_hall")) {
          category = "Government"
          buildingType = "Government"
        } else if (place.types.includes("place_of_worship")) {
          category = "Religious"
          buildingType = "Religious"
        }
      }

      // Create photo URLs if available
      const photoUrls: string[] = []
      if (details.photos && details.photos.length > 0) {
        details.photos.slice(0, 5).forEach((photo) => {
          photoUrls.push(
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
          )
        })
      }

      // Format opening hours if available
      let formattedOpeningHours = null
      if (details.opening_hours && details.opening_hours.weekday_text) {
        formattedOpeningHours = details.opening_hours.weekday_text
      }

      // Extract reviews if available
      const reviews = details.reviews ? details.reviews.slice(0, 3) : []

      // Get environmental data
      const [weather, airQuality] = await Promise.all([
        getWeatherConditions({
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        }),
        getAirQuality({
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        }),
      ])

      // Create map URL
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${place.geometry.location.lat},${place.geometry.location.lng}&query_place_id=${place.place_id}`

      return {
        success: true,
        type: "business-search",
        name: details.name || place.name,
        address: details.formatted_address || place.formatted_address,
        formattedAddress: details.formatted_address || place.formatted_address,
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        description: `${category} located at ${details.vicinity || details.formatted_address || place.formatted_address}`,
        confidence: 0.85,
        category,
        mapUrl,
        placeId: place.place_id,
        addressComponents: details.address_components,
        photos: photoUrls,
        rating: details.rating || place.rating,
        openingHours: formattedOpeningHours,
        website: details.website,
        phoneNumber: details.formatted_phone_number || details.international_phone_number,
        priceLevel: details.price_level || place.price_level,
        reviews: reviews,
        buildingType: buildingType,
        weatherConditions: weather,
        airQuality: airQuality,
        safetyScore: details.rating ? Math.min(Math.round(details.rating * 20), 100) : undefined,
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

          // Get more details about the place
          const detailsResponse = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
            params: {
              place_id: place.place_id,
              fields:
                "name,formatted_address,geometry,address_component,type,photo,vicinity,rating,opening_hours,url,website,formatted_phone_number,international_phone_number,price_level,review,utc_offset",
              key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
            },
          })

          const details = detailsResponse.data.result || place

          // Create photo URLs if available
          const photoUrls: string[] = []
          if (details.photos && details.photos.length > 0) {
            details.photos.slice(0, 5).forEach((photo) => {
              photoUrls.push(
                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
              )
            })
          }

          // Format opening hours if available
          let formattedOpeningHours = null
          if (details.opening_hours && details.opening_hours.weekday_text) {
            formattedOpeningHours = details.opening_hours.weekday_text
          }

          // Extract reviews if available
          const reviews = details.reviews ? details.reviews.slice(0, 3) : []

          // Get environmental data
          const [weather, airQuality] = await Promise.all([
            getWeatherConditions({
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            }),
            getAirQuality({
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            }),
          ])

          return {
            success: true,
            type: "bank-search",
            name: details.name || place.name,
            address: details.formatted_address || place.vicinity,
            location: {
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            },
            description: `Bank located at ${details.vicinity || place.vicinity}`,
            confidence: 0.8,
            category: "Bank",
            buildingType: "Commercial",
            mapUrl: `https://www.google.com/maps/search/?api=1&query=${place.geometry.location.lat},${place.geometry.location.lng}&query_place_id=${place.place_id}`,
            placeId: place.place_id,
            photos: photoUrls,
            rating: details.rating || place.rating,
            openingHours: formattedOpeningHours,
            website: details.website,
            phoneNumber: details.formatted_phone_number || details.international_phone_number,
            priceLevel: details.price_level,
            weatherConditions: weather,
            airQuality: airQuality,
            safetyScore: details.rating ? Math.min(Math.round(details.rating * 20), 100) : undefined,
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
      buildingType: isBankLikely ? "Commercial" : "Unknown",
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName)}&ll=${currentLocation.latitude},${currentLocation.longitude}`,
      address: "Location approximate - search for more details",
    }
  }

  return null
}

// Enhanced function to detect text and extract locations
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

    // Start multiple detections in parallel for efficiency
    const [textResult, buildingMaterial, sceneAnalysis] = await Promise.all([
      client.textDetection({ image: { content: imageBuffer } }),
      detectBuildingMaterial(imageBuffer),
      analyzeImageScene(imageBuffer),
    ])

    const detections = textResult[0].textAnnotations

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
      "library",
      "museum",
      "theater",
      "cinema",
      "stadium",
      "arena",
      "gallery",
      "market",
      "supermarket",
      "pharmacy",
      "clinic",
      "factory",
      "warehouse",
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
          // Enhance the result with scene analysis data
          return [
            {
              ...businessResult,
              materialType: businessResult.materialType || buildingMaterial,
              urbanDensity: businessResult.urbanDensity || sceneAnalysis.urbanDensity,
              vegetationDensity: sceneAnalysis.vegetationDensity,
              crowdDensity: sceneAnalysis.crowdDensity,
              timeOfDay: sceneAnalysis.timeOfDay,
              significantColors: sceneAnalysis.significantColors,
              waterProximity: businessResult.waterProximity || sceneAnalysis.waterProximity,
            },
          ]
        }
      }
    }

    // Look for address patterns in the text
    const addressPatterns = [
      /\b\d+\s+[A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct|Plaza|Square|Sq|Highway|Hwy|Freeway|Parkway|Pkwy)\b/gi,
      /\b\d+\s+[A-Za-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct|Plaza|Square|Sq|Highway|Hwy|Freeway|Parkway|Pkwy)\b/gi,
    ]

    let addressText = ""
    for (const pattern of addressPatterns) {
      const match = fullText.match(pattern)
      if (match && match.length > 0) {
        addressText = match[0]
        break
      }
    }

    // If we found an address, try to geocode it
    if (addressText) {
      const geocodeResult = await geocodeAddress(addressText, currentLocation)
      if (geocodeResult) {
        // If we have a business name, combine it with the address information
        if (isLikelyBusiness) {
          const lines = fullText.split("\n").filter((line) => line.trim().length > 0)
          const businessLine = lines.find((line) =>
            businessIndicators.some((indicator) => line.toLowerCase().includes(indicator.toLowerCase())),
          )

          if (businessLine && businessLine !== addressText) {
            geocodeResult.name = businessLine.trim()
            geocodeResult.description = `${businessLine.trim()} located at ${geocodeResult.address}`
          }
        }

        // Enhance with scene analysis
        return [
          {
            ...geocodeResult,
            materialType: geocodeResult.materialType || buildingMaterial,
            urbanDensity: geocodeResult.urbanDensity || sceneAnalysis.urbanDensity,
            vegetationDensity: sceneAnalysis.vegetationDensity,
            crowdDensity: sceneAnalysis.crowdDensity,
            timeOfDay: sceneAnalysis.timeOfDay,
            significantColors: sceneAnalysis.significantColors,
            waterProximity: geocodeResult.waterProximity || sceneAnalysis.waterProximity,
          },
        ]
      }
    }

    // If bank-specific search fails, try with the full text
    if (isLikelyBusiness) {
      // Try specialized business search first
      const businessResult = await searchBusinessLocation(fullText, currentLocation)
      if (businessResult) {
        // Enhance with scene analysis
        return [
          {
            ...businessResult,
            materialType: businessResult.materialType || buildingMaterial,
            urbanDensity: businessResult.urbanDensity || sceneAnalysis.urbanDensity,
            vegetationDensity: sceneAnalysis.vegetationDensity,
            crowdDensity: sceneAnalysis.crowdDensity,
            timeOfDay: sceneAnalysis.timeOfDay,
            significantColors: sceneAnalysis.significantColors,
            waterProximity: businessResult.waterProximity || sceneAnalysis.waterProximity,
          },
        ]
      }
    }

    // If business search fails, try general location extraction
    const locationResults = await extractLocationsFromText(fullText, currentLocation)

    // Enhance results with scene analysis
    return locationResults.map((result) => ({
      ...result,
      materialType: result.materialType || buildingMaterial,
      urbanDensity: result.urbanDensity || sceneAnalysis.urbanDensity,
      vegetationDensity: sceneAnalysis.vegetationDensity,
      crowdDensity: sceneAnalysis.crowdDensity,
      timeOfDay: sceneAnalysis.timeOfDay,
      significantColors: sceneAnalysis.significantColors,
      waterProximity: result.waterProximity || sceneAnalysis.waterProximity,
    }))
  } catch (error) {
    console.error("Text detection failed:", error)
    return []
  }
}

// Helper function to search for a place using Google Maps API
async function searchPlaceWithGoogleMaps(
  query: string,
  currentLocation?: Location,
): Promise<LocationRecognitionResponse | null> {
  try {
    console.log(`Searching for place: "${query}"`)

    // Prepare search parameters
    const params: any = {
      input: query,
      inputtype: "textquery",
      fields: "formatted_address,name,geometry,place_id,types,photos,rating,opening_hours",
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    }

    // Add location bias if current location is available
    if (currentLocation) {
      params.locationbias = `circle:2000@${currentLocation.latitude},${currentLocation.longitude}` // Bias towards the current location
    }

    // Make the Places API request
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/findplacefromtext/json", { params })

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
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      })

      const details = detailsResponse.data.result

      // Determine category based on types
      let category = "Unknown"
      if (details.types) {
        if (details.types.includes("point_of_interest") || details.types.includes("establishment")) {
          category = "Point of Interest"
        } else if (details.types.includes("street_address") || details.types.includes("route")) {
          category = "Street"
        } else if (details.types.includes("locality") || details.types.includes("administrative_area_level_1")) {
          category = "City/Region"
        } else if (details.types.includes("country")) {
          category = "Country"
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
        description: `Place located at ${details.vicinity || details.formatted_address}`,
        confidence: 0.9, // High confidence for successful place search
        category,
        mapUrl,
        placeId: details.place_id,
        addressComponents: details.address_components,
        photos: photoUrls,
        rating: details.rating,
        openingHours: details.opening_hours,
        website: details.website,
        phoneNumber: details.formatted_phone_number || details.international_phone_number,
        priceLevel: details.price_level,
        reviews: details.reviews,
        weatherConditions: weather,
        airQuality: airQuality,
        safetyScore: details.rating ? Math.min(Math.round(details.rating * 20), 100) : undefined,
      }
    }

    return null
  } catch (error) {
    console.warn(`Place search failed for: ${query}`, error)
    return null
  }
}

// Modified POST handler to include the saveToDb parameter and handle new fields
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

        case "byArchitecturalStyle": {
          const style = formData.get("style")
          if (!style) {
            return NextResponse.json({ success: false, error: "Missing architectural style" }, { status: 400 })
          }

          const locations = await LocationDB.getLocationsByArchitecturalStyle(style.toString())
          return NextResponse.json({ success: true, locations }, { status: 200 })
        }

        default:
          return NextResponse.json({ success: false, error: "Invalid operation" }, { status: 400 })
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

    // Get additional options
    const includeEnvData = formData.get("includeEnvData") !== "false" // Include environmental data by default
    const includeSceneAnalysis = formData.get("includeSceneAnalysis") !== "false" // Include scene analysis by default
    const includeHistoricalInfo = formData.get("includeHistoricalInfo") !== "false" // Include historical info by default

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
      }
    }

    return NextResponse.json(recognitionResult, { status: 200 })
  } catch (error) {
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
    const style = searchParams.get("style")

    // Handle database operations
    if (operation) {
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

        case "byArchitecturalStyle": {
          if (!style) {
            return NextResponse.json({ success: false, error: "Missing architectural style" }, { status: 400 })
          }

          const locations = await LocationDB.getLocationsByArchitecturalStyle(style.toString())
          return NextResponse.json({ success: true, locations }, { status: 200 })
        }

        default:
          return NextResponse.json({ success: false, error: "Invalid operation" }, { status: 400 })
      }
    } else {
      return NextResponse.json({ success: false, error: "No operation specified" }, { status: 400 })
    }
  } catch (error) {
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

// Helper function to geocode an address using Google Maps API
