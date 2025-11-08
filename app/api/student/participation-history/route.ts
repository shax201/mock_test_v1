import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('student-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const studentId = payload.userId
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''

    const now = new Date()

    // Fetch all assignments for this student
    const assignments = await prisma.assignment.findMany({
      where: {
        studentId
      },
      include: {
        readingTest: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Process assignments with status and test sessions
    const participationHistory = await Promise.all(
      assignments.map(async (assignment) => {
        let assignmentStatus = assignment.status
        const validFrom = new Date(assignment.validFrom)
        const validUntil = new Date(assignment.validUntil)
        const isExpired = validUntil < now

        // Auto-update status based on dates
        if (validFrom > now) {
          assignmentStatus = 'PENDING'
        } else if (isExpired) {
          assignmentStatus = 'EXPIRED'
        } else if (assignmentStatus === 'PENDING' && validFrom <= now) {
          assignmentStatus = 'ACTIVE'
        }

        // Get test sessions for this assignment
        const readingSession = await prisma.testSession.findFirst({
          where: {
            studentId,
            testId: assignment.readingTestId,
            testType: 'READING',
            isCompleted: true
          },
          orderBy: { completedAt: 'desc' }
        })

        // Get listening test if exists
        const listeningTest = await prisma.listeningTest.findFirst({
          where: { readingTestId: assignment.readingTestId },
          select: { id: true }
        })

        const listeningSession = listeningTest
          ? await prisma.testSession.findFirst({
              where: {
                studentId,
                testId: listeningTest.id,
                testType: 'LISTENING',
                isCompleted: true
              },
              orderBy: { completedAt: 'desc' }
            })
          : null

        // Get writing test if exists
        const writingTest = await prisma.writingTest.findFirst({
          where: { readingTestId: assignment.readingTestId },
          select: { id: true }
        })

        const writingSession = writingTest
          ? await prisma.testSession.findFirst({
              where: {
                studentId,
                testId: writingTest.id,
                testType: 'WRITING',
                isCompleted: true
              },
              orderBy: { completedAt: 'desc' }
            })
          : null

        // Calculate progress
        const modules = [
          { module: 'READING', session: readingSession },
          { module: 'LISTENING', session: listeningSession },
          { module: 'WRITING', session: writingSession },
          { module: 'SPEAKING', session: null }
        ]

        const completedModules = modules.filter(m => m.session && m.session.isCompleted).length
        const progressPercentage = (completedModules / 4) * 100

        // Calculate overall band (average of completed modules)
        const bands = modules
          .filter(m => m.session && m.session.band !== null)
          .map(m => m.session!.band!)
        
        const overallBand = bands.length > 0
          ? bands.reduce((sum, band) => sum + band, 0) / bands.length
          : null

        // Module status
        const moduleStatus = modules.map(({ module, session }) => ({
          module,
          status: session && session.isCompleted
            ? (session.band !== null ? 'COMPLETED' : 'PENDING')
            : 'NOT_STARTED',
          submittedAt: session?.completedAt?.toISOString() || null,
          autoScore: session?.band || null,
          instructorMarked: session?.testType === 'WRITING' && session.band !== null
        }))

        // Module bands
        const moduleBands = {
          listening: listeningSession?.band || null,
          reading: readingSession?.band || null,
          writing: writingSession?.band || null,
          speaking: null
        }

        // Determine if all modules are completed
        const allCompleted = modules.every(m => m.session && m.session.isCompleted)
        if (allCompleted && overallBand !== null) {
          assignmentStatus = 'COMPLETED'
        }

        // Calculate test duration (sum of all session durations if available)
        const testDuration = null // Can be calculated if duration is stored

        // Get student email for candidate number
        const student = await prisma.user.findUnique({
          where: { id: studentId },
          select: { email: true }
        })

        return {
          id: assignment.id,
          testTitle: assignment.readingTest.title,
          testDescription: '',
          candidateNumber: student?.email?.split('@')[0] || 'N/A',
          status: assignmentStatus,
          assignedAt: assignment.createdAt.toISOString(),
          validFrom: assignment.validFrom.toISOString(),
          validUntil: assignment.validUntil.toISOString(),
          completedAt: allCompleted && readingSession?.completedAt
            ? readingSession.completedAt.toISOString()
            : null,
          testDuration,
          progressPercentage,
          moduleStatus,
          overallBand,
          moduleBands,
          hasResult: allCompleted && overallBand !== null,
          isExpired,
          canRetake: false
        }
      })
    )

    // Apply filters
    let filteredHistory = participationHistory

    if (status !== 'all') {
      filteredHistory = filteredHistory.filter(item => item.status === status)
    }

    if (search) {
      filteredHistory = filteredHistory.filter(item =>
        item.testTitle.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Calculate summary stats
    const summaryStats = {
      totalTests: participationHistory.length,
      completedTests: participationHistory.filter(item => item.status === 'COMPLETED').length,
      activeTests: participationHistory.filter(item => item.status === 'ACTIVE').length,
      expiredTests: participationHistory.filter(item => item.isExpired).length,
      averageBand: participationHistory
        .filter(item => item.overallBand !== null)
        .reduce((sum, item) => sum + (item.overallBand || 0), 0) /
        Math.max(1, participationHistory.filter(item => item.overallBand !== null).length),
      totalTestTime: 0 // Can be calculated if duration is stored
    }

    // Pagination
    const total = filteredHistory.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const paginatedHistory = filteredHistory.slice(startIndex, startIndex + limit)

    return NextResponse.json({
      participationHistory: paginatedHistory,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      summaryStats
    })
  } catch (error) {
    console.error('Error fetching participation history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

