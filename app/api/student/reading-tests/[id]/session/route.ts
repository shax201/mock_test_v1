import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'
import { revalidatePath, revalidateTag } from 'next/cache'

interface TestSession {
  id: string
  testId: string
  studentId: string
  startedAt: string | null
  answers: any
  isCompleted: boolean
  completedAt: string | null
  score: number | null
  band: number | null
  createdAt: string
  updatedAt: string
}

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

    // Check if reading test exists
    const readingTest = await prisma.readingTest.findUnique({
      where: { id: resolvedParams.id, isActive: true }
    })

    if (!readingTest) {
      return NextResponse.json({ error: 'Reading test not found' }, { status: 404 })
    }

    // Try to find existing session
    const existingSession = await prisma.testSession.findFirst({
      where: {
        testId: resolvedParams.id,
        studentId: payload.userId,
        testType: 'READING'
      },
      orderBy: { createdAt: 'desc' }
    })

    if (existingSession) {
      return NextResponse.json({
        id: existingSession.id,
        testId: existingSession.testId,
        studentId: existingSession.studentId,
        startedAt: existingSession.startedAt?.toISOString() || null,
        answers: existingSession.answers || {},
        isCompleted: existingSession.isCompleted,
        completedAt: existingSession.completedAt?.toISOString() || null,
        score: existingSession.score,
        band: existingSession.band,
        createdAt: existingSession.createdAt.toISOString(),
        updatedAt: existingSession.updatedAt.toISOString()
      })
    }

    // No existing session found
    return NextResponse.json({ error: 'No session found' }, { status: 404 })

  } catch (error) {
    console.error('Error fetching test session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const { action } = await request.json()

    if (action !== 'start') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Check if reading test exists
    const readingTest = await prisma.readingTest.findUnique({
      where: { id: resolvedParams.id, isActive: true }
    })

    if (!readingTest) {
      return NextResponse.json({ error: 'Reading test not found' }, { status: 404 })
    }

    // Check if student already has a completed session
    const existingCompletedSession = await prisma.testSession.findFirst({
      where: {
        testId: resolvedParams.id,
        studentId: payload.userId,
        testType: 'READING',
        isCompleted: true
      }
    })

    if (existingCompletedSession) {
      return NextResponse.json(
        { error: 'Test already completed. You cannot retake this test.' },
        { status: 409 }
      )
    }

    // Find or create session
    let session = await prisma.testSession.findFirst({
      where: {
        testId: resolvedParams.id,
        studentId: payload.userId,
        testType: 'READING',
        isCompleted: false
      }
    })

    if (!session) {
      // Create new session
      session = await prisma.testSession.create({
        data: {
          testId: resolvedParams.id,
          studentId: payload.userId,
          testType: 'READING',
          startedAt: new Date(),
          answers: {},
          isCompleted: false
        }
      })
    } else if (!session.startedAt) {
      // Update existing session with start time
      session = await prisma.testSession.update({
        where: { id: session.id },
        data: {
          startedAt: new Date()
        }
      })
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
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString()
    })

  } catch (error) {
    console.error('Error starting test session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const { action, score, band, answers } = await request.json()

    if (action !== 'complete') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Find the active session
    const session = await prisma.testSession.findFirst({
      where: {
        testId: resolvedParams.id,
        studentId: payload.userId,
        testType: 'READING',
        isCompleted: false
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'No active session found' }, { status: 404 })
    }

    // Update session with completion data
    const updatedSession = await prisma.testSession.update({
      where: { id: session.id },
      data: {
        answers: answers || {},
        isCompleted: true,
        completedAt: new Date(),
        score: score || 0,
        band: band || 0
      }
    })

    // Revalidate admin dashboard since it shows completed tests stats
    revalidatePath('/admin')
    revalidateTag('admin-dashboard', 'max')
    // Revalidate student dashboard and results pages
    revalidatePath('/student')
    revalidateTag('student-dashboard', 'max')
    revalidateTag('student-results', 'max')
    revalidateTag('student-assignments', 'max')

    return NextResponse.json({
      id: updatedSession.id,
      testId: updatedSession.testId,
      studentId: updatedSession.studentId,
      startedAt: updatedSession.startedAt?.toISOString() || null,
      answers: updatedSession.answers || {},
      isCompleted: updatedSession.isCompleted,
      completedAt: updatedSession.completedAt?.toISOString() || null,
      score: updatedSession.score,
      band: updatedSession.band,
      createdAt: updatedSession.createdAt.toISOString(),
      updatedAt: updatedSession.updatedAt.toISOString()
    })

  } catch (error) {
    console.error('Error completing test session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
