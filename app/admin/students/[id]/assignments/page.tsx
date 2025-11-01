'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Student {
  id: string
  name: string
  email: string
  candidateNumber: string
}

interface MockTest {
  id: string
  title: string
  description: string
  modules: {
    type: string
    durationMinutes: number
  }[]
}

interface Assignment {
  id: string
  mockId: string
  studentId: string
  createdAt: string
  validUntil: string
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'COMPLETED'
  mock: {
    title: string
    description: string
  }
  submissions: {
    id: string
    submittedAt: string
    autoScore?: number
  }[]
}

export default function StudentAssignmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [availableMocks, setAvailableMocks] = useState<MockTest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedMockId, setSelectedMockId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resolvedParams = await params
        const [studentResponse, assignmentsResponse, mocksResponse] = await Promise.all([
          fetch(`/api/admin/students/${resolvedParams.id}`),
          fetch(`/api/admin/students/${resolvedParams.id}/assignments`),
          fetch('/api/admin/mocks')
        ])

        if (studentResponse.ok) {
          const studentData = await studentResponse.json()
          setStudent(studentData.student)
        }

        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json()
          setAssignments(assignmentsData.assignments)
        }

        if (mocksResponse.ok) {
          const mocksData = await mocksResponse.json()
          setAvailableMocks(mocksData.mocks)
        }
      } catch (error) {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params])

  const handleAssignMock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMockId || !expiresAt) return

    setAssigning(true)
    try {
      const resolvedParams = await params
      const response = await fetch(`/api/admin/students/${resolvedParams.id}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mockId: selectedMockId,
          expiresAt: new Date(expiresAt).toISOString()
        })
      })

      if (response.ok) {
        // Refresh assignments
        const assignmentsResponse = await fetch(`/api/admin/students/${resolvedParams.id}/assignments`)
        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json()
          setAssignments(assignmentsData.assignments)
        }
        setShowAssignModal(false)
        setSelectedMockId('')
        setExpiresAt('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to assign mock test')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setAssigning(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/assignments/${assignmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAssignments(assignments.filter(a => a.id !== assignmentId))
      } else {
        alert('Failed to remove assignment')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'EXPIRED':
        return 'bg-red-100 text-red-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Student not found</h3>
        <p className="mt-1 text-sm text-gray-500">The student you're looking for doesn't exist.</p>
        <div className="mt-6">
          <button
            onClick={() => router.push('/admin/students')}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Students
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Assignments for {student.name}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage mock test assignments for {student.candidateNumber}
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => setShowAssignModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Assign Mock Test
          </button>
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments</h3>
          <p className="mt-1 text-sm text-gray-500">This student hasn't been assigned any mock tests yet.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Assign Mock Test
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {assignments.map((assignment) => (
              <li key={assignment.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">{assignment.mock.title}</h3>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                            {assignment.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{assignment.mock.description}</p>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Assigned {formatDate(assignment.createdAt)} • Expires {formatDate(assignment.validUntil)}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {assignment.submissions.length} submission(s)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {assignment.submissions.length > 0 && (
                        <Link
                          href={`/admin/students/${student.id}/submissions/${assignment.submissions[0].id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View Submission
                        </Link>
                      )}
                      <button
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAssignModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAssignMock}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Assign Mock Test
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="mockId" className="block text-sm font-medium text-gray-700">
                        Select Mock Test *
                      </label>
                      <select
                        id="mockId"
                        value={selectedMockId}
                        onChange={(e) => setSelectedMockId(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      >
                        <option value="">Choose a mock test...</option>
                        {availableMocks.map((mock) => (
                          <option key={mock.id} value={mock.id}>
                            {mock.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700">
                        Expiration Date *
                      </label>
                      <input
                        type="datetime-local"
                        id="expiresAt"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={assigning}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {assigning ? 'Assigning...' : 'Assign'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
