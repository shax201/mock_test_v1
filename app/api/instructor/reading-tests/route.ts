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
    if (!payload || payload.role !== 'INSTRUCTOR') {
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
    if (!payload || payload.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    
    // Handle both payload structures: direct API call or form submission
    let title: string
    let totalQuestions: number
    let totalTimeMinutes: number
    let passages: any[]
    let bandScoreRanges: any[]
    let passageConfigs: any[] = []

    if (body.test) {
      // Form payload structure: { test, passages, bandScores, passageConfigs }
      title = body.test.title
      totalQuestions = body.test.totalQuestions || 40
      totalTimeMinutes = body.test.totalTimeMinutes || 60
      passages = body.passages || []
      bandScoreRanges = body.bandScores || []
      passageConfigs = body.passageConfigs || []
    } else {
      // Direct API call structure: { title, totalQuestions, totalTimeMinutes, passages, bandScoreRanges }
      title = body.title
      totalQuestions = body.totalQuestions || 40
      totalTimeMinutes = body.totalTimeMinutes || 60
      passages = body.passages || []
      bandScoreRanges = body.bandScoreRanges || []
      passageConfigs = body.passageConfigs || []
    }

    if (!title || !passages || !bandScoreRanges) {
      return NextResponse.json(
        { error: 'Title, passages, and band score ranges are required' },
        { status: 400 }
      )
    }

    // Transform passages to include questions from the form structure
    // The form sends questions separately, grouped by passageId
    // We need to match questions to their passages
    const transformedPassages = passages.map((passage: any, passageIndex: number) => {
      // Get questions for this passage from the form structure
      // Questions are stored separately with passageId reference
      const passageQuestions = passage.questions || []
      
      return {
        title: passage.title,
        order: passageIndex + 1,
        contents: {
          create: (passage.contents?.create || passage.contents || []).map((content: any, contentIndex: number) => ({
            contentId: content.contentId || content.id,
            text: content.text,
            order: contentIndex + 1
          }))
        },
        questions: {
          create: passageQuestions.map((question: any) => {
            const questionData: any = {
              questionNumber: question.questionNumber,
              type: question.type,
              questionText: question.questionText,
              points: question.points || 1
            }
            
            // Add optional fields
            if (question.options) questionData.options = question.options
            if (question.headingsList) questionData.headingsList = question.headingsList
            if (question.summaryText) questionData.summaryText = question.summaryText
            if (question.subQuestions) questionData.subQuestions = question.subQuestions
            
            // Handle correct answer
            if (question.correctAnswer) {
              questionData.correctAnswer = {
                create: {
                  answer: typeof question.correctAnswer === 'string' 
                    ? question.correctAnswer 
                    : question.correctAnswer.answer || question.correctAnswer
                }
              }
            }
            
            return questionData
          })
        }
      }
    })

    // Create reading test with all related data
    const readingTest = await prisma.readingTest.create({
      data: {
        title,
        totalQuestions: totalQuestions || 40,
        totalTimeMinutes: totalTimeMinutes || 60,
        passages: {
          create: transformedPassages
        },
        bandScoreRanges: {
          create: bandScoreRanges.map((range: any) => ({
            minScore: range.minScore,
            band: range.band
          }))
        },
        passageConfigs: passageConfigs.length > 0 ? {
          create: passageConfigs.map((config: any) => ({
            part: config.part,
            total: config.total,
            start: config.start
          }))
        } : undefined
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

