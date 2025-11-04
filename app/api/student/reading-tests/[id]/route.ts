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

    const resolvedParams = await params
    const readingTest = await prisma.readingTest.findUnique({
      where: {
        id: resolvedParams.id,
        isActive: true
      },
      include: {
        passages: {
          include: {
            contents: {
              orderBy: { order: 'asc' }
            },
            questions: {
              include: {
                correctAnswer: true
              },
              orderBy: { questionNumber: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        bandScoreRanges: {
          orderBy: { minScore: 'desc' }
        }
      }
    })

    if (!readingTest) {
      return NextResponse.json(
        { error: 'Reading test not found or not available' },
        { status: 404 }
      )
    }

    // Transform the data to match the expected format for the reading test component
    const transformedData: any = {
      test: {
        title: readingTest.title,
        totalQuestions: readingTest.totalQuestions,
        totalTimeMinutes: readingTest.totalTimeMinutes
      },
      passages: readingTest.passages.map(passage => ({
        id: passage.order,
        title: passage.title,
        content: passage.contents.map(content => ({
          id: content.contentId,
          text: content.text
        }))
      })),
      passageConfigs: [
        { part: 1, total: 13, start: 1 },
        { part: 2, total: 13, start: 14 },
        { part: 3, total: 14, start: 27 }
      ],
      questions: {},
      correctAnswers: {},
      bandCalculation: {
        ranges: readingTest.bandScoreRanges.map(range => ({
          minScore: range.minScore,
          band: range.band
        }))
      }
    }

    // Transform questions and answers
    readingTest.passages.forEach(passage => {
      passage.questions.forEach(question => {
        transformedData.questions[question.questionNumber] = {
          passageId: passage.order,
          type: question.type.toLowerCase().replace(/_/g, '-'),
          questionText: question.questionText,
          options: question.options || undefined,
          headingsList: question.headingsList || undefined,
          summaryText: question.summaryText || undefined,
          subQuestions: question.subQuestions || undefined
        }
        transformedData.correctAnswers[question.questionNumber] = question.correctAnswer?.answer || ''
      })
    })

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error fetching reading test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
