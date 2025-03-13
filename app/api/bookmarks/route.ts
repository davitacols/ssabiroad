import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db"; // Ensure this matches the export in db.ts

// GET handler to fetch all bookmarks
export async function GET() {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, bookmarks });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}

// POST handler to create a new bookmark
export async function POST(request: NextRequest) {
  try {
    const { locationId, name = "Unnamed Location", address = "No address", category = "Unknown" } = await request.json();

    if (!locationId) {
      return NextResponse.json({ success: false, error: "Location ID is required" }, { status: 400 });
    }

    const existingBookmark = await prisma.bookmark.findFirst({ where: { locationId } });

    if (existingBookmark) {
      return NextResponse.json({ success: false, error: "Bookmark already exists for this location" }, { status: 409 });
    }

    const bookmark = await prisma.bookmark.create({
      data: { locationId, name, address, category },
    });

    return NextResponse.json({ success: true, bookmark });
  } catch (error) {
    console.error("Error creating bookmark:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create bookmark" },
      { status: 500 }
    );
  }
}
