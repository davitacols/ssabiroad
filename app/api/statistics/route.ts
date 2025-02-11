// app/api/statistics/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return new NextResponse('User not found', { status: 401 })
    }

    // Get current and previous month dates
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Get total detections for current and previous month
    const [currentMonthDetections, previousMonthDetections] = await Promise.all([
      prisma.detection.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: currentMonthStart
          }
        }
      }),
      prisma.detection.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: previousMonthStart,
            lt: currentMonthStart
          }
        }
      })
    ])

    // Get saved locations for current and previous month
    const [currentMonthSaved, previousMonthSaved] = await Promise.all([
      prisma.savedLocation.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: currentMonthStart
          }
        }
      }),
      prisma.savedLocation.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: previousMonthStart,
            lt: currentMonthStart
          }
        }
      })
    ])

    // Calculate average confidence for current and previous month
    const [currentMonthAccuracy, previousMonthAccuracy] = await Promise.all([
      prisma.detection.aggregate({
        where: {
          userId: user.id,
          createdAt: {
            gte: currentMonthStart
          }
        },
        _avg: {
          confidence: true
        }
      }),
      prisma.detection.aggregate({
        where: {
          userId: user.id,
          createdAt: {
            gte: previousMonthStart,
            lt: currentMonthStart
          }
        },
        _avg: {
          confidence: true
        }
      })
    ])

    // Calculate percentage changes
    const detectionChange = previousMonthDetections === 0 ? 100 : 
      ((currentMonthDetections - previousMonthDetections) / previousMonthDetections) * 100

    const savedChange = previousMonthSaved === 0 ? 100 :
      ((currentMonthSaved - previousMonthSaved) / previousMonthSaved) * 100

    const accuracyChange = !previousMonthAccuracy._avg.confidence ? 0 :
      ((currentMonthAccuracy._avg.confidence - previousMonthAccuracy._avg.confidence) / previousMonthAccuracy._avg.confidence) * 100

    const stats = {
      totalDetections: currentMonthDetections,
      detectionChange: Number(detectionChange.toFixed(1)),
      savedBuildings: currentMonthSaved,
      savedBuildingsChange: Number(savedChange.toFixed(1)),
      accuracy: Number((currentMonthAccuracy._avg.confidence * 100).toFixed(1)),
      accuracyChange: Number(accuracyChange.toFixed(1)),
      recentDetections: currentMonthDetections,
      historyChange: detectionChange
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}