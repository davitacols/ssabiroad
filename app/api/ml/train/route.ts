import { NextRequest, NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://52.91.173.191:8000';

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${ML_API_URL}/trigger_training`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
