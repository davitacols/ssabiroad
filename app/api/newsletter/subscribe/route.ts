import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sendWelcomeEmail } from '@/lib/email'

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

    const user = await prisma.user.create({
      data: {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        name: name || email.split('@')[0],
        emailNotifications: true,
      }
    })

    await sendWelcomeEmail(email, user.name || 'Reader')

    return NextResponse.json({ message: 'Subscribed successfully!' })
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
