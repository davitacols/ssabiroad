import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const location = await prisma.location.create({
      data: {
        id: randomUUID(),
        name: data.name || 'Unknown Location',
        address: data.address || '',
        latitude: data.location?.latitude || 0,
        longitude: data.location?.longitude || 0,
        description: data.description || null,
        userId: data.userId || null
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      id: location.id 
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save location' },
      { status: 500 }
    );
  }
}