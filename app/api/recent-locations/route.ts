import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const locations = await prisma.location.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    const formattedLocations = locations.map(location => ({
      id: location.id,
      name: location.name,
      address: location.address,
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      confidence: 0.85, // Default confidence
      method: 'prisma',
      apiVersion: 'v1',
      category: 'location',
      rating: null,
      phoneNumber: null,
      createdAt: location.createdAt,
      nearbyPlacesCount: 0,
      photosCount: 0,
      deviceMake: null,
      deviceModel: null,
      description: location.description,
      walkScore: location.walkScore,
      bikeScore: location.bikeScore,
      transitScore: location.transitScore
    }));
    
    return NextResponse.json({ locations: formattedLocations }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
    
  } catch (error) {
    console.error('Recent locations database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent locations', details: error.message },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}