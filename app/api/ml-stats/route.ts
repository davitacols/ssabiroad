import { NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const response = await fetch(`${ML_API_URL}/stats`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('ML server unavailable');
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'ML server offline', total_buildings: 0, index_size: 0 },
      { status: 503 }
    );
  }
}
