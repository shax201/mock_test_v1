import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'
import ListeningTestsClient from './ListeningTestsClient'

interface ListeningTest {
  id: string
  title: string
  audioSource: string
  isActive: boolean
  createdAt: string
  readingTest?: {
    id: string
    title: string
  } | null
  _count: {
    parts: number
  }
  parts: Array<{
    _count: {
      questions: number
    }
  }>
}

// Enable ISR with time-based revalidation (revalidate every 60 seconds)
export const revalidate = 60

// Cache the listening tests query with tags for on-demand revalidation
const getCachedListeningTests = unstable_cache(
  async (): Promise<ListeningTest[]> => {
    const listeningTests = await prisma.listeningTest.findMany({
      include: {
        readingTest: {
          select: {
            id: true,
            title: true
          }
        },
        parts: {
          include: {
            questions: true,
            _count: {
              select: { questions: true }
            }
          }
        },
        _count: {
          select: { parts: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return listeningTests.map(test => ({
      id: test.id,
      title: test.title,
      audioSource: test.audioSource,
      isActive: test.isActive,
      createdAt: test.createdAt.toISOString(),
      readingTest: test.readingTest,
      _count: {
        parts: test._count.parts
      },
      parts: test.parts.map(part => ({
        _count: {
          questions: part._count.questions
        }
      }))
    }))
  },
  ['listening-tests-list'],
  {
    revalidate: 60,
    tags: ['listening-tests']
  }
)

export default async function ListeningTestsPage() {
  // Auth is handled by middleware

  // Fetch listening tests with caching
  let listeningTests: ListeningTest[] = []
  let error = ''

  try {
    listeningTests = await getCachedListeningTests()
  } catch (err) {
    console.error('Error fetching listening tests:', err)
    error = 'Failed to fetch listening tests'
  }

  return <ListeningTestsClient initialListeningTests={listeningTests} error={error} />
}
