import { ImageAnnotatorClient } from "@google-cloud/vision"
import axios from "axios"
import { getEnv } from "../utils/env"

interface BusinessFeatures {
  isBusinessLocation: boolean
  confidence: number
  name?: string
  type?: string
  chain?: boolean
  signageType?: string
  operationalStatus?: string
  details?: {
    logo?: boolean
    openStatus?: string
    businessHours?: string
    contactInfo?: string
    services?: string[]
    amenities?: string[]
    accessibility?: string[]
  }
}

export async function detectBusinessSignage(
  client: ImageAnnotatorClient,
  imageBuffer: Buffer,
  location: { latitude: number; longitude: number },
): Promise<BusinessFeatures | null> {
  try {
    // Perform text, logo, and label detection
    const [textResult] = await client.textDetection({ image: { content: imageBuffer } })
    const [logoResult] = await client.logoDetection({ image: { content: imageBuffer } })
    const [labelResult] = await client.labelDetection({ image: { content: imageBuffer } })

    const texts = textResult.textAnnotations || []
    const logos = logoResult.logoAnnotations || []
    const labels = labelResult.labelAnnotations || []

    // Business indicators in the image
    const businessIndicators = [
      "store",
      "shop",
      "restaurant",
      "cafe",
      "mall",
      "retail",
      "business",
      "office",
      "commercial",
      "enterprise",
      "establishment",
      "company",
      "service",
    ]

    // Convert all detections to lowercase strings
    const detectedFeatures = new Set([
      ...labels.map((l) => (l.description || "").toLowerCase()),
      ...texts.slice(1).map((t) => (t.description || "").toLowerCase()), // Skip first text which is full text
    ])

    // Check if any business indicators are present
    const matchedIndicators = businessIndicators.filter((indicator) =>
      Array.from(detectedFeatures).some((detected) => detected.includes(indicator)),
    )

    const hasBusinessIndicators = matchedIndicators.length > 0
    const hasLogo = logos.length > 0

    if (hasBusinessIndicators || hasLogo) {
      const response: BusinessFeatures = {
        isBusinessLocation: true,
        confidence: Math.min((matchedIndicators.length / businessIndicators.length + (hasLogo ? 0.3 : 0)), 1),
        signageType: hasLogo ? "Logo Signage" : "Text Signage",
      }

      // Extract business name from text or logo
      if (logos.length > 0) {
        response.name = logos[0].description
        response.chain = true
      } else if (texts.length > 0) {
        // Get the full text content
        const fullText = texts[0].description || ""
        
        // Try to identify business name using common patterns
        const lines = fullText.split("\n")
        const potentialNames = lines.filter(line => {
          // Exclude lines that are likely addresses or generic text
          return !line.match(/^[0-9-]+/) && // Exclude lines starting with numbers
                 !line.match(/^(tel|phone|fax|www|http)/i) && // Exclude contact information
                 !line.match(/^(open|closed|hours)/i) && // Exclude operational information
                 line.length > 3 && // Must be more than 3 characters
                 line.length < 50 // Must be less than 50 characters
        })

        if (potentialNames.length > 0) {
          response.name = potentialNames[0].trim()
        }
      }

      // Determine business type from labels and nearby places
      try {
        const placesResponse = await axios.get(
          "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
          {
            params: {
              location: `${location.latitude},${location.longitude}`,
              radius: 50, // Very small radius for accuracy
              key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
            },
          },
        )

        if (placesResponse.data.results && placesResponse.data.results.length > 0) {
          const place = placesResponse.data.results[0]
          
          // Get business type from place types
          if (place.types && place.types.length > 0) {
            const businessType = place.types[0].replace(/_/g, " ")
            response.type = businessType.charAt(0).toUpperCase() + businessType.slice(1)
          }

          // Get additional details
          try {
            const detailsResponse = await axios.get(
              "https://maps.googleapis.com/maps/api/place/details/json",
              {
                params: {
                  place_id: place.place_id,
                  fields: "opening_hours,formatted_phone_number,website,wheelchair_accessible_entrance",
                  key: getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
                },
              },
            )

            if (detailsResponse.data.result) {
              const details = detailsResponse.data.result
              response.details = {
                logo: hasLogo,
                openStatus: details.opening_hours?.open_now ? "Open" : "Closed",
                businessHours: details.opening_hours?.weekday_text?.join("; "),
                contactInfo: details.formatted_phone_number,
                services: [],
                amenities: [],
                accessibility: details.wheelchair_accessible_entrance ? ["Wheelchair Accessible"] : [],
              }
            }
          } catch (error) {
            console.warn("Error fetching place details:", error)
          }
        }
      } catch (error) {
        console.warn("Error fetching place data:", error)
        
        // Fallback to determining type from labels
        const businessTypes = new Map([
          ["restaurant", ["restaurant", "dining", "eatery", "food service"]],
          ["retail", ["store", "shop", "retail", "boutique"]],
          ["cafe", ["cafe", "coffee shop", "bakery"]],
          ["office", ["office", "corporate", "business center"]],
          ["service", ["salon", "spa", "service center", "repair"]],
        ])

        for (const [type, keywords] of businessTypes) {
          if (keywords.some(keyword => 
            Array.from(detectedFeatures).some(feature => feature.includes(keyword))
          )) {
            response.type = type.charAt(0).toUpperCase() + type.slice(1)
            break
          }
        }
      }

      // Determine operational status from text
      if (texts.length > 0) {
        const fullText = texts[0].description?.toLowerCase() || ""
        if (fullText.includes("open")) {
          response.operationalStatus = "Open"
        } else if (fullText.includes("closed")) {
          response.operationalStatus = "Closed"
        } else if (fullText.includes("coming soon")) {
          response.operationalStatus = "Coming Soon"
        }
      }

      return response
    }

    return null
  } catch (error) {
    console.error("Error detecting business signage:", error)
    return null
  }
}