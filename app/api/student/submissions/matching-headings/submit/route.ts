import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateAndStoreResults } from '@/lib/scoring/result-calculator'

export async function POST(request: NextRequest) {
  try {
    const { token, answers, timeSpent } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find the assignment by token
    const assignment = await prisma.assignment.findUnique({
      where: { tokenHash: token },
      include: {
        mock: {
          include: {
            modules: {
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
      return NextResponse.json({ error: 'Invalid test token' }, { status: 404 })
    }

    // Check if assignment is still valid
    const now = new Date()
    if (now < assignment.validFrom || now > assignment.validUntil) {
      return NextResponse.json({ error: 'Test token has expired' }, { status: 400 })
    }

    // Find the reading module
    const readingModule = assignment.mock.modules.find(m => m.type === 'READING')
    if (!readingModule) {
      return NextResponse.json({ error: 'Reading module not found' }, { status: 404 })
    }

    // Get the matching headings questions for scoring
    const matchingHeadingsQuestions = readingModule.questions.filter(
      (q: any) => q.questionBank.type === 'MATCHING'
    )

    // Calculate scores for matching headings questions
    let totalScore = 0
    let detailedScores: any[] = []

    for (const question of matchingHeadingsQuestions) {
      const questionData = question.questionBank.contentJson as any
      const userAnswer = answers[question.id] || {}
      const correctAnswers = questionData.correctAnswers || {}
      
      // Calculate score for this question
      let questionScore = 0
      let correctCount = 0
      let totalCount = Object.keys(correctAnswers).length

      for (const [sectionId, correctHeading] of Object.entries(correctAnswers)) {
        if (userAnswer[sectionId] === correctHeading) {
          correctCount++
        }
      }

      questionScore = totalCount > 0 ? (correctCount / totalCount) * question.points : 0
      totalScore += questionScore

      detailedScores.push({
        questionId: question.id,
        questionType: 'MATCHING_HEADINGS',
        userAnswer,
        correctAnswer: correctAnswers,
        score: questionScore,
        maxScore: question.points,
        isCorrect: correctCount === totalCount
      })
    }

    // Check if submission already exists
    let submission = await prisma.submission.findFirst({
      where: {
        assignmentId: assignment.id,
        moduleId: readingModule.id
      }
    })

    if (submission) {
      // Update existing submission
      submission = await prisma.submission.update({
        where: { id: submission.id },
        data: {
          answersJson: answers,
          submittedAt: new Date(),
          autoScore: totalScore
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
          autoScore: totalScore
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
      submissionId: submission.id,
      score: totalScore,
      detailedScores: detailedScores
    })
  } catch (error) {
    console.error('Error submitting matching headings answers:', error)
    return NextResponse.json({ error: 'Failed to submit answers' }, { status: 500 })
  }
}
