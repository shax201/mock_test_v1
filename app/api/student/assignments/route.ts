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
        let status = assignment.status

        // Auto-update status based on dates
        if (new Date(assignment.validFrom) > now) {
          status = 'PENDING'
        } else if (new Date(assignment.validUntil) < now) {
          status = 'EXPIRED'
        } else if (status === 'PENDING' && new Date(assignment.validFrom) <= now) {
          status = 'ACTIVE'
        }

        // Check if there's a completed test session for this assignment
        const testSession = await prisma.testSession.findFirst({
          where: {
            studentId,
            assignmentId: assignment.id,
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

        // If there's a completed session, mark as completed
        if (testSession && testSession.band) {
          status = 'COMPLETED'
        }

        return {
          id: assignment.id,
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

