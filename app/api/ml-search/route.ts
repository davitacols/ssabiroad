/**
 * ML Search API Route - FAISS similarity search
 */
import { NextRequest, NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const k = request.nextUrl.searchParams.get('k') || '5';
    
    const response = await fetch(`${ML_API_URL}/search?k=${k}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ML API error: ${response.statusText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('ML search error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'ML search failed' },
      { status: 500 }
    );
  }
}
