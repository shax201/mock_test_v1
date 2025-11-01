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

export default function TestResultsAnalysis({ testId }: TestResultsAnalysisProps) {
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<TestResultsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [remedialTests, setRemedialTests] = useState<RemedialTest[]>([])
  const [remedialLoading, setRemedialLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'self-analysis' | 'remedial'>('self-analysis')
  const [activeSubTab, setActiveSubTab] = useState<'brief' | 'listening' | 'reading' | 'writing' | 'question-wise'>('brief')

  const fetchRemedialTests = async (mockTestId: string) => {
    try {
      setRemedialLoading(true)
      const response = await fetch(`/api/student/remedial-tests/by-mock-test/${mockTestId}`)
      
      if (response.ok) {
        const data = await response.json()
        setRemedialTests(data.remedialTests || [])
      } else {
        console.error('Failed to fetch remedial tests:', response.status)
      }
    } catch (error) {
      console.error('Error fetching remedial tests:', error)
    } finally {
      setRemedialLoading(false)
    }
  }

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/student/results/${testId}`)
        
        if (response.ok) {
          const data = await response.json()
          setResults(data.results)
          
          // Extract mock test ID from the results and fetch remedial tests
          if (data.results?.mockTestId) {
            fetchRemedialTests(data.results.mockTestId)
          }
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
  }, [testId])

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
              <button
                onClick={() => setActiveTab('self-analysis')}
                className={`pb-4 border-b-2 transition-colors ${
                  activeTab === 'self-analysis'
                    ? 'border-gray-400 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="text-lg font-medium">Self Analysis</div>
                <div className="text-sm text-gray-500">Know Where You Stand</div>
              </button>
              <button
                onClick={() => setActiveTab('remedial')}
                className={`pb-4 border-b-2 transition-colors relative ${
                  activeTab === 'remedial'
                    ? 'border-gray-400 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="text-lg font-medium flex items-center">
                  Remedial Tests
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">New</span>
                </div>
                <div className="text-sm text-gray-500">Improve Your Weak Areas</div>
              </button>
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
          {activeTab === 'self-analysis' && (
            <div className="flex space-x-8 mb-8 border-b border-gray-200">
              {[
                { key: 'brief', label: 'Brief' },
                { key: 'listening', label: 'Listening' },
                { key: 'reading', label: 'Reading' },
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
          )}

          {/* Content Area */}
          {activeTab === 'self-analysis' && activeSubTab === 'brief' && (
            <div className="text-center">
          {/* Band Score Cards */}
          <div className="flex justify-center space-x-8 mb-8">
            {/* Listening Card */}
            <div className="bg-white border border-gray-300 rounded-lg p-6 text-center min-w-[150px]">
              <div className="text-4xl font-bold text-gray-900 mb-2">{results.bandScores?.listening ?? 0}</div>
              <div className="text-sm text-gray-600 mb-1">Band Score</div>
              <div className="text-sm font-medium text-gray-800">LISTENING</div>
            </div>

            {/* Reading Card (optional) */}
            {results.detailedScores?.reading && (
              <div className="bg-white border border-gray-300 rounded-lg p-6 text-center min-w-[150px]">
                <div className="text-4xl font-bold text-gray-900 mb-2">{results.detailedScores.reading.bandScore}</div>
                <div className="text-sm text-gray-600 mb-1">Band Score</div>
                <div className="text-sm font-medium text-gray-800">READING</div>
              </div>
            )}

            {/* Writing Card (optional) */}
            {typeof results.bandScores?.writing === 'number' && (
              <div className="bg-white border border-gray-300 rounded-lg p-6 text-center min-w-[150px]">
                <div className="text-4xl font-bold text-gray-900 mb-2">{results.bandScores.writing}</div>
                <div className="text-sm text-gray-600 mb-1">Band Score</div>
                <div className="text-sm font-medium text-gray-800">WRITING</div>
              </div>
            )}
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

          {/* Reading Analysis */}
          {activeTab === 'self-analysis' && activeSubTab === 'reading' && results.detailedScores?.reading && (
            <div className="space-y-8">
              {/* Performance Overview */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Performance Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{results.detailedScores.reading.correctAnswers}</div>
                    <div className="text-sm font-medium text-blue-600">Correct Answers</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">{results.detailedScores.reading.totalQuestions}</div>
                    <div className="text-sm font-medium text-green-600">Total Questions</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{results.detailedScores.reading.accuracy}%</div>
                    <div className="text-sm font-medium text-purple-600">Accuracy</div>
                  </div>
                </div>
              </div>

              {/* Part-wise Performance */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Part-wise Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(results.detailedScores.reading.partScores).map(([part, data]: [string, any]) => (
                    <div key={part} className="bg-white rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900 capitalize">{part}</h4>
                        <span className={`text-lg font-bold px-3 py-1 rounded-full ${
                          data.bandScore >= 6 ? 'bg-green-100 text-green-800' :
                          data.bandScore >= 4 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {data.bandScore}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        {data.correct}/{data.total} correct
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${(data.correct / data.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question Type Performance */}
              {results.detailedScores.reading.questionTypeScores.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Question Type Performance</h3>
                  <div className="space-y-4">
                    {results.detailedScores.reading.questionTypeScores.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg">
                        <div className="flex-1">
                          <div className="text-lg font-medium text-gray-900">{item.type}</div>
                          <div className="text-sm text-gray-500">{item.correct}/{item.total} correct</div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="w-32 bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
                              style={{ width: `${item.accuracy}%` }}
                            ></div>
                          </div>
                          <div className="text-lg font-medium text-gray-900 w-16 text-right">
                            {item.accuracy}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Listening Analysis */}
          {activeTab === 'self-analysis' && activeSubTab === 'listening' && results.detailedScores?.listening && (
            <div className="space-y-8">
              {/* Performance Overview */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Performance Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{results.detailedScores.listening.correctAnswers}</div>
                    <div className="text-sm font-medium text-blue-600">Correct Answers</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">{results.detailedScores.listening.totalQuestions}</div>
                    <div className="text-sm font-medium text-green-600">Total Questions</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{results.detailedScores.listening.accuracy}%</div>
                    <div className="text-sm font-medium text-purple-600">Accuracy</div>
                  </div>
                </div>
              </div>

              {/* Part-wise Performance */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Part-wise Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(results.detailedScores.listening.partScores).map(([part, data]: [string, any]) => (
                    <div key={part} className="bg-white rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900 capitalize">{part}</h4>
                        <span className={`text-lg font-bold px-3 py-1 rounded-full ${
                          data.bandScore >= 6 ? 'bg-green-100 text-green-800' :
                          data.bandScore >= 4 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {data.bandScore}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        {data.correct}/{data.total} correct
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-green-600 h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${(data.correct / data.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question Type Performance */}
              {results.detailedScores.listening.questionTypeScores.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Question Type Performance</h3>
                  <div className="space-y-4">
                    {results.detailedScores.listening.questionTypeScores.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg">
                        <div className="flex-1">
                          <div className="text-lg font-medium text-gray-900">{item.type}</div>
                          <div className="text-sm text-gray-500">{item.correct}/{item.total} correct</div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="w-32 bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-green-600 h-3 rounded-full transition-all duration-1000"
                              style={{ width: `${item.accuracy}%` }}
                            ></div>
                          </div>
                          <div className="text-lg font-medium text-gray-900 w-16 text-right">
                            {item.accuracy}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Question-wise Review */}
          {activeTab === 'self-analysis' && activeSubTab === 'question-wise' && (
            <QuestionWiseResults
              testId={testId}
              questions={[
                ...(results.questionDetails?.reading || []).map(q => ({ ...q, moduleType: 'reading' as const })),
                ...(results.questionDetails?.listening || []).map(q => ({ ...q, moduleType: 'listening' as const }))
              ]}
              totalQuestions={(results.questionDetails?.reading?.length || 0) + (results.questionDetails?.listening?.length || 0)}
            />
          )}

          {/* Other Tab Content */}
          {activeTab === 'self-analysis' && activeSubTab !== 'brief' && activeSubTab !== 'reading' && activeSubTab !== 'listening' && activeSubTab !== 'question-wise' && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {activeSubTab.charAt(0).toUpperCase() + activeSubTab.slice(1)} Analysis
              </h3>
              <p className="text-gray-600">Detailed analysis for {activeSubTab} will be available here.</p>
            </div>
          )}

          {activeTab === 'remedial' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Personalized Remedial Tests</h3>
              <p className="text-gray-600 mb-6">Practice tests designed to help you improve your weak areas based on this mock test.</p>
              
              {remedialLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading remedial tests...</span>
                </div>
              ) : remedialTests.length > 0 ? (
                <div className="space-y-4">
                  {remedialTests.map((test) => (
                    <div key={test.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900 mb-2">{test.title}</h4>
                          <p className="text-sm text-gray-600 mb-3">{test.description}</p>
                          <div className="flex items-center space-x-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {test.module}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {test.difficulty}
                            </span>
                            <span className="text-sm text-gray-500">
                              {test.duration} minutes
                            </span>
                            <span className="text-sm text-gray-500">
                              {test.type.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch('/api/student/start-remedial-test-session', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({ remedialTestId: test.id }),
                                })

                                if (response.ok) {
                                  const data = await response.json()
                                  console.log("data",data);
                                  
                                  // Navigate to the appropriate module based on test type
                                  let modulePath = 'reading' // default
                                  if (data.module === 'MATCHING_HEADINGS' || test.type === 'MATCHING_HEADINGS') {
                                    modulePath = 'matching-headings'
                                  } else if (data.module === 'LISTENING') {
                                    modulePath = 'listening'
                                  } else if (data.module === 'WRITING') {
                                    modulePath = 'writing'
                                  }
                                  
                                  window.location.href = `/test/${data.token}/${modulePath}`
                                } else {
                                  const errorData = await response.json()
                                  alert('Failed to start remedial test. Please try again.')
                                }
                              } catch (error) {
                                console.error('Error starting remedial test:', error)
                                alert('Network error. Please try again.')
                              }
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
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
                    No remedial tests are currently linked to this mock test.
                  </p>
                </div>
              )}
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
