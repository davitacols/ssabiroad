import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

// GET handler to fetch a specific location
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const location = await prisma.location.findUnique({
      where: {
        id,
      },
    })

    if (!location) {
      return NextResponse.json({ success: false, error: "Location not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, ...location })
  } catch (error) {
    console.error("Error fetching location:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch location" }, { status: 500 })
  }
}

// DELETE handler to remove a location
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check if location exists
    const location = await prisma.location.findUnique({
      where: {
        id,
      },
    })

    if (!location) {
      return NextResponse.json({ success: false, error: "Location not found" }, { status: 404 })
    }

    // Delete the location
    await prisma.location.delete({
      where: {
        id,
      },
    })

    // Also delete any bookmarks associated with this location
    await prisma.bookmark.deleteMany({
      where: {
        locationId: id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting location:", error)
    return NextResponse.json({ success: false, error: "Failed to delete location" }, { status: 500 })
  }
}

// PATCH handler to update a location
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    // Check if location exists
    const location = await prisma.location.findUnique({
      where: {
        id,
      },
    })

    if (!location) {
      return NextResponse.json({ success: false, error: "Location not found" }, { status: 404 })
    }

    // Update the location
    const updatedLocation = await prisma.location.update({
      where: {
        id,
      },
      data: {
        name: body.name !== undefined ? body.name : location.name,
        address: body.address !== undefined ? body.address : location.address,
        latitude: body.latitude !== undefined ? body.latitude : location.latitude,
        longitude: body.longitude !== undefined ? body.longitude : location.longitude,
        confidence: body.confidence !== undefined ? body.confidence : location.confidence,
        recognitionType: body.type !== undefined ? body.type : location.recognitionType,
      },
    })

    return NextResponse.json({ success: true, location: updatedLocation })
  } catch (error) {
    console.error("Error updating location:", error)
    return NextResponse.json({ success: false, error: "Failed to update location" }, { status: 500 })
  }
}

