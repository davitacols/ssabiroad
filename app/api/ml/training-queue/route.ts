import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

export async function GET() {
  try {
    // Fetch from database
    const dbQueue = await prisma.trainingQueue.findMany({
      where: { status: { in: ['PENDING', 'SENT'] } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    console.log(`📊 Database queue: ${dbQueue.length} items`);

    // Try ML API
    try {
      const response = await fetch(`${ML_API_URL}/training_queue`, { 
        cache: 'no-store',
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const mlData = await response.json();
        console.log(`📊 ML API queue: ${mlData.total || 0} items`);
        
        // Return ML API queue items if available, otherwise database
        return NextResponse.json({ 
          queue: mlData.queue && mlData.queue.length > 0 ? mlData.queue : dbQueue,
          total: mlData.total || dbQueue.length,
          queue_size: mlData.queue_size || mlData.total || dbQueue.length,
          last_training: mlData.last_training,
          should_retrain: mlData.should_retrain,
          source: mlData.queue && mlData.queue.length > 0 ? 'ml-api' : 'database'
        });
      }
    } catch (mlError) {
      console.log('ML API unavailable, using database only');
    }

    // Return database data
    return NextResponse.json({ 
      queue: dbQueue,
      total: dbQueue.length,
      source: 'database'
    });
  } catch (error: any) {
    console.error('Queue fetch error:', error);
    return NextResponse.json({ 
      queue: [],
      total: 0,
      source: 'database',
      error: error.message
    });
  }
}
