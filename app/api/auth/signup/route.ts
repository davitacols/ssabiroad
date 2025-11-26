import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import crypto from "crypto";

const prisma = new PrismaClient();

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
const isValidUsername = (username: string): boolean => /^[a-zA-Z0-9_-]{3,30}$/.test(username);
const isValidPassword = (password: string): boolean => password.length >= 8 && password.length <= 100;

export async function POST(req: NextRequest) {
  try {
    console.log("=== Signup Request Started ===");
    const { email, name } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (!isValidEmail(email)) return NextResponse.json({ error: "Invalid email format" }, { status: 400 });

    console.log("Checking if user already exists...");
    const existingUser = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
    console.log("Creating user in database...");
    const newUser = await prisma.user.create({
      data: { 
        id: crypto.randomUUID(),
        email: email.toLowerCase(), 
        name: name.trim(),
        updatedAt: new Date()
      }
    });

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing!");
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    console.log("Generating JWT...");
    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, process.env.JWT_SECRET, { expiresIn: "1d" });

    console.log("Setting cookie...");
    const cookie = serialize("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400,
      path: "/"
    });

    const response = NextResponse.json({ message: "Signup successful", user: { id: newUser.id, email: newUser.email, name: newUser.name } }, { status: 201 });
    response.headers.append("Set-Cookie", cookie);

    console.log("=== Signup Completed Successfully ===");
    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "An error occurred during signup" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
