import { type NextRequest, NextResponse } from "next/server"
import * as vision from "@google-cloud/vision"
import axios from "axios"
import * as exifParser from "exif-parser"

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
  }
}

class BuildingAnalyzer {
  private static readonly KNOWN_BUILDINGS = {
    "Empire State Building": {
      address: "20 W 34th St, New York, NY 10118, USA",
      location: { latitude: 40.748817, longitude: -73.985428 },
      description: "Empire State Building",
      confidence: 0.9,
    },
    "Eiffel Tower": {
      address: "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France",
      location: { latitude: 48.858844, longitude: 2.294351 },
      description: "Eiffel Tower",
      confidence: 0.9,
    },
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

  static enrichResult(
    baseResult: BuildingDetectionResponse,
    objectData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    propertyData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    webData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
    safetyData: vision.protos.google.cloud.vision.v1.IAnnotateImageResponse,
  ): BuildingDetectionResponse {
    console.log("Enriching detection result...")
    const objects = objectData.localizedObjectAnnotations
    const properties = propertyData.imagePropertiesAnnotation
    const webEntities = webData.webDetection?.webEntities
    const safeSearch = safetyData.safeSearchAnnotation

    const enrichedResult: BuildingDetectionResponse = { ...baseResult }

    // Add building features
    enrichedResult.features = {
      architecture: objects
        ?.filter((obj) => obj.name?.toLowerCase().includes("architecture"))
        .map((obj) => obj.name || ""),
      materials: objects
        ?.filter((obj) => ["brick", "concrete", "glass", "wood"].includes(obj.name?.toLowerCase() || ""))
        .map((obj) => obj.name || ""),
      style: webEntities
        ?.filter((entity) => entity.description?.toLowerCase().includes("style"))
        .map((entity) => entity.description || ""),
    }

    // Add image properties
    if (properties && properties.dominantColors) {
      enrichedResult.imageProperties = {
        dominantColors:
          properties.dominantColors.colors?.map(
            (color) => `rgb(${color.color?.red}, ${color.color?.green}, ${color.color?.blue})`,
          ) || [],
        brightness:
          properties.dominantColors.colors?.reduce(
            (sum, color) => sum + ((color.color?.red || 0) + (color.color?.green || 0) + (color.color?.blue || 0)) / 3,
            0,
          ) /
            (properties.dominantColors.colors?.length || 1) /
            255 || 0,
        contrast:
          Math.max(
            ...(properties.dominantColors.colors?.map(
              (color) => (color.color?.red || 0) + (color.color?.green || 0) + (color.color?.blue || 0),
            ) || []),
          ) -
          Math.min(
            ...(properties.dominantColors.colors?.map(
              (color) => (color.color?.red || 0) + (color.color?.green || 0) + (color.color?.blue || 0),
            ) || []),
          ),
      }
    }

    // Add similar buildings
    enrichedResult.similarBuildings = webEntities
      ?.filter(
        (entity) =>
          entity.description?.toLowerCase().includes("building") && entity.description !== baseResult.description,
      )
      .map((entity) => entity.description || "")

    // Add safety score
    if (safeSearch) {
      const safetyScores = {
        adult: safeSearch.adult,
        medical: safeSearch.medical,
        racy: safeSearch.racy,
        spoof: safeSearch.spoof,
        violence: safeSearch.violence,
      }
      const scoreMap: { [key: string]: number } = {
        VERY_UNLIKELY: 1,
        UNLIKELY: 2,
        POSSIBLE: 3,
        LIKELY: 4,
        VERY_LIKELY: 5,
      }
      const totalScore = Object.values(safetyScores).reduce((sum, score) => sum + (scoreMap[score || ""] || 0), 0)
      enrichedResult.safetyScore = 1 - totalScore / (Object.keys(safetyScores).length * 5)
    }

    console.log("Enrichment complete")
    return enrichedResult
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

