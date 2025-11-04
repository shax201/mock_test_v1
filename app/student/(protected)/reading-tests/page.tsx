'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import StudentHeader from '@/components/student/StudentHeader'

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
}

export default function StudentReadingTestsPage() {
  const [readingTests, setReadingTests] = useState<ReadingTest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReadingTests()
  }, [])

  const fetchReadingTests = async () => {
    try {
      const response = await fetch('/api/student/reading-tests')
      const data = await response.json()

      if (response.ok) {
        setReadingTests(data.readingTests)
      } else {
        setError(data.error || 'Failed to fetch reading tests')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
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
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <StudentHeader />
      <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            IELTS Reading Tests
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Practice your reading skills with our comprehensive IELTS reading tests.
          </p>
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

      {/* Reading Tests List */}
      {readingTests.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No reading tests available</h3>
          <p className="mt-1 text-sm text-gray-500">Check back later for new reading tests.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {readingTests.filter(test => test.isActive).map((test) => (
              <li key={test.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900 truncate">{test.title}</h3>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 space-x-6">
                        <span>{test._count.passages} passages</span>
                        <span>{test.totalQuestions} questions</span>
                        <span>{test.totalTimeMinutes} minutes</span>
                        <span>Added {formatDate(test.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        Practice your IELTS reading skills with this comprehensive test covering various question types including matching headings, true/false/not given, summary completion, and multiple choice questions.
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <Link
                        href={`/student/reading-tests/${test.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Start Test
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
    </div>
  )
}
