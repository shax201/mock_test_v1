import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'
import WritingTestSubmissionsClient from './WritingTestSubmissionsClient'

interface Submission {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  testId: string
  testTitle: string
  readingTestTitle: string
  answers: any
  completedAt: string | null
  score: number | null
  band: number | null
}

// Enable ISR with time-based revalidation (revalidate every 60 seconds)
export const revalidate = 60

// Cache the submissions query with tags for on-demand revalidation
const getCachedSubmissions = unstable_cache(
  async (): Promise<Submission[]> => {
    // Fetch all completed writing test sessions
    const sessions = await prisma.testSession.findMany({
      where: {
        testType: 'WRITING',
        isCompleted: true
      },
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

    // Fetch writing test details for each session
    const submissions = await Promise.all(
      sessions.map(async (session) => {
        const writingTest = await prisma.writingTest.findUnique({
          where: { id: session.testId },
          select: {
            id: true,
            title: true,
            readingTest: {
              select: {
                id: true,
                title: true
              }
            }
          }
        })

        return {
          id: session.id,
          studentId: session.studentId,
          studentName: session.student.name || 'Unknown',
          studentEmail: session.student.email,
          testId: session.testId,
          testTitle: writingTest?.title || 'Unknown Test',
          readingTestTitle: writingTest?.readingTest?.title || 'N/A',
          answers: session.answers,
          completedAt: session.completedAt?.toISOString() || null,
          score: session.score,
          band: session.band
        }
      })
    )

    return submissions
  },
  ['writing-submissions-list'],
  {
    revalidate: 60,
    tags: ['writing-submissions']
  }
)

export default async function WritingTestSubmissionsPage() {
  // Auth is handled by middleware

  // Fetch submissions with caching
  let submissions: Submission[] = []
  let error = ''

  try {
    submissions = await getCachedSubmissions()
  } catch (err) {
    console.error('Error fetching writing test submissions:', err)
    error = 'Failed to fetch submissions'
  }

  return <WritingTestSubmissionsClient initialSubmissions={submissions} error={error} />
}
