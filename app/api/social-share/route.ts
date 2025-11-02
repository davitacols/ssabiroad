import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, locationData } = body;
    
    if (!platform || !locationData) {
      return NextResponse.json({ error: 'Platform and location data required' }, { status: 400 });
    }
    
    const { name, location, address } = locationData;
    const mapUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    
    let shareUrl = '';
    let shareText = `📍 ${name}\n${address || ''}\n${mapUrl}`;
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(mapUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(mapUrl)}&text=${encodeURIComponent(name)}`;
        break;
      default:
        return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      shareUrl,
      shareText
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
