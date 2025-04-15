import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("query")

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ error: "Google Maps API key is not configured" }, { status: 500 })
  }

  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/textsearch/json", {
      params: {
        query,
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    })

    if (response.data.status !== "OK" && response.data.status !== "ZERO_RESULTS") {
      console.error("Google Places API error:", response.data.status, response.data.error_message)
      return NextResponse.json({ error: `Google Places API error: ${response.data.status}` }, { status: 500 })
    }

    // Transform the results to match our expected format
    const results = response.data.results.map((place: any) => {
      // Determine category and building type based on place types
      const category = getCategoryFromTypes(place.types)
      const buildingType = getBuildingTypeFromTypes(place.types)

      // Format photos URLs if available
      const photos = place.photos
        ? place.photos
            .slice(0, 1)
            .map(
              (photo: any) =>
                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
            )
        : ["/placeholder.svg?height=100&width=100"]

      return {
        id: place.place_id,
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        formattedAddress: place.formatted_address,
        category,
        buildingType,
        confidence: 0.9, // Google Places results are generally reliable
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        photos,
        rating: place.rating || null,
      }
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error searching places:", error)
    return NextResponse.json({ error: "Failed to search places" }, { status: 500 })
  }
}

// Helper function to determine category from place types
function getCategoryFromTypes(types: string[]): string {
  if (!types || types.length === 0) return "Unknown"

  const typeMapping: Record<string, string> = {
    restaurant: "Restaurant",
    cafe: "Restaurant",
    food: "Restaurant",
    bar: "Restaurant",
    lodging: "Hospitality",
    hotel: "Hospitality",
    store: "Retail",
    shopping_mall: "Retail",
    supermarket: "Retail",
    grocery_or_supermarket: "Retail",
    park: "Park",
    museum: "Cultural",
    art_gallery: "Cultural",
    tourist_attraction: "Tourist Attraction",
    point_of_interest: "Point of Interest",
    establishment: "Business",
    health: "Healthcare",
    hospital: "Healthcare",
    doctor: "Healthcare",
    school: "Education",
    university: "Education",
    library: "Education",
    airport: "Transportation",
    train_station: "Transportation",
    transit_station: "Transportation",
    bus_station: "Transportation",
    place_of_worship: "Religious",
    church: "Religious",
    mosque: "Religious",
    synagogue: "Religious",
    temple: "Religious",
    stadium: "Entertainment",
    movie_theater: "Entertainment",
    amusement_park: "Entertainment",
    zoo: "Entertainment",
    aquarium: "Entertainment",
    city_hall: "Government",
    local_government_office: "Government",
    police: "Government",
    post_office: "Government",
    fire_station: "Government",
  }

  // Find the first matching type
  for (const type of types) {
    if (typeMapping[type]) {
      return typeMapping[type]
    }
  }

  // Default to the first type, capitalized
  return types[0]
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// Helper function to determine building type from place types
function getBuildingTypeFromTypes(types: string[]): string {
  if (!types || types.length === 0) return "Unknown"

  if (types.includes("restaurant") || types.includes("cafe") || types.includes("bar") || types.includes("food")) {
    return "Commercial - Restaurant"
  } else if (types.includes("store") || types.includes("shopping_mall") || types.includes("supermarket")) {
    return "Commercial - Retail"
  } else if (types.includes("lodging") || types.includes("hotel")) {
    return "Commercial - Hospitality"
  } else if (types.includes("hospital") || types.includes("doctor") || types.includes("health")) {
    return "Healthcare"
  } else if (types.includes("school") || types.includes("university") || types.includes("library")) {
    return "Educational"
  } else if (types.includes("place_of_worship") || types.includes("church") || types.includes("mosque")) {
    return "Religious"
  } else if (types.includes("stadium") || types.includes("movie_theater") || types.includes("amusement_park")) {
    return "Entertainment"
  } else if (types.includes("museum") || types.includes("art_gallery")) {
    return "Cultural"
  } else if (types.includes("airport") || types.includes("train_station") || types.includes("transit_station")) {
    return "Transportation"
  } else if (types.includes("city_hall") || types.includes("local_government_office")) {
    return "Government"
  } else if (types.includes("park")) {
    return "Landmark"
  } else if (types.includes("establishment")) {
    return "Commercial"
  }

  return "General Building"
}
