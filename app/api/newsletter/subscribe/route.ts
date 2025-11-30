import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    
    if (existing) {
      await prisma.user.update({
        where: { email },
        data: { emailNotifications: true }
      })
      return NextResponse.json({ message: 'Already subscribed!' })
    }

    await prisma.user.create({
      data: {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        name: name || email.split('@')[0],
        emailNotifications: true,
      }
    })

    return NextResponse.json({ message: 'Subscribed successfully!' })
  } catch (error: any) {
    console.error('Newsletter error:', error?.message)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
