import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // ✅ Attempt to parse the JSON body safely
    let body;
    try {
      body = await req.json();
    } catch (err) {
      console.error("Invalid JSON in request body:", err);
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { email } = body;

    // ✅ Ensure email is valid
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    // ✅ Find user in the database
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Ensure `JWT_SECRET` is set
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not set in environment variables");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // ✅ Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      jwtSecret,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    // ✅ Return token and user info with cookie
    const response = NextResponse.json(
      {
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 200 }
    );
    
    // Set cookie (not httpOnly so JS can read it)
    response.cookies.set('token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "An error occurred during login" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
