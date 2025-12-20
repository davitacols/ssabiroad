import { NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

export async function GET() {
  try {
    const response = await fetch(`${ML_API_URL}/stats`, {
      signal: AbortSignal.timeout(5000),
      cache: 'no-store'
    });
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ success: true, ...data });
    }
    
    return NextResponse.json({ success: false, message: 'Stats not available' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
