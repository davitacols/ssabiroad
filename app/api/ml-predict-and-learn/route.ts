/**
 * ML Prediction with Auto-Learning
 */
import { NextRequest, NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://52.91.173.191:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const action = request.nextUrl.searchParams.get('action');
    
    if (action === 'verify') {
      // User verified the prediction - add to FAISS index
      const name = formData.get('name') as string;
      const latitude = parseFloat(formData.get('latitude') as string);
      const longitude = parseFloat(formData.get('longitude') as string);
      const address = formData.get('address') as string;
      const confidence = formData.get('confidence') as string;
      const method = formData.get('method') as string;
      const verified = formData.get('verified') === 'true';
      
      const metadata = { 
        name, 
        latitude, 
        longitude,
        address,
        confidence: confidence ? parseFloat(confidence) : null,
        method,
        verified,
        timestamp: new Date().toISOString()
      };
      formData.append('metadata', JSON.stringify(metadata));
      
      console.log('Sending to ML API:', `${ML_API_URL}/add_to_index`);
      console.log('Training data:', metadata);
      
      const response = await fetch(`${ML_API_URL}/add_to_index`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('ML API error:', response.status, errorText);
        throw new Error(`ML API error: ${response.status} ${errorText}`);
      }
      
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
    console.error('ML training error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
