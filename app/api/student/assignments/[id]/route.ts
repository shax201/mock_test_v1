import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const resolvedParams = await params

    // Fetch assignment and verify it belongs to the student
    const assignment = await prisma.assignment.findUnique({
      where: { id: resolvedParams.id },
      include: {
        readingTest: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Verify the assignment belongs to this student
    if (assignment.studentId !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      id: assignment.id,
      readingTestId: assignment.readingTestId,
      accessToken: assignment.accessToken,
      validFrom: assignment.validFrom,
      validUntil: assignment.validUntil,
      testTitle: assignment.readingTest.title
    })
  } catch (error) {
    console.error('Error fetching assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

