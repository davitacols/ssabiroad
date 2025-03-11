// File: app/api/auth/register/google/route.js
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'

// Initialize the Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export async function POST(request) {
  try {
    const body = await request.json()
    const { token, email, name, profilePicture } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    
    // Verify the email from the token matches the provided email
    if (payload.email !== email) {
      return NextResponse.json({ error: 'Email verification failed' }, { status: 400 })
    }

    // Check if user already exists in your database
    // This is a placeholder - replace with your actual database check
    const existingUser = await checkIfUserExists(email)

    if (existingUser) {
      return NextResponse.json({ error: 'Account already exists' }, { status: 409 })
    }

    // Create new user in your database
    // This is a placeholder - replace with your actual user creation logic
    const newUser = await createUser({
      email,
      name,
      profilePicture,
      authProvider: 'google',
      googleId: payload.sub // Google's unique user ID
    })

    // Create JWT token for the new user
    const authToken = jwt.sign(
      { 
        userId: newUser.id,
        email: newUser.email,
        isNewUser: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({ token: authToken, isNewUser: true }, { status: 201 })
  } catch (error) {
    console.error('Google sign-up error:', error)
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 500 }
    )
  }
}

// Placeholder function - implement with your actual database logic
async function checkIfUserExists(email) {
  // Replace with your database query
  // Example with Prisma:
  // return await prisma.user.findUnique({ where: { email } })
  
  // Placeholder:
  return false
}

// Placeholder function - implement with your actual database logic
async function createUser(userData) {
  // Replace with your database creation
  // Example with Prisma:
  // return await prisma.user.create({ data: userData })
  
  // Placeholder:
  return {
    id: 'new-user-id',
    email: userData.email,
    name: userData.name
  }
}