import { ImageAnnotatorClient } from "@google-cloud/vision"

interface ArchitecturalFeatures {
  style: string
  confidence: number
  features: string[]
  period: string
  details: {
    windows?: string
    roof?: string
    facade?: string
    columns?: string
    ornaments?: string
  }
}

// Architectural style patterns and their features
const architecturalStyles = {
  gothic: {
    features: [
      "pointed arch",
      "ribbed vault",
      "flying buttress",
      "spire",
      "stained glass",
      "rose window",
      "tracery",
      "gargoyle",
    ],
    period: "Medieval (12th-16th century)",
  },
  victorian: {
    features: [
      "bay window",
      "turret",
      "ornate woodwork",
      "steep roof",
      "decorative trim",
      "wrap-around porch",
      "gingerbread",
    ],
    period: "Victorian Era (1837-1901)",
  },
  modernist: {
    features: [
      "flat roof",
      "glass wall",
      "steel frame",
      "minimal ornament",
      "geometric shape",
      "open plan",
      "concrete",
    ],
    period: "Modern (20th century)",
  },
  artDeco: {
    features: [
      "geometric pattern",
      "stepped form",
      "decorative panel",
      "zigzag",
      "streamline",
      "chrome",
      "neon",
    ],
    period: "1920s-1930s",
  },
  colonial: {
    features: [
      "symmetrical facade",
      "multi-pane window",
      "shutters",
      "columns",
      "central door",
      "hip roof",
    ],
    period: "17th-19th century",
  },
  mediterranean: {
    features: [
      "tile roof",
      "stucco wall",
      "arched window",
      "courtyard",
      "terrace",
      "low-pitched roof",
    ],
    period: "Early 20th century",
  },
  brutalist: {
    features: ["exposed concrete", "massive form", "raw surface", "geometric shape", "block-like"],
    period: "1950s-1970s",
  },
  contemporary: {
    features: [
      "mixed materials",
      "irregular shape",
      "large window",
      "sustainable feature",
      "open concept",
      "minimal decoration",
    ],
    period: "21st century",
  },
}

export async function detectArchitecturalStyle(
  client: ImageAnnotatorClient,
  imageBuffer: Buffer,
): Promise<ArchitecturalFeatures | null> {
  try {
    // Perform label and object detection
    const [labelResult] = await client.labelDetection({ image: { content: imageBuffer } })
    const [objectResult] = await client.objectLocalization({ image: { content: imageBuffer } })
    const [landmarkResult] = await client.landmarkDetection({ image: { content: imageBuffer } })

    const labels = labelResult.labelAnnotations || []
    const objects = objectResult.localizedObjectAnnotations || []
    const landmarks = landmarkResult.landmarkAnnotations || []

    // Convert all detections to lowercase strings for matching
    const detectedFeatures = new Set([
      ...labels.map((l) => (l.description || "").toLowerCase()),
      ...objects.map((o) => (o.name || "").toLowerCase()),
      ...landmarks.map((l) => (l.description || "").toLowerCase()),
    ])

    let bestMatch = {
      style: "",
      confidence: 0,
      matchedFeatures: [] as string[],
    }

    // Match against each architectural style
    for (const [style, data] of Object.entries(architecturalStyles)) {
      const matchedFeatures = data.features.filter((feature) => {
        return Array.from(detectedFeatures).some((detected) => detected.includes(feature))
      })

      const confidence = matchedFeatures.length / data.features.length

      if (confidence > bestMatch.confidence) {
        bestMatch = {
          style,
          confidence,
          matchedFeatures,
        }
      }
    }

    // Only return a result if we have a reasonable confidence
    if (bestMatch.confidence >= 0.3) {
      // Extract additional architectural details
      const details: ArchitecturalFeatures["details"] = {}

      // Window detection
      if (detectedFeatures.has("window")) {
        if (detectedFeatures.has("arched")) details.windows = "arched windows"
        else if (detectedFeatures.has("bay")) details.windows = "bay windows"
        else if (detectedFeatures.has("dormer")) details.windows = "dormer windows"
        else details.windows = "standard windows"
      }

      // Roof detection
      if (detectedFeatures.has("roof")) {
        if (detectedFeatures.has("flat")) details.roof = "flat roof"
        else if (detectedFeatures.has("pitched")) details.roof = "pitched roof"
        else if (detectedFeatures.has("dome")) details.roof = "domed roof"
        else if (detectedFeatures.has("tile")) details.roof = "tiled roof"
        else details.roof = "standard roof"
      }

      // Facade detection
      if (detectedFeatures.has("facade") || detectedFeatures.has("wall")) {
        if (detectedFeatures.has("brick")) details.facade = "brick facade"
        else if (detectedFeatures.has("stone")) details.facade = "stone facade"
        else if (detectedFeatures.has("glass")) details.facade = "glass facade"
        else if (detectedFeatures.has("concrete")) details.facade = "concrete facade"
        else if (detectedFeatures.has("stucco")) details.facade = "stucco facade"
        else details.facade = "standard facade"
      }

      // Column detection
      if (detectedFeatures.has("column")) {
        if (detectedFeatures.has("corinthian")) details.columns = "Corinthian columns"
        else if (detectedFeatures.has("doric")) details.columns = "Doric columns"
        else if (detectedFeatures.has("ionic")) details.columns = "Ionic columns"
        else details.columns = "standard columns"
      }

      // Ornament detection
      if (
        detectedFeatures.has("ornament") ||
        detectedFeatures.has("decoration") ||
        detectedFeatures.has("carving")
      ) {
        if (detectedFeatures.has("gargoyle")) details.ornaments = "gargoyles"
        else if (detectedFeatures.has("frieze")) details.ornaments = "friezes"
        else if (detectedFeatures.has("relief")) details.ornaments = "relief sculptures"
        else details.ornaments = "decorative elements"
      }

      return {
        style: bestMatch.style,
        confidence: bestMatch.confidence,
        features: bestMatch.matchedFeatures,
        period: architecturalStyles[bestMatch.style as keyof typeof architecturalStyles].period,
        details,
      }
    }

    return null
  } catch (error) {
    console.error("Error detecting architectural style:", error)
    return null
  }
}