import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
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

    // Get student's assignments and results
    const assignments = await prisma.assignment.findMany({
      where: {
        studentId: decoded.userId
      },
      include: {
        mock: true,
        result: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate statistics
    const completedAssignments = assignments.filter(a => a.status === 'COMPLETED')
    const activeAssignments = assignments.filter(a => a.status === 'ACTIVE')
    const results = completedAssignments.filter(a => a.result).map(a => a.result!)

    const totalTests = completedAssignments.length
    const activeTests = activeAssignments.length
    const averageBand = results.length > 0 
      ? results.reduce((sum, r) => sum + (r.overallBand || 0), 0) / results.length 
      : 0
    const highestBand = results.length > 0 
      ? Math.max(...results.map(r => r.overallBand || 0)) 
      : 0

    // Calculate module-specific averages
    const listeningAverage = results.length > 0 
      ? results.reduce((sum, r) => sum + (r.listeningBand || 0), 0) / results.length 
      : 0
    const readingAverage = results.length > 0 
      ? results.reduce((sum, r) => sum + (r.readingBand || 0), 0) / results.length 
      : 0
    const writingAverage = results.length > 0 
      ? results.reduce((sum, r) => sum + (r.writingBand || 0), 0) / results.length 
      : 0
    const speakingAverage = results.length > 0 
      ? results.reduce((sum, r) => sum + (r.speakingBand || 0), 0) / results.length 
      : 0

    // Get recent results (last 5)
    const recentResults = results.slice(0, 5).map(result => {
      const assignment = assignments.find(a => a.result?.id === result.id)!
      return {
        id: result.id,
        testTitle: assignment.mock.title,
        overallBand: result.overallBand,
        listeningBand: result.listeningBand,
        readingBand: result.readingBand,
        writingBand: result.writingBand,
        speakingBand: result.speakingBand,
        completedAt: result.generatedAt.toISOString(),
        status: 'COMPLETED'
      }
    })

    // Get active assignments for quick access
    const activeTestList = activeAssignments.map(assignment => ({
      id: assignment.id,
      title: assignment.mock.title,
      token: assignment.tokenHash,
      validUntil: assignment.validUntil?.toISOString()
    }))

    return NextResponse.json({
      totalTests,
      activeTestsCount: activeTests,
      activeTests: activeTestList,
      averageBand,
      highestBand,
      moduleAverages: {
        listening: listeningAverage,
        reading: readingAverage,
        writing: writingAverage,
        speaking: speakingAverage
      },
      recentResults
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
