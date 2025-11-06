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

    const listeningTests = await prisma.listeningTest.findMany({
      include: {
        readingTest: {
          select: {
            id: true,
            title: true
          }
        },
        parts: {
          include: {
            questions: {
              include: {
                correctAnswer: true
              }
            },
            _count: {
              select: { questions: true }
            }
          }
        },
        _count: {
          select: { parts: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ listeningTests })
  } catch (error) {
    console.error('Error fetching listening tests:', error)
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

    const { title, audioSource, instructions, parts, readingTestId } = await request.json()

    if (!title || !audioSource || !instructions || !parts) {
      return NextResponse.json(
        { error: 'Title, audio source, instructions, and parts are required' },
        { status: 400 }
      )
    }

    // Create listening test with all related data
    const listeningTest = await prisma.listeningTest.create({
      data: {
        title: title || 'IELTS Listening Test',
        audioSource,
        instructions,
        readingTestId: readingTestId || null,
        parts: {
          create: parts.map((part: any, partIndex: number) => ({
            index: part.index || partIndex + 1,
            title: part.title,
            prompt: part.prompt || [],
            sectionTitle: part.sectionTitle,
            courseRequired: part.courseRequired,
            matchingHeading: part.matching?.heading,
            matchingOptions: part.matching?.options,
            notesSections: part.notes,
            questions: {
              create: part.questions?.map((question: any) => ({
                number: question.number,
                type: question.type,
                labelPrefix: question.labelPrefix,
                textPrefix: question.textPrefix,
                textSuffix: question.textSuffix,
                questionText: question.questionText,
                options: question.options,
                matchingLabel: question.matchingLabel,
                correctAnswer: question.correctAnswer ? {
                  create: {
                    answer: question.correctAnswer
                  }
                } : undefined
              })) || []
            }
          }))
        }
      },
      include: {
        parts: {
          include: {
            questions: {
              include: {
                correctAnswer: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ listeningTest }, { status: 201 })
  } catch (error) {
    console.error('Error creating listening test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

