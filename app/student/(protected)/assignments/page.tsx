'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED'>('all')

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/student/assignments')
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load assignments')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredAssignments = assignments.filter(assignment => 
    statusFilter === 'all' || assignment.status === statusFilter
  )

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
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
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
          href={`/test/${assignment.accessToken}`}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Assigned Tests</h1>
          <p className="text-gray-600">
            View and access your assigned IELTS mock tests.
          </p>
        </div>
      </div>

      {/* Error Message */}
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

      {/* Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Assignments</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter === 'all' 
              ? "You don't have any assigned tests yet." 
              : `No ${statusFilter.toLowerCase()} assignments found.`
            }
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredAssignments.map((assignment) => (
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
  )
}
