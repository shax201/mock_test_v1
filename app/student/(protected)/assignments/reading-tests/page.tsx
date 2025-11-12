'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import StudentHeader from '@/components/student/StudentHeader'

interface Assignment {
  id: string
  testTitle: string
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED'
  assignedAt: string
  validFrom?: string
  validUntil?: string
  accessToken: string
  hasResult: boolean
  overallBand?: number
}

export default function StudentReadingTestsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAssignments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/student/assignments', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Recalculate status on client side based on current time
        const now = new Date()
        const assignmentsWithRecalculatedStatus = (data.assignments || []).map((assignment: Assignment) => {
          const validFrom = assignment.validFrom ? new Date(assignment.validFrom) : null
          const validUntil = assignment.validUntil ? new Date(assignment.validUntil) : null
          
          // If already completed, keep it as completed
          if (assignment.status === 'COMPLETED') {
            return assignment
          }
          
          // Recalculate status based on current time
          if (validUntil && validUntil < now) {
            return { ...assignment, status: 'EXPIRED' as const }
          } else if (validFrom && validFrom > now) {
            return { ...assignment, status: 'PENDING' as const }
          } else if (validFrom && validFrom <= now && validUntil && validUntil >= now) {
            return { ...assignment, status: 'ACTIVE' as const }
          }
          
          return assignment
        })
        setAssignments(assignmentsWithRecalculatedStatus)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load assignments')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAssignments()
    // Auto-refresh every 30 seconds to update status
    const interval = setInterval(() => {
      fetchAssignments()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [fetchAssignments])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'EXPIRED':
        return 'bg-red-100 text-red-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: Assignment['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active'
      case 'COMPLETED':
        return 'Completed'
      case 'EXPIRED':
        return 'Expired'
      case 'PENDING':
        return 'Pending'
      default:
        return status
    }
  }

  const isTestAccessible = (assignment: Assignment) => {
    if (assignment.status === 'COMPLETED') return false
    if (assignment.status === 'EXPIRED') return false
    if (assignment.status === 'PENDING') return false
    
    // Check if test is within valid time range
    const now = new Date()
    if (assignment.validFrom && new Date(assignment.validFrom) > now) return false
    if (assignment.validUntil && new Date(assignment.validUntil) < now) return false
    
    return true
  }

  const getActionButton = (assignment: Assignment) => {
    if (assignment.status === 'COMPLETED') {
      return (
        <Link
          href={`/student/results/${assignment.id}`}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          View Results
        </Link>
      )
    }

    if (assignment.status === 'EXPIRED') {
      return (
        <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-gray-100 cursor-not-allowed">
          Test Expired
        </span>
      )
    }

    if (assignment.status === 'PENDING') {
      return (
        <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-gray-100 cursor-not-allowed">
          Not Yet Available
        </span>
      )
    }

    if (isTestAccessible(assignment)) {
      return (
        <Link
          href={`/test/${assignment.accessToken}/reading`}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Start Test
        </Link>
      )
    }

    return (
      <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-gray-100 cursor-not-allowed">
        Not Available
      </span>
    )
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

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No reading test assignments available</h3>
          <p className="mt-1 text-sm text-gray-500">Check back later for new reading test assignments.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {assignments.map((assignment) => (
              <li key={assignment.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                          {getStatusText(assignment.status)}
                        </span>
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {assignment.testTitle}
                        </h3>
                        {assignment.hasResult && assignment.overallBand && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Band {assignment.overallBand}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-500 space-y-1">
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          <span>Assigned: {formatDate(assignment.assignedAt)}</span>
                          {assignment.validFrom && (
                            <span>Available from: {formatDate(assignment.validFrom)}</span>
                          )}
                          {assignment.validUntil && (
                            <span>Valid until: {formatDate(assignment.validUntil)}</span>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        Practice your IELTS reading skills with this comprehensive test covering various question types including matching headings, true/false/not given, summary completion, and multiple choice questions.
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {getActionButton(assignment)}
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
