import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Completely disable middleware for now
  return NextResponse.next();
}

export const config = {
  matcher: [],
};