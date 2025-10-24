import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Create geofence
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, latitude, longitude, radius, userId, notifyOnEnter, notifyOnExit } = body;

    if (!latitude || !longitude || !radius) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const geofence = await prisma.geofence.create({
      data: {
        name: name || 'Unnamed Location',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseFloat(radius),
        userId: userId || 'anonymous',
        notifyOnEnter: notifyOnEnter !== false,
        notifyOnExit: notifyOnExit !== false,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      geofence,
      message: 'Geofence created successfully',
    });

  } catch (error: any) {
    console.error('Geofence creation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create geofence',
      details: 'Make sure the Geofence table exists in your database'
    }, { status: 500 });
  }
}

// Check location against geofences
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get('latitude') || '0');
    const longitude = parseFloat(searchParams.get('longitude') || '0');
    const userId = searchParams.get('userId') || 'anonymous';

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    // Get all active geofences for user
    const geofences = await prisma.geofence.findMany({
      where: {
        userId,
        active: true,
      },
    });

    const alerts = [];

    for (const fence of geofences) {
      const distance = calculateDistance(
        latitude,
        longitude,
        fence.latitude,
        fence.longitude
      );

      const isInside = distance <= fence.radius;
      const wasInside = fence.lastStatus === 'inside';

      // Detect enter/exit events
      if (isInside && !wasInside && fence.notifyOnEnter) {
        alerts.push({
          type: 'enter',
          geofence: fence.name,
          distance: distance.toFixed(2),
          message: `You entered ${fence.name}`,
        });

        // Update status
        await prisma.geofence.update({
          where: { id: fence.id },
          data: { lastStatus: 'inside', lastTriggered: new Date() },
        });
      } else if (!isInside && wasInside && fence.notifyOnExit) {
        alerts.push({
          type: 'exit',
          geofence: fence.name,
          distance: distance.toFixed(2),
          message: `You left ${fence.name}`,
        });

        // Update status
        await prisma.geofence.update({
          where: { id: fence.id },
          data: { lastStatus: 'outside', lastTriggered: new Date() },
        });
      }
    }

    return NextResponse.json({
      success: true,
      alerts,
      geofences: geofences.map(f => ({
        id: f.id,
        name: f.name,
        distance: calculateDistance(latitude, longitude, f.latitude, f.longitude).toFixed(2),
        status: calculateDistance(latitude, longitude, f.latitude, f.longitude) <= f.radius ? 'inside' : 'outside',
      })),
    });

  } catch (error: any) {
    console.error('Geofence check error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete geofence
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing geofence ID' }, { status: 400 });
    }

    await prisma.geofence.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Geofence deleted',
    });

  } catch (error: any) {
    console.error('Geofence deletion error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
