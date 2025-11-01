'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Student {
  id: string
  name: string
  email: string
  phone?: string
  dateOfBirth?: string
  address?: string
  notes?: string
  createdAt: string
  assignments: {
    id: string
    mockId: string
    status: string
    createdAt: string
    validUntil: string
    mock: {
      title: string
      description: string
    }
    submissions: {
      id: string
      submittedAt: string
      autoScore?: number
    }[]
  }[]
  _count: {
    assignments: number
  }
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const resolvedParams = await params
        const response = await fetch(`/api/admin/students/${resolvedParams.id}`)
        const data = await response.json()

        if (response.ok) {
          setStudent(data.student)
        } else {
          setError(data.error || 'Failed to fetch student')
        }
      } catch (error) {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchStudent()
  }, [params])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
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
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/admin/students" className="text-gray-400 hover:text-gray-500">
                  <svg className="flex-shrink-0 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  <span className="sr-only">Students</span>
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">Student Details</span>
                </div>
              </li>
            </ol>
          </nav>
          <h2 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {student.name}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Student profile and assignment history
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <Link
            href={`/admin/students/${student.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Student
          </Link>
          <Link
            href={`/admin/students/${student.id}/assignments`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Manage Assignments
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Student Information */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Student Information
              </h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{student.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a href={`mailto:${student.email}`} className="text-blue-600 hover:text-blue-500">
                      {student.email}
                    </a>
                  </dd>
                </div>
                {student.phone && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a href={`tel:${student.phone}`} className="text-blue-600 hover:text-blue-500">
                        {student.phone}
                      </a>
                    </dd>
                  </div>
                )}
                {student.dateOfBirth && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDateOnly(student.dateOfBirth)} ({calculateAge(student.dateOfBirth)} years old)
                    </dd>
                  </div>
                )}
                {student.address && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900">{student.address}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(student.createdAt)}</dd>
                </div>
                {student.notes && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900">{student.notes}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Quick Stats
              </h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-gray-50 px-4 py-5 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Total Assignments</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {student._count.assignments}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Active Assignments</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {student.assignments.filter(a => a.status === 'ACTIVE').length}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Completed Tests</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {student.assignments.filter(a => a.status === 'COMPLETED').length}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Total Submissions</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {student.assignments.reduce((total, assignment) => total + assignment.submissions.length, 0)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Assignments */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Assignment History
                </h3>
                <Link
                  href={`/admin/students/${student.id}/assignments`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Manage Assignments →
                </Link>
              </div>

              {student.assignments.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments</h3>
                  <p className="mt-1 text-sm text-gray-500">This student hasn't been assigned any mock tests yet.</p>
                  <div className="mt-6">
                    <Link
                      href={`/admin/students/${student.id}/assignments`}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Assign Mock Test
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {student.assignments.map((assignment) => (
                    <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{assignment.mock.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">{assignment.mock.description}</p>
                          <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                            <span>Assigned: {formatDate(assignment.createdAt)}</span>
                            <span>Expires: {formatDate(assignment.validUntil)}</span>
                            <span>Submissions: {assignment.submissions.length}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                            {assignment.status}
                          </span>
                          {assignment.submissions.length > 0 && (
                            <Link
                              href={`/admin/students/${student.id}/submissions/${assignment.submissions[0].id}`}
                              className="text-xs text-blue-600 hover:text-blue-500"
                            >
                              View Submission
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
