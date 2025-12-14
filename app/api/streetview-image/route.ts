import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');
  
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  
  const imgPath = path.join(process.cwd(), 'data', 'nigeria_valid', file);
  const img = fs.readFileSync(imgPath);
  
  return new NextResponse(img, { headers: { 'Content-Type': 'image/jpeg' } });
}
