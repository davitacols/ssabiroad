import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${process.env.GOOGLE_PLACES_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Google Places API error');
    }

    const data = await response.json();
    
    const results = data.predictions?.map((prediction: any) => ({
      id: prediction.place_id,
      name: prediction.structured_formatting?.main_text || prediction.description,
      address: prediction.description,
      category: prediction.types?.[0] || 'place',
      placeId: prediction.place_id
    })) || [];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Places search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}