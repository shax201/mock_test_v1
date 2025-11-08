'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Assignment {
  id: string
  student: {
    id: string
    name: string
    email: string
  }
  readingTest: {
    id: string
    title: string
  }
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED'
  validFrom: string
  validUntil: string
  accessToken: string
  assignedAt: string
  createdAt: string
}

export default function AssignmentsPage() {
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
      const response = await fetch('/api/instructor/assignments')
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

  const handleDelete = async (assignmentId: string, studentName: string, testTitle: string) => {
    if (!confirm(`Are you sure you want to delete the assignment for "${studentName}" - "${testTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/instructor/assignments/${assignmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAssignments(assignments.filter(a => a.id !== assignmentId))
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to delete assignment')
      }
    } catch (error) {
      alert('Network error. Please try again.')
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Assignments
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage reading test assignments for students with start and expiration dates.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/instructor/assignments/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Assignment
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

      {/* Status Filter */}
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Filter by status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
        >
          <option value="all">All</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {[1, 2, 3].map((i) => (
              <li key={i}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="h-6 bg-gray-200 rounded w-64 animate-pulse"></div>
                      <div className="mt-2 h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new assignment.</p>
          <div className="mt-6">
            <Link
              href="/instructor/assignments/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Assignment
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredAssignments.map((assignment) => (
              <li key={assignment.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {assignment.readingTest.title}
                        </h3>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                          {getStatusText(assignment.status)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 space-x-6">
                        <span>Student: {assignment.student.name || assignment.student.email}</span>
                        <span>Valid from: {formatDate(assignment.validFrom)}</span>
                        <span>Valid until: {formatDate(assignment.validUntil)}</span>
                        <span>Assigned: {formatDate(assignment.assignedAt)}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Token: {assignment.accessToken}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDelete(assignment.id, assignment.student.name || assignment.student.email, assignment.readingTest.title)}
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
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

