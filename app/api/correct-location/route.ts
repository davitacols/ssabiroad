import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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

    // Save correction to NeonDB
    const result = await pool.query(
      `INSERT INTO location_corrections 
       (original_address, correct_address, latitude, longitude, original_method, original_confidence, image_features, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id`,
      [
        originalAddress,
        correctAddress,
        coordinates.latitude,
        coordinates.longitude,
        method,
        confidence,
        JSON.stringify(imageFeatures || []),
        new Date(timestamp || Date.now())
      ]
    );

    console.log('Location correction saved:', result.rows[0].id);

    return NextResponse.json({
      success: true,
      message: 'Correction saved successfully',
      correctionId: result.rows[0].id
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