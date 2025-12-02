import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'
import { revalidatePath, revalidateTag } from 'next/cache'

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
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, totalQuestions, totalTimeMinutes, passages, bandScoreRanges } = await request.json()

    if (!title || !passages || !bandScoreRanges) {
      return NextResponse.json(
        { error: 'Title, passages, and band score ranges are required' },
        { status: 400 }
      )
    }

    // Create reading test with all related data
    const readingTest = await prisma.readingTest.create({
      data: {
        title,
        totalQuestions: totalQuestions || 40,
        totalTimeMinutes: totalTimeMinutes || 60,
        passages: {
          create: passages.map((passage: any, passageIndex: number) => ({
            title: passage.title,
            order: passageIndex + 1,
            contents: {
              create: passage.contents?.create?.map((content: any, contentIndex: number) => ({
                contentId: content.contentId,
                text: content.text,
                order: contentIndex + 1
              })) || []
            },
            questions: {
              create: (() => {
                const questionsToCreate: any[] = []
                
                ;(passage.questions?.create || []).forEach((question: any) => {
                  // Normalize question type to match enum values
                  let questionType = question.type || question.questionType || 'MULTIPLE_CHOICE'
                  // Convert FLOW_CHART to match enum
                  if (questionType === 'FLOW_CHART' || questionType === 'FLOWCHART') {
                    questionType = 'FLOW_CHART'
                  }
                  // Convert other types to uppercase with underscores
                  questionType = questionType.toUpperCase().replace(/-/g, '_')
                  
                  // For FLOW_CHART questions: if already separate (has field but not fields array), use as-is
                  // If grouped (has fields array but no field), flatten into separate questions
                  if (questionType === 'FLOW_CHART') {
                    // Check if this is already a single-field question (has field property)
                    if (question.field && (!question.fields || question.fields.length === 0)) {
                      // Already a separate question, use as-is
                      const questionData: any = {
                        questionNumber: question.questionNumber || question.number,
                        type: 'FLOW_CHART',
                        questionText: question.questionText || question.text || '',
                        points: question.points || 1,
                        imageUrl: question.imageUrl || '',
                        field: question.field,
                        fields: question.fields || [question.field], // Store for reference
                      }
                      
                      if (question.correctAnswer) {
                        questionData.correctAnswer = {
                          create: {
                            answer: typeof question.correctAnswer === 'string' 
                              ? question.correctAnswer 
                              : question.correctAnswer.answer || question.correctAnswer
                          }
                        }
                      }
                      
                      questionsToCreate.push(questionData)
                    } else if (question.fields && Array.isArray(question.fields) && question.fields.length > 0) {
                      // Grouped question with multiple fields - flatten into separate questions
                      question.fields.forEach((field: any, fieldIndex: number) => {
                        // Use field's questionNumber if set, otherwise calculate from starting question number + index
                        const fieldQuestionNumber = field.questionNumber !== undefined 
                          ? field.questionNumber 
                          : (question.questionNumber || question.number || 0) + fieldIndex
                        
                        const fieldQuestionData: any = {
                          questionNumber: fieldQuestionNumber,
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
                        } else if (question.correctAnswer) {
                          fieldQuestionData.correctAnswer = {
                            create: {
                              answer: typeof question.correctAnswer === 'string' 
                                ? question.correctAnswer 
                                : question.correctAnswer.answer || question.correctAnswer
                            }
                          }
                        }
                        
                        questionsToCreate.push(fieldQuestionData)
                      })
                    }
                  } else {
                    // Non-flow-chart question, create as normal
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

                    questionsToCreate.push(questionData)
                  }
                })
                
                return questionsToCreate
              })()
            }
          }))
        },
        bandScoreRanges: {
          create: bandScoreRanges.map((range: any) => ({
            minScore: range.minScore,
            band: range.band
          }))
        }
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

    // Revalidate the reading tests list page and cache tags
    revalidatePath('/admin/reading-tests')
    revalidateTag('reading-tests', 'max')
    // Also revalidate dashboard since it shows test creation activity
    revalidatePath('/admin')
    revalidateTag('admin-dashboard', 'max')

    return NextResponse.json({ readingTest }, { status: 201 })
  } catch (error) {
    console.error('Error creating reading test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
