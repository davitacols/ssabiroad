import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CORRECTIONS_FILE = path.join(process.cwd(), 'corrections.json');

function loadCorrections() {
  try {
    if (fs.existsSync(CORRECTIONS_FILE)) {
      return JSON.parse(fs.readFileSync(CORRECTIONS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading corrections:', error);
  }
  return [];
}

export async function POST(request: NextRequest) {
  try {
    const { coordinates } = await request.json();
    
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
      return NextResponse.json({ found: false });
    }
    
    const corrections = loadCorrections();
    
    // Find correction for similar coordinates (within ~100m)
    const match = corrections.find(correction => {
      const latDiff = Math.abs(correction.coordinates.latitude - coordinates.latitude);
      const lngDiff = Math.abs(correction.coordinates.longitude - coordinates.longitude);
      return latDiff < 0.001 && lngDiff < 0.001; // ~100m radius
    });
    
    if (match) {
      console.log('Found correction match:', match.correctAddress);
      return NextResponse.json({
        found: true,
        correctAddress: match.correctAddress,
        originalAddress: match.originalAddress,
        correctionId: match.id
      });
    }
    
    return NextResponse.json({ found: false });
    
  } catch (error) {
    console.error('Error in correction lookup:', error);
    return NextResponse.json({ found: false });
  }
}