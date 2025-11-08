'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import QuestionWiseResults from './QuestionWiseResults'

interface TestResultsData {
  testTitle: string
  testDate: string
  candidateNumber: string
  studentName: string
  mockTestId: string
  bandScores: {
    listening: number
    reading: number
    writing: number
    speaking?: number
  }
  overallBand?: number
  detailedScores?: any
  questionDetails?: {
    reading?: Array<{
      id: string
      question: string
      type: string
      part: number
      options?: string[]
      studentAnswer: string
      correctAnswer: string
      isCorrect: boolean
      explanation?: string
    }>
    listening?: Array<{
      id: string
      question: string
      type: string
      part: number
      options?: string[]
      studentAnswer: string
      correctAnswer: string
      isCorrect: boolean
      explanation?: string
    }>
    writing?: Array<{
      id: string
      question: string
      type: string
      part: number
      studentAnswer: string
      correctAnswer: string
      isCorrect: boolean | null
      explanation?: string
      wordCount?: number
    }>
  }
  feedback?: {
    writing: Array<{
      text: string
      comment: string
      range: [number, number]
    }>
  }
  generatedAt: string
  status: string
}

interface TestResultsAnalysisProps {
  testId: string
  initialTab?: 'brief' | 'writing' | 'question-wise'
  initialResults?: TestResultsData | null
  initialError?: string | null
}

