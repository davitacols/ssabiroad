import { NextRequest, NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;
    const address = formData.get('address') as string;
    const userId = formData.get('userId') as string;
    
    if (!file || !latitude || !longitude) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Skip ML training if server not configured
    if (!process.env.ML_API_URL) {
      console.log('ML_API_URL not configured, skipping training');
      return NextResponse.json({ 
        success: true, 
        message: 'Feedback recorded (ML training disabled)',
        warning: 'ML_API_URL not configured'
      });
    }

    const mlFormData = new FormData();
    mlFormData.append('file', file);
    mlFormData.append('latitude', latitude);
    mlFormData.append('longitude', longitude);
    mlFormData.append('address', address || 'Unknown');
    mlFormData.append('metadata', JSON.stringify({ 
      method: 'user-correction',
      address: address || 'Unknown',
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString()
    }));

    // Send to ML API and wait for response
    console.log('📤 Sending to ML API /train:', { latitude, longitude, address, userId });
    const mlResponse = await fetch(`${ML_API_URL}/train`, {
      method: 'POST',
      body: mlFormData,
      signal: AbortSignal.timeout(30000)
    });

    console.log('📥 ML API response status:', mlResponse.status);

    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      console.error('❌ ML API error:', mlResponse.status, errorText);
      throw new Error(`ML API error: ${mlResponse.status} - ${errorText}`);
    }

    const result = await mlResponse.json();
    console.log('✅ Navisense training response:', result);
    
    if (!result.queue_size && result.queue_size !== 0) {
      console.error('⚠️ ML API did not return queue_size:', result);
    }
    
    // Auto-trigger retrain if queue is large
    if (result.queue_size >= 5) {
      console.log('🔄 Triggering model retrain due to queue size:', result.queue_size);
      fetch(`${ML_API_URL}/retrain`, { method: 'POST' })
        .then(res => res.json())
        .then(data => console.log('✅ Retrain response:', data))
        .catch(err => console.log('❌ Retrain failed:', err.message));
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Feedback recorded',
      queue_size: result.queue_size,
      ml_response: result
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
