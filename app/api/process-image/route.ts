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
      const text = detections[0].description
      console.log("Detected text:", text)

      // Check if the text matches any known buildings
      for (const [buildingName, buildingInfo] of Object.entries(BuildingAnalyzer.KNOWN_BUILDINGS)) {
        if (text?.toLowerCase().includes(buildingName.toLowerCase())) {
          console.log(`Matched known building: ${buildingName}`)
          return {
            success: true,
            type: "text-detection",
            ...buildingInfo,
          }
        }
      }

      // If no known building is matched, attempt to geocode the detected text
      console.log("Attempting to geocode detected text...")
      const geocodeResult = await geocodeAddress(text || "")
      if (geocodeResult) {
        console.log("Geocoding successful")
        return geocodeResult
      }
    }

    console.log("Text detection failed to identify building")
    return { success: false, type: "text-detection-failed", error: "No building identified from text" }
  }

  static async detectLandmark(
    client: vision.ImageAnnotatorClient,
    imageBuffer: Buffer,
  ): Promise<BuildingDetectionResponse> {
    console.log("Detecting landmarks...")
    const [result] = await client.landmarkDetection({ image: { content: imageBuffer } })
    const landmarks = result.landmarkAnnotations

    if (landmarks && landmarks.length > 0) {
      const landmark = landmarks[0]
      console.log("Detected landmark:", landmark.description)

      if (landmark.locations && landmark.locations.length > 0) {
        const location = landmark.locations[0].latLng
        return {
          success: true,
          type: "landmark-detection",
          description: landmark.description,
          location: {
            latitude: location?.latitude || 0,
            longitude: location?.longitude || 0,
          },
          confidence: landmark.score || 0,
        }
      }
    }

    console.log("Landmark detection failed")
    return { success: false, type: "landmark-detection-failed", error: "No landmark detected" }
  }

  static async detectFromVisuals(
    objectData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    propertyData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    webData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    currentLocation: Location,
  ): Promise<BuildingDetectionResponse> {
    console.log("Analyzing visual data...")
    const objects = objectData.localizedObjectAnnotations
    const properties = propertyData.imagePropertiesAnnotation
    const webEntities = webData.webDetection?.webEntities

    if (objects && objects.some((obj) => obj.name?.toLowerCase().includes("building"))) {
      console.log("Building object detected")
      return {
        success: true,
        type: "visual-detection",
        description: "Unidentified building",
        location: currentLocation,
        confidence: objects.find((obj) => obj.name?.toLowerCase().includes("building"))?.score || 0,
      }
    }

    if (webEntities && webEntities.length > 0) {
      console.log("Web entities detected:", webEntities.map((e) => e.description).join(", "))
      for (const entity of webEntities) {
        if (entity.description && BuildingAnalyzer.KNOWN_BUILDINGS.hasOwnProperty(entity.description)) {
          console.log(`Matched known building from web entity: ${entity.description}`)
          return {
            success: true,
            type: "web-detection",
            ...BuildingAnalyzer.KNOWN_BUILDINGS[entity.description as keyof typeof BuildingAnalyzer.KNOWN_BUILDINGS],
            confidence: entity.score || 0,
          }
        }
      }
    }

    console.log("Visual detection failed to identify building")
    return { success: false, type: "visual-detection-failed", error: "No building identified from visual data" }
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("Received POST request")
    const formData = await request.formData()
    const image = formData.get("image") as File | null
    const lat = formData.get("lat")
    const lng = formData.get("lng")

    console.log("Received form data:", {
      image: image ? `File present (${image.size} bytes)` : "No file",
      lat,
      lng,
    })

    if (!image || !(image instanceof File)) {
      console.error("Invalid image")
      return NextResponse.json({ success: false, error: "Invalid image" }, { status: 400 })
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer())
    let location: Location | null = null

    if (lat && lng) {
      location = {
        latitude: Number.parseFloat(lat.toString()),
        longitude: Number.parseFloat(lng.toString()),
      }
    } else {
      location = await extractExifLocation(imageBuffer)
    }

    console.log("Parsed location:", location)

    if (!location) {
      console.error("Location required")
      return NextResponse.json({ success: false, error: "Location required" }, { status: 400 })
    }

    console.log("Starting building analysis...")
    const result = await BuildingAnalyzer.analyzeImage(imageBuffer, location)
    console.log("Analysis result:", result)

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

