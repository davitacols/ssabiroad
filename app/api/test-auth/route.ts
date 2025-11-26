import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
  }

  const apiKey = authHeader.substring(7) // Remove 'Bearer '
  
  try {
    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: true }
    })

    if (!key) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Update usage stats
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { 
        requests: key.requests + 1,
        lastUsed: new Date()
      }
    })

    return NextResponse.json({
      message: 'API key is valid',
      keyName: key.name,
      user: key.user.name,
      requests: key.requests + 1,
      limit: key.limit
    })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}