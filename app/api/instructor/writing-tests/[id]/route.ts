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
    if (!payload || payload.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const writingTest = await prisma.writingTest.findUnique({
      where: { id: resolvedParams.id },
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
    if (!payload || payload.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const body = await request.json()
    const { title, readingTestId, totalTimeMinutes, isActive, passages, passageConfigs } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!readingTestId) {
      return NextResponse.json({ error: 'Reading test ID is required' }, { status: 400 })
    }

    if (!passages || !Array.isArray(passages)) {
      return NextResponse.json({ error: 'Passages array is required' }, { status: 400 })
    }

    if (!passageConfigs || !Array.isArray(passageConfigs)) {
      return NextResponse.json({ error: 'Passage configs array is required' }, { status: 400 })
    }

    // Validate readingPassageId references if provided
    const readingPassageIds = new Set<string>()
    passages.forEach((passage: any) => {
      (passage.questions || []).forEach((question: any) => {
        if (question.readingPassageId && question.readingPassageId.trim() !== '') {
          readingPassageIds.add(question.readingPassageId)
        }
      })
    })

    // Verify all reading passage IDs exist
    if (readingPassageIds.size > 0) {
      const existingPassages = await prisma.passage.findMany({
        where: {
          id: { in: Array.from(readingPassageIds) }
        },
        select: { id: true }
      })
      const existingIds = new Set(existingPassages.map(p => p.id))
      const missingIds = Array.from(readingPassageIds).filter(id => !existingIds.has(id))
      if (missingIds.length > 0) {
        return NextResponse.json(
          { error: `Invalid reading passage IDs: ${missingIds.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // First, delete all existing passages, questions, contents, and configs
    await prisma.writingQuestion.deleteMany({
      where: {
        passage: {
          writingTestId: resolvedParams.id
        }
      }
    })
    await prisma.writingPassageContent.deleteMany({
      where: {
        passage: {
          writingTestId: resolvedParams.id
        }
      }
    })
    await prisma.writingPassage.deleteMany({
      where: {
        writingTestId: resolvedParams.id
      }
    })
    await prisma.writingPassageConfig.deleteMany({
      where: {
        writingTestId: resolvedParams.id
      }
    })

    // Update the writing test and recreate passages and configs
    const writingTest = await prisma.writingTest.update({
      where: { id: resolvedParams.id },
      data: {
        title,
        readingTestId: readingTestId, // Required field, already validated above
        totalTimeMinutes: totalTimeMinutes || 60,
        isActive: isActive !== undefined ? isActive : true,
        passages: {
          create: passages.map((passage: any, passageIndex: number) => {
            if (!passage.title) {
              throw new Error(`Passage at index ${passageIndex} is missing a title`)
            }
            return {
              title: passage.title,
              order: passage.order || passageIndex + 1,
              contents: {
                create: (passage.contents || []).map((content: any, contentIndex: number) => {
                  if (!content.contentId || !content.text) {
                    throw new Error(`Content at index ${contentIndex} in passage "${passage.title}" is missing required fields`)
                  }
                  return {
                    contentId: content.contentId,
                    text: content.text,
                    order: contentIndex + 1
                  }
                })
              },
              questions: {
                create: (passage.questions || []).map((question: any, qIndex: number) => {
                  if (!question.type || !question.questionText) {
                    throw new Error(`Question at index ${qIndex} in passage "${passage.title}" is missing required fields (type or questionText)`)
                  }
                  // Validate question type
                  if (!['TASK_1', 'TASK_2'].includes(question.type)) {
                    throw new Error(`Question at index ${qIndex} in passage "${passage.title}" has invalid type: ${question.type}. Must be TASK_1 or TASK_2`)
                  }
                  return {
                    questionNumber: question.questionNumber || qIndex + 1,
                    type: question.type,
                    questionText: question.questionText,
                    readingPassageId: question.readingPassageId && question.readingPassageId.trim() !== '' ? question.readingPassageId : null,
                    points: question.points || 1
                  }
                })
              }
            }
          })
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
    // Only update if it's different from current value
    if (readingTestId) {
      const currentReadingTest = await prisma.readingTest.findUnique({
        where: { id: readingTestId },
        select: { writingTestId: true }
      })
      
      if (currentReadingTest && currentReadingTest.writingTestId !== writingTest.id) {
        await prisma.readingTest.update({
          where: { id: readingTestId },
          data: { writingTestId: writingTest.id }
        })
      } else if (!currentReadingTest?.writingTestId) {
        await prisma.readingTest.update({
          where: { id: readingTestId },
          data: { writingTestId: writingTest.id }
        })
      }
    }

    return NextResponse.json({ writingTest })
  } catch (error: any) {
    console.error('Error updating writing test:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    const errorCode = error?.code || 'UNKNOWN'
    const errorMeta = error?.meta || {}
    
    console.error('Error details:', { 
      errorMessage, 
      errorStack, 
      errorCode,
      errorMeta,
      id: resolvedParams.id
    })
    
    // Check for Prisma-specific errors
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Unique constraint violation', details: errorMessage, field: errorMeta?.target },
        { status: 400 }
      )
    }
    
    if (error?.code === 'P2003') {
      return NextResponse.json(
        { error: 'Foreign key constraint violation', details: errorMessage, field: errorMeta?.field_name },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage, code: errorCode },
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

    // Get the writing test to find the associated reading test
    const writingTest = await prisma.writingTest.findUnique({
      where: { id: resolvedParams.id },
      select: { readingTestId: true }
    })

    // Delete the writing test
    await prisma.writingTest.delete({
      where: { id: resolvedParams.id }
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

