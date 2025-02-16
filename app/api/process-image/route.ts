import { type NextRequest, NextResponse } from "next/server"
import * as vision from "@google-cloud/vision"
import axios from "axios"
import * as exifParser from "exif-parser"
import NodeCache from "node-cache"
import { rateLimit } from "express-rate-limit"

// Cache configuration
const cache = new NodeCache({ stdTTL: 3600 }) // 1 hour cache

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})

// Interfaces
interface Location {
  latitude: number
  longitude: number
}

interface BuildingFeatures {
  architecture?: string[]
  materials?: string[]
  style?: string[]
  estimatedAge?: string
  condition?: string
  height?: string
  floors?: number
  yearBuilt?: number
  architecturalStyle?: string
  constructionType?: string
}

interface PublicInformation {
  openingHours?: string[]
  contactInfo?: {
    phone?: string
    email?: string
    website?: string
    socialMedia?: {
      facebook?: string
      twitter?: string
      instagram?: string
    }
  }
  amenities?: string[]
  ratings?: {
    average: number
    total: number
    source: string
    details?: {
      cleanliness?: number
      service?: number
      value?: number
      location?: number
    }
  }[]
  historicalInfo?: {
    yearBuilt?: number
    architect?: string
    significance?: string
    events?: {
      date: string
      description: string
    }[]
    description: string
  }
  nearbyAttractions?: {
    name: string
    distance: string
    type: string
    rating?: number
    description?: string
  }[]
  publicTransport?: {
    type: string
    station: string
    distance: string
    lines?: string[]
    schedule?: string
  }[]
  accessibility?: {
    features: string[]
    restrictions?: string[]
    ratings?: {
      wheelchair: number
      visualImpairment: number
      hearingImpairment: number
    }
  }
  services?: {
    name: string
    description: string
    availability: string
    pricing?: string
  }[]
  events?: {
    name: string
    date: string
    description: string
    ticketInfo?: string
  }[]
  parking?: {
    available: boolean
    type: string[]
    pricing?: string
    capacity?: number
  }
  restrictions?: {
    photography: boolean
    bags: boolean
    dress: string[]
    other: string[]
  }
  sustainabilityInfo?: {
    certifications: string[]
    features: string[]
    rating?: string
  }
}

interface BuildingDetectionResponse {
  success: boolean
  type: string
  address?: string
  location?: Location
  description?: string
  confidence?: number
  features?: BuildingFeatures
  similarBuildings?: string[]
  safetyScore?: number
  error?: string
  imageProperties?: {
    dominantColors: string[]
    brightness: number
    contrast: number
    primaryStyle?: string
    aestheticScore?: number
  }
  publicInfo?: PublicInformation
  lastUpdated?: string
  sourceReliability?: number
}

// API Configuration
const API_CONFIG = {
  GOOGLE_PLACES: {
    BASE_URL: 'https://maps.googleapis.com/maps/api/place',
    FIELDS: [
      'name',
      'rating',
      'user_ratings_total',
      'formatted_phone_number',
      'website',
      'opening_hours',
      'price_level',
      'wheelchair_accessible_entrance',
      'photos',
      'reviews',
      'address_components',
      'formatted_address'
    ].join(',')
  },
  WIKIPEDIA: {
    BASE_URL: 'https://en.wikipedia.org/api/rest_v1/page',
    TIMEOUT: 5000
  },
  TRANSIT: {
    RADIUS: 500, // meters
    MAX_RESULTS: 5
  }
}

class BuildingAnalyzer {
  private static readonly KNOWN_BUILDINGS = {
    "Empire State Building": {
      address: "20 W 34th St, New York, NY 10118, USA",
      location: { latitude: 40.748817, longitude: -73.985428 },
      description: "Empire State Building",
      confidence: 0.9,
      features: {
        architecture: ["Art Deco"],
        height: "1,454 feet",
        floors: 102,
        yearBuilt: 1931,
        architecturalStyle: "Art Deco",
        constructionType: "Steel frame"
      },
      publicInfo: {
        openingHours: ["8:00 AM - 2:00 AM daily"],
        contactInfo: {
          phone: "+1 212-736-3100",
          website: "https://www.esbnyc.com",
          socialMedia: {
            facebook: "EmpireStateBuilding",
            twitter: "EmpireStateBldg",
            instagram: "empirestatebldg"
          }
        },
        amenities: [
          "Observatory",
          "Restaurants",
          "Gift Shop",
          "Museum",
          "Audio Tours",
          "Express Pass Options"
        ],
        ratings: [{
          average: 4.7,
          total: 85000,
          source: "Google Reviews",
          details: {
            cleanliness: 4.8,
            service: 4.6,
            value: 4.5,
            location: 4.9
          }
        }],
        historicalInfo: {
          yearBuilt: 1931,
          architect: "Shreve, Lamb & Harmon",
          significance: "Iconic Art Deco skyscraper and former world's tallest building",
          events: [
            {
              date: "1931-05-01",
              description: "Official opening ceremony"
            },
            {
              date: "1945-07-28",
              description: "B-25 Mitchell bomber crash incident"
            }
          ],
          description: "The Empire State Building is a 102-story Art Deco skyscraper in Midtown Manhattan. It stood as the world's tallest building until 1970, and has become one of New York City's most iconic landmarks."
        },
        accessibility: {
          features: [
            "Wheelchair accessible",
            "Elevator access",
            "ADA compliant",
            "Braille signage",
            "Audio guides"
          ],
          ratings: {
            wheelchair: 4.5,
            visualImpairment: 4.2,
            hearingImpairment: 4.3
          }
        },
        sustainabilityInfo: {
          certifications: ["LEED Gold", "Energy Star"],
          features: [
            "LED lighting",
            "Green power",
            "Energy efficiency upgrades",
            "Waste management program"
          ],
          rating: "LEED Gold Certified"
        }
      }
    }
    // Add more known buildings as needed
  }

