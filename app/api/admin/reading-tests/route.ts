import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const readingTests = await prisma.readingTest.findMany({
      include: {
        passages: {
          include: {
            questions: true,
            _count: {
              select: { questions: true }
            }
          }
        },
        _count: {
          select: { passages: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ readingTests })
  } catch (error) {
    console.error('Error fetching reading tests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, totalQuestions, totalTimeMinutes, passages, bandScoreRanges } = await request.json()

    if (!title || !passages || !bandScoreRanges) {
      return NextResponse.json(
        { error: 'Title, passages, and band score ranges are required' },
        { status: 400 }
      )
    }

    // Create reading test with all related data
    const readingTest = await prisma.readingTest.create({
      data: {
        title,
        totalQuestions: totalQuestions || 40,
        totalTimeMinutes: totalTimeMinutes || 60,
        passages: {
          create: passages.map((passage: any, passageIndex: number) => ({
            title: passage.title,
            order: passageIndex + 1,
            contents: {
              create: passage.contents?.create?.map((content: any, contentIndex: number) => ({
                contentId: content.contentId,
                text: content.text,
                order: contentIndex + 1
              })) || []
            },
            questions: {
              create: passage.questions?.create?.map((question: any, questionIndex: number) => ({
                questionNumber: question.questionNumber,
                type: question.type,
                questionText: question.questionText,
                options: question.options,
                headingsList: question.headingsList,
                summaryText: question.summaryText,
                subQuestions: question.subQuestions,
                points: question.points || 1,
                correctAnswer: question.correctAnswer
              })) || []
            }
          }))
        },
        bandScoreRanges: {
          create: bandScoreRanges.map((range: any) => ({
            minScore: range.minScore,
            band: range.band
          }))
        }
      },
      include: {
        passages: {
          include: {
            questions: {
              include: {
                correctAnswer: true
              }
            },
            contents: true
          }
        },
        bandScoreRanges: true
      }
    })

    return NextResponse.json({ readingTest }, { status: 201 })
  } catch (error) {
    console.error('Error creating reading test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
