import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const body = await request.json()

    const { band, task1Band, task2Band, speakingBand } = body

    // Validate band score
    if (band !== undefined && (band < 0 || band > 9)) {
      return NextResponse.json(
        { error: 'Band score must be between 0 and 9' },
        { status: 400 }
      )
    }

    if (task1Band !== undefined && (task1Band < 0 || task1Band > 9)) {
      return NextResponse.json(
        { error: 'Task 1 band score must be between 0 and 9' },
        { status: 400 }
      )
    }

    if (task2Band !== undefined && (task2Band < 0 || task2Band > 9)) {
      return NextResponse.json(
        { error: 'Task 2 band score must be between 0 and 9' },
        { status: 400 }
      )
    }

    if (speakingBand !== undefined && (speakingBand < 0 || speakingBand > 9)) {
      return NextResponse.json(
        { error: 'Speaking band score must be between 0 and 9' },
        { status: 400 }
      )
    }

    // Check if session exists and is a writing test
    const session = await prisma.testSession.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!session || session.testType !== 'WRITING') {
      return NextResponse.json(
        { error: 'Writing test submission not found' },
        { status: 404 }
      )
    }

    // Calculate overall band if task bands are provided
    let overallBand = band
    if (task1Band !== undefined && task2Band !== undefined) {
      // Task 2 is worth 2/3, Task 1 is worth 1/3
      overallBand = (task1Band * 1 + task2Band * 2) / 3
      // Round to nearest 0.5
      overallBand = Math.round(overallBand * 2) / 2
    } else if (task1Band !== undefined) {
      overallBand = task1Band
    } else if (task2Band !== undefined) {
      overallBand = task2Band
    }

    // Update the session with evaluation
    const updatedSession = await prisma.testSession.update({
      where: { id: resolvedParams.id },
      data: {
        band: overallBand !== undefined ? overallBand : null,
        score: overallBand !== undefined ? Math.round(overallBand * 10) : null // Convert band to score (0-90)
      }
    })

    // Handle speaking band score - create or update SPEAKING test session
    let speakingSession = null
    if (speakingBand !== undefined) {
      // Find or create a speaking test session for this student and reading test
      const writingTest = await prisma.writingTest.findUnique({
        where: { id: session.testId },
        select: { readingTestId: true }
      })

      if (writingTest) {
        // Check if speaking session already exists
        const existingSpeakingSession = await prisma.testSession.findFirst({
          where: {
            studentId: session.studentId,
            testId: writingTest.readingTestId,
            testType: 'SPEAKING'
          }
        })

        if (existingSpeakingSession) {
          // Update existing speaking session
          speakingSession = await prisma.testSession.update({
            where: { id: existingSpeakingSession.id },
            data: {
              band: speakingBand,
              score: Math.round(speakingBand * 10),
              isCompleted: true,
              completedAt: new Date()
            }
          })
        } else {
          // Create new speaking session
          speakingSession = await prisma.testSession.create({
            data: {
              testId: writingTest.readingTestId,
              studentId: session.studentId,
              testType: 'SPEAKING',
              band: speakingBand,
              score: Math.round(speakingBand * 10),
              isCompleted: true,
              completedAt: new Date(),
              startedAt: new Date()
            }
          })
        }
      }
    }

    // Revalidate the submissions list page and cache tags
    revalidatePath('/admin/writing-tests/submissions')
    revalidateTag('writing-submissions', 'max')
    // Also revalidate dashboard since it shows pending submissions count
    revalidatePath('/admin')
    revalidateTag('admin-dashboard', 'max')
    // Revalidate student results pages
    revalidateTag('student-results', 'max')
    revalidateTag('student-result-detail', 'max')

    return NextResponse.json({
      success: true,
      submission: {
        id: updatedSession.id,
        band: updatedSession.band,
        score: updatedSession.score,
        updatedAt: updatedSession.updatedAt.toISOString()
      },
      speakingSession: speakingSession ? {
        id: speakingSession.id,
        band: speakingSession.band,
        score: speakingSession.score,
        updatedAt: speakingSession.updatedAt.toISOString()
      } : null
    })
  } catch (error) {
    console.error('Error evaluating writing test submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

