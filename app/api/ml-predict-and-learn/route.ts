/**
 * ML Prediction with Auto-Learning
 */
import { NextRequest, NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const action = request.nextUrl.searchParams.get('action');
    
    if (action === 'verify') {
      // User verified the prediction - add to FAISS index
      const name = formData.get('name') as string;
      const latitude = parseFloat(formData.get('latitude') as string);
      const longitude = parseFloat(formData.get('longitude') as string);
      
      const metadata = { name, latitude, longitude };
      formData.append('metadata', JSON.stringify(metadata));
      
      const response = await fetch(`${ML_API_URL}/add_to_index`, {
        method: 'POST',
        body: formData,
      });
      
      return NextResponse.json(await response.json());
    } else {
      // Regular prediction
      const response = await fetch(`${ML_API_URL}/predict_location`, {
        method: 'POST',
        body: formData,
      });
      
      return NextResponse.json(await response.json());
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
