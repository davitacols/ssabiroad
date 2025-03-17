import { type NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function GET(req: NextRequest) {
  console.log("=== Fetching User Profile ===");

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET not found in environment variables");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Authorization header missing or malformed");
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log("No token provided in Authorization header");
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    let decodedToken: JwtPayload;
    try {
      decodedToken = jwt.verify(token, jwtSecret) as JwtPayload;
      console.log("Decoded Token:", decodedToken);

      if (!decodedToken?.userId || !decodedToken?.email) {
        console.error("Invalid token payload structure");
        throw new Error("Invalid token structure");
      }

      const now = Math.floor(Date.now() / 1000);
      if (decodedToken.exp && decodedToken.exp < now) {
        console.log("Token has expired");
        throw new jwt.TokenExpiredError("Token expired", new Date(decodedToken.exp * 1000));
      }
    } catch (error) {
      console.error("Token verification failed:", error);

      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json({ error: "Token has expired" }, { status: 401 });
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }

      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    console.log("Fetching user data...");
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    console.log("Fetched User:", user);

    if (!user) {
      console.log("User not found in database:", decodedToken.userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.email !== decodedToken.email) {
      console.error("Token data mismatch with user data");
      return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
    });

    response.headers.set("X-Content-Type-Options", "nosniff");
    if (process.env.NODE_ENV === "production") {
      response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    console.log("=== User Profile Fetched Successfully ===");
    return response;
  } catch (error) {
    console.error("Error fetching user profile:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({ error: "An error occurred while fetching user data" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}