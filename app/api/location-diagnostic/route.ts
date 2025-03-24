import { NextRequest, NextResponse } from "next/server"
import * as vision from "@google-cloud/vision"
import prisma from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envChecks = {
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      GCLOUD_CREDENTIALS: !!process.env.GCLOUD_CREDENTIALS,
      DATABASE_URL: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    }

    // Test database connection
    let dbStatus = "Unknown"
    let dbError = null
    try {
      // Simple query to test connection
      await prisma.$queryRaw`SELECT 1`
      dbStatus = "Connected"
    } catch (error: any) {
      dbStatus = "Error"
      dbError = error.message
    }

    // Test Google Cloud Vision credentials
    let visionStatus = "Unknown"
    let visionError = null
    try {
      if (process.env.GCLOUD_CREDENTIALS) {
        const base64Credentials = process.env.GCLOUD_CREDENTIALS
        const credentialsBuffer = Buffer.from(base64Credentials, "base64")
        const credentialsJson = credentialsBuffer.toString("utf8")
        const serviceAccount = JSON.parse(credentialsJson)
        
        // Check if required fields exist
        if (!serviceAccount.client_email || !serviceAccount.private_key) {
          throw new Error("Missing required fields in credentials")
        }
        
        // Initialize client (but don't make API calls)
        new vision.ImageAnnotatorClient({
          credentials: {
            client_email: serviceAccount.client_email,
            private_key: serviceAccount.private_key,
          },
          projectId: serviceAccount.project_id,
        })
        
        visionStatus = "Credentials Valid"
      } else {
        visionStatus = "Missing Credentials"
      }
    } catch (error: any) {
      visionStatus = "Error"
      visionError = error.message
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envChecks,
      database: {
        status: dbStatus,
        error: dbError,
      },
      googleVision: {
        status: visionStatus,
        error: visionError,
      },
      serverInfo: {
        platform: process.platform,
        nodeVersion: process.version,
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 })
  }
}
