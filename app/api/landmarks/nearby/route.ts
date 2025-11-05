import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ landmarks: [] });
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50000&type=tourist_attraction&key=${apiKey}`
    );

    if (!response.ok) {
      console.error('Google API error:', response.status);
      return NextResponse.json({ landmarks: [] });
    }

    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google API status:', data.status, data.error_message);
      return NextResponse.json({ landmarks: [] });
    }

    if (data.results && data.results.length > 0) {
      const landmarks = data.results.slice(0, 20).map((place: any) => ({
        name: place.name,
        vicinity: place.vicinity,
        rating: place.rating,
        photoReference: place.photos?.[0]?.photo_reference,
        types: place.types,
      }));

      return NextResponse.json({ landmarks });
    }

    return NextResponse.json({ landmarks: [] });
  } catch (error) {
    console.error('Error fetching landmarks:', error);
    return NextResponse.json({ error: 'Failed to fetch landmarks' }, { status: 500 });
  }
}
