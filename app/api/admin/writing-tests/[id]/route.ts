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
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const writingTest = await prisma.writingTest.findUnique({
      where: { id },
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
          orderBy: {
            order: 'asc'
          }
        },
        passageConfigs: {
          orderBy: {
            part: 'asc'
          }
        }
      }
    })

    if (!writingTest) {
      return NextResponse.json({ error: 'Writing test not found' }, { status: 404 })
    }

    return NextResponse.json({ writingTest })
  } catch (error) {
    console.error('Error fetching writing test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const { id } = await params
    const { title, readingTestId, totalTimeMinutes, isActive, passages, passageConfigs } = await request.json()

    // First, delete all existing passages, questions, contents, and configs
    await prisma.writingQuestion.deleteMany({
      where: {
        passage: {
          writingTestId: id
        }
      }
    })
    await prisma.writingPassageContent.deleteMany({
      where: {
        passage: {
          writingTestId: id
        }
      }
    })
    await prisma.writingPassage.deleteMany({
      where: {
        writingTestId: id
      }
    })
    await prisma.writingPassageConfig.deleteMany({
      where: {
        writingTestId: id
      }
    })

    // Update the writing test and recreate passages and configs
    const writingTest = await prisma.writingTest.update({
      where: { id },
      data: {
        title,
        readingTestId: readingTestId || undefined,
        totalTimeMinutes,
        isActive,
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

    // Update the reading test to store the writing test ID
    if (readingTestId) {
      await prisma.readingTest.update({
        where: { id: readingTestId },
        data: { writingTestId: writingTest.id }
      })
    }

    return NextResponse.json({ writingTest })
  } catch (error) {
    console.error('Error updating writing test:', error)
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

    const { id } = await params

    // Get the writing test to find the associated reading test
    const writingTest = await prisma.writingTest.findUnique({
      where: { id },
      select: { readingTestId: true }
    })

    // Delete the writing test
    await prisma.writingTest.delete({
      where: { id }
    })

    // Clear the writingTestId from the reading test
    if (writingTest?.readingTestId) {
      await prisma.readingTest.update({
        where: { id: writingTest.readingTestId },
        data: { writingTestId: null }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting writing test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

