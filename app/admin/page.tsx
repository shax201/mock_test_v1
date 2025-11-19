import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'
import AdminDashboardClient from './AdminDashboardClient'

interface DashboardStats {
  pendingSubmissions: number
  totalStudents: number
  completedTests: number
  averageScore: number
  thisWeekTests: number
}

interface RecentActivity {
  id: string
  type: 'test_completed' | 'test_assigned' | 'test_created'
  description: string
  timestamp: string
  studentName?: string
  testName?: string
}

// Enable ISR with time-based revalidation (revalidate every 60 seconds)
export const revalidate = 60

// Cache the dashboard data query with tags for on-demand revalidation
const getCachedDashboardData = unstable_cache(
  async (): Promise<{ stats: DashboardStats; recentActivity: RecentActivity[] }> => {
    // Calculate date range for "this week" (last 7 days)
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get total students
    const totalStudents = await prisma.user.count({
      where: { role: 'STUDENT' }
    })

    // Get pending writing submissions (writing test sessions that are completed but don't have a band score)
    const pendingSubmissions = await prisma.testSession.count({
      where: {
        testType: 'WRITING',
        isCompleted: true,
        band: null
      }
    })

    // Get completed tests
    const completedTests = await prisma.testSession.count({
      where: {
        isCompleted: true
      }
    })

    // Get average score (band score)
    const avgScoreResult = await prisma.testSession.aggregate({
      where: {
        isCompleted: true,
        band: { not: null }
      },
      _avg: {
        band: true
      }
    })
    const averageScore = avgScoreResult._avg.band ? Number(avgScoreResult._avg.band.toFixed(1)) : 0

    // Get assignments created this week
    const thisWeekTests = await prisma.assignment.count({
      where: {
        createdAt: {
          gte: oneWeekAgo
        }
      }
    })

    // Get recent activity from multiple sources
    const recentAssignments = await prisma.assignment.findMany({
      take: 3,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        student: {
          select: {
            name: true,
            email: true
          }
        },
        readingTest: {
          select: {
            title: true
          }
        }
      }
    })

    const recentTestSessions = await prisma.testSession.findMany({
      take: 3,
      where: {
        isCompleted: true
      },
      orderBy: {
        completedAt: 'desc'
      },
      include: {
        student: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Get recently created tests
    const recentReadingTests = await prisma.readingTest.findMany({
      take: 2,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        createdAt: true
      }
    })

    const recentWritingTests = await prisma.writingTest.findMany({
      take: 2,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        createdAt: true
      }
    })

    const recentListeningTests = await prisma.listeningTest.findMany({
      take: 2,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        createdAt: true
      }
    })

    const recentItemWiseTests = await prisma.itemWiseTest.findMany({
      take: 2,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        createdAt: true
      }
    })

    // Combine and format recent activity
    const activities: any[] = []

    // Add recent assignments
    recentAssignments.forEach((assignment) => {
      activities.push({
        id: assignment.id,
        type: 'test_assigned',
        description: 'Reading test assigned',
        timestamp: assignment.createdAt.toISOString(),
        studentName: assignment.student.name || assignment.student.email,
        testName: assignment.readingTest.title
      })
    })

    // Add recent completed tests
    recentTestSessions.forEach((session) => {
      activities.push({
        id: session.id,
        type: 'test_completed',
        description: 'Test completed',
        timestamp: session.completedAt?.toISOString() || session.createdAt.toISOString(),
        studentName: session.student.name || session.student.email,
        testName: `${session.testType} Test`
      })
    })

    // Add recently created tests
    recentReadingTests.forEach((test) => {
      activities.push({
        id: test.id,
        type: 'test_created',
        description: 'New reading test created',
        timestamp: test.createdAt.toISOString(),
        testName: test.title
      })
    })

    recentWritingTests.forEach((test) => {
      activities.push({
        id: test.id,
        type: 'test_created',
        description: 'New writing test created',
        timestamp: test.createdAt.toISOString(),
        testName: test.title
      })
    })

    recentListeningTests.forEach((test) => {
      activities.push({
        id: test.id,
        type: 'test_created',
        description: 'New listening test created',
        timestamp: test.createdAt.toISOString(),
        testName: test.title
      })
    })

    recentItemWiseTests.forEach((test) => {
      activities.push({
        id: test.id,
        type: 'test_created',
        description: 'New item-wise test created',
        timestamp: test.createdAt.toISOString(),
        testName: test.title
      })
    })

    // Sort by timestamp and take the 4 most recent
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const recentActivity = activities.slice(0, 4).map((activity) => {
      const timestamp = new Date(activity.timestamp)
      const now = new Date()
      const diffMs = now.getTime() - timestamp.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      let timeAgo = ''
      if (diffMins < 60) {
        timeAgo = `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
      } else {
        timeAgo = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
      }

      return {
        ...activity,
        timestamp: timeAgo
      }
    })

    return {
      stats: {
        pendingSubmissions,
        totalStudents,
        completedTests,
        averageScore,
        thisWeekTests
      },
      recentActivity
    }
  },
  ['admin-dashboard'],
  {
    revalidate: 60,
    tags: ['admin-dashboard', 'assignments', 'students', 'writing-submissions', 'reading-tests', 'listening-tests', 'writing-tests', 'item-wise-tests']
  }
)

export default async function AdminDashboard() {
  // Auth is handled by middleware, but we can still get user info if needed
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const payload = token ? await verifyJWT(token) : null

  // Fetch dashboard data with caching
  let stats: DashboardStats = {
    pendingSubmissions: 0,
    totalStudents: 0,
    completedTests: 0,
    averageScore: 0,
    thisWeekTests: 0
  }
  let recentActivity: RecentActivity[] = []
  let error = ''

  try {
    const data = await getCachedDashboardData()
    stats = data.stats
    recentActivity = data.recentActivity
  } catch (err) {
    console.error('Error fetching dashboard data:', err)
    error = 'Failed to fetch dashboard data'
  }

  return <AdminDashboardClient initialStats={stats} initialRecentActivity={recentActivity} error={error} />
}
