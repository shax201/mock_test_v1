import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { calculateAllModuleScores } from '@/lib/scoring/detailed-scorer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params
    
    // Get JWT token from cookies
    const token = request.cookies.get('student-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    // Verify JWT token
    const decoded = await verifyJWT(token)

    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Invalid user role' },
        { status: 403 }
      )
    }

    // The testId could be either a mock ID or an assignment ID
    // Let's first try to find by assignment ID, then by mock ID
    let assignment = await prisma.assignment.findFirst({
      where: {
        id: testId,
        studentId: decoded.userId
      },
      include: {
        result: true,
        mock: true,
        student: true,
        submissions: {
          include: {
            module: true
          }
        }
      }
    })
    
    // If not found by assignment ID, try to find by mock ID
    if (!assignment) {
      assignment = await prisma.assignment.findFirst({
        where: {
          mockId: testId,
          studentId: decoded.userId
        },
        include: {
          result: true,
          mock: true,
          student: true,
          submissions: {
            include: {
              module: true
            }
          }
        }
      })
    }

    if (!assignment) {
      return NextResponse.json(
        { error: 'Test not found or access denied' },
        { status: 404 }
      )
    }

    if (!assignment.result) {
      return NextResponse.json(
        { error: 'Results are not yet available. Please check back in 2-3 business days.' },
        { status: 202 }
      )
    }

    // Get writing feedback if available
    const writingFeedback = await prisma.writingFeedback.findMany({
      where: {
        submission: {
          assignmentId: assignment.id,
          module: {
            type: 'WRITING'
          }
        }
      },
      include: {
        instructor: {
          select: { email: true }
        }
      }
    })

    // Get detailed scores for each module using the proper detailed scorer
    const detailedScores = await calculateAllModuleScores(assignment.id)

    // Get detailed question information for review
    const questionDetails: any = {}
    
    for (const submission of assignment.submissions) {
      const moduleType = submission.module.type.toLowerCase()
      
      // Get questions with student answers
      const questions = await prisma.mockQuestion.findMany({
        where: {
          moduleId: submission.module.id
        },
        include: {
          questionBank: true
        },
        orderBy: { order: 'asc' }
      })

      const studentAnswers = (submission.answersJson || {}) as Record<string, any>
      
      questionDetails[moduleType] = questions.map((question) => {
        const contentJson = question.questionBank.contentJson as any
        const studentAnswer = studentAnswers[question.id] || ''

        // Prefer remedial-style answers stored inside contentJson
        let correctAnswer: string = ''
        if (contentJson?.correctAnswers && typeof contentJson.correctAnswers === 'object') {
          const keys = Object.keys(contentJson.correctAnswers)
          if (keys.length > 0) {
            correctAnswer = String(contentJson.correctAnswers[keys[0]] ?? '')
          }
        } else if (contentJson?.correctAnswer) {
          correctAnswer = String(contentJson.correctAnswer)
        } else if (typeof question.correctAnswerJson === 'string') {
          correctAnswer = question.correctAnswerJson
        } else if (Array.isArray(question.correctAnswerJson)) {
          correctAnswer = (question.correctAnswerJson as any[]).map(String).join(',')
        } else if (question.correctAnswerJson != null) {
          correctAnswer = String(question.correctAnswerJson)
        }

        // Check if answer is correct (using the same logic as auto-scorer)
        let isCorrect = false
        if (studentAnswer && correctAnswer) {
          let normalizedStudent = String(studentAnswer).trim().toLowerCase()

          // For multiple choice questions, extract the letter if the answer is in format "A) Option text"
          if (question.questionBank.type === 'MULTIPLE_CHOICE' || question.questionBank.type === 'MCQ') {
            const letterMatch = normalizedStudent.match(/^([a-d])\)/)
            if (letterMatch) {
              normalizedStudent = letterMatch[1]
            }
          }

          isCorrect = String(correctAnswer).trim().toLowerCase() === normalizedStudent
        }

        return {
          id: question.id,
          question: contentJson.content || '',
          type: getQuestionTypeDisplayName(question.questionBank.type),
          part: contentJson.part || 1,
          options: contentJson.options || [],
          studentAnswer: studentAnswer,
          correctAnswer: correctAnswer,
          isCorrect: isCorrect,
          explanation: contentJson.explanation || null
        }
      })
    }

    const results = {
      testTitle: assignment.mock.title,
      testDate: assignment.result.generatedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      }),
      candidateNumber: assignment.candidateNumber,
      studentName: assignment.student.name,
      mockTestId: assignment.mock.id, // Add mock test ID for remedial tests
      bandScores: {
        listening: assignment.result.listeningBand || 0,
        reading: assignment.result.readingBand || 0,
        writing: assignment.result.writingBand || 0,
        speaking: assignment.result.speakingBand || 0
      },
      overallBand: assignment.result.overallBand || 0,
      detailedScores,
      questionDetails,
      feedback: {
        writing: writingFeedback.map(fb => ({
          text: fb.comment,
          comment: `Instructor feedback: ${fb.comment}`,
          range: [fb.textRangeStart, fb.textRangeEnd]
        }))
      },
      generatedAt: assignment.result.generatedAt.toISOString(),
      status: assignment.status
    }

    return NextResponse.json({ results })

  } catch (error) {
    console.error('Results by testId error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getQuestionTypeDisplayName(type: string): string {
  switch (type) {
    case 'MCQ':
    case 'MULTIPLE_CHOICE':
      return 'Multiple Choice'
    case 'FIB':
      return 'Fill in the Blank'
    case 'MATCHING':
      return 'Matching'
    case 'TRUE_FALSE':
      return 'True/False'
    case 'TRUE_FALSE_NOT_GIVEN':
      return 'True/False/Not Given'
    case 'NOTES_COMPLETION':
      return 'Notes Completion'
    case 'SUMMARY_COMPLETION':
      return 'Summary Completion'
    default:
      return type
  }
}