  static async detectLandmark(
    client: vision.ImageAnnotatorClient,
    imageBuffer: Buffer
  ): Promise<BuildingDetectionResponse> {
    console.log("Analyzing landmark detection results...")
    const [result] = await client.landmarkDetection({ image: { content: imageBuffer } })
    const landmarks = result.landmarkAnnotations || []
  
    if (landmarks.length > 0) {
      const landmark = landmarks[0]
      const confidence = landmark.score || 0
  
      // Extract location from landmark
      const location = landmark.locations?.[0]?.latLng
      const detectedLocation = location ? {
        latitude: location.latitude || 0,
        longitude: location.longitude || 0
      } : undefined
  
      // Search for known building information
      const knownBuildingInfo = Object.entries(BuildingAnalyzer.KNOWN_BUILDINGS)
        .find(([name]) => landmark.description?.toLowerCase().includes(name.toLowerCase()))
  
      if (knownBuildingInfo) {
        console.log(`Matched known landmark: ${knownBuildingInfo[0]}`)
        return {
          success: true,
          type: "landmark-detection",
          description: landmark.description || knownBuildingInfo[0],
          location: detectedLocation || knownBuildingInfo[1].location,
          confidence,
          ...knownBuildingInfo[1]
        }
      }
  
      // If not a known building, return general landmark information
      console.log(`Detected unknown landmark: ${landmark.description}`)
      return {
        success: true,
        type: "landmark-detection",
        description: landmark.description || "Unknown Landmark",
        location: detectedLocation,
        confidence,
        features: {
          architecture: [],  // Would need visual analysis to determine
          type: "Landmark",
          constructionType: "Historical Structure"
        }
      }
    }
  
    console.log("No landmarks detected")
    return {
      success: false,
      type: "landmark-detection-failed",
      error: "No landmarks detected in image"
    }
  }


  static async handleAddressLookup(address: string): Promise<BuildingDetectionResponse> {
    try {
      console.log("Processing address lookup:", address)
      
      // Geocode the address
      const geocodeResult = await geocodeAddress(address)
      if (!geocodeResult) {
        return {
          success: false,
          type: "address-lookup-failed",
          error: "Unable to geocode address"
        }
      }
  
      // Fetch additional data using the geocoded location
      const location = {
        latitude: geocodeResult.location?.latitude || 0,
        longitude: geocodeResult.location?.longitude || 0
      }
  
      // Fetch Places API data
      const placesData = await BuildingAnalyzer.fetchGooglePlacesData(address, location)
      
      // Fetch Wikipedia data
      const wikiData = await BuildingAnalyzer.fetchWikipediaData(address)
      
      // Fetch transit data
      const transitData = await BuildingAnalyzer.fetchTransitData(location)
  
      return {
        success: true,
        type: "address-lookup",
        address: geocodeResult.address,
        location: geocodeResult.location,
        description: address,
        confidence: 0.9,
        features: await inferBuildingFeaturesFromAddress(geocodeResult.address || ""),
        publicInfo: {
          ...placesData,
          ...wikiData,
          publicTransport: transitData
        },
        lastUpdated: new Date().toISOString(),
        sourceReliability: 0.8
      }
    } catch (error) {
      console.error("Address lookup failed:", error)
      return {
        success: false,
        type: "address-lookup-failed",
        error: error instanceof Error ? error.message : "Address lookup failed"
      }
    }
  }
  
  private static async inferBuildingFeaturesFromAddress(address: string): Promise<BuildingFeatures> {
    const features: BuildingFeatures = {
      architecture: [],
      materials: [],
      style: []
    }
  
    // Infer building type from address components
    const addressLower = address.toLowerCase()
    
    // Check for building type indicators
    if (addressLower.includes("apt") || addressLower.includes("apartment")) {
      features.architecture?.push("Residential")
      features.type = "Apartment Building"
    } else if (addressLower.includes("suite") || addressLower.includes("plaza")) {
      features.architecture?.push("Commercial")
      features.type = "Office Building"
    } else if (addressLower.includes("mall") || addressLower.includes("center")) {
      features.architecture?.push("Commercial")
      features.type = "Shopping Center"
    }
  
    // Add default values if no specific type was determined
    if (!features.type) {
      features.type = "General Building"
      features.architecture?.push("Standard Construction")
    }
  
    return features
  }

  private static async fetchWithCache<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    const cached = cache.get<T>(cacheKey)
    if (cached) return cached

