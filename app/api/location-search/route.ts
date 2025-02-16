import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

interface LocationDetails {
  name: string
  formattedAddress: string
  location: {
    lat: number
    lng: number
  }
  placeId: string
  types: string[]
  website?: string
  phoneNumber?: string
  rating?: number
  userRatingsTotal?: number
}

async function handleLocationSearch(lat: string, lng: string) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key is not configured")
  }

  // Reverse geocoding to get place details
  const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
    params: {
      latlng: `${lat},${lng}`,
      key: GOOGLE_MAPS_API_KEY,
    },
  })

  if (response.data.results.length === 0) {
    throw new Error("No results found for the given coordinates")
  }

  const place = response.data.results[0]
  const placeId = place.place_id

  // Fetch additional place details
  const detailsResponse = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json`, {
    params: {
      place_id: placeId,
      fields: "name,formatted_address,geometry,place_id,types,website,formatted_phone_number,rating,user_ratings_total",
      key: GOOGLE_MAPS_API_KEY,
    },
  })

  const placeDetails = detailsResponse.data.result
  const details: LocationDetails = {
    name: placeDetails.name,
    formattedAddress: placeDetails.formatted_address,
    location: placeDetails.geometry.location,
    placeId: placeDetails.place_id,
    types: placeDetails.types,
    website: placeDetails.website,
    phoneNumber: placeDetails.formatted_phone_number,
    rating: placeDetails.rating,
    userRatingsTotal: placeDetails.user_ratings_total,
  }

  return details
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("query")
  const placeId = searchParams.get("placeId")

  if (!GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ error: "Google Maps API key is not configured" }, { status: 500 })
  }

  try {
    if (query) {
      // Perform location search
      const response = await axios.get(`https://maps.googleapis.com/maps/api/place/autocomplete/json`, {
        params: {
          input: query,
          key: GOOGLE_MAPS_API_KEY,
          types: "establishment",
        },
      })

      const predictions = response.data.predictions.map((prediction: any) => ({
        description: prediction.description,
        placeId: prediction.place_id,
        structuredFormatting: {
          mainText: prediction.structured_formatting.main_text,
          secondaryText: prediction.structured_formatting.secondary_text,
        },
      }))

      return NextResponse.json(predictions)
    } else if (placeId) {
      // Fetch place details
      const response = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json`, {
        params: {
          place_id: placeId,
          fields:
            "name,formatted_address,geometry,place_id,types,website,formatted_phone_number,rating,user_ratings_total",
          key: GOOGLE_MAPS_API_KEY,
        },
      })

      const place = response.data.result
      const details: LocationDetails = {
        name: place.name,
        formattedAddress: place.formatted_address,
        location: place.geometry.location,
        placeId: place.place_id,
        types: place.types,
        website: place.website,
        phoneNumber: place.formatted_phone_number,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
      }

      return NextResponse.json(details)
    } else {
      return NextResponse.json({ error: "Missing query or placeId parameter" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in location search:", error)
    return NextResponse.json({ error: "An error occurred during the location search" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const lat = formData.get("lat")
    const lng = formData.get("lng")

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const details = await handleLocationSearch(lat.toString(), lng.toString())
    return NextResponse.json(details)
  } catch (error) {
    console.error("Error in location processing:", error)
    return NextResponse.json({ error: "An error occurred during location processing" }, { status: 500 })
  }
}

