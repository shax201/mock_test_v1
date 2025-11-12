import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('student-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const studentId = payload.userId

    // Fetch all assignments for this student
    const assignments = await prisma.assignment.findMany({
      where: {
        studentId
      },
      include: {
        readingTest: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate status based on dates and check for results
    const now = new Date()
    const assignmentsWithStatus = await Promise.all(
      assignments.map(async (assignment) => {
        const validFrom = new Date(assignment.validFrom)
        const validUntil = new Date(assignment.validUntil)

        // Check if there's a completed test session for this assignment first
        const testSession = await prisma.testSession.findFirst({
          where: {
            studentId,
            testId: assignment.readingTestId,
            isCompleted: true
          },
          select: {
            id: true,
            band: true
          },
          orderBy: {
            completedAt: 'desc'
          }
        })

        // If there's a completed session, mark as completed (takes priority)
        if (testSession && testSession.band) {
          return {
            id: assignment.id,
            readingTestId: assignment.readingTestId,
            testId: testSession.id, // Use session ID for results link
            testTitle: assignment.readingTest.title,
            status: 'COMPLETED' as const,
            assignedAt: assignment.createdAt,
            validFrom: assignment.validFrom,
            validUntil: assignment.validUntil,
            accessToken: assignment.accessToken,
            hasResult: true,
            overallBand: testSession.band
          }
        }

        // Auto-update status based on dates (check in priority order)
        let status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED'
        if (validUntil < now) {
          // Expired
          status = 'EXPIRED'
        } else if (validFrom > now) {
          // Not yet started
          status = 'PENDING'
        } else {
          // Within valid time range - should be active
          status = 'ACTIVE'
        }

        return {
          id: assignment.id,
          readingTestId: assignment.readingTestId,
          testId: testSession?.id || assignment.readingTestId, // Use session ID if available, otherwise reading test ID
          testTitle: assignment.readingTest.title,
          status,
          assignedAt: assignment.createdAt,
          validFrom: assignment.validFrom,
          validUntil: assignment.validUntil,
          accessToken: assignment.accessToken,
          hasResult: !!testSession,
          overallBand: testSession?.band || null
        }
      })
    )

    return NextResponse.json({ assignments: assignmentsWithStatus })
  } catch (error) {
    console.error('Error fetching student assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