    const data = await fetchFn()
    cache.set(cacheKey, data, ttl)
    return data
  }

  private static async fetchGooglePlacesData(
    buildingName: string,
    location: Location
  ): Promise<Partial<PublicInformation>> {
    const cacheKey = `places_${buildingName}_${location.latitude}_${location.longitude}`
    
    return this.fetchWithCache(cacheKey, async () => {
      try {
        const placesKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!placesKey) throw new Error("Google Places API key not configured")

        // Find place ID
        const searchResponse = await axios.get(
          `${API_CONFIG.GOOGLE_PLACES.BASE_URL}/findplacefromtext/json`,
          {
            params: {
              input: buildingName,
              inputtype: 'textquery',
              locationbias: `point:${location.latitude},${location.longitude}`,
              key: placesKey,
              fields: 'place_id'
            }
          }
        )

        if (!searchResponse.data.candidates?.[0]?.place_id) {
          return {}
        }

        // Get detailed place information
        const detailsResponse = await axios.get(
          `${API_CONFIG.GOOGLE_PLACES.BASE_URL}/details/json`,
          {
            params: {
              place_id: searchResponse.data.candidates[0].place_id,
              fields: API_CONFIG.GOOGLE_PLACES.FIELDS,
              key: placesKey
            }
          }
        )

        const place = detailsResponse.data.result
        
        return {
          openingHours: place.opening_hours?.weekday_text,
          contactInfo: {
            phone: place.formatted_phone_number,
            website: place.website
          },
          ratings: [{
            average: place.rating,
            total: place.user_ratings_total,
            source: "Google Reviews",
            details: this.extractRatingDetails(place.reviews)
          }],
          accessibility: {
            features: this.extractAccessibilityFeatures(place)
          }
        }
      } catch (error) {
        console.error("Error fetching Places data:", error)
        return {}
      }
    })
  }

  private static extractRatingDetails(reviews: any[]): any {
    if (!reviews?.length) return undefined

    const aspects = ['cleanliness', 'service', 'value', 'location']
    const details: any = {}

    aspects.forEach(aspect => {
      const relevantReviews = reviews.filter(r => 
        r.text?.toLowerCase().includes(aspect)
      )
      if (relevantReviews.length > 0) {
        details[aspect] = relevantReviews.reduce((sum, r) => sum + r.rating, 0) / relevantReviews.length
      }
    })

    return Object.keys(details).length > 0 ? details : undefined
  }

  private static extractAccessibilityFeatures(place: any): string[] {
    const features: string[] = []
    
    if (place.wheelchair_accessible_entrance) {
      features.push("Wheelchair accessible entrance")
    }

    // Extract more accessibility features from reviews and attributes
    if (place.reviews) {
      const accessibilityKeywords = [
        "elevator", "ramp", "braille", "audio guide",
        "handicap", "accessible bathroom"
      ]

      place.reviews.forEach((review: any) => {
        if (review.text) {
          accessibilityKeywords.forEach(keyword => {
            if (review.text.toLowerCase().includes(keyword) &&
                !features.includes(keyword)) {
              features.push(keyword)
            }
          })
        }
      })
    }

    return features
  }

  private static async fetchWikipediaData(buildingName: string): Promise<any> {
    const cacheKey = `wiki_${buildingName}`
    
    return this.fetchWithCache(cacheKey, async () => {
      try {
        const response = await axios.get(
          `${API_CONFIG.WIKIPEDIA.BASE_URL}/summary/${encodeURIComponent(buildingName)}`,
          { timeout: API_CONFIG.WIKIPEDIA.TIMEOUT }
        )

        if (!response.data.extract) return {}

        // Get more detailed history from the full article
        const pageResponse = await axios.get(
          `${API_CONFIG.WIKIPEDIA.BASE_URL}/mobile-sections/${encodeURIComponent(buildingName)}`
        )

        return {
          historicalInfo: {
            description: response.data.extract,
            events: this.extractHistoricalEvents(pageResponse.data)
          }
        }
      } catch (error) {
        console.error("Error fetching Wikipedia data:", error)
        return {}
      }
    })
  }

  private static extractHistoricalEvents(pageData: any): any[] {
    const events: any[] = []
    // Implementation to extract historical events from Wikipedia page sections
    // This would involve parsing the page content and identifying dates and events
    return events
  }

  private static async fetchTransitData(location: Location): Promise<any[]> {
    const cacheKey = `transit_${location.latitude}_${location.longitude}`
    
    return this.fetchWithCache(cacheKey, async () => {
      // Implementation would depend on available transit APIs
      // This could integrate with local transit authorities' APIs
      return []
    })
  }

  static async analyzeImage(imageBuffer: Buffer, currentLocation: Location): Promise<BuildingDetectionResponse> {
    try {
      console.log("Starting image analysis...")
      console.time("totalAnalysis")

      const analysisPromise = (async () => {
        // Initialize Vision client with credentials from the environment
        const base64Credentials = process.env.GCLOUD_CREDENTIALS
        if (!base64Credentials) {
          throw new Error("GCLOUD_CREDENTIALS environment variable is not set.")
        }

        console.log("Parsing Google Cloud credentials...")
        const credentialsBuffer = Buffer.from(base64Credentials, "base64")
        const credentialsJson = credentialsBuffer.toString("utf8")
        const serviceAccount = JSON.parse(credentialsJson)

        console.log("Initializing Vision client...")
        const client = new vision.ImageAnnotatorClient({
          credentials: {
            client_email: serviceAccount.client_email,
            private_key: serviceAccount.private_key,
          },
          projectId: serviceAccount.project_id,
        })

        console.log("Performing image analysis...")
        console.time("visionAPI")
        const [textData, landmarkData, objectData, propertyData, webData, safetyData] = await Promise.all([
          client.textDetection({ image: { content: imageBuffer } }),
          client.landmarkDetection({ image: { content: imageBuffer } }),
          client.objectLocalization({ image: { content: imageBuffer } }),
          client.imageProperties({ image: { content: imageBuffer } }),
          client.webDetection({ image: { content: imageBuffer } }),
          client.safeSearchDetection({ image: { content: imageBuffer } }),
        ])
        console.timeEnd("visionAPI")

        console.log("Image analysis completed. Processing results...")

        // Try detection methods in order
        console.log("Attempting text detection...")
        console.time("textDetection")
        const textResult = await BuildingAnalyzer.detectFromText(client, imageBuffer, currentLocation)
        console.timeEnd("textDetection")
        if (textResult.success) {
          console.log("Text detection successful")
          return BuildingAnalyzer.enrichResult(textResult, objectData[0], propertyData[0], webData[0], safetyData[0])
        }

        console.log("Attempting landmark detection...")
        console.time("landmarkDetection")
        const landmarkResult = await BuildingAnalyzer.detectLandmark(client, imageBuffer)
        console.timeEnd("landmarkDetection")
        if (landmarkResult.success) {
          console.log("Landmark detection successful")
          return BuildingAnalyzer.enrichResult(
            landmarkResult,
            objectData[0],
            propertyData[0],
            webData[0],
            safetyData[0],
          )
        }

        console.log("Attempting visual detection...")
        console.time("visualDetection")
        const visualResult = await BuildingAnalyzer.detectFromVisuals(
          objectData[0],
          propertyData[0],
          webData[0],
          currentLocation,
        )
        console.timeEnd("visualDetection")
        if (visualResult.success) {
          console.log("Visual detection successful")
          return BuildingAnalyzer.enrichResult(visualResult, objectData[0], propertyData[0], webData[0], safetyData[0])
        }

        console.log("All detection methods failed")
        return { success: false, type: "detection-failed", error: "Building not identified" }
      })()

      const timeoutPromise = new Promise<BuildingDetectionResponse>(
        (_, reject) => setTimeout(() => reject(new Error("Analysis timeout")), 55000), // 55 second timeout
      )

      return await Promise.race([analysisPromise, timeoutPromise])
    } catch (error) {
      console.error("Analysis failed:", error)
      console.timeEnd("totalAnalysis")
      return { success: false, type: "detection-failed", error: error.message || "Analysis error occurred" }
    }
  }

  private static async processAnalysisResults(
    textData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    landmarkData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    objectData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    propertyData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    webData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    safetyData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    currentLocation: Location
  ): Promise<BuildingDetectionResponse> {
    // Process all detection methods
    const textResult = await this.detectFromText(textData, currentLocation)
    if (textResult.success) {
      return this.enrichResult(textResult, objectData, propertyData, webData, safetyData)
    }

    const landmarkResult = await this.detectLandmark(landmarkData)
    if (landmarkResult.success) {
      return this.enrichResult(landmarkResult, objectData, propertyData, webData, safetyData)
    }

    const visualResult = await this.detectFromVisuals(objectData, propertyData, webData, currentLocation)
    if (visualResult.success) {
        return this.enrichResult(visualResult, objectData, propertyData, webData, safetyData);
    }

    return {
      success: false,
      type: "detection-failed",
      error: "Building not identified through any detection method"
    }
  }

  private static async enrichResult(
    baseResult: BuildingDetectionResponse,
    objectData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    propertyData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    webData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    safetyData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse
  ): Promise<BuildingDetectionResponse> {
    console.log("Enriching detection result...")
    const enrichedResult: BuildingDetectionResponse = { ...baseResult }

    try {
      // Fetch and merge public information
      if (enrichedResult.description && enrichedResult.location) {
        const [placesData, wikiData, transitData] = await Promise.all([
          this.fetchGooglePlacesData(enrichedResult.description, enrichedResult.location),
          this.fetchWikipediaData(enrichedResult.description),
          this.fetchTransitData(enrichedResult.location)
        ])

        enrichedResult.publicInfo = {
          ...placesData,
          ...wikiData,
          publicTransport: transitData
        }
      }

      // Add building features
      enrichedResult.features = {
        ...enrichedResult.features,
        ...this.extractBuildingFeatures(objectData, webData)
      }

      // Add image properties
      if (propertyData.imagePropertiesAnnotation) {
        enrichedResult.imageProperties = this.extractImageProperties(propertyData)
      }

      // Add safety score
      if (safetyData.safeSearchAnnotation) {
        enrichedResult.safetyScore = this.calculateSafetyScore(safetyData.safeSearchAnnotation)
      }

      // Add similar buildings
      enrichedResult.similarBuildings = this.extractSimilarBuildings(webData)

      // Add metadata
      enrichedResult.lastUpdated = new Date().toISOString()
      enrichedResult.sourceReliability = this.calculateSourceReliability(enrichedResult)

      return enrichedResult
    } catch (error) {
      console.error("Error during result enrichment:", error)
      return enrichedResult
    }
  }

  private static extractBuildingFeatures(
    objectData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    webData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse
  ): BuildingFeatures {
    const features: BuildingFeatures = {}

    // Extract architectural features from object detection
    const objects = objectData.localizedObjectAnnotations || []
    const architecturalElements = objects
      .filter(obj => this.isArchitecturalElement(obj.name || ''))
      .map(obj => obj.name || '')

    features.architecture = [...new Set(architecturalElements)]

    // Extract materials
    features.materials = objects
      .filter(obj => this.isBuildingMaterial(obj.name || ''))
      .map(obj => obj.name || '')

    // Extract style from web detection
    const webEntities = webData.webDetection?.webEntities || []
    features.style = webEntities
      .filter(entity => this.isArchitecturalStyle(entity.description || ''))
      .map(entity => entity.description || '')

    return features
  }

  private static isArchitecturalElement(name: string): boolean {
    const architecturalElements = [
      'column', 'arch', 'dome', 'spire', 'tower', 'facade',
      'window', 'door', 'balcony', 'cornice', 'pillar'
    ]
    return architecturalElements.some(element => 
      name.toLowerCase().includes(element)
    )
  }

  private static isBuildingMaterial(name: string): boolean {
    const materials = [
      'brick', 'stone', 'concrete', 'glass', 'steel', 'wood',
      'marble', 'granite', 'metal', 'copper', 'bronze'
    ]
    return materials.some(material => 
      name.toLowerCase().includes(material)
    )
  }

  private static isArchitecturalStyle(description: string): boolean {
    const styles = [
      'gothic', 'modern', 'contemporary', 'art deco', 'baroque',
      'victorian', 'classical', 'renaissance', 'neoclassical'
    ]
    return styles.some(style => 
      description.toLowerCase().includes(style)
    )
  }

  private static extractImageProperties(
    propertyData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse
  ): BuildingDetectionResponse['imageProperties'] {
    const properties = propertyData.imagePropertiesAnnotation
    const colors = properties?.dominantColors?.colors || []

    return {
      dominantColors: colors.map(color => 
        `rgb(${color.color?.red || 0}, ${color.color?.green || 0}, ${color.color?.blue || 0})`
      ),
      brightness: this.calculateAverageBrightness(colors),
      contrast: this.calculateImageContrast(colors),
      primaryStyle: this.determinePrimaryStyle(properties),
      aestheticScore: this.calculateAestheticScore(properties)
    }
  }

  private static calculateAverageBrightness(
    colors: vision.protos.google.cloud.vision.v1.IColorInfo[]
  ): number {
    if (!colors.length) return 0

    const totalBrightness = colors.reduce((sum, color) => {
      const rgb = color.color || {}
      return sum + ((rgb.red || 0) + (rgb.green || 0) + (rgb.blue || 0)) / 3
    }, 0)

    return totalBrightness / (colors.length * 255)
  }

  private static calculateImageContrast(
    colors: vision.protos.google.cloud.vision.v1.IColorInfo[]
  ): number {
    if (!colors.length) return 0

    const brightnesses = colors.map(color => {
      const rgb = color.color || {}
      return ((rgb.red || 0) + (rgb.green || 0) + (rgb.blue || 0)) / 3
    })

    const maxBrightness = Math.max(...brightnesses)
    const minBrightness = Math.min(...brightnesses)

    return (maxBrightness - minBrightness) / 255
  }

  private static determinePrimaryStyle(
    properties: vision.protos.google.cloud.vision.v1.IImageProperties | null | undefined
  ): string | undefined {
    // Implement style detection based on color patterns and distributions
    return undefined
  }

  private static calculateAestheticScore(
    properties: vision.protos.google.cloud.vision.v1.IImageProperties | null | undefined
  ): number | undefined {
    // Implement aesthetic scoring based on color harmony and composition
    return undefined
  }

  private static calculateSafetyScore(
    safeSearch: vision.protos.google.cloud.vision.v1.IImageProperties | null | undefined
  ): number {
    // Implement safety score calculation
    return 1.0
  }

  private static extractSimilarBuildings(
    webData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse
  ): string[] {
    const entities = webData.webDetection?.webEntities || []
    return entities
      .filter(entity => 
        entity.description?.toLowerCase().includes('building') &&
        entity.score && entity.score > 0.5
      )
      .map(entity => entity.description || '')
      .filter(Boolean)
  }

  private static calculateSourceReliability(result: BuildingDetectionResponse): number {
    let reliabilityScore = 0
    let factorsCount = 0

    // Add confidence score if available
    if (result.confidence) {
      reliabilityScore += result.confidence
      factorsCount++
    }

    // Check for multiple data sources
    if (result.publicInfo) {
      if (result.publicInfo.historicalInfo) {
        reliabilityScore += 0.8
        factorsCount++
      }
      if (result.publicInfo.ratings?.length) {
        reliabilityScore += 0.7
        factorsCount++
      }
    }

    // Consider image quality
    if (result.imageProperties?.contrast && result.imageProperties?.brightness) {
      const imageQualityScore = (result.imageProperties.contrast + result.imageProperties.brightness) / 2
      reliabilityScore += imageQualityScore
      factorsCount++
    }

    return factorsCount > 0 ? reliabilityScore / factorsCount : 0
  }


  static async detectFromText(
    client: vision.ImageAnnotatorClient,
    imageBuffer: Buffer,
    currentLocation: Location,
  ): Promise<BuildingDetectionResponse> {
    console.log("Detecting text from image...")
    const [result] = await client.textDetection({ image: { content: imageBuffer } })
    const detections = result.textAnnotations
  
    if (detections && detections.length > 0) {
      const text = detections[0].description?.toLowerCase()
      console.log("Detected text:", text)
  
      // Enhanced business type detection
      const businessTypes = {
        financial: ['bank', 'credit union', 'atm', 'financial'],
        retail: ['shop', 'store', 'mall', 'market'],
        food: ['restaurant', 'cafe', 'diner'],
        fitness: ['gym', 'fitness', 'sport'],
        office: ['office', 'plaza', 'tower', 'complex'],
        medical: ['hospital', 'clinic', 'medical'],
      }
  
      let detectedType: string | null = null
      let businessName: string | null = null
  
      // First pass: identify business type and name
      for (const [type, keywords] of Object.entries(businessTypes)) {
        if (keywords.some(keyword => text?.includes(keyword))) {
          detectedType = type
          // Extract business name by finding the line containing the keyword
          const lines = text?.split('\n') || []
          for (const line of lines) {
            if (keywords.some(keyword => line.toLowerCase().includes(keyword))) {
              businessName = line.trim()
              break
            }
          }
          break
        }
      }
  
      // Special handling for financial institutions
      if (text?.includes('bank')) {
        const lines = text.split('\n').filter(line => line.trim())
        const bankNameLine = lines.find(line => 
          line.toLowerCase().includes('bank') || 
          /^[A-Za-z\s]+(bank|banking)/i.test(line)
        )
        
        if (bankNameLine) {
          businessName = bankNameLine.trim()
          detectedType = 'financial'
        }
      }
  
      if (detectedType && businessName) {
        console.log(`Identified ${detectedType} building: ${businessName}`)
        
        // Create appropriate features based on business type
        const features: BuildingFeatures = {
          architecture: ["Commercial"],
          constructionType: "Commercial Building",
        }
  
        // Add type-specific features
        if (detectedType === 'financial') {
          features.architecture?.push("Banking Hall")
          features.materials = ["Glass", "Concrete"]
          features.style = ["Modern Commercial"]
        }
  
        // Create the detection response
        return {
          success: true,
          type: "commercial-building",
          description: businessName,
          location: currentLocation,
          confidence: 0.9,
          features,
          publicInfo: {
            openingHours: ["Monday-Friday: 8:00 AM - 5:00 PM"],
            amenities: detectedType === 'financial' 
              ? ["ATM", "Banking Hall", "Customer Service"] 
              : ["Customer Service"],
            type: `${detectedType.charAt(0).toUpperCase() + detectedType.slice(1)} Institution`
          }
        }
      }
  
      // Continue with existing known buildings check
      for (const [buildingName, buildingInfo] of Object.entries(BuildingAnalyzer.KNOWN_BUILDINGS)) {
        if (text?.includes(buildingName.toLowerCase())) {
          console.log(`Matched known building: ${buildingName}`)
          return {
            success: true,
            type: "text-detection",
            ...buildingInfo,
          }
        }
      }
  
      // Attempt geocoding if no commercial building or known building is found
      console.log("Attempting to geocode detected text...")
      const geocodeResult = await geocodeAddress(text || "")
      if (geocodeResult) {
        console.log("Geocoding successful")
        return geocodeResult
      }
    }
  
    return { 
      success: false, 
      type: "text-detection-failed", 
      error: "No building identified from text" 
    }
  }


  static async detectFromVisuals(
    objectData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    propertyData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    webData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    currentLocation: Location,
  ): Promise<BuildingDetectionResponse> {
    console.log("Analyzing visual data...")
    const objects = objectData.localizedObjectAnnotations || []
    
    // Enhanced building detection logic
    const buildingIndicators = objects.filter(obj => {
      const name = obj.name?.toLowerCase() || ""
      return [
        'building', 'architecture', 'wall', 'window', 'door',
        'house', 'structure', 'property', 'facade'
      ].some(indicator => name.includes(indicator))
    })

    if (buildingIndicators.length > 0) {
      console.log("Building indicators found:", buildingIndicators.map(i => i.name))
      const confidence = buildingIndicators.reduce((sum, obj) => sum + (obj.score || 0), 0) / buildingIndicators.length

      return {
        success: true,
        type: "visual-detection",
        description: "Commercial Building",
        location: currentLocation,
        confidence: confidence,
        features: {
          architecture: this.inferArchitecturalFeatures(objects),
          type: "Commercial",
          constructionType: this.inferConstructionType(objects)
        }
      }
    }

    console.log("Visual detection failed to identify building")
    return { success: false, type: "visual-detection-failed", error: "No building identified from visual data" }
  }


  private static calculateBuildingConfidence(
    objects: vision.protos.google.cloud.vision.v1.ILocalizedObjectAnnotation[],
    webEntities: vision.protos.google.cloud.vision.v1.IWebDetection.IWebEntity[]
  ): number {
    let confidence = 0
    let indicators = 0

    // Check direct building detection
    const buildingObject = objects.find(obj => 
      obj.name?.toLowerCase().includes("building") ||
      obj.name?.toLowerCase().includes("structure")
    )
    if (buildingObject) {
      confidence += buildingObject.score || 0
      indicators++
    }

    // Check for building components
    const buildingComponents = objects.filter(obj => 
      ["window", "door", "wall", "roof", "facade"].some(component => 
        obj.name?.toLowerCase().includes(component)
      )
    )
    if (buildingComponents.length > 0) {
      confidence += Math.min(buildingComponents.length * 0.2, 0.8)
      indicators++
    }

    // Check web entities for building-related terms
    const buildingRelatedEntities = webEntities.filter(entity =>
      entity.description?.toLowerCase().match(/building|architecture|structure|house|apartment|office|tower/g)
    )
    if (buildingRelatedEntities.length > 0) {
      confidence += Math.min(
        buildingRelatedEntities.reduce((sum, entity) => sum + (entity.score || 0), 0) / buildingRelatedEntities.length,
        0.8
      )
      indicators++
    }

    return indicators > 0 ? confidence / indicators : 0
  }

  private static extractBuildingCharacteristics(
    objects: vision.protos.google.cloud.vision.v1.ILocalizedObjectAnnotation[],
    properties: vision.protos.google.cloud.vision.v1.IImageProperties | null | undefined
  ): {
    architecturalElements: string[]
    materials: string[]
    styles: string[]
    estimatedHeight: string
    constructionType: string
  } {
    const architecturalElements = new Set<string>()
    const materials = new Set<string>()
    const styles = new Set<string>()
    
    // Analyze objects for architectural elements and materials
    objects.forEach(obj => {
      if (obj.name) {
        // Check for architectural elements
        const elements = ["window", "door", "balcony", "column", "arch", "roof"]
        elements.forEach(element => {
          if (obj.name.toLowerCase().includes(element)) {
            architecturalElements.add(element)
          }
        })

        // Check for materials
        const buildingMaterials = ["glass", "concrete", "brick", "stone", "metal", "wood"]
        buildingMaterials.forEach(material => {
          if (obj.name.toLowerCase().includes(material)) {
            materials.add(material)
          }
        })
      }
    })

    // Estimate height based on vertical objects
    const estimatedHeight = this.estimateBuildingHeight(objects)

    // Determine construction type based on materials
    const constructionType = this.inferConstructionType(Array.from(materials))

    return {
      architecturalElements: Array.from(architecturalElements),
      materials: Array.from(materials),
      styles: Array.from(styles),
      estimatedHeight,
      constructionType
    }
  }

  private static determineBuildingType(
    objects: vision.protos.google.cloud.vision.v1.ILocalizedObjectAnnotation[],
    webEntities: vision.protos.google.cloud.vision.v1.IWebDetection.IWebEntity[]
  ): string {
    const typeIndicators = {
      residential: 0,
      commercial: 0,
      industrial: 0,
      institutional: 0
    }

    // Analyze objects for building type indicators
    objects.forEach(obj => {
      if (obj.name) {
        const name = obj.name.toLowerCase()
        if (name.includes("house") || name.includes("apartment")) typeIndicators.residential++
        if (name.includes("store") || name.includes("office")) typeIndicators.commercial++
        if (name.includes("factory") || name.includes("warehouse")) typeIndicators.industrial++
        if (name.includes("school") || name.includes("hospital")) typeIndicators.institutional++
      }
    })

    // Analyze web entities for building type clues
    webEntities.forEach(entity => {
      if (entity.description) {
        const desc = entity.description.toLowerCase()
        if (desc.match(/house|apartment|residential|home/g)) typeIndicators.residential++
        if (desc.match(/office|store|shop|commercial|retail/g)) typeIndicators.commercial++
        if (desc.match(/factory|industrial|warehouse|plant/g)) typeIndicators.industrial++
        if (desc.match(/school|hospital|government|institution/g)) typeIndicators.institutional++
      }
    })

    // Determine the most likely building type
    const maxType = Object.entries(typeIndicators).reduce((max, [type, count]) => 
      count > max[1] ? [type, count] : max
    , ["unknown", 0])

    return maxType[0] === "unknown" ? "General" : maxType[0].charAt(0).toUpperCase() + maxType[0].slice(1)
  }

  private static estimateBuildingHeight(
    objects: vision.protos.google.cloud.vision.v1.ILocalizedObjectAnnotation[]
  ): string {
    const floorIndicators = objects.filter(obj => 
      obj.name?.toLowerCase().includes("window") ||
      obj.name?.toLowerCase().includes("floor") ||
      obj.name?.toLowerCase().includes("level")
    ).length

    if (floorIndicators === 0) return "Unknown"
    if (floorIndicators <= 2) return "Low-rise"
    if (floorIndicators <= 7) return "Mid-rise"
    return "High-rise"
  }

  

  private static inferConstructionType(materials: string[]): string {
    if (materials.includes("glass") && materials.includes("metal")) return "Modern Steel-Glass"
    if (materials.includes("concrete")) return "Concrete"
    if (materials.includes("brick")) return "Masonry"
    if (materials.includes("wood")) return "Wooden"
    return "Standard Construction"
  }

  private static hasBuildinCharacteristics(
    objects: vision.protos.google.cloud.vision.v1.ILocalizedObjectAnnotation[],
    properties: vision.protos.google.cloud.vision.v1.IImageProperties | null | undefined
  ): boolean {
    // Count building-related objects
    const buildingFeatures = objects.filter(obj => 
      ["window", "door", "wall", "roof", "building", "structure"].some(feature => 
        obj.name?.toLowerCase().includes(feature)
      )
    ).length

    return buildingFeatures >= 2 // If at least 2 building features are detected
  }

  private static inferBuildingFeatures(
    objects: vision.protos.google.cloud.vision.v1.ILocalizedObjectAnnotation[],
    properties: vision.protos.google.cloud.vision.v1.IImageProperties | null | undefined
  ): BuildingFeatures {
    return {
      architecture: objects
        .filter(obj => ["window", "door", "roof", "wall"].some(feature => 
          obj.name?.toLowerCase().includes(feature)
        ))
        .map(obj => obj.name || "")
        .filter(Boolean),
      materials: this.inferMaterialsFromColors(properties),
      height: this.estimateBuildingHeight(objects)
    }
  }

  private static inferArchitecturalFeatures(
    objects: vision.protos.google.cloud.vision.v1.ILocalizedObjectAnnotation[]
  ): string[] {
    const features = new Set<string>()
    
    objects.forEach(obj => {
      const name = obj.name?.toLowerCase() || ""
      if (name.includes('window')) features.add('Modern Windows')
      if (name.includes('glass')) features.add('Glass Facade')
      if (name.includes('wall')) features.add('Commercial Walls')
      if (name.includes('door')) features.add('Commercial Entrance')
    })

    return Array.from(features)
  }


  private static inferMaterialsFromColors(
    properties: vision.protos.google.cloud.vision.v1.IImageProperties | null | undefined
  ): string[] {
    const materials: string[] = []
    const colors = properties?.dominantColors?.colors || []

    colors.forEach(color => {
      const rgb = color.color || {}
      const r = rgb.red || 0
      const g = rgb.green || 0
      const b = rgb.blue || 0

      // Infer materials based on color patterns
      if (r > 200 && g > 200 && b > 200) materials.push("glass")
      if (r > 150 && g > 150 && b > 150) materials.push("concrete")
      if (r > 150 && g < 100 && b < 100) materials.push("brick")
    })

    return [...new Set(materials)]
  }
}

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

