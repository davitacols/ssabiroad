import { NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

export async function GET() {
  try {
    const response = await fetch(`${ML_API_URL}/training_queue`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to fetch queue');
    return NextResponse.json(await response.json());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
