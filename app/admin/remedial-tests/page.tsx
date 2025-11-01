'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
// import { useRouter } from 'next/navigation'

interface RemedialTest {
  id: string
  title: string
  description: string
  type: string
  module: string
  difficulty: string
  duration: number
  audioUrl?: string
  audioPublicId?: string
  isActive: boolean
  createdAt: string
  mockTest?: {
    id: string
    title: string
    description: string
  }
  _count: {
    sessions: number
  }
}

export default function AdminRemedialTests() {
  // const router = useRouter()
  const [remedialTests, setRemedialTests] = useState<RemedialTest[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchRemedialTests()
  }, [])

  const fetchRemedialTests = async () => {
    try {
      const response = await fetch('/api/admin/remedial-tests')
      if (response.ok) {
        const data = await response.json()
        setRemedialTests(data.remedialTests || [])
      }
    } catch (error) {
      console.error('Error fetching remedial tests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this remedial test? This action cannot be undone.')) {
      return
    }

    setDeletingId(id)
    try {
      // Find the test to get audioPublicId
      const testToDelete = remedialTests.find(test => test.id === id)
      
      // Delete audio file if it exists
      if (testToDelete?.audioPublicId) {
        try {
          await fetch('/api/admin/delete-audio', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ public_id: testToDelete.audioPublicId }),
          })
        } catch (error) {
          console.error('Error deleting audio file:', error)
          // Continue with test deletion even if audio deletion fails
        }
      }

      const response = await fetch(`/api/admin/remedial-tests/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setRemedialTests(prev => prev.filter(test => test.id !== id))
      } else {
        console.error('Failed to delete remedial test')
      }
    } catch (error) {
      console.error('Error deleting remedial test:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/remedial-tests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        setRemedialTests(prev => 
          prev.map(test => 
            test.id === id ? { ...test, isActive: !isActive } : test
          )
        )
      }
    } catch (error) {
      console.error('Error updating remedial test:', error)
    }
  }

  const filteredTests = remedialTests.filter(test => {
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && test.isActive) || 
      (filter === 'inactive' && !test.isActive)
    
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.module.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'MATCHING_HEADINGS': 'Matching Headings',
      'INFORMATION_MATCHING': 'Information Matching',
      'MULTIPLE_CHOICE': 'Multiple Choice',
      'NOTES_COMPLETION': 'Notes Completion',
      'FILL_IN_THE_BLANK': 'Fill in the Blank',
      'TRUE_FALSE_NOT_GIVEN': 'True/False/Not Given'
    }
    return types[type] || type
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      'BEGINNER': 'bg-green-100 text-green-800',
      'INTERMEDIATE': 'bg-yellow-100 text-yellow-800',
      'ADVANCED': 'bg-red-100 text-red-800'
    }
    return colors[difficulty] || 'bg-gray-100 text-gray-800'
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
            Remedial Tests
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage personalized remedial tests to help students improve their weak areas.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/admin/remedial-tests/create"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Remedial Test
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Tests</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Tests
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, type, or module..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilter('all')
                setSearchTerm('')
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Tests</dt>
                  <dd className="text-lg font-medium text-gray-900">{remedialTests.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Tests</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {remedialTests.filter(test => test.isActive).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Sessions</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {remedialTests.reduce((sum, test) => sum + test._count.sessions, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg. Duration</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {remedialTests.length > 0 
                      ? Math.round(remedialTests.reduce((sum, test) => sum + test.duration, 0) / remedialTests.length)
                      : 0} min
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tests List */}
      {filteredTests.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredTests.map((test) => (
              <li key={test.id}>
                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">{test.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          test.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {test.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{test.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-500">
                          <strong>Type:</strong> {getTypeLabel(test.type)}
                        </span>
                        <span className="text-sm text-gray-500">
                          <strong>Module:</strong> {test.module}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(test.difficulty)}`}>
                          {test.difficulty}
                        </span>
                        <span className="text-sm text-gray-500">
                          <strong>Duration:</strong> {test.duration} min
                        </span>
                        <span className="text-sm text-gray-500">
                          <strong>Sessions:</strong> {test._count.sessions}
                        </span>
                        {test.module === 'LISTENING' && test.audioUrl && (
                          <span className="text-sm text-green-600">
                            <strong>Audio:</strong> <a href={test.audioUrl} target="_blank" rel="noopener noreferrer" className="underline">Listen</a>
                          </span>
                        )}
                        {test.mockTest && (
                          <span className="text-sm text-blue-600">
                            <strong>Linked to:</strong> {test.mockTest.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(test.id, test.isActive)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        test.isActive
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {test.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <Link
                      href={`/admin/remedial-tests/${test.id}/edit`}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(test.id)}
                      disabled={deletingId === test.id}
                      className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 disabled:opacity-50"
                    >
                      {deletingId === test.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-12 sm:p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No remedial tests found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first remedial test.'
              }
            </p>
            <div className="mt-6">
              <Link
                href="/admin/remedial-tests/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Remedial Test
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
