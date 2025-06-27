import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    await prisma.$connect();
    
    // Test basic query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    // Get user count
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connected successfully',
      userCount,
      testQuery: result
    });
    
  } catch (error) {
    console.error('Database connection error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}