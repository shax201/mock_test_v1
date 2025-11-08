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
    if (!payload || payload.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const { id } = resolvedParams

    const readingTest = await prisma.readingTest.findUnique({
      where: { id },
      include: {
        passages: {
          include: {
            questions: {
              include: {
                correctAnswer: true
              }
            },
            contents: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        bandScoreRanges: {
          orderBy: {
            minScore: 'desc'
          }
        },
        passageConfigs: {
          orderBy: {
            part: 'asc'
          }
        }
      }
    })

    if (!readingTest) {
      return NextResponse.json({ error: 'Reading test not found' }, { status: 404 })
    }

    return NextResponse.json({ readingTest })
  } catch (error) {
    console.error('Error fetching reading test:', error)
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
    if (!payload || payload.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const { id } = resolvedParams

    const { title, totalQuestions, totalTimeMinutes, passages, bandScoreRanges, passageConfigs } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Update reading test
    const readingTest = await prisma.readingTest.update({
      where: { id },
      data: {
        title,
        totalQuestions: totalQuestions || 40,
        totalTimeMinutes: totalTimeMinutes || 60
      }
    })

    // If passages are provided, update them
    if (passages) {
      // Delete existing passages, questions, and contents
      await prisma.question.deleteMany({
        where: {
          passage: {
            readingTestId: id
          }
        }
      })
      await prisma.passageContent.deleteMany({
        where: {
          passage: {
            readingTestId: id
          }
        }
      })
      await prisma.passage.deleteMany({
        where: { readingTestId: id }
      })

      // Create new passages
      for (const passage of passages) {
        await prisma.passage.create({
          data: {
            readingTestId: id,
            title: passage.title,
            order: passage.order,
            contents: {
              create: passage.contents?.create?.map((content: any) => ({
                contentId: content.contentId,
                text: content.text,
                order: content.order
              })) || []
            },
            questions: {
              create: passage.questions?.create?.map((question: any) => ({
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
          }
        })
      }
    }

    // If band score ranges are provided, update them
    if (bandScoreRanges) {
      await prisma.bandScoreRange.deleteMany({
        where: { readingTestId: id }
      })

      await prisma.bandScoreRange.createMany({
        data: bandScoreRanges.map((range: any) => ({
          readingTestId: id,
          minScore: range.minScore,
          band: range.band
        }))
      })
    }

    // If passage configs are provided, update them
    if (passageConfigs) {
      await prisma.passageConfig.deleteMany({
        where: { readingTestId: id }
      })

      await prisma.passageConfig.createMany({
        data: passageConfigs.map((config: any) => ({
          readingTestId: id,
          part: config.part,
          total: config.total,
          start: config.start
        }))
      })
    }

    // Fetch updated reading test with all relations
    const updatedReadingTest = await prisma.readingTest.findUnique({
      where: { id },
      include: {
        passages: {
          include: {
            questions: {
              include: {
                correctAnswer: true
              }
            },
            contents: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        bandScoreRanges: {
          orderBy: {
            minScore: 'desc'
          }
        },
        passageConfigs: {
          orderBy: {
            part: 'asc'
          }
        }
      }
    })

    // Revalidate instructor reading tests page and cache tags
    revalidatePath('/instructor/reading-tests')
    revalidateTag('instructor-reading-tests')

    return NextResponse.json({ readingTest: updatedReadingTest })
  } catch (error) {
    console.error('Error updating reading test:', error)
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
    if (!payload || payload.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const { id } = resolvedParams

    // Delete the reading test (cascade will handle related records)
    await prisma.readingTest.delete({
      where: { id }
    })

    // Revalidate instructor reading tests page and cache tags
    revalidatePath('/instructor/reading-tests')
    revalidateTag('instructor-reading-tests')

    return NextResponse.json({ message: 'Reading test deleted successfully' })
  } catch (error) {
    console.error('Error deleting reading test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

