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

    const writingTests = await prisma.writingTest.findMany({
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
            },
            _count: {
              select: { questions: true }
            }
          },
          orderBy: { order: 'asc' }
        },
        passageConfigs: {
          orderBy: { part: 'asc' }
        },
        _count: {
          select: { passages: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ writingTests })
  } catch (error) {
    console.error('Error fetching writing tests:', error)
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

    const { title, readingTestId, totalTimeMinutes, passages, passageConfigs } = await request.json()

    if (!title || !readingTestId || !passages || !passageConfigs) {
      return NextResponse.json(
        { error: 'Title, reading test ID, passages, and passage configurations are required' },
        { status: 400 }
      )
    }

    // Create writing test with all related data
    const writingTest = await prisma.writingTest.create({
      data: {
        title,
        readingTestId,
        totalTimeMinutes: totalTimeMinutes || 60,
        passages: {
          create: passages.map((passage: any, passageIndex: number) => ({
            title: passage.title,
            order: passage.order || passageIndex + 1,
            contents: {
              create: passage.contents?.map((content: any, contentIndex: number) => ({
                contentId: content.contentId,
                text: content.text,
                order: contentIndex + 1
              })) || []
            },
            questions: {
              create: passage.questions?.map((question: any) => ({
                questionNumber: question.questionNumber,
                type: question.type,
                questionText: question.questionText,
                readingPassageId: question.readingPassageId || null,
                points: question.points || 1
              })) || []
            }
          }))
        },
        passageConfigs: {
          create: passageConfigs.map((config: any) => ({
            part: config.part,
            total: config.total,
            start: config.start
          }))
        }
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
            contents: true,
            questions: {
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
        },
        passageConfigs: true
      }
    })

    return NextResponse.json({ writingTest }, { status: 201 })
  } catch (error) {
    console.error('Error creating writing test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

