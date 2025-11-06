import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

/**
 * POST /api/student/listening-tests/[id]/results
 * Saves listening test results to the database
 * Creates a session if it doesn't exist, or updates existing session
 */
export async function POST(
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

    const resolvedParams = await params
    const { score, answers, timeSpent } = await request.json()

    // Validate required fields
    if (score === undefined || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields: score and answers are required' },
        { status: 400 }
      )
    }

    // Check if listening test exists
    const listeningTest = await prisma.listeningTest.findUnique({
      where: { id: resolvedParams.id, isActive: true },
      include: {
        readingTest: {
          select: {
            id: true
          }
        }
      }
    })

    if (!listeningTest) {
      return NextResponse.json({ error: 'Listening test not found' }, { status: 404 })
    }

    // Calculate band score (similar to reading test)
    let band = 0
    if (score >= 39) band = 9
    else if (score >= 37) band = 8.5
    else if (score >= 35) band = 8
    else if (score >= 32) band = 7.5
    else if (score >= 30) band = 7
    else if (score >= 26) band = 6.5
    else if (score >= 23) band = 6
    else if (score >= 18) band = 5.5
    else if (score >= 16) band = 5
    else if (score >= 13) band = 4.5
    else if (score >= 10) band = 4
    else if (score >= 8) band = 3.5

    // Find existing session (completed or not)
    let session = await prisma.testSession.findFirst({
      where: {
        testId: resolvedParams.id,
        studentId: payload.userId,
        testType: 'LISTENING'
      },
      orderBy: { createdAt: 'desc' }
    })

    if (session) {
      // Update existing session
      session = await prisma.testSession.update({
        where: { id: session.id },
        data: {
          answers: answers as any,
          score,
          band,
          isCompleted: true,
          completedAt: new Date()
        }
      })
    } else {
      // Create new session
      session = await prisma.testSession.create({
        data: {
          testId: resolvedParams.id,
          studentId: payload.userId,
          testType: 'LISTENING',
          answers: answers as any,
          score,
          band,
          isCompleted: true,
          startedAt: new Date(),
          completedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      message: 'Listening test results saved successfully',
      session,
      readingTestId: listeningTest.readingTest?.id || null
    })
  } catch (error) {
    console.error('Error saving listening test results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

