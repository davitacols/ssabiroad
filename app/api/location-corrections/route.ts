import { NextRequest, NextResponse } from 'next/server';

interface LocationCorrection {
  businessName: string;
  incorrectAddress: string;
  correctAddress: string;
  userLocation?: { latitude: number; longitude: number };
  timestamp: Date;
  verified: boolean;
  votes: number;
}

// In-memory store (replace with database in production)
const corrections: LocationCorrection[] = [];

export async function POST(request: NextRequest) {
  try {
    const { businessName, incorrectAddress, correctAddress, userLocation } = await request.json();
    
    if (!businessName || !incorrectAddress || !correctAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const correction: LocationCorrection = {
      businessName,
      incorrectAddress,
      correctAddress,
      userLocation,
      timestamp: new Date(),
      verified: false,
      votes: 1
    };
    
    // Check for existing similar corrections
    const existing = corrections.find(c => 
      c.businessName.toLowerCase() === businessName.toLowerCase() &&
      c.correctAddress.toLowerCase() === correctAddress.toLowerCase()
    );
    
    if (existing) {
      existing.votes++;
      existing.verified = existing.votes >= 3; // Auto-verify after 3 votes
    } else {
      corrections.push(correction);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Correction submitted successfully',
      verified: existing?.verified || false
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit correction' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessName = searchParams.get('businessName');
  
  if (!businessName) {
    return NextResponse.json({ corrections: [] });
  }
  
  const relevantCorrections = corrections
    .filter(c => c.businessName.toLowerCase().includes(businessName.toLowerCase()))
    .filter(c => c.verified || c.votes >= 2)
    .sort((a, b) => b.votes - a.votes);
  
  return NextResponse.json({ corrections: relevantCorrections });
}