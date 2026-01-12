import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Minimal route test - POST request received');
    
    return NextResponse.json({
      success: true,
      message: 'Minimal route working',
      method: 'test'
    });
  } catch (error) {
    console.error('Minimal route error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Minimal route GET working'
  });
}