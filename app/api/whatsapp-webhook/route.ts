import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const message = body.entry[0].changes[0].value.messages[0]
      const from = message.from
      const messageType = message.type

      if (messageType === 'image') {
        const imageId = message.image.id
        
        // Process image with Pic2Nav
        // Send back location results
        
        return NextResponse.json({ 
          status: 'processing',
          message: '📍 Analyzing your photo... Results coming in 3 seconds!'
        })
      }

      if (messageType === 'text') {
        return NextResponse.json({
          status: 'success',
          message: '📸 Send me a photo of any building and I\'ll find its location instantly!\n\n✨ Powered by Pic2Nav AI'
        })
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}
