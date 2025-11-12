import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function GET(
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

    // Fetch the test session
    const session = await prisma.testSession.findUnique({
      where: { id: resolvedParams.id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!session || session.testType !== 'WRITING') {
      return NextResponse.json(
        { error: 'Writing test submission not found' },
        { status: 404 }
      )
    }

    // Fetch writing test details with passages and questions
    const writingTest = await prisma.writingTest.findUnique({
      where: { id: session.testId },
      include: {
        readingTest: {
          select: {
            id: true,
            title: true
          }
        },
        passages: {
          include: {
            contents: {
              orderBy: { order: 'asc' }
            },
            questions: {
              include: {
                readingPassage: {
                  select: {
                    id: true,
                    title: true,
                    order: true
                  }
                }
              },
              orderBy: { questionNumber: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!writingTest) {
      return NextResponse.json(
        { error: 'Writing test not found' },
        { status: 404 }
      )
    }

    // Check if there's a speaking session for this student and reading test
    const speakingSession = await prisma.testSession.findFirst({
      where: {
        studentId: session.studentId,
        testId: writingTest.readingTestId,
        testType: 'SPEAKING',
        isCompleted: true
      },
      orderBy: { completedAt: 'desc' },
      select: {
        id: true,
        band: true,
        score: true,
        completedAt: true
      }
    })

    return NextResponse.json({
      submission: {
        id: session.id,
        student: {
          id: session.student.id,
          name: session.student.name || 'Unknown',
          email: session.student.email
        },
        test: {
          id: writingTest.id,
          title: writingTest.title,
          readingTest: writingTest.readingTest
        },
        answers: session.answers,
        isCompleted: session.isCompleted,
        completedAt: session.completedAt?.toISOString() || null,
        score: session.score,
        band: session.band,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        speakingBand: speakingSession?.band || null
      },
      testDetails: {
        passages: writingTest.passages.map((passage) => ({
          id: passage.id,
          title: passage.title,
          order: passage.order,
          contents: passage.contents,
          questions: passage.questions.map((q) => ({
            id: q.id,
            questionNumber: q.questionNumber,
            type: q.type,
            questionText: q.questionText,
            points: q.points,
            readingPassage: q.readingPassage
          }))
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching writing test submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Delete the test session
    await prisma.testSession.delete({
      where: { id: resolvedParams.id }
    })

    // Revalidate the submissions list page and cache tags
    revalidatePath('/admin/writing-tests/submissions')
    revalidateTag('writing-submissions', 'max')

    return NextResponse.json({
      success: true,
      message: 'Submission deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting writing test submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
