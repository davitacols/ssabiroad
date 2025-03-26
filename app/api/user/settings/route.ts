import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

// Validation schema for user settings
const UserSettingsSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username cannot exceed 50 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional()
  }).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().length(2, 'Language code must be 2 characters').optional()
})

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  // Ensure only PUT method is allowed
  if (req.method !== 'PUT') {
    return res.status(405).json({ 
      error: 'Method Not Allowed', 
      message: 'Only PUT requests are permitted' 
    })
  }

  try {
    // Verify user is authenticated
    const session = await getServerSession(req, res, authOptions)
    
    if (!session) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'You must be logged in to update settings' 
      })
    }

    // Validate incoming request body
    const validationResult = UserSettingsSchema.safeParse(req.body)
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Validation Failed', 
        issues: validationResult.error.issues 
      })
    }

    // Update user settings in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...validationResult.data,
        // Optionally handle nested updates for notifications
        notifications: validationResult.data.notifications 
          ? JSON.stringify(validationResult.data.notifications)
          : undefined
      },
      select: {
        // Select only safe fields to return
        id: true,
        username: true,
        email: true,
        theme: true,
        language: true
      }
    })

    // Successful response
    res.status(200).json({
      message: 'User settings updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('User settings update error:', error)
    
    // Handle specific error types
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: error.errors 
      })
    }

    // Generic server error
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Unable to update user settings' 
    })
  }
}

// Disable body parsing to use body-parser or another method
export const config = {
  api: {
    bodyParser: true
  }
}