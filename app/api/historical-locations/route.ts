import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '1');
    
    const historicalLocations = await prisma.locationRecognition.findMany({
      where: {
        latitude: { gte: lat - radius, lte: lat + radius },
        longitude: { gte: lng - radius, lte: lng + radius }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    return NextResponse.json({
      success: true,
      count: historicalLocations.length,
      locations: historicalLocations
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, address, latitude, longitude, confidence, method, userId } = body;
    
    const location = await prisma.locationRecognition.create({
      data: {
        businessName,
        detectedAddress: address,
        latitude,
        longitude,
        confidence,
        method,
        userId,
        imageHash: body.imageHash || null
      }
    });
    
    return NextResponse.json({ success: true, location });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
