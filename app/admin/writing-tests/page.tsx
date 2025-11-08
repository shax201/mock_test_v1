import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'
import WritingTestsClient from './WritingTestsClient'

interface WritingTest {
  id: string
  title: string
  totalTimeMinutes: number
  isActive: boolean
  createdAt: string
  readingTest?: {
    id: string
    title: string
  }
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

// Cache the writing tests query with tags for on-demand revalidation
const getCachedWritingTests = unstable_cache(
  async (): Promise<WritingTest[]> => {
    const writingTests = await prisma.writingTest.findMany({
      include: {
        readingTest: {
          select: {
            id: true,
            title: true
          }
        },
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

    return writingTests.map(test => ({
      id: test.id,
      title: test.title,
      totalTimeMinutes: test.totalTimeMinutes,
      isActive: test.isActive,
      createdAt: test.createdAt.toISOString(),
      readingTest: test.readingTest || undefined,
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
  ['writing-tests-list'],
  {
    revalidate: 60,
    tags: ['writing-tests']
  }
)

export default async function WritingTestsPage() {
  // Auth is handled by middleware

  // Fetch writing tests with caching
  let writingTests: WritingTest[] = []
  let error = ''

  try {
    writingTests = await getCachedWritingTests()
  } catch (err) {
    console.error('Error fetching writing tests:', err)
    error = 'Failed to fetch writing tests'
  }

  return <WritingTestsClient initialWritingTests={writingTests} error={error} />
}
