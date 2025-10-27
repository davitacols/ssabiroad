import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { buildingId, type, value, unit } = await request.json();

    if (!buildingId || !type || !value || !unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const measurement = {
      id: `measurement_${Date.now()}`,
      buildingId,
      type,
      value,
      unit,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, measurement });
  } catch (error) {
    console.error('AR measurement error:', error);
    return NextResponse.json({ error: 'Failed to save measurement' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');

    if (!buildingId) {
      return NextResponse.json({ error: 'Building ID required' }, { status: 400 });
    }

    const measurements = [];
    return NextResponse.json({ measurements });
  } catch (error) {
    console.error('Get measurements error:', error);
    return NextResponse.json({ error: 'Failed to fetch measurements' }, { status: 500 });
  }
}
