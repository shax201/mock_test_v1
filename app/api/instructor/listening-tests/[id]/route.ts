import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'
import { ListeningQuestionType } from '@prisma/client'

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
    const listeningTest = await prisma.listeningTest.findUnique({
      where: { id: resolvedParams.id },
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
            }
          },
          orderBy: {
            index: 'asc'
          }
        }
      }
    })

    if (!listeningTest) {
      return NextResponse.json({ error: 'Listening test not found' }, { status: 404 })
    }

    return NextResponse.json({ listeningTest })
  } catch (error) {
    console.error('Error fetching listening test:', error)
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
    const { title, audioSource, instructions, readingTestId, isActive, parts } = await request.json()

    // If parts are provided, do a full update (delete existing parts and recreate)
    if (parts && Array.isArray(parts)) {
      // Delete existing parts (cascade will delete questions and answers)
      await prisma.listeningPart.deleteMany({
        where: { listeningTestId: resolvedParams.id }
      })

      // Update the test and create new parts
      const listeningTest = await prisma.listeningTest.update({
        where: { id: resolvedParams.id },
        data: {
          ...(title !== undefined && { title }),
          ...(audioSource !== undefined && { audioSource }),
          ...(instructions !== undefined && { instructions }),
          ...(readingTestId !== undefined && { readingTestId: readingTestId || null }),
          ...(isActive !== undefined && { isActive }),
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
                  type: question.type as ListeningQuestionType,
                  labelPrefix: question.labelPrefix || null,
                  textPrefix: question.textPrefix || null,
                  textSuffix: question.textSuffix || null,
                  questionText: question.questionText || null,
                  options: question.options || null,
                  matchingLabel: question.matchingLabel || null,
                  imageUrl: question.imageUrl || null,
                  field: question.field || null,
                  groupId: question.groupId || null,
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
              }
            },
            orderBy: {
              index: 'asc'
            }
          }
        }
      })

      return NextResponse.json({ listeningTest })
    } else {
      // Simple update without parts
      const listeningTest = await prisma.listeningTest.update({
        where: { id: resolvedParams.id },
        data: {
          ...(title !== undefined && { title }),
          ...(audioSource !== undefined && { audioSource }),
          ...(instructions !== undefined && { instructions }),
          ...(readingTestId !== undefined && { readingTestId: readingTestId || null }),
          ...(isActive !== undefined && { isActive })
        },
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
              }
            },
            orderBy: {
              index: 'asc'
            }
          }
        }
      })

      return NextResponse.json({ listeningTest })
    }
  } catch (error) {
    console.error('Error updating listening test:', error)
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
    await prisma.listeningTest.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ message: 'Listening test deleted successfully' })
  } catch (error) {
    console.error('Error deleting listening test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

