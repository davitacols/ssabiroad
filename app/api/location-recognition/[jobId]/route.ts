import { type NextRequest, NextResponse } from "next/server"

// Update the GET handler to properly handle dynamic route parameters
export async function GET(req: NextRequest, context: { params: { jobId: string } }): Promise<NextResponse> {
  try {
    // In Next.js App Router, params are not promises, they're directly accessible
    const jobId = context.params.jobId

    console.log(`Fetching job status for job ID: ${jobId}`)

    if (!jobId) {
      console.error("No job ID provided in request")
      return NextResponse.json({ success: false, error: "No job ID provided" }, { status: 400 })
    }

    // Try to find the job in the database
    try {
      // For testing purposes, return a mock job status
      // In production, you would fetch the actual job from the database
      console.log(`Returning mock data for job ID: ${jobId}`)

      const mockJob = {
        id: jobId,
        status: "completed",
        progress: 100,
        result: {
          success: true,
          type: "exif",
          name: "Ryde House",
          address: "161-171, Kilburn High Rd, London NW6 7HY, UK",
          formattedAddress: "161-171, Kilburn High Rd, London NW6 7HY, UK",
          confidence: 0.95,
          category: "Building",
          description: "A building located in Kilburn, London",
          location: {
            latitude: 51.5363,
            longitude: -0.1968,
          },
          mapUrl: "https://www.google.com/maps?q=51.5363,-0.1968",
          processingTime: 1500,
          fastMode: true,
          buildingType: "Commercial",
          isBusinessLocation: true,
          businessName: "Ryde House",
          businessAddress: "161-171, Kilburn High Rd, London NW6 7HY, UK",
          businessCategory: "Building",
          businessConfidence: 0.95,
        },
      }

      return NextResponse.json({ success: true, job: mockJob })
    } catch (dbError) {
      console.error("Database error when fetching job:", dbError)

      // For development/testing, return a mock response even if the database fails
      const mockJob = {
        id: jobId,
        status: "completed",
        progress: 100,
        result: {
          success: true,
          type: "exif",
          name: "Ryde House",
          address: "161-171, Kilburn High Rd, London NW6 7HY, UK",
          formattedAddress: "161-171, Kilburn High Rd, London NW6 7HY, UK",
          confidence: 0.95,
          category: "Building",
          description: "A building located in Kilburn, London",
          location: {
            latitude: 51.5363,
            longitude: -0.1968,
          },
          mapUrl: "https://www.google.com/maps?q=51.5363,-0.1968",
          processingTime: 1500,
          fastMode: true,
          buildingType: "Commercial",
          isBusinessLocation: true,
          businessName: "Ryde House",
          businessAddress: "161-171, Kilburn High Rd, London NW6 7HY, UK",
          businessCategory: "Building",
          businessConfidence: 0.95,
        },
      }

      return NextResponse.json({ success: true, job: mockJob })
    }
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
