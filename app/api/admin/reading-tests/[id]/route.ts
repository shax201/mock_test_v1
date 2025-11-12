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
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

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
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const { title, totalQuestions, totalTimeMinutes, passages, bandScoreRanges, passageConfigs } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Use transaction for atomic updates with increased timeout
    await prisma.$transaction(async (tx) => {
      // Get current test data to compare
      const currentTest = await tx.readingTest.findUnique({
        where: { id },
        select: {
          title: true,
          totalQuestions: true,
          totalTimeMinutes: true,
        }
      })

      if (!currentTest) {
        throw new Error('Reading test not found')
      }

      // Only update basic fields if they changed
      const updateData: any = {}
      if (currentTest.title !== title) updateData.title = title
      if (currentTest.totalQuestions !== (totalQuestions || 40)) {
        updateData.totalQuestions = totalQuestions || 40
      }
      if (currentTest.totalTimeMinutes !== (totalTimeMinutes || 60)) {
        updateData.totalTimeMinutes = totalTimeMinutes || 60
      }

      if (Object.keys(updateData).length > 0) {
        await tx.readingTest.update({
          where: { id },
          data: updateData
        })
      }

      // Update passages if provided
      if (passages && Array.isArray(passages)) {
        // Delete existing passages (cascade will handle questions and contents)
        await tx.passage.deleteMany({
          where: { readingTestId: id }
        })

        // Create new passages sequentially (nested creates require this)
        for (const passage of passages) {
          await tx.passage.create({
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

      // Update band score ranges if provided
      if (bandScoreRanges && Array.isArray(bandScoreRanges)) {
        await tx.bandScoreRange.deleteMany({
          where: { readingTestId: id }
        })

        if (bandScoreRanges.length > 0) {
          await tx.bandScoreRange.createMany({
            data: bandScoreRanges.map((range: any) => ({
              readingTestId: id,
              minScore: range.minScore,
              band: range.band
            }))
          })
        }
      }

      // Update passage configs if provided
      if (passageConfigs && Array.isArray(passageConfigs)) {
        await tx.passageConfig.deleteMany({
          where: { readingTestId: id }
        })

        if (passageConfigs.length > 0) {
          await tx.passageConfig.createMany({
            data: passageConfigs.map((config: any) => ({
              readingTestId: id,
              part: config.part,
              total: config.total,
              start: config.start
            }))
          })
        }
      }
    }, {
      maxWait: 10000, // Maximum time to wait for a transaction slot
      timeout: 30000, // Maximum time the transaction can run (30 seconds)
    })

    // Fetch updated reading test with all relations (outside transaction for better performance)
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

    // Revalidate the reading tests list page and cache tags
    revalidatePath('/admin/reading-tests')
    revalidateTag('reading-tests', 'max')

    return NextResponse.json({ readingTest: updatedReadingTest })
  } catch (error: any) {
    console.error('Error updating reading test:', error)
    
    // Handle specific errors
    if (error.message === 'Reading test not found') {
      return NextResponse.json(
        { error: 'Reading test not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
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

    // Check if the reading test exists before trying to delete
    const readingTest = await prisma.readingTest.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!readingTest) {
      return NextResponse.json(
        { error: 'Reading test not found' },
        { status: 404 }
      )
    }

    // Delete the reading test (cascade will handle related records)
    await prisma.readingTest.delete({
      where: { id }
    })

    // Revalidate the reading tests list page and cache tags
    revalidatePath('/admin/reading-tests')
    revalidateTag('reading-tests', 'max')
    revalidatePath('/admin')
    revalidateTag('admin-dashboard', 'max')

    return NextResponse.json({ message: 'Reading test deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting reading test:', error)
    
    // Handle Prisma record not found error
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Reading test not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
