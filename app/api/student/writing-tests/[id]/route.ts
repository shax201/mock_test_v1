import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

/**
 * GET /api/student/writing-tests/[id]
 * Fetches writing test data for a student
 * Returns the test with all passages, questions, and configurations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate student
    const token = request.cookies.get('student-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const writingTestId = resolvedParams.id

    // Fetch writing test with all related data
    const writingTest = await prisma.writingTest.findUnique({
      where: {
        id: writingTestId,
        isActive: true
      },
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
        },
        passageConfigs: {
          orderBy: { part: 'asc' }
        }
      }
    })

    if (!writingTest) {
      return NextResponse.json(
        { error: 'Writing test not found or not available' },
        { status: 404 }
      )
    }

    // Transform data to match expected format for frontend
    const transformedData = {
      test: {
        id: writingTest.id,
        title: writingTest.title,
        totalTimeMinutes: writingTest.totalTimeMinutes,
        readingTestId: writingTest.readingTestId,
        readingTest: writingTest.readingTest
      },
      passages: writingTest.passages.map((passage) => ({
        id: passage.id,
        title: passage.title,
        order: passage.order,
        contents: passage.contents.map((content) => ({
          id: content.contentId,
          text: content.text,
          order: content.order
        })),
        questions: passage.questions.map((question) => ({
          id: question.id,
          questionNumber: question.questionNumber,
          type: question.type,
          questionText: question.questionText,
          points: question.points,
          readingPassageId: question.readingPassageId,
          readingPassage: question.readingPassage
        }))
      })),
      passageConfigs: writingTest.passageConfigs.map((config) => ({
        part: config.part,
        total: config.total,
        start: config.start
      }))
    }

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error fetching writing test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

