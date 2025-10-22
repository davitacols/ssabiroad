import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get total locations count
    const totalLocations = await prisma.location.count();
    
    // Get locations from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await prisma.location.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });
    
    // Get locations from this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekCount = await prisma.location.count({
      where: {
        createdAt: {
          gte: weekAgo
        }
      }
    });
    
    const response = {
      totalLocations,
      avgConfidence: 0.85, // Default confidence since not in schema
      todayCount,
      weekCount,
      methods: [],
      topDevices: []
    };
    
    return NextResponse.json(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}