export default function TestResultsAnalysis({ testId, initialTab, initialResults, initialError }: TestResultsAnalysisProps) {
  const [loading, setLoading] = useState(!initialResults && !initialError)
  const [results, setResults] = useState<TestResultsData | null>(initialResults || null)
  const [error, setError] = useState<string | null>(initialError || null)
  const [activeSubTab, setActiveSubTab] = useState<'brief' | 'writing' | 'question-wise'>(initialTab || 'brief')
  
  // Update sub tab when initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab)
    }
  }, [initialTab])

  useEffect(() => {
    // Only fetch if we don't have initial results
    if (initialResults) {
      setLoading(false)
      return
    }

    if (initialError) {
      setError(initialError)
      setLoading(false)
      return
    }

    const fetchResults = async () => {
      try {
        // Add cache-busting parameter to ensure fresh data after admin evaluation
        const response = await fetch(`/api/student/results/${testId}?t=${Date.now()}`)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Results fetched:', {
            writingBand: data.results?.bandScores?.writing,
            overallBand: data.results?.overallBand,
            sessionBand: data.results?.detailedScores?.band
          })
          setResults(data.results)
        } else if (response.status === 202) {
          // Results not yet available
          const errorData = await response.json()
          setError(errorData.error)
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to load results')
        }
      } catch (error) {
        console.error('Error fetching results:', error)
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
    
    // Set up polling to check for updates every 30 seconds if writing score is pending
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/student/results/${testId}?t=${Date.now()}`)
        if (response.ok) {
          const data = await response.json()
          const writingBand = data.results?.bandScores?.writing
          // Only update if writing score changed from pending to evaluated
          if (writingBand !== null && writingBand !== undefined && writingBand > 0) {
            setResults(data.results)
          }
        }
      } catch (error) {
        console.error('Error polling for results:', error)
      }
    }, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [testId, initialResults, initialError])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Results Not Available</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link 
              href="/student/tests"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Back to Tests
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Results Found</h2>
          <p className="text-gray-600">Unable to load test results.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">{results.testTitle}</h1>
            <div className="text-right">
              <p className="text-lg">Test Date : {results.testDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-8 px-6">
        {/* White Content Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Tabs */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex space-x-8">
              <div className="pb-4 border-b-2 border-gray-400">
                <div className="text-lg font-medium text-gray-900">Self Analysis</div>
                <div className="text-sm text-gray-500">Know Where You Stand</div>
              </div>
            </div>
            
            {/* Download Report Button */}
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center hover:bg-blue-700 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Report
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="flex space-x-8 mb-8 border-b border-gray-200">
              {[
                { key: 'brief', label: 'Brief' },
                { key: 'writing', label: 'Writing' },
                { key: 'question-wise', label: 'Question-wise' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSubTab(tab.key as any)}
                  className={`pb-3 border-b-2 transition-colors ${
                    activeSubTab === tab.key
                      ? 'border-gray-400 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

          {/* Content Area */}
          {activeSubTab === 'brief' && (
            <div className="text-center">
          {/* Band Score Cards */}
          <div className="flex justify-center space-x-8 mb-8">
            {/* Listening Card */}
            <div className="bg-white border border-gray-300 rounded-lg p-6 text-center min-w-[150px]">
              <div className="text-4xl font-bold text-gray-900 mb-2">{results.bandScores?.listening ?? 0}</div>
              <div className="text-sm text-gray-600 mb-1">Band Score</div>
              <div className="text-sm font-medium text-gray-800">LISTENING</div>
            </div>

            {/* Reading Card */}
            {typeof results.bandScores?.reading === 'number' && (
              <div className="bg-white border border-gray-300 rounded-lg p-6 text-center min-w-[150px]">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {results.bandScores.reading > 0 ? results.bandScores.reading.toFixed(1) : '0.0'}
                </div>
                <div className="text-sm text-gray-600 mb-1">Band Score</div>
                <div className="text-sm font-medium text-gray-800">READING</div>
              </div>
            )}
            {/* Reading Card (fallback for detailedScores when bandScores.reading is not set) */}
            {(results.bandScores?.reading === undefined || results.bandScores?.reading === null) && 
             (results.detailedScores?.band || results.detailedScores?.reading) && (
              <div className="bg-white border border-gray-300 rounded-lg p-6 text-center min-w-[150px]">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {(results.detailedScores?.reading?.bandScore || results.detailedScores?.band || 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 mb-1">Band Score</div>
                <div className="text-sm font-medium text-gray-800">READING</div>
              </div>
            )}

            {/* Writing Card */}
            <div className="bg-white border border-gray-300 rounded-lg p-6 text-center min-w-[150px]">
              {results.bandScores?.writing !== undefined && results.bandScores.writing !== null && results.bandScores.writing > 0 ? (
                <>
                  <div className="text-4xl font-bold text-gray-900 mb-2">{results.bandScores.writing.toFixed(1)}</div>
                  <div className="text-sm text-gray-600 mb-1">Band Score</div>
                  <div className="text-sm font-medium text-gray-800">WRITING</div>
                </>
              ) : (
                <>
                  <div className="text-lg font-medium text-gray-400 mb-2">Pending</div>
                  <div className="text-sm text-gray-600 mb-1">Band Score</div>
                  <div className="text-sm font-medium text-gray-800">WRITING</div>
                </>
              )}
            </div>
          </div>

              {/* Review Link */}
              <div className="text-center">
                <button 
                  onClick={() => setActiveSubTab('question-wise')}
                  className="text-blue-600 hover:text-blue-800 flex items-center justify-center mx-auto"
                >
                  <span>Review</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}


          {/* Question-wise Review */}
          {activeSubTab === 'question-wise' && (
            <QuestionWiseResults
              testId={testId}
              questions={[
                ...(results.questionDetails?.reading || []).map(q => ({ ...q, moduleType: 'reading' as const, isCorrect: q.isCorrect ?? false })),
                ...(results.questionDetails?.listening || []).map(q => ({ ...q, moduleType: 'listening' as const, isCorrect: q.isCorrect ?? false })),
                ...(results.questionDetails?.writing || []).map(q => ({ ...q, moduleType: 'writing' as const, isCorrect: q.isCorrect ?? null }))
              ]}
              totalQuestions={
                (results.questionDetails?.reading?.length || 0) + 
                (results.questionDetails?.listening?.length || 0) +
                (results.questionDetails?.writing?.length || 0)
              }
            />
          )}

          {/* Writing Analysis */}
          {activeSubTab === 'writing' && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Writing Analysis</h3>
              <p className="text-gray-600">Detailed writing analysis will be available here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white">
        <div className="text-center py-8">
          <p className="text-lg font-bold text-gray-900">Radiance Education</p>
        </div>
      </div>
    </div>
  )
}
