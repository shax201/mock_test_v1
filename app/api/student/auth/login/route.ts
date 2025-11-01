import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { signJWT } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find student by email
    const student = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        role: 'STUDENT'
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check password against stored passwordHash
    const isValidPassword = await bcrypt.compare(password, (student as any).passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create JWT token
    const token = await signJWT({
      userId: student.id,
      email: student.email,
      role: student.role
    })

    // Set cookie
    const response = NextResponse.json({
      message: 'Login successful',
      student: {
        id: student.id,
        email: student.email,
        name: student.name
      }
    })

    response.cookies.set('student-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
