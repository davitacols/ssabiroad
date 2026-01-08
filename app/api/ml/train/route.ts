import { NextRequest, NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

export async function POST(request: NextRequest) {
  try {
    // First, download Street View images for pending items
    console.log('📥 Downloading Street View images for training...');
    const downloadRes = await fetch(`${request.nextUrl.origin}/api/ml/download-streetview`, {
      method: 'POST'
    });
    
    if (downloadRes.ok) {
      const downloadData = await downloadRes.json();
      console.log('✅ Downloaded:', downloadData);
    }

    // Then trigger training
    const response = await fetch(`${ML_API_URL}/retrain`, {
      method: 'POST',
      signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `ML API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Training trigger failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const response = await fetch(`${ML_API_URL}/stats`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
