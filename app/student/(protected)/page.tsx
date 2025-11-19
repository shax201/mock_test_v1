import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'
import StudentDashboardClient from './StudentDashboardClient'

interface TestResult {
  id: string
  testTitle: string
  overallBand: number
  listeningBand: number
  readingBand: number
  writingBand: number
  speakingBand: number
  completedAt: string
  status: string
}

interface ParticipationHistoryItem {
  id: string
  testTitle: string
  testDescription: string
  candidateNumber: string
  status: string
  assignedAt: string
  validFrom: string
  validUntil: string
  completedAt: string | null
  testDuration: number | null
  progressPercentage: number
  moduleStatus: Array<{
    module: string
    status: string
    submittedAt: string | null
    autoScore: number | null
    instructorMarked: boolean
  }>
  overallBand: number | null
  moduleBands: {
    listening: number | null
    reading: number | null
    writing: number | null
    speaking: number | null
  }
  hasResult: boolean
  isExpired: boolean
  canRetake: boolean
}

interface DashboardStats {
  totalTests: number
  activeTestsCount: number
  averageBand: number
  highestBand: number
  moduleAverages: {
    listening: number
    reading: number
    writing: number
    speaking: number
  }
  recentResults: TestResult[]
  activeTests: Array<{
    id: string
    title: string
    token: string
    validUntil: string
  }>
}

interface SummaryStats {
  totalTests: number
  completedTests: number
  activeTests: number
  expiredTests: number
  averageBand: number
  totalTestTime: number
}

interface ItemWiseTestCard {
  id: string
  title: string
  moduleType: 'READING' | 'LISTENING' | 'WRITING'
  questionType: string
  totalTests: number
  attemptedTests: number
  tests: Array<{
    id: string
    title: string
    type: 'READING' | 'LISTENING' | 'WRITING'
    duration?: number | null
    attempted: boolean
    attemptedAt?: string | null
    sessionId?: string
  }>
}

// Enable ISR with time-based revalidation (revalidate every 60 seconds)
export const revalidate = 60

// Cache the dashboard stats query
const getCachedDashboardStats = unstable_cache(
  async (studentId: string): Promise<DashboardStats> => {
    const now = new Date()

    // Get active assignments
    const assignments = await prisma.assignment.findMany({
      where: { studentId },
      include: {
        readingTest: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

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
      orderBy: {
        completedAt: 'desc'
      }
    })

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { email: true }
    })

    const totalTests = completedSessions.length
    const activeTestsCount = activeTests.length

    const sessionsWithBands = completedSessions.filter(s => s.band !== null)
    const averageBand = sessionsWithBands.length > 0
      ? sessionsWithBands.reduce((sum, s) => sum + (s.band || 0), 0) / sessionsWithBands.length
      : 0
    const highestBand = sessionsWithBands.length > 0
      ? Math.max(...sessionsWithBands.map(s => s.band || 0))
      : 0

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

    return {
      totalTests,
      activeTestsCount,
      averageBand,
      highestBand,
      moduleAverages,
      recentResults,
      activeTests
    }
  },
  ['student-dashboard-stats'],
  {
    revalidate: 60,
    tags: ['student-dashboard', 'student-results', 'student-assignments']
  }
)

