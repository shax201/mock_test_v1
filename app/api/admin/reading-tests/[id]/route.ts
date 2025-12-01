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
                create: (() => {
                  const questionsToCreate: any[] = []
                  
                  ;(passage.questions?.create || []).forEach((question: any) => {
                    // Normalize question type to match enum values
                    let questionType = question.type || question.questionType || 'MULTIPLE_CHOICE'
                    // Convert FLOW_CHART to match enum (should already be FLOW_CHART, but ensure consistency)
                    if (questionType === 'FLOW_CHART' || questionType === 'FLOWCHART') {
                      questionType = 'FLOW_CHART'
                    }
                    // Convert other types to uppercase with underscores
                    questionType = questionType.toUpperCase().replace(/-/g, '_')
                    
                    // For FLOW_CHART questions with multiple fields, flatten into separate questions
                    if (questionType === 'FLOW_CHART' && question.fields && Array.isArray(question.fields) && question.fields.length > 0) {
                      question.fields.forEach((field: any, fieldIndex: number) => {
                        const fieldQuestionData: any = {
                          questionNumber: (question.questionNumber || question.number || 0) + fieldIndex,
                          type: 'FLOW_CHART',
                          questionText: question.questionText || question.text || '',
                          points: question.points || 1,
                          imageUrl: question.imageUrl || '',
                          field: field,
                          fields: question.fields, // Keep all fields for reference
                        }
                        
                        // Use the field's value as the correct answer
                        if (field?.value) {
                          fieldQuestionData.correctAnswer = {
                            create: {
                              answer: typeof field.value === 'string' ? field.value : String(field.value)
                            }
                          }
                        }
                        
                        questionsToCreate.push(fieldQuestionData)
                      })
                    } else {
                      // For non-flow-chart questions, create as normal
                      const questionData: any = {
                        questionNumber: question.questionNumber || question.number,
                        type: questionType,
                        questionText: question.questionText || question.text || '',
                        points: question.points || 1,
                      }

                      // Add optional fields
                      if (question.options) questionData.options = question.options
                      if (question.headingsList) questionData.headingsList = question.headingsList
                      if (question.summaryText) questionData.summaryText = question.summaryText
                      if (question.subQuestions) questionData.subQuestions = question.subQuestions

                      // Flow chart specific fields (for single field flow charts)
                      if (question.imageUrl) questionData.imageUrl = question.imageUrl
                      if (question.field) questionData.field = question.field
                      if (question.fields) questionData.fields = question.fields

                      // Handle correct answer - extract string value from any structure
                      if (question.correctAnswer) {
                        let answerValue: string = ''
                        if (typeof question.correctAnswer === 'string') {
                          answerValue = question.correctAnswer
                        } else if (question.correctAnswer.answer) {
                          answerValue = typeof question.correctAnswer.answer === 'string' 
                            ? question.correctAnswer.answer 
                            : question.correctAnswer.answer.answer || ''
                        } else if (question.correctAnswer.create?.answer) {
                          answerValue = typeof question.correctAnswer.create.answer === 'string'
                            ? question.correctAnswer.create.answer
                            : ''
                        }
                        
                        if (answerValue) {
                          questionData.correctAnswer = {
                            create: {
                              answer: answerValue
                            }
                          }
                        }
                      }

                      questionsToCreate.push(questionData)
                    }
                  })
                  
                  return questionsToCreate
                })()
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
