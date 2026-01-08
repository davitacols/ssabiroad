import { NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: Request) {
  try {
    const { secret } = await request.json();
    
    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Wait for service to potentially restart
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test the API
    const testResponse = await fetch(`${ML_API_URL}/health`, {
      signal: AbortSignal.timeout(5000)
    });

    if (testResponse.ok) {
      return NextResponse.json({
        success: true,
        message: 'ML API is online',
        status: 'online'
      });
    }

    return NextResponse.json({
      success: false,
      message: 'ML API not responding',
      status: 'offline'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
