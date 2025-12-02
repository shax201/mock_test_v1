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
    // Timeout increased to 60s to handle flow chart questions with many fields
    const transactionStartTime = Date.now()
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

      // ALWAYS delete all existing questions and passages first, regardless of whether new ones are provided
      // This ensures that deleted questions are actually removed from the database
      console.log(`🗑️ Starting deletion of all existing passages and questions...`)
      
      // Get all passage IDs for this reading test
      const existingPassages = await tx.passage.findMany({
        where: { readingTestId: id },
        select: { id: true }
      })
      
      console.log(`🗑️ Found ${existingPassages.length} existing passages to delete`)
      
      // Store existing question numbers for verification later
      let existingQuestionNumbers: number[] = []
      
      if (existingPassages.length > 0) {
        const passageIds = existingPassages.map(p => p.id)
        console.log(`🗑️ Passage IDs to delete: ${passageIds.join(', ')}`)
        
        // Get all question IDs for these passages
        const existingQuestions = await tx.question.findMany({
          where: { passageId: { in: passageIds } },
          select: { id: true, questionNumber: true }
        })
        
        existingQuestionNumbers = existingQuestions.map(q => q.questionNumber)
        const questionIds = existingQuestions.map(q => q.id)
        console.log(`🗑️ Found ${questionIds.length} existing questions to delete: ${existingQuestions.map(q => `Q${q.questionNumber}`).join(', ')}`)
        
        // Delete correct answers first (they have foreign key to questions)
        if (questionIds.length > 0) {
          try {
            const deletedAnswers = await tx.correctAnswer.deleteMany({
              where: { questionId: { in: questionIds } }
            })
            console.log(`✅ Deleted ${deletedAnswers.count} correct answers`)
          } catch (error: any) {
            console.error('❌ Error deleting correct answers:', error?.message || error)
            // Don't throw - continue with question deletion
          }
        }
        
        // Delete all questions for these passages
        try {
          const deletedQuestions = await tx.question.deleteMany({
            where: { passageId: { in: passageIds } }
          })
          console.log(`✅ Deleted ${deletedQuestions.count} questions`)
        } catch (error: any) {
          console.error('❌ Error deleting questions:', error?.message || error)
          throw new Error(`Failed to delete questions: ${error?.message || 'Unknown error'}`)
        }
        
        // Delete all passage contents
        try {
          const deletedContents = await tx.passageContent.deleteMany({
            where: { passageId: { in: passageIds } }
          })
          console.log(`✅ Deleted ${deletedContents.count} passage contents`)
        } catch (error: any) {
          console.error('❌ Error deleting passage contents:', error?.message || error)
          // Don't throw - contents will be recreated anyway
        }
      } else {
        // Even if no passages exist, try to delete any orphaned questions
        try {
          const orphanedQuestions = await tx.question.findMany({
            where: {
              passage: {
                readingTestId: id
              }
            },
            select: { id: true }
          })
          if (orphanedQuestions.length > 0) {
            const orphanedIds = orphanedQuestions.map(q => q.id)
            await tx.correctAnswer.deleteMany({
              where: { questionId: { in: orphanedIds } }
            })
            await tx.question.deleteMany({
              where: { id: { in: orphanedIds } }
            })
            console.log(`✅ Deleted ${orphanedQuestions.length} orphaned questions`)
          }
        } catch (error: any) {
          console.error('❌ Error deleting orphaned questions:', error?.message || error)
        }
      }
      
      // Now delete the passages themselves
      try {
        const deletedPassages = await tx.passage.deleteMany({
          where: { readingTestId: id }
        })
        console.log(`✅ Deleted ${deletedPassages.count} passages`)
      } catch (error: any) {
        console.error('❌ Error deleting passages:', error?.message || error)
        throw new Error(`Failed to delete passages: ${error?.message || 'Unknown error'}`)
      }

      // Update passages if provided
      if (passages && Array.isArray(passages) && passages.length > 0) {
        console.log(`🔄 Creating ${passages.length} new passages...`)

        // Create new passages sequentially (nested creates require this)
        for (let i = 0; i < passages.length; i++) {
          const passage = passages[i]
          const passageStartTime = Date.now()
          console.log(`📝 Creating passage ${i + 1}/${passages.length}: ${passage.title}`)
          
          // Count questions to create (including flattened flow chart questions)
          let questionCount = 0
          if (passage.questions?.create) {
            passage.questions.create.forEach((q: any) => {
              if (q.type === 'FLOW_CHART' && q.fields && Array.isArray(q.fields)) {
                questionCount += q.fields.length
              } else {
                questionCount += 1
              }
            })
          }
          console.log(`   Creating ${questionCount} questions for this passage...`)
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
                    
                    // For FLOW_CHART questions: if already separate (has field but not fields array), use as-is
                    // If grouped (has fields array but no field), flatten into separate questions
                    if (questionType === 'FLOW_CHART') {
                      // Check if this is already a single-field question (has field property)
                      if (question.field && (!question.fields || question.fields.length === 0)) {
                        // Already a separate question, use as-is
                        const fieldQuestionData: any = {
                          questionNumber: question.questionNumber || question.number,
                          type: 'FLOW_CHART',
                          questionText: question.questionText || question.text || '',
                          points: question.points || 1,
                          imageUrl: question.imageUrl || '',
                          field: question.field,
                          fields: question.fields || [question.field], // Store for reference
                        }
                        
                        // Handle correct answer
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
                            fieldQuestionData.correctAnswer = {
                              create: {
                                answer: answerValue
                              }
                            }
                          }
                        }
                        
                        questionsToCreate.push(fieldQuestionData)
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
                          }
                          
                          questionsToCreate.push(fieldQuestionData)
                        })
                      }
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
          
          const passageTime = Date.now() - passageStartTime
          console.log(`✅ Passage ${i + 1} created in ${passageTime}ms`)
        }
        console.log(`✅ All passages created`)
        
        // Verify deletion worked - check that old questions are gone (if we had any)
        if (existingQuestionNumbers.length > 0) {
          const remainingOldQuestions = await tx.question.findMany({
            where: {
              passage: {
                readingTestId: id
              },
              questionNumber: {
                in: existingQuestionNumbers
              }
            },
            select: { id: true, questionNumber: true, type: true }
          })
          
          if (remainingOldQuestions.length > 0) {
            console.warn(`⚠️ WARNING: ${remainingOldQuestions.length} old questions still exist after deletion: ${remainingOldQuestions.map((q: any) => `Q${q.questionNumber} (${q.type})`).join(', ')}`)
            console.warn(`⚠️ This might indicate questions were recreated with the same question numbers`)
          } else {
            console.log(`✅ Verification: All ${existingQuestionNumbers.length} old questions successfully deleted`)
          }
        }
        
        // Count total questions after creation
        const totalQuestionsAfter = await tx.question.count({
          where: {
            passage: {
              readingTestId: id
            }
          }
        })
        console.log(`📊 Total questions in database after update: ${totalQuestionsAfter}`)
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
      maxWait: 20000, // Maximum time to wait for a transaction slot (20 seconds)
      timeout: 60000, // Maximum time the transaction can run (60 seconds) - increased for flow chart questions
    })
    
    const transactionTime = Date.now() - transactionStartTime
    console.log(`✅ Transaction completed in ${transactionTime}ms`)

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
