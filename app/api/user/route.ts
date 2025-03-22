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

    // Enhanced authorization header logging
    const authHeader = req.headers.get("Authorization");
    console.log("Authorization header present:", !!authHeader);
    
    if (!authHeader) {
      console.log("Authorization header is missing completely");
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    console.log("Auth header format check:", authHeader.startsWith("Bearer ") ? "correct" : "incorrect");
    
    if (!authHeader.startsWith("Bearer ")) {
      console.log("Authorization header value:", authHeader.substring(0, 20) + "...");
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Detailed token extraction and inspection
    const token = authHeader.split(" ")[1];
    console.log("Token extracted:", token ? "✓" : "✗");
    console.log("Token length:", token?.length);
    console.log("Token format:", token?.includes(".") ? "Contains dots" : "No dots");
    
    if (token) {
      const tokenParts = token.split(".");
      console.log("Token parts count:", tokenParts.length);
      console.log("Expected parts count for valid JWT:", 3);
      
      // Check each part
      tokenParts.forEach((part, index) => {
        try {
          // For the first two parts (header and payload), we should be able to base64 decode them
          if (index < 2) {
            const decoded = Buffer.from(part, 'base64').toString();
            console.log(`Part ${index + 1} can be decoded:`, !!decoded);
          }
        } catch (e) {
          console.log(`Part ${index + 1} decoding error:`, e instanceof Error ? e.message : "Unknown error");
        }
      });
    }
    
    if (!token) {
      console.log("No token provided in Authorization header");
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    let decodedToken: JwtPayload;
    try {
      // Add options to ignore expiration for debugging purposes
      const verifyOptions = { ignoreExpiration: false };
      console.log("Attempting to verify token with secret length:", jwtSecret.length);
      
      decodedToken = jwt.verify(token, jwtSecret, verifyOptions) as JwtPayload;
      console.log("Token verification successful!");
      console.log("Decoded Token:", {
        userId: decodedToken.userId,
        email: decodedToken.email,
        username: decodedToken.username,
        role: decodedToken.role,
        iat: decodedToken.iat,
        exp: decodedToken.exp,
        expiresAt: decodedToken.exp ? new Date(decodedToken.exp * 1000).toISOString() : 'No expiration'
      });

      if (!decodedToken?.userId || !decodedToken?.email) {
        console.error("Invalid token payload structure");
        throw new Error("Invalid token structure");
      }

      const now = Math.floor(Date.now() / 1000);
      console.log("Current timestamp:", now);
      if (decodedToken.exp) {
        console.log("Token expiration timestamp:", decodedToken.exp);
        console.log("Time until expiration:", decodedToken.exp - now, "seconds");
      }
      
      if (decodedToken.exp && decodedToken.exp < now) {
        console.log("Token has expired");
        throw new jwt.TokenExpiredError("Token expired", new Date(decodedToken.exp * 1000));
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      
      // More detailed error reporting
      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json({ 
          error: "Token has expired", 
          expiredAt: error.expiredAt 
        }, { status: 401 });
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.json({ 
          error: "Invalid token", 
          details: error.message 
        }, { status: 401 });
      }

      return NextResponse.json({ 
        error: "Authentication failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      }, { status: 401 });
    }

    console.log("Fetching user data for ID:", decodedToken.userId);
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

    console.log("User found in database:", !!user);

    if (!user) {
      console.log("User not found in database:", decodedToken.userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.email !== decodedToken.email) {
      console.error(`Token email (${decodedToken.email}) doesn't match user email (${user.email})`);
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