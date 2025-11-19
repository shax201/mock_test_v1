'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import StudentHeader from '@/components/student/StudentHeader'

type ModuleBandType = 'LISTENING' | 'READING' | 'WRITING'

interface ModuleResult {
  type: ModuleBandType
  title: string
  band: number
  completedAt: string | null
}

interface TestResult {
  id: string
  itemWiseTestId?: string | null
  testTitle: string
  overallBand: number
  listeningBand: number
  readingBand: number
  writingBand: number
  speakingBand: number
  completedAt: string
  status: string
  candidateNumber: string
  modules: ModuleResult[]
}

interface StudentResultsClientProps {
  initialResults: TestResult[]
  error: string
}

export default function StudentResultsClient({ initialResults, error: initialError }: StudentResultsClientProps) {
  const router = useRouter()
  const [results] = useState<TestResult[]>(initialResults)
  const [error] = useState(initialError)

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
            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4 mb-6">
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

            {/* Content */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Test Results Overview</h2>
              <p className="text-gray-600 mb-6">View detailed results and performance analysis for all your completed tests.</p>
            </div>
          </div>
        </div>

        {results.length > 0 ? (
          <div className="space-y-6">
            {results.map((result) => (
              <div key={result.id} className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-gray-900">{result.testTitle}</h3>
                        {result.itemWiseTestId && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700 border border-green-100">
                            Item-wise
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">Candidate Number: {result.candidateNumber}</p>
                      <p className="text-sm text-gray-500">Completed: {new Date(result.completedAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">{result.overallBand.toFixed(1)}</div>
                      <div className="text-sm text-gray-500">Overall Band</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {result.modules.length > 0 ? (
                      result.modules.map(module => {
                        const colorClass =
                          module.type === 'LISTENING'
                            ? 'text-blue-600'
                            : module.type === 'READING'
                            ? 'text-green-600'
                            : 'text-yellow-600'
                        const label =
                          module.type === 'LISTENING'
                            ? 'Listening'
                            : module.type === 'READING'
                            ? 'Reading'
                            : 'Writing'
                        return (
                          <div key={`${result.id}-${module.type}`} className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className={`text-2xl font-bold ${colorClass}`}>
                              {module.band > 0 ? module.band.toFixed(1) : (
                                <span className="text-sm text-gray-400">Pending</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{label}</div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="col-span-full text-center text-sm text-gray-500 py-4">
                        No module scores yet.
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex space-x-4">
                    <Link 
                      href={`/student/results/${result.id}?tab=brief`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      View Detailed Report
                    </Link>
                  </div>
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

