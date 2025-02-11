// app/api/db-test/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Try to count users as a simple test
    const count = await prisma.user.count();
    
    return NextResponse.json({ 
      status: "Connected", 
      userCount: count,
      dbURLs: {
        hasPrismaURL: !!process.env.POSTGRES_PRISMA_URL,
        hasNonPoolingURL: !!process.env.POSTGRES_URL_NON_POOLING,
        hasJWTSecret: !!process.env.JWT_SECRET
      }
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json({ 
      error: "Database connection failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}