import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const reference = searchParams.get('reference');
  
  if (!reference) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
  }
  
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference=${reference}&key=${apiKey}`
    );
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch photo' }, { status: response.status });
    }
    
    const imageBuffer = await response.arrayBuffer();
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 });
  }
}
