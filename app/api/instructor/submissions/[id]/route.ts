import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

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
    if (!payload || payload.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const sessionId = resolvedParams.id

    // Fetch test session
    const session = await prisma.testSession.findUnique({
      where: { id: sessionId },
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

    if (!session) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (session.testType !== 'WRITING') {
      return NextResponse.json({ error: 'This endpoint only handles writing test submissions' }, { status: 400 })
    }

    // Fetch writing test details
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
          orderBy: { order: 'asc' },
          include: {
            contents: {
              orderBy: { order: 'asc' }
            },
            questions: {
              orderBy: { questionNumber: 'asc' },
              include: {
                readingPassage: {
                  select: {
                    id: true,
                    title: true,
                    order: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!writingTest) {
      return NextResponse.json({ error: 'Writing test not found' }, { status: 404 })
    }

    return NextResponse.json({
      submission: {
        id: session.id,
        student: {
          id: session.student.id,
          name: session.student.name,
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
        updatedAt: session.updatedAt.toISOString()
      },
      testDetails: {
        passages: writingTest.passages
      }
    })
  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

