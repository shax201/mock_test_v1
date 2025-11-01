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

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') // ACTIVE, COMPLETED, EXPIRED
    const search = searchParams.get('search') // Search by test title

    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {
      studentId: decoded.userId
    }

    if (status) {
      whereClause.status = status
    }

    if (search) {
      whereClause.mock = {
        title: {
          contains: search,
          mode: 'insensitive'
        }
      }
    }

    // Get student's assignments with detailed information
    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        mock: true,
        result: true,
        submissions: {
          include: {
            module: true,
            instructorMarks: {
              include: {
                instructor: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Get total count for pagination
    const totalCount = await prisma.assignment.count({
      where: whereClause
    })

    // Format participation history data
    const participationHistory = assignments.map(assignment => {
      // Calculate test duration if completed
      let testDuration = null
      if (assignment.submissions.length > 0) {
        const firstSubmission = assignment.submissions.reduce((earliest, current) => 
          current.startedAt < earliest.startedAt ? current : earliest
        )
        const lastSubmission = assignment.submissions.reduce((latest, current) => 
          current.submittedAt && latest.submittedAt && current.submittedAt > latest.submittedAt ? current : latest
        )
        
        if (lastSubmission.submittedAt) {
          testDuration = Math.round(
            (lastSubmission.submittedAt.getTime() - firstSubmission.startedAt.getTime()) / (1000 * 60)
          ) // Duration in minutes
        }
      }

      // Get module completion status
      const moduleStatus = assignment.submissions.map(submission => ({
        module: submission.module.type,
        status: submission.submittedAt ? 'COMPLETED' : 'IN_PROGRESS',
        submittedAt: submission.submittedAt,
        autoScore: submission.autoScore,
        instructorMarked: submission.instructorMarks.length > 0
      }))

      // Calculate progress percentage
      const totalModules = 4 // Listening, Reading, Writing, Speaking
      const completedModules = moduleStatus.filter(m => m.status === 'COMPLETED').length
      const progressPercentage = Math.round((completedModules / totalModules) * 100)

      return {
        id: assignment.id,
        testTitle: assignment.mock.title,
        testDescription: assignment.mock.description,
        candidateNumber: assignment.candidateNumber,
        status: assignment.status,
        assignedAt: assignment.createdAt,
        validFrom: assignment.validFrom,
        validUntil: assignment.validUntil,
        completedAt: assignment.result?.generatedAt || null,
        testDuration,
        progressPercentage,
        moduleStatus,
        overallBand: assignment.result?.overallBand || null,
        moduleBands: {
          listening: assignment.result?.listeningBand || null,
          reading: assignment.result?.readingBand || null,
          writing: assignment.result?.writingBand || null,
          speaking: assignment.result?.speakingBand || null
        },
        hasResult: !!assignment.result,
        isExpired: new Date() > assignment.validUntil,
        canRetake: assignment.status === 'COMPLETED' && !assignment.result
      }
    })

    // Calculate summary statistics
    const allAssignments = await prisma.assignment.findMany({
      where: { studentId: decoded.userId },
      include: { result: true }
    })

    const completedTests = allAssignments.filter(a => a.status === 'COMPLETED')
    const activeTests = allAssignments.filter(a => a.status === 'ACTIVE')
    const expiredTests = allAssignments.filter(a => new Date() > a.validUntil && a.status !== 'COMPLETED')

    const summaryStats = {
      totalTests: allAssignments.length,
      completedTests: completedTests.length,
      activeTests: activeTests.length,
      expiredTests: expiredTests.length,
      averageBand: completedTests.length > 0 
        ? completedTests
            .filter(a => a.result?.overallBand)
            .reduce((sum, a) => sum + (a.result!.overallBand || 0), 0) / 
            completedTests.filter(a => a.result?.overallBand).length
        : 0,
      totalTestTime: completedTests.reduce((total, assignment) => {
        // This would need to be calculated from submissions if needed
        return total
      }, 0)
    }

    return NextResponse.json({
      participationHistory,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      },
      summaryStats,
      filters: {
        status: status || 'all',
        search: search || ''
      }
    })
  } catch (error) {
    console.error('Participation history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
