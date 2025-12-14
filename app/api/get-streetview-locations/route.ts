import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const dataDir = path.join(process.cwd(), 'data', 'nigeria_valid');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  
  const locations = files.map(file => {
    const json = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));
    const imgFile = file.replace('.json', '.jpg');
    return {
      ...json,
      image: `/api/streetview-image?file=${imgFile}`
    };
  });
  
  return NextResponse.json({ locations });
}
