import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import ItemWiseTestForm from '@/components/admin/ItemWiseTestForm'

interface EditItemWiseTestPageProps {
  params: Promise<{ id: string }>
}

export default async function EditItemWiseTestPage({ params }: EditItemWiseTestPageProps) {
  const { id } = await params

  const [itemWiseTest, readingTests, listeningTests, writingTests] = await Promise.all([
    prisma.itemWiseTest.findUnique({ where: { id } }),
    prisma.readingTest.findMany({ select: { id: true, title: true }, orderBy: { title: 'asc' } }),
    prisma.listeningTest.findMany({ select: { id: true, title: true }, orderBy: { title: 'asc' } }),
    prisma.writingTest.findMany({ select: { id: true, title: true }, orderBy: { title: 'asc' } })
  ])

  if (!itemWiseTest) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Edit Item-wise Test
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Update the linked reading/listening tests or activation status.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/admin/item-wise-tests"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to List
          </Link>
        </div>
      </div>

      <ItemWiseTestForm
        mode="edit"
        itemWiseTestId={itemWiseTest.id}
        initialData={{
          title: itemWiseTest.title,
          isActive: itemWiseTest.isActive,
          testType: itemWiseTest.testType,
          questionType: itemWiseTest.questionType,
          readingTestIds: itemWiseTest.readingTestIds,
          listeningTestIds: itemWiseTest.listeningTestIds,
          writingTestIds: itemWiseTest.writingTestIds,
          moduleType: itemWiseTest.moduleType ?? (itemWiseTest.listeningTestIds.length > 0 ? 'LISTENING' : itemWiseTest.writingTestIds.length > 0 ? 'WRITING' : 'READING')
        }}
        readingTests={readingTests}
        listeningTests={listeningTests}
        writingTests={writingTests}
      />
    </div>
  )
}
