import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    
    if (!lat || !lng) {
      return NextResponse.json({ error: "Latitude and longitude required" }, { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Try Google Places API first
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&key=${apiKey}`
    )

    let places: any[] = []

    if (response.ok) {
      const data = await response.json()
      
      if (data.status === "OK" && data.results?.length > 0) {
        places = data.results.slice(0, 10).map((place: any) => {
          const distance = calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            place.geometry.location.lat,
            place.geometry.location.lng
          )
          
          return {
            name: place.name,
            type: place.types?.[0]?.replace(/_/g, ' ') || 'place',
            distance: Math.round(distance),
          }
        }).sort((a: any, b: any) => a.distance - b.distance)
      }
    }

    // If no results from Google Places, provide local fallback data for Calabar area
    if (places.length === 0) {
      const latitude = parseFloat(lat)
      const longitude = parseFloat(lng)
      
      // Check if location is in Calabar area (approximate bounds)
      if (latitude >= 4.9 && latitude <= 5.1 && longitude >= 8.2 && longitude <= 8.5) {
        places = getCalabartNearbyPlaces(latitude, longitude)
      }
    }

    return NextResponse.json({ places })
  } catch (error) {
    console.error("Nearby places error:", error)
    return NextResponse.json({ places: [] })
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Fallback nearby places for Calabar area
function getCalabartNearbyPlaces(lat: number, lng: number): any[] {
  const calabarPlaces = [
    { name: "Calabar Mall", lat: 4.9516, lng: 8.3426, type: "shopping mall" },
    { name: "Transcorp Hotels Calabar", lat: 4.9584, lng: 8.3426, type: "lodging" },
    { name: "Cultural Centre Calabar", lat: 4.9584, lng: 8.3300, type: "tourist attraction" },
    { name: "Calabar Marina Resort", lat: 4.9700, lng: 8.3200, type: "resort" },
    { name: "Tinapa Business Resort", lat: 4.9800, lng: 8.3500, type: "business center" },
    { name: "University of Calabar", lat: 4.9520, lng: 8.3580, type: "university" },
    { name: "Calabar Airport", lat: 4.9760, lng: 8.3470, type: "airport" },
    { name: "Cross River State Secretariat", lat: 4.9600, lng: 8.3400, type: "government office" },
    { name: "Calabar Central Market", lat: 4.9550, lng: 8.3380, type: "market" },
    { name: "Mary Slessor Roundabout", lat: 4.9580, lng: 8.3420, type: "landmark" }
  ]

  return calabarPlaces
    .map(place => ({
      name: place.name,
      type: place.type,
      distance: Math.round(calculateDistance(lat, lng, place.lat, place.lng))
    }))
    .filter(place => place.distance <= 5000) // Within 5km
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 8)
}