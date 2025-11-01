import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { AssignmentStatus } from '@prisma/client'
import { scoreReading } from '@/lib/scoring/auto-scorer'
import { calculateReadingBand } from '@/lib/scoring/band-calculator'
import { calculateAndStoreResults } from '@/lib/scoring/result-calculator'

export async function POST(request: NextRequest) {
  try {
    const { token, answers, timeSpent } = await request.json()

    if (!token || !answers) {
      return NextResponse.json(
        { error: 'Token and answers are required' },
        { status: 400 }
      )
    }

    // Find assignment
    const assignment = await prisma.assignment.findUnique({
      where: { tokenHash: token },
      include: {
        mock: {
          include: {
            modules: {
              where: { type: 'READING' },
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
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 404 }
      )
    }

    const readingModule = assignment.mock.modules[0]
    if (!readingModule) {
      return NextResponse.json(
        { error: 'Reading module not found' },
        { status: 404 }
      )
    }

    // Check if submission already exists
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        assignmentId: assignment.id,
        moduleId: readingModule.id
      }
    })

    // Calculate score
    let totalScore = 0
    let totalQuestions = 0

    for (const question of readingModule.questions) {
      const userAnswer = answers[question.id]
      const content = question.questionBank.contentJson as any
      
      // Handle matching headings questions
      if (question.questionBank.type === 'MATCHING' && content?.passage && content?.headings) {
        const correctAnswers = content.correctAnswers || {}
        let questionScore = 0
        let correctCount = 0
        let totalCount = Object.keys(correctAnswers).length

        if (userAnswer && typeof userAnswer === 'object') {
          for (const [sectionId, correctHeading] of Object.entries(correctAnswers)) {
            if (userAnswer[sectionId] === correctHeading) {
              correctCount++
            }
          }
        }

        questionScore = totalCount > 0 ? (correctCount / totalCount) * question.points : 0
        totalScore += questionScore
        totalQuestions += question.points

        // optional: collect per-question details if you later add a table/JSON column
      } else {
        // Handle other question types
        const studentAnswers = Object.entries(answers).filter(([qId]) => qId === question.id).map(([questionId, answer]) => ({
          questionId,
          answer: answer as string
        }))

        const correctAnswers = [{
          questionId: question.id,
          answer: typeof question.correctAnswerJson === 'string' ? question.correctAnswerJson : 
                  Array.isArray(question.correctAnswerJson) ? question.correctAnswerJson.map(String) : 
                  String(question.correctAnswerJson || ''),
          type: question.questionBank.type === 'TRUE_FALSE_NOT_GIVEN' ? 'NOT_GIVEN' :
                question.questionBank.type === 'MULTIPLE_CHOICE' ? 'MCQ' :
                question.questionBank.type === 'NOTES_COMPLETION' || question.questionBank.type === 'SUMMARY_COMPLETION' ? 'FIB' :
                question.questionBank.type as 'MCQ' | 'FIB' | 'MATCHING' | 'TRUE_FALSE' | 'NOT_GIVEN'
        }]

        const scoreResult = scoreReading(studentAnswers, correctAnswers)
        const questionScore = scoreResult.correctCount > 0 ? question.points : 0
        totalScore += questionScore
        totalQuestions += question.points

        // optional: collect per-question details if you later add a table/JSON column
      }
    }

    const bandScore = totalQuestions > 0 ? calculateReadingBand(Math.round((totalScore / totalQuestions) * 40)) : 0

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
          moduleId: readingModule.id,
          startedAt: new Date(),
          answersJson: answers,
          submittedAt: new Date(),
          autoScore: bandScore
        }
      })
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
      submissionId: submission.id
    })
  } catch (error) {
    console.error('Reading submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
