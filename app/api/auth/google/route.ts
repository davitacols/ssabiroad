import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const { name, email, picture } = ticket.getPayload();
    
    // Here, you might want to save or update the user in your database.
    // For simplicity, we are skipping this step.

    const jwtToken = jwt.sign({ name, email, picture }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return NextResponse.json({ token: jwtToken });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}