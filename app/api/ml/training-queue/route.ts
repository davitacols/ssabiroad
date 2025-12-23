import { NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

export async function GET() {
  try {
    console.log('Checking ML API at:', ML_API_URL);
    
    // Try health check first
    const healthCheck = await fetch(`${ML_API_URL}/health`, { 
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    }).catch(() => null);
    
    if (!healthCheck?.ok) {
      console.error('ML API health check failed');
      return NextResponse.json({ 
        queue: [], 
        total: 0, 
        error: 'ML API is not responding' 
      });
    }
    
    // Try /training_queue endpoint
    const response = await fetch(`${ML_API_URL}/training_queue`, { 
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ML API /training_queue error:', response.status, errorText);
      return NextResponse.json({ 
        queue: [], 
        total: 0, 
        error: `ML API error: ${response.status}` 
      });
    }
    
    const data = await response.json();
    console.log('Training queue data:', data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Training queue error:', error.message);
    return NextResponse.json({ 
      queue: [], 
      total: 0, 
      error: error.message 
    });
  }
}
