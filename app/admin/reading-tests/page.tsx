import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'
import ReadingTestsClient from './ReadingTestsClient'

interface ReadingTest {
  id: string
  title: string
  totalQuestions: number
  totalTimeMinutes: number
  isActive: boolean
  createdAt: string
  _count: {
    passages: number
  }
  passages: Array<{
    _count: {
      questions: number
    }
  }>
}

// Enable ISR with time-based revalidation (revalidate every 60 seconds)
export const revalidate = 60

// Cache the reading tests query with tags for on-demand revalidation
const getCachedReadingTests = unstable_cache(
  async (): Promise<ReadingTest[]> => {
    const readingTests = await prisma.readingTest.findMany({
      include: {
        passages: {
          include: {
            questions: true,
            _count: {
              select: { questions: true }
            }
          }
        },
        _count: {
          select: { passages: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return readingTests.map(test => ({
      id: test.id,
      title: test.title,
      totalQuestions: test.totalQuestions,
      totalTimeMinutes: test.totalTimeMinutes,
      isActive: test.isActive,
      createdAt: test.createdAt.toISOString(),
      _count: {
        passages: test._count.passages
      },
      passages: test.passages.map(passage => ({
        _count: {
          questions: passage._count.questions
        }
      }))
    }))
  },
  ['reading-tests-list'],
  {
    revalidate: 60,
    tags: ['reading-tests']
  }
)

export default async function ReadingTestsPage() {
  // Auth is handled by middleware

  // Fetch reading tests with caching
  let readingTests: ReadingTest[] = []
  let error = ''

  try {
    readingTests = await getCachedReadingTests()
  } catch (err) {
    console.error('Error fetching reading tests:', err)
    error = 'Failed to fetch reading tests'
  }

  return <ReadingTestsClient initialReadingTests={readingTests} error={error} />
}
