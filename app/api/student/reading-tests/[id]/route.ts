import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('student-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const readingTest = await prisma.readingTest.findUnique({
      where: {
        id: resolvedParams.id,
        isActive: true
      },
      include: {
        passages: {
          include: {
            contents: {
              orderBy: { order: 'asc' }
            },
            questions: {
              include: {
                correctAnswer: true
              },
              orderBy: { questionNumber: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        bandScoreRanges: {
          orderBy: { minScore: 'desc' }
        }
      }
    })

    if (!readingTest) {
      return NextResponse.json(
        { error: 'Reading test not found or not available' },
        { status: 404 }
      )
    }

    // Transform the data to match the expected format for the reading test component
    const transformedData: any = {
      test: {
        title: readingTest.title,
        totalQuestions: readingTest.totalQuestions,
        totalTimeMinutes: readingTest.totalTimeMinutes
      },
      passages: readingTest.passages.map(passage => ({
        id: passage.order,
        title: passage.title,
        content: passage.contents.map(content => ({
          id: content.contentId,
          text: content.text
        }))
      })),
      passageConfigs: [
        { part: 1, total: 13, start: 1 },
        { part: 2, total: 13, start: 14 },
        { part: 3, total: 14, start: 27 }
      ],
      questions: {},
      correctAnswers: {},
      bandCalculation: {
        ranges: readingTest.bandScoreRanges.map(range => ({
          minScore: range.minScore,
          band: range.band
        }))
      }
    }

    // Transform questions and answers
    readingTest.passages.forEach(passage => {
      // Separate flow chart questions so we can group them by image
      const flowChartQuestions = passage.questions.filter(q => q.type === 'FLOW_CHART')
      const otherQuestions = passage.questions.filter(q => q.type !== 'FLOW_CHART')

      // Handle non-flow-chart questions as before
      otherQuestions.forEach(question => {
        transformedData.questions[question.questionNumber] = {
          passageId: passage.order,
          type: question.type.toLowerCase().replace(/_/g, '-'),
          questionText: question.questionText,
          options: question.options || undefined,
          headingsList: question.headingsList || undefined,
          summaryText: question.summaryText || undefined,
          subQuestions: question.subQuestions || undefined
        }
        transformedData.correctAnswers[question.questionNumber] =
          question.correctAnswer?.answer || ''
      })

      // Group flow chart questions by image (one flow chart per image per passage)
      if (flowChartQuestions.length > 0) {
        type FlowGroupItem = { qNum: number; field: any; questionText: string }
        const flowGroups = new Map<string, { imageUrl: string; items: FlowGroupItem[] }>()

        flowChartQuestions.forEach(question => {
          const imageUrl = question.imageUrl || ''
          const key = `${passage.order}::${imageUrl}`

          if (!flowGroups.has(key)) {
            flowGroups.set(key, {
              imageUrl,
              items: []
            })
          }

          const group = flowGroups.get(key)!
          group.items.push({
            qNum: question.questionNumber,
            field: question.field,
            questionText: question.questionText || ''
          })

          // Correct answers are still stored per actual question number
          transformedData.correctAnswers[question.questionNumber] =
            question.correctAnswer?.answer || ''
        })

        // Convert each flow chart group into a single entry used for rendering
        flowGroups.forEach(group => {
          const sortedItems = group.items.sort((a, b) => a.qNum - b.qNum)
          
          // Extract fields and ensure they have questionNumber property set
          // Only include questions that have valid fields
          const fieldsWithQuestions = sortedItems
            .map(item => {
              const field = item.field
              if (field) {
                // Ensure field has questionNumber set (use the question's number if field doesn't have it)
                const fieldQuestionNumber = field.questionNumber !== undefined ? field.questionNumber : item.qNum
                return {
                  field: {
                    ...field,
                    questionNumber: fieldQuestionNumber
                  },
                  qNum: item.qNum,
                  questionText: item.questionText
                }
              }
              return null
            })
            .filter((item: any) => !!item && !!item.field)

          if (!group.imageUrl || fieldsWithQuestions.length === 0) {
            return
          }

          // Use only the questions that have matching fields
          // Sort by field.questionNumber to ensure correct order
          const sortedByFieldQNum = fieldsWithQuestions.sort((a, b) => {
            const aQNum = a.field.questionNumber ?? a.qNum
            const bQNum = b.field.questionNumber ?? b.qNum
            return aQNum - bQNum
          })

          const questionNumbers = sortedByFieldQNum.map(item => item.qNum)
          const fields = sortedByFieldQNum.map(item => item.field)

          const startQuestion = questionNumbers[0]
          const groupQuestionKey = startQuestion.toString()

          // Log for debugging - remove in production if needed
          console.log(`[Flow Chart] Passage ${passage.order}: Question numbers: ${questionNumbers.join(', ')}`)
          console.log(`[Flow Chart] Fields count: ${fields.length}, Field questionNumbers:`, fields.map((f: any) => f.questionNumber))

          transformedData.questions[groupQuestionKey] = {
            passageId: passage.order,
            type: 'flow-chart',
            // Use the question text from the first item (all should be the same)
            questionText: sortedByFieldQNum[0].questionText,
            // subQuestions are the real question numbers behind each blank (only for questions with fields)
            subQuestions: questionNumbers.map(n => n.toString()),
            imageUrl: group.imageUrl,
            fields
          }
        })
      }
    })

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error fetching reading test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
