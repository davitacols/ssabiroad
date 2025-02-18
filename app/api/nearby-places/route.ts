// /app/api/nearby-places/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyC56tMVTlDcInBCHog0YqkuQ2cgH9JJuhU";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || '1000'; // Default 1km radius
  
  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng parameters are required' }, { status: 400 });
  }
  
  try {
    // Fetch multiple nearby place types
    const placeTypes = ['restaurant', 'park', 'school', 'hospital', 'shopping_mall', 'transit_station'];
    const results: Record<string, any[]> = {};
    
    for (const type of placeTypes) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK') {
        results[type] = data.results.map((place: any) => ({
          place_id: place.place_id,
          name: place.name,
          vicinity: place.vicinity,
          location: place.geometry?.location,
          types: place.types,
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
          price_level: place.price_level
        }));
      } else {
        results[type] = [];
      }
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return NextResponse.json({ error: 'Failed to fetch nearby places' }, { status: 500 });
  }
}