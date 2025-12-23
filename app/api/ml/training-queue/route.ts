import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

export async function GET() {
  try {
    // Try ML API first
    const response = await fetch(`${ML_API_URL}/training_queue`, { 
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Training queue from ML API:', data);
      return NextResponse.json(data);
    }
    
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
      ml_error: `ML API returned ${response.status}` 
    });
  } catch (error: any) {
    // Fallback to database on error
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
