import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      tags: [
        { tagType: 'label', tagValue: 'Building', confidence: 0.95 },
        { tagType: 'label', tagValue: 'Architecture', confidence: 0.88 },
        { tagType: 'object', tagValue: 'Window', confidence: 0.92 },
        { tagType: 'text', tagValue: 'Sample Text' }
      ],
      message: 'Photo processed successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}