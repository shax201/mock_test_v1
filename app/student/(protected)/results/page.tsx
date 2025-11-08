import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'
import StudentResultsClient from './StudentResultsClient'

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
  candidateNumber: string
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
      }
    })

    const testGroups = new Map<string, {
      readingSession?: typeof sessions[0]
      writingSession?: typeof sessions[0]
      readingTest?: any
      writingTest?: any
    }>()

    for (const session of sessions) {
      const key = session.testId
      
      if (!testGroups.has(key)) {
        testGroups.set(key, {})
      }
      
      const group = testGroups.get(key)!
      
      if (session.testType === 'READING') {
        group.readingSession = session
        const readingTest = await prisma.readingTest.findUnique({
          where: { id: session.testId },
          select: { title: true }
        })
        group.readingTest = readingTest
      } else if (session.testType === 'WRITING') {
        group.writingSession = session
        const writingTest = await prisma.writingTest.findUnique({
          where: { id: session.testId },
          select: { title: true }
        })
        group.writingTest = writingTest
      }
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { email: true }
    })

    const results: TestResult[] = []
    
    for (const [testId, group] of testGroups.entries()) {
      if (group.readingSession || group.writingSession) {
        const testTitle = group.readingTest?.title || group.writingTest?.title || 'Unknown Test'
        const readingBand = group.readingSession?.band || 0
        const writingBand = group.writingSession?.band || 0
        const overallBand = readingBand > 0 && writingBand > 0
          ? (readingBand + writingBand) / 2
          : readingBand > 0 ? readingBand : writingBand
        
        results.push({
          id: group.readingSession?.id || group.writingSession?.id || testId,
          testTitle,
          overallBand,
          listeningBand: 0,
          readingBand,
          writingBand,
          speakingBand: 0,
          completedAt: group.readingSession?.completedAt?.toISOString() || 
                       group.writingSession?.completedAt?.toISOString() || 
                       new Date().toISOString(),
          status: 'COMPLETED',
          candidateNumber: student?.email?.split('@')[0] || 'N/A'
        })
      }
    }

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
