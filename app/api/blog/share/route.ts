import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { postSlug, platform } = await req.json()
    
    // Simple logging - could be enhanced with analytics service
    console.log(`Share tracked: ${postSlug} on ${platform}`)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}