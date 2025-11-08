import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'
import CompletedSubmissionsClient from './CompletedSubmissionsClient'

interface Submission {
  id: string
  candidateNumber: string
  studentName: string
  studentEmail: string
  testTitle: string
  moduleType: string
  moduleTitle: string
  submittedAt: string
  status: 'PENDING' | 'COMPLETED'
  band: number | null
  updatedAt: string
}

// Enable ISR with time-based revalidation (revalidate every 60 seconds)
export const revalidate = 60

// Cache the completed submissions query
const getCachedCompletedSubmissions = unstable_cache(
  async (moduleType: string): Promise<Submission[]> => {
    const where: any = {
      testType: 'WRITING',
      isCompleted: true,
      band: { not: null }
    }

    const sessions = await prisma.testSession.findMany({
      where,
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
        updatedAt: 'desc'
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
          studentId: session.studentId,
          studentName: session.student.name || 'Unknown',
          studentEmail: session.student.email,
          candidateNumber: session.student.email.split('@')[0],
          testId: session.testId,
          testTitle: writingTest?.title || 'Unknown Test',
          moduleType: 'WRITING',
          moduleTitle: 'Writing Test',
          submittedAt: session.completedAt?.toISOString() || session.createdAt.toISOString(),
          status: 'COMPLETED' as const,
          band: session.band,
          updatedAt: session.updatedAt.toISOString()
        }
      })
    )

    return submissions
  },
  ['instructor-completed-submissions'],
  {
    revalidate: 60,
    tags: ['instructor-submissions']
  }
)

export default async function CompletedSubmissionsPage({
  searchParams
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  // Auth is handled by middleware

  const resolvedSearchParams = await searchParams
  const filter = resolvedSearchParams.filter || 'all'

  // Fetch submissions with caching
  let submissions: Submission[] = []
  let error = ''

  try {
    submissions = await getCachedCompletedSubmissions(filter)
  } catch (err) {
    console.error('Error fetching completed submissions:', err)
    error = 'Failed to fetch submissions'
  }

  return <CompletedSubmissionsClient initialSubmissions={submissions} error={error} />
}
