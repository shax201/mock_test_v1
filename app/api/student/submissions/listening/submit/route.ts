import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { scoreListening } from '@/lib/scoring/auto-scorer'
import { calculateListeningBand } from '@/lib/scoring/band-calculator'
import { calculateAndStoreResults } from '@/lib/scoring/result-calculator'

// Calculate band score from percentage for remedial tests
function calculateBandFromPercentage(percentage: number): number {
  if (percentage >= 95) return 9.0
  if (percentage >= 90) return 8.5
  if (percentage >= 85) return 8.0
  if (percentage >= 80) return 7.5
  if (percentage >= 75) return 7.0
  if (percentage >= 70) return 6.5
  if (percentage >= 65) return 6.0
  if (percentage >= 60) return 5.5
  if (percentage >= 55) return 5.0
  if (percentage >= 50) return 4.5
  if (percentage >= 45) return 4.0
  if (percentage >= 40) return 3.5
  if (percentage >= 35) return 3.0
  if (percentage >= 30) return 2.5
  if (percentage >= 25) return 2.0
  if (percentage >= 20) return 1.5
  if (percentage >= 15) return 1.0
  if (percentage >= 10) return 0.5
  return 0.0
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, answers, timeSpent } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find assignment by token
    const assignment = await prisma.assignment.findUnique({
      where: { tokenHash: token },
      include: {
        mock: {
          include: {
            modules: {
              where: { type: 'LISTENING' },
              include: {
                questions: {
                  include: {
                    questionBank: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    const listeningModule = assignment.mock.modules[0]
    if (!listeningModule) {
      return NextResponse.json({ error: 'Listening module not found' }, { status: 404 })
    }

    // Check if submission already exists
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        assignmentId: assignment.id,
        moduleId: listeningModule.id
      }
    })

    // Calculate score
    const studentAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer: answer as string
    }))

    const correctAnswers = listeningModule.questions.map(q => {
      // Map Prisma QuestionType to the supported types in auto-scorer
      let mappedType: string = q.questionBank.type
      switch (q.questionBank.type) {
        case 'TRUE_FALSE_NOT_GIVEN':
          mappedType = 'NOT_GIVEN' // Map to the closest equivalent
          break
        case 'MULTIPLE_CHOICE':
          mappedType = 'MCQ' // Map to the closest equivalent
          break
        case 'NOTES_COMPLETION':
        case 'SUMMARY_COMPLETION':
          mappedType = 'FIB' // Map to the closest equivalent
          break
        default:
          mappedType = q.questionBank.type
          break
      }
      
      // Handle different answer formats for remedial tests vs regular tests
      let correctAnswer = ''
      const contentJson = q.questionBank.contentJson as any
      
      if (contentJson?.correctAnswers && typeof contentJson.correctAnswers === 'object') {
        // For remedial tests with correctAnswers object (e.g., {"0": "Option A"})
        const answerKeys = Object.keys(contentJson.correctAnswers)
        if (answerKeys.length > 0) {
          correctAnswer = contentJson.correctAnswers[answerKeys[0]]
        }
      } else if (contentJson?.correctAnswer) {
        // For remedial tests with direct correctAnswer
        correctAnswer = contentJson.correctAnswer
      } else if (q.correctAnswerJson) {
        // For regular tests with correctAnswerJson
        correctAnswer = typeof q.correctAnswerJson === 'string' ? q.correctAnswerJson : 
                       Array.isArray(q.correctAnswerJson) ? q.correctAnswerJson.map(String).join(',') : 
                       String(q.correctAnswerJson || '')
      }
      
      return {
        questionId: q.id,
        answer: correctAnswer,
        type: mappedType as 'MCQ' | 'FIB' | 'MATCHING' | 'TRUE_FALSE' | 'NOT_GIVEN'
      }
    })

    const scoreResult = scoreListening(studentAnswers, correctAnswers)
    
    // Debug logging for scoring
    console.log('Scoring Debug:', {
      studentAnswers,
      correctAnswers,
      scoreResult,
      totalQuestions: correctAnswers.length
    })
    
    // Calculate band score based on percentage for remedial tests
    let bandScore = 0
    if (scoreResult.totalQuestions > 0) {
      const percentage = (scoreResult.correctCount / scoreResult.totalQuestions) * 100
      bandScore = calculateBandFromPercentage(percentage)
      console.log('Band Score Calculation:', {
        correctCount: scoreResult.correctCount,
        totalQuestions: scoreResult.totalQuestions,
        percentage: percentage.toFixed(2),
        bandScore
      })
    }

    let submission
    if (existingSubmission) {
      // Update existing submission
      submission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          answersJson: answers,
          submittedAt: new Date(),
          autoScore: bandScore
        }
      })
    } else {
      // Create new submission
      submission = await prisma.submission.create({
        data: {
          assignmentId: assignment.id,
          moduleId: listeningModule.id,
          startedAt: new Date(),
          answersJson: answers,
          submittedAt: new Date(),
          autoScore: bandScore
        }
      })
    }

    // Update RemedialTestSession if this is a remedial test
    if (assignment.mock.title.startsWith('Remedial Test:')) {
      try {
        const remedialTestTitle = assignment.mock.title.replace('Remedial Test: ', '')
        await prisma.remedialTestSession.updateMany({
          where: {
            studentId: assignment.studentId,
            template: {
              title: remedialTestTitle
            }
          },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            score: Math.round(bandScore * 10) / 10
          }
        })
      } catch (error) {
        console.error('Error updating RemedialTestSession:', error)
      }
    }

    // Calculate and store overall results
    try {
      await calculateAndStoreResults(assignment.id)
    } catch (error) {
      console.error('Error calculating results:', error)
      // Don't fail the submission if result calculation fails
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      score: {
        correctCount: scoreResult.correctCount,
        totalQuestions: scoreResult.totalQuestions,
        bandScore: bandScore
      }
    })
  } catch (error) {
    console.error('Submit error:', error)
    return NextResponse.json(
      { error: 'Failed to submit' },
      { status: 500 }
    )
  }
}
