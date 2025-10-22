import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get bookmarks (saved locations) from the database
    const bookmarks = await prisma.bookmark.findMany({
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

    // Also get regular locations as "saved locations"
    const locations = await prisma.location.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format bookmarks as locations
    const formattedBookmarks = bookmarks.map(bookmark => ({
      id: bookmark.id,
      name: bookmark.title,
      address: bookmark.url,
      location: null,
      confidence: 1.0,
      method: 'bookmark',
      apiVersion: 'v1',
      category: 'bookmark',
      rating: null,
      phoneNumber: null,
      createdAt: bookmark.createdAt,
      nearbyPlacesCount: 0,
      photosCount: 0,
      deviceMake: null,
      deviceModel: null
    }));

    // Format locations
    const formattedLocations = locations.map(location => ({
      id: location.id,
      name: location.name,
      address: location.address,
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      confidence: 0.85,
      method: 'location',
      apiVersion: 'v1',
      category: 'location',
      rating: null,
      phoneNumber: null,
      createdAt: location.createdAt,
      nearbyPlacesCount: 0,
      photosCount: 0,
      deviceMake: null,
      deviceModel: null
    }));

    // Combine and sort by creation date
    const allSavedLocations = [...formattedBookmarks, ...formattedLocations]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return NextResponse.json({
      locations: allSavedLocations,
      total: allSavedLocations.length
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved locations', details: error.message }, 
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