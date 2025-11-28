import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Send welcome email
    try {
      await resend.emails.send({
        from: 'SSABIRoad <onboarding@resend.dev>',
        to: newUser.email,
        subject: 'Welcome to SSABIRoad & Pic2Nav!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0066cc;">Welcome to SSABIRoad, ${newUser.name}!</h1>
            <p style="font-size: 16px; line-height: 1.6;">Thank you for joining our community. We're excited to have you here!</p>
            
            <h2 style="color: #333; margin-top: 30px;">What You Can Do:</h2>
            <ul style="font-size: 16px; line-height: 1.8;">
              <li>📸 Upload photos to find exact locations with <strong>Pic2Nav</strong></li>
              <li>📝 Read our latest blog posts on navigation technology</li>
              <li>💬 Comment and engage with our community</li>
              <li>🔖 Bookmark your favorite articles</li>
            </ul>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="margin-top: 0;">Try Pic2Nav Now</h3>
              <p>Experience the future of navigation. Upload any building photo and get its exact location instantly.</p>
              <a href="https://pic2nav.com" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Get Started</a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 40px;">Need help? Reply to this email or visit our <a href="https://ssabiroad.vercel.app/blog">blog</a> for guides and tips.</p>
          </div>
        `
      });
      console.log("Welcome email sent successfully");
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail signup if email fails
    }

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
