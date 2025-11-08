import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Calculate date range for "today"
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Get pending grading (writing tests completed but not evaluated)
    const pendingGrading = await prisma.testSession.count({
      where: {
        testType: 'WRITING',
        isCompleted: true,
        band: null
      }
    })

    // Get in progress (writing tests started but not completed)
    const inProgress = await prisma.testSession.count({
      where: {
        testType: 'WRITING',
        isCompleted: false,
        startedAt: { not: null }
      }
    })

    // Get completed today
    const completedToday = await prisma.testSession.count({
      where: {
        testType: 'WRITING',
        isCompleted: true,
        completedAt: {
          gte: startOfToday
        }
      }
    })

    // Get total completed
    const totalCompleted = await prisma.testSession.count({
      where: {
        testType: 'WRITING',
        isCompleted: true
      }
    })

    // Get average band score
    const avgScoreResult = await prisma.testSession.aggregate({
      where: {
        testType: 'WRITING',
        isCompleted: true,
        band: { not: null }
      },
      _avg: {
        band: true
      }
    })
    const averageBand = avgScoreResult._avg.band ? Number(avgScoreResult._avg.band.toFixed(1)) : 0

    return NextResponse.json({
      pendingGrading,
      inProgress,
      completedToday,
      totalCompleted,
      averageBand
    })
  } catch (error) {
    console.error('Error fetching instructor dashboard data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

