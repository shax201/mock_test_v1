import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateAllModuleScores, DetailedScoreResult } from '@/lib/scoring/detailed-scorer'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Find assignment by token
    const assignment = await prisma.assignment.findUnique({
      where: { tokenHash: token },
      include: {
        mock: true,
        student: true,
        submissions: {
          include: {
            module: true
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Calculate detailed scores for all modules
    const detailedScores = await calculateAllModuleScores(assignment.id)

    // Transform submissions to include module type and scores
    const submissions = assignment.submissions.map(submission => {
      const moduleType = submission.module.type.toLowerCase() as 'reading' | 'listening' | 'writing'
      const detailedScore = detailedScores[moduleType]

      console.log('Processing submission:', {
        id: submission.id,
        moduleType: submission.module.type,
        autoScore: submission.autoScore,
        detailedScore: detailedScore ? 'Available' : 'Not available'
      })
      
      return {
        id: submission.id,
        moduleType: submission.module.type,
        moduleName: submission.module.type.toLowerCase(),
        answersJson: submission.answersJson,
        autoScore: submission.autoScore,
        startedAt: submission.startedAt,
        submittedAt: submission.submittedAt,
        detailedScore: detailedScore || null
      }
    })

    // Calculate overall statistics
    const totalQuestions = Object.values(detailedScores).reduce((sum, score) => {
      return sum + (score?.totalQuestions || 0)
    }, 0)

    const totalCorrect = Object.values(detailedScores).reduce((sum, score) => {
      return sum + (score?.correctAnswers || 0)
    }, 0)

    const moduleBands = Object.values(detailedScores).map(score => score?.bandScore || 0).filter(band => band > 0)
    const overallBand = moduleBands.length > 0 ? moduleBands.reduce((sum, band) => sum + band, 0) / moduleBands.length : 0

    console.log('Returning submissions with detailed scores:', {
      submissionsCount: submissions.length,
      detailedScoresAvailable: Object.keys(detailedScores).length,
      overallBand: Math.round(overallBand * 10) / 10
    })

    return NextResponse.json({
      success: true,
      candidateNumber: assignment.candidateNumber,
      testTitle: assignment.mock.title,
      submissions: submissions,
      detailedScores,
      overallStats: {
        totalQuestions,
        totalCorrect,
        overallBand: Math.round(overallBand * 10) / 10,
        accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
      }
    })

  } catch (error) {
    console.error('Submission scores error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
