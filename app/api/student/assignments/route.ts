import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('student-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    // Verify JWT token
    const decoded = await verifyJWT(token)

    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Invalid user role' },
        { status: 403 }
      )
    }

    // Get student's assignments
    const assignments = await prisma.assignment.findMany({
      where: {
        studentId: decoded.userId
      },
      include: {
        mock: true,
        result: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      testTitle: assignment.mock.title,
      status: assignment.status,
      assignedAt: assignment.createdAt.toISOString(),
      validFrom: assignment.validFrom?.toISOString(),
      validUntil: assignment.validUntil?.toISOString(),
      accessToken: assignment.tokenHash,
      hasResult: !!assignment.result,
      overallBand: assignment.result?.overallBand
    }))

    return NextResponse.json({
      assignments: formattedAssignments
    })
  } catch (error) {
    console.error('Assignments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
