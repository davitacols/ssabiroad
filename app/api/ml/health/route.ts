import { NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

export async function GET() {
  try {
    const response = await fetch(`${ML_API_URL}/health`, {
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      return NextResponse.json({ 
        status: 'healthy',
        ml_api: 'online'
      });
    }

    const rootResponse = await fetch(`${ML_API_URL}/`, {
      signal: AbortSignal.timeout(5000)
    });

    if (rootResponse.ok) {
      return NextResponse.json({
        status: 'degraded',
        ml_api: 'responding_but_routes_not_loaded'
      });
    }

    return NextResponse.json({
      status: 'unhealthy',
      ml_api: 'not_responding'
    }, { status: 503 });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      ml_api: 'unreachable',
      error: error.message
    }, { status: 503 });
  }
}
