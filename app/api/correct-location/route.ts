import { NextRequest, NextResponse } from 'next/server';

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

    // Log correction for now (can be saved to database later)
    console.log('Location correction received:', {
      originalAddress,
      correctAddress,
      coordinates,
      method,
      confidence,
      timestamp: new Date(timestamp || Date.now())
    });

    return NextResponse.json({
      success: true,
      message: 'Correction received successfully',
      note: 'Correction logged for training'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error processing location correction:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process correction',
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