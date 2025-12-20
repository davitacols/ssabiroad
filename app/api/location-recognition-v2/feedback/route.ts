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
      return NextResponse.json({ success: true, message: 'Feedback recorded (ML training disabled)' });
    }

    const mlFormData = new FormData();
    mlFormData.append('file', file);
    mlFormData.append('latitude', latitude);
    mlFormData.append('longitude', longitude);
    mlFormData.append('metadata', JSON.stringify({ 
      method: 'user-correction',
      address,
      userId,
      timestamp: new Date().toISOString()
    }));

    // Non-blocking training call with longer timeout
    fetch(`${ML_API_URL}/train`, {
      method: 'POST',
      body: mlFormData,
      signal: AbortSignal.timeout(30000)
    }).then(res => res.json())
      .then(result => {
        console.log('✅ Navisense training response:', result);
        // Auto-trigger retrain if queue is large
        if (result.queue_size >= 5) {
          console.log('🔄 Triggering model retrain due to queue size:', result.queue_size);
          fetch(`${ML_API_URL}/retrain`, { method: 'POST' }).catch(() => {});
        }
      })
      .catch(err => console.log('⚠️ Navisense training failed:', err.message));

    return NextResponse.json({ success: true, message: 'Feedback recorded' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
