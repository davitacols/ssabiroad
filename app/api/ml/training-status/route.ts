import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

export async function GET() {
  try {
    const response = await fetch(`${ML_API_URL}/stats`, { 
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        status: 'idle',
        queue_size: data.feedback_buffer_size || 0,
        last_training: null,
        source: 'ml-api',
        model_version: data.model_version
      });
    }
  } catch (error) {
    // ML API not responding
  }

  try {
    const queueCount = await prisma.trainingQueue.count({
      where: { status: 'PENDING' }
    });
    
    return NextResponse.json({
      status: 'idle',
      queue_size: queueCount,
      last_training: null,
      source: 'database'
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'idle',
      queue_size: 0,
      last_training: null
    });
  }
}
