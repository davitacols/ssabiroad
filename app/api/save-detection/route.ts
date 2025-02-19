import { type NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["query", "info", "warn", "error"] }); // Enable Prisma logging

interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function POST(req: NextRequest) {
  console.log("=== [START] Saving Detection ===");

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return NextResponse.json({ error: "Server error" }, { status: 500 });

    // ✅ 1. Extract and verify JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decodedToken: JwtPayload;

    try {
      decodedToken = jwt.verify(token, jwtSecret) as JwtPayload;
    } catch (error) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // ✅ 2. Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      select: { id: true, email: true, username: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // ✅ 3. Parse request body
    let data;
    try {
      data = await req.json();
      console.log("📩 Parsed request data:", JSON.stringify(data, null, 2));
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }

    // ✅ 4. Transform Data to Expected Format
    const transformedData = {
      detectionResult: {
        name: data.type || "Unknown Building",
        description: data.description || "No description available",
        confidence: data.confidence || 0.0,
      },
      location: {
        lat: data.location?.latitude,
        lng: data.location?.longitude,
      },
      address: data.publicInfo?.contactInfo?.address || "Unknown address",
      imageUrl: data.imageProperties?.imageUrl || null,
    };

    console.log("🔄 Transformed data:", JSON.stringify(transformedData, null, 2));

    // ✅ 5. Validate Required Fields
    if (!transformedData.detectionResult || !transformedData.location.lat || !transformedData.location.lng) {
      return NextResponse.json(
        { error: "Missing required fields: detectionResult and location are required" },
        { status: 400 }
      );
    }

    // ✅ 6. Check if building already exists (Avoid duplicate entries)
    let building = await prisma.building.findFirst({
      where: {
        name: transformedData.detectionResult.name,
        latitude: transformedData.location.lat,
        longitude: transformedData.location.lng,
      },
    });

    if (!building) {
      building = await prisma.building.create({
        data: {
          name: transformedData.detectionResult.name,
          description: transformedData.detectionResult.description,
          address: transformedData.address,
          latitude: transformedData.location.lat,
          longitude: transformedData.location.lng,
          confidence: transformedData.detectionResult.confidence,
          type: data.features?.constructionType || "Unknown",
          architecture: data.features?.architecture || [],
          materials: data.features?.materials || [],
          styles: data.features?.style || [],
          userId: user.id,
        },
      });
    }

    // ✅ 7. Save Detection Record
    const detection = await prisma.detection.create({
      data: {
        buildingName: transformedData.detectionResult.name,
        description: transformedData.detectionResult.description,
        address: transformedData.address,
        confidence: transformedData.detectionResult.confidence,
        latitude: transformedData.location.lat,
        longitude: transformedData.location.lng,
        architecture: data.features?.architecture || [],
        materials: data.features?.materials || [],
        styles: data.features?.style || [],
        imageUrl: transformedData.imageUrl,
        rawResult: data,
        userId: user.id,
        buildingId: building.id,
      },
    });

    // ✅ 8. Save Image if Provided
    if (transformedData.imageUrl) {
      await prisma.buildingImage.create({
        data: { buildingId: building.id, imageUrl: transformedData.imageUrl },
      });
    }

    console.log("✅ Detection saved successfully!");
    return NextResponse.json({ building, detection, message: "Building detection saved successfully" });

  } catch (error) {
    console.error("❌ Error saving detection:", error);
    return NextResponse.json({ error: "Failed to save detection" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
    console.log("🔌 Database connection closed");
  }
}


// ✅ Handle unsupported HTTP methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

// ✅ OPTIONS method for CORS preflight requests
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Allow", "POST");
  response.headers.set("Access-Control-Allow-Methods", "POST");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}
