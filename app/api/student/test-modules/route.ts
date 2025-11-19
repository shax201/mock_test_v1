import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find assignment by access token
    const assignment = await prisma.assignment.findUnique({
      where: { accessToken: token },
      include: {
        readingTest: {
          select: {
            id: true,
            title: true
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    const studentId = assignment.studentId
    const readingTestId = assignment.readingTestId

    // Check for associated listening and writing tests
    const readingTest = await prisma.readingTest.findUnique({
      where: { id: readingTestId },
      include: {
        listeningTests: {
          select: {
            id: true,
            title: true,
            totalTimeMinutes: true
          },
          take: 1
        },
        writingTests: {
          select: {
            id: true,
            title: true,
            totalTimeMinutes: true
          },
          take: 1
        }
      }
    })

    if (!readingTest) {
      return NextResponse.json({ error: 'Reading test not found' }, { status: 404 })
    }

    // Build modules array
    const modules: any[] = []

    // Always include READING module
    const readingSession = await prisma.testSession.findFirst({
      where: {
        studentId,
        testType: 'READING',
        testId: readingTestId
      },
      orderBy: { createdAt: 'desc' }
    })

    modules.push({
      id: `reading-${readingTestId}`,
      type: 'READING',
      duration: readingTest.totalTimeMinutes || 60,
      instructions: 'Complete the reading test within the allocated time.',
      isCompleted: readingSession?.isCompleted || false,
      submittedAt: readingSession?.completedAt || null,
      autoScore: readingSession?.band || null
    })

    // Add LISTENING module if available
    const listeningTest = readingTest.listeningTests?.[0]
    if (listeningTest) {
      const listeningSession = await prisma.testSession.findFirst({
        where: {
          studentId,
          testType: 'LISTENING',
          testId: listeningTest.id
        },
        orderBy: { createdAt: 'desc' }
      })

      modules.push({
        id: `listening-${listeningTest.id}`,
        type: 'LISTENING',
        duration: listeningTest.totalTimeMinutes || 30,
        instructions: 'Complete the listening test. You will hear each recording once only.',
        isCompleted: listeningSession?.isCompleted || false,
        submittedAt: listeningSession?.completedAt || null,
        autoScore: listeningSession?.band || null
      })
    }

    // Add WRITING module if available
    const writingTest = readingTest.writingTests?.[0]
    if (writingTest) {
      const writingSession = await prisma.testSession.findFirst({
        where: {
          studentId,
          testType: 'WRITING',
          testId: writingTest.id
        },
        orderBy: { createdAt: 'desc' }
      })

      modules.push({
        id: `writing-${writingTest.id}`,
        type: 'WRITING',
        duration: writingTest.totalTimeMinutes || 60,
        instructions: 'Complete the writing test. Your answers will be graded by an instructor.',
        isCompleted: writingSession?.isCompleted || false,
        submittedAt: writingSession?.completedAt || null,
        autoScore: writingSession?.band || null
      })
    }

    return NextResponse.json({
      modules,
      assignment: {
        id: assignment.id,
        studentName: assignment.student.name || assignment.student.email,
        mockTitle: assignment.readingTest.title
      }
    })
  } catch (error) {
    console.error('Error fetching test modules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

