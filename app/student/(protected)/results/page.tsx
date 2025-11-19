import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'
import StudentResultsClient from './StudentResultsClient'

type ModuleBandType = 'LISTENING' | 'READING' | 'WRITING'

interface ModuleResult {
  type: ModuleBandType
  title: string
  band: number
  completedAt: string | null
}

interface TestResult {
  id: string
  itemWiseTestId?: string | null
  testTitle: string
  overallBand: number
  listeningBand: number
  readingBand: number
  writingBand: number
  speakingBand: number
  completedAt: string
  status: string
  candidateNumber: string
  modules: ModuleResult[]
}

// Enable ISR with time-based revalidation (revalidate every 60 seconds)
export const revalidate = 60

// Cache the results query
const getCachedResults = unstable_cache(
  async (studentId: string): Promise<TestResult[]> => {
    const sessions = await prisma.testSession.findMany({
      where: {
        studentId,
        isCompleted: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        itemWiseTest: {
          select: {
            id: true,
            title: true,
            moduleType: true
          }
        }
      }
    })

    type SessionRecord = (typeof sessions)[number]
    const testGroups = new Map<string, {
      itemWiseTest?: { id: string; title: string; moduleType: string }
      readingSession?: SessionRecord
      listeningSession?: SessionRecord
      writingSession?: SessionRecord
      readingTest?: { title: string }
      listeningTest?: { title: string }
      writingTest?: { title: string }
    }>()

    const readingInfoCache = new Map<string, { title: string }>()
    const listeningInfoCache = new Map<string, { title: string }>()
    const writingInfoCache = new Map<string, { title: string }>()

    for (const session of sessions) {
      const key = session.itemWiseTestId || session.testId
      
      if (!testGroups.has(key)) {
        testGroups.set(key, {})
      }
      
      const group = testGroups.get(key)!
      if (session.itemWiseTest && !group.itemWiseTest) {
        group.itemWiseTest = session.itemWiseTest
      }
      
      if (session.testType === 'READING') {
        group.readingSession = session
        if (!group.readingTest) {
          if (!readingInfoCache.has(session.testId)) {
        const readingTest = await prisma.readingTest.findUnique({
          where: { id: session.testId },
          select: { title: true }
        })
            if (readingTest) readingInfoCache.set(session.testId, readingTest)
          }
          group.readingTest = readingInfoCache.get(session.testId)
        }
      } else if (session.testType === 'LISTENING') {
        group.listeningSession = session
        if (!group.listeningTest) {
          if (!listeningInfoCache.has(session.testId)) {
            const listeningTest = await prisma.listeningTest.findUnique({
              where: { id: session.testId },
              select: { title: true }
            })
            if (listeningTest) listeningInfoCache.set(session.testId, listeningTest)
          }
          group.listeningTest = listeningInfoCache.get(session.testId)
        }
      } else if (session.testType === 'WRITING') {
        group.writingSession = session
        if (!group.writingTest) {
          if (!writingInfoCache.has(session.testId)) {
        const writingTest = await prisma.writingTest.findUnique({
          where: { id: session.testId },
          select: { title: true }
        })
            if (writingTest) writingInfoCache.set(session.testId, writingTest)
          }
          group.writingTest = writingInfoCache.get(session.testId)
        }
      }
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { email: true }
    })

    const results: TestResult[] = []
    
    for (const [key, group] of testGroups.entries()) {
      if (group.readingSession || group.listeningSession || group.writingSession) {
        const testTitle =
          group.itemWiseTest?.title ||
          group.readingTest?.title ||
          group.listeningTest?.title ||
          group.writingTest?.title ||
          'Unknown Test'

        const listeningBand = group.listeningSession?.band || 0
        const readingBand = group.readingSession?.band || 0
        const writingBand = group.writingSession?.band || 0
        const bandValues = [listeningBand, readingBand, writingBand].filter(b => b > 0)
        const overallBand = bandValues.length
          ? bandValues.reduce((sum, val) => sum + val, 0) / bandValues.length
          : 0

        const modules: ModuleResult[] = []
        if (group.listeningSession) {
          modules.push({
            type: 'LISTENING',
            title: group.listeningTest?.title || 'Listening',
            band: listeningBand,
            completedAt: group.listeningSession.completedAt?.toISOString() || null
          })
        }
        if (group.readingSession) {
          modules.push({
            type: 'READING',
            title: group.readingTest?.title || 'Reading',
            band: readingBand,
            completedAt: group.readingSession.completedAt?.toISOString() || null
          })
        }
        if (group.writingSession) {
          modules.push({
            type: 'WRITING',
            title: group.writingTest?.title || 'Writing',
            band: writingBand,
            completedAt: group.writingSession.completedAt?.toISOString() || null
          })
        }

        const completedDates = [
          group.listeningSession?.completedAt,
          group.readingSession?.completedAt,
          group.writingSession?.completedAt
        ].filter(Boolean) as Date[]
        completedDates.sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))
        const completedAtIso = (completedDates[0] || new Date()).toISOString()
        
        results.push({
          id: group.readingSession?.id || group.listeningSession?.id || group.writingSession?.id || key,
          itemWiseTestId: group.itemWiseTest?.id || null,
          testTitle,
          overallBand,
          listeningBand,
          readingBand,
          writingBand,
          speakingBand: 0,
          completedAt: completedAtIso,
          status: 'COMPLETED',
          candidateNumber: student?.email?.split('@')[0] || 'N/A',
          modules
        })
      }
    }

    results.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())

    return results
  },
  ['student-results'],
  {
    revalidate: 60,
    tags: ['student-results']
  }
)

export default async function StudentResults() {
  // Auth is handled by middleware, get userId from token
  const cookieStore = await cookies()
  const token = cookieStore.get('student-token')?.value
  const payload = token ? await verifyJWT(token) : null
  const studentId = payload?.userId || ''

  if (!studentId) {
    // This shouldn't happen if middleware is working, but handle gracefully
    return <StudentResultsClient initialResults={[]} error="Authentication error" />
  }

  // Fetch results with caching
  let results: TestResult[] = []
  let error = ''

  try {
    results = await getCachedResults(studentId)
  } catch (err) {
    console.error('Error fetching student results:', err)
    error = 'Failed to fetch results'
  }

  return <StudentResultsClient initialResults={results} error={error} />
}
