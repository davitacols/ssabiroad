import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CORRECTIONS_FILE = path.join(process.cwd(), 'corrections.json');

// Load existing corrections
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

// Save corrections to file
function saveCorrections(corrections) {
  try {
    fs.writeFileSync(CORRECTIONS_FILE, JSON.stringify(corrections, null, 2));
  } catch (error) {
    console.error('Error saving corrections:', error);
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      originalAddress,
      correctAddress,
      coordinates,
      imageFeatures,
      method,
      confidence,
      timestamp
    } = body;

    // Load existing corrections
    const corrections = loadCorrections();
    
    // Add new correction
    const newCorrection = {
      id: Date.now(),
      originalAddress,
      correctAddress,
      coordinates,
      method,
      confidence,
      timestamp: new Date(timestamp || Date.now()).toISOString(),
      imageFeatures: imageFeatures || []
    };
    
    corrections.push(newCorrection);
    
    // Save to file
    saveCorrections(corrections);
    
    console.log('Location correction saved:', newCorrection.id);

    return NextResponse.json({
      success: true,
      message: 'Correction saved successfully',
      correctionId: newCorrection.id,
      totalCorrections: corrections.length
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error processing location correction:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process correction',
        details: error.message 
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}