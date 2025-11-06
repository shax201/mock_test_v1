'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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

export default function ListeningTestsPage() {
  const [listeningTests, setListeningTests] = useState<ListeningTest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingTestId, setEditingTestId] = useState<string | null>(null)
  const [readingTests, setReadingTests] = useState<Array<{ id: string; title: string }>>([])
  const [selectedReadingTestId, setSelectedReadingTestId] = useState<string>('')

  useEffect(() => {
    fetchListeningTests()
    fetchReadingTests()
  }, [])

  const fetchReadingTests = async () => {
    try {
      const response = await fetch('/api/admin/reading-tests')
      const data = await response.json()
      if (response.ok) {
        setReadingTests(data.readingTests || [])
      }
    } catch (error) {
      console.error('Error fetching reading tests:', error)
    }
  }

  const fetchListeningTests = async () => {
    try {
      const response = await fetch('/api/admin/listening-tests')
      const data = await response.json()

      if (response.ok) {
        setListeningTests(data.listeningTests)
      } else {
        setError(data.error || 'Failed to fetch listening tests')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (testId: string) => {
    const test = listeningTests.find(t => t.id === testId)
    if (test) {
      setSelectedReadingTestId(test.readingTest?.id || '')
      setEditingTestId(testId)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingTestId) return

    try {
      const response = await fetch(`/api/admin/listening-tests/${editingTestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          readingTestId: selectedReadingTestId || null
        })
      })

      if (response.ok) {
        await fetchListeningTests()
        setEditingTestId(null)
        setSelectedReadingTestId('')
        alert('Listening test updated successfully!')
      } else {
        alert('Failed to update listening test')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    }
  }

  const handleCancelEdit = () => {
    setEditingTestId(null)
    setSelectedReadingTestId('')
  }

  const handleDelete = async (testId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/listening-tests/${testId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setListeningTests(listeningTests.filter(test => test.id !== testId))
      } else {
        alert('Failed to delete listening test')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Listening Tests
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage IELTS listening tests, parts, and questions.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/admin/listening-tests/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Listening Test
          </Link>
        </div>
      </div>

      {/* Error Message */}
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

      {/* Edit Modal */}
      {editingTestId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={handleCancelEdit}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Reading Test Association</h3>
              <div className="mb-4">
                <label htmlFor="edit-reading-test-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Reading Test
                </label>
                <select
                  id="edit-reading-test-select"
                  value={selectedReadingTestId}
                  onChange={(e) => setSelectedReadingTestId(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">None (Standalone Listening Test)</option>
                  {readingTests.map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Listening Tests List */}
      {listeningTests.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No listening tests</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new listening test.</p>
          <div className="mt-6">
            <Link
              href="/admin/listening-tests/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Listening Test
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {listeningTests.map((test) => {
              const totalQuestions = test.parts.reduce((sum, part) => sum + part._count.questions, 0)

              return (
                <li key={test.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900 truncate">{test.title}</h3>
                          {test.isActive && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 space-x-6">
                          <span>{test._count.parts} parts</span>
                          <span>{totalQuestions} questions</span>
                          {test.readingTest && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Reading: {test.readingTest.title}
                            </span>
                          )}
                          <span className="truncate max-w-xs" title={test.audioSource}>
                            Audio: {test.audioSource.split('/').pop() || 'N/A'}
                          </span>
                          <span>Created {formatDate(test.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(test.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
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

