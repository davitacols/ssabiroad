import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

interface JwtPayload {
  id: string;
  email: string;
  username: string;
  role: string;
}

// Verify JWT from cookies
async function verifyToken(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return null;

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT secret is missing");
      return null;
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const savedLocations = await prisma.savedLocation.findMany({
      where: { userId },
      orderBy: { visits: "desc" },
    });

    return NextResponse.json(savedLocations);
  } catch (error) {
    console.error("Error fetching saved locations:", error);
    return NextResponse.json({ error: "Failed to fetch saved locations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const data = await request.json();

    const savedLocation = await prisma.savedLocation.create({
      data: {
        ...data,
        userId,
      },
    });

    return NextResponse.json(savedLocation);
  } catch (error) {
    console.error("Error creating saved location:", error);
    return NextResponse.json({ error: "Failed to create saved location" }, { status: 500 });
  }
}
