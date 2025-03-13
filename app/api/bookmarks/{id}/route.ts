import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

// GET handler to fetch a specific bookmark
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        id,
      },
    })

    if (!bookmark) {
      return NextResponse.json({ success: false, error: "Bookmark not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, bookmark })
  } catch (error) {
    console.error("Error fetching bookmark:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch bookmark" }, { status: 500 })
  }
}

// DELETE handler to remove a bookmark
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check if bookmark exists
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        id,
      },
    })

    if (!bookmark) {
      return NextResponse.json({ success: false, error: "Bookmark not found" }, { status: 404 })
    }

    // Delete the bookmark
    await prisma.bookmark.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting bookmark:", error)
    return NextResponse.json({ success: false, error: "Failed to delete bookmark" }, { status: 500 })
  }
}

// PATCH handler to update a bookmark
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    // Check if bookmark exists
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        id,
      },
    })

    if (!bookmark) {
      return NextResponse.json({ success: false, error: "Bookmark not found" }, { status: 404 })
    }

    // Update the bookmark
    const updatedBookmark = await prisma.bookmark.update({
      where: {
        id,
      },
      data: {
        name: body.name !== undefined ? body.name : bookmark.name,
        address: body.address !== undefined ? body.address : bookmark.address,
        category: body.category !== undefined ? body.category : bookmark.category,
      },
    })

    return NextResponse.json({ success: true, bookmark: updatedBookmark })
  } catch (error) {
    console.error("Error updating bookmark:", error)
    return NextResponse.json({ success: false, error: "Failed to update bookmark" }, { status: 500 })
  }
}

