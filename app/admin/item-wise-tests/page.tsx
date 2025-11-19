import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'
import ItemWiseTestsClient, { ItemWiseTestListItem } from './ItemWiseTestsClient'

export const revalidate = 60

const getCachedItemWiseTests = unstable_cache(
  async (): Promise<ItemWiseTestListItem[]> => {
    // Ensure Prisma client is available with a more robust check
    if (!prisma || typeof prisma.itemWiseTest?.findMany !== 'function') {
      console.error('Prisma client not initialized properly or missing itemWiseTest model');
      return [];
    }

    try {
      const [itemWiseTests, readingTests, listeningTests, writingTests] = await Promise.all([
        prisma.itemWiseTest.findMany({ orderBy: { createdAt: 'desc' } }),
        prisma.readingTest.findMany({ select: { id: true, title: true } }),
        prisma.listeningTest.findMany({ select: { id: true, title: true } }),
        prisma.writingTest.findMany({ select: { id: true, title: true } })
      ])

      const readingMap = new Map(readingTests.map((test) => [test.id, test]))
      const listeningMap = new Map(listeningTests.map((test) => [test.id, test]))
      const writingMap = new Map(writingTests.map((test) => [test.id, test]))

      return itemWiseTests.map((test) => ({
        id: test.id,
        title: test.title,
        isActive: test.isActive,
        testType: test.testType,
        questionType: test.questionType,
        moduleType: test.moduleType,
        createdAt: test.createdAt.toISOString(),
        updatedAt: test.updatedAt.toISOString(),
        readingTests: (test.readingTestIds || [])
          .map((id) => readingMap.get(id))
          .filter((item): item is { id: string; title: string } => Boolean(item)),
        listeningTests: (test.listeningTestIds || [])
          .map((id) => listeningMap.get(id))
          .filter((item): item is { id: string; title: string } => Boolean(item)),
        writingTests: (test.writingTestIds || [])
          .map((id) => writingMap.get(id))
          .filter((item): item is { id: string; title: string } => Boolean(item))
      }))
    } catch (error) {
      console.error('Database query failed:', error);
      throw error;
    }
  },
  ['item-wise-tests-list'],
  {
    revalidate: 60,
    tags: ['item-wise-tests']
  }
)

export default async function ItemWiseTestsPage() {
  let itemWiseTests: ItemWiseTestListItem[] = []
  let error = ''

  try {
    itemWiseTests = await getCachedItemWiseTests()
  } catch (err) {
    console.error('Error fetching item-wise tests:', err)
    error = err instanceof Error ? err.message : 'Failed to fetch item-wise tests'
  }

  return <ItemWiseTestsClient initialItemWiseTests={itemWiseTests} error={error} />
}
