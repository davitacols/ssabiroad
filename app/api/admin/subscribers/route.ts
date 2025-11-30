import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { email: { not: null } },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        emailNotifications: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ users, count: users.length })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
