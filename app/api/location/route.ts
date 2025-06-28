import { getLocation } from '../../../lib/location-smart';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
  }

  try {
    const location = await getLocation(query);
    return NextResponse.json(location);
  } catch (error) {
    return NextResponse.json({ error: 'Location not found' }, { status: 404 });
  }
}