import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, hasRole } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    
    if (!payload || !hasRole(payload, UserRole.INSTRUCTOR)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const instructorId = payload.userId

    // Get pending submissions (WRITING/SPEAKING without marks)
    const pendingCount = await prisma.submission.count({
      where: {
        module: {
          type: { in: ['WRITING', 'SPEAKING'] }
        },
        submittedAt: { not: null },
        instructorMarks: { none: {} }
      }
    })

    // Get in-progress submissions (started by this instructor but not completed)
    // This is a bit tricky - we'd need to track which instructor started grading
    // For now, we'll just count pending as in-progress if needed
    
    // Get completed today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const completedToday = await prisma.instructorMark.count({
      where: {
        instructorId,
        markedAt: {
          gte: today
        }
      }
    })

    // Get total completed by this instructor
    const totalCompleted = await prisma.instructorMark.count({
      where: {
        instructorId
      }
    })

    // Get average band score for this instructor's marks
    const avgBandResult = await prisma.instructorMark.aggregate({
      where: {
        instructorId,
        overallBand: { not: null }
      },
      _avg: {
        overallBand: true
      }
    })

    return NextResponse.json({
      pendingGrading: pendingCount,
      inProgress: 0, // TODO: Track which submissions are being graded
      completedToday,
      totalCompleted,
      averageBand: avgBandResult._avg.overallBand || 0
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

