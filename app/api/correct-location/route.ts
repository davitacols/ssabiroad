import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      originalAddress,
      correctAddress,
      coordinates,
      imageFeatures,
      method,
      confidence,
      timestamp
    } = body;

    // Save correction to database
    const correction = await prisma.locationCorrection.create({
      data: {
        originalAddress,
        correctAddress,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        originalMethod: method,
        originalConfidence: confidence,
        imageFeatures: JSON.stringify(imageFeatures || []),
        createdAt: new Date(timestamp || Date.now())
      }
    });

    console.log('Location correction saved:', correction.id);

    return NextResponse.json({
      success: true,
      message: 'Correction saved successfully',
      correctionId: correction.id
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error saving location correction:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save correction',
        details: error.message 
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}