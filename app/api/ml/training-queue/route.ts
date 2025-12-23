import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

export async function GET() {
  try {
    // Get from database
    const dbQueue = await prisma.trainingQueue.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Try ML API as fallback
    const healthCheck = await fetch(`${ML_API_URL}/health`, { 
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    }).catch(() => null);
    
    if (!healthCheck?.ok) {
      return NextResponse.json({ 
        queue: dbQueue,
        total: dbQueue.length,
        source: 'database'
      });
    }
    
    // Try /training_queue endpoint
    const response = await fetch(`${ML_API_URL}/training_queue`, { 
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      return NextResponse.json({ 
        queue: dbQueue,
        total: dbQueue.length,
        source: 'database',
        ml_error: `ML API error: ${response.status}` 
      });
    }
    
    const data = await response.json();
    console.log('Training queue data:', data);
    return NextResponse.json(data);
  } catch (error: any) {
    // Fallback to database
    const dbQueue = await prisma.trainingQueue.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    
    return NextResponse.json({ 
      queue: dbQueue,
      total: dbQueue.length,
      source: 'database',
      error: error.message 
    });
  }
}
