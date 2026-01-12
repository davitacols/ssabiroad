import { NextRequest, NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL;

export async function POST(request: NextRequest) {
  try {
    // If ML API is disabled, return no location found
    if (!ML_API_URL) {
      return NextResponse.json({ 
        hasLocation: false, 
        message: 'ML API disabled - using fallback methods' 
      });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const mlFormData = new FormData();
    mlFormData.append('file', file);

    const response = await fetch(`${ML_API_URL}/predict_location`, {
      method: 'POST',
      body: mlFormData,
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { 
        hasLocation: false, 
        error: error.message || 'ML prediction failed',
        message: 'Falling back to other methods'
      },
      { status: 200 } // Return 200 to allow fallback
    );
  }
}
