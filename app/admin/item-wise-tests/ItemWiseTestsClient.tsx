'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export type ItemWiseTestListItem = {
  id: string
  title: string
  isActive: boolean
  testType: string
  questionType: string
  moduleType: 'READING' | 'LISTENING' | 'WRITING'
  createdAt: string
  updatedAt: string
  readingTests: { id: string; title: string }[]
  listeningTests: { id: string; title: string }[]
  writingTests: { id: string; title: string }[]
}

interface ItemWiseTestsClientProps {
  initialItemWiseTests: ItemWiseTestListItem[]
  error: string
}

export default function ItemWiseTestsClient({ initialItemWiseTests, error: initialError }: ItemWiseTestsClientProps) {
  const router = useRouter()
  const [itemWiseTests, setItemWiseTests] = useState<ItemWiseTestListItem[]>(initialItemWiseTests)
  const [error, setError] = useState(initialError)

  const handleDelete = async (testId: string, title: string) => {
    if (!confirm(`Delete item-wise test "${title}"? This cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/item-wise-tests/${testId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setItemWiseTests(prev => prev.filter(test => test.id !== testId))
        router.refresh()
      } else {
        const data = await response.json().catch(() => ({ error: 'Failed to delete item-wise test' }))
        setError(data.error || 'Failed to delete item-wise test')
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError('Network error. Please try again.')
    }
  }

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (err) {
      return value
    }
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Item-wise Tests
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Bundle existing reading, listening, or writing tests into item-wise mock experiences.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/admin/item-wise-tests/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Item-wise Test
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {itemWiseTests.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h12M9 9h12M9 13h12M5 7h.01M5 11h.01M5 15h.01M9 17h12M5 19h.01" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No item-wise tests</h3>
          <p className="mt-1 text-sm text-gray-500">Create an item-wise test to get started.</p>
          <div className="mt-6">
            <Link
              href="/admin/item-wise-tests/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Item-wise Test
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {itemWiseTests.map((test) => {
              const totalLinked = test.readingTests.length + test.listeningTests.length + test.writingTests.length

              return (
                <li key={test.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900 truncate">{test.title}</h3>
                          {test.isActive ? (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center text-sm text-gray-500 gap-y-1">
                          <span className="mr-4">Test type: {test.testType.replace(/_/g, ' ')}</span>
                          <span className="mr-4">Question type: {test.questionType.replace(/_/g, ' ')}</span>
                          <span className="mr-4">Module: {test.moduleType}</span>
                          <span className="mr-4">Linked tests: {totalLinked}</span>
                          <span>Updated {formatDate(test.updatedAt)}</span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          {test.readingTests.length > 0 && (
                            <p>
                              <span className="font-medium text-gray-800">Reading:</span>{' '}
                              {test.readingTests.map((rt) => rt.title).join(', ')}
                            </p>
                          )}
                          {test.listeningTests.length > 0 && (
                            <p>
                              <span className="font-medium text-gray-800">Listening:</span>{' '}
                              {test.listeningTests.map((lt) => lt.title).join(', ')}
                            </p>
                          )}
                          {test.writingTests.length > 0 && (
                            <p>
                              <span className="font-medium text-gray-800">Writing:</span>{' '}
                              {test.writingTests.map((wt) => wt.title).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/item-wise-tests/${test.id}/edit`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(test.id, test.title)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
