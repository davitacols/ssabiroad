import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const mlResponse = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      body: formData,
    });

    if (!mlResponse.ok) {
      throw new Error('ML prediction failed');
    }

    const result = await mlResponse.json();
    
    return NextResponse.json({
      success: true,
      ml_prediction: result,
      method: 'ml-model',
    });

  } catch (error: any) {
    console.error('ML prediction error:', error);
    return NextResponse.json(
      { error: error.message || 'ML prediction failed' },
      { status: 500 }
    );
  }
}
