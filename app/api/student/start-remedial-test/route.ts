import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  try {
    // Verify student authentication
    const token = request.cookies.get('student-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyJWT(token)
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { remedialTestId } = await request.json()

    if (!remedialTestId) {
      return NextResponse.json(
        { error: 'Remedial test ID is required' },
        { status: 400 }
      )
    }

    // Generate session token for remedial test
    const sessionToken = `remedial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Store remedial test session in memory or database
    // For now, we'll use a simple approach and store in the database
    const remedialSession = await prisma.remedialTestSession.create({
      data: {
        id: sessionToken,
        studentId: decoded.userId,
        testType: remedialTestId,
        status: 'ACTIVE',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    })

    return NextResponse.json({
      success: true,
      sessionToken,
      remedialSession: {
        id: remedialSession.id,
        testType: remedialSession.testType,
        status: remedialSession.status,
        startedAt: remedialSession.startedAt
      }
    })

  } catch (error) {
    console.error('Error starting remedial test:', error)
    return NextResponse.json(
      { error: 'Failed to start remedial test' },
      { status: 500 }
    )
  }
}
