import { NextRequest, NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const queueRes = await fetch(`${ML_API_URL}/training_queue`, { cache: 'no-store' });
    const queue = await queueRes.json();
    
    if (!queue.queue || queue.queue.length === 0) {
      return NextResponse.json({ message: 'No items in queue', triggered: false });
    }

    const trainRes = await fetch(`${ML_API_URL}/trigger_training`, { method: 'POST' });
    if (!trainRes.ok) throw new Error('Training trigger failed');
    
    const result = await trainRes.json();
    return NextResponse.json({ ...result, triggered: true, queue_size: queue.queue.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, triggered: false }, { status: 500 });
  }
}
