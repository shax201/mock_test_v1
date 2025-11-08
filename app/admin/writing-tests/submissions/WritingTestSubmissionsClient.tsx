'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Submission {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  testId: string
  testTitle: string
  readingTestTitle: string
  answers: any
  completedAt: string | null
  score: number | null
  band: number | null
}

interface WritingTestSubmissionsClientProps {
  initialSubmissions: Submission[]
  error: string
}

export default function WritingTestSubmissionsClient({ initialSubmissions, error: initialError }: WritingTestSubmissionsClientProps) {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions)
  const [error, setError] = useState(initialError)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getWordCount = (answers: any): number => {
    if (!answers || typeof answers !== 'object') return 0
    let totalWords = 0
    Object.values(answers).forEach((answer: any) => {
      if (typeof answer === 'string' && answer.trim()) {
        totalWords += answer.trim().split(/\s+/).length
      }
    })
    return totalWords
  }

  const handleDelete = async (submissionId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete the submission from ${studentName}? This action cannot be undone.`)) {
      return
    }

    setDeletingId(submissionId)
    try {
      const response = await fetch(`/api/admin/writing-tests/submissions/${submissionId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        // Remove the submission from the list
        setSubmissions(submissions.filter(sub => sub.id !== submissionId))
        // Revalidate the page to update the cache
        router.refresh()
      } else {
        alert(data.error || 'Failed to delete submission')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Writing Test Submissions
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View all submitted writing tests from students.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions</h3>
          <p className="mt-1 text-sm text-gray-500">Writing test submissions will appear here.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Based on Reading Test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Word Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Band Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission) => {
                  // Calculate word count from answers
                  const wordCount = getWordCount(submission.answers)
                  
                  return (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {submission.studentName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {submission.studentEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{submission.testTitle}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{submission.readingTestTitle}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{wordCount} words</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission.band !== null ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Band {submission.band.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(submission.completedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-4">
                          <Link
                            href={`/admin/writing-tests/submissions/${submission.id}`}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            View →
                          </Link>
                          <button
                            onClick={() => handleDelete(submission.id, submission.studentName)}
                            disabled={deletingId === submission.id}
                            className="text-red-600 hover:text-red-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingId === submission.id ? (
                              <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Deleting...
                              </span>
                            ) : (
                              'Delete'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

