'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import StudentHeader from '@/components/student/StudentHeader'

interface TestResult {
  id: string
  testTitle: string
  overallBand: number
  listeningBand: number
  readingBand: number
  writingBand: number
  speakingBand: number
  completedAt: string
  status: string
  candidateNumber: string
}

interface RemedialTest {
  id: string
  title: string
  description: string
  type: string
  module: string
  difficulty: string
  duration: number
  questions: any[]
  mockTest?: {
    id: string
    title: string
    description: string
  }
}

export default function StudentResults() {
  const router = useRouter()
  const [results, setResults] = useState<TestResult[]>([])
  const [remedialTests, setRemedialTests] = useState<RemedialTest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('self-analysis')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch results
        const resultsResponse = await fetch('/api/student/results')
        if (resultsResponse.ok) {
          const resultsData = await resultsResponse.json()
          const resultsList = Array.isArray(resultsData.results) ? resultsData.results : []
          setResults(resultsList)
        }

        // Fetch remedial tests
        const remedialResponse = await fetch('/api/student/remedial-tests')
        if (remedialResponse.ok) {
          const remedialData = await remedialResponse.json()
          setRemedialTests(remedialData.remedialTests || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <StudentHeader />
      <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg shadow-lg">
        <div className="px-4 py-8 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">IELTS Academic Mock Test - Sample</h1>
              <p className="text-green-100">Test Date: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div className="text-right">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {/* Tab Navigation */}
          <div className="flex space-x-8 mb-6">
            <button
              onClick={() => setActiveTab('self-analysis')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'self-analysis'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Self Analysis
              <div className="text-xs text-gray-400 mt-1">Know Where You Stand</div>
            </button>
            <button
              onClick={() => setActiveTab('remedial-tests')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors relative ${
                activeTab === 'remedial-tests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Remedial Tests
              <div className="text-xs text-gray-400 mt-1">Improve Your Weak Areas</div>
              <span className="absolute -top-1 -right-6 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                New
              </span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'self-analysis' ? (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Test Results Overview</h2>
              <p className="text-gray-600 mb-6">View detailed results and performance analysis for all your completed tests.</p>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Personalized Remedial Tests</h2>
              <p className="text-gray-600 mb-6">Practice tests designed to help you improve your weak areas.</p>
              
              {remedialTests.length > 0 ? (
                <div className="space-y-4">
                  {remedialTests.map((test) => (
                    <div key={test.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{test.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {test.module}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {test.difficulty}
                            </span>
                            <span className="text-sm text-gray-500">
                              {test.duration} minutes
                            </span>
                            {test.mockTest && (
                              <span className="text-sm text-blue-600">
                                <strong>Related to:</strong> {test.mockTest.title}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => router.push('/student/remedial-tests')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Start Test
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No remedial tests available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Complete some mock tests first to identify areas for improvement.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => router.push('/student/tests')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Take Mock Tests
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {results.length > 0 ? (
        <div className="space-y-6">
          {results.map((result) => (
            <div key={result.id} className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{result.testTitle}</h3>
                    <p className="text-sm text-gray-500">Candidate Number: {result.candidateNumber}</p>
                    <p className="text-sm text-gray-500">Completed: {new Date(result.completedAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">{result.overallBand.toFixed(1)}</div>
                    <div className="text-sm text-gray-500">Overall Band</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.listeningBand > 0 ? result.listeningBand.toFixed(1) : '-'}
                    </div>
                    <div className="text-sm text-gray-500">Listening</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {result.readingBand > 0 ? result.readingBand.toFixed(1) : '-'}
                    </div>
                    <div className="text-sm text-gray-500">Reading</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {result.writingBand > 0 ? result.writingBand.toFixed(1) : (
                        <span className="text-sm text-gray-400">Pending</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">Writing</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {result.speakingBand > 0 ? result.speakingBand.toFixed(1) : '-'}
                    </div>
                    <div className="text-sm text-gray-500">Speaking</div>
                  </div>
                </div>

                <div className="mt-6 flex space-x-4">
                  <Link 
                    href={`/student/results/${result.id}?tab=brief`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    View Detailed Report
                  </Link>
                </div>

                {/* <div className="mt-6 flex space-x-4">
                  <Link href={`/results?token=${result.candidateNumber}`} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">View Detailed Report</Link>
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Download PDF</button>
                </div> */}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-12 sm:p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No results yet</h3>
            <p className="mt-1 text-sm text-gray-500">Complete your first IELTS test to see results here.</p>
          </div>
        </div>
      )}
    </div>
    </>
  )
}


