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
    if (!payload || payload.role !== 'INSTRUCTOR') {
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
            sectionTitle: part.sectionTitle || null,
            courseRequired: part.courseRequired || null,
            matchingHeading: part.matchingHeading || part.matching?.heading || null,
            matchingOptions: part.matchingOptions || part.matching?.options || null,
            notesSections: part.notesSections || part.notes || null,
            questions: {
              create: part.questions?.map((question: any) => ({
                number: question.number,
                type: question.type,
                labelPrefix: question.labelPrefix || null,
                textPrefix: question.textPrefix || null,
                textSuffix: question.textSuffix || null,
                questionText: question.questionText || null,
                options: question.options || null,
                matchingLabel: question.matchingLabel || null,
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

