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
    const now = new Date()

    // Get active assignments (ACTIVE status)
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

    // Filter active assignments
    const activeTests = assignments
      .filter(assignment => {
        const validFrom = new Date(assignment.validFrom)
        const validUntil = new Date(assignment.validUntil)
        return validFrom <= now && validUntil >= now && assignment.status !== 'COMPLETED'
      })
      .map(assignment => ({
        id: assignment.id,
        title: assignment.readingTest.title,
        token: assignment.accessToken,
        validUntil: assignment.validUntil.toISOString()
      }))

    // Get completed test sessions
    const completedSessions = await prisma.testSession.findMany({
      where: {
        studentId,
        isCompleted: true
      },
      include: {
        student: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    // Calculate statistics
    const totalTests = completedSessions.length
    const activeTestsCount = activeTests.length

    // Calculate average and highest band scores
    const sessionsWithBands = completedSessions.filter(s => s.band !== null)
    const averageBand = sessionsWithBands.length > 0
      ? sessionsWithBands.reduce((sum, s) => sum + (s.band || 0), 0) / sessionsWithBands.length
      : 0
    const highestBand = sessionsWithBands.length > 0
      ? Math.max(...sessionsWithBands.map(s => s.band || 0))
      : 0

    // Calculate module averages
    const listeningSessions = completedSessions.filter(s => s.testType === 'LISTENING' && s.band !== null)
    const readingSessions = completedSessions.filter(s => s.testType === 'READING' && s.band !== null)
    const writingSessions = completedSessions.filter(s => s.testType === 'WRITING' && s.band !== null)
    const speakingSessions = completedSessions.filter(s => s.testType === 'SPEAKING' && s.band !== null)

    const moduleAverages = {
      listening: listeningSessions.length > 0
        ? listeningSessions.reduce((sum, s) => sum + (s.band || 0), 0) / listeningSessions.length
        : 0,
      reading: readingSessions.length > 0
        ? readingSessions.reduce((sum, s) => sum + (s.band || 0), 0) / readingSessions.length
        : 0,
      writing: writingSessions.length > 0
        ? writingSessions.reduce((sum, s) => sum + (s.band || 0), 0) / writingSessions.length
        : 0,
      speaking: speakingSessions.length > 0
        ? speakingSessions.reduce((sum, s) => sum + (s.band || 0), 0) / speakingSessions.length
        : 0
    }

    // Get recent results (last 5 completed sessions)
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { email: true }
    })

    const recentResults = await Promise.all(
      completedSessions.slice(0, 5).map(async (session) => {
        let testTitle = `${session.testType} Test`
        
        if (session.testType === 'READING') {
          const readingTest = await prisma.readingTest.findUnique({
            where: { id: session.testId },
            select: { title: true }
          })
          testTitle = readingTest?.title || testTitle
        } else if (session.testType === 'WRITING') {
          const writingTest = await prisma.writingTest.findUnique({
            where: { id: session.testId },
            select: { title: true }
          })
          testTitle = writingTest?.title || testTitle
        } else if (session.testType === 'LISTENING') {
          const listeningTest = await prisma.listeningTest.findUnique({
            where: { id: session.testId },
            select: { title: true }
          })
          testTitle = listeningTest?.title || testTitle
        }

        return {
          id: session.id,
          testTitle,
          overallBand: session.band || 0,
          listeningBand: session.testType === 'LISTENING' ? (session.band || 0) : 0,
          readingBand: session.testType === 'READING' ? (session.band || 0) : 0,
          writingBand: session.testType === 'WRITING' ? (session.band || 0) : 0,
          speakingBand: session.testType === 'SPEAKING' ? (session.band || 0) : 0,
          completedAt: session.completedAt?.toISOString() || session.createdAt.toISOString(),
          status: 'COMPLETED',
          candidateNumber: student?.email?.split('@')[0] || 'N/A'
        }
      })
    )

    return NextResponse.json({
      totalTests,
      activeTestsCount,
      averageBand,
      highestBand,
      moduleAverages,
      recentResults,
      activeTests
    })
  } catch (error) {
    console.error('Error fetching student dashboard data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

