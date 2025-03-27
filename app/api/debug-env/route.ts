import { type NextRequest, NextResponse } from "next/server"

// This endpoint helps debug environment variables in production
export async function GET(request: NextRequest) {
  // Only check if variables exist, don't expose actual values for security
  const envStatus = {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    GCLOUD_CREDENTIALS: !!process.env.GCLOUD_CREDENTIALS,
    DATABASE_URL: !!process.env.DATABASE_URL,
    // Add any other environment variables you need to check
  }

  // Check if credentials are properly formatted
  let credentialsFormatValid = false
  try {
    if (process.env.GCLOUD_CREDENTIALS) {
      const credentialsBuffer = Buffer.from(process.env.GCLOUD_CREDENTIALS, "base64")
      const credentialsJson = credentialsBuffer.toString("utf8")
      const parsed = JSON.parse(credentialsJson)
      credentialsFormatValid = !!(parsed.client_email && parsed.private_key)
    }
  } catch (error) {
    console.error("Error parsing GCLOUD_CREDENTIALS:", error)
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    envVarsPresent: envStatus,
    credentialsFormatValid,
    timestamp: new Date().toISOString(),
  })
}

