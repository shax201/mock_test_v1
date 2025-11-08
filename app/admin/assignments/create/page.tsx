'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Student {
  id: string
  name: string
  email: string
}

interface ReadingTest {
  id: string
  title: string
  isActive: boolean
}

export default function CreateAssignmentPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [readingTests, setReadingTests] = useState<ReadingTest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    studentId: '',
    readingTestId: '',
    validFrom: '',
    validUntil: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [studentsRes, testsRes] = await Promise.all([
        fetch('/api/admin/students'),
        fetch('/api/admin/reading-tests')
      ])

      const studentsData = await studentsRes.json()
      const testsData = await testsRes.json()

      if (studentsRes.ok) {
        setStudents(studentsData.students || [])
      }
      if (testsRes.ok) {
        setReadingTests((testsData.readingTests || []).filter((test: ReadingTest) => test.isActive))
      }
    } catch (error) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    // Validation
    if (!formData.studentId) {
      setError('Please select a student')
      setSubmitting(false)
      return
    }

    if (!formData.readingTestId) {
      setError('Please select a reading test')
      setSubmitting(false)
      return
    }

    if (!formData.validFrom) {
      setError('Please select a valid from date')
      setSubmitting(false)
      return
    }

    if (!formData.validUntil) {
      setError('Please select a valid until date')
      setSubmitting(false)
      return
    }

    if (new Date(formData.validUntil) <= new Date(formData.validFrom)) {
      setError('Expiration date must be after the start date')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/admin/assignments')
      } else {
        setError(data.error || 'Failed to create assignment')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
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
            Create Assignment
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Assign a reading test to a student with start and expiration dates.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/admin/assignments"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Assignments
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

      {/* Form */}
      <div className="bg-white shadow sm:rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
              Student *
            </label>
            <select
              id="studentId"
              required
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name || student.email} {student.name && `(${student.email})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="readingTestId" className="block text-sm font-medium text-gray-700">
              Reading Test *
            </label>
            <select
              id="readingTestId"
              required
              value={formData.readingTestId}
              onChange={(e) => setFormData({ ...formData, readingTestId: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select a reading test</option>
              {readingTests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="validFrom" className="block text-sm font-medium text-gray-700">
              Valid From (Start Date) *
            </label>
            <input
              type="datetime-local"
              id="validFrom"
              required
              value={formData.validFrom}
              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">The date and time when the assignment becomes active</p>
          </div>

          <div>
            <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700">
              Valid Until (Expiration Date) *
            </label>
            <input
              type="datetime-local"
              id="validUntil"
              required
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">The date and time when the assignment expires</p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Link
              href="/admin/assignments"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

