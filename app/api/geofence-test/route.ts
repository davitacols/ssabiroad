import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const count = await prisma.geofence.count();
    return NextResponse.json({ 
      success: true, 
      message: 'Geofence table exists',
      count 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      code: error.code 
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const geofence = await prisma.geofence.create({
      data: {
        name: 'Test Location',
        latitude: 40.7128,
        longitude: -74.0060,
        radius: 100,
        userId: 'test-user'
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      geofence 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      code: error.code 
    }, { status: 500 });
  }
}