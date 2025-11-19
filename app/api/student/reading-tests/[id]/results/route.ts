import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'
import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * POST /api/student/reading-tests/[id]/results
 * Saves test results to the database
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
    const { score, band, answers, timeSpent, itemWiseTestId } = await request.json()
    const normalizedItemWiseTestId =
      typeof itemWiseTestId === 'string' && itemWiseTestId.trim().length > 0 ? itemWiseTestId : null

    // Validate required fields
    if (score === undefined || band === undefined || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields: score, band, and answers are required' },
        { status: 400 }
      )
    }

    // Check if reading test exists
    const readingTest = await prisma.readingTest.findUnique({
      where: { id: resolvedParams.id, isActive: true }
    })

    if (!readingTest) {
      return NextResponse.json({ error: 'Reading test not found' }, { status: 404 })
    }

    // Find existing session (completed or not)
    let session = await prisma.testSession.findFirst({
      where: {
        testId: resolvedParams.id,
        studentId: payload.userId,
        testType: 'READING',
        itemWiseTestId: normalizedItemWiseTestId
      },
      orderBy: { createdAt: 'desc' }
    })

    if (session) {
      // Update existing session
      session = await prisma.testSession.update({
        where: { id: session.id },
        data: {
          answers: answers || {},
          isCompleted: true,
          completedAt: new Date(),
          score: score || 0,
          band: band || 0,
          startedAt: session.startedAt || new Date(),
          itemWiseTestId: normalizedItemWiseTestId
        }
      })
    } else {
      // Create new session with results
      session = await prisma.testSession.create({
        data: {
          testId: resolvedParams.id,
          studentId: payload.userId,
          testType: 'READING',
          startedAt: new Date(),
          answers: answers || {},
          isCompleted: true,
          completedAt: new Date(),
          score: score || 0,
          band: band || 0,
          itemWiseTestId: normalizedItemWiseTestId
        }
      })
    }

    // Revalidate admin dashboard since it shows completed tests stats
    revalidatePath('/admin')
    revalidateTag('admin-dashboard', 'max')
    // Revalidate student dashboard and results pages
    revalidatePath('/student')
    revalidateTag('student-dashboard', 'max')
    revalidateTag('student-results', 'max')
    revalidateTag('student-assignments', 'max')

    return NextResponse.json({
      success: true,
      message: 'Test results saved successfully',
      session: {
        id: session.id,
        testId: session.testId,
        studentId: session.studentId,
        startedAt: session.startedAt?.toISOString() || null,
        answers: session.answers || {},
        isCompleted: session.isCompleted,
        completedAt: session.completedAt?.toISOString() || null,
        score: session.score,
        band: session.band,
        itemWiseTestId: session.itemWiseTestId,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Error saving test results:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/student/reading-tests/[id]/results
 * Retrieves test results for a student
 */
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

    const resolvedParams = await params
    const itemWiseTestIdParam = request.nextUrl.searchParams.get('itemWiseTestId')
    const normalizedItemWiseTestId =
      itemWiseTestIdParam && itemWiseTestIdParam.trim().length > 0 ? itemWiseTestIdParam : null

    // Find completed session
    const session = await prisma.testSession.findFirst({
      where: {
        testId: resolvedParams.id,
        studentId: payload.userId,
        testType: 'READING',
        isCompleted: true,
        itemWiseTestId: normalizedItemWiseTestId
      },
      orderBy: { completedAt: 'desc' }
    })

    if (!session) {
      return NextResponse.json({ error: 'Test results not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: session.id,
      testId: session.testId,
      studentId: session.studentId,
      startedAt: session.startedAt?.toISOString() || null,
      answers: session.answers || {},
      isCompleted: session.isCompleted,
      completedAt: session.completedAt?.toISOString() || null,
      score: session.score,
      band: session.band,
      itemWiseTestId: session.itemWiseTestId,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString()
    })

  } catch (error) {
    console.error('Error fetching test results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

