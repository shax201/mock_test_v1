'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface RemedialTest {
  id: string
  title: string
  description: string
  type: string
  module: string
  difficulty: string
  duration: number
  questions: Record<string, any>[]
  attempted?: boolean
  mockTest?: {
    id: string
    title: string
    description: string
  }
}

interface WeakAreas {
  reading: {
    matchingHeadings: number
    informationMatching: number
    multipleChoice: number
    trueFalse: number
  }
  listening: {
    multipleChoice: number
    notesCompletion: number
    summaryCompletion: number
  }
}

export default function RemedialTests() {
  const router = useRouter()
  const [remedialTests, setRemedialTests] = useState<RemedialTest[]>([])
  const [weakAreas, setWeakAreas] = useState<WeakAreas | null>(null)
  const [loading, setLoading] = useState(true)
  const [startingTest, setStartingTest] = useState<string | null>(null)

  useEffect(() => {
    fetchRemedialTests()
  }, [])

  const fetchRemedialTests = async () => {
    try {
      const response = await fetch('/api/student/remedial-tests')
      if (response.ok) {
        const data = await response.json()
        setRemedialTests(data.remedialTests || [])
        setWeakAreas(data.weakAreas)
      }
    } catch (error) {
      console.error('Error fetching remedial tests:', error)
    } finally {
      setLoading(false)
    }
  }

  const startRemedialTest = async (testId: string) => {
    setStartingTest(testId)
    try {
      const response = await fetch('/api/student/start-remedial-test-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ remedialTestId: testId }),
      })

      if (response.ok) {
        const data = await response.json()
        // Navigate to the appropriate module based on the remedial test type
        const testModule = data.module?.toLowerCase()
        if (testModule === 'listening') {
          router.push(`/test/${data.token}/listening`)
        } else if (testModule === 'reading') {
          router.push(`/test/${data.token}/reading`)
        } else if (testModule === 'writing') {
          router.push(`/test/${data.token}/writing`)
        } else if (testModule === 'speaking') {
          router.push(`/test/${data.token}/speaking`)
        } else {
          // Fallback to the main test page
          router.push(`/test/${data.token}`)
        }
      } else {
        const errorData = await response.json()
        console.error('Error starting remedial test:', errorData.error)
        alert('Failed to start remedial test. Please try again.')
      }
    } catch (error) {
      console.error('Error starting remedial test:', error)
      alert('Network error. Please try again.')
    } finally {
      setStartingTest(null)
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Remedial Tests</h1>
              <p className="text-gray-600">Personalized practice tests to improve your weak areas</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                New
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Weak Areas Analysis */}
      {weakAreas && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Your Weak Areas Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Reading Skills</h3>
                <div className="space-y-2">
                  {weakAreas.reading.matchingHeadings > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Matching Headings</span>
                      <span className="text-red-600 font-medium">{weakAreas.reading.matchingHeadings} errors</span>
                    </div>
                  )}
                  {weakAreas.reading.informationMatching > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Information Matching</span>
                      <span className="text-red-600 font-medium">{weakAreas.reading.informationMatching} errors</span>
                    </div>
                  )}
                  {weakAreas.reading.multipleChoice > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Multiple Choice</span>
                      <span className="text-red-600 font-medium">{weakAreas.reading.multipleChoice} errors</span>
                    </div>
                  )}
                  {weakAreas.reading.trueFalse > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">True/False/Not Given</span>
                      <span className="text-red-600 font-medium">{weakAreas.reading.trueFalse} errors</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Listening Skills</h3>
                <div className="space-y-2">
                  {weakAreas.listening.multipleChoice > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Multiple Choice</span>
                      <span className="text-red-600 font-medium">{weakAreas.listening.multipleChoice} errors</span>
                    </div>
                  )}
                  {weakAreas.listening.notesCompletion > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Notes Completion</span>
                      <span className="text-red-600 font-medium">{weakAreas.listening.notesCompletion} errors</span>
                    </div>
                  )}
                  {weakAreas.listening.summaryCompletion > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Summary Completion</span>
                      <span className="text-red-600 font-medium">{weakAreas.listening.summaryCompletion} errors</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remedial Tests */}
      {remedialTests.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Recommended Practice Tests</h2>
          {remedialTests.map((test) => (
            <div key={test.id} className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{test.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{test.description}</p>
                    <div className="flex items-center space-x-4 mt-3">
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
                        {test.questions.length} questions
                      </span>
                      {test.attempted && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Attempted
                        </span>
                      )}
                      {test.mockTest && (
                        <span className="text-sm text-blue-600">
                          <strong>Related to:</strong> {test.mockTest.title}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    {test.attempted ? (
                      <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-600 bg-gray-100 cursor-not-allowed">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Attempted
                      </div>
                    ) : (
                      <button
                        onClick={() => startRemedialTest(test.id)}
                        disabled={startingTest === test.id}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {startingTest === test.id ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Starting...
                          </>
                        ) : (
                          'Take Test'
                        )}
                      </button>
                    )}
                  </div>
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
        </div>
      )}
    </div>
  )
}