async function geocodeAddress(address: string): Promise<BuildingDetectionResponse | null> {
  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
      params: {
        address,
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    })

    const result = response.data.results[0]
    if (result) {
      return {
        success: true,
        type: "geocode",
        address: result.formatted_address,
        location: {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
        },
        description: address,
        confidence: 0.7,
      }
    }
    return null
  } catch (error) {
    console.warn(`Geocoding failed for: ${address}`, error)
    return null
  }
}


async function getStreetViewImage(location: { latitude: number; longitude: number } | string): Promise<Buffer | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("Google Maps API key not configured");
    }

    // Construct location parameter
    const locationParam = typeof location === 'string' 
      ? encodeURIComponent(location)
      : `${location.latitude},${location.longitude}`;

    // Get Street View image
    const response = await axios({
      method: 'get',
      url: `https://maps.googleapis.com/maps/api/streetview`,
      params: {
        size: '600x400',
        location: locationParam,
        key: apiKey,
      },
      responseType: 'arraybuffer'
    });

    if (response.status === 200) {
      return Buffer.from(response.data);
    }

    return null;
  } catch (error) {
    console.error("Error fetching Street View image:", error);
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("Received POST request");
    const formData = await request.formData();
    
    // Check for address input
    const address = formData.get("address");
    if (address && typeof address === "string") {
      console.log("Processing address-based lookup");
      
      // First, geocode the address
      const geocodeResponse = await axios.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        {
          params: {
            address,
            key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          },
        }
      );

      const geocodeResult = geocodeResponse.data.results[0];
      if (!geocodeResult) {
        return NextResponse.json({ 
          success: false, 
          error: "Address not found" 
        }, { status: 404 });
      }

      // Get Street View image for the location
      const streetViewImage = await getStreetViewImage(address);
      if (!streetViewImage) {
        return NextResponse.json({ 
          success: false, 
          error: "Street View image not available for this location" 
        }, { status: 404 });
      }

      // Process the Street View image with Building Analyzer
      const location = {
        latitude: geocodeResult.geometry.location.lat,
        longitude: geocodeResult.geometry.location.lng,
      };

      const result = await BuildingAnalyzer.analyzeImage(streetViewImage, location);
      
      // Add the street view image URL to the response
      return NextResponse.json({
        ...result,
        streetViewUrl: `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
        formattedAddress: geocodeResult.formatted_address,
      }, { status: result.success ? 200 : 404 });
    }

    // Handle existing image upload case
    const image = formData.get("image") as File | null;
    const lat = formData.get("lat");
    const lng = formData.get("lng");

    if (!image && !address) {
      console.error("Invalid image and no address provided");
      return NextResponse.json({ 
        success: false, 
        error: "Must provide either an image or an address" 
      }, { status: 400 });
    }

    let imageBuffer: Buffer;
    let location: Location | null = null;

    if (image) {
      imageBuffer = Buffer.from(await image.arrayBuffer());
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "No image provided" 
      }, { status: 400 });
    }

    if (lat && lng) {
      location = {
        latitude: Number.parseFloat(lat.toString()),
        longitude: Number.parseFloat(lng.toString()),
      };
    } else {
      location = await extractExifLocation(imageBuffer);
    }

    if (!location) {
      return NextResponse.json({ 
        success: false, 
        error: "Location required" 
      }, { status: 400 });
    }

    const result = await BuildingAnalyzer.analyzeImage(imageBuffer, location);
    return NextResponse.json(result, { status: result.success ? 200 : 404 });

  } catch (error) {
    console.error("Request failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
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
  });
}