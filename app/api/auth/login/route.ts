import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const prisma = new PrismaClient()

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

export async function POST(req: NextRequest) {
  console.log('=== Login Request Started ===')
  console.log('Request method:', req.method)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))
  
  try {
    // Clone the request for logging (since body can only be read once)
    const reqClone = req.clone()
    const rawBody = await reqClone.text()
    console.log('Raw request body:', rawBody)

    // Parse the original request
    let body
    try {
      body = await req.json()
      console.log('Parsed request body:', { 
        email: body.email, 
        hasPassword: !!body.password 
      })
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      )
    }

    const { email, password } = body

    if (!email || !password) {
      console.log('Missing required fields:', { 
        hasEmail: !!email, 
        hasPassword: !!password 
      })
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      console.log('Invalid email format:', email)
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    console.log('Finding user in database...')
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email.toLowerCase(),
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        role: true,
      }
    })

    console.log('Database query completed:', { 
      userFound: !!user,
      userId: user?.id 
    })

    if (!user) {
      await bcrypt.compare(password, 'dummy_hash')
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log('Password validation:', { isValid: isPasswordValid })

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not found in environment variables')
      throw new Error("Server configuration error")
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    }

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { 
        expiresIn: "1d",
        algorithm: "HS256"
      }
    )

    console.log('JWT token generated successfully')

    const response = NextResponse.json(
      {
        message: "Logged in successfully",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        }
      },
      { status: 200 }
    )

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 86400,
      path: "/"
    }

    response.cookies.set("token", token, cookieOptions)
    console.log('Cookie set successfully')

    response.headers.set('X-Content-Type-Options', 'nosniff')
    if (process.env.NODE_ENV === "production") {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }

    console.log('=== Login Request Completed Successfully ===')
    return response
  } catch (error) {
    console.error("Login error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// Handle other HTTP methods
export async function GET() {
  console.log('GET request received - Method not allowed')
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function PUT() {
  console.log('PUT request received - Method not allowed')
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function DELETE() {
  console.log('DELETE request received - Method not allowed')
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function OPTIONS() {
  console.log('OPTIONS request received')
  const response = new NextResponse(null, { status: 204 })
  response.headers.set('Allow', 'POST')
  response.headers.set('Access-Control-Allow-Methods', 'POST')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}