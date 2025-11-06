import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

/**
 * POST /api/student/writing-tests/[id]/results
 * Saves writing test results to the database
 * Creates a session if it doesn't exist, or updates existing session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Step 1: Authenticate student
    // Verify JWT token and ensure user is a student
    const token = request.cookies.get('student-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const { answers, timeSpent } = await request.json()

    // Step 2: Validate required fields
    // Ensure answers object is provided
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Missing required field: answers' },
        { status: 400 }
      )
    }

    // Step 3: Verify writing test exists
    // Check if the writing test is active and available
    const writingTest = await prisma.writingTest.findUnique({
      where: { id: resolvedParams.id, isActive: true },
      include: {
        readingTest: {
          select: {
            id: true
          }
        }
      }
    })

    if (!writingTest) {
      return NextResponse.json({ error: 'Writing test not found' }, { status: 404 })
    }

    // Step 4: Find or create test session
    // Check for existing session, create new one if needed
    let session = await prisma.testSession.findFirst({
      where: {
        testId: resolvedParams.id,
        studentId: payload.userId,
        testType: 'WRITING'
      },
      orderBy: { createdAt: 'desc' }
    })

    if (session) {
      // Step 5: Update existing session
      // Update session with completion data and answers
      session = await prisma.testSession.update({
        where: { id: session.id },
        data: {
          answers: answers || {},
          isCompleted: true,
          completedAt: new Date(),
          startedAt: session.startedAt || new Date()
        }
      })
    } else {
      // Step 6: Create new session with results
      // Create a new test session marked as completed
      session = await prisma.testSession.create({
        data: {
          testId: resolvedParams.id,
          studentId: payload.userId,
          testType: 'WRITING',
          startedAt: new Date(),
          answers: answers || {},
          isCompleted: true,
          completedAt: new Date()
        }
      })
    }

    // Step 7: Return success response
    // Send back the session data to confirm successful submission
    return NextResponse.json({
      success: true,
      message: 'Writing test results saved successfully',
      session: {
        id: session.id,
        testId: session.testId,
        studentId: session.studentId,
        startedAt: session.startedAt?.toISOString() || null,
        answers: session.answers || {},
        isCompleted: session.isCompleted,
        completedAt: session.completedAt?.toISOString() || null,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString()
      },
      readingTestId: writingTest.readingTest?.id || null
    })
  } catch (error) {
    // Step 8: Handle errors
    // Catch and log any errors during submission
    console.error('Error saving writing test results:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

