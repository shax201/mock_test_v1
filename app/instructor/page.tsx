import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'
import InstructorDashboardClient from './InstructorDashboardClient'

interface DashboardStats {
  pendingGrading: number
  inProgress: number
  completedToday: number
  totalCompleted: number
  averageBand: number
}

interface RecentSubmission {
  id: string
  candidateNumber: string
  studentName: string
  testTitle: string
  moduleType: string
  submittedAt: string
  status: 'PENDING' | 'COMPLETED'
}

// Enable ISR with time-based revalidation (revalidate every 60 seconds)
export const revalidate = 60

// Cache the dashboard stats query
const getCachedDashboardStats = unstable_cache(
  async (): Promise<DashboardStats> => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const pendingGrading = await prisma.testSession.count({
      where: {
        testType: 'WRITING',
        isCompleted: true,
        band: null
      }
    })

    const inProgress = await prisma.testSession.count({
      where: {
        testType: 'WRITING',
        isCompleted: false,
        startedAt: { not: null }
      }
    })

    const completedToday = await prisma.testSession.count({
      where: {
        testType: 'WRITING',
        isCompleted: true,
        completedAt: {
          gte: startOfToday
        }
      }
    })

    const totalCompleted = await prisma.testSession.count({
      where: {
        testType: 'WRITING',
        isCompleted: true
      }
    })

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

    return {
      pendingGrading,
      inProgress,
      completedToday,
      totalCompleted,
      averageBand
    }
  },
  ['instructor-dashboard-stats'],
  {
    revalidate: 60,
    tags: ['instructor-dashboard', 'instructor-submissions']
  }
)

// Cache the recent pending submissions query
const getCachedRecentSubmissions = unstable_cache(
  async (): Promise<RecentSubmission[]> => {
    const sessions = await prisma.testSession.findMany({
      where: {
        testType: 'WRITING',
        isCompleted: true,
        band: null
      },
      take: 5,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    const submissions = await Promise.all(
      sessions.map(async (session) => {
        const writingTest = await prisma.writingTest.findUnique({
          where: { id: session.testId },
          select: {
            id: true,
            title: true
          }
        })

        return {
          id: session.id,
          candidateNumber: session.student.email.split('@')[0],
          studentName: session.student.name || 'Unknown',
          testTitle: writingTest?.title || 'Unknown Test',
          moduleType: 'WRITING',
          submittedAt: session.completedAt?.toISOString() || session.createdAt.toISOString(),
          status: 'PENDING' as const
        }
      })
    )

    return submissions
  },
  ['instructor-recent-submissions'],
  {
    revalidate: 60,
    tags: ['instructor-dashboard', 'instructor-submissions']
  }
)

export default async function InstructorDashboard() {
  // Auth is handled by middleware, but we can still get user info if needed
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const payload = token ? await verifyJWT(token) : null

  // Fetch dashboard data with caching
  let stats: DashboardStats = {
    pendingGrading: 0,
    inProgress: 0,
    completedToday: 0,
    totalCompleted: 0,
    averageBand: 0
  }
  let recentSubmissions: RecentSubmission[] = []
  let error = ''

    try {
    const [statsData, submissionsData] = await Promise.all([
      getCachedDashboardStats(),
      getCachedRecentSubmissions()
    ])
    stats = statsData
    recentSubmissions = submissionsData
  } catch (err) {
    console.error('Error fetching instructor dashboard data:', err)
    error = 'Failed to fetch dashboard data'
  }

  return <InstructorDashboardClient initialStats={stats} initialRecentSubmissions={recentSubmissions} error={error} />
}
