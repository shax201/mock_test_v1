import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'
import PendingSubmissionsClient from './PendingSubmissionsClient'

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
}

// Enable ISR with time-based revalidation (revalidate every 60 seconds)
export const revalidate = 60

// Cache the pending submissions query
const getCachedPendingSubmissions = unstable_cache(
  async (moduleType: string): Promise<Submission[]> => {
    const where: any = {
      testType: 'WRITING',
      isCompleted: true,
      band: null
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
        completedAt: 'desc'
      }
    })

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
          candidateNumber: session.student.email.split('@')[0],
          testId: session.testId,
          testTitle: writingTest?.title || 'Unknown Test',
          readingTestTitle: writingTest?.readingTest?.title || 'N/A',
          moduleType: 'WRITING',
          moduleTitle: 'Writing Test',
          submittedAt: session.completedAt?.toISOString() || session.createdAt.toISOString(),
          status: 'PENDING' as const
        }
      })
    )

    return submissions
  },
  ['instructor-pending-submissions'],
  {
    revalidate: 60,
    tags: ['instructor-submissions']
  }
)

export default async function PendingSubmissionsPage({
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
    submissions = await getCachedPendingSubmissions(filter)
  } catch (err) {
    console.error('Error fetching pending submissions:', err)
    error = 'Failed to fetch submissions'
  }

  return <PendingSubmissionsClient initialSubmissions={submissions} error={error} />
}
