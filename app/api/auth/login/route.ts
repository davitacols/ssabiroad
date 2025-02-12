import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    
    if (!body || typeof body !== "object") {
      console.error("Invalid request body received:", body)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { email, password } = body

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      console.error("Invalid email or password format:", { email, password })
      return NextResponse.json({ error: "Valid email and password are required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      console.error("User not found:", email)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      console.error("Invalid credentials for user:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error("JWT_SECRET is not set")
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      jwtSecret,
      { expiresIn: "1h" },
    )

    return NextResponse.json(
      {
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "An error occurred during login" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
