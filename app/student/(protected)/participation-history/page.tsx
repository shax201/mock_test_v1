'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ParticipationHistoryItem {
  id: string
  testTitle: string
  testDescription: string
  candidateNumber: string
  status: string
  assignedAt: string
  validFrom: string
  validUntil: string
  completedAt: string | null
  testDuration: number | null
  progressPercentage: number
  moduleStatus: Array<{
    module: string
    status: string
    submittedAt: string | null
    autoScore: number | null
    instructorMarked: boolean
  }>
  overallBand: number | null
  moduleBands: {
    listening: number | null
    reading: number | null
    writing: number | null
    speaking: number | null
  }
  hasResult: boolean
  isExpired: boolean
  canRetake: boolean
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface SummaryStats {
  totalTests: number
  completedTests: number
  activeTests: number
  expiredTests: number
  averageBand: number
  totalTestTime: number
}

export default function ParticipationHistory() {
  const [history, setHistory] = useState<ParticipationHistoryItem[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchHistory = async (page = 1, status = 'all', search = '') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (status !== 'all') params.append('status', status)
      if (search) params.append('search', search)

      const response = await fetch(`/api/student/participation-history?${params}`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data.participationHistory)
        setPagination(data.pagination)
        setSummaryStats(data.summaryStats)
      }
    } catch (error) {
      console.error('Error fetching participation history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory(currentPage, statusFilter, searchQuery)
  }, [currentPage, statusFilter, searchQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchHistory(1, statusFilter, searchQuery)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const getStatusColor = (status: string, isExpired: boolean) => {
    if (isExpired) return 'bg-red-100 text-red-800'
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'ACTIVE': return 'bg-blue-100 text-blue-800'
      case 'EXPIRED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string, isExpired: boolean) => {
    if (isExpired) return 'Expired'
    switch (status) {
      case 'COMPLETED': return 'Completed'
      case 'ACTIVE': return 'Active'
      case 'EXPIRED': return 'Expired'
      default: return status
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
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Participation History</h1>
              <p className="text-gray-600 mt-1">
                Track all your test participation, progress, and performance over time.
              </p>
            </div>
            <Link 
              href="/student" 
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Tests</dt>
                    <dd className="text-lg font-medium text-gray-900">{summaryStats.totalTests}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                    <dd className="text-lg font-medium text-gray-900">{summaryStats.completedTests}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                    <dd className="text-lg font-medium text-gray-900">{summaryStats.activeTests}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Average Band</dt>
                    <dd className="text-lg font-medium text-gray-900">{Math.round(summaryStats.averageBand)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by test title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </form>

            {/* Status Filter */}
            <div className="flex space-x-2">
              {['all', 'ACTIVE', 'COMPLETED', 'EXPIRED'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusFilter(status)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    statusFilter === status
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  } border`}
                >
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Test Participation History</h2>
          
          {history.length > 0 ? (
            <div className="space-y-6">
              {history.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{item.testTitle}</h3>
                      {item.testDescription && (
                        <p className="text-sm text-gray-600 mt-1">{item.testDescription}</p>
                      )}
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>Candidate: {item.candidateNumber}</span>
                        <span>•</span>
                        <span>Assigned: {new Date(item.assignedAt).toLocaleDateString()}</span>
                        {item.completedAt && (
                          <>
                            <span>•</span>
                            <span>Completed: {new Date(item.completedAt).toLocaleDateString()}</span>
                          </>
                        )}
                        {item.testDuration && (
                          <>
                            <span>•</span>
                            <span>Duration: {item.testDuration} min</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status, item.isExpired)}`}>
                        {getStatusText(item.status, item.isExpired)}
                      </span>
                      {item.overallBand && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{Math.round(item.overallBand)}</div>
                          <div className="text-xs text-gray-500">Overall Band</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Test Progress</span>
                      <span>{item.progressPercentage}% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${item.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Module Status */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {item.moduleStatus.map((module) => (
                      <div key={module.module} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${
                          module.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                          module.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-gray-100 text-gray-400'
                        }`}>
                          {module.status === 'COMPLETED' ? '✓' : 
                           module.status === 'IN_PROGRESS' ? '⏳' : '○'}
                        </div>
                        <div className="text-sm font-medium text-gray-900 capitalize">{module.module}</div>
                        {module.autoScore && (
                          <div className="text-xs text-gray-500 mt-1">Score: {Math.round(module.autoScore)}</div>
                        )}
                        {module.instructorMarked && (
                          <div className="text-xs text-blue-600 mt-1">✓ Marked</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Module Bands */}
                  {item.overallBand && (
                    <div className="grid grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{Math.round(item.moduleBands.listening || 0)}</div>
                        <div className="text-xs text-gray-600">Listening</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{Math.round(item.moduleBands.reading || 0)}</div>
                        <div className="text-xs text-gray-600">Reading</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{Math.round(item.moduleBands.writing || 0)}</div>
                        <div className="text-xs text-gray-600">Writing</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{Math.round(item.moduleBands.speaking || 0)}</div>
                        <div className="text-xs text-gray-600">Speaking</div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 mt-4">
                    {item.status === 'ACTIVE' && !item.isExpired && (
                      <Link
                        href={`/test/${item.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Continue Test
                      </Link>
                    )}
                    {item.hasResult && (
                      <Link
                        href={`/results?token=${item.id}`}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        View Results
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No participation history found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {statusFilter !== 'all' || searchQuery 
                  ? 'Try adjusting your filters or search terms.'
                  : 'You haven\'t participated in any tests yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagination.hasNext}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * pagination.limit) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