// Cache the participation history query
const getCachedParticipationHistory = unstable_cache(
  async (studentId: string, limit: number = 5): Promise<{ participationHistory: ParticipationHistoryItem[], summaryStats: SummaryStats }> => {
    const now = new Date()

    const assignments = await prisma.assignment.findMany({
      where: { studentId },
      include: {
        readingTest: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { email: true }
    })

    const participationHistory = await Promise.all(
      assignments.map(async (assignment) => {
        let assignmentStatus = assignment.status
        const validFrom = new Date(assignment.validFrom)
        const validUntil = new Date(assignment.validUntil)
        const isExpired = validUntil < now

        if (validFrom > now) {
          assignmentStatus = 'PENDING'
        } else if (isExpired) {
          assignmentStatus = 'EXPIRED'
        } else if (assignmentStatus === 'PENDING' && validFrom <= now) {
          assignmentStatus = 'ACTIVE'
        }

        const readingSession = await prisma.testSession.findFirst({
          where: {
            studentId,
            testId: assignment.readingTestId,
            testType: 'READING',
            isCompleted: true
          },
          orderBy: { completedAt: 'desc' }
        })

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

        const modules = [
          { module: 'READING', session: readingSession },
          { module: 'LISTENING', session: listeningSession },
          { module: 'WRITING', session: writingSession },
          { module: 'SPEAKING', session: null }
        ]

        const completedModules = modules.filter(m => m.session && m.session.isCompleted).length
        const progressPercentage = (completedModules / 4) * 100

        const bands = modules
          .filter(m => m.session && m.session.band !== null)
          .map(m => m.session!.band!)
        
        const overallBand = bands.length > 0
          ? bands.reduce((sum, band) => sum + band, 0) / bands.length
          : null

        const moduleStatus = modules.map(({ module, session }) => ({
          module,
          status: session && session.isCompleted
            ? (session.band !== null ? 'COMPLETED' : 'PENDING')
            : 'NOT_STARTED',
          submittedAt: session?.completedAt?.toISOString() || null,
          autoScore: session?.band || null,
          instructorMarked: session?.testType === 'WRITING' && session.band !== null
        }))

        const moduleBands = {
          listening: listeningSession?.band || null,
          reading: readingSession?.band || null,
          writing: writingSession?.band || null,
          speaking: null
        }

        const allCompleted = modules.every(m => m.session && m.session.isCompleted)
        if (allCompleted && overallBand !== null) {
          assignmentStatus = 'COMPLETED'
        }

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
          testDuration: null,
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

    const summaryStats = {
      totalTests: participationHistory.length,
      completedTests: participationHistory.filter(item => item.status === 'COMPLETED').length,
      activeTests: participationHistory.filter(item => item.status === 'ACTIVE').length,
      expiredTests: participationHistory.filter(item => item.isExpired).length,
      averageBand: participationHistory
        .filter(item => item.overallBand !== null)
        .reduce((sum, item) => sum + (item.overallBand || 0), 0) /
        Math.max(1, participationHistory.filter(item => item.overallBand !== null).length),
      totalTestTime: 0
    }

    return {
      participationHistory: participationHistory.slice(0, limit),
      summaryStats
    }
  },
  ['student-participation-history'],
  {
    revalidate: 60,
    tags: ['student-dashboard', 'student-results', 'student-assignments']
  }
)

export default async function StudentDashboard() {
  // Auth is handled by middleware, get userId from token
  const cookieStore = await cookies()
  const token = cookieStore.get('student-token')?.value
  const payload = token ? await verifyJWT(token) : null
  const studentId = payload?.userId || ''

  if (!studentId) {
    // This shouldn't happen if middleware is working, but handle gracefully
    return <StudentDashboardClient initialStats={null} initialParticipationHistory={[]} initialSummaryStats={null} error="Authentication error" />
  }

  // Fetch dashboard data with caching
  let stats: DashboardStats = {
    totalTests: 0,
    activeTestsCount: 0,
    averageBand: 0,
    highestBand: 0,
    moduleAverages: {
      listening: 0,
      reading: 0,
      writing: 0,
      speaking: 0
    },
    recentResults: [],
    activeTests: []
  }
  let participationHistory: ParticipationHistoryItem[] = []
  let summaryStats: SummaryStats = {
    totalTests: 0,
    completedTests: 0,
    activeTests: 0,
    expiredTests: 0,
    averageBand: 0,
    totalTestTime: 0
  }
  let itemWiseTests: ItemWiseTestCard[] = []
  let error = ''

  try {
    const [dashboardData, historyData] = await Promise.all([
      getCachedDashboardStats(studentId),
      getCachedParticipationHistory(studentId, 5)
    ])
    stats = dashboardData
    participationHistory = historyData.participationHistory
    summaryStats = historyData.summaryStats

    const rawItemWise = await prisma.itemWiseTest.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    const readingIds = Array.from(new Set(rawItemWise.flatMap(test => test.readingTestIds || [])))
    const listeningIds = Array.from(new Set(rawItemWise.flatMap(test => test.listeningTestIds || [])))
    const writingIds = Array.from(new Set(rawItemWise.flatMap(test => test.writingTestIds || [])))
    const relevantTestIds = Array.from(new Set([...readingIds, ...listeningIds, ...writingIds]))

    const [readingTests, listeningTests, writingTests, sessions] = await Promise.all([
      readingIds.length
        ? prisma.readingTest.findMany({
            where: { id: { in: readingIds } },
            select: { id: true, title: true, totalTimeMinutes: true }
          })
        : Promise.resolve([]),
      listeningIds.length
        ? prisma.listeningTest.findMany({
            where: { id: { in: listeningIds } },
            select: { id: true, title: true, totalTimeMinutes: true }
          })
        : Promise.resolve([]),
      writingIds.length
        ? prisma.writingTest.findMany({
            where: { id: { in: writingIds } },
            select: { id: true, title: true, totalTimeMinutes: true }
          })
        : Promise.resolve([]),
      relevantTestIds.length
        ? prisma.testSession.findMany({
            where: {
              studentId,
              testId: { in: relevantTestIds }
            },
            orderBy: { completedAt: 'desc' }
          })
        : Promise.resolve([])
    ])

    const readingMap = new Map(readingTests.map(test => [test.id, test]))
    const listeningMap = new Map(listeningTests.map(test => [test.id, test]))
    const writingMap = new Map(writingTests.map(test => [test.id, test]))
    const sessionMap = new Map<string, (typeof sessions)[number]>()
    sessions.forEach(session => {
      const specificKey = `${session.itemWiseTestId || 'global'}:${session.testId}`
      if (!sessionMap.has(specificKey)) {
        sessionMap.set(specificKey, session)
      }
      const globalKey = `global:${session.testId}`
      if (!session.itemWiseTestId && !sessionMap.has(globalKey)) {
        sessionMap.set(globalKey, session)
      }
    })

    const getSessionForTest = (bundleId: string, testId: string) => {
      return sessionMap.get(`${bundleId}:${testId}`) || sessionMap.get(`global:${testId}`)
    }

    itemWiseTests = rawItemWise
      .map(bundle => {
        const tests: ItemWiseTestCard['tests'] = []

        ;(bundle.readingTestIds || []).forEach(id => {
          const reading = readingMap.get(id)
          if (!reading) return
          const session = getSessionForTest(bundle.id, id)
          tests.push({
            id,
            title: reading.title,
            type: 'READING',
            duration: reading.totalTimeMinutes,
            attempted: Boolean(session?.isCompleted),
            attemptedAt: session?.completedAt?.toISOString() || null,
            sessionId: session?.id
          })
        })

        ;(bundle.listeningTestIds || []).forEach(id => {
          const listening = listeningMap.get(id)
          if (!listening) return
          const session = getSessionForTest(bundle.id, id)
          tests.push({
            id,
            title: listening.title,
            type: 'LISTENING',
            duration: listening.totalTimeMinutes,
            attempted: Boolean(session?.isCompleted),
            attemptedAt: session?.completedAt?.toISOString() || null,
            sessionId: session?.id
          })
        })

        ;(bundle.writingTestIds || []).forEach(id => {
          const writing = writingMap.get(id)
          if (!writing) return
          const session = getSessionForTest(bundle.id, id)
          tests.push({
            id,
            title: writing.title,
            type: 'WRITING',
            duration: writing.totalTimeMinutes,
            attempted: Boolean(session?.isCompleted),
            attemptedAt: session?.completedAt?.toISOString() || null,
            sessionId: session?.id
          })
        })

        if (!tests.length) return null

        return {
          id: bundle.id,
          title: bundle.title,
          moduleType: bundle.moduleType,
          questionType: bundle.questionType.replace(/_/g, ' '),
          totalTests: tests.length,
          attemptedTests: tests.filter(test => test.attempted).length,
          tests
        }
      })
      .filter((bundle): bundle is ItemWiseTestCard => Boolean(bundle))
  } catch (err) {
    console.error('Error fetching student dashboard data:', err)
    error = 'Failed to fetch dashboard data'
  }

  return (
    <StudentDashboardClient
      initialStats={stats}
      initialParticipationHistory={participationHistory}
      initialSummaryStats={summaryStats}
      itemWiseTests={itemWiseTests}
      error={error}
    />
  )
}
