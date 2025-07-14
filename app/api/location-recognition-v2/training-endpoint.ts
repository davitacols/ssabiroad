// Training endpoint for ML model feedback
import { NextRequest, NextResponse } from 'next/server';
import { LocationMLModel } from './ml-model';

const mlModel = new LocationMLModel();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, candidate, isCorrect, phoneNumber, address, area } = body;
    
    if (!businessName || !candidate || typeof isCorrect !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Train model with feedback
    await mlModel.trainWithFeedback(
      businessName,
      candidate,
      isCorrect,
      phoneNumber,
      address,
      area
    );
    
    console.log(`ML model trained with feedback: ${businessName} -> ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Feedback recorded and model updated' 
    });
    
  } catch (error) {
    console.error('Training endpoint error:', error);
    return NextResponse.json({ 
      error: 'Failed to process feedback' 
    }, { status: 500 });
  }
}