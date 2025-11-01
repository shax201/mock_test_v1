import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ message: 'Logout successful' })
  
  // Clear the cookie
  response.cookies.set('student-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0
  })

  return response
}
