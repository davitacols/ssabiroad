import { ImageAnnotatorClient } from "@google-cloud/vision"
import axios from "axios"
import { getEnv } from "../utils/env"

interface HistoricalFeatures {
  isHistorical: boolean
  confidence: number
  type?: string
  period?: string
  significance?: string
  details?: {
    yearBuilt?: string
    architect?: string
    historicalEvents?: string[]
    preservation?: string
    designation?: string
  }
}

export async function detectHistoricalLandmark(
  client: ImageAnnotatorClient,
  imageBuffer: Buffer,
  location: { latitude: number; longitude: number },
): Promise<HistoricalFeatures | null> {
  try {
    // Perform landmark and label detection
    const [landmarkResult] = await client.landmarkDetection({ image: { content: imageBuffer } })
    const [labelResult] = await client.labelDetection({ image: { content: imageBuffer } })

    const landmarks = landmarkResult.landmarkAnnotations || []
    const labels = labelResult.labelAnnotations || []

    // Convert detections to lowercase strings
    const detectedFeatures = new Set([
      ...landmarks.map((l) => (l.description || "").toLowerCase()),
      ...labels.map((l) => (l.description || "").toLowerCase()),
    ])

    // Historical architecture indicators
    const historicalIndicators = [
      "historic",
      "heritage",
      "landmark",
      "monument",
      "memorial",
      "ancient",
      "ruins",
      "castle",
      "palace",
      "cathedral",
      "temple",
      "archaeological",
      "historical",
      "preserved",
      "traditional",
      "classical",
      "vintage",
      "colonial",
      "victorian",
      "medieval",
      "renaissance",
      "baroque",
      "gothic",
    ]

    // Check if any historical indicators are present
    const matchedIndicators = historicalIndicators.filter((indicator) =>
      Array.from(detectedFeatures).some((detected) => detected.includes(indicator)),
    )

    const confidence = matchedIndicators.length / historicalIndicators.length

    if (confidence > 0.1 || landmarks.length > 0) {
      // It's likely a historical site
      const response: HistoricalFeatures = {
        isHistorical: true,
        confidence: Math.min(confidence + (landmarks.length > 0 ? 0.3 : 0), 1),
      }

      // If we have a landmark match, use it
      if (landmarks.length > 0) {
        const mainLandmark = landmarks[0]
        response.type = "Recognized Historical Landmark"
        response.details = {
          designation: mainLandmark.description || undefined,
        }

        // Try to get additional information from Wikipedia API
        try {
          const wikiResponse = await axios.get(
            "https://en.wikipedia.org/w/api.php",
            {
              params: {
                action: "query",
                format: "json",
                prop: "extracts|categories",
                exintro: true,
                explaintext: true,
                titles: mainLandmark.description,
              },
            },
          )

          const pages = wikiResponse.data.query.pages
          const pageId = Object.keys(pages)[0]
          if (pageId && pageId !== "-1") {
            const page = pages[pageId]
            response.significance = page.extract
            
            // Extract year built from categories or text
            const yearMatch = page.extract?.match(/built in (\d{4})|constructed in (\d{4})|completed in (\d{4})/)
            if (yearMatch) {
              response.details!.yearBuilt = yearMatch[1] || yearMatch[2] || yearMatch[3]
            }

            // Extract architect if mentioned
            const architectMatch = page.extract?.match(/designed by ([^.]+)/)
            if (architectMatch) {
              response.details!.architect = architectMatch[1].trim()
            }

            // Extract historical events
            response.details!.historicalEvents = []
            const events = page.extract?.match(/(?:In|During|On) \d{4}[^.]+\./g)
            if (events) {
              response.details!.historicalEvents = events.slice(0, 3)
            }
          }
        } catch (error) {
          console.warn("Error fetching Wikipedia data:", error)
        }
      } else {
        // Use detected features to determine type and period
        if (detectedFeatures.has("castle") || detectedFeatures.has("palace")) {
          response.type = "Historical Castle/Palace"
          response.period = "Medieval/Renaissance"
        } else if (detectedFeatures.has("church") || detectedFeatures.has("cathedral")) {
          response.type = "Historical Religious Building"
          if (detectedFeatures.has("gothic")) response.period = "Gothic"
          else if (detectedFeatures.has("baroque")) response.period = "Baroque"
          else if (detectedFeatures.has("renaissance")) response.period = "Renaissance"
          else response.period = "Historical"
        } else if (detectedFeatures.has("monument") || detectedFeatures.has("memorial")) {
          response.type = "Monument/Memorial"
          response.period = "Historical"
        } else {
          response.type = "Historical Building"
          if (detectedFeatures.has("victorian")) response.period = "Victorian"
          else if (detectedFeatures.has("colonial")) response.period = "Colonial"
          else if (detectedFeatures.has("classical")) response.period = "Classical"
          else response.period = "Unknown Historical Period"
        }
      }

      // Try to get preservation status from nearby place details
      try {
        const placesResponse = await axios.get(
          "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
          {
            params: {
              location: `${location.latitude},${location.longitude}`,
              radius: 100,
              key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
            },
          },
        )

        if (placesResponse.data.results && placesResponse.data.results.length > 0) {
          const place = placesResponse.data.results[0]
          if (place.types.includes("museum") || place.types.includes("landmark")) {
            response.details = response.details || {}
            response.details.preservation = "Actively Preserved"
          }
        }
      } catch (error) {
        console.warn("Error fetching place details:", error)
      }

      return response
    }

    return null
  } catch (error) {
    console.error("Error detecting historical landmark:", error)
    return null
  }
}