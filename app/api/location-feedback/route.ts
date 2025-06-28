import { recordFeedback } from '../../../lib/location-smart';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query, result, isCorrect } = await request.json();
    
    if (!query || !result || typeof isCorrect !== 'boolean') {
      return NextResponse.json({ error: 'Invalid feedback data' }, { status: 400 });
    }

    recordFeedback(query, result, isCorrect);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 });
  }
}