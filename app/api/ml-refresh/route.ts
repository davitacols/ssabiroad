import { NextRequest, NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Triggering ML model refresh...');
    
    const endpoints = ['/retrain', '/refresh', '/update_model', '/train_now'];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${ML_API_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000)
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Model refresh triggered via ${endpoint}:`, data);
          return NextResponse.json({ success: true, message: 'Model refresh triggered', endpoint, response: data });
        }
      } catch (err) {
        console.log(`❌ ${endpoint} failed:`, err.message);
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'ML API does not support manual refresh. Model will update automatically when queue is processed.'
    }, { status: 400 });
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const response = await fetch(`${ML_API_URL}/queue_status`, { signal: AbortSignal.timeout(5000) });
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ success: true, ...data });
    }
    return NextResponse.json({ success: false, message: 'Queue status not available' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
